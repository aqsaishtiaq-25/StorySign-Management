import { useEffect, useState } from "react";
import {
  Button,
  Paper,
  PasswordInput,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useNavigate } from "react-router-dom";

import AuthLayout from "./AuthLayout";
import { resetPassword } from "../api";

const inputStyles = {
  label: { color: "#ffebbca0", marginBottom: "16px" },
  innerInput: { color: "#ffffff" },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: "6px",
  },
};

function ResetPassword() {
  const navigate = useNavigate();
  const resetToken = sessionStorage.getItem("resetToken") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // token ke baghair seedha is page par aana mana hai
  useEffect(() => {
    if (!resetToken) navigate("/forgot-password", { replace: true });
  }, [resetToken, navigate]);

  const tooShort = password.length < 8;
  const mismatch = password !== confirmPassword;

  const handleUpdate = async () => {
    setSubmitted(true);
    setErrorMsg("");
    if (tooShort || mismatch) return;

    try {
      setLoading(true);
      await resetPassword(resetToken, password, confirmPassword);
      sessionStorage.removeItem("resetEmail");
      sessionStorage.removeItem("resetToken");
      navigate("/");
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Paper
        w={380}
        h={430}
        p="xl"
        radius={16}
        bg="#1c1b1b"
        style={{
          border: "1px solid rgba(255, 255, 255, 0.05)",
          boxShadow: "0px 4px 10px 0px rgba(255, 235, 188, 0.15)",
        }}
      >
        <Stack gap="md">
          <Title order={2} ta="center" c="#ffebbc" size="h3" fw={500} mb="21">
            Reset Password
          </Title>

          <PasswordInput
            label="Password:"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            error={submitted && tooShort}
            styles={inputStyles}
          />

          <PasswordInput
            label="Confirm Password:"
            placeholder="Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.currentTarget.value)}
            error={submitted && mismatch}
            styles={inputStyles}
          />

          {submitted && tooShort && (
            <Text c="red.4" size="xs">
              Password kam az kam 8 characters ka ho.
            </Text>
          )}
          {submitted && !tooShort && mismatch && (
            <Text c="red.4" size="xs">
              Dono passwords match nahi karte.
            </Text>
          )}
          {errorMsg && (
            <Text c="red.4" size="xs">
              {errorMsg}
            </Text>
          )}

          <Button
            fullWidth
            mt="md"
            bg="#8b3a1d"
            c="#ffebbc"
            radius="md"
            size="md"
            style={{ fontWeight: 600 }}
            onClick={handleUpdate}
            loading={loading}
          >
            Update Password
          </Button>
        </Stack>
      </Paper>
    </AuthLayout>
  );
}

export default ResetPassword;
