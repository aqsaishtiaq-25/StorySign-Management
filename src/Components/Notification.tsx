import { useState } from "react";
import {
  Box,
  Flex,
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

/* ---------------- data (baad mein API se aayega) ---------------- */
type NotificationItem = {
  id: number;
  title: string;
  message: string;
  date: string;
};

const NEW_AUTHOR =
  "Andy Weir purchase the pro plan. Now able to use this platform";
const SIGNED_BOOK =
  "\u201CThings Fall a Part\u201D book signed by Andy Weir for reader Lisa smith.";
const AUTOGRAPH_REQ = "Lisa request to author dinal.";
const DATE = "23 Jul, 2026";

const notifications: NotificationItem[] = [
  { id: 1, title: "New Author Available", message: NEW_AUTHOR, date: DATE },
  { id: 2, title: "Signed Book Available", message: SIGNED_BOOK, date: DATE },
  {
    id: 3,
    title: "Lisa Area Request for Autograph",
    message: AUTOGRAPH_REQ,
    date: DATE,
  },
  { id: 4, title: "Signed Book Available", message: SIGNED_BOOK, date: DATE },
  {
    id: 5,
    title: "Lisa Area Request for Autograph",
    message: AUTOGRAPH_REQ,
    date: DATE,
  },
  { id: 6, title: "New Author Available", message: NEW_AUTHOR, date: DATE },
  { id: 7, title: "Signed copy Ready", message: NEW_AUTHOR, date: DATE },
  // neeche ke 3 items sirf page 2 dikhane ke liye hain (asli data mein zaroorat nahi)
  { id: 8, title: "New Author Available", message: NEW_AUTHOR, date: DATE },
  { id: 9, title: "Signed Book Available", message: SIGNED_BOOK, date: DATE },
  {
    id: 10,
    title: "Lisa Area Request for Autograph",
    message: AUTOGRAPH_REQ,
    date: DATE,
  },
];

/** ek page par kitni notifications dikhani hain (design mein 7) */
const PAGE_SIZE = 7;

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

function NotificationList({ onSend }: { onSend: () => void }) {
  // ---------- Pagination ----------
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(notifications.length / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const currentNotifications = notifications.slice(start, start + PAGE_SIZE);
  // --------------------------------

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
        {/* Title + search + send button */}
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
              leftSection={<FaSearch size={13} color={C.cream} />}
              styles={searchInputStyles}
            />

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
          {currentNotifications.map((item) => (
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
          ))}
        </Box>
      </Box>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </>
  );
}

/* ================= SCREEN 2: Send Notification form ================= */

function SendForm({
  onCancel,
  onSent,
}: {
  onCancel: () => void;
  onSent: () => void;
}) {
  const [recipient, setRecipient] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [submitted, setSubmitted] = useState<boolean>(false);

  const recipientError = submitted && !recipient;
  const titleError = submitted && title.trim() === "";
  const messageError = submitted && message.trim() === "";

  const handleSend = () => {
    setSubmitted(true);
    if (!recipient || title.trim() === "" || message.trim() === "") return;
    // TODO: yahan API call lagao (recipient, title, message)
    onSent(); // SCREEN 3 (popup) khol do
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
        Add Plan
      </Text>

      <Text c={C.cream} fw={600} style={labelStyle}>
        Recipients
      </Text>
      <Select
        aria-label="Recipients"
        placeholder="Authors"
        data={["Authors", "Readers", "All Users"]}
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

      {/* Buttons panel ke bottom par */}
      <Flex
        gap={20}
        style={{ marginTop: "auto", paddingTop: "clamp(14px, 2.4vh, 24px)" }}
      >
        <UnstyledButton
          className="action"
          onClick={handleSend}
          style={{
            width: 210,
            height: "clamp(38px, 5vh, 44px)",
            borderRadius: 8,
            background: C.brown,
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
            Send Notifications
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
  onOkay,
}: {
  opened: boolean;
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

  // popup mein "Okay" dabane par popup band ho, aur wapas list par jao
  const handleOkay = () => {
    setSentOpen(false);
    setView("list");
  };

  return (
    <ReaderLayout title="Notification Management" activePage="notifications">
      <style>{`
        .hide-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .action:hover { opacity: .85; }
        .np-input::placeholder { color: #9A948D; opacity: 1; }
        .np-option { color: #F7E5D7 !important; }
        .np-option:hover,
        .np-option[data-combobox-selected="true"] { background: #45413D !important; }
      `}</style>

      {view === "list" ? (
        <NotificationList onSend={() => setView("send")} />
      ) : (
        <SendForm
          onCancel={() => setView("list")}
          onSent={() => setSentOpen(true)}
        />
      )}

      <SentModal opened={sentOpen} onOkay={handleOkay} />
    </ReaderLayout>
  );
}
