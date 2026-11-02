import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Flex,
  Text,
  Group,
  Stack,
  UnstyledButton,
  Loader,
} from "@mantine/core";
import { FaTrash } from "react-icons/fa";

import ReaderLayout from "./ReaderLayout";
import bookImg from "../assets/Ebook-img.png";
import { deleteEbook, getEbookById, getUserById } from "../api";

function formatDate(value: unknown) {
  if (!value) return "-";
  const d = new Date(String(value));
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fullName(u: any) {
  if (!u) return "";
  return `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
}

export default function EbookDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ebook, setEbook] = useState<any>(null);
  const [reader, setReader] = useState<any>(null);
  const [author, setAuthor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const innerBg = "#211E1E";
  const accent = "#FFE8B6";
  const brown = "#8C451F";

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function fetchUser(userId?: string) {
      if (!userId) return null;
      try {
        const u = await getUserById(userId);
        return u.data ?? u;
      } catch {
        return null;
      }
    }

    async function load() {
      try {
        setLoading(true);
        setError("");

        const data = await getEbookById(id as string);
        if (cancelled) return;
        setEbook(data);

        // Jis request par ebook sign hui (COMPLETED), warna pehli request
        const requests: any[] = data.autographRequests ?? [];
        const signedRequest =
          requests.find((r) => r.status === "COMPLETED") ?? requests[0];

        const [readerData, authorData] = await Promise.all([
          fetchUser(data.readerId),
          fetchUser(signedRequest?.authorId),
        ]);

        if (!cancelled) {
          setReader(readerData);
          setAuthor(authorData);
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
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this ebook?")) return;

    try {
      setDeleting(true);
      await deleteEbook(id);
      navigate(-1);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not delete ebook");
      setDeleting(false);
    }
  };

  const requests: any[] = ebook?.autographRequests ?? [];
  const signedRequest =
    requests.find((r) => r.status === "COMPLETED") ?? requests[0];

  const isSigned = !!ebook?.isSigned;
  const status = isSigned ? "Signed" : "Unsigned";

  const signedBy = isSigned ? fullName(author) || "-" : "-";
  const signedDate = isSigned ? formatDate(signedRequest?.updatedAt) : "-";
  const authorMessage = signedRequest?.authorMessage ?? "";

  const deleteDisabled = deleting || !isSigned;

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
        {loading ? (
          <Flex justify="center" py="xl">
            <Loader color={accent} size="sm" />
          </Flex>
        ) : error || !ebook ? (
          <Text ta="center" c="#FF6B6B" size="sm" py="xl">
            {error || "Ebook not found"}
          </Text>
        ) : (
          <>
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
                  src={ebook.coverUrl || bookImg}
                  alt={ebook.title}
                  onError={(e) => {
                    e.currentTarget.src = bookImg;
                  }}
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
                  <Text
                    size="26px"
                    fw={600}
                    c={accent}
                    style={{ lineHeight: 1.2 }}
                  >
                    {ebook.title}
                  </Text>

                  <UnstyledButton
                    aria-label="Delete ebook"
                    title={
                      isSigned
                        ? "Delete ebook"
                        : "Admin can only delete signed ebooks"
                    }
                    onClick={handleDelete}
                    disabled={deleteDisabled}
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
                      opacity: deleteDisabled ? 0.4 : 1,
                      cursor: deleteDisabled ? "not-allowed" : "pointer",
                    }}
                  >
                    <FaTrash size={13} />
                  </UnstyledButton>
                </Flex>

                <Group gap={0} wrap="nowrap">
                  <Text
                    size="14px"
                    c="#C9C9C9"
                    w={110}
                    style={{ flexShrink: 0 }}
                  >
                    Uploaded By:
                  </Text>

                  <Text size="19px" fw={600} c={accent}>
                    {fullName(reader) || "Unknown"}
                  </Text>
                </Group>

                <Group gap={0} wrap="nowrap">
                  <Text
                    size="14px"
                    c="#C9C9C9"
                    w={110}
                    style={{ flexShrink: 0 }}
                  >
                    Signed By:
                  </Text>

                  <Text size="16px" fw={700} c={accent}>
                    {signedBy}
                  </Text>
                </Group>

                <Group gap={0} wrap="nowrap">
                  <Text
                    size="14px"
                    c="#C9C9C9"
                    w={110}
                    style={{ flexShrink: 0 }}
                  >
                    Signed Date:
                  </Text>

                  <Text size="14px" fw={500} c="#E8E0CC">
                    {signedDate}
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
                  {status}
                </Box>
              </Stack>
            </Flex>

            <Box mt={36}>
              <Text size="18px" fw={700} c={accent} mb={10}>
                Reader Message:
              </Text>

              <Text size="14px" c="#C9C9C9" style={{ lineHeight: 1.6 }}>
                {ebook.readerMessage || "-"}
              </Text>
            </Box>

            {authorMessage && (
              <Box mt={26}>
                <Text size="18px" fw={700} c={accent} mb={10}>
                  Author Message:
                </Text>

                <Text size="14px" c="#C9C9C9" style={{ lineHeight: 1.6 }}>
                  {authorMessage}
                </Text>
              </Box>
            )}
          </>
        )}
      </Box>
    </ReaderLayout>
  );
}
