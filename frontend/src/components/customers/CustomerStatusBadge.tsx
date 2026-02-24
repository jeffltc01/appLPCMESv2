import { Badge } from "@fluentui/react-components";

export function CustomerStatusBadge({ status }: { status: string | null }) {
  const isActive = status === "Active";
  return (
    <Badge
      appearance="filled"
      color={isActive ? "success" : "informative"}
      shape="square"
    >
      {status ?? "Unknown"}
    </Badge>
  );
}
