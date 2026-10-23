import { Button, Paper, PasswordInput, Stack, Title } from "@mantine/core";
import { useNavigate } from "react-router-dom";

import AuthLayout from "./AuthLayout";

function ResetPassword() {
  const navigate = useNavigate();

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
            styles={{
              label: { color: "#ffebbca0", marginBottom: "16px" },
              innerInput: { color: "#ffffff" },
              input: {
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderColor: "rgba(255, 255, 255, 0.2)",
                borderRadius: "6px",
              },
            }}
          />

          <PasswordInput
            label="Confirm Password:"
            placeholder="Password"
            styles={{
              label: { color: "#ffebbca0", marginBottom: "16px" },
              innerInput: { color: "#ffffff" },
              input: {
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderColor: "rgba(255, 255, 255, 0.2)",
                borderRadius: "6px",
              },
            }}
          />

          <Button
            fullWidth
            mt="md"
            bg="#8b3a1d"
            c="#ffebbc"
            radius="md"
            size="md"
            style={{ fontWeight: 600 }}
            onClick={() => navigate("/")}
          >
            Update Password
          </Button>
        </Stack>
      </Paper>
    </AuthLayout>
  );
}

export default ResetPassword;
