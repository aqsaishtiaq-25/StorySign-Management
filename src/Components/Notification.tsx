import { useEffect, useState } from "react";
import {
  Box,
  Flex,
  Loader,
  Modal,
  Select,
  Text,
  Textarea,
  TextInput,
  UnstyledButton,
} from "@mantine/core";
import { FaSearch } from "react-icons/fa";
import { MdOutlineVerified } from "react-icons/md";

import ReaderLayout from "./ReaderLayout";
import Pagination from "./Pagination"; // path apne folder ke hisaab se theek kar lein
import { getMyProfile, getNotifications, sendNotification } from "../api";

/* ---------------- colors ---------------- */
const C = {
  bg: "#303030",
  panel: "#211E1E",
  cream: "#FFE8B6",
  brown: "#8C451F",
  active: "#91451F",
  border: "#45413D",
  white: "#F7E5D7",
  muted: "#C9C3B6",
};

/* ---------------- types ---------------- */
type NotificationItem = {
  id: string;
  title: string;
  message: string;
  date: string;
};

/** ek page par kitni notifications dikhani hain (design mein 7) */
const PAGE_SIZE = 7;

/** Dropdown ke options -> backend ki recipientType */
const RECIPIENTS = [
  { value: "AUTHOR", label: "Authors" },
  { value: "READER", label: "Readers" },
  { value: "ALL", label: "All Users" },
];

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatDate(value: unknown) {
  if (!value) return "-";
  const d = new Date(String(value));
  if (isNaN(d.getTime())) return "-";
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${d.getFullYear()}`;
}

// Backend ki notification -> page ki row (kai field names sambhalta hai)
function toItem(n: any, index: number): NotificationItem {
  return {
    id: String(n.id ?? index),
    title: n.title ?? "-",
    message: n.message ?? n.body ?? n.content ?? "",
    date: formatDate(n.createdAt ?? n.date ?? n.updatedAt),
  };
}

/* ---------------- shared styles ---------------- */
const searchInputStyles = {
  root: { width: 280 },
  input: {
    height: 38,
    background: C.bg,
    border: "none",
    borderRadius: 999,
    color: "#FFFFFF",
    paddingLeft: 38,
    fontSize: 14,
  },
};

// sizes screen ki height (vh) ke hisaab se scale hote hain taake sab ek screen mein fit ho
const fieldInput = (hasError: boolean) => ({
  height: "clamp(36px, 5.2vh, 44px)",
  minHeight: 0,
  background: C.bg,
  border: hasError ? "1px solid #E65A5A" : "none",
  borderRadius: 4,
  color: "#FFFFFF",
  fontSize: 14,
  paddingLeft: 20,
});

const labelStyle = {
  fontSize: "clamp(15px, 2.2vh, 20px)",
  lineHeight: 1,
  marginTop: "clamp(10px, 2.4vh, 22px)",
  marginBottom: "clamp(6px, 1.2vh, 12px)",
};

/* ================= SCREEN 1: All Notifications ================= */

function NotificationList({
  onSend,
  canSend,
}: {
  onSend: () => void;
  canSend: boolean;
}) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const res: any = await getNotifications(page, PAGE_SIZE);
        const list: any[] = Array.isArray(res)
          ? res
          : (res?.data ?? res?.items ?? res?.notifications ?? []);

        if (!cancelled) {
          setItems(list.map(toItem));
          setTotalPages(Math.max(1, res?.pagination?.totalPages ?? 1));
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
  }, [page]);

  // Search sirf current page ki notifications par chalta hai
  const query = search.trim().toLowerCase();
  const visible = items.filter(
    (n) =>
      !query ||
      `${n.title} ${n.message} ${n.date}`.toLowerCase().includes(query),
  );

  return (
    <>
      <Box
        bg={C.panel}
        style={{
          flex: 1,
          minHeight: 0,
          padding: "clamp(16px, 2.8vh, 24px) 28px 0",
          borderRadius: 20,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        {/* Title + search + send button (send button sirf admin ko) */}
        <Flex align="center" justify="space-between" style={{ flexShrink: 0 }}>
          <Text
            fw={600}
            c={C.cream}
            style={{ fontSize: "clamp(20px, 3.2vh, 26px)", lineHeight: 1 }}
          >
            All Notifications
          </Text>

          <Flex align="center" gap={20}>
            <TextInput
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              leftSection={<FaSearch size={13} color={C.cream} />}
              styles={searchInputStyles}
            />

            {canSend && (
              <UnstyledButton
                className="action"
                onClick={onSend}
                style={{
                  width: 190,
                  height: 40,
                  borderRadius: 999,
                  background: C.brown,
                  color: C.white,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  size="15px"
                  fw={600}
                  style={{ lineHeight: 1, whiteSpace: "nowrap" }}
                >
                  Send Notifications
                </Text>
              </UnstyledButton>
            )}
          </Flex>
        </Flex>

        {/* List: hamesha PAGE_SIZE (7) barabar hisson mein bati hui,
            isliye kam rows hon to bhi har row ka size same rehta hai */}
        <Box
          className="hide-scrollbar"
          mt={12}
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            display: "grid",
            gridTemplateRows: `repeat(${PAGE_SIZE}, minmax(clamp(54px, 9vh, 84px), 1fr))`,
          }}
        >
          {loading ? (
            <Flex justify="center" pt="xl" style={{ gridRow: "1 / -1" }}>
              <Loader color={C.cream} size="sm" />
            </Flex>
          ) : error ? (
            <Text
              ta="center"
              c="#FF6B6B"
              size="sm"
              pt="xl"
              style={{ gridRow: "1 / -1" }}
            >
              {error}
            </Text>
          ) : visible.length === 0 ? (
            <Text
              ta="center"
              c={C.muted}
              size="sm"
              pt="xl"
              style={{ gridRow: "1 / -1" }}
            >
              No notifications found.
            </Text>
          ) : (
            visible.map((item) => (
              <Box
                key={item.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                <Text
                  fw={700}
                  c={C.cream}
                  style={{
                    fontSize: "clamp(13px, 2.1vh, 18px)",
                    lineHeight: 1.1,
                  }}
                >
                  {item.title}
                </Text>

                <Flex
                  align="center"
                  justify="space-between"
                  gap={16}
                  pr={16}
                  style={{ marginTop: "clamp(4px, 0.9vh, 10px)" }}
                >
                  <Text
                    c={C.muted}
                    style={{
                      fontSize: "clamp(11px, 1.8vh, 15px)",
                      lineHeight: 1.2,
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    {item.message}
                  </Text>

                  <Text
                    c={C.white}
                    style={{
                      fontSize: "clamp(11px, 1.8vh, 15px)",
                      lineHeight: 1.2,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.date}
                  </Text>
                </Flex>
              </Box>
            ))
          )}
        </Box>
      </Box>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </>
  );
}

/* ================= SCREEN 2: Send Notification form (sirf admin) ================= */

function SendForm({
  onCancel,
  onSent,
}: {
  onCancel: () => void;
  onSent: (count: number | null) => void;
}) {
  const [recipient, setRecipient] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [sendError, setSendError] = useState<string>("");

  const recipientError = submitted && !recipient;
  const titleError = submitted && title.trim() === "";
  const messageError = submitted && message.trim() === "";

  const handleSend = async () => {
    setSubmitted(true);
    setSendError("");
    if (!recipient || title.trim() === "" || message.trim() === "") return;
    if (sending) return;

    try {
      setSending(true);
      const res = await sendNotification({
        recipientType: recipient,
        title: title.trim(),
        message: message.trim(),
      });
      onSent(
        typeof res?.recipientCount === "number" ? res.recipientCount : null,
      );
    } catch (err) {
      setSendError(
        err instanceof Error ? err.message : "Could not send notification",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Box
      bg={C.panel}
      className="hide-scrollbar"
      style={{
        flex: 1,
        minHeight: 0,
        padding: "clamp(18px, 3.2vh, 32px) 30px clamp(16px, 2.8vh, 28px)",
        borderRadius: 20,
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        boxSizing: "border-box",
      }}
    >
      <Text
        fw={700}
        c={C.cream}
        style={{ fontSize: "clamp(20px, 3.4vh, 28px)", lineHeight: 1 }}
      >
        Send Notification
      </Text>

      <Text c={C.cream} fw={600} style={labelStyle}>
        Recipients
      </Text>
      <Select
        aria-label="Recipients"
        placeholder="Authors"
        data={RECIPIENTS}
        value={recipient}
        onChange={setRecipient}
        withCheckIcon={false}
        allowDeselect={false}
        classNames={{ input: "np-input", option: "np-option" }}
        styles={{
          input: fieldInput(recipientError),
          section: { color: C.cream },
          dropdown: { background: C.bg, border: `1px solid ${C.border}` },
        }}
      />

      <Text c={C.cream} fw={600} style={labelStyle}>
        Title
      </Text>
      <TextInput
        aria-label="Title"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.currentTarget.value)}
        classNames={{ input: "np-input" }}
        styles={{ input: fieldInput(titleError) }}
      />

      <Text c={C.cream} fw={600} style={labelStyle}>
        Message
      </Text>
      <Textarea
        aria-label="Message"
        placeholder="Write message here..."
        value={message}
        onChange={(e) => setMessage(e.currentTarget.value)}
        resize="none"
        classNames={{ input: "np-input" }}
        styles={{
          input: {
            ...fieldInput(messageError),
            height: "clamp(80px, 17vh, 150px)",
            padding: 20,
          },
        }}
      />

      {sendError && (
        <Text c="#FF6B6B" size="sm" mt={10}>
          {sendError}
        </Text>
      )}

      {/* Buttons panel ke bottom par */}
      <Flex
        gap={20}
        style={{ marginTop: "auto", paddingTop: "clamp(14px, 2.4vh, 24px)" }}
      >
        <UnstyledButton
          className="action"
          onClick={handleSend}
          disabled={sending}
          style={{
            width: 210,
            height: "clamp(38px, 5vh, 44px)",
            borderRadius: 8,
            background: C.brown,
            color: C.white,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: sending ? 0.6 : 1,
          }}
        >
          <Text
            size="15px"
            fw={500}
            style={{ lineHeight: 1, whiteSpace: "nowrap" }}
          >
            {sending ? "Sending..." : "Send Notifications"}
          </Text>
        </UnstyledButton>

        <UnstyledButton
          className="action"
          onClick={onCancel}
          style={{
            width: 210,
            height: "clamp(38px, 5vh, 44px)",
            borderRadius: 8,
            background: C.bg,
            color: C.white,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            size="15px"
            fw={500}
            style={{ lineHeight: 1, whiteSpace: "nowrap" }}
          >
            Cancel
          </Text>
        </UnstyledButton>
      </Flex>
    </Box>
  );
}

/* ================= SCREEN 3: Success popup ================= */

function SentModal({
  opened,
  count,
  onOkay,
}: {
  opened: boolean;
  count: number | null;
  onOkay: () => void;
}) {
  return (
    <Modal
      opened={opened}
      onClose={onOkay}
      withCloseButton={false}
      centered
      padding={0}
      radius={16}
      overlayProps={{ color: "#000", backgroundOpacity: 0.6 }}
      styles={{
        content: {
          background: C.cream,
          width: 520,
          maxWidth: "92vw",
          flex: "0 0 auto",
        },
      }}
    >
      <Flex
        direction="column"
        align="center"
        style={{ padding: "48px 24px 44px" }}
      >
        <MdOutlineVerified color={C.brown} size={72} />

        <Text
          c="#1A1A1A"
          ta="center"
          size="20px"
          style={{ marginTop: 32, lineHeight: 1.3 }}
        >
          Notification has been sent successfully
        </Text>

        {count !== null && (
          <Text c="#51473B" ta="center" size="14px" mt={8}>
            Sent to {count} {count === 1 ? "user" : "users"}
          </Text>
        )}

        <UnstyledButton
          className="action"
          onClick={onOkay}
          style={{
            marginTop: 36,
            width: 170,
            height: 50,
            borderRadius: 6,
            background: C.brown,
            color: C.white,
            fontSize: 17,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 14px rgba(140, 69, 31, 0.35)",
          }}
        >
          Okay
        </UnstyledButton>
      </Flex>
    </Modal>
  );
}

/* ================= MAIN: teeno screens yahan jurti hain ================= */

type View = "list" | "send";

export default function Notifications() {
  const [view, setView] = useState<View>("list");
  const [sentOpen, setSentOpen] = useState<boolean>(false);
  const [sentCount, setSentCount] = useState<number | null>(null);

  // Login karne wale ka role (ADMIN / AUTHOR / READER). Jab tak pata na chale null.
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    getMyProfile()
      .then((res: any) => {
        const r = res?.data?.role ?? res?.role ?? "";
        setRole(String(r).toUpperCase());
      })
      .catch(() => setRole(""));
  }, []);

  const isAdmin = role === "ADMIN";

  // popup mein "Okay" dabane par popup band ho, aur wapas list par jao
  // (list dobara khulti hai, is liye naya data khud mangwa leti hai)
  const handleOkay = () => {
    setSentOpen(false);
    setView("list");
  };

  return (
    <ReaderLayout
      title={isAdmin ? "Notification Management" : "Notifications"}
      activePage="notifications"
    >
      <style>{`
        .hide-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .action:hover { opacity: .85; }
        .np-input::placeholder { color: #9A948D; opacity: 1; }
        .np-option { color: #F7E5D7 !important; }
        .np-option:hover,
        .np-option[data-combobox-selected="true"] { background: #45413D !important; }
      `}</style>

      {/* Send form sirf admin ke liye. Doosre roles hamesha list hi dekhte hain */}
      {view === "send" && isAdmin ? (
        <SendForm
          onCancel={() => setView("list")}
          onSent={(count) => {
            setSentCount(count);
            setSentOpen(true);
          }}
        />
      ) : (
        <NotificationList canSend={isAdmin} onSend={() => setView("send")} />
      )}

      <SentModal opened={sentOpen} count={sentCount} onOkay={handleOkay} />
    </ReaderLayout>
  );
}
