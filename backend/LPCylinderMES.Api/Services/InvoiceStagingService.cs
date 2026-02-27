using System.Data;
using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.Models;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace LPCylinderMES.Api.Services;

public sealed class InvoiceStagingService(
    LpcAppsDbContext db,
    IConfiguration configuration,
    ILogger<InvoiceStagingService> logger) : IInvoiceStagingService
{
    public async Task<InvoiceStagingSubmissionResult> SubmitToStagingAsync(
        SalesOrder order,
        string correlationId,
        string? submittedByEmpNo,
        CancellationToken cancellationToken = default)
    {
        var mode = (configuration["InvoiceStaging:Mode"] ?? "MockSuccess").Trim();
        if (string.Equals(mode, "MockSuccess", StringComparison.OrdinalIgnoreCase))
        {
            return new InvoiceStagingSubmissionResult(
                true,
                "PendingAck",
                null,
                null);
        }

        if (string.Equals(mode, "MockFailure", StringComparison.OrdinalIgnoreCase))
        {
            return new InvoiceStagingSubmissionResult(
                false,
                "Failed",
                null,
                "Invoice staging is configured to simulate failure.");
        }

        if (!string.Equals(mode, "StoredProcedure", StringComparison.OrdinalIgnoreCase))
        {
            return new InvoiceStagingSubmissionResult(
                false,
                "Failed",
                null,
                $"Unsupported InvoiceStaging:Mode '{mode}'.");
        }

        var storedProcedure = configuration["InvoiceStaging:SubmitStoredProcedure"];
        if (string.IsNullOrWhiteSpace(storedProcedure))
        {
            return new InvoiceStagingSubmissionResult(
                false,
                "Failed",
                null,
                "InvoiceStaging:SubmitStoredProcedure is not configured.");
        }

        try
        {
            await using var command = db.Database.GetDbConnection().CreateCommand();
            command.CommandType = CommandType.StoredProcedure;
            command.CommandText = storedProcedure.Trim();
            command.CommandTimeout = int.TryParse(configuration["InvoiceStaging:CommandTimeoutSeconds"], out var timeoutSeconds)
                ? timeoutSeconds
                : 30;

            command.Parameters.Add(new SqlParameter("@SalesOrderId", SqlDbType.Int) { Value = order.Id });
            command.Parameters.Add(new SqlParameter("@SalesOrderNo", SqlDbType.VarChar, 100) { Value = order.SalesOrderNo });
            command.Parameters.Add(new SqlParameter("@CorrelationId", SqlDbType.VarChar, 120) { Value = correlationId });
            command.Parameters.Add(new SqlParameter("@SubmittedByEmpNo", SqlDbType.VarChar, 30)
            {
                Value = string.IsNullOrWhiteSpace(submittedByEmpNo) ? DBNull.Value : submittedByEmpNo.Trim(),
            });

            var stagingResult = new SqlParameter("@StagingResult", SqlDbType.VarChar, 20) { Direction = ParameterDirection.Output };
            var erpReference = new SqlParameter("@ErpInvoiceReference", SqlDbType.VarChar, 80) { Direction = ParameterDirection.Output };
            var errorMessage = new SqlParameter("@ErrorMessage", SqlDbType.VarChar, 500) { Direction = ParameterDirection.Output };

            command.Parameters.Add(stagingResult);
            command.Parameters.Add(erpReference);
            command.Parameters.Add(errorMessage);

            if (command.Connection is null)
            {
                return new InvoiceStagingSubmissionResult(false, "Failed", null, "Invoice staging connection was not available.");
            }

            if (command.Connection.State != ConnectionState.Open)
            {
                await command.Connection.OpenAsync(cancellationToken);
            }

            await command.ExecuteNonQueryAsync(cancellationToken);
            var resultValue = (stagingResult.Value?.ToString() ?? "Failed").Trim();
            var errorValue = errorMessage.Value?.ToString();
            var erpReferenceValue = erpReference.Value?.ToString();
            var isSuccess = string.Equals(resultValue, "Success", StringComparison.OrdinalIgnoreCase) ||
                            string.Equals(resultValue, "PendingAck", StringComparison.OrdinalIgnoreCase);
            return new InvoiceStagingSubmissionResult(
                isSuccess,
                isSuccess && string.IsNullOrWhiteSpace(resultValue) ? "PendingAck" : resultValue,
                string.IsNullOrWhiteSpace(erpReferenceValue) ? null : erpReferenceValue.Trim(),
                string.IsNullOrWhiteSpace(errorValue) ? null : errorValue.Trim());
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Invoice staging submission failed for order {OrderId} correlation {CorrelationId}.", order.Id, correlationId);
            return new InvoiceStagingSubmissionResult(false, "Failed", null, ex.Message);
        }
    }
}
