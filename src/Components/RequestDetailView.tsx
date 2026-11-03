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
import {
  deleteAutographRequest,
  getAutographRequestById,
  getEbookById,
  getUserById,
} from "../api";

type RequestStatus = "Pending" | "In progress" | "Delivered" | "Rejected";

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

function statusLabel(raw: unknown): RequestStatus {
  const s = String(raw ?? "").toUpperCase();
  if (s === "COMPLETED") return "Delivered";
  if (s === "REJECTED") return "Rejected";
  if (s === "IN_PROGRESS") return "In progress";
  return "Pending";
}

export default function RequestDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState<any>(null);
  const [reader, setReader] = useState<any>(null);
  const [author, setAuthor] = useState<any>(null);
  const [ebook, setEbook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const innerBg = "#211E1E";
  const accent = "#FFE8B6";
  const brown = "#8C451F";

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function safe<T>(fn: () => Promise<T>) {
      try {
        return await fn();
      } catch {
        return null;
      }
    }

    async function load() {
      try {
        setLoading(true);
        setError("");

        const res = await getAutographRequestById(id as string);
        const r = res.data ?? res;
        if (cancelled) return;
        setRequest(r);

        // Response mein reader/author/ebook ho to wahi, warna alag se mangwayenge
        const [readerData, authorData, ebookData] = await Promise.all([
          r.reader
            ? r.reader
            : safe(() => getUserById(r.readerId)).then(
                (u: any) => u?.data ?? u,
              ),
          r.author
            ? r.author
            : safe(() => getUserById(r.authorId)).then(
                (u: any) => u?.data ?? u,
              ),
          r.ebook ? r.ebook : safe(() => getEbookById(r.ebookId)),
        ]);

        if (!cancelled) {
          setReader(readerData);
          setAuthor(authorData);
          setEbook(ebookData);
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

  const status = statusLabel(request?.status);

  // Backend rule: sirf Rejected ya Signed (Delivered) request delete hoti hai
  const canDelete = status === "Delivered" || status === "Rejected";
  const deleteDisabled = deleting || !canDelete;

  const handleDelete = async () => {
    if (!id || !canDelete) return;
    if (
      !window.confirm("Are you sure you want to delete this autograph request?")
    )
      return;

    try {
      setDeleting(true);
      await deleteAutographRequest(id);
      navigate(-1);
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Could not delete autograph request",
      );
      setDeleting(false);
    }
  };

  const getStatusStyle = (s: RequestStatus) => {
    if (s === "Delivered") {
      return {
        backgroundColor: "rgba(0, 110, 35, 0.4)",
        color: "#00D639",
        border: "1px solid rgba(0, 214, 57, 0.7)",
      };
    }

    if (s === "Rejected") {
      return {
        backgroundColor: "rgba(170, 20, 20, 0.4)",
        color: "#FF2B2B",
        border: "1px solid rgba(255, 43, 43, 0.6)",
      };
    }

    return {
      backgroundColor: "rgba(200,185,150,0.3)",
      color: accent,
      border: "1px solid rgba(255,232,182,0.75)",
    };
  };

  const title = request
    ? `Request: ${String(request.id).slice(0, 8)}`
    : "Request";

  return (
    <ReaderLayout title={title} activePage="requests">
      <Box
        style={{
          backgroundColor: innerBg,
          borderRadius: 20,
          minHeight: 340,
          padding: "40px 44px",
          boxSizing: "border-box",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {loading ? (
          <Flex justify="center" py="xl">
            <Loader color={accent} size="sm" />
          </Flex>
        ) : error || !request ? (
          <Text ta="center" c="#FF6B6B" size="sm" py="xl">
            {error || "Request not found"}
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
                  src={ebook?.coverUrl || bookImg}
                  alt={ebook?.title ?? "Ebook"}
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

              <Stack gap={18} style={{ flex: 1, minWidth: 0 }} pt={10}>
                <Flex justify="space-between" align="center" gap={16}>
                  <Text
                    size="26px"
                    fw={600}
                    c={accent}
                    style={{ lineHeight: 1.2 }}
                  >
                    {ebook?.title ?? "-"}
                  </Text>

                  <UnstyledButton
                    aria-label="Delete autograph request"
                    title={
                      canDelete
                        ? "Delete autograph request"
                        : "Only rejected or signed requests can be deleted"
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
                    w={118}
                    style={{ flexShrink: 0 }}
                  >
                    Reader:
                  </Text>

                  <Text size="19px" fw={600} c={accent}>
                    {fullName(reader) || "Unknown"}
                  </Text>
                </Group>

                <Group gap={0} wrap="nowrap">
                  <Text
                    size="14px"
                    c="#C9C9C9"
                    w={118}
                    style={{ flexShrink: 0 }}
                  >
                    Author:
                  </Text>

                  <Text size="16px" fw={700} c={accent}>
                    {fullName(author) || "Unknown"}
                  </Text>
                </Group>

                <Group gap={0} wrap="nowrap">
                  <Text
                    size="14px"
                    c="#C9C9C9"
                    w={118}
                    style={{ flexShrink: 0 }}
                  >
                    Requested Date:
                  </Text>

                  <Text size="14px" fw={500} c="#E8E0CC">
                    {formatDate(request.createdAt)}
                  </Text>
                </Group>

                <Box
                  px={18}
                  py={7}
                  style={{
                    ...getStatusStyle(status),
                    alignSelf: "flex-start",
                    borderRadius: 8,
                    fontSize: "14px",
                    fontWeight: 600,
                    lineHeight: 1.1,
                  }}
                >
                  {status}
                </Box>
              </Stack>
            </Flex>

            <Box mt={44}>
              <Text size="18px" fw={700} c={accent} mb={10}>
                Reader Message:
              </Text>

              <Text size="14px" c="#C9C9C9" style={{ lineHeight: 1.6 }}>
                {request.readerMessage || "-"}
              </Text>
            </Box>

            {request.authorMessage && (
              <Box mt={26}>
                <Text size="18px" fw={700} c={accent} mb={10}>
                  Author Message:
                </Text>

                <Text size="14px" c="#C9C9C9" style={{ lineHeight: 1.6 }}>
                  {request.authorMessage}
                </Text>
              </Box>
            )}
          </>
        )}
      </Box>
    </ReaderLayout>
  );
}
