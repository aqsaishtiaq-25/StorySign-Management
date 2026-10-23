import { Button, Paper, Stack, Text, TextInput, Title } from "@mantine/core";
import { useNavigate } from "react-router-dom";

import AuthLayout from "./AuthLayout";

function ForgotPassword() {
  const navigate = useNavigate();

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
            a link to reset your password.
          </Text>

          <TextInput
            label="Email:"
            placeholder="johnsmith@gmail.com"
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

          <Button
            fullWidth
            mt="20"
            bg="#8b3a1d"
            c="#ffebbc"
            radius="md"
            size="md"
            style={{ fontWeight: 600 }}
            onClick={() => navigate("/otp")}
          >
            LOGIN
          </Button>
        </Stack>
      </Paper>
    </AuthLayout>
  );
}

export default ForgotPassword;
