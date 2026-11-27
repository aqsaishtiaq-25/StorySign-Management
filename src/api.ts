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
  isSuspended?: boolean;
  plan?: string | null;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
};

export type UserQueryParams = {
  page?: number;
  limit?: number;
  role?: "READER" | "AUTHOR" | string;
  search?: string;
  isActive?: boolean;
  isSuspended?: boolean;
  plan?: string;
  minUploadedBooksCount?: number;
  maxUploadedBooksCount?: number;
  minTotalSpent?: number;
  maxTotalSpent?: number;
  bookTitle?: string;
  minSignedBooks?: number;
  maxSignedBooks?: number;
  minPendingRequests?: number;
  maxPendingRequests?: number;
  createdFrom?: string;
  createdTo?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
};

function buildQueryString(params: Record<string, unknown>): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val === undefined || val === null) return;
    const str = String(val).trim();
    if (str === "") return;
    sp.set(key, str);
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

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

// ---------- Global loading + retry ----------
let pending = 0;
const listeners = new Set<() => void>();

export function subscribeLoading(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function getPendingCount() {
  return pending;
}

function setPending(n: number) {
  pending = n;
  listeners.forEach((l) => l());
}

async function request(url: string, init: RequestInit = {}): Promise<Response> {
  const isGet = !init.method || init.method.toUpperCase() === "GET";
  const retries = isGet ? 2 : 0;

  if (isGet) setPending(pending + 1);
  try {
    for (let i = 0; ; i++) {
      try {
        const res = await window.fetch(url, init);
        const retryable = res.status === 429 || res.status >= 500;
        if (!retryable || i >= retries) return res;
      } catch (err) {
        if (i >= retries) throw err;
      }
      await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  } finally {
    if (isGet) setPending(pending - 1);
  }
}

export async function login(email: string, password: string) {
  const res = await request(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: baseHeaders,
    body: JSON.stringify({ email, password }),
  });
  const data = await handle(res, "Login failed");
  localStorage.setItem("token", data.access_token);
  return data;
}

export async function signup(userData: SignupData) {
  const res = await request(`${BASE_URL}/users`, {
    method: "POST",
    headers: baseHeaders,
    body: JSON.stringify(userData),
  });
  return handle(res, "Signup failed");
}

export async function getMyProfile() {
  const res = await request(`${BASE_URL}/users/my`, {
    headers: authHeaders(),
  });
  return handle(res, "Could not load profile");
}

export async function updateMyProfile(data: {
  firstName?: string;
  lastName?: string;
  email?: string;
}) {
  const res = await request(`${BASE_URL}/users/my`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handle(res, "Could not update profile");
}

// ---------- Profile photo ----------
export const AVATAR_FIELD = "avatar";
export const AVATAR_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const AVATAR_MAX_MB = 2;

export function resolveAvatarUrl(url?: string | null): string | null {
  if (!url) return null;
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  if (url.startsWith(`${BASE_URL}/`)) return url;
  return `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export async function loadAvatarSrc(url?: string | null): Promise<string | null> {
  const resolved = resolveAvatarUrl(url);
  if (!resolved) return null;
  if (/^(data:|blob:)/i.test(resolved)) return resolved;

  const token = localStorage.getItem("token");
  const res = await request(resolved, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;

  const blob = await res.blob();
  if (!blob.size || !blob.type.startsWith("image/")) return null;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
}

export async function updateMyAvatar(file: File) {
  const token = localStorage.getItem("token");
  const form = new FormData();
  form.append(AVATAR_FIELD, file);
  const res = await request(`${BASE_URL}/users/my`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  return handle(res, "Could not upload photo");
}

const UPDATE_PASSWORD_URL = `${BASE_URL}/users/my/password`;

export async function updatePassword(data: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  const res = await request(UPDATE_PASSWORD_URL, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handle(res, "Could not update password");
}

// ---------- Users / Author Management ----------

export async function getUsers(
  pageOrParams: number | UserQueryParams = 1,
  limit = 100,
  search = "",
) {
  const params: UserQueryParams =
    typeof pageOrParams === "object"
      ? pageOrParams
      : { page: pageOrParams, limit, search };

  const qs = buildQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 100,
    role: params.role,
    search: params.search,
    isActive: params.isActive,
    isSuspended: params.isSuspended,
    plan: params.plan,
    minUploadedBooksCount: params.minUploadedBooksCount,
    maxUploadedBooksCount: params.maxUploadedBooksCount,
    minTotalSpent: params.minTotalSpent,
    maxTotalSpent: params.maxTotalSpent,
    bookTitle: params.bookTitle,
    minSignedBooks: params.minSignedBooks,
    maxSignedBooks: params.maxSignedBooks,
    minPendingRequests: params.minPendingRequests,
    maxPendingRequests: params.maxPendingRequests,
    createdFrom: params.createdFrom,
    createdTo: params.createdTo,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  });

  const res = await request(`${BASE_URL}/users${qs}`, {
    headers: authHeaders(),
  });
  return handle(res, "Could not load users");
}

export async function getUserById(id: string) {
  const res = await request(`${BASE_URL}/users/${id}`, {
    headers: authHeaders(),
  });
  return handle(res, "Could not load user");
}

// ---------- Forgot password flow ----------

export async function forgotPassword(email: string) {
  const res = await request(`${BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: baseHeaders,
    body: JSON.stringify({ email }),
  });
  return handle(res, "Could not send OTP");
}

export async function verifyOtp(email: string, otp: string) {
  const res = await request(`${BASE_URL}/auth/verify-reset-otp`, {
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
  const res = await request(`${BASE_URL}/auth/reset-password`, {
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

export type EbookQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
  isPublished?: boolean;
  isSigned?: boolean;
  readerId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  order?: "ASC" | "DESC";
};

export type CreateEbookPayload = {
  title: string;
  readerMessage: string;
  coverUrl: string;
  fileUrl: string;
};

export async function getEbookStats(): Promise<EbookStats> {
  const res = await request(`${BASE_URL}/ebooks/stats`, {
    headers: authHeaders(),
  });
  return handle(res, "Could not load ebook stats");
}

export async function getEbooks(
  pageOrParams: number | EbookQueryParams = 1,
  limit = 100,
) {
  const params: EbookQueryParams =
    typeof pageOrParams === "object"
      ? pageOrParams
      : { page: pageOrParams, limit };

  const qs = buildQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 100,
    search: params.search,
    isPublished: params.isPublished,
    isSigned: params.isSigned,
    readerId: params.readerId,
    startDate: params.startDate,
    endDate: params.endDate,
    sortBy: params.sortBy,
    order: params.order,
  });

  const res = await request(`${BASE_URL}/ebooks${qs}`, {
    headers: authHeaders(),
  });
  return handle(res, "Could not load ebooks");
}

export async function getEbookById(id: string) {
  const res = await request(`${BASE_URL}/ebooks/${id}`, {
    headers: authHeaders(),
  });
  return handle(res, "Could not load ebook");
}

export async function createEbook(payload: CreateEbookPayload) {
  const res = await request(`${BASE_URL}/ebooks`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handle(res, "Could not upload ebook");
}

export async function deleteEbook(id: string) {
  const res = await request(`${BASE_URL}/ebooks/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handle(res, "Could not delete ebook");
}

// ---------- Autograph Requests ----------

export type AutographStats = Record<string, number | undefined>;

export type AutographRequestQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  authorId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  order?: "ASC" | "DESC";
};

export type CreateAutographRequestPayload = {
  authorId: string;
  ebookId: string;
  readerMessage: string;
};

export async function createAutographRequest(
  payload: CreateAutographRequestPayload,
) {
  const res = await request(`${BASE_URL}/autograph-requests`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handle(res, "Could not send autograph request");
}

export async function getAutographRequests(
  pageOrParams: number | AutographRequestQueryParams = 1,
  limit = 5,
) {
  const params: AutographRequestQueryParams =
    typeof pageOrParams === "object"
      ? pageOrParams
      : { page: pageOrParams, limit };

  const qs = buildQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 5,
    search: params.search,
    status: params.status,
    authorId: params.authorId,
    startDate: params.startDate,
    endDate: params.endDate,
    sortBy: params.sortBy,
    order: params.order,
  });

  const res = await request(`${BASE_URL}/autograph-requests${qs}`, {
    headers: authHeaders(),
  });
  return handle(res, "Could not load autograph requests");
}

export async function getAutographRequestById(id: string) {
  const res = await request(`${BASE_URL}/autograph-requests/${id}`, {
    headers: authHeaders(),
  });
  return handle(res, "Could not load autograph request");
}

export async function getAutographRequestStats(): Promise<AutographStats> {
  const res = await request(`${BASE_URL}/autograph-requests/stats`, {
    headers: authHeaders(),
  });
  return handle(res, "Could not load autograph request stats");
}

export async function deleteAutographRequest(id: string) {
  const res = await request(`${BASE_URL}/autograph-requests/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handle(res, "Could not delete autograph request");
}

// ---------- Autograph Fee ----------

const FEE_CURRENT_URL = `${BASE_URL}/autograph-fee`;
const FEE_UPDATE_URL = `${BASE_URL}/autograph-fee`;
const FEE_HISTORY_URL = `${BASE_URL}/autograph-fee/history`;

export type FeeHistoryQueryParams = {
  page?: number;
  limit?: number;
  updatedBy?: string;
  startDate?: string;
  endDate?: string;
  amount?: number | string;
};

export async function getCurrentAutographFee(): Promise<{ amount: number }> {
  const res = await request(FEE_CURRENT_URL, { headers: authHeaders() });
  return handle(res, "Could not load autograph fee");
}

export async function getAutographFeeHistory(
  pageOrParams: number | FeeHistoryQueryParams = 1,
  limit = 5,
) {
  const params: FeeHistoryQueryParams =
    typeof pageOrParams === "object"
      ? pageOrParams
      : { page: pageOrParams, limit };

  const qs = buildQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 5,
    updatedBy: params.updatedBy,
    startDate: params.startDate,
    endDate: params.endDate,
    amount: params.amount,
  });

  const res = await request(`${FEE_HISTORY_URL}${qs}`, {
    headers: authHeaders(),
  });
  return handle(res, "Could not load autograph fee history");
}

export async function updateAutographFee(amount: number) {
  const res = await request(FEE_UPDATE_URL, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ amount }),
  });
  return handle(res, "Could not update autograph fee");
}

// ---------- Dashboard ----------
const DASH_BASE = `${BASE_URL}/admin/dashboard`;

export async function getDashboardOverview() {
  const res = await request(`${DASH_BASE}/overview`, { headers: authHeaders() });
  return handle(res, "Could not load dashboard overview");
}

export async function getDashboardUserGrowth(months = 6) {
  const res = await request(`${DASH_BASE}/user-growth?months=${months}`, {
    headers: authHeaders(),
  });
  return handle(res, "Could not load user growth");
}

export async function getDashboardRevenueAnalytics(months?: number) {
  const q = months ? `?months=${months}` : "";
  const res = await request(`${DASH_BASE}/revenue-analytics${q}`, {
    headers: authHeaders(),
  });
  return handle(res, "Could not load revenue analytics");
}

// ---------- Reports & Analytics page ----------
export async function getMonthlyAutographRequests(months = 6) {
  const res = await request(
    `${DASH_BASE}/monthly-autograph-requests?months=${months}`,
    { headers: authHeaders() },
  );
  return handle(res, "Could not load autograph requests");
}

const TOP_AUTHORS_URL = `${DASH_BASE}/top-authors`;

export async function getTopAuthors() {
  const res = await request(TOP_AUTHORS_URL, { headers: authHeaders() });
  return handle(res, "Could not load top authors");
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
  const res = await request(`${BASE_URL}/policies?page=${page}&limit=${limit}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  return handle(res, "Could not load policies");
}

export async function getPolicyById(id: string) {
  const res = await request(`${BASE_URL}/policies/${id}`, {
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
  const res = await request(`${BASE_URL}/policies`, {
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
  const res = await request(`${BASE_URL}/policies/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handle(res, "Could not update policy");
}

export async function deletePolicy(id: string) {
  const res = await request(`${BASE_URL}/policies/${id}`, {
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

export type FaqQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
  order?: "ASC" | "DESC";
};

export async function getFaqs(
  pageOrParams: number | FaqQueryParams = 1,
  limit = 100,
) {
  const params: FaqQueryParams =
    typeof pageOrParams === "object"
      ? pageOrParams
      : { page: pageOrParams, limit };

  const qs = buildQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 100,
    search: params.search,
    order: params.order,
  });

  const res = await request(`${BASE_URL}/faqs${qs}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  return handle(res, "Could not load FAQs");
}

export async function getFaqById(id: string) {
  const res = await request(`${BASE_URL}/faqs/${id}`, {
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
  const res = await request(`${BASE_URL}/faqs`, {
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
  const res = await request(`${BASE_URL}/faqs/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handle(res, "Could not update FAQ");
}

export async function deleteFaq(id: string) {
  const res = await request(`${BASE_URL}/faqs/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handle(res, "Could not delete FAQ");
}

// ---------- Notifications ----------

const NOTIF_LIST_URL = `${BASE_URL}/notifications`;
const NOTIF_SEND_URL = `${BASE_URL}/notifications/broadcast`;

export type NotificationQueryParams = {
  page?: number;
  limit?: number;
  isRead?: boolean;
  title?: string;
  createdFrom?: string;
  createdTo?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
};

export async function getNotifications(
  pageOrParams: number | NotificationQueryParams = 1,
  limit = 7,
) {
  const params: NotificationQueryParams =
    typeof pageOrParams === "object"
      ? pageOrParams
      : { page: pageOrParams, limit };

  const qs = buildQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 7,
    isRead: params.isRead,
    title: params.title,
    createdFrom: params.createdFrom,
    createdTo: params.createdTo,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  });

  const res = await request(`${NOTIF_LIST_URL}${qs}`, {
    headers: authHeaders(),
  });
  return handle(res, "Could not load notifications");
}

export async function sendNotification(data: {
  recipientType: string;
  title: string;
  message: string;
}): Promise<{ message?: string; recipientType?: string; recipientCount?: number }> {
  const res = await request(NOTIF_SEND_URL, {
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

export async function getReaders(
  pageOrParams: number | Omit<UserQueryParams, "role"> = 1,
  limit = 5,
  search = "",
) {
  const params: Omit<UserQueryParams, "role"> =
    typeof pageOrParams === "object"
      ? pageOrParams
      : { page: pageOrParams, limit, search };

  const qs = buildQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 5,
    role: "READER",
    search: params.search,
    isActive: params.isActive,
    isSuspended: params.isSuspended,
    minUploadedBooksCount: params.minUploadedBooksCount,
    maxUploadedBooksCount: params.maxUploadedBooksCount,
    minTotalSpent: params.minTotalSpent,
    maxTotalSpent: params.maxTotalSpent,
    bookTitle: params.bookTitle,
    createdFrom: params.createdFrom,
    createdTo: params.createdTo,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  });

  const res = await request(`${READERS_URL}${qs}`, {
    headers: authHeaders(),
  });
  return handle(res, "Could not load readers");
}

export async function getReaderStats(): Promise<ReaderStats> {
  const res = await request(READER_STATS_URL, { headers: authHeaders() });
  return handle(res, "Could not load reader stats");
}

export type UserAction = "suspend" | "unsuspend" | "activate" | "deactivate";

export async function changeUserStatus(
  id: string,
  action: UserAction,
  reason = "Updated by admin",
) {
  const res = await request(`${BASE_URL}/users/admin/${id}/${action}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ reason }),
  });
  return handle(res, `Could not ${action} user`);
}

// ---------- Subscription plans & subscriptions ----------
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

export type PlanQueryParams = {
  page?: number;
  limit?: number;
  isActive?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
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

export type SubscriptionQueryParams = {
  page?: number;
  limit?: number;
  status?: string;
  planName?: string;
  planType?: string;
  minBilling?: number;
  maxBilling?: number;
  startedFrom?: string;
  startedTo?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
};

export async function getPlans(
  pageOrParams: number | PlanQueryParams = 1,
  limit = 100,
) {
  const params: PlanQueryParams =
    typeof pageOrParams === "object"
      ? pageOrParams
      : { page: pageOrParams, limit };

  const qs = buildQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 100,
    isActive: params.isActive,
    search: params.search,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  });

  const res = await request(`${PLANS_URL}${qs}`, {
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
  const res = await request(PLANS_URL, {
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
  const res = await request(`${PLANS_URL}/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handle(res, "Could not update plan");
}

export async function deletePlan(id: string) {
  const res = await request(`${PLANS_URL}/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handle(res, "Could not delete plan");
}

export async function getSubscriptions(
  pageOrParams: number | SubscriptionQueryParams = 1,
  limit = 100,
) {
  const params: SubscriptionQueryParams =
    typeof pageOrParams === "object"
      ? pageOrParams
      : { page: pageOrParams, limit };

  const qs = buildQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 100,
    status: params.status,
    planName: params.planName,
    planType: params.planType,
    minBilling: params.minBilling,
    maxBilling: params.maxBilling,
    startedFrom: params.startedFrom,
    startedTo: params.startedTo,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  });

  const res = await request(`${SUBSCRIPTIONS_URL}${qs}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  return handle(res, "Could not load subscriptions");
}

export async function cancelSubscription(id: string) {
  const res = await request(`${SUBSCRIPTIONS_URL}/${id}/cancel`, {
    method: "PATCH",
    headers: authHeaders(),
  });
  return handle(res, "Could not cancel subscription");
}

export async function deleteSubscription(id: string) {
  const res = await request(`${SUBSCRIPTIONS_URL}/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handle(res, "Could not delete subscription");
}

const MY_SUBSCRIPTION_URL = `${SUBSCRIPTIONS_URL}/my`;
const CANCEL_MY_SUBSCRIPTION_URL = `${SUBSCRIPTIONS_URL}/my/cancel`;

export async function subscribeToPlan(planId: string) {
  const res = await request(SUBSCRIPTIONS_URL, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ planId }),
  });
  return handle(res, "Could not subscribe to this plan");
}

export async function getMySubscription(): Promise<ApiSubscription | null> {
  const res = await request(MY_SUBSCRIPTION_URL, {
    headers: authHeaders(),
    cache: "no-store",
  });

  if (res.status === 404) {
    const body = await res.json().catch(() => ({}));
    const msg = String(body?.message ?? "");
    if (msg.toLowerCase().includes("active subscription")) return null;
    throw new Error(msg || "Could not load your subscription");
  }

  const body = await handle(res, "Could not load your subscription");
  const sub = body?.data ?? body;
  return sub && sub.id ? (sub as ApiSubscription) : null;
}

export async function cancelMySubscription() {
  const res = await request(CANCEL_MY_SUBSCRIPTION_URL, {
    method: "PATCH",
    headers: authHeaders(),
  });
  return handle(res, "Could not cancel your subscription");
}

// ---------- Autograph request helpers ----------
export const requestStatus = (r: any): string =>
  String(r?.status ?? "").toLowerCase();

export const isPendingRequest = (r: any): boolean =>
  requestStatus(r) === "pending";

export const isSignedRequest = (r: any): boolean =>
  !!r?.signedEbookUrl ||
  ["signed", "delivered", "completed"].includes(requestStatus(r));

export async function getAllAutographRequests(): Promise<any[]> {
  const all: any[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const res: any = await getAutographRequests(page, 10);
    const list = Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res)
        ? res
        : [];
    all.push(...list);
    totalPages = res?.pagination?.totalPages ?? 1;
    page += 1;
  } while (page <= totalPages && page <= 30);

  return all;
}

// ---------- Author actions on an autograph request ----------
const DEFAULT_AUTHOR_MESSAGE = "I have signed your ebook. Hope you like it.";

export async function acceptAutographRequest(id: string) {
  const res = await request(`${BASE_URL}/autograph-requests/${id}/accept`, {
    method: "PATCH",
    headers: authHeaders(),
  });
  return handle(res, "Could not accept the request");
}

export async function rejectAutographRequest(id: string) {
  const res = await request(`${BASE_URL}/autograph-requests/${id}/reject`, {
    method: "PATCH",
    headers: authHeaders(),
  });
  return handle(res, "Could not reject the request");
}

export async function signAutographRequest(
  id: string,
  data: {
    authorMessage: string;
    signedEbookUrl: string;
    paymentAmount?: number;
  },
) {
  const res = await request(`${BASE_URL}/autograph-requests/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handle(res, "Could not sign the request");
}

export async function signAutographRequestDefault(
  id: string,
  fileUrl: string,
) {
  let paymentAmount: number | undefined;
  try {
    const fee: any = await getCurrentAutographFee();
    const amt = fee?.data?.amount ?? fee?.amount;
    if (typeof amt === "number") paymentAmount = amt;
  } catch {
    paymentAmount = undefined;
  }

  return signAutographRequest(id, {
    authorMessage: DEFAULT_AUTHOR_MESSAGE,
    signedEbookUrl: fileUrl,
    ...(paymentAmount !== undefined ? { paymentAmount } : {}),
  });
}

export async function unsignAutographRequest(id: string) {
  const res = await request(`${BASE_URL}/autograph-requests/${id}/unsigned`, {
    method: "PATCH",
    headers: authHeaders(),
  });
  return handle(res, "Could not mark the request as unsigned");
}

// ---------- Support Queries ----------
const SQ_URL = `${BASE_URL}/support-queries`;

export type SupportQueryStats = {
  totalQueries?: number;
  pendingQueries?: number;
  resolutionRate?: number;
  avgResponseTimeMinutes?: number;
};

export type ApiSupportQuery = {
  id: string;
  userId: string;
  subject: string;
  message: string;
  status: string;
  adminReply: string | null;
  firstResponseAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SupportQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
  userName?: string;
  role?: string;
  subject?: string;
  status?: string;
  sortBy?: string;
  order?: "ASC" | "DESC";
};

export async function getSupportQueries(
  pageOrParams: number | SupportQueryParams = 1,
  limit = 5,
) {
  const params: SupportQueryParams =
    typeof pageOrParams === "object"
      ? pageOrParams
      : { page: pageOrParams, limit };

  const qs = buildQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 5,
    search: params.search,
    userName: params.userName,
    role: params.role,
    subject: params.subject,
    status: params.status,
    sortBy: params.sortBy,
    order: params.order,
  });

  const res = await request(`${SQ_URL}${qs}`, {
    headers: authHeaders(),
  });
  return handle(res, "Could not load support queries");
}

export async function getSupportQueryStats(): Promise<SupportQueryStats> {
  const res = await request(`${SQ_URL}/stats`, { headers: authHeaders() });
  return handle(res, "Could not load support query stats");
}

export async function getSupportQueryById(id: string) {
  const res = await request(`${SQ_URL}/${id}`, { headers: authHeaders() });
  return handle(res, "Could not load support query");
}

export async function createSupportQuery(data: {
  subject: string;
  message: string;
}) {
  const res = await request(SQ_URL, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handle(res, "Could not create support query");
}

export async function updateSupportQuery(
  id: string,
  data: Partial<{ status: string; adminReply: string }>,
) {
  const res = await request(`${SQ_URL}/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handle(res, "Could not update support query");
}

export async function deleteSupportQuery(id: string) {
  const res = await request(`${SQ_URL}/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handle(res, "Could not delete support query");
}

///firebase
export async function registerDeviceToken(deviceToken: string) {
  const res = await fetch(`${BASE_URL}/notifications/register-device`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      deviceToken,
      platform: "web",
    }),
  });
  return handle(res, "Could not register device token");
}