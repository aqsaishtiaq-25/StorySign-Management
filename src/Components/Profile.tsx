import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import {
  Box,
  Flex,
  Modal,
  Text,
  TextInput,
  UnstyledButton,
} from "@mantine/core";
import { FaPen, FaCamera } from "react-icons/fa";
import { MdOutlineVerified } from "react-icons/md";

import ReaderLayout from "./ReaderLayout";
import alexa from "../assets/Readerimg.png"; // Alexa (girl) photo
import { getMyProfile, updateMyProfile } from "../api";

/**
 * SIZING
 * One "u" = 1 Figma pixel, scaled so the frame fits the screen height.
 * Sidebar, header, logo, search and profile (top-right) come from ReaderLayout.
 */
const u = (n: number): string => `calc(var(--u) * ${n})`;
const uMin = (n: number, min: number): string =>
  `max(${min}px, calc(var(--u) * ${n}))`;

const FONT = '"Nunito", Arial, sans-serif';

const rootVars = { "--u": "calc(100dvh / 1024)" } as CSSProperties;

/** Icon wrapper: size comes from the Box, icon fills it (avoids the style typing error) */
const Ico = ({
  icon: Icon,
  n,
  min,
  color,
}: {
  icon: any;
  n: number;
  min: number;
  color?: string;
}) => (
  <Box
    style={{
      width: uMin(n, min),
      height: uMin(n, min),
      display: "flex",
      flexShrink: 0,
      color,
    }}
  >
    <Icon size="100%" />
  </Box>
);

const C = {
  bg: "#303030",
  panel: "#211F1F",
  cream: "#FFE8B6",
  brown: "#8C451F",
  active: "#91451F",
  white: "#F7E5D7",
};

const circleImg = (size: string): CSSProperties => ({
  width: size,
  height: size,
  borderRadius: "50%",
  objectFit: "cover",
  flexShrink: 0,
});

const emptyForm: Record<string, string> = {
  fullName: "",
  email: "",
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export default function Profile() {
  const [form, setForm] = useState<Record<string, string>>(emptyForm);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [successOpen, setSuccessOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // name + email shown at the top of the panel
  const [profileInfo, setProfileInfo] = useState({
    name: "",
    email: "",
  });

  // Page khulte hi asli profile backend se laao
  useEffect(() => {
    getMyProfile()
      .then((data) => {
        const p = data.user ?? data;
        const name = `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim();
        const email = p.email ?? "";
        setProfileInfo({ name, email });
        setForm((prev) => ({ ...prev, fullName: name, email }));
      })
      .catch((err) => setErrorMsg((err as Error).message));
  }, []);

  const setField = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // true when this field is not valid. Passwords are optional: leave all three empty to keep the old one.
  const isInvalid = (key: string): boolean => {
    if (key === "fullName" || key === "email") return form[key].trim() === "";
    const changingPassword =
      form.oldPassword !== "" ||
      form.newPassword !== "" ||
      form.confirmPassword !== "";
    if (!changingPassword) return false;
    if (key === "confirmPassword")
      return form.confirmPassword !== form.newPassword;
    return form[key] === "";
  };

  const hasError = (key: string): boolean => submitted && isInvalid(key);

  // SCREEN 1 -> SCREEN 2 (success popup)
  const handleUpdate = async () => {
    setSubmitted(true);
    setErrorMsg("");
    const keys = [
      "fullName",
      "email",
      "oldPassword",
      "newPassword",
      "confirmPassword",
    ];
    if (keys.some(isInvalid)) return;

    const [firstName, ...rest] = form.fullName.trim().split(" ");
    const lastName = rest.join(" ");

    try {
      setLoading(true);
      await updateMyProfile({
        firstName,
        lastName: lastName || undefined,
        email: form.email.trim(),
      });
      setSuccessOpen(true);
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSubmitted(false);
    setErrorMsg("");
    setForm({
      ...emptyForm,
      fullName: profileInfo.name,
      email: profileInfo.email,
    });
  };

  // Okay on the popup: show new name/email, back to screen 1
  const handleOkay = () => {
    const name = form.fullName.trim();
    const email = form.email.trim();
    setProfileInfo({ name, email });
    setSuccessOpen(false);
    setSubmitted(false);
    setForm({ ...emptyForm, fullName: name, email });
  };

  return (
    <ReaderLayout title="Profile" activePage="profile">
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap");
        :root { --u: calc(100dvh / 1024); }
        .action:hover { opacity: .85; }
      `}</style>

      <Box
        style={{
          ...rootVars,
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          fontFamily: FONT,
        }}
      >
        {/* ================= SCREEN 1: PROFILE FORM ================= */}
        <Box
          bg={C.panel}
          style={{
            position: "relative",
            height: u(637),
            flexShrink: 0,
            borderRadius: u(18),
            overflow: "hidden",
          }}
        >
          {/* avatar 101 x 101 with the small camera badge */}
          <Box
            style={{
              position: "absolute",
              top: u(40),
              left: u(41),
              width: u(101),
              height: u(101),
            }}
          >
            <img src={alexa} alt={profileInfo.name} style={circleImg("100%")} />
            <Box
              style={{
                position: "absolute",
                right: u(-2),
                bottom: u(2),
                width: u(24),
                height: u(24),
                borderRadius: "50%",
                background: C.active,
                color: C.cream,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ico icon={FaCamera} n={11} min={7} />
            </Box>
          </Box>

          {/* name + email */}
          <Box style={{ position: "absolute", top: u(65), left: u(171) }}>
            <Text
              c={C.white}
              fw={600}
              style={{ fontSize: uMin(26, 14), lineHeight: 1 }}
            >
              {profileInfo.name}
            </Text>
            <Text
              c={C.white}
              style={{
                fontSize: uMin(17, 10),
                lineHeight: 1,
                marginTop: u(11),
              }}
            >
              {profileInfo.email}
            </Text>
          </Box>

          {/* edit button (38 round) */}
          <UnstyledButton
            aria-label="Edit profile"
            className="action"
            style={{
              position: "absolute",
              top: u(71),
              right: u(42),
              width: u(38),
              height: u(38),
              borderRadius: "50%",
              background: C.active,
              color: C.cream,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ico icon={FaPen} n={15} min={9} />
          </UnstyledButton>

          {/* row 1: Full Name | Email Address */}
          <Box
            style={{
              position: "absolute",
              top: u(183),
              left: u(41),
              right: u(55),
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: u(25),
            }}
          >
            {[
              { key: "fullName", label: "Full Name", type: "text" },
              { key: "email", label: "Email Address", type: "email" },
            ].map((f) => (
              <Box key={f.key}>
                <Text
                  c={C.white}
                  style={{ fontSize: uMin(17, 10), lineHeight: 1 }}
                >
                  {f.label}
                </Text>
                <TextInput
                  aria-label={f.label}
                  type={f.type}
                  value={form[f.key]}
                  onChange={(e) => setField(f.key, e.currentTarget.value)}
                  styles={{
                    root: { marginTop: u(17) },
                    input: {
                      height: u(56),
                      minHeight: 0,
                      background: C.bg,
                      border: hasError(f.key) ? "1px solid #E65A5A" : "none",
                      borderRadius: u(3),
                      color: "#FFFFFF",
                      fontSize: uMin(17, 11),
                      paddingLeft: u(20),
                    },
                  }}
                />
              </Box>
            ))}
          </Box>

          {/* Change Password heading */}
          <Text
            c={C.white}
            fw={700}
            style={{
              position: "absolute",
              top: u(302),
              left: u(41),
              fontSize: uMin(21, 11),
              lineHeight: 1,
            }}
          >
            Change Password
          </Text>

          {/* row 2: Old | New | Confirm password (3 equal columns) */}
          <Box
            style={{
              position: "absolute",
              top: u(351),
              left: u(41),
              right: u(55),
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: u(24),
            }}
          >
            {[
              { key: "oldPassword", label: "Old Password" },
              { key: "newPassword", label: "New Password" },
              { key: "confirmPassword", label: "Confirm Password" },
            ].map((f) => (
              <Box key={f.key}>
                <Text
                  c={C.white}
                  style={{ fontSize: uMin(17, 10), lineHeight: 1 }}
                >
                  {f.label}
                </Text>
                <TextInput
                  aria-label={f.label}
                  type="password"
                  value={form[f.key]}
                  onChange={(e) => setField(f.key, e.currentTarget.value)}
                  styles={{
                    root: { marginTop: u(17) },
                    input: {
                      height: u(56),
                      minHeight: 0,
                      background: C.bg,
                      border: hasError(f.key) ? "1px solid #E65A5A" : "none",
                      borderRadius: u(3),
                      color: "#FFFFFF",
                      fontSize: uMin(17, 11),
                      paddingLeft: u(20),
                    },
                  }}
                />
              </Box>
            ))}
          </Box>

          {/* buttons: 252 x 49 */}
          <Flex
            style={{
              position: "absolute",
              top: u(516),
              left: u(41),
              gap: u(23),
            }}
          >
            <UnstyledButton
              className="action"
              onClick={handleUpdate}
              disabled={loading}
              style={{
                width: u(252),
                height: u(49),
                borderRadius: u(9),
                background: C.brown,
                color: C.white,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: loading ? 0.6 : 1,
              }}
            >
              <Text
                style={{
                  fontSize: uMin(18, 11),
                  lineHeight: 1,
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}
              >
                {loading ? "Updating..." : "Update Profile"}
              </Text>
            </UnstyledButton>

            <UnstyledButton
              className="action"
              onClick={handleCancel}
              style={{
                width: u(252),
                height: u(49),
                borderRadius: u(9),
                background: C.bg,
                color: C.white,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: uMin(18, 11),
                  lineHeight: 1,
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}
              >
                Cancel
              </Text>
            </UnstyledButton>
          </Flex>

          {/* backend error message */}
          {errorMsg && (
            <Text
              c="red.4"
              style={{
                position: "absolute",
                top: u(580),
                left: u(41),
                right: u(55),
                fontSize: uMin(15, 10),
              }}
            >
              {errorMsg}
            </Text>
          )}
        </Box>
      </Box>

      {/* ================= SCREEN 2: SUCCESS POPUP ================= */}
      <Modal
        opened={successOpen}
        onClose={handleOkay}
        withCloseButton={false}
        centered
        padding={0}
        radius={0}
        overlayProps={{ color: "#000", backgroundOpacity: 0.6 }}
        styles={{
          content: {
            background: C.cream,
            width: u(690),
            maxWidth: "92vw",
            minWidth: 300,
            flex: "0 0 auto",
            minHeight: u(515),
            borderRadius: u(16),
            fontFamily: FONT,
          },
        }}
      >
        <Flex
          direction="column"
          align="center"
          style={{ height: u(515), paddingTop: u(91) }}
        >
          <Ico icon={MdOutlineVerified} n={75} min={40} color={C.brown} />

          <Text
            c="#1A1A1A"
            ta="center"
            style={{
              marginTop: u(48),
              fontFamily: FONT,
              fontSize: uMin(28, 14),
              fontWeight: 400,
              lineHeight: 1.5,
            }}
          >
            Your Profile has been
            <br />
            updated successfully
          </Text>

          <UnstyledButton
            className="action"
            onClick={handleOkay}
            style={{
              marginTop: u(66),
              width: u(199),
              height: u(60),
              borderRadius: u(6),
              background: C.brown,
              color: C.white,
              fontFamily: FONT,
              fontSize: uMin(22, 12),
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
    </ReaderLayout>
  );
}
