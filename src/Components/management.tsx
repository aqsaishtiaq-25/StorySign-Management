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
  FiUsers,
  FiUserCheck,
  FiUserMinus,
  FiUserX,
} from "react-icons/fi";

import readerImg from "../assets/Reader-image.png";

import ReaderLayout from "./ReaderLayout";
import Pagination from "./Pagination";
import DeactivateModal from "./DeactivateModal";
import ActivateModal from "./ActivateModal";
import SuspendModal from "./SuspendModal";
import SuccessModal from "./SuccessModal";
import {
  changeUserStatus,
  getReaders,
  getReaderStats,
  type ReaderStats,
} from "../api";

type ReaderStatus = "Active" | "Inactive" | "Suspended";

interface ReaderRow {
  id: string;
  shortId: string;
  name: string;
  email: string;
  avatar: string;
  book: string;
  status: ReaderStatus;
  spent: string;
}

const PAGE_SIZE = 5; // ek page par kitne readers

// Backend ka reader -> table ki row
function toRow(u: any): ReaderRow {
  const books: any[] = Array.isArray(u.books) ? u.books : [];
  const first = books[0]?.title ?? "-";
  const extra = books.length > 1 ? ` +${books.length - 1} more` : "";

  // Suspend hone par isActive bhi false ho jata hai, isliye pehle isSuspended dekhte hain
  const status: ReaderStatus = u.isSuspended
    ? "Suspended"
    : u.isActive
      ? "Active"
      : "Inactive";

  return {
    id: String(u.id),
    shortId: String(u.id).slice(0, 8),
    name: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "Unknown",
    email: u.email ?? "-",
    avatar: u.avatarUrl || readerImg,
    book: `${first}${extra}`,
    status,
    spent: `$${Number(u.totalSpent ?? 0).toFixed(2)}`,
  };
}

export default function ReaderManagement() {
  const navigate = useNavigate();

  const [readers, setReaders] = useState<ReaderRow[]>([]);
  const [stats, setStats] = useState<ReaderStats | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [deactivateOpened, setDeactivateOpened] = useState(false);
  const [activateOpened, setActivateOpened] = useState(false);
  const [suspendOpened, setSuspendOpened] = useState(false);
  const [successOpened, setSuccessOpened] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [selected, setSelected] = useState<ReaderRow | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const innerContainerBg = "#211E1E";
  const accentCardBg = "#FFE8B6";
  const numberColor = "#2A1005";

  // Cards: shuru mein aur har action ke baad
  useEffect(() => {
    getReaderStats()
      .then(setStats)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not load stats"),
      );
  }, [reloadKey]);

  // Readers: har page change par aur har action ke baad
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const res: any = await getReaders(page, PAGE_SIZE);
        const list: any[] = Array.isArray(res)
          ? res
          : (res?.data ?? res?.items ?? res?.users ?? []);

        if (!cancelled) {
          setReaders(list.map(toRow));
          setTotalPages(Math.max(1, res?.pagination?.totalPages ?? 1));
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
  }, [page, reloadKey]);

  const statCards = [
    {
      title: "Total Readers",
      value: stats?.totalReaders ?? 0,
      icon: FiUsers,
    },
    {
      title: "Active Readers",
      value: stats?.activeReaders ?? 0,
      icon: FiUserCheck,
    },
    {
      title: "Inactive Readers",
      value: stats?.inactiveReaders ?? 0,
      icon: FiUserMinus,
    },
    {
      title: "Suspended Reader",
      value: stats?.suspendedReaders ?? 0,
      icon: FiUserX,
    },
  ];

  // Search sirf current page ki rows par chalta hai
  const query = search.trim().toLowerCase();
  const visible = readers.filter(
    (r) =>
      !query ||
      `${r.shortId} ${r.name} ${r.email} ${r.book} ${r.status}`
        .toLowerCase()
        .includes(query),
  );

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

  /* ---------------- actions ---------------- */

  const openModal = (
    row: ReaderRow,
    which: "activate" | "deactivate" | "suspend",
  ) => {
    setSelected(row);
    setReason("");
    if (which === "activate") setActivateOpened(true);
    if (which === "deactivate") setDeactivateOpened(true);
    if (which === "suspend") setSuspendOpened(true);
  };

  const closeAll = () => {
    setActivateOpened(false);
    setDeactivateOpened(false);
    setSuspendOpened(false);
    setReason("");
  };

  const runAction = async (kind: "activate" | "deactivate" | "suspend") => {
    if (!selected || busy) return;

    // Reason khali ho to default bhejte hain
    const why = reason.trim() || "Updated by admin";

    try {
      setBusy(true);

      if (kind === "activate") {
        if (selected.status === "Suspended") {
          // Suspended reader ko pehle unsuspend karte hain, phir activate
          await changeUserStatus(selected.id, "unsuspend", why);
          try {
            await changeUserStatus(selected.id, "activate", why);
          } catch {
            // Agar unsuspend se hi reader active ho gaya ho to yahan error aa sakta hai, theek hai
          }
        } else {
          await changeUserStatus(selected.id, "activate", why);
        }
        setSuccessMsg("User have been activated Successfully");
      } else if (kind === "deactivate") {
        await changeUserStatus(selected.id, "deactivate", why);
        setSuccessMsg("User have been deactivated Successfully");
      } else {
        await changeUserStatus(selected.id, "suspend", why);
        setSuccessMsg("User have been suspended Successfully");
      }

      closeAll();
      setSuccessOpened(true);
      setReloadKey((k) => k + 1); // list aur cards dobara mangwao
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const thStyle = {
    color: accentCardBg,
    fontSize: "14px",
    fontWeight: 600,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottom: "1px solid rgba(255,255,255,0.12)",
  };

  const tdStyle = {
    borderBottom: "1px solid rgba(255,255,255,0.12)",
  };

  const actionBtnStyle = (enabled: boolean) => ({
    backgroundColor: "transparent",
    border: "1px solid rgba(255,232,182,0.75)",
    color: accentCardBg,
    opacity: enabled ? 1 : 0.3,
    cursor: enabled ? "pointer" : "not-allowed",
  });

  return (
    <>
      <ReaderLayout title="Reader Management" activePage="reader">
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

          <Flex
            justify="space-between"
            align="center"
            style={{ flexShrink: 0 }}
          >
            <Text size="22px" fw={700} c={accentCardBg}>
              All Readers
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
                    <Table.Th style={{ ...thStyle, width: "20%" }}>
                      Profile
                    </Table.Th>
                    <Table.Th style={{ ...thStyle, width: "19%" }}>
                      Email
                    </Table.Th>
                    <Table.Th style={{ ...thStyle, width: "17%" }}>
                      Book
                    </Table.Th>
                    <Table.Th style={{ ...thStyle, width: "13%" }}>
                      Status
                    </Table.Th>
                    <Table.Th style={{ ...thStyle, width: "10%" }}>
                      Spent
                    </Table.Th>
                    <Table.Th
                      style={{
                        ...thStyle,
                        width: "17%",
                        textAlign: "right",
                        paddingRight: 8,
                      }}
                    >
                      Action
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>

                <Table.Tbody>
                  {visible.map((reader) => {
                    const canActivate = reader.status !== "Active";
                    const canDeactivate = reader.status === "Active";
                    const canSuspend = reader.status !== "Suspended";

                    return (
                      <Table.Tr
                        key={reader.id}
                        style={{ borderBottom: "none" }}
                      >
                        <Table.Td c="#FFFFFF" py={12} style={tdStyle}>
                          {reader.shortId}
                        </Table.Td>

                        <Table.Td py={12} style={tdStyle}>
                          <Group
                            gap={8}
                            wrap="nowrap"
                            onClick={() => navigate("/reader-detail")}
                            style={{ cursor: "pointer" }}
                          >
                            <Avatar src={reader.avatar} size={32} radius="xl" />

                            <Text
                              size="11px"
                              c="#FFFFFF"
                              style={{ lineHeight: 1.25, maxWidth: 90 }}
                            >
                              {reader.name}
                            </Text>
                          </Group>
                        </Table.Td>

                        <Table.Td
                          c="#E0E0E0"
                          py={12}
                          style={{
                            ...tdStyle,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {reader.email}
                        </Table.Td>

                        <Table.Td
                          fw={600}
                          c="#FFFFFF"
                          py={12}
                          style={{
                            ...tdStyle,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {reader.book}
                        </Table.Td>

                        <Table.Td py={12} style={tdStyle}>
                          <Box
                            px={10}
                            py={4}
                            style={{
                              ...getStatusStyle(reader.status),
                              borderRadius: "6px",
                              display: "inline-block",
                              fontSize: "10px",
                              fontWeight: 500,
                              lineHeight: 1.1,
                            }}
                          >
                            {reader.status}
                          </Box>
                        </Table.Td>

                        <Table.Td c="#FFFFFF" fw={500} py={12} style={tdStyle}>
                          {reader.spent}
                        </Table.Td>

                        <Table.Td py={12} style={tdStyle}>
                          <Group gap={8} justify="flex-end" wrap="nowrap">
                            {/* ACTIVATE */}
                            <ActionIcon
                              variant="transparent"
                              size={32}
                              radius="xl"
                              title="Activate"
                              disabled={!canActivate}
                              onClick={() => openModal(reader, "activate")}
                              style={actionBtnStyle(canActivate)}
                            >
                              <FiUserCheck size={15} />
                            </ActionIcon>

                            {/* DEACTIVATE */}
                            <ActionIcon
                              variant="transparent"
                              size={32}
                              radius="xl"
                              title="Deactivate"
                              disabled={!canDeactivate}
                              onClick={() => openModal(reader, "deactivate")}
                              style={actionBtnStyle(canDeactivate)}
                            >
                              <FiUserMinus size={15} />
                            </ActionIcon>

                            {/* SUSPEND */}
                            <ActionIcon
                              variant="transparent"
                              size={32}
                              radius="xl"
                              title="Suspend"
                              disabled={!canSuspend}
                              onClick={() => openModal(reader, "suspend")}
                              style={actionBtnStyle(canSuspend)}
                            >
                              <FiUserX size={15} />
                            </ActionIcon>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            )}

            {!loading && !error && visible.length === 0 && (
              <Text ta="center" c="#B8B4B0" size="sm" py="xl">
                No readers found.
              </Text>
            )}
          </Box>
        </Box>

        {/* ================= PAGINATION ================= */}
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </ReaderLayout>

      {/* ================= MODALS ================= */}

      <DeactivateModal
        opened={deactivateOpened}
        onClose={closeAll}
        reason={reason}
        setReason={setReason}
        onConfirm={() => runAction("deactivate")}
      />

      <ActivateModal
        opened={activateOpened}
        onClose={closeAll}
        reason={reason}
        setReason={setReason}
        onConfirm={() => runAction("activate")}
      />

      <SuspendModal
        opened={suspendOpened}
        onClose={closeAll}
        reason={reason}
        setReason={setReason}
        onConfirm={() => runAction("suspend")}
      />

      <SuccessModal
        opened={successOpened}
        message={successMsg}
        onClose={() => setSuccessOpened(false)}
      />
    </>
  );
}
