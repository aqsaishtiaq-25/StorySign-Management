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
  deleteEbook,
  getEbookById,
  getUserById,
  getMyProfile,
  getAllAutographRequests,
  signAutographRequestDefault,
  unsignAutographRequest,
} from "../api";

type Busy = "" | "signed" | "unsigned";

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

const isInProgress = (status: unknown) => {
  const s = String(status ?? "").toUpperCase();
  return s === "IN_PROGRESS" || s === "ACCEPTED";
};

export default function EbookDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ebook, setEbook] = useState<any>(null);
  const [reader, setReader] = useState<any>(null);
  const [author, setAuthor] = useState<any>(null);
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

    async function fetchUser(userId?: string) {
      if (!userId) return null;
      const u: any = await safe(() => getUserById(userId));
      return u?.data ?? u ?? null;
    }

    async function load() {
      try {
        // Sirf pehli baar loader dikhao, action ke baad nahi
        if (reloadKey === 0) setLoading(true);
        setError("");

        const res: any = await getEbookById(id as string);
        const data = res?.data ?? res;
        if (cancelled) return;
        setEbook(data);

        const meRes: any = await safe(() => getMyProfile());
        const meData = meRes?.data ?? meRes?.user ?? meRes;

        const requests: any[] = data.autographRequests ?? [];
        const signedRequest =
          requests.find((r) => r.status === "COMPLETED") ?? requests[0];

        // ---------- Reader ka naam ----------
        let readerData: any =
          data.reader ?? requests.find((r) => r.reader)?.reader ?? null;

        if (!readerData && meData?.id && meData.id === data.readerId) {
          readerData = meData;
        }
        if (!readerData) readerData = await fetchUser(data.readerId);
        if (!readerData) {
          const all: any[] =
            (await safe(() => getAllAutographRequests())) ?? [];
          readerData =
            all.find((r) => r.ebookId === data.id && r.reader)?.reader ?? null;
        }

        // ---------- Author ka naam ----------
        let authorData: any = signedRequest?.author ?? null;
        if (
          !authorData &&
          meData?.id &&
          meData.id === signedRequest?.authorId
        ) {
          authorData = meData;
        }
        if (!authorData) authorData = await fetchUser(signedRequest?.authorId);

        if (!cancelled) {
          setReader(readerData);
          setAuthor(authorData);
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

  const requests: any[] = ebook?.autographRequests ?? [];
  const signedRequest =
    requests.find((r) => r.status === "COMPLETED") ?? requests[0];

  const role = String(me?.role ?? "").toUpperCase();
  const isAdmin = role === "ADMIN";

  // Is author ki wo request jo Accept ho chuki hai (In progress)
  const myRequest =
    role === "AUTHOR"
      ? requests.find((r) => r.authorId === me?.id && isInProgress(r.status))
      : undefined;

  const isSigned = !!ebook?.isSigned;
  const status = isSigned ? "Signed" : "Unsigned";

  const signedBy = isSigned ? fullName(author) || "-" : "-";
  const signedDate = isSigned ? formatDate(signedRequest?.updatedAt) : "-";
  const authorMessage = signedRequest?.authorMessage ?? "";

  const reload = () => setReloadKey((k) => k + 1);

  const handleSigned = async () => {
    if (!myRequest) return;

    if (!ebook?.fileUrl) {
      setActionError("This ebook has no file link to attach.");
      return;
    }

    try {
      setBusy("signed");
      setActionError("");
      await signAutographRequestDefault(myRequest.id, ebook.fileUrl);
      reload();
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setBusy("");
    }
  };

  const handleUnsigned = async () => {
    if (!myRequest) return;

    try {
      setBusy("unsigned");
      setActionError("");
      await unsignAutographRequest(myRequest.id);
      reload();
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setBusy("");
    }
  };

  // Pehle ebook ki autograph requests delete, phir ebook (sirf admin)
  const handleDelete = async () => {
    if (!id) return;
    if (
      !window.confirm(
        "This will also delete the autograph request(s) of this ebook. Continue?",
      )
    )
      return;

    try {
      setDeleting(true);

      for (const r of requests) {
        await deleteAutographRequest(r.id);
      }

      await deleteEbook(id);
      navigate(-1);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not delete ebook");
      setDeleting(false);
    }
  };

  const deleteDisabled = deleting || !isSigned;
  const actionDisabled = busy !== "";

  const actionBtn = {
    root: {
      fontSize: "13px",
      opacity: actionDisabled ? 0.4 : 1,
      cursor: actionDisabled ? "not-allowed" : "pointer",
    },
  };

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

                  {isAdmin && (
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
                  )}
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
                    border: isSigned
                      ? "1px solid rgba(0, 214, 57, 0.7)"
                      : "1px solid rgba(255,232,182,0.75)",
                    backgroundColor: isSigned
                      ? "rgba(0, 110, 35, 0.4)"
                      : "rgba(200,185,150,0.3)",
                    borderRadius: 8,
                    color: isSigned ? "#00D639" : accent,
                    fontSize: "14px",
                    fontWeight: 600,
                    lineHeight: 1.1,
                  }}
                >
                  {status}
                </Box>

                {/* ---------- Sirf author ko, jab request In progress ho ---------- */}
                {myRequest && (
                  <Box mt={6}>
                    <Group gap={12} wrap="nowrap">
                      <Button
                        h={36}
                        px={30}
                        radius={6}
                        color="#81401F"
                        c="#FFE8B6"
                        fw={500}
                        disabled={actionDisabled}
                        loading={busy === "signed"}
                        onClick={handleSigned}
                        styles={actionBtn}
                      >
                        Signed
                      </Button>

                      <Button
                        h={36}
                        px={30}
                        radius={6}
                        color="#2B2B2B"
                        c="#E0E0E0"
                        fw={500}
                        disabled={actionDisabled}
                        loading={busy === "unsigned"}
                        onClick={handleUnsigned}
                        styles={actionBtn}
                      >
                        Unsigned
                      </Button>
                    </Group>

                    {actionError && (
                      <Text size="12px" c="#FF6B6B" mt={8}>
                        {actionError}
                      </Text>
                    )}
                  </Box>
                )}
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
