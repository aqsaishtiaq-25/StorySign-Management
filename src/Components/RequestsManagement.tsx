import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Flex,
  Text,
  UnstyledButton,
  Group,
  TextInput,
  Avatar,
  SimpleGrid,
  Table,
  ActionIcon,
  Loader,
} from "@mantine/core";

import { MdSearch } from "react-icons/md";

import {
  FiFilter,
  FiClipboard,
  FiLoader,
  FiXCircle,
  FiCheckCircle,
  FiEye,
} from "react-icons/fi";

import ReaderLayout from "./ReaderLayout";
import Pagination from "./Pagination"; // path apne folder ke hisaab se theek kar lein
import readerImg from "../assets/Author-image.png";
import {
  getAutographRequests,
  getAutographRequestStats,
  type AutographStats,
} from "../api";

type RequestStatus = "Pending" | "In progress" | "Delivered" | "Rejected";

interface RequestRow {
  id: string;
  shortId: string;
  readerName: string;
  readerAvatar: string;
  authorName: string;
  authorAvatar: string;
  book: string;
  date: string;
  status: RequestStatus;
}

function formatDate(value: unknown) {
  if (!value) return "-";
  const d = new Date(String(value));
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fullName(u: any) {
  if (!u) return "Unknown";
  return `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "Unknown";
}

// Backend status (PENDING / IN_PROGRESS / COMPLETED / REJECTED) -> UI label
function statusLabel(raw: unknown): RequestStatus {
  const s = String(raw ?? "").toUpperCase();
  if (s === "COMPLETED") return "Delivered";
  if (s === "REJECTED") return "Rejected";
  if (s === "IN_PROGRESS") return "In progress";
  return "Pending";
}

function toRow(r: any): RequestRow {
  return {
    id: String(r.id),
    shortId: String(r.id).slice(0, 8),
    readerName: fullName(r.reader),
    readerAvatar: r.reader?.avatarUrl || readerImg,
    authorName: fullName(r.author),
    authorAvatar: r.author?.avatarUrl || readerImg,
    book: r.ebook?.title ?? "-",
    date: formatDate(r.createdAt),
    status: statusLabel(r.status),
  };
}

export default function RequestsManagement() {
  const navigate = useNavigate();

  const [rows, setRows] = useState<RequestRow[]>([]);
  const [stats, setStats] = useState<AutographStats | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [tableSearch, setTableSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const PAGE_SIZE = 5;

  const innerContainerBg = "#211E1E";
  const accentCardBg = "#FFE8B6";
  const numberColor = "#2A1005";

  // Stats: sirf ek baar
  useEffect(() => {
    getAutographRequestStats()
      .then(setStats)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not load stats"),
      );
  }, []);

  // Requests: har page change par
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const res = await getAutographRequests(page, PAGE_SIZE);
        const items: any[] = res.data ?? [];

        if (!cancelled) {
          setRows(items.map(toRow));
          setTotalPages(res.pagination?.totalPages ?? 1);
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

  // Stats ke field names alag hon to yahan keys badal lein
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = stats?.[k];
      if (v !== undefined && v !== null) return Number(v);
    }
    return 0;
  };

  const statCards = [
    { title: "Total Requests", value: pick("total"), icon: FiClipboard },
    {
      title: "In Progress Requests",
      value: pick("inProgress", "in_progress", "inprogress"),
      icon: FiLoader,
    },
    { title: "Rejected Requests", value: pick("rejected"), icon: FiXCircle },
    {
      title: "Completed Requests",
      value: pick("completed"),
      icon: FiCheckCircle,
    },
  ];

  // Search abhi sirf current page ki rows par chalta hai
  const query = tableSearch.trim().toLowerCase();
  const visibleRows = rows.filter(
    (r) =>
      !query ||
      `${r.shortId} ${r.readerName} ${r.authorName} ${r.book} ${r.date} ${r.status}`
        .toLowerCase()
        .includes(query),
  );

  const getStatusStyle = (status: RequestStatus) => {
    if (status === "Delivered") {
      return {
        backgroundColor: "rgba(0, 110, 35, 0.4)",
        color: "#00D639",
        border: "1px solid rgba(0, 214, 57, 0.7)",
      };
    }

    if (status === "Rejected") {
      return {
        backgroundColor: "rgba(170, 20, 20, 0.4)",
        color: "#FF2B2B",
        border: "1px solid rgba(255, 43, 43, 0.6)",
      };
    }

    return {
      backgroundColor: "rgba(200, 185, 150, 0.3)",
      color: accentCardBg,
      border: "1px solid rgba(255,232,182,0.6)",
    };
  };

  const thStyle = {
    color: accentCardBg,
    fontSize: "14px",
    fontWeight: 600,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottom: "none",
  };

  const tdStyle = {
    borderBottom: "1px solid rgba(255,255,255,0.12)",
  };

  const renderPerson = (name: string, avatar: string) => {
    const [first, ...rest] = name.split(" ");

    return (
      <Group gap={8} wrap="nowrap">
        <Avatar src={avatar} size={34} radius="xl" />

        <Text size="11px" c="#FFFFFF" style={{ lineHeight: 1.25 }}>
          {first}
          <br />
          {rest.join(" ")}
        </Text>
      </Group>
    );
  };

  return (
    <ReaderLayout title="Autograph Requests" activePage="requests">
      <Box
        style={{
          backgroundColor: innerContainerBg,
          borderRadius: "20px",
          flex: 1,
          minHeight: 0,
          padding: "20px",
          boxSizing: "border-box",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <SimpleGrid cols={4} spacing="md" style={{ flexShrink: 0 }}>
          {statCards.map((card) => {
            const CardIcon = card.icon;

            return (
              <Box
                key={card.title}
                style={{
                  backgroundColor: accentCardBg,
                  borderRadius: "14px",
                  padding: "12px 14px",
                }}
              >
                <Group justify="space-between" align="flex-start">
                  <Box>
                    <Text size="12px" c={numberColor} fw={600}>
                      {card.title}
                    </Text>

                    <Text size="22px" fw={800} c={numberColor} mt={2}>
                      {card.value.toLocaleString()}
                    </Text>
                  </Box>

                  <CardIcon size={18} color={numberColor} />
                </Group>
              </Box>
            );
          })}
        </SimpleGrid>

        <Flex justify="space-between" align="center" style={{ flexShrink: 0 }}>
          <Text size="22px" fw={700} c={accentCardBg}>
            All Requests
          </Text>

          <Group gap={16}>
            <TextInput
              placeholder="Search"
              value={tableSearch}
              onChange={(event) => setTableSearch(event.currentTarget.value)}
              leftSection={<MdSearch size={17} color="#D0D0D0" />}
              styles={{
                input: {
                  width: "220px",
                  height: "36px",
                  backgroundColor: "#383838",
                  border: "none",
                  borderRadius: "20px",
                  color: "#FFFFFF",
                  paddingLeft: "36px",
                  fontSize: "12px",
                },
              }}
            />

            <UnstyledButton>
              <Box
                px={16}
                style={{
                  height: 36,
                  borderRadius: "20px",
                  backgroundColor: "#383838",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                }}
              >
                <FiFilter size={15} color="#E0E0E0" />

                <Text size="12px" c="#E0E0E0">
                  Filter
                </Text>
              </Box>
            </UnstyledButton>
          </Group>
        </Flex>

        <Box style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
          {loading ? (
            <Flex justify="center" py="xl">
              <Loader color={accentCardBg} size="sm" />
            </Flex>
          ) : error ? (
            <Text ta="center" c="#FF6B6B" size="sm" py="xl">
              {error}
            </Text>
          ) : (
            <Table
              verticalSpacing={8}
              horizontalSpacing={0}
              style={{
                color: "#CCCCCC",
                fontSize: "12px",
                width: "100%",
                tableLayout: "fixed",
              }}
            >
              <Table.Thead>
                <Table.Tr style={{ borderBottom: "none" }}>
                  <Table.Th style={{ ...thStyle, width: "11%" }}>ID</Table.Th>
                  <Table.Th style={{ ...thStyle, width: "18%" }}>
                    Reader
                  </Table.Th>
                  <Table.Th style={{ ...thStyle, width: "18%" }}>
                    Author
                  </Table.Th>
                  <Table.Th style={{ ...thStyle, width: "16%" }}>Book</Table.Th>
                  <Table.Th style={{ ...thStyle, width: "15%" }}>Date</Table.Th>
                  <Table.Th style={{ ...thStyle, width: "12%" }}>
                    Status
                  </Table.Th>
                  <Table.Th
                    style={{
                      ...thStyle,
                      width: "10%",
                      textAlign: "right",
                      paddingRight: 8,
                    }}
                  >
                    Action
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>

              <Table.Tbody>
                {visibleRows.map((request) => (
                  <Table.Tr key={request.id} style={{ borderBottom: "none" }}>
                    <Table.Td c="#E0E0E0" py={12} style={tdStyle}>
                      {request.shortId}
                    </Table.Td>

                    <Table.Td py={12} style={tdStyle}>
                      {renderPerson(request.readerName, request.readerAvatar)}
                    </Table.Td>

                    <Table.Td py={12} style={tdStyle}>
                      {renderPerson(request.authorName, request.authorAvatar)}
                    </Table.Td>

                    <Table.Td c="#FFFFFF" fw={500} py={12} style={tdStyle}>
                      {request.book}
                    </Table.Td>

                    <Table.Td c="#E0E0E0" py={12} style={tdStyle}>
                      {request.date}
                    </Table.Td>

                    <Table.Td py={12} style={tdStyle}>
                      <Box
                        px={10}
                        py={4}
                        style={{
                          ...getStatusStyle(request.status),
                          borderRadius: "6px",
                          display: "inline-block",
                          fontSize: "10px",
                          fontWeight: 500,
                          lineHeight: 1.1,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {request.status}
                      </Box>
                    </Table.Td>

                    <Table.Td py={12} style={tdStyle}>
                      <Group justify="flex-end" wrap="nowrap">
                        <ActionIcon
                          variant="transparent"
                          size={32}
                          radius="xl"
                          onClick={() =>
                            navigate(`/request-detail/${request.id}`)
                          }
                          style={{
                            backgroundColor: "transparent",
                            border: "1px solid rgba(255,232,182,0.75)",
                            color: accentCardBg,
                          }}
                        >
                          <FiEye size={15} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}

          {!loading && !error && visibleRows.length === 0 && (
            <Text ta="center" c="#B8B4B0" size="sm" py="xl">
              No requests found.
            </Text>
          )}
        </Box>
      </Box>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </ReaderLayout>
  );
}
