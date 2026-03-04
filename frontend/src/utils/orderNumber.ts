type IpadOrderNo = string | number | null | undefined;

function hasIpadOrderNo(value: IpadOrderNo): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) && value !== 0;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return false;
  }

  if (/^0+$/.test(trimmed)) {
    return false;
  }

  const numericValue = Number(trimmed);
  if (Number.isFinite(numericValue) && numericValue === 0) {
    return false;
  }

  return true;
}

export function formatOrderDisplayNo(
  salesOrderNo: string,
  ipadOrderNo?: IpadOrderNo
): string {
  if (!hasIpadOrderNo(ipadOrderNo)) {
    return salesOrderNo;
  }

  return `${salesOrderNo}-${String(ipadOrderNo).trim()}`;
}
