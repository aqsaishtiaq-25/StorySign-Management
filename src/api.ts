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

// ZAROORI: Postman ma "Update Password" ka URL dekh kar neeche wali line match karein
const UPDATE_PASSWORD_URL = `${BASE_URL}/users/my/password`;

export async function updatePassword(data: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  const res = await fetch(UPDATE_PASSWORD_URL, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handle(res, "Could not update password");
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

// ---------- Autograph Requests ----------

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

// ---------- Autograph Fee ----------

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

// ---------- Dashboard ----------
const DASH_BASE = `${BASE_URL}/admin/dashboard`;

export async function getDashboardOverview() {
  const res = await fetch(`${DASH_BASE}/overview`, { headers: authHeaders() });
  return handle(res, "Could not load dashboard overview");
}

export async function getDashboardUserGrowth(months = 6) {
  const res = await fetch(`${DASH_BASE}/user-growth?months=${months}`, {
    headers: authHeaders(),
  });
  return handle(res, "Could not load user growth");
}

export async function getDashboardRevenueAnalytics() {
  const res = await fetch(`${DASH_BASE}/revenue-analytics`, {
    headers: authHeaders(),
  });
  return handle(res, "Could not load revenue analytics");
}

// ---------- Support Queries ----------
const SQ_URL = `${BASE_URL}/support-queries`;

export type SupportQueryStats = {
  totalQueries?: number;
  pendingQueries?: number;
  resolutionRate?: number;
  avgResponseTimeMinutes?: number;
};

export async function getSupportQueries(page = 1, limit = 5) {
  const res = await fetch(`${SQ_URL}?page=${page}&limit=${limit}`, {
    headers: authHeaders(),
  });
  return handle(res, "Could not load support queries");
}

export async function getSupportQueryStats(): Promise<SupportQueryStats> {
  const res = await fetch(`${SQ_URL}/stats`, { headers: authHeaders() });
  return handle(res, "Could not load support query stats");
}

export async function getSupportQueryById(id: string) {
  const res = await fetch(`${SQ_URL}/${id}`, { headers: authHeaders() });
  return handle(res, "Could not load support query");
}

// ---------- Policies ----------

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

// ---------- FAQs ----------

export type ApiFaq = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export async function getFaqs(page = 1, limit = 100) {
  const res = await fetch(`${BASE_URL}/faqs?page=${page}&limit=${limit}`, {
    headers: authHeaders(),
    cache: "no-store", // purana (cached) jawab dobara na aaye
  });
  return handle(res, "Could not load FAQs");
}

export async function getFaqById(id: string) {
  const res = await fetch(`${BASE_URL}/faqs/${id}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  return handle(res, "Could not load FAQ");
}

export async function createFaq(data: {
  question: string;
  answer: string;
  sortOrder: number;
  isPublished: boolean;
}) {
  const res = await fetch(`${BASE_URL}/faqs`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handle(res, "Could not create FAQ");
}

export async function updateFaq(
  id: string,
  data: Partial<{
    question: string;
    answer: string;
    sortOrder: number;
    isPublished: boolean;
  }>,
) {
  const res = await fetch(`${BASE_URL}/faqs/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handle(res, "Could not update FAQ");
}

export async function deleteFaq(id: string) {
  const res = await fetch(`${BASE_URL}/faqs/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handle(res, "Could not delete FAQ");
}

// ---------- Notifications ----------

const NOTIF_LIST_URL = `${BASE_URL}/notifications`;
const NOTIF_SEND_URL = `${BASE_URL}/notifications/broadcast`;

export async function getNotifications(page = 1, limit = 7) {
  const res = await fetch(`${NOTIF_LIST_URL}?page=${page}&limit=${limit}`, {
    headers: authHeaders(),
  });
  return handle(res, "Could not load notifications");
}

export async function sendNotification(data: {
  recipientType: string;
  title: string;
  message: string;
}): Promise<{ message?: string; recipientType?: string; recipientCount?: number }> {
  const res = await fetch(NOTIF_SEND_URL, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handle(res, "Could not send notification");
}

// ---------- Reader Management ----------
const READERS_URL = `${BASE_URL}/users`;
const READER_STATS_URL = `${BASE_URL}/users/admin/reader-status`;

export type ReaderStats = {
  totalReaders?: number;
  activeReaders?: number;
  inactiveReaders?: number;
  suspendedReaders?: number;
};

export async function getReaders(page = 1, limit = 5) {
  // role=READER pehle, phir page/limit -- sab '&' se jore hain (sirf ek '?')
  const res = await fetch(
    `${READERS_URL}?role=READER&page=${page}&limit=${limit}`,
    { headers: authHeaders() },
  );
  return handle(res, "Could not load readers");
}

export async function getReaderStats(): Promise<ReaderStats> {
  const res = await fetch(READER_STATS_URL, { headers: authHeaders() });
  return handle(res, "Could not load reader stats");
}

// Suspend / unsuspend / activate / deactivate ek hi function se
export type UserAction = "suspend" | "unsuspend" | "activate" | "deactivate";

export async function changeUserStatus(
  id: string,
  action: UserAction,
  reason = "Updated by admin",
) {
  const res = await fetch(`${BASE_URL}/users/admin/${id}/${action}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ reason }),
  });
  return handle(res, `Could not ${action} user`);
}

// ---------- Subscription plans & subscriptions ----------
// ZAROORI: neeche ke do URL Postman ki requests ke URL se milayein
const PLANS_URL = `${BASE_URL}/subscription-plans`;
const SUBSCRIPTIONS_URL = `${BASE_URL}/subscriptions`;

export type ApiPlan = {
  id: string;
  name: string;
  planType: string;
  planCharges: number;
  features: string[];
  isActive: boolean;
};

export type ApiSubscription = {
  id: string;
  userId: string;
  planId: string;
  status: string;
  startsAt: string;
  endsAt: string;
  user?: { firstName?: string; lastName?: string; avatarUrl?: string | null };
  plan?: { name?: string; planType?: string; planCharges?: number };
};

export async function getPlans(page = 1, limit = 100) {
  const res = await fetch(`${PLANS_URL}?page=${page}&limit=${limit}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  return handle(res, "Could not load plans");
}

export async function createPlan(data: {
  name: string;
  planType: string;
  planCharges: number;
  features: string[];
  isActive: boolean;
}) {
  const res = await fetch(PLANS_URL, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handle(res, "Could not create plan");
}

export async function updatePlan(
  id: string,
  data: Partial<{
    name: string;
    planType: string;
    planCharges: number;
    features: string[];
    isActive: boolean;
  }>,
) {
  const res = await fetch(`${PLANS_URL}/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handle(res, "Could not update plan");
}

export async function deletePlan(id: string) {
  const res = await fetch(`${PLANS_URL}/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handle(res, "Could not delete plan");
}

export async function getSubscriptions(page = 1, limit = 100) {
  const res = await fetch(`${SUBSCRIPTIONS_URL}?page=${page}&limit=${limit}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  return handle(res, "Could not load subscriptions");
}

// ---------- Admin: subscription actions ----------
// ZAROORI: Postman mein "Cancle subscription" ka URL dekhein. Agar woh
// {{baseUrl}}/subscriptions/<id>/cancel nahi hai, to neeche wali line mein
// "/cancel" ko us ke mutabiq badal dein.
export async function cancelSubscription(id: string) {
  const res = await fetch(`${SUBSCRIPTIONS_URL}/${id}/cancel`, {
    method: "PATCH",
    headers: authHeaders(),
  });
  return handle(res, "Could not cancel subscription");
}

export async function deleteSubscription(id: string) {
  const res = await fetch(`${SUBSCRIPTIONS_URL}/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handle(res, "Could not delete subscription");
}

// ---------- Author: own subscription ----------
// ZAROORI: neeche ke do URL Postman se milayein
// ("See own subscription" aur "Cancel my subscription")
const MY_SUBSCRIPTION_URL = `${SUBSCRIPTIONS_URL}/my`;
const CANCEL_MY_SUBSCRIPTION_URL = `${SUBSCRIPTIONS_URL}/my/cancel`;

export async function subscribeToPlan(planId: string) {
  const res = await fetch(SUBSCRIPTIONS_URL, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ planId }),
  });
  return handle(res, "Could not subscribe to this plan");
}

// Active subscription na ho to null wapas deta hai (error nahi)
export async function getMySubscription(): Promise<ApiSubscription | null> {
  const res = await fetch(MY_SUBSCRIPTION_URL, {
    headers: authHeaders(),
    cache: "no-store",
  });

  if (res.status === 404) {
    const body = await res.json().catch(() => ({}));
    const msg = String(body?.message ?? "");
    // Sirf "Active subscription not found" ko khali maanein.
    // Galat URL ka 404 chhupna nahi chahiye.
    if (msg.toLowerCase().includes("active subscription")) return null;
    throw new Error(msg || "Could not load your subscription");
  }

  const body = await handle(res, "Could not load your subscription");
  const sub = body?.data ?? body;
  return sub && sub.id ? (sub as ApiSubscription) : null;
}

export async function cancelMySubscription() {
  const res = await fetch(CANCEL_MY_SUBSCRIPTION_URL, {
    method: "PATCH",
    headers: authHeaders(),
  });
  return handle(res, "Could not cancel your subscription");
}