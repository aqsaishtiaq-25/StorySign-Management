import {
  Box,
  Flex,
  Text,
  UnstyledButton,
  Group,
  TextInput,
  Avatar,
} from "@mantine/core";
import { useNavigate } from "react-router-dom";

import {
  MdDashboard,
  MdSearch,
  MdOutlineFeedback,
  MdPrivacyTip,
} from "react-icons/md";

import {
  FaUser,
  FaUserCheck,
  FaBook,
  FaRegListAlt,
  FaBriefcaseMedical,
  FaBell,
  FaCog,
  FaQuestionCircle,
  FaUserCircle,
} from "react-icons/fa";

import { BiLogOut, BiDollarCircle, BiLineChart } from "react-icons/bi";

import logo from "../assets/logo.png";
import profileImg from "../assets/image.jpg";

interface ReaderLayoutProps {
  children: any;
  title: string;
  activePage?:
    | "dashboard"
    | "reader"
    | "author"
    | "ebooks"
    | "requests"
    | "subscription"
    | "autograph"
    | "notifications"
    | "analytics"
    | "queries"
    | "settings"
    | "privacy"
    | "faqs"
    | "profile";
}

export default function ReaderLayout({
  children,
  title,
  activePage = "reader",
}: ReaderLayoutProps) {
  const navigate = useNavigate();

  const outerBg = "#343131";
  const accentCardBg = "#FFE8B6";
  const titleColor = "#6A4335";

  const navIcons: any[] = [
    FaUser,
    FaUserCheck,
    FaBook,
    FaRegListAlt,
    FaBriefcaseMedical,
    BiDollarCircle,
    FaBell,
    BiLineChart,
    MdOutlineFeedback,
    FaCog,
    MdPrivacyTip,
    FaQuestionCircle,
    FaUserCircle,
  ];

  // NOTE: 5 = Autograph Fee, 6 = Notifications, 8 = Queries, 9 = Settings, 12 = Profile
  // Paths yahan App.tsx ke routes se bilkul match karte hain
  const navRoutes: (string | null)[] = [
    "/",
    "/author-management",
    "/ebooks",
    "/requests",
    "/subscription-plans",
    "/autograph",
    "/notification",
    "/reports-analytics",
    "/query-management",
    "/platform-settings",
    "/privacy-policy",
    "/faqs",
    "/profile",
  ];

  const isDashboard = activePage === "dashboard";

  const activeIndex = isDashboard
    ? -1
    : activePage === "reader"
      ? 0
      : activePage === "author"
        ? 1
        : activePage === "ebooks"
          ? 2
          : activePage === "requests"
            ? 3
            : activePage === "subscription"
              ? 4
              : activePage === "autograph"
                ? 5
                : activePage === "notifications"
                  ? 6
                  : activePage === "queries"
                    ? 8
                    : activePage === "settings"
                      ? 9
                      : activePage === "privacy"
                        ? 10
                        : activePage === "faqs"
                          ? 11
                          : activePage === "profile"
                            ? 12
                            : 7;

  const activeLabel =
    activePage === "dashboard"
      ? "Dashboard"
      : activePage === "reader"
        ? "Reader"
        : activePage === "author"
          ? "Author"
          : activePage === "ebooks"
            ? "Ebooks"
            : activePage === "requests"
              ? "Requests"
              : activePage === "subscription"
                ? "Subscription"
                : activePage === "autograph"
                  ? "Autograph Fee"
                  : activePage === "notifications"
                    ? "Notifications"
                    : activePage === "queries"
                      ? "Queries"
                      : activePage === "settings"
                        ? "Settings"
                        : activePage === "privacy"
                          ? "Privacy Policy"
                          : activePage === "faqs"
                            ? "FAQs"
                            : activePage === "profile"
                              ? "Profile"
                              : "Analytics";

  const goTo = (path: string | null) => {
    if (path) navigate(path);
  };

  const activeBlock = (Icon: any) => (
    <Flex direction="column" align="center" gap={4}>
      <Box
        p={9}
        style={{
          backgroundColor: accentCardBg,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={18} color={titleColor} />
      </Box>

      <Box
        px="md"
        py={3}
        style={{
          backgroundColor: titleColor,
          borderRadius: "12px",
        }}
      >
        <Text
          size="10px"
          fw={600}
          c={accentCardBg}
          style={{ whiteSpace: "nowrap" }}
        >
          {activeLabel}
        </Text>
      </Box>
    </Flex>
  );

  return (
    <Flex
      h="100vh"
      w="100vw"
      bg={outerBg}
      c="white"
      style={{ overflow: "hidden", fontFamily: "sans-serif" }}
    >
      <Box
        w={180}
        py="md"
        px="xs"
        style={{
          backgroundColor: outerBg,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          height: "100%",
          flexShrink: 0,
        }}
      >
        <img
          src={logo}
          alt="StorySign"
          style={{ width: "64px", height: "auto", marginBottom: "10px" }}
        />

        <Box
          style={{
            flex: 1,
            minHeight: 0,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: "clamp(21px, 2.4vh, 21px)",
          }}
        >
          {isDashboard ? (
            activeBlock(MdDashboard)
          ) : (
            <UnstyledButton
              onClick={() => goTo("/dashboard")}
              style={{ display: "flex" }}
            >
              <MdDashboard size={20} color={accentCardBg} />
            </UnstyledButton>
          )}

          {navIcons.map((Icon, idx) => {
            if (idx === activeIndex) {
              return (
                <UnstyledButton
                  key={idx}
                  onClick={() => goTo(navRoutes[idx])}
                  style={{ display: "flex" }}
                >
                  {activeBlock(Icon)}
                </UnstyledButton>
              );
            }

            return (
              <UnstyledButton
                key={idx}
                onClick={() => goTo(navRoutes[idx])}
                style={{
                  display: "flex",
                  cursor: navRoutes[idx] ? "pointer" : "default",
                }}
              >
                <Icon size={17} color={accentCardBg} style={{ opacity: 0.9 }} />
              </UnstyledButton>
            );
          })}
        </Box>

        <Box pt="xs" mt="auto">
          <UnstyledButton>
            <Group gap={6} wrap="nowrap">
              <BiLogOut size={18} color={accentCardBg} />

              <Text size="xs" fw={600} c={accentCardBg}>
                Log Out
              </Text>
            </Group>
          </UnstyledButton>
        </Box>
      </Box>

      <Box
        style={{
          flex: 1,
          minWidth: 0,
          backgroundColor: outerBg,
          padding: "16px 24px 16px 24px",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        <Flex align="center" justify="space-between" mb="md">
          <Text size="22px" fw={600} c={accentCardBg}>
            {title}
          </Text>

          <Group gap={28} align="center">
            <TextInput
              placeholder="Search"
              leftSection={<MdSearch size={18} color="#A0A0A0" />}
              styles={{
                input: {
                  width: "240px",
                  height: "36px",
                  backgroundColor: "transparent",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  borderRadius: "20px",
                  color: "#FFFFFF",
                  paddingLeft: "36px",
                  fontSize: "13px",
                },
              }}
            />

            <Group gap="xs" align="center" style={{ width: 170 }}>
              <Avatar src={profileImg} size={36} radius="xl" />

              <Box>
                <Text
                  size="12px"
                  fw={500}
                  c="#FFFFFF"
                  style={{ lineHeight: 1.2 }}
                >
                  John ibrahim
                </Text>

                <Text size="10px" c="#8C8C8C" style={{ lineHeight: 1.2 }}>
                  john@gmail.com
                </Text>
              </Box>
            </Group>
          </Group>
        </Flex>

        <Box
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {children}
        </Box>
      </Box>
    </Flex>
  );
}
