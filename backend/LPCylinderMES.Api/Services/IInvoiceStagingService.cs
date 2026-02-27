using LPCylinderMES.Api.Models;

namespace LPCylinderMES.Api.Services;

public interface IInvoiceStagingService
{
    Task<InvoiceStagingSubmissionResult> SubmitToStagingAsync(
        SalesOrder order,
        string correlationId,
        string? submittedByEmpNo,
        CancellationToken cancellationToken = default);
}

public sealed record InvoiceStagingSubmissionResult(
    bool IsSuccessHandoff,
    string StagingResult,
    string? ErpInvoiceReference,
    string? ErrorMessage);
