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
  FiUser,
  FiUserCheck,
  FiUserMinus,
  FiUserX,
} from "react-icons/fi";

import ReaderLayout from "./ReaderLayout";
import Pagination from "./Pagination"; // path apne folder ke hisaab se theek kar lein
import authorImg from "../assets/Author-image.png";

export default function AuthorManagement() {
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
      title: "Total Authors",
      value: "3,248",
      icon: FiUsers,
      trend: "+15%",
      up: true,
    },
    {
      title: "Active Authors",
      value: "243",
      icon: FiUserCheck,
      trend: "-3.5%",
      up: false,
    },
    {
      title: "Inactive Authors",
      value: "3,455",
      icon: FiUserMinus,
      trend: "+15%",
      up: true,
    },
    {
      title: "Suspended Authors",
      value: "30",
      icon: FiUserX,
      trend: "+5%",
      up: true,
    },
  ];

  const authors = [
    {
      id: "0123432",
      name: "Cordell Edwards",
      email: "Edwards@gmail.com",
      plan: "Pro",
      signedBook: "235",
      pendingRequest: "23",
      status: "Active",
    },
    {
      id: "0123433",
      name: "Cordell Edwards",
      email: "Edwards@gmail.com",
      plan: "Pro",
      signedBook: "235",
      pendingRequest: "23",
      status: "Inactive",
    },
    {
      id: "0123434",
      name: "Cordell Edwards",
      email: "Edwards@gmail.com",
      plan: "Pro",
      signedBook: "235",
      pendingRequest: "23",
      status: "Active",
    },
    {
      id: "0123435",
      name: "Cordell Edwards",
      email: "Edwards@gmail.com",
      plan: "Pro",
      signedBook: "235",
      pendingRequest: "23",
      status: "Suspended",
    },
    {
      id: "0123436",
      name: "Cordell Edwards",
      email: "Edwards@gmail.com",
      plan: "Pro",
      signedBook: "235",
      pendingRequest: "23",
      status: "Inactive",
    },
    {
      id: "0123437",
      name: "Cordell Edwards",
      email: "Edwards@gmail.com",
      plan: "Pro",
      signedBook: "235",
      pendingRequest: "23",
      status: "Active",
    },
    {
      id: "0123438",
      name: "Cordell Edwards",
      email: "Edwards@gmail.com",
      plan: "Pro",
      signedBook: "235",
      pendingRequest: "23",
      status: "Inactive",
    },
    {
      id: "0123439",
      name: "Cordell Edwards",
      email: "Edwards@gmail.com",
      plan: "Pro",
      signedBook: "235",
      pendingRequest: "23",
      status: "Suspended",
    },
  ];

  // ---------- Pagination ----------
  const PAGE_SIZE = 5; // ek page par 5 rows (design ke mutabiq)
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(authors.length / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const currentAuthors = authors.slice(start, start + PAGE_SIZE);
  // --------------------------------

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
            All Authors
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
                <Table.Th style={{ ...thStyle, width: "12%" }}>Status</Table.Th>
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
              {currentAuthors.map((author) => (
                <Table.Tr key={author.id} style={{ borderBottom: "none" }}>
                  <Table.Td c="#E0E0E0" py={12} style={tdStyle}>
                    {author.id}
                  </Table.Td>

                  <Table.Td py={12} style={tdStyle}>
                    <Group
                      gap={8}
                      wrap="nowrap"
                      onClick={() => navigate("/author-detail")}
                      style={{ cursor: "pointer" }}
                    >
                      <Avatar src={authorImg} size={34} radius="xl" />

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
                    c="#FFFFFF"
                    fw={500}
                    py={12}
                    style={{ ...tdStyle, fontSize: "14px" }}
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
        </Box>
      </Box>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </ReaderLayout>
  );
}
