import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FluentProvider } from "@fluentui/react-components";
import { lpCylinderLightTheme } from "./theme";
import { AppShell } from "./components/layout/AppShell";
import { HomePage } from "./pages/HomePage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { CustomerListPage } from "./pages/CustomerListPage";
import { CustomerDetailPage } from "./pages/CustomerDetailPage";
import { NewCustomerPage } from "./pages/NewCustomerPage";
import { ItemListPage } from "./pages/ItemListPage";
import { ItemDetailPage } from "./pages/ItemDetailPage";
import { NewItemPage } from "./pages/NewItemPage";
import { OrderListPage } from "./pages/OrderListPage";
import { OrderDetailPage } from "./pages/OrderDetailPage";
import { TransportationBoardPage } from "./pages/TransportationBoardPage";
import { ProductionPage } from "./pages/ProductionPage";
import { ProductionOrderPage } from "./pages/ProductionOrderPage";
import { ReceivingPage } from "./pages/ReceivingPage";
import { InvoicingPage } from "./pages/InvoicingPage";
import { OperatorWorkCenterConsolePage } from "./pages/OperatorWorkCenterConsolePage";
import { OrderWorkspacePage } from "./pages/OrderWorkspacePage";
import { OrderBoardPage } from "./pages/OrderBoardPage";
import { OrderPolicyPage } from "./pages/OrderPolicyPage";
import { KpiDiagnosticsPage } from "./pages/KpiDiagnosticsPage";
import { WorkCenterKpiPage } from "./pages/WorkCenterKpiPage";
import { SupervisorRouteReviewPage } from "./pages/SupervisorRouteReviewPage";
import { SetupHomePage } from "./pages/SetupHomePage";
import { SetupWorkCentersPage } from "./pages/SetupWorkCentersPage";
import { SetupRouteTemplatesPage } from "./pages/SetupRouteTemplatesPage";
import { SetupAssignmentsPage } from "./pages/SetupAssignmentsPage";

export default function App() {
  return (
    <FluentProvider theme={lpCylinderLightTheme}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="orders" element={<OrderListPage />} />
            <Route path="orders/new" element={<OrderDetailPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
            <Route path="orders/:id/workspace" element={<OrderWorkspacePage />} />
            <Route path="transportation" element={<TransportationBoardPage />} />
            <Route path="receiving" element={<ReceivingPage />} />
            <Route path="production" element={<ProductionPage />} />
            <Route path="production/:id" element={<ProductionOrderPage />} />
            <Route path="shipping" element={<TransportationBoardPage />} />
            <Route path="invoicing" element={<InvoicingPage />} />
            <Route path="customers" element={<CustomerListPage />} />
            <Route path="customers/new" element={<NewCustomerPage />} />
            <Route path="customers/:id" element={<CustomerDetailPage />} />
            <Route path="items" element={<ItemListPage />} />
            <Route path="items/new" element={<NewItemPage />} />
            <Route path="items/:id" element={<ItemDetailPage />} />
            <Route path="orderboard" element={<OrderBoardPage />} />
            <Route path="orderboard/kpi-diagnostics" element={<KpiDiagnosticsPage />} />
            <Route path="kpi/workcenter" element={<WorkCenterKpiPage />} />
            <Route path="operator-console" element={<OperatorWorkCenterConsolePage />} />
            <Route path="supervisor/review" element={<SupervisorRouteReviewPage />} />
            <Route path="contacts/*" element={<PlaceholderPage title="Contacts" />} />
            <Route path="setup" element={<SetupHomePage />} />
            <Route path="setup/workcenters" element={<SetupWorkCentersPage />} />
            <Route path="setup/route-templates" element={<SetupRouteTemplatesPage />} />
            <Route path="setup/assignments" element={<SetupAssignmentsPage />} />
            <Route path="setup/policies" element={<OrderPolicyPage />} />
            <Route path="setup/*" element={<SetupHomePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </FluentProvider>
  );
}
