import { useState } from "react";
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
} from "@mantine/core";

import { MdSearch } from "react-icons/md";

import {
  FiTrendingUp,
  FiTrendingDown,
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

/* ---------------- test data (asli data baad mein API se aayega) ----------------
   23 readers banaye hain taake 5 pages nazar aayein.
---------------------------------------------------------------------------------- */
const statuses = ["Active", "Active", "Inactive", "Active", "Suspended"];

const allReaders = Array.from({ length: 23 }, (_, i) => ({
  id: String(123400 + i),
  name: "Cordell Edwards",
  email: "croldel@gmail.com",
  book: "Things Fall Apart",
  status: statuses[i % 5],
  spent: "$40.00",
}));

const PAGE_SIZE = 5; // ek page par kitne readers

export default function ReaderManagement() {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);

  // kul pages data ki ginti se khud nikalte hain
  const totalPages = Math.ceil(allReaders.length / PAGE_SIZE);
  // sirf current page ke readers
  const readers = allReaders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const [deactivateOpened, setDeactivateOpened] = useState(false);
  const [activateOpened, setActivateOpened] = useState(false);
  const [suspendOpened, setSuspendOpened] = useState(false);
  const [successOpened, setSuccessOpened] = useState(false);

  const [reason, setReason] = useState("");

  const innerContainerBg = "#211E1E";
  const accentCardBg = "#FFE8B6";

  const numberColor = "#2A1005";

  const greenText = "#1A7F48";
  const greenBg = "rgba(26, 127, 72, 0.18)";

  const redText = "#C62828";
  const redBg = "rgba(198, 40, 40, 0.18)";

  const statCards = [
    {
      title: "Total Readers",
      value: "3,248",
      icon: FiUsers,
      trend: "+15%",
      up: true,
    },
    {
      title: "Active Readers",
      value: "243",
      icon: FiUserCheck,
      trend: "-3.5%",
      up: false,
    },
    {
      title: "Inactive Readers",
      value: "3,455",
      icon: FiUserMinus,
      trend: "+15%",
      up: true,
    },
    {
      title: "Suspended Reader",
      value: "30",
      icon: FiUserX,
      trend: "+5%",
      up: true,
    },
  ];

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

  const handleActivate = () => {
    console.log("Activated", reason);
    setActivateOpened(false);
    setReason("");
    setSuccessOpened(true);
  };

  const handleDeactivate = () => {
    console.log("Deactivated", reason);
    setDeactivateOpened(false);
    setReason("");
  };

  const handleSuspend = () => {
    console.log("Suspended", reason);
    setSuspendOpened(false);
    setReason("");
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

  const actionBtnStyle = {
    backgroundColor: "transparent",
    border: "1px solid rgba(255,232,182,0.75)",
    color: accentCardBg,
  };

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
                        {card.value}
                      </Text>
                    </Box>

                    <CardIcon size={18} color={numberColor} />
                  </Group>

                  <Group gap={6} align="center" mt={8}>
                    <Box
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        backgroundColor: card.up ? greenBg : redBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {card.up ? (
                        <FiTrendingUp size={11} color={greenText} />
                      ) : (
                        <FiTrendingDown size={11} color={redText} />
                      )}
                    </Box>

                    <Text
                      size="11px"
                      fw={700}
                      c={card.up ? greenText : redText}
                    >
                      {card.trend}
                    </Text>
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
                  <Table.Th style={{ ...thStyle, width: "17%" }}>Book</Table.Th>
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
                {readers.map((reader) => (
                  <Table.Tr key={reader.id} style={{ borderBottom: "none" }}>
                    <Table.Td c="#FFFFFF" py={12} style={tdStyle}>
                      {reader.id}
                    </Table.Td>

                    <Table.Td py={12} style={tdStyle}>
                      <Group
                        gap={8}
                        wrap="nowrap"
                        onClick={() => navigate("/reader-detail")}
                        style={{ cursor: "pointer" }}
                      >
                        <Avatar src={readerImg} size={32} radius="xl" />

                        <Text
                          size="11px"
                          c="#FFFFFF"
                          style={{ lineHeight: 1.25, maxWidth: 90 }}
                        >
                          {reader.name}
                        </Text>
                      </Group>
                    </Table.Td>

                    <Table.Td c="#E0E0E0" py={12} style={tdStyle}>
                      {reader.email}
                    </Table.Td>

                    <Table.Td fw={600} c="#FFFFFF" py={12} style={tdStyle}>
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
                          onClick={() => {
                            setReason("");
                            setActivateOpened(true);
                          }}
                          style={actionBtnStyle}
                        >
                          <FiUserCheck size={15} />
                        </ActionIcon>

                        {/* DEACTIVATE */}
                        <ActionIcon
                          variant="transparent"
                          size={32}
                          radius="xl"
                          onClick={() => {
                            setReason("");
                            setDeactivateOpened(true);
                          }}
                          style={actionBtnStyle}
                        >
                          <FiUserMinus size={15} />
                        </ActionIcon>

                        {/* SUSPEND */}
                        <ActionIcon
                          variant="transparent"
                          size={32}
                          radius="xl"
                          onClick={() => {
                            setReason("");
                            setSuspendOpened(true);
                          }}
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
          </Box>
        </Box>

        {/* ================= PAGINATION ================= */}
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </ReaderLayout>

      {/* ================= MODALS ================= */}

      <DeactivateModal
        opened={deactivateOpened}
        onClose={() => {
          setDeactivateOpened(false);
          setReason("");
        }}
        reason={reason}
        setReason={setReason}
        onConfirm={handleDeactivate}
      />

      <ActivateModal
        opened={activateOpened}
        onClose={() => {
          setActivateOpened(false);
          setReason("");
        }}
        reason={reason}
        setReason={setReason}
        onConfirm={handleActivate}
      />

      <SuspendModal
        opened={suspendOpened}
        onClose={() => {
          setSuspendOpened(false);
          setReason("");
        }}
        reason={reason}
        setReason={setReason}
        onConfirm={handleSuspend}
      />

      <SuccessModal
        opened={successOpened}
        onClose={() => {
          setSuccessOpened(false);
        }}
      />
    </>
  );
}
