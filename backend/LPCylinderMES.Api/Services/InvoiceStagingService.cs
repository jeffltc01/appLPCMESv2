using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Services;

public sealed class InvoiceStagingService(
    LpcAppsDbContext db,
    IConfiguration configuration,
    ILogger<InvoiceStagingService> logger,
    IHttpClientFactory? httpClientFactory = null) : IInvoiceStagingService
{
    public async Task<InvoiceStagingSubmissionResult> SubmitToStagingAsync(
        SalesOrder order,
        string correlationId,
        string? submittedByEmpNo,
        CancellationToken cancellationToken = default)
    {
        _ = submittedByEmpNo;
        return await SubmitToPowerAutomateAsync(order.Id, correlationId, cancellationToken);
    }

    private async Task<InvoiceStagingSubmissionResult> SubmitToPowerAutomateAsync(
        int orderId,
        string correlationId,
        CancellationToken cancellationToken)
    {
        var endpoint = configuration["InvoiceStaging:PowerAutomateUrl"];
        if (string.IsNullOrWhiteSpace(endpoint))
        {
            return new InvoiceStagingSubmissionResult(false, "Failed", null, "InvoiceStaging:PowerAutomateUrl is not configured.");
        }

        try
        {
            var order = await db.SalesOrders
                .AsNoTracking()
                .Include(o => o.Site)
                .Include(o => o.Customer)
                .Include(o => o.BillToAddress)
                .Include(o => o.ShipToAddress)
                .Include(o => o.ShipToVia)
                .Include(o => o.PaymentTerm)
                .Include(o => o.SalesPerson)
                .Include(o => o.SalesOrderDetails)
                    .ThenInclude(d => d.Item)
                .Include(o => o.SalesOrderDetails)
                    .ThenInclude(d => d.SalesOrderDetailSns)
                .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);

            if (order is null)
            {
                return new InvoiceStagingSubmissionResult(false, "Failed", null, "Order not found while preparing invoice payload.");
            }

            var itemNos = order.SalesOrderDetails
                .Select(d => d.Item.ItemNo)
                .Where(itemNo => !string.IsNullOrWhiteSpace(itemNo))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            var crossRefMap = await db.PartCrossReferences
                .AsNoTracking()
                .Where(cr => itemNos.Contains(cr.LpcItemNumber))
                .GroupBy(cr => cr.LpcItemNumber)
                .Select(g => g.First())
                .ToDictionaryAsync(cr => cr.LpcItemNumber, cr => cr.ErpItemNumber, StringComparer.OrdinalIgnoreCase, cancellationToken);

            var ipadNo = order.IpadOrderId?.ToString() ?? string.Empty;
            var salesOrderNo = order.SalesOrderNo.Trim();
            var orderIdValue = string.IsNullOrWhiteSpace(ipadNo) ? salesOrderNo : $"{salesOrderNo}-{ipadNo}";
            var payload = BuildPowerAutomatePayload(order, salesOrderNo, ipadNo, orderIdValue, crossRefMap);

            var client = httpClientFactory?.CreateClient(nameof(InvoiceStagingService)) ?? new HttpClient();
            var timeoutSeconds = int.TryParse(configuration["InvoiceStaging:CommandTimeoutSeconds"], out var configuredTimeoutSeconds)
                ? configuredTimeoutSeconds
                : 30;
            client.Timeout = TimeSpan.FromSeconds(timeoutSeconds);

            using var response = await client.PostAsJsonAsync(endpoint.Trim(), payload, cancellationToken);
            if (response.StatusCode is HttpStatusCode.OK or HttpStatusCode.Accepted)
            {
                return new InvoiceStagingSubmissionResult(true, "PendingAck", null, null);
            }

            var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
            var error = string.IsNullOrWhiteSpace(errorBody)
                ? $"Power Automate call failed with status {(int)response.StatusCode} ({response.ReasonPhrase})."
                : $"Power Automate call failed with status {(int)response.StatusCode} ({response.ReasonPhrase}). Body: {errorBody}";
            return new InvoiceStagingSubmissionResult(false, "Failed", null, error);
        }
        catch (Exception ex)
        {
            logger.LogError(
                ex,
                "Power Automate invoice submission failed for order {OrderId} correlation {CorrelationId}.",
                orderId,
                correlationId);
            return new InvoiceStagingSubmissionResult(false, "Failed", null, ex.Message);
        }
    }

    private static PowerAutomateInvoicePayload BuildPowerAutomatePayload(
        SalesOrder order,
        string salesOrderNo,
        string ipadNo,
        string orderId,
        IReadOnlyDictionary<string, string> crossRefMap)
    {
        var invoiceJson = new InvoiceJsonPayload(
            salesorderno: salesOrderNo,
            ipadno: ipadNo,
            invoicedate: FormatDate(order.InvoiceDate),
            orderdate: order.OrderDate.ToString("yyyyMMdd"),
            customerno: order.Customer.CustomerCode ?? string.Empty,
            billtoname: order.BillToAddress?.AddressName ?? order.Customer.Name,
            billToaddress1: order.BillToAddress?.Address1 ?? string.Empty,
            billToaddress2: order.BillToAddress?.Address2 ?? string.Empty,
            billtocity: order.BillToAddress?.City ?? string.Empty,
            billtostate: order.BillToAddress?.State ?? string.Empty,
            billtozipcode: order.BillToAddress?.PostalCode ?? string.Empty,
            billtocountrycode: order.BillToAddress?.Country ?? string.Empty,
            shiptocode: string.Empty,
            shiptoname: order.ShipToAddress?.AddressName ?? string.Empty,
            shiptoaddress1: order.ShipToAddress?.Address1 ?? string.Empty,
            shiptoaddress2: order.ShipToAddress?.Address2 ?? string.Empty,
            shiptocity: order.ShipToAddress?.City ?? string.Empty,
            shiptostate: order.ShipToAddress?.State ?? string.Empty,
            shiptozipcode: order.ShipToAddress?.PostalCode ?? string.Empty,
            shiptocountrycode: order.ShipToAddress?.Country ?? string.Empty,
            shipdate: FormatDate(order.DispatchDate ?? order.ReadyToShipDate ?? order.InvoiceDate),
            shipvia: order.ShipToVia?.ErpCode ?? order.ShipToVia?.Name ?? string.Empty,
            customerpono: order.CustomerPoNo ?? string.Empty,
            fob: string.Empty,
            warehousecode: "LPC",
            confirmto: order.Contact ?? string.Empty,
            comment: order.Comments ?? string.Empty,
            termscode: order.PaymentTerm?.TermsCode ?? string.Empty,
            salespersonno: order.SalesPerson?.ErpNo ?? string.Empty,
            freightamount: order.FreightAmount ?? 0m,
            emailaddress: order.Customer.Email ?? string.Empty,
            lines: order.SalesOrderDetails
                .OrderBy(line => line.LineNo)
                .Select(line =>
                {
                    var itemNo = line.Item.ItemNo;
                    var mappedItemCode = crossRefMap.TryGetValue(itemNo, out var erpItemNo) ? erpItemNo : itemNo;
                    var includeSerials = itemNo.StartsWith("6", StringComparison.Ordinal);
                    var serials = includeSerials
                        ? line.SalesOrderDetailSns
                            .Where(sn => !string.IsNullOrWhiteSpace(sn.SerialNumber))
                            .Select(sn => new InvoiceLineSerialPayload(sn.SerialNumber.Trim()))
                            .ToList()
                        : [];
                    return new InvoiceLinePayload(
                        linekey: line.LineNo.ToString("0.##"),
                        itemcode: mappedItemCode,
                        itemtype: line.Item.ItemType,
                        itemcodedesc: line.Item.ItemDescription ?? line.Item.ItemNo,
                        warehousecode: "LPC",
                        productline: line.Item.ProductLine ?? string.Empty,
                        unitofmeasure: "Each",
                        revision: string.Empty,
                        comments: line.Notes ?? string.Empty,
                        quantityordered: line.QuantityAsOrdered,
                        quantityshipped: line.QuantityAsShipped ?? line.QuantityAsOrdered,
                        unitprice: line.UnitPrice ?? 0m,
                        extensionamt: line.Extension ?? 0m,
                        serialnumbers: serials.Count == 0 ? null : serials);
                })
                .ToList());

        return new PowerAutomateInvoicePayload("LPC", orderId, invoiceJson);
    }

    private static string FormatDate(DateTime? value)
    {
        var effective = value ?? DateTime.UtcNow;
        return effective.ToString("yyyyMMdd");
    }

    private sealed record PowerAutomateInvoicePayload(
        [property: JsonPropertyName("SiteCode")] string SiteCode,
        [property: JsonPropertyName("OrderId")] string OrderId,
        [property: JsonPropertyName("InvoiceJSON")] InvoiceJsonPayload InvoiceJson);

    private sealed record InvoiceJsonPayload(
        [property: JsonPropertyName("salesorderno")] string salesorderno,
        [property: JsonPropertyName("ipadno")] string ipadno,
        [property: JsonPropertyName("invoicedate")] string invoicedate,
        [property: JsonPropertyName("orderdate")] string orderdate,
        [property: JsonPropertyName("customerno")] string customerno,
        [property: JsonPropertyName("billtoname")] string billtoname,
        [property: JsonPropertyName("billToaddress1")] string billToaddress1,
        [property: JsonPropertyName("billToaddress2")] string billToaddress2,
        [property: JsonPropertyName("billtocity")] string billtocity,
        [property: JsonPropertyName("billtostate")] string billtostate,
        [property: JsonPropertyName("billtozipcode")] string billtozipcode,
        [property: JsonPropertyName("billtocountrycode")] string billtocountrycode,
        [property: JsonPropertyName("shiptocode")] string shiptocode,
        [property: JsonPropertyName("shiptoname")] string shiptoname,
        [property: JsonPropertyName("shiptoaddress1")] string shiptoaddress1,
        [property: JsonPropertyName("shiptoaddress2")] string shiptoaddress2,
        [property: JsonPropertyName("shiptocity")] string shiptocity,
        [property: JsonPropertyName("shiptostate")] string shiptostate,
        [property: JsonPropertyName("shiptozipcode")] string shiptozipcode,
        [property: JsonPropertyName("shiptocountrycode")] string shiptocountrycode,
        [property: JsonPropertyName("shipdate")] string shipdate,
        [property: JsonPropertyName("shipvia")] string shipvia,
        [property: JsonPropertyName("customerpono")] string customerpono,
        [property: JsonPropertyName("fob")] string fob,
        [property: JsonPropertyName("warehousecode")] string warehousecode,
        [property: JsonPropertyName("confirmto")] string confirmto,
        [property: JsonPropertyName("comment")] string comment,
        [property: JsonPropertyName("termscode")] string termscode,
        [property: JsonPropertyName("salespersonno")] string salespersonno,
        [property: JsonPropertyName("freightamount")] decimal freightamount,
        [property: JsonPropertyName("emailaddress")] string emailaddress,
        [property: JsonPropertyName("lines")] List<InvoiceLinePayload> lines);

    private sealed record InvoiceLinePayload(
        [property: JsonPropertyName("linekey")] string linekey,
        [property: JsonPropertyName("itemcode")] string itemcode,
        [property: JsonPropertyName("itemtype")] string itemtype,
        [property: JsonPropertyName("itemcodedesc")] string itemcodedesc,
        [property: JsonPropertyName("warehousecode")] string warehousecode,
        [property: JsonPropertyName("productline")] string productline,
        [property: JsonPropertyName("unitofmeasure")] string unitofmeasure,
        [property: JsonPropertyName("revision")] string revision,
        [property: JsonPropertyName("comments")] string comments,
        [property: JsonPropertyName("quantityordered")] decimal quantityordered,
        [property: JsonPropertyName("quantityshipped")] decimal quantityshipped,
        [property: JsonPropertyName("unitprice")] decimal unitprice,
        [property: JsonPropertyName("extensionamt")] decimal extensionamt,
        [property: JsonPropertyName("serialnumbers")] List<InvoiceLineSerialPayload>? serialnumbers);

    private sealed record InvoiceLineSerialPayload(
        [property: JsonPropertyName("serialno")] string serialno);
}
