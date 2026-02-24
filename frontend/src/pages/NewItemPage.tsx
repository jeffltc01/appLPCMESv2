import { useNavigate } from "react-router-dom";
import { NewItemDialog } from "../components/items/NewItemDialog";

export function NewItemPage() {
  const navigate = useNavigate();

  return (
    <NewItemDialog
      open={true}
      onClose={() => navigate("/items")}
      onCreated={(item) => navigate(`/items/${item.id}`)}
    />
  );
}
