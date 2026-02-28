targetScope = 'resourceGroup'

@description('Azure region for resource deployment.')
param location string = resourceGroup().location

@description('Environment tag value.')
param environment string = 'test'

@description('Base app name used for tags.')
param appName string = 'lpcmesv2'

@description('App Service plan name.')
param appServicePlanName string

@description('Backend Web App name.')
param backendWebAppName string

@description('Application Insights resource name.')
param appInsightsName string

@description('Key Vault resource name.')
param keyVaultName string

@description('Static Web App name.')
param staticWebAppName string

@description('Static Web App location. Use a supported region (for example: eastus2).')
param staticWebAppLocation string = 'eastus2'

@description('App Service plan SKU (for example: B1).')
param appServicePlanSku string = 'B1'

var tags = {
  Environment: environment
  App: appName
  ManagedBy: 'azure-cli'
}

resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: appServicePlanName
  location: location
  kind: 'app'
  sku: {
    name: appServicePlanSku
    tier: startsWith(appServicePlanSku, 'B') ? 'Basic' : 'Standard'
    size: appServicePlanSku
    family: startsWith(appServicePlanSku, 'B') ? 'B' : 'S'
    capacity: 1
  }
  tags: tags
  properties: {
    reserved: false
  }
}

resource backendWebApp 'Microsoft.Web/sites@2023-12-01' = {
  name: backendWebAppName
  location: location
  kind: 'app'
  identity: {
    type: 'SystemAssigned'
  }
  tags: tags
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      minTlsVersion: '1.2'
      http20Enabled: true
      ftpsState: 'Disabled'
    }
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  tags: tags
  properties: {
    Application_Type: 'web'
  }
}

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  tags: tags
  properties: {
    tenantId: subscription().tenantId
    sku: {
      family: 'A'
      name: 'standard'
    }
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    publicNetworkAccess: 'Enabled'
  }
}

resource keyVaultSecretsUserRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, backendWebApp.id, 'KeyVaultSecretsUser')
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6')
    principalId: backendWebApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

resource staticWebApp 'Microsoft.Web/staticSites@2023-12-01' = {
  name: staticWebAppName
  location: staticWebAppLocation
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  tags: tags
  properties: {
    allowConfigFileUpdates: true
    publicNetworkAccess: 'Enabled'
    stagingEnvironmentPolicy: 'Disabled'
  }
}

output backendWebAppName string = backendWebApp.name
output backendDefaultHostName string = backendWebApp.properties.defaultHostName
output staticWebAppName string = staticWebApp.name
output staticWebAppDefaultHostName string = staticWebApp.properties.defaultHostname
output keyVaultName string = keyVault.name
output appInsightsConnectionString string = appInsights.properties.ConnectionString
