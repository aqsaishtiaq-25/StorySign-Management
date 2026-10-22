import { Box, Flex, Text, Group, Stack, UnstyledButton } from "@mantine/core";
import { FaTrash } from "react-icons/fa";

import ReaderLayout from "./ReaderLayout";
import bookImg from "../assets/Ebook-img.png";

const ebook = {
  title: "The Origin of Species",
  uploadedBy: "Aerna Dianal",
  signedBy: "Cordell Edwards",
  signedDate: "22 June, 2026",
  status: "Signed",
  readerMessage:
    "I really enjoyed reading your book and would love to receive your signature on my ebook. Your work has been incredibly inspiring, and it would mean a lot to have a personalized autograph from you.",
  authorMessage:
    "Thank you for your support and for choosing my book. I've personally signed your ebook and hope you enjoy reading it as much as I enjoyed creating it.",
};

export default function EbookDetails() {
  const innerBg = "#211E1E";
  const accent = "#FFE8B6";
  const brown = "#8C451F";

  return (
    <ReaderLayout title="Ebook Management" activePage="ebooks">
      <Box
        style={{
          backgroundColor: innerBg,
          borderRadius: 20,
          padding: "36px 44px",
          boxSizing: "border-box",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <Flex gap={48} align="flex-start" wrap="nowrap">
          <Box
            style={{
              width: 240,
              height: 225,
              flexShrink: 0,
              border: "1.5px solid #FFE8B6",
              borderRadius: 2,
              overflow: "hidden",
              backgroundColor: "#D5C5A0",
            }}
          >
            <img
              src={bookImg}
              alt={ebook.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </Box>

          <Stack gap={18} style={{ flex: 1, minWidth: 0 }} pt={4}>
            <Flex justify="space-between" align="center" gap={16}>
              <Text size="26px" fw={600} c={accent} style={{ lineHeight: 1.2 }}>
                {ebook.title}
              </Text>

              <UnstyledButton
                aria-label="Delete ebook"
                style={{
                  width: 36,
                  height: 36,
                  flexShrink: 0,
                  borderRadius: "50%",
                  backgroundColor: brown,
                  color: accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FaTrash size={13} />
              </UnstyledButton>
            </Flex>

            <Group gap={0} wrap="nowrap">
              <Text size="14px" c="#C9C9C9" w={110} style={{ flexShrink: 0 }}>
                Uploaded By:
              </Text>

              <Text size="19px" fw={600} c={accent}>
                {ebook.uploadedBy}
              </Text>
            </Group>

            <Group gap={0} wrap="nowrap">
              <Text size="14px" c="#C9C9C9" w={110} style={{ flexShrink: 0 }}>
                Signed By:
              </Text>

              <Text size="16px" fw={700} c={accent}>
                {ebook.signedBy}
              </Text>
            </Group>

            <Group gap={0} wrap="nowrap">
              <Text size="14px" c="#C9C9C9" w={110} style={{ flexShrink: 0 }}>
                Signed Date:
              </Text>

              <Text size="14px" fw={500} c="#E8E0CC">
                {ebook.signedDate}
              </Text>
            </Group>

            <Box
              px={18}
              py={7}
              style={{
                alignSelf: "flex-start",
                border: "1px solid rgba(255,232,182,0.75)",
                backgroundColor: "rgba(200,185,150,0.3)",
                borderRadius: 8,
                color: accent,
                fontSize: "14px",
                fontWeight: 600,
                lineHeight: 1.1,
              }}
            >
              {ebook.status}
            </Box>
          </Stack>
        </Flex>

        <Box mt={36}>
          <Text size="18px" fw={700} c={accent} mb={10}>
            Reader Message:
          </Text>

          <Text size="14px" c="#C9C9C9" style={{ lineHeight: 1.6 }}>
            {ebook.readerMessage}
          </Text>
        </Box>

        <Box mt={26}>
          <Text size="18px" fw={700} c={accent} mb={10}>
            Author Message:
          </Text>

          <Text size="14px" c="#C9C9C9" style={{ lineHeight: 1.6 }}>
            {ebook.authorMessage}
          </Text>
        </Box>
      </Box>
    </ReaderLayout>
  );
}
