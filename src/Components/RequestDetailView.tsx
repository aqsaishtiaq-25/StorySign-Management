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
  Button,
} from "@mantine/core";
import { FaTrash } from "react-icons/fa";

import ReaderLayout from "./ReaderLayout";
import bookImg from "../assets/Ebook-img.png";
import {
  deleteAutographRequest,
  getAutographRequestById,
  getEbookById,
  getUserById,
  getMyProfile,
  acceptAutographRequest,
  rejectAutographRequest,
} from "../api";

type RequestStatus = "Pending" | "In progress" | "Delivered" | "Rejected";
type Busy = "" | "accept" | "reject";

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
  if (s === "COMPLETED" || s === "SIGNED" || s === "DELIVERED")
    return "Delivered";
  if (s === "REJECTED") return "Rejected";
  if (s === "IN_PROGRESS" || s === "ACCEPTED") return "In progress";
  return "Pending";
}

export default function RequestDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState<any>(null);
  const [reader, setReader] = useState<any>(null);
  const [author, setAuthor] = useState<any>(null);
  const [ebook, setEbook] = useState<any>(null);
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [busy, setBusy] = useState<Busy>("");
  const [actionError, setActionError] = useState("");

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
        // Sirf pehli baar loader dikhao, action ke baad nahi
        if (reloadKey === 0) setLoading(true);
        setError("");

        const res = await getAutographRequestById(id as string);
        const r = res.data ?? res;
        if (cancelled) return;
        setRequest(r);

        const [readerData, authorData, ebookData, meData] = await Promise.all([
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
          safe(() => getMyProfile()).then((m: any) => m?.data ?? m?.user ?? m),
        ]);

        if (!cancelled) {
          setReader(readerData);
          setAuthor(authorData);
          setEbook(ebookData);
          setMe(meData);
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
  }, [id, reloadKey]);

  const status = statusLabel(request?.status);

  // Sirf wohi author jis ko yeh request gayi hai (admin ko koi button nahi)
  const isRequestAuthor =
    String(me?.role ?? "").toUpperCase() === "AUTHOR" &&
    !!request &&
    me?.id === request.authorId;

  // Accept aur Reject sirf Pending par chalte hain
  const canAct = status === "Pending" && busy === "";

  const reload = () => setReloadKey((k) => k + 1);

  const handleAccept = async () => {
    if (!id) return;
    try {
      setBusy("accept");
      setActionError("");
      await acceptAutographRequest(id);
      reload();
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setBusy("");
    }
  };

  const handleReject = async () => {
    if (!id) return;
    try {
      setBusy("reject");
      setActionError("");
      await rejectAutographRequest(id);
      reload();
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setBusy("");
    }
  };

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

  const actionBtn = {
    root: {
      fontSize: "13px",
      opacity: canAct ? 1 : 0.4,
      cursor: canAct ? "pointer" : "not-allowed",
    },
  };

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

                {/* ---------- Sirf author ko: Accept / Reject ---------- */}
                {isRequestAuthor && (
                  <Box mt={6}>
                    <Group gap={12} wrap="nowrap">
                      <Button
                        h={36}
                        px={30}
                        radius={6}
                        color="#81401F"
                        c="#FFE8B6"
                        fw={500}
                        disabled={!canAct}
                        loading={busy === "accept"}
                        onClick={handleAccept}
                        styles={actionBtn}
                      >
                        Accept
                      </Button>

                      <Button
                        h={36}
                        px={30}
                        radius={6}
                        color="#8A1C1C"
                        c="#FFE8B6"
                        fw={500}
                        disabled={!canAct}
                        loading={busy === "reject"}
                        onClick={handleReject}
                        styles={actionBtn}
                      >
                        Reject
                      </Button>

                      {status === "In progress" && request.ebookId && (
                        <Button
                          h={36}
                          px={22}
                          radius={6}
                          color="#2B2B2B"
                          c="#E0E0E0"
                          fw={500}
                          onClick={() =>
                            navigate(`/ebook-detail/${request.ebookId}`)
                          }
                          styles={{ root: { fontSize: "13px" } }}
                        >
                          Open Ebook to Sign
                        </Button>
                      )}
                    </Group>

                    {status !== "Pending" && (
                      <Text size="11px" c="#B8B4B0" mt={8}>
                        {status === "In progress"
                          ? "Request accepted. Open the ebook to sign it."
                          : `This request is already ${status.toLowerCase()}.`}
                      </Text>
                    )}

                    {actionError && (
                      <Text size="12px" c="#FF6B6B" mt={8}>
                        {actionError}
                      </Text>
                    )}
                  </Box>
                )}
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
