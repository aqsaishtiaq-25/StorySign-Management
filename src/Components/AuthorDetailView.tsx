import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Flex,
  Text,
  Group,
  TextInput,
  Avatar,
  Table,
  ActionIcon,
  UnstyledButton,
} from "@mantine/core";

import { MdSearch } from "react-icons/md";
import { FiFilter, FiEye } from "react-icons/fi";

import ReaderLayout from "./ReaderLayout";
import { useAvatarSrc } from "./useAvatarSrc";
import Pagination from "./Pagination";
import ebook from "../assets/Ebook-img.png";
import {
  getUserById,
  getUsers,
  getEbooks,
  getAllAutographRequests,
  requestStatus,
} from "../api";
import type { ApiUser } from "../api";

// List "data" ke andar ho sakti hai, ya seedha array ho
const toList = (res: any): any[] | null =>
  Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : null;

const formatDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-";

const statusLabel = (status: string) =>
  status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown";

const initialsOf = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
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
      radius="50%"
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

interface RequestRow {
  id: string;
  ebookId: string;
  readerName: string;
  readerAvatar: string;
  title: string;
  cover: string;
  date: string;
  status: string;
}

export default function AuthorDetailView() {
  const navigate = useNavigate();
  const location = useLocation();

  const innerContainerBg = "#211E1E";
  const accentCardBg = "#FFE8B6";

  const id =
    (location.state as { id?: string } | null)?.id ??
    sessionStorage.getItem("selectedAuthorId") ??
    "";

  // ---------- Backend data ----------
  const [author, setAuthor] = useState<ApiUser | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [ebooks, setEbooks] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [requestsError, setRequestsError] = useState<string>("");

  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  useEffect(() => {
    if (!id) {
      setErrorMsg("No author selected.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      const [authorRes, reqRes, usersRes, ebooksRes] = await Promise.allSettled(
        [
          getUserById(id),
          getAllAutographRequests(),
          getUsers(1, 100),
          getEbooks(1, 100),
        ],
      );
      if (cancelled) return;

      if (authorRes.status === "fulfilled") {
        const v: any = authorRes.value;
        setAuthor((v?.data ?? v) as ApiUser);
      } else {
        setErrorMsg((authorRes.reason as Error).message);
      }

      if (reqRes.status === "fulfilled") {
        setRequests(reqRes.value ?? []);
      } else {
        setRequestsError(
          `Could not load requests: ${(reqRes.reason as Error).message}`,
        );
      }

      if (usersRes.status === "fulfilled") {
        setUsers((toList(usersRes.value) ?? []) as ApiUser[]);
      }
      if (ebooksRes.status === "fulfilled") {
        setEbooks(toList(ebooksRes.value) ?? []);
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const fullName = author
    ? `${author.firstName} ${author.lastName}`.trim()
    : "";

  // ---------- Sirf is author ki requests ----------
  const userById = new Map(users.map((u) => [u.id, u]));
  const ebookById = new Map(ebooks.map((e: any) => [e.id, e]));

  const rows: RequestRow[] = requests
    .filter((r) => (r.authorId ?? r.author?.id) === id)
    .sort(
      (a, b) =>
        new Date(b.createdAt ?? 0).getTime() -
        new Date(a.createdAt ?? 0).getTime(),
    )
    .map((r) => {
      const reader: any = r.reader ?? userById.get(r.readerId);
      const book: any = r.ebook ?? ebookById.get(r.ebookId);

      return {
        id: r.id,
        ebookId: r.ebookId ?? book?.id ?? "",
        readerName: reader
          ? `${reader.firstName ?? ""} ${reader.lastName ?? ""}`.trim()
          : "Unknown reader",
        readerAvatar:
          reader?.avatarUrl || userById.get(r.readerId)?.avatarUrl || "",
        title: book?.title ?? "Untitled ebook",
        cover: book?.coverUrl || ebook,
        date: formatDate(r.createdAt),
        status: requestStatus(r),
      };
    })
    .filter((row) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        row.readerName.toLowerCase().includes(q) ||
        row.title.toLowerCase().includes(q)
      );
    });

  // ---------- Pagination ----------
  const PAGE_SIZE = 5;
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const start = (currentPage - 1) * PAGE_SIZE;
  const currentRows = rows.slice(start, start + PAGE_SIZE);
  // --------------------------------

  const openEbook = (ebookId: string) => {
    if (ebookId) navigate(`/ebook-detail/${ebookId}`);
  };

  const getStatusStyle = (status: string) => {
    if (status === "pending") {
      return {
        backgroundColor: "rgba(200, 185, 150, 0.3)",
        color: accentCardBg,
        border: "1px solid rgba(255,232,182,0.6)",
      };
    }

    if (status === "rejected") {
      return {
        backgroundColor: "rgba(170, 20, 20, 0.4)",
        color: "#FF2B2B",
        border: "1px solid rgba(255, 43, 43, 0.6)",
      };
    }

    return {
      backgroundColor: "rgba(0, 110, 35, 0.4)",
      color: "#00D639",
      border: "1px solid rgba(0, 214, 57, 0.7)",
    };
  };

  const thStyle = {
    color: accentCardBg,
    fontSize: "14px",
    fontWeight: 700,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottom: "none",
  };

  const tdStyle = {
    borderBottom: "1px solid rgba(255,255,255,0.14)",
  };

  return (
    <ReaderLayout title="Author Detail View" activePage="author">
      <Box
        style={{
          backgroundColor: innerContainerBg,
          borderRadius: "20px",
          flex: 1,
          minHeight: 0,
          padding: "24px",
          boxSizing: "border-box",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Flex align="center" gap={18} mb={24} style={{ flexShrink: 0 }}>
          <UserAvatar url={author?.avatarUrl} name={fullName} size={76} />

          <Box>
            <Group gap={10} align="center" mb={4}>
              <Text size="22px" fw={500} c={accentCardBg}>
                {fullName}
              </Text>

              {author && (
                <Box
                  style={{
                    padding: "3px 10px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255,232,182,0.75)",
                    backgroundColor: "rgba(255,232,182,0.18)",
                    color: accentCardBg,
                    fontSize: "10px",
                    fontWeight: 500,
                    lineHeight: 1.2,
                  }}
                >
                  Author
                </Box>
              )}
            </Group>

            <Text size="13px" c="rgba(255,232,182,0.75)">
              {author?.email}
            </Text>

            {errorMsg && (
              <Text size="13px" c="red.4" mt={4}>
                {errorMsg}
              </Text>
            )}
          </Box>
        </Flex>

        <Flex
          justify="space-between"
          align="center"
          mb={12}
          style={{ flexShrink: 0 }}
        >
          <Text size="24px" fw={700} c={accentCardBg}>
            Recent Requests
          </Text>

          <Group gap={16}>
            <TextInput
              placeholder="Search"
              value={search}
              onChange={(e) => {
                setSearch(e.currentTarget.value);
                setPage(1);
              }}
              leftSection={<MdSearch size={17} color="#D0D0D0" />}
              styles={{
                input: {
                  width: "220px",
                  height: "38px",
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
                  height: 38,
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
          {loading && (
            <Text size="13px" c="#B8B4B0">
              Loading requests...
            </Text>
          )}

          {requestsError && (
            <Text size="13px" c="red.4">
              {requestsError}
            </Text>
          )}

          {!loading && !requestsError && rows.length === 0 && (
            <Text size="13px" c="#B8B4B0">
              No requests for this author yet.
            </Text>
          )}

          {rows.length > 0 && (
            <Table
              verticalSpacing={10}
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
                  <Table.Th style={{ ...thStyle, width: "23%" }}>
                    Reader
                  </Table.Th>
                  <Table.Th style={{ ...thStyle, width: "27%" }}>
                    Ebook Detail
                  </Table.Th>
                  <Table.Th style={{ ...thStyle, width: "20%" }}>Date</Table.Th>
                  <Table.Th style={{ ...thStyle, width: "18%" }}>
                    Status
                  </Table.Th>
                  <Table.Th
                    style={{ ...thStyle, width: "12%", textAlign: "center" }}
                  >
                    Action
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>

              <Table.Tbody>
                {currentRows.map((row) => (
                  <Table.Tr key={row.id} style={{ borderBottom: "none" }}>
                    {/* READER */}
                    <Table.Td py={12} style={tdStyle}>
                      <Group gap={9} wrap="nowrap">
                        <UserAvatar
                          url={row.readerAvatar}
                          name={row.readerName}
                          size={34}
                        />

                        <Text
                          size="12px"
                          c="#FFFFFF"
                          fw={500}
                          style={{ lineHeight: 1.25 }}
                        >
                          {row.readerName.split(" ").map((word, i) => (
                            <span key={i}>
                              {word}
                              {i === 0 && <br />}
                            </span>
                          ))}
                        </Text>
                      </Group>
                    </Table.Td>

                    {/* EBOOK */}
                    <Table.Td py={12} style={tdStyle}>
                      <Group gap={10} wrap="nowrap">
                        <Box
                          style={{
                            width: 38,
                            height: 38,
                            backgroundColor: "#A98A56",
                            flexShrink: 0,
                            overflow: "hidden",
                            borderRadius: 2,
                          }}
                        >
                          <img
                            src={row.cover}
                            alt={row.title}
                            onError={(e) => {
                              e.currentTarget.src = ebook;
                            }}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                        </Box>

                        <Text
                          size="12px"
                          c="#E0E0E0"
                          fw={500}
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {row.title}
                        </Text>
                      </Group>
                    </Table.Td>

                    <Table.Td c="#E0E0E0" fw={500} py={12} style={tdStyle}>
                      {row.date}
                    </Table.Td>

                    <Table.Td py={12} style={tdStyle}>
                      <Box
                        px={11}
                        py={5}
                        style={{
                          ...getStatusStyle(row.status),
                          borderRadius: "7px",
                          display: "inline-block",
                          fontSize: "10px",
                          fontWeight: 500,
                          lineHeight: 1.1,
                          minWidth: 70,
                          textAlign: "center",
                        }}
                      >
                        {statusLabel(row.status)}
                      </Box>
                    </Table.Td>

                    <Table.Td
                      py={12}
                      style={{ ...tdStyle, textAlign: "center" }}
                    >
                      <ActionIcon
                        variant="transparent"
                        size={34}
                        radius="xl"
                        disabled={!row.ebookId}
                        onClick={() => openEbook(row.ebookId)}
                        style={{
                          backgroundColor: "transparent",
                          border: "1px solid rgba(255,232,182,0.75)",
                          color: accentCardBg,
                          margin: "0 auto",
                        }}
                      >
                        <FiEye size={16} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
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
