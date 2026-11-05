import { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Text,
  Group,
  Stack,
  TextInput,
  Textarea,
  Button,
  ActionIcon,
  Overlay,
  UnstyledButton,
} from "@mantine/core";

import { MdSearch } from "react-icons/md";
import { FaTrashAlt, FaPen } from "react-icons/fa";
import { HiOutlineBadgeCheck } from "react-icons/hi";

import ReaderLayout from "./ReaderLayout";
import Pagination from "./Pagination"; // path apne folder ke hisaab se theek kar lein
import {
  getFaqs,
  createFaq,
  updateFaq,
  deleteFaq as deleteFaqApi,
} from "../api";
import type { ApiFaq } from "../api";

const cream = "#FFE8B6";
const brown = "#81401F";
const dark = "#211E1E";
const inputBg = "#343131";
const popupBg = "#FFEBBC";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
}

const toFaq = (f: ApiFaq): FAQ => ({
  id: f.id,
  question: f.question,
  answer: f.answer,
  sortOrder: f.sortOrder ?? 0,
});

export default function FAQsManagement() {
  const [view, setView] = useState<"list" | "form">("list");
  const [showSuccess, setShowSuccess] = useState(false);

  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [showError, setShowError] = useState(false);

  const isEditing = editingId !== null;
  const pageSize = 6;

  // ---------- Backend se list lana ----------
  const loadFaqs = async (isCancelled: () => boolean = () => false) => {
    try {
      const res = await getFaqs();
      if (isCancelled()) return;

      // list "data" mein ho sakti hai, ya seedha array ho
      const raw = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res)
          ? res
          : null;

      if (!raw) {
        throw new Error("Server se FAQs ki list nahi mili.");
      }

      const list: ApiFaq[] = raw;
      setFaqs(list.map(toFaq).sort((a, b) => a.sortOrder - b.sortOrder));
      setErrorMsg("");
    } catch (err) {
      if (isCancelled()) return;
      setErrorMsg((err as Error).message);
    } finally {
      if (!isCancelled()) setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    loadFaqs(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, []);
  // ------------------------------------------

  const filteredFAQs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase()),
  );

  // ---------- Pagination ----------
  const totalPages = Math.max(1, Math.ceil(filteredFAQs.length / pageSize));
  const currentPage = Math.max(1, Math.min(page, totalPages));

  const visibleFAQs = filteredFAQs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  // --------------------------------

  const resetForm = () => {
    setEditingId(null);
    setQuestion("");
    setAnswer("");
    setShowError(false);
  };

  const openAddForm = () => {
    resetForm();
    setErrorMsg("");
    setView("form");
  };

  const openEditForm = (faq: FAQ) => {
    setEditingId(faq.id);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setShowError(false);
    setErrorMsg("");
    setView("form");
  };

  const handleCancel = () => {
    resetForm();
    setErrorMsg("");
    setView("list");
  };

  const handleDelete = async (id: string) => {
    try {
      setErrorMsg("");
      await deleteFaqApi(id);
      await loadFaqs();
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  const handleSubmit = async () => {
    const cleanQuestion = question.trim();
    const cleanAnswer = answer.trim();

    if (!cleanQuestion || !cleanAnswer) {
      setShowError(true);
      return;
    }

    try {
      setSaving(true);
      setShowError(false);
      setErrorMsg("");

      if (editingId) {
        await updateFaq(editingId, {
          question: cleanQuestion,
          answer: cleanAnswer,
        });
      } else {
        // nayi FAQ list ke aakhir mein: sab se bade sortOrder ke baad
        const nextOrder =
          faqs.length > 0 ? Math.max(...faqs.map((f) => f.sortOrder)) + 1 : 1;

        await createFaq({
          question: cleanQuestion,
          answer: cleanAnswer,
          sortOrder: nextOrder,
          isPublished: true,
        });
      }

      await loadFaqs();
      setShowSuccess(true);
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleOkay = () => {
    setShowSuccess(false);
    resetForm();
    setSearch("");
    setPage(1);
    setView("list");
  };

  const iconBtnStyles = {
    root: {
      border: "1px solid rgba(255,232,182,0.8)",
      color: cream,
      backgroundColor: "transparent",
    },
  };

  const inputStyles = {
    input: {
      height: "36px",
      minHeight: "36px",
      backgroundColor: inputBg,
      border: "none",
      borderRadius: "6px",
      color: "#FFFFFF",
      fontSize: "12px",
      paddingLeft: "16px",
    },
  };

  return (
    <ReaderLayout
      title={view === "list" ? "FAQs Management" : "FAQs"}
      activePage="faqs"
    >
      {view === "list" && (
        <>
          <Box
            style={{
              backgroundColor: dark,
              borderRadius: "20px",
              flex: 1,
              minHeight: 0,
              padding: "20px",
              boxSizing: "border-box",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Flex
              justify="space-between"
              align="center"
              mb={8}
              style={{ flexShrink: 0 }}
            >
              <Text size="22px" fw={700} c={cream}>
                All FAQs
              </Text>

              <Group gap={14} wrap="nowrap">
                <TextInput
                  placeholder="Search"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.currentTarget.value);
                    setPage(1);
                  }}
                  leftSection={<MdSearch size={17} color="#E0E0E0" />}
                  styles={{
                    input: {
                      width: "220px",
                      height: "34px",
                      minHeight: "34px",
                      backgroundColor: "#383838",
                      border: "none",
                      borderRadius: "20px",
                      color: "#FFFFFF",
                      fontSize: "12px",
                      paddingLeft: "36px",
                    },
                  }}
                />

                <UnstyledButton
                  onClick={openAddForm}
                  style={{
                    height: "34px",
                    padding: "0 22px",
                    backgroundColor: brown,
                    borderRadius: "20px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Text size="12px" fw={500} c={cream}>
                    Add Question
                  </Text>
                </UnstyledButton>
              </Group>
            </Flex>

            {errorMsg && (
              <Text c="red.4" size="xs" mb={8}>
                {errorMsg}
              </Text>
            )}

            <Stack
              gap={0}
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                scrollbarWidth: "none",
              }}
            >
              {visibleFAQs.map((faq, index) => (
                <Box
                  key={faq.id}
                  style={{
                    position: "relative",
                    padding: "10px 110px 12px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.14)",
                    boxSizing: "border-box",
                    flexShrink: 0,
                  }}
                >
                  <Text
                    fw={600}
                    c={cream}
                    style={{ fontSize: 17, lineHeight: 1.4, marginBottom: 6 }}
                  >
                    {(currentPage - 1) * pageSize + index + 1}. {faq.question}
                  </Text>

                  <Text
                    c="#C9C5BE"
                    style={{
                      fontSize: 12,
                      lineHeight: 1.6,
                      whiteSpace: "pre-line",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {faq.answer}
                  </Text>

                  <Group
                    gap={8}
                    wrap="nowrap"
                    style={{ position: "absolute", top: 10, right: 0 }}
                  >
                    <ActionIcon
                      variant="transparent"
                      radius="xl"
                      size={26}
                      aria-label="Delete FAQ"
                      onClick={() => handleDelete(faq.id)}
                      styles={iconBtnStyles}
                    >
                      <FaTrashAlt size={10} />
                    </ActionIcon>

                    <ActionIcon
                      variant="transparent"
                      radius="xl"
                      size={26}
                      aria-label="Edit FAQ"
                      onClick={() => openEditForm(faq)}
                      styles={iconBtnStyles}
                    >
                      <FaPen size={10} />
                    </ActionIcon>
                  </Group>
                </Box>
              ))}

              {loading && (
                <Text ta="center" c="#B8B4B0" size="sm" py="xl">
                  Loading FAQs...
                </Text>
              )}

              {!loading && visibleFAQs.length === 0 && (
                <Text ta="center" c="#B8B4B0" size="sm" py="xl">
                  No FAQs found.
                </Text>
              )}
            </Stack>
          </Box>

          <Pagination
            page={currentPage}
            totalPages={totalPages}
            onChange={setPage}
          />
        </>
      )}

      {view === "form" && (
        <Box
          style={{
            width: "100%",
            backgroundColor: dark,
            borderRadius: "20px",
            padding: "22px 20px 26px 20px",
            boxSizing: "border-box",
          }}
        >
          <Text size="20px" fw={700} c={cream} mb={16}>
            Frequently Asked Questions
          </Text>

          <Text size="15px" c={cream} mb={10}>
            Question Title
          </Text>

          <TextInput
            placeholder="Title"
            value={question}
            onChange={(event) => setQuestion(event.currentTarget.value)}
            styles={inputStyles}
            mb={18}
          />

          <Text size="15px" c={cream} mb={10}>
            Answer
          </Text>

          <Textarea
            placeholder="Write answer here..."
            value={answer}
            onChange={(event) => setAnswer(event.currentTarget.value)}
            styles={{
              input: {
                height: "135px",
                minHeight: "135px",
                backgroundColor: inputBg,
                border: "none",
                borderRadius: "6px",
                color: "#FFFFFF",
                fontSize: "12px",
                padding: "12px 16px",
                resize: "none",
              },
            }}
          />

          {showError && (
            <Text size="12px" c="#FF6B6B" mt={12}>
              Please enter Question Title and Answer
            </Text>
          )}

          {errorMsg && (
            <Text size="12px" c="#FF6B6B" mt={12}>
              {errorMsg}
            </Text>
          )}

          <Group gap={16} mt={showError || errorMsg ? 36 : 60} align="center">
            <Button
              w={180}
              h={36}
              radius={6}
              color="#81401F"
              c="#FFE8B6"
              fw={500}
              onClick={handleSubmit}
              loading={saving}
              styles={{ root: { fontSize: "13px" } }}
            >
              {isEditing ? "Update FAQ" : "Add FAQ"}
            </Button>

            <Button
              w={180}
              h={36}
              radius={6}
              color="#2B2B2B"
              c="#E0E0E0"
              fw={400}
              onClick={handleCancel}
              styles={{ root: { fontSize: "13px" } }}
            >
              Cancel
            </Button>
          </Group>
        </Box>
      )}

      {showSuccess && (
        <Box
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px",
          }}
        >
          <Overlay
            color="#000000"
            backgroundOpacity={0.55}
            blur={2}
            zIndex={0}
          />

          <Box
            style={{
              position: "relative",
              zIndex: 1,
              width: "400px",
              maxWidth: "100%",
              minHeight: "250px",
              padding: "32px 28px",
              boxSizing: "border-box",
              backgroundColor: popupBg,
              borderRadius: "16px",
              boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <HiOutlineBadgeCheck size={46} color={brown} />

            <Text size="16px" fw={500} c="#3A2A20" mb={26}>
              {isEditing
                ? "FAQs has been updated successfully"
                : "FAQs has been added successfully"}
            </Text>

            <Button
              w={110}
              h={34}
              radius={6}
              color="#81401F"
              c="#FFEBBC"
              fw={600}
              onClick={handleOkay}
              styles={{ root: { fontSize: "13px" } }}
            >
              Okay
            </Button>
          </Box>
        </Box>
      )}
    </ReaderLayout>
  );
}
