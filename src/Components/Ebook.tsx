import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Flex,
  Text,
  Group,
  TextInput,
  SimpleGrid,
  Table,
  UnstyledButton,
  ActionIcon,
  Loader,
} from "@mantine/core";

import { MdSearch } from "react-icons/md";
import {
  FiFilter,
  FiFileText,
  FiEdit3,
  FiBookOpen,
  FiSlash,
  FiEye,
} from "react-icons/fi";

import ReaderLayout from "./ReaderLayout";
import Pagination from "./Pagination";
import bookCover from "../assets/Ebook-img.png";
import authorAvatar from "../assets/Reader-image.png";
import { getEbooks, getEbookStats, getUserById, type EbookStats } from "../api";

type BookStatus = "Signed" | "Unsigned" | "Rejected";

interface Book {
  id: string;
  title: string;
  author: string;
  date: string;
  status: BookStatus;
  cover: string;
  avatar: string;
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

// Backend ki ebook + reader ki details -> UI ka Book
function toBook(e: any, readers: Record<string, any>): Book {
  const reader = readers[e.readerId];
  const name = reader
    ? `${reader.firstName ?? ""} ${reader.lastName ?? ""}`.trim()
    : "";

  return {
    id: String(e.id),
    title: e.title ?? "Untitled",
    author: name || "Unknown",
    date: formatDate(e.createdAt),
    status: e.isSigned ? "Signed" : "Unsigned",
    cover: e.coverUrl || bookCover,
    avatar: reader?.avatarUrl || authorAvatar,
  };
}

export default function EbookManagement() {
  const navigate = useNavigate();

  const [books, setBooks] = useState<Book[]>([]);
  const [stats, setStats] = useState<EbookStats | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [tableSearch, setTableSearch] = useState("");
  const [signedOnly, setSignedOnly] = useState(false);
  const [page, setPage] = useState(1);

  const pageSize = 5;

  const innerContainerBg = "#211E1E";
  const accentCardBg = "#FFE8B6";
  const numberColor = "#2A1005";

  // Stats: sirf ek baar
  useEffect(() => {
    getEbookStats()
      .then(setStats)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not load stats"),
      );
  }, []);

  // Ebooks: har page change par
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const res = await getEbooks(page, pageSize);
        const items: any[] = res.data ?? [];

        // Is page ke saare readers ki details (har reader ek hi baar)
        const ids = [
          ...new Set(items.map((e) => e.readerId).filter(Boolean)),
        ] as string[];

        const entries = await Promise.all(
          ids.map(async (id) => {
            try {
              const u = await getUserById(id);
              return [id, u.data ?? u] as const;
            } catch {
              return [id, null] as const;
            }
          }),
        );
        const readers = Object.fromEntries(entries);

        if (!cancelled) {
          setBooks(items.map((e) => toBook(e, readers)));
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

  const statCards = [
    { title: "Total Books", value: stats?.total ?? 0, icon: FiFileText },
    { title: "Signed Books", value: stats?.signed ?? 0, icon: FiEdit3 },
    { title: "Unsigned Books", value: stats?.unsigned ?? 0, icon: FiBookOpen },
    { title: "Rejected Books", value: stats?.rejected ?? 0, icon: FiSlash },
  ];

  const query = tableSearch.trim().toLowerCase();

  // Search/Filter abhi sirf current page ki ebooks par chalte hain
  const visibleBooks = books.filter((book) => {
    const matchesSearch =
      !query ||
      `${book.title} ${book.author} ${book.date} ${book.status}`
        .toLowerCase()
        .includes(query);

    return matchesSearch && (!signedOnly || book.status === "Signed");
  });

  const getStatusStyle = (status: BookStatus) => {
    if (status === "Signed") {
      return {
        backgroundColor: "rgba(0, 110, 35, 0.4)",
        color: "#00D639",
        border: "1px solid rgba(0, 214, 57, 0.7)",
      };
    }

    if (status === "Rejected") {
      return {
        backgroundColor: "rgba(198, 40, 40, 0.25)",
        color: "#FF6B6B",
        border: "1px solid rgba(255, 107, 107, 0.7)",
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

  return (
    <ReaderLayout title="Ebook Management" activePage="ebooks">
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
            All Ebooks
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

            <UnstyledButton
              onClick={() => setSignedOnly((current) => !current)}
            >
              <Box
                px={16}
                style={{
                  height: 36,
                  borderRadius: "20px",
                  backgroundColor: signedOnly ? "#68452F" : "#383838",
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
                  <Table.Th style={{ ...thStyle, width: "30%" }}>
                    Book Details
                  </Table.Th>
                  <Table.Th style={{ ...thStyle, width: "24%" }}>
                    Uploaded By
                  </Table.Th>
                  <Table.Th style={{ ...thStyle, width: "22%" }}>
                    Uploaded Date
                  </Table.Th>
                  <Table.Th style={{ ...thStyle, width: "14%" }}>
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
                {visibleBooks.map((book) => {
                  const [firstName, ...rest] = book.author.split(" ");

                  return (
                    <Table.Tr key={book.id} style={{ borderBottom: "none" }}>
                      <Table.Td py={12} style={tdStyle}>
                        <Group gap={10} wrap="nowrap">
                          <Box
                            style={{
                              width: 40,
                              height: 40,
                              flexShrink: 0,
                              border: "1px solid #9B8762",
                              overflow: "hidden",
                            }}
                          >
                            <img
                              src={book.cover}
                              alt={book.title}
                              onError={(e) => {
                                e.currentTarget.src = bookCover;
                              }}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                              }}
                            />
                          </Box>

                          <Text size="12px" c="#E0E0E0" fw={500}>
                            {book.title}
                          </Text>
                        </Group>
                      </Table.Td>

                      <Table.Td py={12} style={tdStyle}>
                        <Group gap={8} wrap="nowrap">
                          <img
                            src={book.avatar}
                            alt={book.author}
                            onError={(e) => {
                              e.currentTarget.src = authorAvatar;
                            }}
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: "50%",
                              objectFit: "cover",
                              flexShrink: 0,
                            }}
                          />

                          <Text
                            size="11px"
                            c="#FFFFFF"
                            style={{ lineHeight: 1.25 }}
                          >
                            {firstName}
                            <br />
                            {rest.join(" ")}
                          </Text>
                        </Group>
                      </Table.Td>

                      <Table.Td c="#E0E0E0" py={12} style={tdStyle}>
                        {book.date}
                      </Table.Td>

                      <Table.Td py={12} style={tdStyle}>
                        <Box
                          px={10}
                          py={4}
                          style={{
                            ...getStatusStyle(book.status),
                            borderRadius: "6px",
                            display: "inline-block",
                            fontSize: "10px",
                            fontWeight: 500,
                            lineHeight: 1.1,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {book.status}
                        </Box>
                      </Table.Td>

                      <Table.Td py={12} style={tdStyle}>
                        <Group justify="flex-end" wrap="nowrap">
                          <ActionIcon
                            variant="transparent"
                            size={32}
                            radius="xl"
                            onClick={() => navigate(`/ebook-detail/${book.id}`)}
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
                  );
                })}
              </Table.Tbody>
            </Table>
          )}

          {!loading && !error && visibleBooks.length === 0 && (
            <Text ta="center" c="#B8B4B0" size="sm" py="xl">
              No ebooks found.
            </Text>
          )}
        </Box>
      </Box>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </ReaderLayout>
  );
}
