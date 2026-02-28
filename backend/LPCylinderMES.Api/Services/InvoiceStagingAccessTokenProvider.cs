using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Azure.Core;
using Azure.Identity;

namespace LPCylinderMES.Api.Services;

public sealed class InvoiceStagingAccessTokenProvider(
    IConfiguration configuration,
    IHttpClientFactory httpClientFactory,
    ILogger<InvoiceStagingAccessTokenProvider> logger) : IInvoiceStagingAccessTokenProvider
{
    private const string AutoMode = "Auto";
    private const string ClientSecretMode = "ClientSecret";
    private const string AzureCliMode = "AzureCli";
    private const string ManagedIdentityMode = "ManagedIdentity";
    private const string DefaultAzureCredentialMode = "DefaultAzureCredential";
    private static readonly TimeSpan RefreshSkew = TimeSpan.FromMinutes(5);
    private readonly SemaphoreSlim _tokenLock = new(1, 1);
    private string? _accessToken;
    private DateTimeOffset _expiresUtc;

    public async Task<string?> GetAccessTokenAsync(CancellationToken cancellationToken = default)
    {
        var authEnabled = configuration.GetValue<bool>("InvoiceStaging:Auth:Enabled");
        if (!authEnabled)
        {
            return null;
        }

        if (HasValidCachedToken())
        {
            return _accessToken;
        }

        await _tokenLock.WaitAsync(cancellationToken);
        try
        {
            if (HasValidCachedToken())
            {
                return _accessToken;
            }

            var mode = configuration["InvoiceStaging:Auth:Mode"]?.Trim();
            if (string.IsNullOrWhiteSpace(mode))
            {
                mode = AutoMode;
            }

            switch (mode)
            {
                case AutoMode:
                    if (IsRunningInAzureAppService())
                    {
                        if (await TryAcquireManagedIdentityTokenAsync(cancellationToken))
                        {
                            break;
                        }

                        if (await TryAcquireAzureCliTokenAsync(cancellationToken))
                        {
                            break;
                        }
                    }
                    else
                    {
                        if (await TryAcquireAzureCliTokenAsync(cancellationToken))
                        {
                            break;
                        }

                        if (await TryAcquireManagedIdentityTokenAsync(cancellationToken))
                        {
                            break;
                        }
                    }

                    await AcquireClientSecretTokenAsync(cancellationToken);
                    break;
                case ClientSecretMode:
                    await AcquireClientSecretTokenAsync(cancellationToken);
                    break;
                case AzureCliMode:
                    await AcquireAzureCliTokenAsync(cancellationToken);
                    break;
                case ManagedIdentityMode:
                    await AcquireManagedIdentityTokenAsync(cancellationToken);
                    break;
                case DefaultAzureCredentialMode:
                    await AcquireDefaultAzureCredentialTokenAsync(cancellationToken);
                    break;
                default:
                    throw new InvalidOperationException(
                        $"Invalid InvoiceStaging auth mode '{mode}'. Supported modes: {AutoMode}, {ManagedIdentityMode}, {AzureCliMode}, {ClientSecretMode}, {DefaultAzureCredentialMode}.");
            }

            logger.LogInformation(
                "Acquired InvoiceStaging access token. ExpiresUtc={ExpiresUtc:o}",
                _expiresUtc);
            return _accessToken;
        }
        finally
        {
            _tokenLock.Release();
        }
    }

    private bool HasValidCachedToken()
    {
        if (string.IsNullOrWhiteSpace(_accessToken))
        {
            return false;
        }

        return _expiresUtc > DateTimeOffset.UtcNow.Add(RefreshSkew);
    }

    private string RequireConfig(string key)
    {
        var value = configuration[key];
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException(
                $"Invoice staging OAuth is enabled but missing required setting '{key}'.");
        }

        return value.Trim();
    }

    private async Task AcquireClientSecretTokenAsync(CancellationToken cancellationToken)
    {
        var tenantId = RequireConfig("InvoiceStaging:Auth:TenantId");
        var clientId = RequireConfig("InvoiceStaging:Auth:ClientId");
        var clientSecret = RequireConfig("InvoiceStaging:Auth:ClientSecret");
        var scope = RequireConfig("InvoiceStaging:Auth:Scope");
        var authorityHost = configuration["InvoiceStaging:Auth:AuthorityHost"]?.Trim().TrimEnd('/')
            ?? "https://login.microsoftonline.com";
        var tokenEndpoint = $"{authorityHost}/{tenantId}/oauth2/v2.0/token";

        var form = new Dictionary<string, string>
        {
            ["grant_type"] = "client_credentials",
            ["client_id"] = clientId,
            ["client_secret"] = clientSecret,
            ["scope"] = scope,
        };

        var client = httpClientFactory.CreateClient(nameof(InvoiceStagingAccessTokenProvider));
        using var response = await client.PostAsync(
            tokenEndpoint,
            new FormUrlEncodedContent(form),
            cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new InvalidOperationException(
                $"Failed to acquire InvoiceStaging access token. Status {(int)response.StatusCode} ({response.ReasonPhrase}). Body: {errorBody}");
        }

        var tokenResponse = await response.Content.ReadFromJsonAsync<TokenResponse>(cancellationToken: cancellationToken);
        if (tokenResponse is null || string.IsNullOrWhiteSpace(tokenResponse.AccessToken))
        {
            throw new InvalidOperationException("Token endpoint returned an empty access token.");
        }

        var expiresInSeconds = Math.Max(60, tokenResponse.ExpiresIn);
        _accessToken = tokenResponse.AccessToken;
        _expiresUtc = DateTimeOffset.UtcNow.AddSeconds(expiresInSeconds);
        LogTokenClaimFingerprint("ClientSecret", _accessToken);
    }

    private async Task AcquireManagedIdentityTokenAsync(CancellationToken cancellationToken)
    {
        var scope = RequireConfig("InvoiceStaging:Auth:Scope");
        var token = await BuildManagedIdentityCredential().GetTokenAsync(
            new TokenRequestContext([scope]),
            cancellationToken);
        if (string.IsNullOrWhiteSpace(token.Token))
        {
            throw new InvalidOperationException("ManagedIdentity credential returned an empty access token.");
        }

        _accessToken = token.Token;
        _expiresUtc = token.ExpiresOn;
        LogTokenClaimFingerprint("ManagedIdentity", _accessToken);
    }

    private async Task AcquireAzureCliTokenAsync(CancellationToken cancellationToken)
    {
        var scope = RequireConfig("InvoiceStaging:Auth:Scope");
        var token = await new AzureCliCredential().GetTokenAsync(
            new TokenRequestContext([scope]),
            cancellationToken);
        if (string.IsNullOrWhiteSpace(token.Token))
        {
            throw new InvalidOperationException("AzureCli credential returned an empty access token.");
        }

        _accessToken = token.Token;
        _expiresUtc = token.ExpiresOn;
        LogTokenClaimFingerprint("AzureCli", _accessToken);
    }

    private async Task AcquireDefaultAzureCredentialTokenAsync(CancellationToken cancellationToken)
    {
        var scope = RequireConfig("InvoiceStaging:Auth:Scope");
        var token = await BuildDefaultAzureCredentialChain().GetTokenAsync(
            new TokenRequestContext([scope]),
            cancellationToken);
        if (string.IsNullOrWhiteSpace(token.Token))
        {
            throw new InvalidOperationException("DefaultAzureCredential returned an empty access token.");
        }

        _accessToken = token.Token;
        _expiresUtc = token.ExpiresOn;
        LogTokenClaimFingerprint("DefaultAzureCredential", _accessToken);
    }

    private TokenCredential BuildManagedIdentityCredential()
    {
        var managedIdentityClientId = configuration["InvoiceStaging:Auth:ManagedIdentityClientId"]?.Trim();
        var managedIdentityId = string.IsNullOrWhiteSpace(managedIdentityClientId)
            ? ManagedIdentityId.SystemAssigned
            : ManagedIdentityId.FromUserAssignedClientId(managedIdentityClientId);
        return new ManagedIdentityCredential(managedIdentityId);
    }

    private TokenCredential BuildDefaultAzureCredentialChain()
    {
        var managedIdentityCredential = BuildManagedIdentityCredential();

        // Deterministic order: Azure hosting identity first, local az login second.
        return new ChainedTokenCredential(
            managedIdentityCredential,
            new AzureCliCredential());
    }

    private async Task<bool> TryAcquireManagedIdentityTokenAsync(CancellationToken cancellationToken)
    {
        try
        {
            await AcquireManagedIdentityTokenAsync(cancellationToken);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogWarning(
                ex,
                "Invoice staging token acquisition via ManagedIdentity failed; trying AzureCli next.");
            return false;
        }
    }

    private async Task<bool> TryAcquireAzureCliTokenAsync(CancellationToken cancellationToken)
    {
        try
        {
            await AcquireAzureCliTokenAsync(cancellationToken);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogWarning(
                ex,
                "Invoice staging token acquisition via AzureCli failed; trying ClientSecret next.");
            return false;
        }
    }

    private void LogTokenClaimFingerprint(string source, string? token)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return;
        }

        if (!TryReadJwtPayload(token, out var payload))
        {
            logger.LogWarning("InvoiceStaging token source={Source}; unable to parse JWT payload.", source);
            return;
        }

        logger.LogInformation(
            "InvoiceStaging token source={Source}; tid={Tid}; oid={Oid}; appid={AppId}; azp={Azp}; upn={Upn}; aud={Aud}; iss={Iss}; idtyp={IdTyp}",
            source,
            GetClaim(payload, "tid"),
            GetClaim(payload, "oid"),
            GetClaim(payload, "appid"),
            GetClaim(payload, "azp"),
            GetClaim(payload, "preferred_username") ?? GetClaim(payload, "upn"),
            GetClaim(payload, "aud"),
            GetClaim(payload, "iss"),
            GetClaim(payload, "idtyp"));
    }

    private static bool TryReadJwtPayload(string token, out Dictionary<string, string> payload)
    {
        payload = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        var parts = token.Split('.');
        if (parts.Length < 2)
        {
            return false;
        }

        try
        {
            var segment = parts[1]
                .Replace('-', '+')
                .Replace('_', '/');
            var padLength = 4 - (segment.Length % 4);
            if (padLength is > 0 and < 4)
            {
                segment = segment.PadRight(segment.Length + padLength, '=');
            }

            var bytes = Convert.FromBase64String(segment);
            using var document = JsonDocument.Parse(bytes);
            foreach (var property in document.RootElement.EnumerateObject())
            {
                payload[property.Name] = property.Value.ValueKind switch
                {
                    JsonValueKind.String => property.Value.GetString() ?? string.Empty,
                    JsonValueKind.Number => property.Value.ToString(),
                    JsonValueKind.True => "true",
                    JsonValueKind.False => "false",
                    _ => property.Value.GetRawText()
                };
            }

            return true;
        }
        catch
        {
            return false;
        }
    }

    private static string? GetClaim(IReadOnlyDictionary<string, string> payload, string name)
    {
        return payload.TryGetValue(name, out var value) ? value : null;
    }

    private static bool IsRunningInAzureAppService()
    {
        return !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("WEBSITE_INSTANCE_ID"));
    }

    private sealed record TokenResponse(
        [property: JsonPropertyName("access_token")] string AccessToken,
        [property: JsonPropertyName("expires_in")] int ExpiresIn);
}
