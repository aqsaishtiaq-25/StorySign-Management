import { useState } from "react";
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
} from "@mantine/core";

import { MdSearch } from "react-icons/md";
import {
  FiFilter,
  FiTrendingUp,
  FiTrendingDown,
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

type BookStatus = "Signed" | "Unsigned";

interface Book {
  id: number;
  title: string;
  author: string;
  date: string;
  status: BookStatus;
}

const allBooks: Book[] = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  title: "The Origin Of Species",
  author: "Cordell Edwards",
  date: "23 June, 2026",
  status: i % 2 === 0 ? "Signed" : "Unsigned",
}));

export default function EbookManagement() {
  const navigate = useNavigate();

  const [tableSearch, setTableSearch] = useState("");
  const [signedOnly, setSignedOnly] = useState(false);
  const [page, setPage] = useState(1);

  const pageSize = 5;

  const innerContainerBg = "#211E1E";
  const accentCardBg = "#FFE8B6";
  const numberColor = "#2A1005";

  const greenText = "#1A7F48";
  const greenBg = "rgba(26, 127, 72, 0.18)";
  const redText = "#C62828";
  const redBg = "rgba(198, 40, 40, 0.18)";

  const statCards = [
    {
      title: "Total Books",
      value: "3,248",
      icon: FiFileText,
      trend: "+15%",
      up: true,
    },
    {
      title: "Signed Books",
      value: "243",
      icon: FiEdit3,
      trend: "-3.5%",
      up: false,
    },
    {
      title: "Unsigned Books",
      value: "3,455",
      icon: FiBookOpen,
      trend: "+15%",
      up: true,
    },
    {
      title: "Rejected Books",
      value: "30",
      icon: FiSlash,
      trend: "+5%",
      up: true,
    },
  ];

  const query = tableSearch.trim().toLowerCase();

  const filteredBooks = allBooks.filter((book) => {
    const matchesSearch =
      !query ||
      `${book.title} ${book.author} ${book.date} ${book.status}`
        .toLowerCase()
        .includes(query);

    return matchesSearch && (!signedOnly || book.status === "Signed");
  });

  const totalPages = Math.max(1, Math.ceil(filteredBooks.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const visibleBooks = filteredBooks.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const getStatusStyle = (status: BookStatus) => {
    if (status === "Signed") {
      return {
        backgroundColor: "rgba(0, 110, 35, 0.4)",
        color: "#00D639",
        border: "1px solid rgba(0, 214, 57, 0.7)",
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
            All Ebooks
          </Text>

          <Group gap={16}>
            <TextInput
              placeholder="Search"
              value={tableSearch}
              onChange={(event) => {
                setTableSearch(event.currentTarget.value);
                setPage(1);
              }}
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
              onClick={() => {
                setSignedOnly((current) => !current);
                setPage(1);
              }}
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
                <Table.Th style={{ ...thStyle, width: "14%" }}>Status</Table.Th>
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
                            src={bookCover}
                            alt={book.title}
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
                          src={authorAvatar}
                          alt={book.author}
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
                          onClick={() => navigate("/ebook-detail")}
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

          {visibleBooks.length === 0 && (
            <Text ta="center" c="#B8B4B0" size="sm" py="xl">
              No ebooks found.
            </Text>
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
