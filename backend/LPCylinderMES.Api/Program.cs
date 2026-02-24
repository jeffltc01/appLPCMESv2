using LPCylinderMES.Api.Data;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using Microsoft.Data.SqlClient;

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("LPCApps")
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

builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddOpenApi();

builder.Services.AddDbContext<LpcAppsDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.AddCors(options =>
{
    options.AddPolicy("DevCors", policy =>
        policy.WithOrigins("http://localhost:5510")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
    app.UseCors("DevCors");
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();
