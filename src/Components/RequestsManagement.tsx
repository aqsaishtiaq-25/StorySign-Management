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
  FiFilter,
  FiTrendingUp,
  FiTrendingDown,
  FiClipboard,
  FiLoader,
  FiXCircle,
  FiCheckCircle,
  FiEye,
} from "react-icons/fi";

import ReaderLayout from "./ReaderLayout";
import Pagination from "./Pagination"; // path apne folder ke hisaab se theek kar lein
import readerImg from "../assets/Author-image.png";

export default function RequestsManagement() {
  const navigate = useNavigate();

  const innerContainerBg = "#211E1E";
  const accentCardBg = "#FFE8B6";

  const numberColor = "#2A1005";

  const greenText = "#1A7F48";
  const greenBg = "rgba(26, 127, 72, 0.18)";

  const redText = "#C62828";
  const redBg = "rgba(198, 40, 40, 0.18)";

  const statCards = [
    {
      title: "Total Requests",
      value: "3,248",
      icon: FiClipboard,
      trend: "+15%",
      up: true,
    },
    {
      title: "In Progress Requests",
      value: "243",
      icon: FiLoader,
      trend: "-3.5%",
      up: false,
    },
    {
      title: "Rejected Requests",
      value: "3,455",
      icon: FiXCircle,
      trend: "+15%",
      up: true,
    },
    {
      title: "Completed Requests",
      value: "30",
      icon: FiCheckCircle,
      trend: "+5%",
      up: true,
    },
  ];

  const requests = [
    {
      id: "0123432",
      book: "Things Fall Apart",
      date: "23 June, 2026",
      status: "In progress",
    },
    {
      id: "0123432",
      book: "Things Fall Apart",
      date: "23 June, 2026",
      status: "In progress",
    },
    {
      id: "0123432",
      book: "Things Fall Apart",
      date: "23 June, 2026",
      status: "In progress",
    },
    {
      id: "0123432",
      book: "Things Fall Apart",
      date: "23 June, 2026",
      status: "Delivered",
    },
    {
      id: "0123432",
      book: "Things Fall Apart",
      date: "23 June, 2026",
      status: "Rejected",
    },
    {
      id: "0123432",
      book: "Things Fall Apart",
      date: "23 June, 2026",
      status: "Delivered",
    },
    {
      id: "0123432",
      book: "Things Fall Apart",
      date: "23 June, 2026",
      status: "In progress",
    },
    {
      id: "0123432",
      book: "Things Fall Apart",
      date: "23 June, 2026",
      status: "Rejected",
    },
  ];

  // ---------- Pagination ----------
  const PAGE_SIZE = 5; // ek page par 5 rows (design ke mutabiq)
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(requests.length / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const currentRequests = requests.slice(start, start + PAGE_SIZE);
  // --------------------------------

  const getStatusStyle = (status: string) => {
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

  const renderPerson = () => (
    <Group gap={8} wrap="nowrap">
      <Avatar src={readerImg} size={34} radius="xl" />

      <Text size="11px" c="#FFFFFF" style={{ lineHeight: 1.25 }}>
        Cordell
        <br />
        Edwards
      </Text>
    </Group>
  );

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

                  <Text size="11px" fw={700} c={card.up ? greenText : redText}>
                    {card.trend}
                  </Text>
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
                <Table.Th style={{ ...thStyle, width: "18%" }}>Reader</Table.Th>
                <Table.Th style={{ ...thStyle, width: "18%" }}>Author</Table.Th>
                <Table.Th style={{ ...thStyle, width: "16%" }}>Book</Table.Th>
                <Table.Th style={{ ...thStyle, width: "15%" }}>Date</Table.Th>
                <Table.Th style={{ ...thStyle, width: "12%" }}>Status</Table.Th>
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
              {currentRequests.map((request, index) => (
                <Table.Tr key={start + index} style={{ borderBottom: "none" }}>
                  <Table.Td c="#E0E0E0" py={12} style={tdStyle}>
                    {request.id}
                  </Table.Td>

                  <Table.Td py={12} style={tdStyle}>
                    {renderPerson()}
                  </Table.Td>

                  <Table.Td py={12} style={tdStyle}>
                    {renderPerson()}
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
                        onClick={() => navigate("/request-detail")}
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
        </Box>
      </Box>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </ReaderLayout>
  );
}
