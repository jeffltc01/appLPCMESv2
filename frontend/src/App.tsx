import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { FluentProvider } from "@fluentui/react-components";
import { lpCylinderLightTheme } from "./theme";
import { OrderEntryPage } from "./pages/OrderEntryPage";
import { OrderListPage } from "./pages/OrderListPage";
import { InvoicePage } from "./pages/InvoicePage";
import { CustomerDetailPage } from "./pages/CustomerDetailPage";
import { TransportationDispatchPage } from "./pages/TransportationDispatchPage";
import { MenuPage } from "./pages/MenuPage";
import { ReceivingQueuePage } from "./pages/ReceivingQueuePage";
import { ReceivingDetailPage } from "./pages/ReceivingDetailPage";

export default function App() {
  return (
    <FluentProvider theme={lpCylinderLightTheme}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MenuPage />} />
          <Route path="/orders" element={<OrderListPage />} />
          <Route path="/orders/:orderId" element={<OrderEntryPage />} />
          <Route path="/transportation" element={<TransportationDispatchPage />} />
          <Route path="/receiving" element={<ReceivingQueuePage />} />
          <Route path="/receiving/:orderId" element={<ReceivingDetailPage />} />
          <Route path="/invoices" element={<InvoicePage />} />
          <Route path="/invoices/:orderId" element={<OrderEntryPage invoiceMode />} />
          <Route path="/customers/:customerId" element={<CustomerDetailPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </FluentProvider>
  );
}
