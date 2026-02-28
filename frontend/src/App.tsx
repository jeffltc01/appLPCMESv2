import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { FluentProvider } from "@fluentui/react-components";
import { lpCylinderLightTheme } from "./theme";
import { AuthProvider } from "./auth/AuthContext";
import { RequireAuth } from "./auth/RequireAuth";
import { OrderEntryPage } from "./pages/OrderEntryPage";
import { OrderListPage } from "./pages/OrderListPage";
import { InvoicePage } from "./pages/InvoicePage";
import { CustomerDetailPage } from "./pages/CustomerDetailPage";
import { TransportationDispatchPage } from "./pages/TransportationDispatchPage";
import { MenuPage } from "./pages/MenuPage";
import { ReceivingQueuePage } from "./pages/ReceivingQueuePage";
import { ReceivingDetailPage } from "./pages/ReceivingDetailPage";
import { ProductionLinesSetupPage } from "./pages/ProductionLinesSetupPage";
import { ItemsSetupPage } from "./pages/ItemsSetupPage";
import { WorkCentersSetupPage } from "./pages/WorkCentersSetupPage";
import { UsersRolesSetupPage } from "./pages/UsersRolesSetupPage";
import { RouteTemplatesSetupPage } from "./pages/RouteTemplatesSetupPage";
import { RouteTemplateDetailPage } from "./pages/RouteTemplateDetailPage";
import { TabletSetupPage } from "./pages/TabletSetupPage";
import { WorkCenterOperatorPage } from "./pages/WorkCenterOperatorPage";
import { OrderAuditLogPage } from "./pages/OrderAuditLogPage";
import { FeatureFlagsSitePoliciesSetupPage } from "./pages/FeatureFlagsSitePoliciesSetupPage";
import { LoginPage } from "./pages/LoginPage";

export default function App() {
  return (
    <FluentProvider theme={lpCylinderLightTheme}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <RequireAuth>
                  <MenuPage />
                </RequireAuth>
              }
            />
            <Route
              path="/orders"
              element={
                <RequireAuth>
                  <OrderListPage />
                </RequireAuth>
              }
            />
            <Route
              path="/orders/:orderId"
              element={
                <RequireAuth>
                  <OrderEntryPage />
                </RequireAuth>
              }
            />
            <Route
              path="/transportation"
              element={
                <RequireAuth>
                  <TransportationDispatchPage />
                </RequireAuth>
              }
            />
            <Route
              path="/receiving"
              element={
                <RequireAuth>
                  <ReceivingQueuePage />
                </RequireAuth>
              }
            />
            <Route
              path="/receiving/:orderId"
              element={
                <RequireAuth>
                  <ReceivingDetailPage />
                </RequireAuth>
              }
            />
            <Route
              path="/invoices"
              element={
                <RequireAuth>
                  <InvoicePage />
                </RequireAuth>
              }
            />
            <Route
              path="/invoices/:orderId"
              element={
                <RequireAuth>
                  <OrderEntryPage invoiceMode />
                </RequireAuth>
              }
            />
            <Route
              path="/customers/:customerId"
              element={
                <RequireAuth>
                  <CustomerDetailPage />
                </RequireAuth>
              }
            />
            <Route
              path="/setup/production-lines"
              element={
                <RequireAuth>
                  <ProductionLinesSetupPage />
                </RequireAuth>
              }
            />
            <Route
              path="/setup/items"
              element={
                <RequireAuth>
                  <ItemsSetupPage />
                </RequireAuth>
              }
            />
            <Route
              path="/setup/work-centers"
              element={
                <RequireAuth>
                  <WorkCentersSetupPage />
                </RequireAuth>
              }
            />
            <Route
              path="/setup/users-roles"
              element={
                <RequireAuth>
                  <UsersRolesSetupPage />
                </RequireAuth>
              }
            />
            <Route
              path="/setup/order-audit-log"
              element={
                <RequireAuth>
                  <OrderAuditLogPage />
                </RequireAuth>
              }
            />
            <Route
              path="/setup/feature-flags-policies"
              element={
                <RequireAuth>
                  <FeatureFlagsSitePoliciesSetupPage />
                </RequireAuth>
              }
            />
            <Route
              path="/setup/route-templates"
              element={
                <RequireAuth>
                  <RouteTemplatesSetupPage />
                </RequireAuth>
              }
            />
            <Route
              path="/setup/route-templates/:templateId"
              element={
                <RequireAuth>
                  <RouteTemplateDetailPage />
                </RequireAuth>
              }
            />
            <Route
              path="/setup/tablet"
              element={
                <RequireAuth>
                  <TabletSetupPage />
                </RequireAuth>
              }
            />
            <Route
              path="/operator/work-center"
              element={
                <RequireAuth>
                  <WorkCenterOperatorPage />
                </RequireAuth>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </FluentProvider>
  );
}
