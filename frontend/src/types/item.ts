export interface ItemListItem {
  id: number;
  itemNo: string;
  itemDescription: string | null;
  itemType: string;
  productLine: string | null;
  sizeName: string | null;
  basePrice: number | null;
}

export interface ItemDetail {
  id: number;
  itemNo: string;
  itemDescription: string | null;
  itemType: string;
  productLine: string | null;
  itemSizeId: number | null;
  sizeName: string | null;
  systemCode: string | null;
  requiresSerialNumbers: number;
  requiresGaugeOption: boolean | null;
  requiresFillerOption: boolean | null;
  requiresCollarOption: boolean | null;
  requiresFootRingOption: boolean | null;
  requiresValveTypeOption: boolean | null;
  pricings: PricingRecord[];
  crossReferences: CrossReference[];
}

export interface ItemCreate {
  itemNo: string;
  itemDescription?: string | null;
  itemType: string;
  productLine?: string | null;
  itemSizeId?: number | null;
}

export interface ItemUpdate {
  itemNo: string;
  itemDescription: string | null;
  itemType: string;
  productLine: string | null;
  itemSizeId: number | null;
  systemCode: string | null;
  requiresSerialNumbers: number;
  requiresGaugeOption: boolean | null;
  requiresFillerOption: boolean | null;
  requiresCollarOption: boolean | null;
  requiresFootRingOption: boolean | null;
  requiresValveTypeOption: boolean | null;
}

export interface PricingRecord {
  id: number;
  effectiveDate: string;
  unitPrice: number | null;
  notes: string | null;
  itemId: number;
  customerId: number | null;
  customerName: string | null;
}

export interface PricingCreate {
  effectiveDate: string;
  unitPrice: number | null;
  notes?: string | null;
  customerId?: number | null;
}

export interface CrossReference {
  id: number;
  lpcItemNumber: string;
  erpItemNumber: string;
}

export interface CrossReferenceCreate {
  lpcItemNumber: string;
  erpItemNumber: string;
}

export interface ItemSizeLookup {
  id: number;
  name: string;
  size: number;
}
