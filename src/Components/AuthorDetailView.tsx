import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
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
import authorImg from "../assets/Author-image.png";
import readerimg from "../assets/Readerimg.png";
import ebook from "../assets/Ebook-img.png";
import { getUserById } from "../api";
import type { ApiUser } from "../api";

export default function AuthorDetailView() {
  const innerContainerBg = "#211E1E";
  const accentCardBg = "#FFE8B6";

  const location = useLocation();
  const id =
    (location.state as { id?: string } | null)?.id ??
    sessionStorage.getItem("selectedAuthorId") ??
    "";

  const [author, setAuthor] = useState<ApiUser | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (!id) {
      setErrorMsg("No author selected.");
      return;
    }
    getUserById(id)
      .then((res) => setAuthor(res.data ?? res))
      .catch((err) => setErrorMsg((err as Error).message));
  }, [id]);

  const fullName = author
    ? `${author.firstName} ${author.lastName}`.trim()
    : "";

  // Abhi in requests ka backend endpoint nahi mila, isliye yeh static hain
  const recentRequests = [
    { reader: "Cordell Edwards", date: "23 June, 2026", status: "Pending" },
    { reader: "Cordell Edwards", date: "23 June, 2026", status: "Pending" },
    { reader: "Cordell Edwards", date: "23 June, 2026", status: "Pending" },
    { reader: "Cordell Edwards", date: "23 June, 2026", status: "Rejected" },
    { reader: "Cordell Edwards", date: "23 June, 2026", status: "Delivered" },
  ];

  const getStatusStyle = (status: string) => {
    if (status === "Pending") {
      return {
        backgroundColor: "rgba(200, 185, 150, 0.3)",
        color: accentCardBg,
        border: "1px solid rgba(255,232,182,0.6)",
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
          <Avatar src={author?.avatarUrl || readerimg} size={76} radius="50%" />

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
              color: "#CCCCCC",
              fontSize: "12px",
              width: "100%",
              tableLayout: "fixed",
            }}
          >
            <Table.Thead>
              <Table.Tr style={{ borderBottom: "none" }}>
                <Table.Th style={{ ...thStyle, width: "23%" }}>Reader</Table.Th>
                <Table.Th style={{ ...thStyle, width: "27%" }}>
                  Ebook Detail
                </Table.Th>
                <Table.Th style={{ ...thStyle, width: "20%" }}>Date</Table.Th>
                <Table.Th style={{ ...thStyle, width: "18%" }}>Status</Table.Th>
                <Table.Th
                  style={{ ...thStyle, width: "12%", textAlign: "center" }}
                >
                  Action
                </Table.Th>
              </Table.Tr>
            </Table.Thead>

            <Table.Tbody>
              {recentRequests.map((request, index) => (
                <Table.Tr key={index} style={{ borderBottom: "none" }}>
                  <Table.Td py={12} style={tdStyle}>
                    <Group gap={9} wrap="nowrap">
                      <Avatar src={authorImg} size={34} radius="xl" />

                      <Text
                        size="12px"
                        c="#FFFFFF"
                        fw={500}
                        style={{ lineHeight: 1.25 }}
                      >
                        {request.reader.split(" ").map((word, i) => (
                          <span key={i}>
                            {word}
                            {i === 0 && <br />}
                          </span>
                        ))}
                      </Text>
                    </Group>
                  </Table.Td>

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
                          src={ebook}
                          alt="The Origin Of Species"
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
                        style={{ whiteSpace: "nowrap" }}
                      >
                        The Origin Of Species
                      </Text>
                    </Group>
                  </Table.Td>

                  <Table.Td c="#E0E0E0" fw={500} py={12} style={tdStyle}>
                    {request.date}
                  </Table.Td>

                  <Table.Td py={12} style={tdStyle}>
                    <Box
                      px={11}
                      py={5}
                      style={{
                        ...getStatusStyle(request.status),
                        borderRadius: "7px",
                        display: "inline-block",
                        fontSize: "10px",
                        fontWeight: 500,
                        lineHeight: 1.1,
                        minWidth: 70,
                        textAlign: "center",
                      }}
                    >
                      {request.status}
                    </Box>
                  </Table.Td>

                  <Table.Td py={12} style={{ ...tdStyle, textAlign: "center" }}>
                    <ActionIcon
                      variant="transparent"
                      size={34}
                      radius="xl"
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
        </Box>
      </Box>
    </ReaderLayout>
  );
}
