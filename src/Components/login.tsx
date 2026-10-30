import { useState } from "react";
import {
  Anchor,
  Button,
  Group,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useNavigate } from "react-router-dom";

import AuthLayout from "./AuthLayout";
import { login } from "../api";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async () => {
    setSubmitted(true);
    setErrorMsg("");

    if (!email.trim() || !password.trim()) return;

    try {
      setLoading(true);
      await login(email.trim(), password);
      navigate("/dashboard");
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
          <Title order={2} ta="center" c="#ffebbc" size="h3" fw={500} mb="xs">
            Login Your Account
          </Title>

          <TextInput
            label="Email :"
            placeholder="johnsmith@gmail.com"
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
            error={submitted && !email.trim()}
            styles={{
              label: { color: "#ffebbc", marginBottom: "10px" },
              input: {
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderColor: "rgba(255, 255, 255, 0.2)",
                color: "#ffffff",
                borderRadius: "6px",
              },
            }}
          />

          <PasswordInput
            label="Password:"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.currentTarget.value)}
            error={submitted && !password.trim()}
            styles={{
              label: { color: "#ffebbc", marginBottom: "10px" },
              innerInput: { color: "#ffffff" },
              input: {
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderColor: "rgba(255, 255, 255, 0.2)",
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
            mt="sm"
            bg="#8b3a1d"
            c="#ffebbc"
            radius="md"
            size="md"
            style={{ fontWeight: 600 }}
            onClick={handleLogin}
            loading={loading}
          >
            LOGIN
          </Button>

          <Group justify="space-between">
            <Anchor
              onClick={() => navigate("/signup")}
              size="xs"
              c="#ffebbc"
              fw={700}
              style={{ cursor: "pointer" }}
            >
              Sign Up
            </Anchor>

            <Anchor
              onClick={() => navigate("/forgot-password")}
              size="xs"
              c="#ffebbc"
              style={{ cursor: "pointer" }}
            >
              Reset Your Password
            </Anchor>
          </Group>
        </Stack>
      </Paper>
    </AuthLayout>
  );
}

export default Login;
