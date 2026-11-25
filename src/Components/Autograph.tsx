import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  Box,
  Button,
  Flex,
  Loader,
  Menu,
  Modal,
  Stack,
  Table,
  Text,
  TextInput,
  UnstyledButton,
} from "@mantine/core";
import { FaSearch, FaFilter, FaEdit } from "react-icons/fa";
import { MdOutlineVerified } from "react-icons/md";

import ReaderLayout from "./ReaderLayout";
import Pagination from "./Pagination"; // path apne folder ke hisaab se theek kar lein
import {
  getAutographFeeHistory,
  getCurrentAutographFee,
  updateAutographFee,
} from "../api";

/**
- SIZING
- One "u" = 1 Figma pixel, scaled so the frame fits the screen height.
- Sidebar, header, logo, search and profile come from ReaderLayout.
 */
const u = (n: number): string => `calc(var(--u) * ${n})`;
const uMin = (n: number, min: number): string =>
  `max(${min}px, calc(var(--u) * ${n}))`;

const rootVars = { "--u": "calc(100dvh / 1024)" } as CSSProperties;

/** ek page par kitni rows dikhani hain */
const PAGE_SIZE = 4;

type FeeHistoryFilter = "ALL" | "WEEK" | "MONTH" | "DAYS_30";

const FEE_FILTER_ITEMS: { value: FeeHistoryFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "WEEK", label: "This Week" },
  { value: "MONTH", label: "This Month" },
  { value: "DAYS_30", label: "Last 30 Days" },
];

/** Icon wrapper: size comes from the Box, icon fills it (avoids the style typing error) */
const Ico = ({
  icon: Icon,
  n,
  min,
  color,
}: {
  icon: any;
  n: number;
  min: number;
  color?: string;
}) => (
  <Box
    style={{
      width: uMin(n, min),
      height: uMin(n, min),
      display: "flex",
      flexShrink: 0,
      color,
    }}
  >
    <Icon size="100%" />
  </Box>
);

const C = {
  bg: "#303030",
  panel: "#211F1F",
  cream: "#FFE8B6",
  brown: "#8C451F",
  active: "#91451F",
  border: "#45413D",
  white: "#F7E5D7",
  muted: "#C9C3B6",
};

type HistoryRow = {
  id: string;
  fee: string;
  updatedBy: string;
  date: string;
  rawDate: string | null;
};

function formatDate(value: unknown) {
  if (!value) return "-";
  const d = new Date(String(value));
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function matchesFeeFilter(
  rawDate: string | null,
  filter: FeeHistoryFilter,
): boolean {
  if (filter === "ALL") return true;
  if (!rawDate) return false;

  const d = new Date(rawDate);
  if (isNaN(d.getTime())) return false;

  const now = new Date();
  if (filter === "MONTH") {
    return (
      d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    );
  }

  const diffMs = now.getTime() - d.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (filter === "WEEK") return diffDays >= -1 && diffDays <= 7;
  if (filter === "DAYS_30") return diffDays >= -1 && diffDays <= 30;
  return true;
}

// History ka ek item -> table ki row
function toHistoryRow(h: any, index: number): HistoryRow {
  // Fee: pehle jaane-pehchane names, phir koi bhi key jis ke naam mein fee/amount/price/value ho
  let amount =
    h.amount ??
    h.fee ??
    h.newAmount ??
    h.newFee ??
    h.autographFee ??
    h.price ??
    h.value;

  if (amount === undefined || amount === null) {
    const key = Object.keys(h).find(
      (k) => /fee|amount|price|value/i.test(k) && typeof h[k] !== "object",
    );
    if (key) amount = h[key];
  }

  // Updated By: backend text bheje to wahi dikhao, warna naam se banao
  const by = h.updatedBy ?? h.admin ?? h.user;
  let updatedBy = "Fee has been updated by Admin";

  if (typeof by === "string" && by.trim()) {
    updatedBy = by.trim().replace(/\bAdmin\s+Admin\b/i, "Admin");
  } else if (by && typeof by === "object") {
    const name = `${by.firstName ?? ""} ${by.lastName ?? ""}`.trim();
    if (name && name.toLowerCase() !== "admin") {
      updatedBy = `Fee has been updated by Admin (${name})`;
    }
  }

  const rawDateVal = h.createdAt ?? h.updatedAt ?? h.date ?? null;

  return {
    id: String(h.id ?? index),
    fee: amount !== undefined && amount !== null ? `$${amount}/m` : "-",
    updatedBy,
    date: formatDate(rawDateVal),
    rawDate: rawDateVal ? String(rawDateVal) : null,
  };
}

function validateAutographFee(rawValue: string): string {
  const cleaned = rawValue.replace(/^\$/, "").trim();

  if (!cleaned) {
    return "Please enter an autograph fee.";
  }

  if (/[^0-9.]/.test(cleaned)) {
    return "Please enter numbers only (e.g., 12 or 5.80).";
  }

  if (
    (cleaned.match(/\./g) || []).length > 1 ||
    cleaned.startsWith(".") ||
    cleaned.endsWith(".")
  ) {
    return "Please enter a valid amount (e.g., 12 or 5.80).";
  }

  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
    return "Maximum 2 decimal places are allowed (e.g., 1.23 or 5.80).";
  }

  const num = Number(cleaned);
  if (num < 1) {
    return "Autograph fee must be at least $1.";
  }

  if (num > 100 || (num === 100 && cleaned.includes("."))) {
    return "Autograph fee cannot exceed $100 (enter 100 without decimals).";
  }

  return "";
}

export default function Autograph() {
  // "list" = screen 1, "edit" = screen 2, success popup = screen 3
  const [view, setView] = useState<"list" | "edit">("list");
  const [successOpen, setSuccessOpen] = useState<boolean>(false);

  const [currentFee, setCurrentFee] = useState<string>("-");
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [serverPages, setServerPages] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [reloadKey, setReloadKey] = useState<number>(0);
  const [tableSearch, setTableSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [historyFilter, setHistoryFilter] = useState<FeeHistoryFilter>("ALL");
  const [activePage, setActivePage] = useState<number>(1);
  const [fee, setFee] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string>("");

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(tableSearch);
      setActivePage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [tableSearch]);

  // Current fee: shuru mein aur har update ke baad
  useEffect(() => {
    getCurrentAutographFee()
      .then((res: any) => {
        const amount = res?.amount ?? res?.data?.amount;
        setCurrentFee(amount !== undefined ? `$${amount}` : "-");
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not load fee"),
      );
  }, [reloadKey]);

  // History: page, debouncedSearch, historyFilter aur reloadKey ke mutabiq
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const hasSearch = Boolean(debouncedSearch.trim());
        const hasFilter = historyFilter !== "ALL";
        const fetchPage = hasSearch || hasFilter ? 1 : activePage;
        const fetchLimit = hasSearch || hasFilter ? 100 : PAGE_SIZE;

        const res: any = await getAutographFeeHistory({
          page: fetchPage,
          limit: fetchLimit,
          ...(hasSearch ? { search: debouncedSearch.trim() } : {}),
          ...(hasFilter ? { filter: historyFilter } : {}),
        });
        const list: any[] = Array.isArray(res)
          ? res
          : (res.data ?? res.items ?? res.history ?? []);

        if (!cancelled) {
          setRows(list.map(toHistoryRow));
          if (hasSearch || hasFilter) {
            setServerPages(null);
          } else {
            setServerPages(
              res?.pagination?.totalPages ?? res?.meta?.totalPages ?? null,
            );
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Something went wrong");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [activePage, debouncedSearch, historyFilter, reloadKey]);

  const filteredHistory = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesQuery =
        !query ||
        `${row.fee} ${row.updatedBy} ${row.date}`.toLowerCase().includes(query);
      return matchesQuery && matchesFeeFilter(row.rawDate, historyFilter);
    });
  }, [debouncedSearch, historyFilter, rows]);

  // ---------- Pagination ----------
  const totalPages =
    serverPages ?? Math.max(1, Math.ceil(filteredHistory.length / PAGE_SIZE));
  const currentPage = serverPages
    ? activePage
    : Math.min(activePage, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visibleHistory = serverPages
    ? filteredHistory
    : filteredHistory.slice(start, start + PAGE_SIZE);
  // --------------------------------

  const cleanFee = fee.replace(/^\$/, "").trim();

  const handleSelectFilter = (next: FeeHistoryFilter) => {
    setHistoryFilter(next);
    setActivePage(1);
  };

  const activeFilterLabel =
    FEE_FILTER_ITEMS.find((item) => item.value === historyFilter)?.label ??
    "Filter";

  const openEdit = () => {
    setFee("");
    setSaveError("");
    setView("edit");
  };

  const handleFeeChange = (val: string) => {
    setFee(val);
    const cleaned = val.replace(/^\$/, "").trim();
    if (/[^0-9.]/.test(cleaned)) {
      setSaveError("Please enter numbers only (e.g., 12 or 5.80).");
    } else if (saveError) {
      setSaveError(validateAutographFee(val));
    }
  };

  const handleUpdate = async () => {
    if (saving) return;

    const validationError = validateAutographFee(fee);
    if (validationError) {
      setSaveError(validationError);
      return;
    }

    try {
      setSaving(true);
      setSaveError("");
      await updateAutographFee(Number(cleanFee));
      setSuccessOpen(true);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Could not update autograph fee",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleOkay = () => {
    // naya fee aur history dobara mangwayenge, aur list par wapas
    setSuccessOpen(false);
    setView("list");
    setActivePage(1);
    setReloadKey((k) => k + 1);
  };

  return (
    <ReaderLayout
      title={view === "list" ? "Autograph Fee Management" : "Autograph Fee"}
      activePage="autograph"
    >
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap");
        :root { --u: calc(100dvh / 1024); }
        .hide-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .action:hover { opacity: .85; }
      `}</style>

      <Box
        style={{
          ...rootVars,
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          fontFamily: '"Nunito", Arial, sans-serif',
        }}
      >
        {/* ================= SCREEN 1: LIST ================= */}
        {view === "list" && (
          <>
            <Box
              bg={C.panel}
              style={{
                flex: 1,
                minHeight: 0,
                padding: `${u(38)} ${u(30)} 0`,
                borderRadius: u(18),
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <Text
                c={C.cream}
                fw={600}
                style={{ fontSize: uMin(34, 17), lineHeight: 1 }}
              >
                Current Autograph Fee
              </Text>

              {/* CURRENT FEE CARD */}
              <Box
                bg={C.cream}
                style={{
                  position: "relative",
                  flexShrink: 0,
                  height: u(84),
                  marginTop: u(30),
                  borderRadius: u(10),
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: u(25),
                  paddingRight: u(44),
                }}
              >
                <Text
                  c="#51473B"
                  style={{ fontSize: uMin(20, 11), lineHeight: 1 }}
                >
                  Autograph Fee
                </Text>

                <Text
                  c="#171717"
                  fw={800}
                  style={{
                    position: "absolute",
                    left: "54.5%",
                    transform: "translateX(-50%)",
                    fontSize: uMin(32, 16),
                    lineHeight: 1,
                  }}
                >
                  {currentFee}
                </Text>

                <UnstyledButton
                  aria-label="Edit autograph fee"
                  className="action"
                  onClick={openEdit}
                  style={{
                    marginLeft: "auto",
                    color: C.brown,
                    display: "flex",
                  }}
                >
                  <Ico icon={FaEdit} n={32} min={16} />
                </UnstyledButton>
              </Box>

              {/* TITLE + SEARCH + FILTER */}
              <Flex
                align="center"
                justify="space-between"
                style={{ marginTop: u(30), height: u(42), flexShrink: 0 }}
              >
                <Text
                  c={C.cream}
                  fw={600}
                  style={{ fontSize: uMin(34, 17), lineHeight: 1 }}
                >
                  Autograph Fee History
                </Text>

                <Flex align="center" style={{ gap: u(25) }}>
                  <TextInput
                    placeholder="Search"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.currentTarget.value)}
                    leftSection={<Ico icon={FaSearch} n={13} min={9} />}
                    styles={{
                      root: { width: u(296) },
                      input: {
                        height: u(42),
                        minHeight: 0,
                        background: "#303030",
                        border: "none",
                        borderRadius: 999,
                        color: "#FFFFFF",
                        paddingLeft: `max(34px, ${u(44)})`,
                        fontSize: uMin(16, 11),
                      },
                      section: { color: C.cream, width: `max(34px, ${u(44)})` },
                    }}
                  />

                  <Menu shadow="md" width={165} position="bottom-end">
                    <Menu.Target>
                      <UnstyledButton
                        className="action"
                        style={{
                          width: u(122),
                          minWidth: 105,
                          height: u(42),
                          borderRadius: 999,
                          background:
                            historyFilter === "ALL" ? "#303030" : C.active,
                          color: C.cream,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: u(8),
                          padding: "0 12px",
                        }}
                      >
                        <Ico icon={FaFilter} n={13} min={9} />
                        <Text style={{ fontSize: uMin(16, 11) }}>
                          {historyFilter === "ALL"
                            ? "Filter"
                            : activeFilterLabel}
                        </Text>
                      </UnstyledButton>
                    </Menu.Target>

                    <Menu.Dropdown
                      style={{
                        backgroundColor: "#2B2828",
                        border: `1px solid ${C.border}`,
                      }}
                    >
                      {FEE_FILTER_ITEMS.map((item) => (
                        <Menu.Item
                          key={item.value}
                          onClick={() => handleSelectFilter(item.value)}
                          style={{
                            color:
                              historyFilter === item.value
                                ? C.cream
                                : "#FFFFFF",
                            backgroundColor:
                              historyFilter === item.value
                                ? "rgba(145, 69, 31, 0.45)"
                                : "transparent",
                            fontSize: "12px",
                          }}
                        >
                          {item.label}
                        </Menu.Item>
                      ))}
                    </Menu.Dropdown>
                  </Menu>
                </Flex>
              </Flex>

              {/* TABLE */}
              <Box
                className="hide-scrollbar"
                style={{
                  flex: 1,
                  minHeight: 0,
                  marginTop: u(24),
                  overflowY: "auto",
                  overflowX: "auto",
                }}
              >
                {loading ? (
                  <Flex justify="center" py="xl">
                    <Loader color={C.cream} size="sm" />
                  </Flex>
                ) : error ? (
                  <Text
                    ta="center"
                    c="#FF6B6B"
                    py="xl"
                    style={{ fontSize: uMin(18, 11) }}
                  >
                    {error}
                  </Text>
                ) : (
                  <Table
                    withRowBorders={false}
                    verticalSpacing={0}
                    horizontalSpacing={0}
                    styles={{
                      table: {
                        width: "100%",
                        minWidth: 520,
                        tableLayout: "fixed",
                        borderCollapse: "collapse",
                      },
                      th: {
                        height: u(34),
                        padding: 0,
                        color: C.cream,
                        fontSize: uMin(27, 13),
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        textAlign: "left",
                        borderBottom: "none",
                      },
                      td: {
                        height: u(97),
                        padding: 0,
                        verticalAlign: "middle",
                        whiteSpace: "nowrap",
                        borderTop: "none",
                        borderBottom: `1px solid ${C.border}`,
                      },
                    }}
                  >
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th w="42.7%">Autograph Fee</Table.Th>
                        <Table.Th w="46.9%">Updated By</Table.Th>
                        <Table.Th w="10.4%" style={{ textAlign: "center" }}>
                          Date
                        </Table.Th>
                      </Table.Tr>
                    </Table.Thead>

                    <Table.Tbody>
                      {visibleHistory.map((row) => (
                        <Table.Tr key={row.id}>
                          <Table.Td>
                            <Text
                              c="#B85A2A"
                              style={{ fontSize: uMin(22, 12) }}
                            >
                              {row.fee}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text
                              c={C.white}
                              style={{ fontSize: uMin(17, 10) }}
                            >
                              {row.updatedBy}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text
                              c={C.white}
                              ta="center"
                              style={{ fontSize: uMin(17, 10) }}
                            >
                              {row.date}
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                )}

                {!loading && !error && visibleHistory.length === 0 && (
                  <Text
                    ta="center"
                    c={C.muted}
                    py="xl"
                    style={{ fontSize: uMin(18, 11) }}
                  >
                    No history found.
                  </Text>
                )}
              </Box>
            </Box>

            {/* PAGINATION */}
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              onChange={setActivePage}
            />
          </>
        )}

        {/* ================= SCREEN 2: EDIT ================= */}
        {view === "edit" && (
          <Box
            bg={C.panel}
            style={{
              flex: "0 0 auto",
              height: u(394),
              padding: `${u(38)} ${u(30)} 0`,
              borderRadius: u(12),
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <Text
              c={C.cream}
              fw={600}
              style={{ fontSize: uMin(34, 17), lineHeight: 1 }}
            >
              Updated Autograph Fee
            </Text>

            <TextInput
              aria-label="Updated autograph fee"
              placeholder="$12"
              value={fee}
              onChange={(e) => handleFeeChange(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleUpdate();
              }}
              styles={{
                root: { marginTop: u(30), flexShrink: 0 },
                input: {
                  height: u(48),
                  minHeight: 0,
                  background: C.bg,
                  border: "none",
                  borderRadius: u(4),
                  color: "#FFFFFF",
                  fontSize: uMin(18, 11),
                  paddingLeft: u(25),
                },
              }}
            />

            {saveError && (
              <Text c="#FF6B6B" mt={8} style={{ fontSize: uMin(16, 11) }}>
                {saveError}
              </Text>
            )}

            <Flex style={{ marginTop: u(119), gap: u(24), flexShrink: 0 }}>
              <Button
                className="action"
                onClick={handleUpdate}
                loading={saving}
                w={u(249)}
                h={u(51)}
                radius={u(3)}
                styles={{
                  root: {
                    background: C.brown,
                    color: C.white,
                    fontSize: uMin(19, 11),
                    fontWeight: 400,
                    minWidth: 110,
                  },
                }}
              >
                Update Fee
              </Button>

              <Button
                className="action"
                onClick={() => setView("list")}
                w={u(252)}
                h={u(51)}
                radius={u(3)}
                styles={{
                  root: {
                    background: C.bg,
                    color: C.white,
                    fontSize: uMin(19, 11),
                    fontWeight: 400,
                    minWidth: 110,
                  },
                }}
              >
                Cancel
              </Button>
            </Flex>
          </Box>
        )}
      </Box>

      {/* ================= SCREEN 3: SUCCESS POPUP ================= */}
      <Modal
        opened={successOpen}
        onClose={handleOkay}
        withCloseButton={false}
        centered
        padding={0}
        radius={u(12)}
        size="auto"
        overlayProps={{ color: "#000", backgroundOpacity: 0.6, blur: 0 }}
        styles={{
          content: {
            background: C.cream,
            flex: "0 0 auto",
            width: u(610),
            minWidth: 300,
            maxWidth: "92vw",
            height: u(370),
            minHeight: 240,
          },
          body: { height: "100%" },
        }}
      >
        <Stack
          align="center"
          justify="flex-start"
          gap={0}
          h="100%"
          style={{ paddingTop: u(60) }}
        >
          <Ico icon={MdOutlineVerified} n={64} min={40} color="#3B2A1A" />

          <Text
            c="#1F1F1F"
            ta="center"
            style={{
              marginTop: u(30),
              fontSize: uMin(22, 13),
              lineHeight: 1.5,
            }}
          >
            Autograph fee plan has been
            <br />
            Updated successfully
          </Text>

          <Button
            className="action"
            onClick={handleOkay}
            w={u(160)}
            h={u(50)}
            radius={u(2)}
            style={{ marginTop: u(40) }}
            styles={{
              root: {
                background: C.brown,
                color: C.white,
                fontSize: uMin(19, 11),
                fontWeight: 400,
                minWidth: 90,
                outline: "none",
                boxShadow: `0 ${u(10)} ${u(18)} rgba(0,0,0,0.35)`,
              },
            }}
          >
            Okay
          </Button>
        </Stack>
      </Modal>
    </ReaderLayout>
  );
}
