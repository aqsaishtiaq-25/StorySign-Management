import { useEffect, useState } from "react";
import {
  Box,
  Flex,
  Loader,
  Table,
  Text,
  TextInput,
  UnstyledButton,
} from "@mantine/core";
import type { IconType } from "react-icons";
import {
  FaSearch,
  FaFilter,
  FaUsers,
  FaUserClock,
  FaUserSlash,
  FaUserCog,
  FaRegEye,
} from "react-icons/fa";

import ReaderLayout from "./ReaderLayout";
import Pagination from "./Pagination"; // path apne folder ke hisaab se theek kar lein
import authorImg from "../assets/Author-image.png";
import {
  getSupportQueries,
  getSupportQueryStats,
  getUserById,
  type SupportQueryStats,
} from "../api";

/* ---------------- colors ---------------- */
const C = {
  panel: "#211E1E",
  cream: "#FFE8B6",
  active: "#91451F",
  border: "#45413D",
  white: "#F7E5D7",
  muted: "#C9C3B6",
  field: "#303030",
};

/* ---------------- types ---------------- */
type QueryStatus = "Pending" | "In Process" | "Resolved";

type QueryRow = {
  id: string;
  name: string;
  avatar: string;
  role: string;
  subject: string;
  status: QueryStatus;
};

type StatItem = {
  label: string;
  value: string;
  icon: IconType;
};

/** ek page par kitni rows dikhani hain (design mein 5) */
const PAGE_SIZE = 5;

const statusStyle: Record<
  QueryStatus,
  { color: string; border: string; bg: string }
> = {
  Pending: {
    color: "#E65A5A",
    border: "#E65A5A",
    bg: "rgba(230, 90, 90, 0.12)",
  },
  "In Process": { color: "#E8DCC8", border: "#77716B", bg: "#303030" },
  Resolved: {
    color: "#45C165",
    border: "#45C165",
    bg: "rgba(69, 193, 101, 0.12)",
  },
};

/* ---------------- helpers ---------------- */

// Backend status -> UI label (kai spellings sambhalta hai)
function toStatus(raw: unknown): QueryStatus {
  const s = String(raw ?? "")
    .toUpperCase()
    .replace(/[\s-]/g, "_");
  if (s === "RESOLVED" || s === "COMPLETED" || s === "CLOSED") {
    return "Resolved";
  }
  if (s === "IN_PROGRESS" || s === "IN_PROCESS" || s === "PROCESSING") {
    return "In Process";
  }
  return "Pending";
}

function fullName(u: any) {
  if (!u) return "Unknown";
  return `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "Unknown";
}

function capitalize(s: unknown) {
  const v = String(s ?? "");
  return v ? v.charAt(0).toUpperCase() + v.slice(1).toLowerCase() : "-";
}

// Minutes -> "45 m" / "2 h" / "1 d"
function formatMinutes(m: number) {
  if (!m) return "0 m";
  if (m < 60) return `${Math.round(m)} m`;
  if (m < 1440) return `${(m / 60).toFixed(1).replace(/\.0$/, "")} h`;
  return `${(m / 1440).toFixed(1).replace(/\.0$/, "")} d`;
}

/* ---------------- chhote reusable components ---------------- */

function StatCard({ label, value, icon: Icon }: StatItem) {
  return (
    <Box
      bg={C.cream}
      style={{
        position: "relative",
        padding: "18px 22px",
        borderRadius: 12,
        boxShadow: "0 3px 8px rgba(0,0,0,0.35)",
      }}
    >
      <Text size="13px" c="#51473B" style={{ lineHeight: 1 }}>
        {label}
      </Text>
      <Text
        size="22px"
        fw={700}
        c="#171717"
        style={{ lineHeight: 1, marginTop: 10 }}
      >
        {value}
      </Text>
      <Icon size={22} color="#2B2622" />
    </Box>
  );
}

function StatusBadge({ status }: { status: QueryStatus }) {
  const s = statusStyle[status];
  return (
    <Box
      component="span"
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 26,
        padding: "0 10px",
        borderRadius: 4,
        border: `1px solid ${s.border}`,
        background: s.bg,
        color: s.color,
        fontSize: 13,
        lineHeight: 1,
      }}
    >
      {status}
    </Box>
  );
}

/* ---------------- page ---------------- */

export default function Queries() {
  const [stats, setStats] = useState<SupportQueryStats | null>(null);
  const [rows, setRows] = useState<QueryRow[]>([]);
  const [serverPages, setServerPages] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  // Stats: sirf ek baar
  useEffect(() => {
    getSupportQueryStats()
      .then(setStats)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not load stats"),
      );
  }, []);

  // Queries: har page change par
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const res: any = await getSupportQueries(page, PAGE_SIZE);
        const items: any[] = Array.isArray(res)
          ? res
          : (res?.data ?? res?.items ?? res?.queries ?? []);

        // Is page ke saare users ki details (har user sirf ek baar)
        const ids = [
          ...new Set(items.map((q) => q.userId).filter(Boolean)),
        ] as string[];

        const entries = await Promise.all(
          ids.map(async (id) => {
            try {
              const u: any = await getUserById(id);
              return [id, u?.data ?? u] as const;
            } catch {
              return [id, null] as const;
            }
          }),
        );
        const users = Object.fromEntries(entries);

        if (!cancelled) {
          setRows(
            items.map((q) => {
              const u = users[q.userId];
              return {
                id: String(q.id),
                name: fullName(u),
                avatar: u?.avatarUrl || authorImg,
                role: capitalize(u?.role),
                subject: q.subject ?? "-",
                status: toStatus(q.status),
              };
            }),
          );
          // Backend pagination bheje to wahi, warna frontend par pages banayenge
          setServerPages(res?.pagination?.totalPages ?? null);
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
  }, [page]);

  const statItems: StatItem[] = [
    {
      label: "Total Queries",
      value: String(stats?.totalQueries ?? 0),
      icon: FaUsers,
    },
    {
      label: "Pending Queries",
      value: String(stats?.pendingQueries ?? 0),
      icon: FaUserClock,
    },
    {
      label: "Resolution Rate",
      value: `${stats?.resolutionRate ?? 0}%`,
      icon: FaUserSlash,
    },
    {
      label: "Avg Time Response",
      value: formatMinutes(stats?.avgResponseTimeMinutes ?? 0),
      icon: FaUserCog,
    },
  ];

  // Search sirf current rows par chalta hai
  const query = search.trim().toLowerCase();
  const filtered = rows.filter(
    (r) =>
      !query ||
      `${r.name} ${r.role} ${r.subject} ${r.status}`
        .toLowerCase()
        .includes(query),
  );

  // ---------- Pagination ----------
  const totalPages =
    serverPages ?? Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = serverPages ? page : Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const currentRows = serverPages
    ? filtered
    : filtered.slice(start, start + PAGE_SIZE);
  // --------------------------------

  return (
    <ReaderLayout title="Query Management" activePage="queries">
      <style>{`
        .hide-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .action:hover { opacity: .85; }
      `}</style>

      {/* Inner panel */}
      <Box
        bg={C.panel}
        style={{
          flex: 1,
          minHeight: 0,
          padding: "24px 28px 18px",
          borderRadius: 20,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        {/* Stat cards */}
        <Box
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 20,
            flexShrink: 0,
          }}
        >
          {statItems.map((item) => (
            <StatCard key={item.label} {...item} />
          ))}
        </Box>

        {/* Title + search + filter */}
        <Flex
          align="center"
          justify="space-between"
          mt={32}
          style={{ flexShrink: 0 }}
        >
          <Text size="26px" fw={600} c={C.cream} style={{ lineHeight: 1 }}>
            All Queries
          </Text>

          <Flex align="center" gap={18}>
            <TextInput
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              leftSection={<FaSearch size={13} color={C.cream} />}
              styles={{
                root: { width: 260 },
                input: {
                  height: 38,
                  background: C.field,
                  border: "none",
                  borderRadius: 999,
                  color: "#FFFFFF",
                  paddingLeft: 38,
                  fontSize: 14,
                },
              }}
            />

            <UnstyledButton
              className="action"
              style={{
                width: 108,
                height: 38,
                borderRadius: 999,
                background: C.field,
                color: C.cream,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <FaFilter size={12} />
              <Text size="14px">Filter</Text>
            </UnstyledButton>
          </Flex>
        </Flex>

        {/* Table */}
        <Box
          className="hide-scrollbar"
          mt={18}
          style={{ flex: 1, minHeight: 0, overflow: "auto" }}
        >
          {loading ? (
            <Flex justify="center" py="xl">
              <Loader color={C.cream} size="sm" />
            </Flex>
          ) : error ? (
            <Text ta="center" c="#FF6B6B" size="sm" py="xl">
              {error}
            </Text>
          ) : (
            <Table
              verticalSpacing={0}
              horizontalSpacing={0}
              styles={{
                table: {
                  width: "100%",
                  minWidth: 560,
                  tableLayout: "fixed",
                  borderCollapse: "collapse",
                },
                th: {
                  height: 42,
                  padding: 0,
                  color: C.cream,
                  fontSize: 18,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  textAlign: "left",
                  borderBottom: "none",
                },
                td: {
                  height: 74,
                  padding: 0,
                  verticalAlign: "middle",
                  borderTop: "none",
                  borderBottom: `1px solid ${C.border}`,
                },
              }}
            >
              <Table.Thead>
                <Table.Tr>
                  <Table.Th w="26%">User Name</Table.Th>
                  <Table.Th w="19%">Role</Table.Th>
                  <Table.Th w="25%">Subject</Table.Th>
                  <Table.Th w="19%">Status</Table.Th>
                  <Table.Th w="11%">Action</Table.Th>
                </Table.Tr>
              </Table.Thead>

              <Table.Tbody>
                {currentRows.map((row) => (
                  <Table.Tr key={row.id}>
                    <Table.Td>
                      <Flex align="center" gap={12}>
                        <img
                          src={row.avatar}
                          alt={row.name}
                          onError={(e) => {
                            e.currentTarget.src = authorImg;
                          }}
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: "50%",
                            objectFit: "cover",
                            flexShrink: 0,
                          }}
                        />
                        <Text
                          size="14px"
                          c={C.white}
                          style={{ lineHeight: 1.2, maxWidth: 100 }}
                        >
                          {row.name}
                        </Text>
                      </Flex>
                    </Table.Td>

                    <Table.Td>
                      <Text size="15px" c={C.muted}>
                        {row.role}
                      </Text>
                    </Table.Td>

                    <Table.Td>
                      <Text
                        size="15px"
                        c={C.white}
                        style={{ paddingRight: 12, lineHeight: 1.25 }}
                      >
                        {row.subject}
                      </Text>
                    </Table.Td>

                    <Table.Td>
                      <StatusBadge status={row.status} />
                    </Table.Td>

                    <Table.Td>
                      <UnstyledButton
                        className="action"
                        aria-label="View query"
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          border: `1px solid ${C.muted}`,
                          color: C.muted,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <FaRegEye size={16} />
                      </UnstyledButton>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}

          {!loading && !error && currentRows.length === 0 && (
            <Text ta="center" c={C.muted} size="sm" py="xl">
              No queries found.
            </Text>
          )}
        </Box>
      </Box>

      <Pagination
        page={currentPage}
        totalPages={totalPages}
        onChange={setPage}
      />
    </ReaderLayout>
  );
}
