import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Flex,
  Text,
  Group,
  Stack,
  TextInput,
  Textarea,
  Button,
  Avatar,
  SimpleGrid,
  Table,
  UnstyledButton,
  ActionIcon,
  Loader,
  Menu,
} from "@mantine/core";

import { MdSearch, MdUpload } from "react-icons/md";
import {
  FiFilter,
  FiFileText,
  FiEdit3,
  FiBookOpen,
  FiSlash,
  FiEye,
} from "react-icons/fi";

import ReaderLayout from "./ReaderLayout";
import { useAvatarSrc } from "./useAvatarSrc";
import Pagination from "./Pagination";
import bookCover from "../assets/Ebook-img.png";
import {
  getEbooks,
  getEbookStats,
  createEbook,
  getUserById,
  getMyProfile,
  getUsers,
  getAllAutographRequests,
  type EbookStats,
} from "../api";

type BookStatus = "Signed" | "Unsigned" | "Rejected";
type EbookFilterValue = "ALL" | "SIGNED" | "UNSIGNED";

interface Book {
  id: string;
  title: string;
  author: string;
  date: string;
  status: BookStatus;
  cover: string;
  avatar: string;
}

const EBOOK_FILTER_ITEMS: { value: EbookFilterValue; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "SIGNED", label: "Signed" },
  { value: "UNSIGNED", label: "Unsigned" },
];

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
  size = 32,
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

// Backend ki ebook + reader ki details -> UI ka Book
function toBook(e: any, readers: Record<string, any>): Book {
  const rid = e.reader?.id ?? e.readerId;
  const fullReader = rid ? readers[rid] : null;
  const reader =
    fullReader ??
    e.reader ??
    (e.autographRequests ?? []).find((r: any) => r.reader)?.reader;

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
    avatar: fullReader?.avatarUrl || reader?.avatarUrl || "",
  };
}

export default function EbookManagement() {
  const navigate = useNavigate();

  const [role, setRole] = useState<string | null>(() => {
    const saved = localStorage.getItem("role");
    return saved ? saved.toUpperCase() : null;
  });
  const isReader = role === "READER";

  const [view, setView] = useState<"list" | "upload">("list");

  const [books, setBooks] = useState<Book[]>([]);
  const [stats, setStats] = useState<EbookStats | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState("");

  const [tableSearch, setTableSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EbookFilterValue>("ALL");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  // ---------- Upload form state (Reader) ----------
  const [title, setTitle] = useState("");
  const [readerMessage, setReaderMessage] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState("");

  const pageSize = 4;

  const innerContainerBg = "#211E1E";
  const accentCardBg = "#FFE8B6";
  const brown = "#81401F";
  const inputBg = "#343131";
  const numberColor = "#2A1005";

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(tableSearch);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [tableSearch]);

  // Stats: fail ho to table ko na roke
  useEffect(() => {
    getEbookStats()
      .then(setStats)
      .catch(() => setStats(null));
  }, [reloadKey]);

  // Ebooks + current user role
  useEffect(() => {
    let cancelled = false;

    async function safe<T>(fn: () => Promise<T>) {
      try {
        return await fn();
      } catch {
        return null;
      }
    }

    async function load() {
      try {
        setLoading(true);
        setError("");

        const res = await getEbooks({
          page,
          limit: pageSize,
          search: debouncedSearch,
          ...(statusFilter === "SIGNED" ? { isSigned: true } : {}),
          ...(statusFilter === "UNSIGNED" ? { isSigned: false } : {}),
        });
        const items: any[] = Array.isArray(res)
          ? res
          : (res?.data ?? res?.items ?? res?.ebooks ?? []);

        const meRes: any = await safe(() => getMyProfile());
        const me = meRes?.data ?? meRes?.user ?? meRes;
        if (!cancelled && me?.role) {
          const r = String(me.role).toUpperCase();
          localStorage.setItem("role", r);
          setRole(r);
        }

        const usersRes: any = await safe(() => getUsers(1, 100));
        const allUsers: any[] = Array.isArray(usersRes)
          ? usersRes
          : (usersRes?.data?.items ??
            usersRes?.data ??
            usersRes?.items ??
            usersRes?.users ??
            []);
        const requests: any[] =
          (await safe(() => getAllAutographRequests())) ?? [];

        const readers: Record<string, any> = {};
        if (me?.id) readers[me.id] = me;

        allUsers.forEach((u) => {
          if (u?.id) readers[u.id] = u;
        });

        requests.forEach((r) => {
          const rd = r.reader;
          const rid = rd?.id ?? r.readerId;
          if (rd && rid && !readers[rid]) readers[rid] = rd;
        });

        const missing = [
          ...new Set(
            items.map((e) => e.readerId).filter((x) => x && !readers[x]),
          ),
        ] as string[];

        const fetched = await Promise.all(
          missing.map(async (rid) => {
            const u: any = await safe(() => getUserById(rid));
            return [rid, u?.data ?? u] as const;
          }),
        );
        fetched.forEach(([rid, u]) => {
          if (u) readers[rid] = u;
        });

        if (!cancelled) {
          setBooks(items.map((e) => toBook(e, readers)));

          const apiTotalPages =
            res?.pagination?.totalPages ??
            res?.meta?.totalPages ??
            res?.totalPages;
          if (typeof apiTotalPages === "number" && apiTotalPages > 0) {
            setTotalPages(apiTotalPages);
          } else {
            setTotalPages(
              Math.max(1, page + (items.length === pageSize ? 1 : 0)),
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
  }, [page, debouncedSearch, statusFilter, reloadKey]);

  const resetUploadForm = () => {
    setTitle("");
    setReaderMessage("");
    setCoverUrl("");
    setFileUrl("");
    setFormError("");
  };

  const openUploadView = () => {
    resetUploadForm();
    setUploadSuccessMsg("");
    setView("upload");
  };

  const cancelUploadView = () => {
    resetUploadForm();
    setView("list");
  };

  const handleUploadSubmit = async () => {
    setFormError("");

    const cleanTitle = title.trim();
    const cleanMessage = readerMessage.trim();
    const cleanCover = coverUrl.trim();
    const cleanFile = fileUrl.trim();

    if (!cleanTitle) {
      setFormError("Please enter the ebook title.");
      return;
    }
    if (!cleanMessage) {
      setFormError("Please enter a reader message.");
      return;
    }
    if (!cleanCover) {
      setFormError("Please enter a cover image URL.");
      return;
    }
    if (!cleanFile) {
      setFormError("Please enter an ebook file URL.");
      return;
    }

    try {
      setUploading(true);
      await createEbook({
        title: cleanTitle,
        readerMessage: cleanMessage,
        coverUrl: cleanCover,
        fileUrl: cleanFile,
      });

      resetUploadForm();
      setPage(1);
      setReloadKey((k) => k + 1);
      setUploadSuccessMsg("Ebook uploaded successfully.");
      setView("list");
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Could not upload ebook",
      );
    } finally {
      setUploading(false);
    }
  };

  const statCards = [
    { title: "Total Books", value: stats?.total ?? 0, icon: FiFileText },
    { title: "Signed Books", value: stats?.signed ?? 0, icon: FiEdit3 },
    { title: "Unsigned Books", value: stats?.unsigned ?? 0, icon: FiBookOpen },
    { title: "Rejected Books", value: stats?.rejected ?? 0, icon: FiSlash },
  ];

  const handleSelectFilter = (next: EbookFilterValue) => {
    setStatusFilter(next);
    setPage(1);
  };

  const activeFilterLabel =
    EBOOK_FILTER_ITEMS.find((item) => item.value === statusFilter)?.label ??
    "Filter";

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

  const inputStyles = {
    input: {
      height: "36px",
      minHeight: "36px",
      backgroundColor: inputBg,
      border: "none",
      borderRadius: "6px",
      color: "#FFFFFF",
      fontSize: "12px",
      paddingLeft: "14px",
    },
  };

  return (
    <ReaderLayout
      title={view === "upload" ? "Upload Ebook" : "Ebook Management"}
      activePage="ebooks"
    >
      {view === "list" && (
        <>
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
              gap: "16px",
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

            <Flex
              justify="space-between"
              align="center"
              style={{ flexShrink: 0 }}
            >
              <Text size="22px" fw={700} c={accentCardBg}>
                All Ebooks
              </Text>

              <Group gap={12} wrap="nowrap">
                <TextInput
                  placeholder="Search"
                  value={tableSearch}
                  onChange={(event) =>
                    setTableSearch(event.currentTarget.value)
                  }
                  leftSection={<MdSearch size={17} color="#D0D0D0" />}
                  styles={{
                    input: {
                      width: "210px",
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

                {isReader && (
                  <UnstyledButton onClick={openUploadView}>
                    <Box
                      px={16}
                      style={{
                        height: 36,
                        borderRadius: "20px",
                        backgroundColor: brown,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <MdUpload size={15} color={accentCardBg} />
                      <Text size="12px" c={accentCardBg} fw={600}>
                        Upload
                      </Text>
                    </Box>
                  </UnstyledButton>
                )}

                <Menu shadow="md" width={150} position="bottom-end">
                  <Menu.Target>
                    <UnstyledButton>
                      <Box
                        px={16}
                        style={{
                          height: 36,
                          borderRadius: "20px",
                          backgroundColor:
                            statusFilter === "ALL" ? "#383838" : "#91451F",
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                        }}
                      >
                        <FiFilter size={15} color="#E0E0E0" />

                        <Text size="12px" c="#E0E0E0" fw={500}>
                          {statusFilter === "ALL"
                            ? "Filter"
                            : activeFilterLabel}
                        </Text>
                      </Box>
                    </UnstyledButton>
                  </Menu.Target>

                  <Menu.Dropdown
                    style={{
                      backgroundColor: "#2B2828",
                      border: "1px solid #45413D",
                    }}
                  >
                    {EBOOK_FILTER_ITEMS.map((item) => (
                      <Menu.Item
                        key={item.value}
                        onClick={() => handleSelectFilter(item.value)}
                        style={{
                          color:
                            statusFilter === item.value
                              ? accentCardBg
                              : "#FFFFFF",
                          backgroundColor:
                            statusFilter === item.value
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
              </Group>
            </Flex>

            {uploadSuccessMsg && (
              <Text c="green.4" size="xs" style={{ flexShrink: 0 }}>
                {uploadSuccessMsg}
              </Text>
            )}

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
                    {books.map((book) => {
                      const [firstName, ...rest] = book.author.split(" ");

                      return (
                        <Table.Tr
                          key={book.id}
                          style={{ borderBottom: "none" }}
                        >
                          <Table.Td py={10} style={tdStyle}>
                            <Group gap={10} wrap="nowrap">
                              <Box
                                style={{
                                  width: 38,
                                  height: 38,
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

                          <Table.Td py={10} style={tdStyle}>
                            <Group gap={8} wrap="nowrap">
                              <UserAvatar
                                url={book.avatar}
                                name={book.author}
                                size={34}
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

                          <Table.Td c="#E0E0E0" py={10} style={tdStyle}>
                            {book.date}
                          </Table.Td>

                          <Table.Td py={10} style={tdStyle}>
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

                          <Table.Td py={10} style={tdStyle}>
                            <Group justify="flex-end" wrap="nowrap">
                              <ActionIcon
                                variant="transparent"
                                size={32}
                                radius="xl"
                                onClick={() =>
                                  navigate(`/ebook-detail/${book.id}`)
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
                      );
                    })}
                  </Table.Tbody>
                </Table>
              )}

              {!loading && !error && books.length === 0 && (
                <Text ta="center" c="#B8B4B0" size="sm" py="xl">
                  No ebooks found.
                </Text>
              )}
            </Box>
          </Box>

          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}

      {view === "upload" && (
        <Box
          style={{
            width: "100%",
            backgroundColor: innerContainerBg,
            borderRadius: "20px",
            padding: "22px 20px 26px 20px",
            boxSizing: "border-box",
          }}
        >
          <Text size="20px" fw={700} c={accentCardBg} mb={16}>
            Upload Ebook
          </Text>

          <Stack gap={14}>
            <Box>
              <Text size="14px" c={accentCardBg} mb={8}>
                Title
              </Text>
              <TextInput
                placeholder="Smurf 2"
                value={title}
                onChange={(e) => setTitle(e.currentTarget.value)}
                styles={inputStyles}
              />
            </Box>

            <SimpleGrid cols={2} spacing={16}>
              <Box>
                <Text size="14px" c={accentCardBg} mb={8}>
                  Cover URL
                </Text>
                <TextInput
                  placeholder="https://example.com/cover.jpg"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.currentTarget.value)}
                  styles={inputStyles}
                />
              </Box>

              <Box>
                <Text size="14px" c={accentCardBg} mb={8}>
                  File URL
                </Text>
                <TextInput
                  placeholder="https://example.com/ebook.pdf"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.currentTarget.value)}
                  styles={inputStyles}
                />
              </Box>
            </SimpleGrid>

            <Box>
              <Text size="14px" c={accentCardBg} mb={8}>
                Reader Message
              </Text>
              <Textarea
                placeholder="Ebook for autograph request testing"
                value={readerMessage}
                onChange={(e) => setReaderMessage(e.currentTarget.value)}
                styles={{
                  input: {
                    height: "110px",
                    minHeight: "110px",
                    backgroundColor: inputBg,
                    border: "none",
                    borderRadius: "6px",
                    color: "#FFFFFF",
                    fontSize: "12px",
                    padding: "12px 14px",
                    resize: "none",
                  },
                }}
              />
            </Box>
          </Stack>

          {formError && (
            <Text c="red.4" size="xs" mt={12}>
              {formError}
            </Text>
          )}

          <Group gap={16} mt={24} align="center">
            <Button
              w={170}
              h={36}
              radius={6}
              color={brown}
              c={accentCardBg}
              fw={500}
              onClick={handleUploadSubmit}
              loading={uploading}
              styles={{ root: { fontSize: "13px" } }}
            >
              Upload Ebook
            </Button>

            <Button
              w={170}
              h={36}
              radius={6}
              color="#2B2B2B"
              c="#E0E0E0"
              fw={400}
              onClick={cancelUploadView}
              styles={{ root: { fontSize: "13px" } }}
            >
              Cancel
            </Button>
          </Group>
        </Box>
      )}
    </ReaderLayout>
  );
}
