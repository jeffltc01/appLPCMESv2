import { useNavigate } from "react-router-dom";
import { NewCustomerDialog } from "../components/customers/NewCustomerDialog";

export function NewCustomerPage() {
  const navigate = useNavigate();

  return (
    <NewCustomerDialog
      open={true}
      onClose={() => navigate("/customers")}
      onCreated={(customer) => navigate(`/customers/${customer.id}`)}
    />
  );
}
