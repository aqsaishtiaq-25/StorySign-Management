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

// ---------- Ebooks ----------

export type EbookStats = {
  total: number;
  signed: number;
  unsigned: number;
  rejected: number;
};

export async function getEbookStats(): Promise<EbookStats> {
  const res = await fetch(`${BASE_URL}/ebooks/stats`, {
    headers: authHeaders(),
  });
  return handle(res, "Could not load ebook stats");
}

export async function getEbooks(page = 1, limit = 100) {
  const res = await fetch(`${BASE_URL}/ebooks?page=${page}&limit=${limit}`, {
    headers: authHeaders(),
  });
  return handle(res, "Could not load ebooks");
}

export async function getEbookById(id: string) {
  const res = await fetch(`${BASE_URL}/ebooks/${id}`, {
    headers: authHeaders(),
  });
  return handle(res, "Could not load ebook");
}

export async function deleteEbook(id: string) {
  const res = await fetch(`${BASE_URL}/ebooks/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handle(res, "Could not delete ebook");
}


export type AutographStats = Record<string, number | undefined>;

export async function getAutographRequests(page = 1, limit = 5) {
  const res = await fetch(
    `${BASE_URL}/autograph-requests?page=${page}&limit=${limit}`,
    { headers: authHeaders() },
  );
  return handle(res, "Could not load autograph requests");
}

export async function getAutographRequestById(id: string) {
  const res = await fetch(`${BASE_URL}/autograph-requests/${id}`, {
    headers: authHeaders(),
  });
  return handle(res, "Could not load autograph request");
}

export async function getAutographRequestStats(): Promise<AutographStats> {
  const res = await fetch(`${BASE_URL}/autograph-requests/stats`, {
    headers: authHeaders(),
  });
  return handle(res, "Could not load autograph request stats");
}

export async function deleteAutographRequest(id: string) {
  const res = await fetch(`${BASE_URL}/autograph-requests/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handle(res, "Could not delete autograph request");
}

const FEE_CURRENT_URL = `${BASE_URL}/autograph-fee`;
const FEE_UPDATE_URL = `${BASE_URL}/autograph-fee`;
const FEE_HISTORY_URL = `${BASE_URL}/autograph-fee/history`;

export async function getCurrentAutographFee(): Promise<{ amount: number }> {
  const res = await fetch(FEE_CURRENT_URL, { headers: authHeaders() });
  return handle(res, "Could not load autograph fee");
}

export async function getAutographFeeHistory(page = 1, limit = 5) {
  const res = await fetch(`${FEE_HISTORY_URL}?page=${page}&limit=${limit}`, {
    headers: authHeaders(),
  });
  return handle(res, "Could not load autograph fee history");
}

// Body ki field ka naam Postman ke "Update Autograph fee" ki body se match karein
export async function updateAutographFee(amount: number) {
  const res = await fetch(FEE_UPDATE_URL, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ amount }),
  });
  return handle(res, "Could not update autograph fee");
}

export type ApiPolicy = {
  id: string;
  title: string;
  content: string;
  type: string;
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export async function getPolicies(page = 1, limit = 100) {
  const res = await fetch(`${BASE_URL}/policies?page=${page}&limit=${limit}`, {
    headers: authHeaders(),
    cache: "no-store", // purana (cached) jawab dobara na aaye
  });
  return handle(res, "Could not load policies");
}

export async function getPolicyById(id: string) {
  const res = await fetch(`${BASE_URL}/policies/${id}`, {
    headers: authHeaders(),
  });
  return handle(res, "Could not load policy");
}

export async function createPolicy(data: {
  title: string;
  content: string;
  type: string;
  isPublished: boolean;
}) {
  const res = await fetch(`${BASE_URL}/policies`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handle(res, "Could not create policy");
}

export async function updatePolicy(
  id: string,
  data: Partial<{
    title: string;
    content: string;
    type: string;
    isPublished: boolean;
  }>,
) {
  const res = await fetch(`${BASE_URL}/policies/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handle(res, "Could not update policy");
}

export async function deletePolicy(id: string) {
  const res = await fetch(`${BASE_URL}/policies/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handle(res, "Could not delete policy");
}