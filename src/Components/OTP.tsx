import { useEffect, useState } from "react";
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
import { forgotPassword, verifyOtp } from "../api";

function OTPVerification() {
  const navigate = useNavigate();
  const email = sessionStorage.getItem("resetEmail") ?? "";

  const [otp, setOtp] = useState("");
  const [seconds, setSeconds] = useState(60);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // email ke baghair is page ka koi faida nahi
  useEffect(() => {
    if (!email) navigate("/forgot-password", { replace: true });
  }, [email, navigate]);

  // resend ka countdown
  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const handleVerify = async () => {
    setErrorMsg("");
    if (otp.length !== 6) {
      setErrorMsg("6-digit OTP daalein.");
      return;
    }
    try {
      setLoading(true);
      const data = await verifyOtp(email, otp);
      sessionStorage.setItem("resetToken", data.resetToken);
      navigate("/reset-password");
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setErrorMsg("");
    try {
      await forgotPassword(email);
      setSeconds(60);
    } catch (err) {
      setErrorMsg((err as Error).message);
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
        <Stack gap="md" align="center">
          <Title order={2} ta="center" c="#ffebbc" size="h3" fw={500}>
            Enter OTP
          </Title>

          <Text size="xs" c="rgba(255, 235, 188, 0.6)" ta="center" mt={20}>
            We've sent a 6-digit verification code to
            <br />
            {email}
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
              value={otp}
              onChange={setOtp}
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

          {errorMsg && (
            <Text c="red.4" size="xs">
              {errorMsg}
            </Text>
          )}

          <Text size="xs" c="rgba(255, 235, 188, 0.6)" ta="center" mt={8}>
            Didn't receive the code?{" "}
            {seconds > 0 ? (
              `Resend in ${seconds}s`
            ) : (
              <Text
                span
                size="xs"
                c="#ffebbc"
                fw={700}
                style={{ cursor: "pointer" }}
                onClick={handleResend}
              >
                Resend now
              </Text>
            )}
          </Text>

          <Button
            fullWidth
            mt="sm"
            bg="#8b3a1d"
            c="#ffebbc"
            radius="md"
            size="md"
            style={{ fontWeight: 600 }}
            onClick={handleVerify}
            loading={loading}
          >
            Verify OTP
          </Button>
        </Stack>
      </Paper>
    </AuthLayout>
  );
}

export default OTPVerification;
