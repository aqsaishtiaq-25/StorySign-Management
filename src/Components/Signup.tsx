import { useState } from "react";
import {
  Anchor,
  Button,
  Paper,
  PasswordInput,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useNavigate } from "react-router-dom";

import AuthLayout from "./AuthLayout";
import { signup } from "../api";

const inputStyles = {
  label: { color: "#ffebbc", marginBottom: "8px" },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(255, 255, 255, 0.2)",
    color: "#ffffff",
    borderRadius: "6px",
  },
  innerInput: { color: "#ffffff" },
};

function Signup() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<string | null>("READER");

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const passwordTooShort = password.length < 8;
  const passwordMismatch = password !== confirmPassword;

  const handleSignup = async () => {
    setSubmitted(true);
    setErrorMsg("");

    if (
      !fullName.trim() ||
      !email.trim() ||
      passwordTooShort ||
      passwordMismatch ||
      !role
    )
      return;

    const [firstName, ...rest] = fullName.trim().split(" ");

    try {
      setLoading(true);
      await signup({
        email: email.trim(),
        password,
        firstName,
        lastName: rest.join(" ") || firstName,
        role, // sirf READER ya AUTHOR, ADMIN ka option hai hi nahi
      });
      navigate("/"); // account ban gaya, ab login karein
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
        p="xl"
        radius={16}
        bg="#1c1b1b"
        style={{
          border: "1px solid rgba(255, 255, 255, 0.05)",
          boxShadow: "0px 4px 10px 0px rgba(255, 235, 188, 0.15)",
        }}
      >
        <Stack gap="sm">
          <Title order={2} ta="center" c="#ffebbc" size="h3" fw={500}>
            Create Account
          </Title>

          <TextInput
            label="Full Name"
            placeholder="Lisa Jhon"
            value={fullName}
            onChange={(e) => setFullName(e.currentTarget.value)}
            error={submitted && !fullName.trim()}
            styles={inputStyles}
          />

          <TextInput
            label="Email"
            placeholder="abc@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            error={submitted && !email.trim()}
            styles={inputStyles}
          />

          <Select
            label="I am a"
            data={[
              { value: "READER", label: "Reader" },
              { value: "AUTHOR", label: "Author" },
            ]}
            value={role}
            onChange={setRole}
            allowDeselect={false}
            styles={inputStyles}
          />

          <PasswordInput
            label="Password"
            placeholder="8+ characters"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            error={submitted && passwordTooShort}
            styles={inputStyles}
          />

          <PasswordInput
            label="Confirm Password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.currentTarget.value)}
            error={submitted && passwordMismatch}
            styles={inputStyles}
          />

          {submitted && passwordTooShort && (
            <Text c="red.4" size="xs">
              Password kam az kam 8 characters ka ho.
            </Text>
          )}
          {submitted && !passwordTooShort && passwordMismatch && (
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
            mt="xs"
            bg="#8b3a1d"
            c="#ffebbc"
            radius="md"
            size="md"
            style={{ fontWeight: 600 }}
            onClick={handleSignup}
            loading={loading}
          >
            SIGN UP
          </Button>

          <Text size="xs" ta="center" c="#ffebbc">
            Already have an account?{" "}
            <Anchor
              onClick={() => navigate("/")}
              size="xs"
              c="#ffebbc"
              fw={700}
              style={{ cursor: "pointer" }}
            >
              Sign In
            </Anchor>
          </Text>
        </Stack>
      </Paper>
    </AuthLayout>
  );
}

export default Signup;
