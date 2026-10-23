import {
  Box,
  Button,
  Paper,
  PinInput,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useNavigate } from "react-router-dom";

import AuthLayout from "./AuthLayout";

function OTPVerification() {
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
        <Stack gap="md" align="center">
          <Title order={2} ta="center" c="#ffebbc" size="h3" fw={500}>
            Enter OTP
          </Title>

          <Text size="xs" c="rgba(255, 235, 188, 0.6)" ta="center" mt={20}>
            We've sent a 6-digit verification code to
            <br />
            admin@storysign.com
          </Text>

          <Box w="100%">
            <Text size="sm" c="#ffebbc" mb={16} mt={8}>
              OTP
            </Text>

            <PinInput
              length={6}
              size="md"
              type="number"
              placeholder=""
              styles={{
                input: {
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderColor: "rgba(255, 255, 255, 0.2)",
                  color: "#ffffff",
                  borderRadius: "6px",
                },
              }}
            />
          </Box>

          <Text size="xs" c="rgba(255, 235, 188, 0.6)" ta="center" mt={19}>
            Didn't receive the code? Resend in 36s
          </Text>

          <Button
            fullWidth
            mt="sm"
            bg="#8b3a1d"
            c="#ffebbc"
            radius="md"
            size="md"
            style={{ fontWeight: 600 }}
            onClick={() => navigate("/reset-password")}
          >
            Verify OTP
          </Button>
        </Stack>
      </Paper>
    </AuthLayout>
  );
}

export default OTPVerification;
