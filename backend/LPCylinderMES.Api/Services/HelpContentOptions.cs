namespace LPCylinderMES.Api.Services;

public sealed class HelpContentOptions
{
    public string SourceType { get; set; } = "File";

    // Relative to backend content root by default.
    public string BasePath { get; set; } = "..\\..\\frontend\\src\\help\\topics";

    public bool EnableSchemaValidation { get; set; } = true;
}
