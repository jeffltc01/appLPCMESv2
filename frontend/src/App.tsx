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
import { ReceivingPage } from "./pages/ReceivingPage";
import { ProductionPage } from "./pages/ProductionPage";
import { ProductionOrderPage } from "./pages/ProductionOrderPage";

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
            <Route path="transportation" element={<TransportationBoardPage />} />
            <Route path="receiving" element={<ReceivingPage />} />
            <Route path="production" element={<ProductionPage />} />
            <Route path="production/:id" element={<ProductionOrderPage />} />
            <Route path="shipping/*" element={<PlaceholderPage title="Shipping" />} />
            <Route path="invoicing/*" element={<PlaceholderPage title="Invoicing" />} />
            <Route path="customers" element={<CustomerListPage />} />
            <Route path="customers/new" element={<NewCustomerPage />} />
            <Route path="customers/:id" element={<CustomerDetailPage />} />
            <Route path="items" element={<ItemListPage />} />
            <Route path="items/new" element={<NewItemPage />} />
            <Route path="items/:id" element={<ItemDetailPage />} />
            <Route path="orderboard" element={<PlaceholderPage title="Order Board" />} />
            <Route path="contacts/*" element={<PlaceholderPage title="Contacts" />} />
            <Route path="setup/*" element={<PlaceholderPage title="Setup" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </FluentProvider>
  );
}
