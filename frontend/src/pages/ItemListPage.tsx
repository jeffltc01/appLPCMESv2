import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  makeStyles,
  tokens,
  Title2,
  Input,
  Dropdown,
  Option,
  Button,
  Spinner,
  Body1,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@fluentui/react-components";
import { Add24Regular, Search24Regular } from "@fluentui/react-icons";
import { itemsApi, itemLookupsApi } from "../services/items";
import type { ItemListItem } from "../types/item";
import type { PaginatedResponse } from "../types/customer";

const useStyles = makeStyles({
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalL,
  },
  filters: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    flexWrap: "wrap",
    marginBottom: tokens.spacingVerticalM,
  },
  searchBox: {
    minWidth: "250px",
  },
  dropdown: {
    minWidth: "160px",
  },
  tableRow: {
    cursor: "pointer",
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  pager: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalL,
  },
  center: {
    display: "flex",
    justifyContent: "center",
    marginTop: tokens.spacingVerticalXXL,
  },
  priceCell: {
    textAlign: "right" as const,
  },
});

const PAGE_SIZE = 25;

const formatCurrency = (value: number | null) =>
  value != null ? `$${value.toFixed(2)}` : "--";

export function ItemListPage() {
  const navigate = useNavigate();
  const styles = useStyles();

  const [data, setData] = useState<PaginatedResponse<ItemListItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [productLine, setProductLine] = useState("All");
  const [itemType, setItemType] = useState("All");
  const [page, setPage] = useState(1);

  const [productLines, setProductLines] = useState<string[]>([]);
  const [itemTypes, setItemTypes] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      itemLookupsApi.productLines(),
      itemLookupsApi.itemTypes(),
    ]).then(([pl, it]) => {
      setProductLines(pl);
      setItemTypes(it);
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await itemsApi.list({
        page,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        productLine: productLine !== "All" ? productLine : undefined,
        itemType: itemType !== "All" ? itemType : undefined,
      });
      setData(result);
    } finally {
      setLoading(false);
    }
  }, [page, search, productLine, itemType]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, productLine, itemType]);

  const totalPages = data ? Math.ceil(data.totalCount / PAGE_SIZE) : 0;

  return (
    <div>
      <div className={styles.header}>
        <Title2>Items</Title2>
        <Button
          appearance="primary"
          icon={<Add24Regular />}
          onClick={() => navigate("/items/new")}
        >
          New Item
        </Button>
      </div>

      <div className={styles.filters}>
        <Input
          className={styles.searchBox}
          contentBefore={<Search24Regular />}
          placeholder="Search item no or description..."
          value={search}
          onChange={(_, d) => setSearch(d.value)}
        />
        <Dropdown
          className={styles.dropdown}
          placeholder="Product Line"
          value={productLine}
          selectedOptions={[productLine]}
          onOptionSelect={(_, d) => setProductLine(d.optionValue ?? "All")}
        >
          <Option value="All">All Lines</Option>
          {productLines.map((pl) => (
            <Option key={pl} value={pl}>
              {pl}
            </Option>
          ))}
        </Dropdown>
        <Dropdown
          className={styles.dropdown}
          placeholder="Item Type"
          value={itemType}
          selectedOptions={[itemType]}
          onOptionSelect={(_, d) => setItemType(d.optionValue ?? "All")}
        >
          <Option value="All">All Types</Option>
          {itemTypes.map((t) => (
            <Option key={t} value={t}>
              {t}
            </Option>
          ))}
        </Dropdown>
      </div>

      {loading ? (
        <div className={styles.center}>
          <Spinner size="large" label="Loading items..." />
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className={styles.center}>
          <Body1>No items found.</Body1>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Item No</TableHeaderCell>
                <TableHeaderCell>Description</TableHeaderCell>
                <TableHeaderCell>Type</TableHeaderCell>
                <TableHeaderCell>Product Line</TableHeaderCell>
                <TableHeaderCell>Size</TableHeaderCell>
                <TableHeaderCell>Base Price</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((item) => (
                <TableRow
                  key={item.id}
                  className={styles.tableRow}
                  onClick={() => navigate(`/items/${item.id}`)}
                >
                  <TableCell>{item.itemNo}</TableCell>
                  <TableCell>{item.itemDescription}</TableCell>
                  <TableCell>{item.itemType}</TableCell>
                  <TableCell>{item.productLine}</TableCell>
                  <TableCell>{item.sizeName}</TableCell>
                  <TableCell className={styles.priceCell}>
                    {formatCurrency(item.basePrice)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className={styles.pager}>
            <Button
              appearance="subtle"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Body1>
              Page {page} of {totalPages} ({data.totalCount} total)
            </Body1>
            <Button
              appearance="subtle"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
