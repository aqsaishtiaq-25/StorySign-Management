import { useState } from "react";
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
  Image,
} from "@mantine/core";

import { MdSearch } from "react-icons/md";
import { FiFilter, FiEye } from "react-icons/fi";

import ReaderLayout from "./ReaderLayout";
import Pagination from "./Pagination";
import ebookCover from "../assets/Ebook-img.png";
import readerImg from "../assets/Readerimg.png";

const allBooks = Array.from({ length: 12 }, (_, i) => {
  const unsigned = i % 5 === 1;

  return {
    id: i + 1,
    name: "The Origin Of Species",
    signedBy: unsigned ? "" : "Lisa Dinal",
    date: "23 June, 2026",
    fee: unsigned ? "" : "$10",
    status: unsigned ? "Unsigned" : "Signed",
  };
});

const PAGE_SIZE = 5;

export default function ReaderDetailView() {
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(allBooks.length / PAGE_SIZE);
  const books = allBooks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const innerContainerBg = "#211E1E";
  const accentCardBg = "#FFE8B6";

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
    <ReaderLayout title="Reader Detail View" activePage="reader">
      <Box
        style={{
          backgroundColor: innerContainerBg,
          borderRadius: "20px",
          flex: 1,
          minHeight: 0,
          padding: "20px 24px",
          boxSizing: "border-box",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Flex align="center" gap={18} mb={20} style={{ flexShrink: 0 }}>
          <Avatar src={readerImg} size={76} radius="50%" />

          <Box>
            <Group gap={12} align="center">
              <Text size="22px" fw={500} c={accentCardBg}>
                Alexa Rawles
              </Text>

              <Box
                px={10}
                py={3}
                style={{
                  border: "1px solid rgba(255,232,182,0.7)",
                  backgroundColor: "rgba(255,232,182,0.18)",
                  borderRadius: "6px",
                  color: accentCardBg,
                  fontSize: "10px",
                  fontWeight: 500,
                }}
              >
                Reader
              </Box>
            </Group>

            <Text size="13px" c="rgba(255,232,182,0.7)" mt={2}>
              alexarawles@gmail.com
            </Text>
          </Box>
        </Flex>

        <Flex
          justify="space-between"
          align="center"
          mb={12}
          style={{ flexShrink: 0 }}
        >
          <Text size="24px" fw={700} c={accentCardBg}>
            Reader Library
          </Text>

          <Group gap={16}>
            <TextInput
              placeholder="Search"
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
          <Table
            verticalSpacing={10}
            horizontalSpacing={0}
            style={{
              width: "100%",
              tableLayout: "fixed",
              color: "#FFFFFF",
              fontSize: "12px",
            }}
          >
            <Table.Thead>
              <Table.Tr style={{ borderBottom: "none" }}>
                <Table.Th style={{ ...thStyle, width: "15%" }}>
                  Ebook Cover
                </Table.Th>
                <Table.Th style={{ ...thStyle, width: "18%" }}>
                  Ebook Name
                </Table.Th>
                <Table.Th style={{ ...thStyle, width: "16%" }}>
                  Signed By
                </Table.Th>
                <Table.Th style={{ ...thStyle, width: "18%" }}>
                  Uploaded Date
                </Table.Th>
                <Table.Th style={{ ...thStyle, width: "10%" }}>Fee</Table.Th>
                <Table.Th style={{ ...thStyle, width: "13%" }}>Status</Table.Th>
                <Table.Th
                  style={{ ...thStyle, width: "10%", textAlign: "center" }}
                >
                  Action
                </Table.Th>
              </Table.Tr>
            </Table.Thead>

            <Table.Tbody>
              {books.map((book) => (
                <Table.Tr key={book.id} style={{ borderBottom: "none" }}>
                  <Table.Td py={10} style={tdStyle}>
                    <Image
                      src={ebookCover}
                      alt="Ebook Cover"
                      w={36}
                      h={42}
                      fit="cover"
                      radius={2}
                    />
                  </Table.Td>

                  <Table.Td c="#E0E0E0" fw={500} py={10} style={tdStyle}>
                    {book.name}
                  </Table.Td>

                  <Table.Td c="#E0E0E0" fw={500} py={10} style={tdStyle}>
                    {book.signedBy}
                  </Table.Td>

                  <Table.Td c="#E0E0E0" fw={500} py={10} style={tdStyle}>
                    {book.date}
                  </Table.Td>

                  <Table.Td
                    c={accentCardBg}
                    fw={700}
                    py={10}
                    style={{ ...tdStyle, fontSize: "14px" }}
                  >
                    {book.fee}
                  </Table.Td>

                  <Table.Td py={10} style={tdStyle}>
                    <Box
                      px={10}
                      py={4}
                      style={{
                        display: "inline-block",
                        borderRadius: "6px",
                        fontSize: "10px",
                        fontWeight: 500,
                        lineHeight: 1.1,
                        backgroundColor:
                          book.status === "Signed"
                            ? "rgba(0, 110, 35, 0.4)"
                            : "rgba(200, 185, 150, 0.3)",
                        color:
                          book.status === "Signed" ? "#00D639" : accentCardBg,
                        border:
                          book.status === "Signed"
                            ? "1px solid rgba(0,214,57,0.7)"
                            : "1px solid rgba(255,232,182,0.6)",
                      }}
                    >
                      {book.status}
                    </Box>
                  </Table.Td>

                  <Table.Td py={10} style={{ ...tdStyle, textAlign: "center" }}>
                    <ActionIcon
                      variant="transparent"
                      size={34}
                      radius="xl"
                      style={{
                        backgroundColor: "transparent",
                        border: "1px solid rgba(255,232,182,0.75)",
                        color: accentCardBg,
                      }}
                    >
                      <FiEye size={16} />
                    </ActionIcon>
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
