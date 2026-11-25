import { useState, useEffect, useMemo } from "react";
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
  Menu,
} from "@mantine/core";

import { MdSearch } from "react-icons/md";

import {
  FiFilter,
  FiUsers,
  FiUser,
  FiUserCheck,
  FiUserMinus,
  FiUserX,
} from "react-icons/fi";

import ReaderLayout from "./ReaderLayout";
import { useAvatarSrc } from "./useAvatarSrc";
import Pagination from "./Pagination";
import {
  getUsers,
  getPlans,
  getSubscriptions,
  getAllAutographRequests,
  isPendingRequest,
  isSignedRequest,
} from "../api";
import type { ApiUser, ApiPlan, ApiSubscription } from "../api";

type AuthorStatusFilter = "ALL" | "ACTIVE" | "INACTIVE" | "SUSPENDED";

const PAGE_SIZE = 4;

// List "data" ke andar ho sakti hai, ya seedha array ho
const toList = (res: any): any[] | null =>
  Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : null;

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

export default function AuthorManagement() {
  const navigate = useNavigate();

  const innerContainerBg = "#211E1E";
  const accentCardBg = "#FFE8B6";
  const numberColor = "#2A1005";

  // ---------- Backend data ----------
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [plans, setPlans] = useState<ApiPlan[]>([]);
  const [subs, setSubs] = useState<ApiSubscription[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [planWarning, setPlanWarning] = useState<string>("");
  const [countWarning, setCountWarning] = useState<string>("");

  // ---------- Search + Filter + Pagination states ----------
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<AuthorStatusFilter>("ALL");
  const [page, setPage] = useState<number>(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Plans, subscriptions aur requests ek baar load hote hain
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [plansRes, subsRes, reqRes] = await Promise.allSettled([
        getPlans(),
        getSubscriptions(),
        getAllAutographRequests(),
      ]);
      if (cancelled) return;

      if (plansRes.status === "fulfilled") {
        setPlans((toList(plansRes.value) ?? []) as ApiPlan[]);
      }
      if (subsRes.status === "fulfilled") {
        setSubs((toList(subsRes.value) ?? []) as ApiSubscription[]);
      }
      if (plansRes.status === "rejected" || subsRes.status === "rejected") {
        setPlanWarning("Could not load plan details.");
      }

      if (reqRes.status === "fulfilled") {
        setRequests(toList(reqRes.value) ?? (reqRes.value as any[]) ?? []);
      } else {
        setCountWarning(
          `Could not load request counts: ${(reqRes.reason as Error).message}`,
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Authors backend se page, debouncedSearch aur statusFilter ke mutabiq aate hain
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErrorMsg("");

      try {
        const res = await getUsers({
          page,
          limit: PAGE_SIZE,
          role: "AUTHOR",
          search: debouncedSearch,
          ...(statusFilter === "ACTIVE"
            ? { isActive: true, isSuspended: false }
            : {}),
          ...(statusFilter === "INACTIVE"
            ? { isActive: false, isSuspended: false }
            : {}),
          ...(statusFilter === "SUSPENDED" ? { isSuspended: true } : {}),
        });
        if (cancelled) return;

        const list = (toList(res) ?? []) as ApiUser[];
        setUsers(list.filter((u) => !u.role || u.role === "AUTHOR"));

        const apiTotalPages =
          res?.pagination?.totalPages ??
          res?.meta?.totalPages ??
          res?.totalPages;

        if (typeof apiTotalPages === "number" && apiTotalPages > 0) {
          setTotalPages(apiTotalPages);
        } else {
          setTotalPages(
            Math.max(1, page + (list.length === PAGE_SIZE ? 1 : 0)),
          );
        }
      } catch (err) {
        if (cancelled) return;
        setUsers([]);
        setErrorMsg(`Could not load authors: ${(err as Error).message}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch, statusFilter]);

  // ---------- Author ka plan: userId -> plan ka naam ----------
  const planNameByUser = useMemo(() => {
    const planById = new Map(plans.map((p) => [p.id, p]));
    const map = new Map<string, string>();

    subs.forEach((s) => {
      if ((s.status ?? "").toLowerCase() !== "active") return;
      const p: any = planById.get(s.planId) ?? (s as any).plan;
      map.set(s.userId, p?.name ?? "Unknown plan");
    });

    return map;
  }, [plans, subs]);

  // ---------- Author ki requests ki ginti ----------
  const { pendingByAuthor, signedByAuthor } = useMemo(() => {
    const pending = new Map<string, number>();
    const signed = new Map<string, number>();

    requests.forEach((r) => {
      const authorId = r.authorId ?? r.author?.id;
      if (!authorId) return;

      if (isPendingRequest(r)) {
        pending.set(authorId, (pending.get(authorId) ?? 0) + 1);
      }
      if (isSignedRequest(r)) {
        signed.set(authorId, (signed.get(authorId) ?? 0) + 1);
      }
    });

    return { pendingByAuthor: pending, signedByAuthor: signed };
  }, [requests]);

  const activeCount = users.filter(
    (u) => u.isActive && !(u as any).isSuspended,
  ).length;
  const suspendedCount = users.filter((u) =>
    Boolean((u as any).isSuspended),
  ).length;
  const inactiveCount = Math.max(
    0,
    users.length - activeCount - suspendedCount,
  );

  const statCards = [
    { title: "Total Authors", value: String(users.length), icon: FiUsers },
    { title: "Active Authors", value: String(activeCount), icon: FiUserCheck },
    {
      title: "Inactive Authors",
      value: String(inactiveCount),
      icon: FiUserMinus,
    },
    {
      title: "Suspended Authors",
      value: String(suspendedCount),
      icon: FiUserX,
    },
  ];

  const authors = users.map((u: any) => {
    const isSuspended = Boolean(u.isSuspended);
    const statusLabel = isSuspended
      ? "Suspended"
      : u.isActive
        ? "Active"
        : "Inactive";

    return {
      id: u.id,
      shortId: String(u.id ?? "").slice(0, 8),
      name: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "Unknown",
      email: u.email ?? "",
      avatar: u.avatarUrl ?? "",
      plan: planWarning ? "-" : (planNameByUser.get(u.id) ?? "No Plan"),
      signedBook: countWarning ? "-" : String(signedByAuthor.get(u.id) ?? 0),
      pendingRequest: countWarning
        ? "-"
        : String(pendingByAuthor.get(u.id) ?? 0),
      status: statusLabel,
    };
  });

  const handleSelectFilter = (nextFilter: AuthorStatusFilter) => {
    setStatusFilter(nextFilter);
    setPage(1);
  };

  const filterLabel =
    statusFilter === "ALL"
      ? "Filter"
      : statusFilter === "ACTIVE"
        ? "Active"
        : statusFilter === "INACTIVE"
          ? "Inactive"
          : "Suspended";

  const openDetail = (id: string) => {
    sessionStorage.setItem("selectedAuthorId", id);
    navigate("/author-detail", { state: { id } });
  };

  const getStatusStyle = (status: string) => {
    if (status === "Active") {
      return {
        backgroundColor: "rgba(0, 110, 35, 0.35)",
        color: "#00D639",
        border: "1px solid rgba(0, 214, 57, 0.6)",
      };
    }

    if (status === "Inactive") {
      return {
        backgroundColor: "rgba(139, 74, 36, 0.35)",
        color: "#E0935A",
        border: "1px solid rgba(216, 137, 74, 0.6)",
      };
    }

    return {
      backgroundColor: "rgba(170, 20, 20, 0.4)",
      color: "#FF2B2B",
      border: "1px solid rgba(255, 43, 43, 0.6)",
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

  const actionBtnStyle = {
    backgroundColor: "transparent",
    border: "1px solid rgba(255,232,182,0.75)",
    color: accentCardBg,
  };

  return (
    <ReaderLayout title="Author Management" activePage="author">
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
                      {card.value}
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
            All Authors
          </Text>

          <Group gap={16}>
            <TextInput
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
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

            <Menu shadow="md" width={160} position="bottom-end">
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
                      {filterLabel}
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
                {(
                  [
                    { value: "ALL", label: "All" },
                    { value: "ACTIVE", label: "Active" },
                    { value: "INACTIVE", label: "Inactive" },
                    { value: "SUSPENDED", label: "Suspended" },
                  ] as const
                ).map((item) => (
                  <Menu.Item
                    key={item.value}
                    onClick={() => handleSelectFilter(item.value)}
                    style={{
                      color:
                        statusFilter === item.value ? "#FFE8B6" : "#FFFFFF",
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

        <Box style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
          {loading && (
            <Text c="#E0E0E0" size="14px">
              Loading authors...
            </Text>
          )}

          {errorMsg && (
            <Text c="red.4" size="14px">
              {errorMsg}
            </Text>
          )}

          {planWarning && (
            <Text c="red.4" size="11px" mb={4}>
              {planWarning}
            </Text>
          )}

          {countWarning && (
            <Text c="red.4" size="11px" mb={6}>
              {countWarning}
            </Text>
          )}

          {!loading && !errorMsg && authors.length === 0 && (
            <Text c="#E0E0E0" size="14px">
              No authors found.
            </Text>
          )}

          {!loading && !errorMsg && authors.length > 0 && (
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
                  <Table.Th style={{ ...thStyle, width: "10%" }}>ID</Table.Th>
                  <Table.Th style={{ ...thStyle, width: "22%" }}>
                    Profile
                  </Table.Th>
                  <Table.Th style={{ ...thStyle, width: "10%" }}>Plan</Table.Th>
                  <Table.Th style={{ ...thStyle, width: "14%" }}>
                    Signed Book
                  </Table.Th>
                  <Table.Th style={{ ...thStyle, width: "17%" }}>
                    Pending Request
                  </Table.Th>
                  <Table.Th style={{ ...thStyle, width: "12%" }}>
                    Status
                  </Table.Th>
                  <Table.Th
                    style={{
                      ...thStyle,
                      width: "15%",
                      textAlign: "right",
                      paddingRight: 8,
                    }}
                  >
                    Action
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>

              <Table.Tbody>
                {authors.map((author) => (
                  <Table.Tr key={author.id} style={{ borderBottom: "none" }}>
                    <Table.Td c="#E0E0E0" py={12} style={tdStyle}>
                      {author.shortId}
                    </Table.Td>

                    <Table.Td py={12} style={tdStyle}>
                      <Group
                        gap={8}
                        wrap="nowrap"
                        onClick={() => openDetail(author.id)}
                        style={{ cursor: "pointer" }}
                      >
                        <UserAvatar
                          url={author.avatar}
                          name={author.name}
                          size={32}
                        />

                        <Box>
                          <Text
                            size="12px"
                            c="#FFFFFF"
                            fw={500}
                            style={{ lineHeight: 1.25 }}
                          >
                            {author.name}
                          </Text>

                          <Text
                            size="10px"
                            c="#C9C9C9"
                            style={{ lineHeight: 1.25 }}
                          >
                            {author.email}
                          </Text>
                        </Box>
                      </Group>
                    </Table.Td>

                    <Table.Td
                      c={author.plan === "No Plan" ? "#9A9690" : "#FFFFFF"}
                      fw={author.plan === "No Plan" ? 400 : 500}
                      py={12}
                      style={{
                        ...tdStyle,
                        fontSize: author.plan === "No Plan" ? "12px" : "14px",
                      }}
                    >
                      {author.plan}
                    </Table.Td>

                    <Table.Td c="#FFFFFF" fw={500} py={12} style={tdStyle}>
                      {author.signedBook}
                    </Table.Td>

                    <Table.Td c="#FFFFFF" fw={500} py={12} style={tdStyle}>
                      {author.pendingRequest}
                    </Table.Td>

                    <Table.Td py={12} style={tdStyle}>
                      <Box
                        px={10}
                        py={4}
                        style={{
                          ...getStatusStyle(author.status),
                          borderRadius: "6px",
                          display: "inline-block",
                          fontSize: "10px",
                          fontWeight: 500,
                          lineHeight: 1.1,
                        }}
                      >
                        {author.status}
                      </Box>
                    </Table.Td>

                    <Table.Td py={12} style={tdStyle}>
                      <Group gap={8} justify="flex-end" wrap="nowrap">
                        <ActionIcon
                          variant="transparent"
                          size={32}
                          radius="xl"
                          style={actionBtnStyle}
                          onClick={() => openDetail(author.id)}
                        >
                          <FiUser size={15} />
                        </ActionIcon>

                        <ActionIcon
                          variant="transparent"
                          size={32}
                          radius="xl"
                          style={actionBtnStyle}
                        >
                          <FiUserCheck size={15} />
                        </ActionIcon>

                        <ActionIcon
                          variant="transparent"
                          size={32}
                          radius="xl"
                          style={actionBtnStyle}
                        >
                          <FiUserX size={15} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Box>
      </Box>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </ReaderLayout>
  );
}
