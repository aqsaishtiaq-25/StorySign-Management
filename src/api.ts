const BASE_URL = "/api";

const baseHeaders = {
  "Content-Type": "application/json",
};

export type SignupData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  bio?: string;
};

export type ApiUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
};

async function handle(res: Response, fallback: string) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message;
    throw new Error(msg || fallback);
  }
  return data;
}

function authHeaders() {
  const token = localStorage.getItem("token");
  return { ...baseHeaders, Authorization: `Bearer ${token}` };
}

export async function login(email: string, password: string) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: baseHeaders,
    body: JSON.stringify({ email, password }),
  });
  const data = await handle(res, "Login failed");
  localStorage.setItem("token", data.access_token);
  return data;
}

export async function signup(userData: SignupData) {
  const res = await fetch(`${BASE_URL}/users`, {
    method: "POST",
    headers: baseHeaders,
    body: JSON.stringify(userData),
  });
  return handle(res, "Signup failed");
}

export async function getMyProfile() {
  const res = await fetch(`${BASE_URL}/users/my`, {
    headers: authHeaders(),
  });
  return handle(res, "Could not load profile");
}

export async function updateMyProfile(data: {
  firstName?: string;
  lastName?: string;
  email?: string;
}) {
  const res = await fetch(`${BASE_URL}/users/my`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handle(res, "Could not update profile");
}

// ---------- Author Management ----------

export async function getUsers(page = 1, limit = 100) {
  const res = await fetch(`${BASE_URL}/users?page=${page}&limit=${limit}`, {
    headers: authHeaders(),
  });
  return handle(res, "Could not load users");
}

export async function getUserById(id: string) {
  const res = await fetch(`${BASE_URL}/users/${id}`, {
    headers: authHeaders(),
  });
  return handle(res, "Could not load user");
}

// ---------- Forgot password flow ----------
// 1) forgotPassword -> email par OTP aata hai
// 2) verifyOtp      -> { message, resetToken } wapas aata hai
// 3) resetPassword  -> resetToken ke saath naya password

export async function forgotPassword(email: string) {
  const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: baseHeaders,
    body: JSON.stringify({ email }),
  });
  return handle(res, "Could not send OTP");
}

export async function verifyOtp(email: string, otp: string) {
  const res = await fetch(`${BASE_URL}/auth/verify-reset-otp`, {
    method: "POST",
    headers: baseHeaders,
    body: JSON.stringify({ email, otp }),
  });
  return handle(res, "Invalid or expired OTP");
}

export async function resetPassword(
  resetToken: string,
  password: string,
  confirmPassword: string,
) {
  const res = await fetch(`${BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers: baseHeaders,
    body: JSON.stringify({ resetToken, password, confirmPassword }),
  });
  return handle(res, "Could not reset password");
}