import { useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Flex,
  Group,
  Loader,
  Modal,
  Select,
  SimpleGrid,
  Table,
  Text,
  Textarea,
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
  FaPlus,
} from "react-icons/fa";

import ReaderLayout from "./ReaderLayout";
import { useAvatarSrc } from "./useAvatarSrc";
import Pagination from "./Pagination";
import {
  getMyProfile,
  getSupportQueries,
  getSupportQueryStats,
  getSupportQueryById,
  createSupportQuery,
  updateSupportQuery,
  deleteSupportQuery,
  getUserById,
  type ApiSupportQuery,
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
  number: "#2A1005", // stat cards ka text (Author / Reader Management jaisa)
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

/** ek page par kitni rows dikhani hain (chhote cards ke baad 5 rows fit hoti hain) */
const PAGE_SIZE = 4;

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

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROCESS", label: "In Process" },
  { value: "RESOLVED", label: "Resolved" },
];

const modalStyles = {
  content: { background: C.panel, borderRadius: 16 },
  header: { background: C.panel },
  title: { color: C.cream, fontSize: 20, fontWeight: 600 },
  close: { color: C.cream },
};

const inputStyles = {
  label: { color: C.cream, marginBottom: 6, fontSize: 14 },
  input: {
    background: C.field,
    border: `1px solid ${C.border}`,
    color: "#FFFFFF",
    borderRadius: 8,
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

// 16 Nov, 2026
function formatDate(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("en-GB", { month: "short" });
  return `${day} ${month}, ${d.getFullYear()}`;
}

/* ---------------- chhote reusable components ---------------- */

// Author / Reader Management ke cards jaisa: title upar left, number neeche, icon upar right
function StatCard({ label, value, icon: Icon }: StatItem) {
  return (
    <Box
      style={{
        backgroundColor: C.cream,
        borderRadius: "14px",
        padding: "12px 14px",
      }}
    >
      <Group justify="space-between" align="flex-start">
        <Box>
          <Text size="12px" c={C.number} fw={600}>
            {label}
          </Text>

          <Text size="22px" fw={800} c={C.number} mt={2}>
            {value}
          </Text>
        </Box>

        <Icon size={18} color={C.number} />
      </Group>
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

const initialsOf = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("") || "?";

function UserAvatar({
  url,
  name,
  size = 34,
}: {
  url?: string | null;
  name: string;
  size?: number;
}) {
  const src = useAvatarSrc(url);
  return (
    <Avatar
      src={src}
      radius="xl"
      size={size}
      styles={{
        placeholder: {
          backgroundColor: "#91451F",
          color: "#FFE8B6",
          fontWeight: 700,
          fontSize: Math.round(size * 0.36),
        },
      }}
    >
      {initialsOf(name)}
    </Avatar>
  );
}

/* ---------------- query detail modal (admin) ---------------- */

function QueryDetailModal({
  queryId,
  userName,
  onClose,
  onChanged,
}: {
  queryId: string | null; // null ho to modal band
  userName: string;
  onClose: () => void;
  onChanged: () => void; // update/delete ke baad list + stats dobara mangwane ke liye
}) {
  const [item, setItem] = useState<ApiSupportQuery | null>(null);
  const [status, setStatus] = useState<string | null>("PENDING");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!queryId) return;
    setItem(null);
    setLoading(true);
    setError("");
    getSupportQueryById(queryId)
      .then((res: any) => {
        const q: ApiSupportQuery = res?.data ?? res;
        setItem(q);
        setStatus(q.status);
        setReply(q.adminReply ?? "");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [queryId]);

  async function handleSave() {
    if (!queryId || !status) return;
    try {
      setSaving(true);
      setError("");
      await updateSupportQuery(queryId, {
        status,
        ...(reply.trim() ? { adminReply: reply.trim() } : {}),
      });
      onChanged();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!queryId || !window.confirm("Delete this query?")) return;
    try {
      setSaving(true);
      setError("");
      await deleteSupportQuery(queryId);
      onChanged();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      opened={!!queryId}
      onClose={onClose}
      title="Query Details"
      centered
      size={520}
      styles={modalStyles}
      overlayProps={{ backgroundOpacity: 0.6, blur: 2 }}
    >
      <style>{`
        .sq-option { color: ${C.white}; }
        .sq-option:hover, .sq-option[data-combobox-selected] { background: ${C.active}; }
      `}</style>

      {loading || !item ? (
        <Flex justify="center" py="md">
          {error ? (
            <Text c="#FF6B6B" size="sm">
              {error}
            </Text>
          ) : (
            <Loader color={C.cream} size="sm" />
          )}
        </Flex>
      ) : (
        <Flex direction="column" gap={14}>
          <Flex align="center" justify="space-between">
            <Text size="sm" c={C.muted}>
              From:{" "}
              <Text span c={C.white}>
                {userName}
              </Text>
            </Text>
            <StatusBadge status={toStatus(item.status)} />
          </Flex>

          <Box
            style={{
              background: C.field,
              borderRadius: 10,
              padding: "12px 14px",
            }}
          >
            <Text fw={600} c={C.cream} size="15px">
              {item.subject}
            </Text>
            <Text
              size="14px"
              c={C.white}
              mt={6}
              style={{ whiteSpace: "pre-wrap" }}
            >
              {item.message}
            </Text>
            <Text size="12px" c={C.muted} mt={8}>
              {formatDate(item.createdAt)}
            </Text>
          </Box>

          <Select
            label="Status"
            data={STATUS_OPTIONS}
            value={status}
            onChange={setStatus}
            allowDeselect={false}
            classNames={{ option: "sq-option" }}
            styles={{
              ...inputStyles,
              dropdown: {
                background: C.field,
                border: `1px solid ${C.border}`,
              },
            }}
          />

          <Textarea
            label="Reply"
            placeholder="Write your reply"
            minRows={3}
            autosize
            value={reply}
            onChange={(e) => setReply(e.currentTarget.value)}
            styles={inputStyles}
          />

          {error && (
            <Text c="#FF6B6B" size="sm">
              {error}
            </Text>
          )}

          <Flex justify="space-between" mt={4}>
            <Button
              variant="outline"
              color="red"
              radius="xl"
              onClick={handleDelete}
              disabled={saving}
            >
              Delete
            </Button>
            <Button
              radius="xl"
              onClick={handleSave}
              loading={saving}
              styles={{ root: { background: C.active, color: "#FFFFFF" } }}
            >
              Save
            </Button>
          </Flex>
        </Flex>
      )}
    </Modal>
  );
}

/* ---------------- admin screen ---------------- */

function AdminQueries() {
  const [stats, setStats] = useState<SupportQueryStats | null>(null);
  const [rows, setRows] = useState<QueryRow[]>([]);
  const [serverPages, setServerPages] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  // update/delete ke baad list aur stats dobara mangwane ke liye
  const [refresh, setRefresh] = useState(0);
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(
    null,
  );

  // Stats: shuru mein aur har update/delete ke baad
  useEffect(() => {
    getSupportQueryStats()
      .then(setStats)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not load stats"),
      );
  }, [refresh]);

  // Queries: har page change ya update/delete par
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
                avatar: u?.avatarUrl ?? "",

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
  }, [page, refresh]);

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

      {/* Inner panel (Author / Reader Management jaisi padding aur gap) */}
      <Box
        bg={C.panel}
        style={{
          flex: 1,
          minHeight: 0,
          padding: "20px",
          borderRadius: 20,
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        {/* Stat cards */}
        <SimpleGrid cols={4} spacing="md" style={{ flexShrink: 0 }}>
          {statItems.map((item) => (
            <StatCard key={item.label} {...item} />
          ))}
        </SimpleGrid>

        {/* Title + search + filter */}
        <Flex align="center" justify="space-between" style={{ flexShrink: 0 }}>
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
                        <UserAvatar
                          url={row.avatar}
                          name={row.name}
                          size={38}
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
                        onClick={() =>
                          setSelected({ id: row.id, name: row.name })
                        }
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

      <QueryDetailModal
        queryId={selected?.id ?? null}
        userName={selected?.name ?? ""}
        onClose={() => setSelected(null)}
        onChanged={() => setRefresh((n) => n + 1)}
      />
    </ReaderLayout>
  );
}

/* ---------------- reader / author screen ---------------- */

function MyQueries() {
  const [rows, setRows] = useState<ApiSupportQuery[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

  // query dekhna
  const [viewing, setViewing] = useState<ApiSupportQuery | null>(null);

  // nayi query bhejna
  const [creating, setCreating] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const res: any = await getSupportQueries(page, PAGE_SIZE);
        const items: ApiSupportQuery[] = Array.isArray(res)
          ? res
          : (res?.data ?? []);
        if (!cancelled) {
          setRows(items);
          setTotalPages(res?.pagination?.totalPages ?? 1);
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
  }, [page, refresh]);

  function openCreate() {
    setSubject("");
    setMessage("");
    setFormError("");
    setCreating(true);
  }

  async function handleSend() {
    if (!subject.trim() || !message.trim()) {
      setFormError("Please enter both subject and message.");
      return;
    }
    try {
      setSending(true);
      setFormError("");
      await createSupportQuery({
        subject: subject.trim(),
        message: message.trim(),
      });
      setCreating(false);
      setPage(1);
      setRefresh((n) => n + 1);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Could not send query");
    } finally {
      setSending(false);
    }
  }

  return (
    <ReaderLayout title="Support" activePage="queries">
      <style>{`
        .hide-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .action:hover { opacity: .85; }
      `}</style>

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
        {/* Title + New Query */}
        <Flex align="center" justify="space-between" style={{ flexShrink: 0 }}>
          <Text size="26px" fw={600} c={C.cream} style={{ lineHeight: 1 }}>
            My Queries
          </Text>

          <Button
            radius="xl"
            leftSection={<FaPlus size={12} />}
            onClick={openCreate}
            styles={{
              root: { background: C.active, color: "#FFFFFF", height: 38 },
            }}
          >
            New Query
          </Button>
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
                  <Table.Th w="38%">Subject</Table.Th>
                  <Table.Th w="22%">Status</Table.Th>
                  <Table.Th w="26%">Date</Table.Th>
                  <Table.Th w="14%">Action</Table.Th>
                </Table.Tr>
              </Table.Thead>

              <Table.Tbody>
                {rows.map((row) => (
                  <Table.Tr key={row.id}>
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
                      <StatusBadge status={toStatus(row.status)} />
                    </Table.Td>

                    <Table.Td>
                      <Text size="15px" c={C.muted}>
                        {formatDate(row.createdAt)}
                      </Text>
                    </Table.Td>

                    <Table.Td>
                      <UnstyledButton
                        className="action"
                        aria-label="View query"
                        onClick={() => setViewing(row)}
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

          {!loading && !error && rows.length === 0 && (
            <Text ta="center" c={C.muted} size="sm" py="xl">
              No queries found.
            </Text>
          )}
        </Box>
      </Box>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {/* Nayi query */}
      <Modal
        opened={creating}
        onClose={() => setCreating(false)}
        title="New Query"
        centered
        size={520}
        styles={modalStyles}
        overlayProps={{ backgroundOpacity: 0.6, blur: 2 }}
      >
        <Flex direction="column" gap={14}>
          <TextInput
            label="Subject"
            placeholder="What is your issue about?"
            value={subject}
            onChange={(e) => setSubject(e.currentTarget.value)}
            styles={inputStyles}
          />
          <Textarea
            label="Message"
            placeholder="Describe your issue"
            minRows={4}
            autosize
            value={message}
            onChange={(e) => setMessage(e.currentTarget.value)}
            styles={inputStyles}
          />

          {formError && (
            <Text c="#FF6B6B" size="sm">
              {formError}
            </Text>
          )}

          <Flex justify="flex-end" mt={4}>
            <Button
              radius="xl"
              onClick={handleSend}
              loading={sending}
              styles={{ root: { background: C.active, color: "#FFFFFF" } }}
            >
              Send
            </Button>
          </Flex>
        </Flex>
      </Modal>

      {/* Query aur admin ka jawab */}
      <Modal
        opened={!!viewing}
        onClose={() => setViewing(null)}
        title="Query Details"
        centered
        size={520}
        styles={modalStyles}
        overlayProps={{ backgroundOpacity: 0.6, blur: 2 }}
      >
        {viewing && (
          <Flex direction="column" gap={14}>
            <Flex align="center" justify="space-between">
              <Text size="sm" c={C.muted}>
                {formatDate(viewing.createdAt)}
              </Text>
              <StatusBadge status={toStatus(viewing.status)} />
            </Flex>

            <Box
              style={{
                background: C.field,
                borderRadius: 10,
                padding: "12px 14px",
              }}
            >
              <Text fw={600} c={C.cream} size="15px">
                {viewing.subject}
              </Text>
              <Text
                size="14px"
                c={C.white}
                mt={6}
                style={{ whiteSpace: "pre-wrap" }}
              >
                {viewing.message}
              </Text>
            </Box>

            <Box
              style={{
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: "12px 14px",
              }}
            >
              <Text size="13px" c={C.cream} fw={600}>
                Admin Reply
              </Text>
              <Text
                size="14px"
                c={viewing.adminReply ? C.white : C.muted}
                mt={6}
                style={{ whiteSpace: "pre-wrap" }}
              >
                {viewing.adminReply || "No reply yet."}
              </Text>
            </Box>
          </Flex>
        )}
      </Modal>
    </ReaderLayout>
  );
}

/* ---------------- page: role ke hisaab se screen ---------------- */

export default function Queries() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    getMyProfile()
      .then((res: any) => {
        const u = res?.data ?? res;
        setRole(String(u?.role ?? "").toUpperCase());
      })
      .catch(() => setRole(""));
  }, []);

  // Role aane tak wait, taake admin ke API (jo reader ke liye 403 dete hain) na chalein
  if (role === null) {
    return (
      <ReaderLayout title="Query Management" activePage="queries">
        <Flex justify="center" py="xl">
          <Loader color={C.cream} size="sm" />
        </Flex>
      </ReaderLayout>
    );
  }

  return role === "ADMIN" ? <AdminQueries /> : <MyQueries />;
}
