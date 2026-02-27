namespace LPCylinderMES.Api.Services;

public static class OrderPolicyKeys
{
    public const string HoldReleaseAuthorityRole = "HoldReleaseAuthorityRole";
    public const string AllowCustomerDropoffTransitWithAppointment = "AllowCustomerDropoffTransitWithAppointment";
    public const string RequireOutboundPlannedForCustomerPickup = "RequireOutboundPlannedForCustomerPickup";
    public const string AttachmentEmailPolicy = "AttachmentEmailPolicy";
    public const string AttachmentEmailRequiredCustomerIdsCsv = "AttachmentEmailRequiredCustomerIdsCsv";
    public const string MissingDeliveryEvidenceBehavior = "MissingDeliveryEvidenceBehavior";
    public const string RequiredAttachmentCategoriesCsv = "RequiredAttachmentCategoriesCsv";
    public const string ReworkRevertTargetStatus = "ReworkRevertTargetStatus";
    public const string PromiseReasonTaxonomyOwnerRole = "PromiseReasonTaxonomyOwnerRole";

    public static readonly string[] RequiredFunctionsForActivation =
    {
        "Office",
        "Transportation",
        "Receiving",
        "Production",
        "Quality",
        "Accounting",
    };
}
