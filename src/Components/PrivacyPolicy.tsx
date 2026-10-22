import { useState } from "react";
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

const cream = "#FFE8B6";
const brown = "#81401F";
const dark = "#211E1E";
const inputBg = "#343131";
const popupBg = "#FFEBBC";

interface Policy {
  id: number;
  title: string;
  description: string;
}

const initialPolicies: Policy[] = [
  {
    id: 1,
    title: "Introduction",
    description:
      "StorySign values your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, and protect user data within the StorySign platform.",
  },
  {
    id: 2,
    title: "Introduction",
    description:
      "StorySign We may collect the following information:\nFull name\nEmail address\nProfile information\nPayment-related information\nUploaded ebooks and files\nTransaction history\nCommunication and support requests",
  },
  {
    id: 3,
    title: "Payment Security",
    description:
      "All payment transactions are processed through secure payment gateways. StorySign does not store sensitive payment card details directly on its servers.",
  },
  {
    id: 4,
    title: "Data Protection",
    description:
      "We implement industry-standard security measures to protect user data against unauthorized access, loss, or misuse.",
  },
  {
    id: 5,
    title: "How We Use Information",
    description:
      "Your information is used to: Create and manage accounts, Process payments and signature requests, Process payments and signature requests and Deliver signed ebooks.",
  },
  // neeche ki 3 policies sirf page 2 dikhane ke liye hain (asli data mein zaroorat nahi)
  {
    id: 6,
    title: "Data Protection",
    description:
      "We implement industry-standard security measures to protect user data against unauthorized access, loss, or misuse.",
  },
  {
    id: 7,
    title: "Payment Security",
    description:
      "All payment transactions are processed through secure payment gateways. StorySign does not store sensitive payment card details directly on its servers.",
  },
  {
    id: 8,
    title: "Introduction",
    description:
      "StorySign values your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, and protect user data within the StorySign platform.",
  },
];

export default function PrivacyPolicy() {
  const [view, setView] = useState<"list" | "form">("list");
  const [showSuccess, setShowSuccess] = useState(false);

  const [policies, setPolicies] = useState<Policy[]>(initialPolicies);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const isEditing = editingId !== null;
  const pageSize = 5;

  const filteredPolicies = policies.filter(
    (policy) =>
      policy.title.toLowerCase().includes(search.toLowerCase()) ||
      policy.description.toLowerCase().includes(search.toLowerCase()),
  );

  // ---------- Pagination ----------
  const totalPages = Math.max(1, Math.ceil(filteredPolicies.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const visiblePolicies = filteredPolicies.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  // --------------------------------

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
  };

  const openAddForm = () => {
    resetForm();
    setView("form");
  };

  const openEditForm = (policy: Policy) => {
    setEditingId(policy.id);
    setTitle(policy.title);
    setDescription(policy.description);
    setView("form");
  };

  const handleCancel = () => {
    resetForm();
    setView("list");
  };

  const deletePolicy = (id: number) => {
    setPolicies((current) => current.filter((policy) => policy.id !== id));
  };

  const handleSubmit = () => {
    const cleanTitle = title.trim();
    const cleanDescription = description.trim();

    if (cleanTitle) {
      if (isEditing) {
        setPolicies((current) =>
          current.map((policy) =>
            policy.id === editingId
              ? { ...policy, title: cleanTitle, description: cleanDescription }
              : policy,
          ),
        );
      } else {
        setPolicies((current) => [
          ...current,
          {
            id: Date.now(),
            title: cleanTitle,
            description: cleanDescription,
          },
        ]);
      }
    }

    setShowSuccess(true);
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
    <ReaderLayout title="Privacy Policy" activePage="privacy">
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
                All Policies
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
                    Add Policy
                  </Text>
                </UnstyledButton>
              </Group>
            </Flex>

            <Stack
              gap={0}
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                scrollbarWidth: "none",
              }}
            >
              {visiblePolicies.map((policy) => (
                <Box
                  key={policy.id}
                  style={{
                    position: "relative",
                    padding: "10px 110px 12px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.14)",
                    boxSizing: "border-box",
                    flexShrink: 0,
                  }}
                >
                  <Text
                    fw={500}
                    c={cream}
                    style={{ fontSize: 17, lineHeight: 1.4, marginBottom: 6 }}
                  >
                    {policy.title}
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
                    {policy.description}
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
                      aria-label="Delete policy"
                      onClick={() => deletePolicy(policy.id)}
                      styles={iconBtnStyles}
                    >
                      <FaTrashAlt size={10} />
                    </ActionIcon>

                    <ActionIcon
                      variant="transparent"
                      radius="xl"
                      size={26}
                      aria-label="Edit policy"
                      onClick={() => openEditForm(policy)}
                      styles={iconBtnStyles}
                    >
                      <FaPen size={10} />
                    </ActionIcon>
                  </Group>
                </Box>
              ))}

              {visiblePolicies.length === 0 && (
                <Text ta="center" c="#B8B4B0" size="sm" py="xl">
                  No policies found.
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
            {isEditing ? "Edit Policy" : "Add Policy"}
          </Text>

          <Text size="15px" c={cream} mb={10}>
            Policy Title
          </Text>

          <TextInput
            placeholder="Title"
            value={title}
            onChange={(event) => setTitle(event.currentTarget.value)}
            styles={inputStyles}
            mb={18}
          />

          <Text size="15px" c={cream} mb={10}>
            Description
          </Text>

          <Textarea
            placeholder="Write description here..."
            value={description}
            onChange={(event) => setDescription(event.currentTarget.value)}
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

          <Group gap={16} mt={60} align="center">
            <Button
              w={180}
              h={36}
              radius={6}
              color="#81401F"
              c="#FFE8B6"
              fw={500}
              onClick={handleSubmit}
              styles={{ root: { fontSize: "13px" } }}
            >
              {isEditing ? "Update Policy" : "Add Policy"}
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
              width: "380px",
              maxWidth: "100%",
              minHeight: "270px",
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

            <Text
              size="16px"
              fw={500}
              c="#3A2A20"
              mb={26}
              style={{ lineHeight: 1.5 }}
            >
              Privacy Policy has been
              <br />
              {isEditing ? "updated successfully" : "added successfully"}
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
