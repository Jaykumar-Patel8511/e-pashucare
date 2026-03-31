import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../utils/api";
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Container,
  Alert,
  CircularProgress,
  Stack,
} from "@mui/material";
import { CheckCircle as VerifyIcon } from "@mui/icons-material";

export function VerifyOtpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const queryEmail = useMemo(() => new URLSearchParams(location.search).get("email") || "", [location.search]);
  const [email, setEmail] = useState(queryEmail);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/verify-otp", { email, otp });
      login(data.token, data.user);
      navigate("/dashboard");
    } catch (apiError: any) {
      setError(apiError.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: 12 }}>
      <Card
        variant="outlined"
        sx={{
          borderRadius: 6,
          boxShadow: "0 20px 40px rgba(0,0,0,0.05)",
          background: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(10px)",
        }}
      >
        <CardContent sx={{ p: 5 }}>
          <Box sx={{ mb: 4, textAlign: "center" }}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: "primary.main" }}>
              Verify OTP
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Enter the 6-digit code sent to your email
            </Typography>
          </Box>

          <Box component="form" onSubmit={onSubmit}>
            <Stack spacing={3}>
              {error && (
                <Alert severity="error" sx={{ borderRadius: 3 }}>
                  {error}
                </Alert>
              )}

              <TextField
                fullWidth
                label="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <TextField
                fullWidth
                label="6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                inputProps={{ maxLength: 6, style: { textAlign: 'center', letterSpacing: '0.5rem', fontSize: '1.5rem', fontWeight: 700 } }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <VerifyIcon />}
                sx={{
                  py: 1.5,
                  borderRadius: 3,
                  fontSize: "1rem",
                  fontWeight: 700,
                  boxShadow: "0 8px 16px rgba(79, 70, 229, 0.25)",
                }}
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
