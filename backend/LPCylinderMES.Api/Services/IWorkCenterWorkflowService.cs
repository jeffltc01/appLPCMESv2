using LPCylinderMES.Api.DTOs;

namespace LPCylinderMES.Api.Services;

public interface IWorkCenterWorkflowService
{
    Task<OrderRouteExecutionDto> ScanInAsync(int orderId, int lineId, long stepId, OperatorScanInDto dto, CancellationToken cancellationToken = default);
    Task<OrderRouteExecutionDto> ScanOutAsync(int orderId, int lineId, long stepId, OperatorScanOutDto dto, CancellationToken cancellationToken = default);
    Task<OrderRouteExecutionDto> RecordProgressAsync(int orderId, int lineId, long stepId, RecordStepProgressDto dto, CancellationToken cancellationToken = default);
    Task<OrderRouteExecutionDto> AddUsageAsync(int orderId, int lineId, long stepId, StepMaterialUsageCreateDto dto, CancellationToken cancellationToken = default);
    Task<OrderRouteExecutionDto> UpdateUsageAsync(int orderId, int lineId, long stepId, long usageId, StepMaterialUsageUpdateDto dto, CancellationToken cancellationToken = default);
    Task<OrderRouteExecutionDto> DeleteUsageAsync(int orderId, int lineId, long stepId, long usageId, DeleteStepMaterialUsageDto dto, CancellationToken cancellationToken = default);
    Task<List<StepMaterialUsageDto>> GetStepUsageAsync(int orderId, int lineId, long stepId, CancellationToken cancellationToken = default);
    Task<OrderRouteExecutionDto> AddScrapAsync(int orderId, int lineId, long stepId, StepScrapEntryCreateDto dto, CancellationToken cancellationToken = default);
    Task<OrderRouteExecutionDto> AddSerialAsync(int orderId, int lineId, long stepId, StepSerialCaptureCreateDto dto, CancellationToken cancellationToken = default);
    Task<OrderRouteExecutionDto> AddChecklistAsync(int orderId, int lineId, long stepId, StepChecklistResultCreateDto dto, CancellationToken cancellationToken = default);
    Task<OrderRouteExecutionDto> CorrectDurationAsync(int orderId, int lineId, long stepId, CorrectStepDurationDto dto, CancellationToken cancellationToken = default);
    Task<OrderRouteExecutionDto> CaptureTrailerAsync(int orderId, int lineId, long stepId, CaptureTrailerDto dto, CancellationToken cancellationToken = default);
    Task<OrderRouteExecutionDto> VerifySerialLoadAsync(int orderId, int lineId, long stepId, VerifySerialLoadDto dto, CancellationToken cancellationToken = default);
    Task<OrderRouteExecutionDto> GeneratePackingSlipAsync(int orderId, int lineId, long stepId, GenerateStepDocumentDto dto, CancellationToken cancellationToken = default);
    Task<OrderRouteExecutionDto> GenerateBolAsync(int orderId, int lineId, long stepId, GenerateStepDocumentDto dto, CancellationToken cancellationToken = default);
    Task<OrderRouteExecutionDto> CompleteStepAsync(int orderId, int lineId, long stepId, CompleteWorkCenterStepDto dto, CancellationToken cancellationToken = default);
    Task<List<WorkCenterQueueItemDto>> GetQueueAsync(int workCenterId, CancellationToken cancellationToken = default);
    Task<OrderRouteExecutionDto> GetOrderRouteExecutionAsync(int orderId, int? lineId = null, CancellationToken cancellationToken = default);
    Task<List<OperatorActivityLogDto>> GetOrderActivityLogAsync(int orderId, CancellationToken cancellationToken = default);

    Task<OrderRouteExecutionDto> ValidateRouteAsync(int orderId, SupervisorRouteReviewDto dto, CancellationToken cancellationToken = default);
    Task<OrderRouteExecutionDto> AdjustRouteAsync(int orderId, SupervisorRouteReviewDto dto, CancellationToken cancellationToken = default);
    Task<OrderRouteExecutionDto> ReopenRouteAsync(int orderId, SupervisorRouteReviewDto dto, CancellationToken cancellationToken = default);
    Task<OrderRouteExecutionDto> ApproveOrderAsync(int orderId, SupervisorDecisionDto dto, CancellationToken cancellationToken = default);
    Task<OrderRouteExecutionDto> RejectOrderAsync(int orderId, SupervisorDecisionDto dto, CancellationToken cancellationToken = default);

    Task<OrderRouteExecutionDto> RequestReworkAsync(int orderId, int lineId, long stepId, ReworkRequestDto dto, CancellationToken cancellationToken = default);
    Task<OrderRouteExecutionDto> ApproveReworkAsync(int orderId, int lineId, long stepId, ReworkStateChangeDto dto, CancellationToken cancellationToken = default);
    Task<OrderRouteExecutionDto> StartReworkAsync(int orderId, int lineId, long stepId, ReworkStateChangeDto dto, CancellationToken cancellationToken = default);
    Task<OrderRouteExecutionDto> SubmitReworkVerificationAsync(int orderId, int lineId, long stepId, ReworkStateChangeDto dto, CancellationToken cancellationToken = default);
    Task<OrderRouteExecutionDto> CloseReworkAsync(int orderId, int lineId, long stepId, ReworkStateChangeDto dto, CancellationToken cancellationToken = default);
    Task<OrderRouteExecutionDto> CancelReworkAsync(int orderId, int lineId, long stepId, ReworkStateChangeDto dto, CancellationToken cancellationToken = default);
    Task<OrderRouteExecutionDto> ScrapReworkAsync(int orderId, int lineId, long stepId, ReworkStateChangeDto dto, CancellationToken cancellationToken = default);
}
