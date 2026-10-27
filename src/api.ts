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
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/users/my`, {
    headers: { ...baseHeaders, Authorization: `Bearer ${token}` },
  });
  return handle(res, "Could not load profile");
}

export async function updateMyProfile(data: {
  firstName?: string;
  lastName?: string;
  email?: string;
}) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/users/my`, {
    method: "PATCH",
    headers: { ...baseHeaders, Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  return handle(res, "Could not update profile");
}