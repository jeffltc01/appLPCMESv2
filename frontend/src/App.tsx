import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FluentProvider } from "@fluentui/react-components";
import { lpCylinderLightTheme } from "./theme";
import { AppShell } from "./components/layout/AppShell";
import { HomePage } from "./pages/HomePage";
import { PlaceholderPage } from "./pages/PlaceholderPage";

export default function App() {
  return (
    <FluentProvider theme={lpCylinderLightTheme}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="orders/*" element={<PlaceholderPage title="Orders" />} />
            <Route path="receiving/*" element={<PlaceholderPage title="Receiving" />} />
            <Route path="production/*" element={<PlaceholderPage title="Production" />} />
            <Route path="shipping/*" element={<PlaceholderPage title="Shipping" />} />
            <Route path="invoicing/*" element={<PlaceholderPage title="Invoicing" />} />
            <Route path="customers/*" element={<PlaceholderPage title="Customers" />} />
            <Route path="orderboard" element={<PlaceholderPage title="Order Board" />} />
            <Route path="contacts/*" element={<PlaceholderPage title="Contacts" />} />
            <Route path="items/*" element={<PlaceholderPage title="Items" />} />
            <Route path="setup/*" element={<PlaceholderPage title="Setup" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </FluentProvider>
  );
}
