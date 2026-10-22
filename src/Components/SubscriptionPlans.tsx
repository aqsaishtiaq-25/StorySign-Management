import { useState } from "react";
import {
  Box,
  Flex,
  Text,
  Group,
  Stack,
  SimpleGrid,
  Table,
  Avatar,
  TextInput,
  Select,
  Button,
  Overlay,
  UnstyledButton,
} from "@mantine/core";

import { MdSearch, MdFilterList, MdAdd } from "react-icons/md";
import { HiOutlineBadgeCheck } from "react-icons/hi";

import ReaderLayout from "./ReaderLayout";
import Pagination from "./Pagination"; // path apne folder ke hisaab se theek kar lein
import authorImg from "../assets/Author-image.png";

export default function SubscriptionPlans() {
  const accent = "#FFE8B6";
  const dark = "#211E1E";
  const inputBg = "#343131";
  const brown = "#81401F";

  const [view, setView] = useState<"list" | "form">("list");
  const [showSuccess, setShowSuccess] = useState(false);

  const [planName, setPlanName] = useState("");
  const [planType, setPlanType] = useState<string | null>("Monthly");
  const [planCharges, setPlanCharges] = useState("");
  const [features, setFeatures] = useState<string[]>([""]);

  const resetForm = () => {
    setPlanName("");
    setPlanType("Monthly");
    setPlanCharges("");
    setFeatures([""]);
  };

  const handleCancel = () => {
    resetForm();
    setView("list");
  };

  const handleAddPlan = () => {
    console.log({ planName, planType, planCharges, features });
    setShowSuccess(true);
  };

  const handleOkay = () => {
    setShowSuccess(false);
    resetForm();
    setView("list");
  };

  const handleAddMore = () => {
    setFeatures((prev) => [...prev, ""]);
  };

  const handleFeatureChange = (index: number, value: string) => {
    setFeatures((prev) => prev.map((f, i) => (i === index ? value : f)));
  };

  const plans = [
    {
      name: "Starter",
      price: "$9",
      subtitle: "For New Authors",
      features: [
        "25 Signature per month",
        "Signed ebooks with messages",
        "Approve and reject autograph request",
        "Manage profile",
        "Email support",
      ],
    },
    {
      name: "Pro",
      price: "$29",
      subtitle: "Most Popular",
      features: [
        "100 Signature per month",
        "Signed ebooks with messages",
        "Approve and reject autograph request",
        "Manage profile",
        "Email support",
      ],
    },
    {
      name: "Premium",
      price: "$49",
      subtitle: "Best For Book Organizations",
      features: [
        "Unlimited Signature per month",
        "Signed ebooks with messages",
        "Approve and reject autograph request",
        "Manage profile",
        "Email support",
      ],
    },
  ];

  const subscribers = [
    {
      name: "Cordell Edwards",
      plan: "Starter",
      billing: "$9/m",
      started: "23 June, 2026",
      nextBill: "23 Jul, 2026",
    },
    {
      name: "Cordell Edwards",
      plan: "Professional",
      billing: "$29/m",
      started: "23 June, 2026",
      nextBill: "23 Jul, 2026",
    },
    {
      name: "Cordell Edwards",
      plan: "Premium",
      billing: "$49/m",
      started: "23 June, 2026",
      nextBill: "23 Jul, 2026",
    },
    {
      name: "Cordell Edwards",
      plan: "Starter",
      billing: "$9/m",
      started: "23 June, 2026",
      nextBill: "23 Jul, 2026",
    },
    {
      name: "Cordell Edwards",
      plan: "Professional",
      billing: "$29/m",
      started: "23 June, 2026",
      nextBill: "23 Jul, 2026",
    },
  ];

  // ---------- Pagination ----------
  const PAGE_SIZE = 3; // ek page par 3 rows (design ke mutabiq)
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(subscribers.length / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const currentSubscribers = subscribers.slice(start, start + PAGE_SIZE);
  // --------------------------------

  const badgeStyle = (plan: string) => {
    if (plan === "Starter") {
      return {
        backgroundColor: "rgba(200, 185, 150, 0.25)",
        color: accent,
        border: "1px solid rgba(255,232,182,0.7)",
      };
    }

    if (plan === "Professional") {
      return {
        backgroundColor: "rgba(129, 64, 31, 0.4)",
        color: "#E99A70",
        border: "1px solid #A15D40",
      };
    }

    return {
      backgroundColor: "rgba(129, 64, 31, 0.15)",
      color: "#B96835",
      border: "1px solid #71391F",
    };
  };

  const thStyle = {
    color: accent,
    fontSize: "14px",
    fontWeight: 700,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottom: "none",
  };

  const tdStyle = {
    borderBottom: "1px solid rgba(255,255,255,0.12)",
  };

  const inputStyles = {
    input: {
      height: "34px",
      minHeight: "34px",
      backgroundColor: inputBg,
      border: "none",
      borderRadius: "6px",
      color: "#FFFFFF",
      fontSize: "12px",
      paddingLeft: "14px",
    },
    dropdown: {
      backgroundColor: inputBg,
      border: "1px solid #45413B",
    },
    option: {
      color: "#FFFFFF",
      fontSize: "12px",
    },
  };

  return (
    <ReaderLayout
      title={view === "list" ? "Subscription Plans" : "Subscription Plan"}
      activePage="subscription"
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
            <SimpleGrid cols={3} spacing={14} style={{ flexShrink: 0 }}>
              {plans.map((plan) => (
                <Box
                  key={plan.name}
                  style={{
                    height: "160px",
                    backgroundColor: accent,
                    borderRadius: "12px",
                    padding: "14px 16px",
                    boxSizing: "border-box",
                  }}
                >
                  <Flex justify="space-between" align="center" mb={8}>
                    <Text size="18px" fw={700} c="#211E1E">
                      {plan.name}
                    </Text>

                    <Text size="18px" fw={600} c="#211E1E">
                      {plan.price}
                      <Text span size="11px" fw={500}>
                        /m
                      </Text>
                    </Text>
                  </Flex>

                  <Text size="10px" fw={700} c="#30251C" mb={8}>
                    {plan.subtitle}
                  </Text>

                  <Stack gap={5}>
                    {plan.features.map((feature) => (
                      <Text
                        key={feature}
                        size="10px"
                        c="#5C5142"
                        style={{ lineHeight: 1.4 }}
                      >
                        {feature}
                      </Text>
                    ))}
                  </Stack>
                </Box>
              ))}
            </SimpleGrid>

            <Flex
              justify="space-between"
              align="center"
              mt={28}
              mb={12}
              style={{ flexShrink: 0 }}
            >
              <Text size="22px" fw={700} c={accent}>
                All Subscribers
              </Text>

              <Group gap={12}>
                <TextInput
                  placeholder="Search"
                  leftSection={<MdSearch size={15} color="#D5D0C6" />}
                  styles={{
                    input: {
                      width: "180px",
                      height: "32px",
                      minHeight: "32px",
                      backgroundColor: "#383838",
                      border: "none",
                      borderRadius: "20px",
                      color: "#FFFFFF",
                      fontSize: "11px",
                      paddingLeft: "32px",
                    },
                  }}
                />

                <UnstyledButton
                  style={{
                    height: "32px",
                    padding: "0 14px",
                    backgroundColor: "#383838",
                    borderRadius: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <MdFilterList size={14} color="#E0E0E0" />
                  <Text size="11px" c="#E0E0E0">
                    Filter
                  </Text>
                </UnstyledButton>

                <UnstyledButton
                  onClick={() => setView("form")}
                  style={{
                    height: "32px",
                    padding: "0 14px",
                    backgroundColor: brown,
                    borderRadius: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <MdAdd size={15} color={accent} />
                  <Text size="11px" c={accent}>
                    Add Plan
                  </Text>
                </UnstyledButton>
              </Group>
            </Flex>

            <Box style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
              <Table
                horizontalSpacing={0}
                verticalSpacing={8}
                style={{
                  width: "100%",
                  tableLayout: "fixed",
                  color: "#CCCCCC",
                }}
              >
                <Table.Thead>
                  <Table.Tr style={{ borderBottom: "none" }}>
                    <Table.Th style={{ ...thStyle, width: "23%" }}>
                      Author Detail
                    </Table.Th>
                    <Table.Th style={{ ...thStyle, width: "15%" }}>
                      Plan
                    </Table.Th>
                    <Table.Th style={{ ...thStyle, width: "16%" }}>
                      Billing
                    </Table.Th>
                    <Table.Th style={{ ...thStyle, width: "17%" }}>
                      Started
                    </Table.Th>
                    <Table.Th style={{ ...thStyle, width: "19%" }}>
                      Next Bill
                    </Table.Th>
                    <Table.Th style={{ ...thStyle, width: "10%" }}>
                      Action
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>

                <Table.Tbody>
                  {currentSubscribers.map((subscriber, index) => (
                    <Table.Tr
                      key={start + index}
                      style={{ borderBottom: "none" }}
                    >
                      <Table.Td py={12} style={tdStyle}>
                        <Group gap={8} wrap="nowrap">
                          <Avatar src={authorImg} size={34} radius="xl" />

                          <Text
                            size="12px"
                            c="#FFFFFF"
                            fw={500}
                            style={{ lineHeight: 1.25 }}
                          >
                            Cordell
                            <br />
                            Edwards
                          </Text>
                        </Group>
                      </Table.Td>

                      <Table.Td py={12} style={tdStyle}>
                        <Box
                          style={{
                            display: "inline-block",
                            borderRadius: "6px",
                            padding: "4px 10px",
                            fontSize: "10px",
                            fontWeight: 500,
                            lineHeight: 1.1,
                            ...badgeStyle(subscriber.plan),
                          }}
                        >
                          {subscriber.plan}
                        </Box>
                      </Table.Td>

                      <Table.Td py={12} style={tdStyle}>
                        <Text size="14px" c={accent} fw={400}>
                          {subscriber.billing}
                        </Text>
                      </Table.Td>

                      <Table.Td py={12} style={tdStyle}>
                        <Text size="10px" c="#E0E0E0" fw={500}>
                          {subscriber.started}
                        </Text>
                      </Table.Td>

                      <Table.Td py={12} style={tdStyle}>
                        <Text size="10px" c="#E0E0E0" fw={500}>
                          {subscriber.nextBill}
                        </Text>
                      </Table.Td>

                      <Table.Td py={12} style={tdStyle}>
                        <UnstyledButton>
                          <Text size="10px" c={accent} fw={400} td="underline">
                            View Profile
                          </Text>
                        </UnstyledButton>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Box>
          </Box>

          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}

      {view === "form" && (
        <Box
          style={{
            width: "100%",
            minHeight: "340px",
            backgroundColor: dark,
            borderRadius: "20px",
            padding: "22px 20px 26px 20px",
            boxSizing: "border-box",
          }}
        >
          <Text size="20px" fw={700} c={accent} mb={14}>
            Add Plan
          </Text>

          <Flex gap={16} align="flex-start" mb={14}>
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Text size="16px" c={accent} mb={10}>
                Plan Name
              </Text>

              <TextInput
                placeholder="Starter"
                value={planName}
                onChange={(e) => setPlanName(e.currentTarget.value)}
                styles={inputStyles}
              />
            </Box>

            <Box style={{ flex: 1, minWidth: 0 }}>
              <Text size="16px" c={accent} mb={10}>
                Plan Type
              </Text>

              <Select
                data={["Monthly", "Yearly"]}
                value={planType}
                onChange={setPlanType}
                allowDeselect={false}
                styles={inputStyles}
              />
            </Box>

            <Box style={{ flex: 1, minWidth: 0 }}>
              <Text size="16px" c={accent} mb={10}>
                Plan Charges
              </Text>

              <TextInput
                placeholder="$29"
                value={planCharges}
                onChange={(e) => setPlanCharges(e.currentTarget.value)}
                styles={inputStyles}
              />
            </Box>
          </Flex>

          <Text size="16px" c={accent} mb={10}>
            Features
          </Text>

          <Group align="flex-start" gap={16} wrap="nowrap">
            <Stack gap={10} style={{ flex: 1, minWidth: 0 }}>
              {features.map((feature, index) => (
                <TextInput
                  key={index}
                  value={feature}
                  onChange={(e) =>
                    handleFeatureChange(index, e.currentTarget.value)
                  }
                  styles={inputStyles}
                />
              ))}
            </Stack>

            <Button
              w={100}
              h={34}
              radius={6}
              color="#FFE8B6"
              c="#81401F"
              fw={500}
              onClick={handleAddMore}
              styles={{ root: { fontSize: "13px" } }}
            >
              Add More
            </Button>
          </Group>

          <Group gap={16} mt={56} align="center">
            <Button
              w={160}
              h={34}
              radius={6}
              color="#81401F"
              c="#FFE8B6"
              fw={500}
              onClick={handleAddPlan}
              styles={{ root: { fontSize: "13px" } }}
            >
              Add Plan
            </Button>

            <Button
              w={160}
              h={34}
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
            backgroundOpacity={0.5}
            blur={3}
            zIndex={0}
          />

          <Box
            style={{
              position: "relative",
              zIndex: 1,
              width: "350px",
              maxWidth: "100%",
              minHeight: "255px",
              padding: "30px 28px",
              boxSizing: "border-box",
              backgroundColor: "#FFEBBC",
              borderRadius: "14px",
              boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <HiOutlineBadgeCheck size={42} color="#81401F" />

            <Text
              size="15px"
              fw={500}
              c="#3A2A20"
              mb={26}
              style={{ lineHeight: 1.5 }}
            >
              Subscription plan has been
              <br />
              added successfully
            </Text>

            <Button
              w={100}
              h={32}
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
