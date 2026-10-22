import { useState } from "react";
import {
  Box,
  Flex,
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
  id: number;
  name: string;
  role: string;
  subject: string;
  status: QueryStatus;
};

type StatItem = {
  label: string;
  value: string;
  icon: IconType;
};

/* ---------------- data (baad mein API se aayega) ---------------- */
const stats: StatItem[] = [
  { label: "Total Queries", value: "89", icon: FaUsers },
  { label: "Pending Queries", value: "24", icon: FaUserClock },
  { label: "Resolution Rate", value: "2.4 h", icon: FaUserSlash },
  { label: "Avg Time Response", value: "1 d", icon: FaUserCog },
];

const rows: QueryRow[] = [
  {
    id: 1,
    name: "Cordell Edwards",
    role: "Author",
    subject: "Subscription Payment Failed",
    status: "Pending",
  },
  {
    id: 2,
    name: "Cordell Edwards",
    role: "Author",
    subject: "Subscription Payment Failed",
    status: "In Process",
  },
  {
    id: 3,
    name: "Cordell Edwards",
    role: "Author",
    subject: "Subscription Payment Failed",
    status: "In Process",
  },
  {
    id: 4,
    name: "Cordell Edwards",
    role: "Author",
    subject: "Subscription Payment Failed",
    status: "In Process",
  },
  {
    id: 5,
    name: "Cordell Edwards",
    role: "Author",
    subject: "Subscription Payment Failed",
    status: "Resolved",
  },
  // neeche ke 3 rows sirf page 2 dikhane ke liye hain (asli data mein zaroorat nahi)
  {
    id: 6,
    name: "Cordell Edwards",
    role: "Author",
    subject: "Subscription Payment Failed",
    status: "Pending",
  },
  {
    id: 7,
    name: "Cordell Edwards",
    role: "Author",
    subject: "Subscription Payment Failed",
    status: "Resolved",
  },
  {
    id: 8,
    name: "Cordell Edwards",
    role: "Author",
    subject: "Subscription Payment Failed",
    status: "In Process",
  },
];

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

/* ---------------- chhote reusable components ----------------
   Baad mein inhe components/ folder mein alag files bana kar
   (StatCard.tsx, StatusBadge.tsx) dusre pages mein bhi use kar sakti ho.
---------------------------------------------------------------- */

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
  // ---------- Pagination ----------
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const currentRows = rows.slice(start, start + PAGE_SIZE);
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
          {stats.map((item) => (
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
                        src={authorImg}
                        alt={row.name}
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
        </Box>
      </Box>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </ReaderLayout>
  );
}
