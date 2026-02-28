using LPCylinderMES.Api.Data;
using LPCylinderMES.Api.Services;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using Microsoft.Data.SqlClient;
using QuestPDF.Infrastructure;

var builder = WebApplication.CreateBuilder(args);
QuestPDF.Settings.License = LicenseType.Community;
var useInMemoryDatabase = builder.Configuration.GetValue<bool>("Testing:UseInMemoryDatabase");
string? connectionString = null;
if (!useInMemoryDatabase)
{
    connectionString = builder.Configuration.GetConnectionString("LPCApps")
        ?? throw new InvalidOperationException("Missing connection string: LPCApps");

    if (builder.Environment.IsDevelopment())
    {
        var csb = new SqlConnectionStringBuilder(connectionString);
        var dataSource = csb.DataSource ?? string.Empty;
        var isLocalHost = dataSource.StartsWith("localhost", StringComparison.OrdinalIgnoreCase)
            || dataSource.StartsWith("(local)", StringComparison.OrdinalIgnoreCase)
            || dataSource.StartsWith(".", StringComparison.OrdinalIgnoreCase)
            || dataSource.StartsWith("127.0.0.1", StringComparison.OrdinalIgnoreCase)
            || dataSource.StartsWith("::1", StringComparison.OrdinalIgnoreCase)
            || dataSource.StartsWith(@"DadGaming01", StringComparison.OrdinalIgnoreCase);

        if (!isLocalHost)
        {
            throw new InvalidOperationException(
                $"Unsafe Development database host '{dataSource}'. " +
                "Development must use a local SQL Server instance.");
        }
    }
}

builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddOpenApi();

if (useInMemoryDatabase)
{
    var inMemoryDatabaseName = builder.Configuration["Testing:InMemoryDatabaseName"];
    if (string.IsNullOrWhiteSpace(inMemoryDatabaseName))
    {
        inMemoryDatabaseName = "LpcAppsInMemory";
    }

    builder.Services.AddDbContext<LpcAppsDbContext>(options =>
        options.UseInMemoryDatabase(inMemoryDatabaseName));
}
else
{
    builder.Services.AddDbContext<LpcAppsDbContext>(options =>
        options.UseSqlServer(connectionString));
}
builder.Services.AddSingleton<IAttachmentStorage, AzureBlobAttachmentStorage>();
builder.Services.AddScoped<IOrderQueryService, OrderQueryService>();
builder.Services.AddScoped<IOrderKpiService, OrderKpiService>();
builder.Services.AddScoped<IOrderWorkflowService, OrderWorkflowService>();
builder.Services.AddScoped<IInvoiceStagingService, InvoiceStagingService>();
builder.Services.AddHttpClient(nameof(InvoiceStagingService));
builder.Services.AddSingleton<IInvoiceStagingAccessTokenProvider, InvoiceStagingAccessTokenProvider>();
builder.Services.AddHttpClient(nameof(InvoiceStagingAccessTokenProvider));
builder.Services.AddScoped<IReceivingService, ReceivingService>();
builder.Services.AddScoped<IProductionService, ProductionService>();
builder.Services.AddScoped<IOrderAttachmentService, OrderAttachmentService>();
builder.Services.AddScoped<IOrderLineService, OrderLineService>();
builder.Services.AddScoped<IWorkCenterWorkflowService, WorkCenterWorkflowService>();
builder.Services.AddScoped<ISetupRoutingService, SetupRoutingService>();
builder.Services.AddScoped<IOrderPolicyService, OrderPolicyService>();
builder.Services.AddScoped<IRolePermissionService, RolePermissionService>();
builder.Services.Configure<MicrosoftAuthOptions>(builder.Configuration.GetSection("MicrosoftAuth"));
builder.Services.AddSingleton<IMicrosoftTokenValidator, MicrosoftTokenValidator>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IOrderAuditContextAccessor, OrderAuditContextAccessor>();
builder.Services.Configure<HelpContentOptions>(builder.Configuration.GetSection("HelpContent"));
builder.Services.AddSingleton<IHelpContentService, HelpContentService>();

var allowedCorsOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>()?
    .Where(origin => !string.IsNullOrWhiteSpace(origin))
    .Select(origin => origin.Trim())
    .Distinct(StringComparer.OrdinalIgnoreCase)
    .ToArray()
    ?? [];

if (allowedCorsOrigins.Length > 0)
{
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("ConfiguredCors", policy =>
            policy.WithOrigins(allowedCorsOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod());
    });
}

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<LpcAppsDbContext>();
    if (dbContext.Database.IsRelational())
    {
        dbContext.Database.Migrate();
    }
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

if (allowedCorsOrigins.Length > 0)
{
    app.UseCors("ConfiguredCors");
}

app.UseHttpsRedirection();
app.UseMiddleware<OrderAuditContextMiddleware>();
app.UseAuthorization();
app.MapControllers();

app.Run();

public partial class Program;
