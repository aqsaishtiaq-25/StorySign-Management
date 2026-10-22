import { Box, Flex, Text, Group, Stack } from "@mantine/core";

import ReaderLayout from "./ReaderLayout";
import bookImg from "../assets/Ebook-img.png";

export default function RequestDetailView() {
  const innerBg = "#211E1E";
  const accent = "#FFE8B6";

  return (
    <ReaderLayout title="Request: 0123452" activePage="ebooks">
      <Box
        style={{
          backgroundColor: innerBg,
          borderRadius: 20,
          height: "64vh",
          minHeight: 340,
          padding: "40px 44px",
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
              alt="The Origin of Species"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </Box>

          <Stack gap={18} style={{ flex: 1, minWidth: 0 }} pt={10}>
            <Text size="26px" fw={600} c={accent} style={{ lineHeight: 1.2 }}>
              The Origin of Species
            </Text>

            <Group gap={0} wrap="nowrap">
              <Text size="14px" c="#C9C9C9" w={90} style={{ flexShrink: 0 }}>
                Reader:
              </Text>

              <Text size="19px" fw={600} c={accent}>
                Aerna Dianal
              </Text>
            </Group>

            <Group gap={0} wrap="nowrap">
              <Text size="14px" c="#C9C9C9" w={90} style={{ flexShrink: 0 }}>
                Author
              </Text>

              <Text size="16px" fw={700} c={accent}>
                Cordell Edwards
              </Text>
            </Group>

            <Group gap={0} wrap="nowrap">
              <Text size="14px" c="#C9C9C9" w={118} style={{ flexShrink: 0 }}>
                Requested Date:
              </Text>

              <Text size="14px" fw={500} c="#E8E0CC">
                22 June, 2026
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
              Pending
            </Box>
          </Stack>
        </Flex>

        <Box mt={44}>
          <Text size="18px" fw={700} c={accent} mb={10}>
            Reader Message:
          </Text>

          <Text size="14px" c="#C9C9C9" style={{ lineHeight: 1.6 }}>
            I really enjoyed reading your book and would love to receive your
            signature on my ebook. Your work has been incredibly inspiring, and
            it would mean a lot to have a personalized autograph from you.
          </Text>
        </Box>
      </Box>
    </ReaderLayout>
  );
}
