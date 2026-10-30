import { useState } from "react";
import { Button, Paper, Stack, Text, TextInput, Title } from "@mantine/core";
import { useNavigate } from "react-router-dom";

import AuthLayout from "./AuthLayout";
import { forgotPassword } from "../api";

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSend = async () => {
    setSubmitted(true);
    setErrorMsg("");
    if (!email.trim()) return;

    try {
      setLoading(true);
      await forgotPassword(email.trim());
      sessionStorage.setItem("resetEmail", email.trim());
      navigate("/otp");
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Paper
        w={350}
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
          <Title order={2} ta="center" c="#ffebbc" size="h3" fw={500}>
            Forget Password
          </Title>

          <Text
            size="xs"
            c="rgba(255, 235, 188, 0.6)"
            ta="center"
            mb={16}
            mt={18}
          >
            Don't worry! Enter your registered email address, and we'll send you
            a 6-digit OTP code to reset your password.
          </Text>

          <TextInput
            label="Email:"
            placeholder="johnsmith@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            error={submitted && !email.trim()}
            styles={{
              label: { color: "#ffebbc", marginBottom: "16px" },
              input: {
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderColor: "rgba(255, 255, 255, 0.2)",
                color: "#ffffff",
                borderRadius: "6px",
              },
            }}
          />

          {errorMsg && (
            <Text c="red.4" size="xs">
              {errorMsg}
            </Text>
          )}

          <Button
            fullWidth
            mt="20"
            bg="#8b3a1d"
            c="#ffebbc"
            radius="md"
            size="md"
            style={{ fontWeight: 600 }}
            onClick={handleSend}
            loading={loading}
          >
            SEND OTP
          </Button>
        </Stack>
      </Paper>
    </AuthLayout>
  );
}

export default ForgotPassword;
