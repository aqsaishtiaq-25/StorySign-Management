import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Flex,
  Text,
  Group,
  Stack,
  SimpleGrid,
  Table,
  Avatar,
  TextInput,
  Select,
  Button,
  Overlay,
  UnstyledButton,
  ActionIcon,
  Menu,
} from "@mantine/core";

import { MdSearch, MdFilterList, MdAdd } from "react-icons/md";
import { FaPen, FaTrashAlt } from "react-icons/fa";
import { HiOutlineBadgeCheck } from "react-icons/hi";

import ReaderLayout from "./ReaderLayout";
import { useAvatarSrc } from "./useAvatarSrc";
import Pagination from "./Pagination";
import {
  getMyProfile,
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
  getSubscriptions,
  cancelSubscription,
  deleteSubscription,
  getUsers,
  subscribeToPlan,
  getMySubscription,
  cancelMySubscription,
} from "../api";
import type { ApiPlan, ApiSubscription, ApiUser } from "../api";

type SubStatusFilter = "ALL" | "ACTIVE" | "CANCELLED" | "EXPIRED";

const SUB_FILTER_ITEMS: { value: SubStatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "EXPIRED", label: "Expired" },
];

const toList = (res: any): any[] | null =>
  Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : null;

const capitalize = (s: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";

const suffix = (planType: string) =>
  (planType ?? "").toLowerCase() === "yearly" ? "/y" : "/m";

const formatDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "-";

const normalizeSubStatus = (
  raw?: string,
): "active" | "cancelled" | "expired" | "other" => {
  const s = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (s === "active") return "active";
  if (s === "cancelled" || s === "canceled") return "cancelled";
  if (s === "expired") return "expired";
  return "other";
};

const initialsOf = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("") || "?";

function UserAvatar({
  url,
  name,
  size = 32,
}: {
  url?: string | null;
  name: string;
  size?: number;
}) {
  const src = useAvatarSrc(url);
  return (
    <Avatar
      src={src}
      radius="xl"
      size={size}
      styles={{
        placeholder: {
          backgroundColor: "#91451F",
          color: "#FFE8B6",
          fontWeight: 700,
          fontSize: Math.round(size * 0.36),
        },
      }}
    >
      {initialsOf(name)}
    </Avatar>
  );
}

interface SubscriberRow {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  plan: string;
  status: string;
  billing: string;
  started: string;
  nextBill: string;
}

export default function SubscriptionPlans() {
  const navigate = useNavigate();

  const accent = "#FFE8B6";
  const dark = "#211E1E";
  const inputBg = "#343131";
  const brown = "#81401F";

  const PAGE_SIZE = 3;

  // ---------- Role ----------
  const [role, setRole] = useState<string | null>(null);
  const isAdmin = role === "ADMIN";
  const isAuthor = role === "AUTHOR";

  const [view, setView] = useState<"list" | "form">("list");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successText, setSuccessText] = useState("added");

  // ---------- Backend data ----------
  const [plans, setPlans] = useState<ApiPlan[]>([]);
  const [subs, setSubs] = useState<ApiSubscription[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [mySub, setMySub] = useState<ApiSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [subsError, setSubsError] = useState("");
  const [actionError, setActionError] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [formError, setFormError] = useState("");

  // ---------- Form (admin) ----------
  const [editingId, setEditingId] = useState<string | null>(null);
  const [planName, setPlanName] = useState("");
  const [planType, setPlanType] = useState<string | null>("Monthly");
  const [planCharges, setPlanCharges] = useState("");
  const [features, setFeatures] = useState<string[]>([""]);

  // ---------- Search + Filter + Pagination (admin) ----------
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SubStatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const isEditing = editingId !== null;

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const loadPlansAndUsers = async (
    isCancelled: () => boolean = () => false,
  ) => {
    try {
      const plansRes = await getPlans();
      if (isCancelled()) return;
      const list = toList(plansRes);
      if (!list) throw new Error("Invalid response from server.");
      setPlans(list as ApiPlan[]);
      setErrorMsg("");
    } catch (err) {
      if (isCancelled()) return;
      setErrorMsg(`Could not load plans: ${(err as Error).message}`);
    }

    try {
      const usersRes = await getUsers(1, 100);
      if (isCancelled()) return;
      setUsers((toList(usersRes) ?? []) as ApiUser[]);
    } catch {
      // Users optional for plan cards
    }
  };

  const loadAdminSubscriptions = async (
    targetPage: number,
    searchVal: string,
    filterVal: SubStatusFilter,
    isCancelled: () => boolean = () => false,
  ) => {
    try {
      const hasActiveFilter = filterVal !== "ALL";
      const hasSearch = Boolean(searchVal.trim());

      // Jab filter ya search active ho to zyada items lekar exact status match karte hain
      // taake backend case-sensitivity ya empty param response ki wajah se rows miss na hon
      const fetchLimit = hasActiveFilter || hasSearch ? 100 : PAGE_SIZE;
      const fetchPage = hasActiveFilter || hasSearch ? 1 : targetPage;

      const subsRes: any = await getSubscriptions({
        page: fetchPage,
        limit: fetchLimit,
        ...(hasSearch ? { planName: searchVal.trim() } : {}),
        ...(hasActiveFilter ? { status: filterVal.toLowerCase() } : {}),
      });
      if (isCancelled()) return;

      let list = (toList(subsRes) ?? []) as ApiSubscription[];

      if (hasActiveFilter) {
        const expected = filterVal.toLowerCase();
        list = list.filter((s) => normalizeSubStatus(s.status) === expected);
      }

      if (hasSearch) {
        const q = searchVal.trim().toLowerCase();
        list = list.filter((s: any) => {
          const pName = String(s?.plan?.name ?? "").toLowerCase();
          const uName =
            `${s?.user?.firstName ?? ""} ${s?.user?.lastName ?? ""}`.toLowerCase();
          return pName.includes(q) || uName.includes(q);
        });
      }

      if (hasActiveFilter || hasSearch) {
        const computedTotalPages = Math.max(
          1,
          Math.ceil(list.length / PAGE_SIZE),
        );
        const safePage = Math.max(1, Math.min(targetPage, computedTotalPages));
        const startIdx = (safePage - 1) * PAGE_SIZE;
        setSubs(list.slice(startIdx, startIdx + PAGE_SIZE));
        setTotalPages(computedTotalPages);
      } else {
        setSubs(list);
        const apiTotalPages =
          subsRes?.pagination?.totalPages ??
          subsRes?.meta?.totalPages ??
          subsRes?.totalPages;
        if (typeof apiTotalPages === "number" && apiTotalPages > 0) {
          setTotalPages(apiTotalPages);
        } else {
          setTotalPages(
            Math.max(1, targetPage + (list.length === PAGE_SIZE ? 1 : 0)),
          );
        }
      }

      setSubsError("");
    } catch (err) {
      if (isCancelled()) return;
      setSubs([]);
      setSubsError(`Could not load subscribers: ${(err as Error).message}`);
    } finally {
      if (!isCancelled()) setLoading(false);
    }
  };

  const loadAdmin = async (isCancelled: () => boolean = () => false) => {
    await loadPlansAndUsers(isCancelled);
    await loadAdminSubscriptions(
      page,
      debouncedSearch,
      statusFilter,
      isCancelled,
    );
  };

  const loadAuthor = async (isCancelled: () => boolean = () => false) => {
    try {
      const plansRes = await getPlans();
      if (isCancelled()) return;
      const list = toList(plansRes);
      if (!list) throw new Error("Invalid response from server.");
      setPlans(list as ApiPlan[]);
      setErrorMsg("");
    } catch (err) {
      if (isCancelled()) return;
      setErrorMsg(`Could not load plans: ${(err as Error).message}`);
    }

    try {
      const mine = await getMySubscription();
      if (isCancelled()) return;
      setMySub(mine);
      setSubsError("");
    } catch (err) {
      if (isCancelled()) return;
      setSubsError(
        `Could not load your subscription: ${(err as Error).message}`,
      );
    } finally {
      if (!isCancelled()) setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res: any = await getMyProfile();
        if (cancelled) return;

        const me: any = res?.data ?? res?.user ?? res;
        const r = String(me?.role ?? "").toUpperCase();
        localStorage.setItem("role", r);
        setRole(r);

        if (r === "ADMIN") await loadAdmin(() => cancelled);
        else if (r === "AUTHOR") await loadAuthor(() => cancelled);
        else setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setErrorMsg((err as Error).message);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    loadAdminSubscriptions(
      page,
      debouncedSearch,
      statusFilter,
      () => cancelled,
    );
    return () => {
      cancelled = true;
    };
  }, [isAdmin, page, debouncedSearch, statusFilter]);

  const planById = new Map(plans.map((p) => [p.id, p]));
  const userById = new Map(users.map((u) => [u.id, u]));

  const subscribers: SubscriberRow[] = subs.map((s) => {
    const fullUser = userById.get(s.userId);
    const u: any = fullUser ?? s.user;
    const p: any = s.plan ?? planById.get(s.planId);
    const charges = p?.planCharges;

    return {
      id: s.id,
      userId: s.userId,
      name: u ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() : "Unknown",
      avatar: fullUser?.avatarUrl || u?.avatarUrl || "",
      plan: p?.name ?? "-",
      status: normalizeSubStatus(s.status),
      billing:
        charges !== undefined ? `$${charges}${suffix(p?.planType)}` : "-",
      started: formatDate(s.startsAt),
      nextBill: formatDate(s.endsAt),
    };
  });

  const mySubStatus = (mySub?.status ?? "").toLowerCase();
  const hasActive = mySub !== null && mySubStatus === "active";
  const myPlan: any = mySub
    ? (planById.get(mySub.planId) ?? (mySub as any).plan)
    : null;
  const authorPlans = plans.filter((p) => p.isActive);

  const planCols = Math.min(Math.max(plans.length, 2), 3);
  const authorPlanCols = Math.min(Math.max(authorPlans.length, 2), 3);

  const handleSelectFilter = (next: SubStatusFilter) => {
    setStatusFilter(next);
    setPage(1);
  };

  const activeFilterLabel =
    SUB_FILTER_ITEMS.find((item) => item.value === statusFilter)?.label ??
    "Filter";

  const handleSubscribe = async (plan: ApiPlan) => {
    if (
      !window.confirm(
        `Subscribe to "${plan.name}" for $${plan.planCharges}${suffix(plan.planType)}?`,
      )
    )
      return;

    try {
      setBusy(true);
      setActionError("");
      setInfoMsg("");
      await subscribeToPlan(plan.id);
      await loadAuthor();
      setInfoMsg(`You are now subscribed to "${plan.name}".`);
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleCancelMine = async () => {
    if (!window.confirm("Cancel your subscription?")) return;

    try {
      setBusy(true);
      setActionError("");
      setInfoMsg("");
      await cancelMySubscription();
      setMySub((prev) => (prev ? { ...prev, status: "cancelled" } : prev));
      setInfoMsg("Your subscription has been cancelled.");
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setPlanName("");
    setPlanType("Monthly");
    setPlanCharges("");
    setFeatures([""]);
    setFormError("");
  };

  const openAddForm = () => {
    resetForm();
    setActionError("");
    setView("form");
  };

  const openEditForm = (plan: ApiPlan) => {
    setEditingId(plan.id);
    setPlanName(plan.name);
    setPlanType(capitalize(plan.planType) || "Monthly");
    setPlanCharges(String(plan.planCharges));
    setFeatures(
      plan.features && plan.features.length > 0 ? plan.features : [""],
    );
    setFormError("");
    setActionError("");
    setView("form");
  };

  const handleCancel = () => {
    resetForm();
    setView("list");
  };

  const handleSubmit = async () => {
    setFormError("");

    const name = planName.trim();
    const charges = Number(planCharges.replace(/[^0-9.]/g, ""));
    const cleanFeatures = features.map((f) => f.trim()).filter(Boolean);

    if (!name) {
      setFormError("Please enter the plan name.");
      return;
    }
    if (!charges || charges <= 0) {
      setFormError("Please enter valid plan charges (for example 29).");
      return;
    }
    if (cleanFeatures.length === 0) {
      setFormError("Please add at least one feature.");
      return;
    }

    try {
      setSaving(true);

      if (editingId) {
        await updatePlan(editingId, {
          name,
          planType: (planType ?? "Monthly").toLowerCase(),
          planCharges: charges,
          features: cleanFeatures,
        });
        setSuccessText("updated");
      } else {
        await createPlan({
          name,
          planType: (planType ?? "Monthly").toLowerCase(),
          planCharges: charges,
          features: cleanFeatures,
          isActive: true,
        });
        setSuccessText("added");
      }

      await loadPlansAndUsers();
      await loadAdminSubscriptions(page, debouncedSearch, statusFilter);
      setShowSuccess(true);
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleOkay = () => {
    setShowSuccess(false);
    resetForm();
    setView("list");
  };

  const handleAddMore = () => {
    setFeatures((prev) => [...prev, ""]);
  };

  const handleFeatureChange = (index: number, value: string) => {
    setFeatures((prev) => prev.map((f, i) => (i === index ? value : f)));
  };

  const handleDeletePlan = async (plan: ApiPlan) => {
    if (!window.confirm(`Delete the plan "${plan.name}"?`)) return;

    try {
      setActionError("");
      await deletePlan(plan.id);
      await loadPlansAndUsers();
    } catch (err) {
      setActionError((err as Error).message);
    }
  };

  const handleCancelSubscription = async (row: SubscriberRow) => {
    if (!window.confirm(`Cancel the subscription of ${row.name}?`)) return;

    try {
      setActionError("");
      await cancelSubscription(row.id);
      await loadAdminSubscriptions(page, debouncedSearch, statusFilter);
    } catch (err) {
      setActionError((err as Error).message);
    }
  };

  const handleDeleteSubscription = async (row: SubscriberRow) => {
    if (!window.confirm(`Delete the subscription of ${row.name}?`)) return;

    try {
      setActionError("");
      await deleteSubscription(row.id);
      await loadAdminSubscriptions(page, debouncedSearch, statusFilter);
    } catch (err) {
      setActionError((err as Error).message);
    }
  };

  const openProfile = (userId: string) => {
    sessionStorage.setItem("selectedAuthorId", userId);
    navigate("/author-detail", { state: { id: userId } });
  };

  const badgeStyle = (plan: string) => {
    if (plan === "Starter") {
      return {
        backgroundColor: "rgba(200, 185, 150, 0.25)",
        color: accent,
        border: "1px solid rgba(255,232,182,0.7)",
      };
    }

    if (plan === "Professional" || plan === "Pro") {
      return {
        backgroundColor: "rgba(129, 64, 31, 0.4)",
        color: "#E99A70",
        border: "1px solid #A15D40",
      };
    }

    return {
      backgroundColor: "rgba(129, 64, 31, 0.15)",
      color: "#B96835",
      border: "1px solid #71391F",
    };
  };

  const statusBadge = (status: string) =>
    status === "active"
      ? {
          backgroundColor: "rgba(0, 110, 35, 0.35)",
          color: "#00D639",
          border: "1px solid rgba(0, 214, 57, 0.6)",
        }
      : {
          backgroundColor: "rgba(170, 20, 20, 0.4)",
          color: "#FF2B2B",
          border: "1px solid rgba(255, 43, 43, 0.6)",
        };

  const thStyle = {
    color: accent,
    fontSize: "14px",
    fontWeight: 700,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottom: "none",
  };

  const tdStyle = {
    borderBottom: "1px solid rgba(255,255,255,0.12)",
  };

  const inputStyles = {
    input: {
      height: "34px",
      minHeight: "34px",
      backgroundColor: inputBg,
      border: "none",
      borderRadius: "6px",
      color: "#FFFFFF",
      fontSize: "12px",
      paddingLeft: "14px",
    },
    dropdown: {
      backgroundColor: inputBg,
      border: "1px solid #45413B",
    },
    option: {
      color: "#FFFFFF",
      fontSize: "12px",
    },
  };

  const cardIconStyles = {
    root: {
      border: "1px solid #81401F",
      color: "#81401F",
      backgroundColor: "transparent",
    },
  };

  const pageTitle = isAdmin
    ? view === "list"
      ? "Subscription Plans"
      : "Subscription Plan"
    : "Subscription";

  return (
    <ReaderLayout title={pageTitle} activePage="subscription">
      {!isAdmin && !isAuthor && (
        <Box
          style={{
            backgroundColor: dark,
            borderRadius: "20px",
            flex: 1,
            minHeight: 0,
            padding: "20px",
            boxSizing: "border-box",
          }}
        >
          <Text size="13px" c={errorMsg ? "red.4" : "#B8B4B0"}>
            {loading
              ? "Loading..."
              : errorMsg || "This page is not available for your account."}
          </Text>
        </Box>
      )}

      {isAuthor && (
        <Box
          style={{
            backgroundColor: dark,
            borderRadius: "20px",
            flex: 1,
            minHeight: 0,
            padding: "20px",
            boxSizing: "border-box",
            overflowY: "auto",
            scrollbarWidth: "none",
          }}
        >
          {errorMsg && (
            <Text c="red.4" size="xs" mb={8}>
              {errorMsg}
            </Text>
          )}

          {actionError && (
            <Text c="red.4" size="xs" mb={8}>
              {actionError}
            </Text>
          )}

          {infoMsg && (
            <Text c="green.4" size="xs" mb={8}>
              {infoMsg}
            </Text>
          )}

          <Text size="22px" fw={700} c={accent} mb={12}>
            My Subscription
          </Text>

          {loading && (
            <Text size="13px" c="#B8B4B0">
              Loading...
            </Text>
          )}

          {subsError && (
            <Text c="red.4" size="xs" mb={8}>
              {subsError}
            </Text>
          )}

          {!loading && !subsError && !mySub && (
            <Text size="13px" c="#B8B4B0">
              You don't have an active subscription. Choose a plan below to
              subscribe.
            </Text>
          )}

          {mySub && (
            <Box
              style={{
                border: "1px solid rgba(255,232,182,0.25)",
                borderRadius: "12px",
                padding: "16px 18px",
                boxSizing: "border-box",
              }}
            >
              <Flex justify="space-between" align="center" mb={12}>
                <Group gap={12} align="center">
                  <Text size="18px" fw={700} c={accent}>
                    {myPlan?.name ?? "Your plan"}
                  </Text>

                  <Box
                    style={{
                      borderRadius: "6px",
                      padding: "4px 10px",
                      fontSize: "10px",
                      fontWeight: 500,
                      lineHeight: 1.1,
                      ...statusBadge(mySubStatus),
                    }}
                  >
                    {capitalize(mySubStatus) || "Unknown"}
                  </Box>
                </Group>

                <Text size="18px" fw={600} c={accent}>
                  {myPlan?.planCharges !== undefined
                    ? `$${myPlan.planCharges}${suffix(myPlan.planType)}`
                    : ""}
                </Text>
              </Flex>

              <Flex gap={40} align="center" justify="space-between">
                <Group gap={40}>
                  <Box>
                    <Text size="10px" c="#B8B4B0">
                      Started
                    </Text>
                    <Text size="12px" c="#E0E0E0" fw={500}>
                      {formatDate(mySub.startsAt)}
                    </Text>
                  </Box>

                  <Box>
                    <Text size="10px" c="#B8B4B0">
                      {hasActive ? "Next Bill" : "Ends On"}
                    </Text>
                    <Text size="12px" c="#E0E0E0" fw={500}>
                      {formatDate(mySub.endsAt)}
                    </Text>
                  </Box>
                </Group>

                {hasActive && (
                  <Button
                    h={34}
                    px={22}
                    radius={6}
                    color="#2B2B2B"
                    c="#FF6B6B"
                    fw={500}
                    onClick={handleCancelMine}
                    loading={busy}
                    styles={{ root: { fontSize: "13px" } }}
                  >
                    Cancel Subscription
                  </Button>
                )}
              </Flex>
            </Box>
          )}

          <Text size="22px" fw={700} c={accent} mt={28} mb={12}>
            Available Plans
          </Text>

          {hasActive && (
            <Text size="11px" c="#B8B4B0" mb={10}>
              To switch plans, cancel your current subscription first.
            </Text>
          )}

          {!loading && authorPlans.length === 0 && !errorMsg && (
            <Text size="13px" c="#B8B4B0">
              No plans are available right now.
            </Text>
          )}

          <SimpleGrid cols={authorPlanCols} spacing={14}>
            {authorPlans.map((plan) => {
              const isCurrent = hasActive && mySub?.planId === plan.id;

              return (
                <Box
                  key={plan.id}
                  style={{
                    backgroundColor: accent,
                    borderRadius: "12px",
                    padding: "14px 16px",
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Flex justify="space-between" align="center" mb={8}>
                    <Text size="18px" fw={700} c="#211E1E">
                      {plan.name}
                    </Text>

                    <Text size="18px" fw={600} c="#211E1E">
                      ${plan.planCharges}
                      <Text span size="11px" fw={500}>
                        {suffix(plan.planType)}
                      </Text>
                    </Text>
                  </Flex>

                  <Text size="10px" fw={700} c="#30251C" mb={8}>
                    {capitalize(plan.planType)}
                  </Text>

                  <Stack gap={5}>
                    {(plan.features ?? []).map((feature, i) => (
                      <Text
                        key={`${feature}-${i}`}
                        size="10px"
                        c="#5C5142"
                        style={{ lineHeight: 1.4 }}
                      >
                        {feature}
                      </Text>
                    ))}
                  </Stack>

                  <Box mt="auto" pt={12}>
                    {isCurrent ? (
                      <Text size="12px" fw={700} c={brown}>
                        Current Plan
                      </Text>
                    ) : (
                      <Button
                        h={30}
                        px={18}
                        radius={6}
                        color="#81401F"
                        c="#FFE8B6"
                        fw={500}
                        disabled={hasActive}
                        loading={busy}
                        onClick={() => handleSubscribe(plan)}
                        styles={{ root: { fontSize: "12px" } }}
                      >
                        Subscribe
                      </Button>
                    )}
                  </Box>
                </Box>
              );
            })}
          </SimpleGrid>
        </Box>
      )}

      {isAdmin && view === "list" && (
        <>
          <Box
            style={{
              backgroundColor: dark,
              borderRadius: "20px",
              flex: 1,
              minHeight: 0,
              padding: "20px",
              boxSizing: "border-box",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {errorMsg && (
              <Text c="red.4" size="xs" mb={8}>
                {errorMsg}
              </Text>
            )}

            {actionError && (
              <Text c="red.4" size="xs" mb={8}>
                {actionError}
              </Text>
            )}

            <Box
              style={{
                flexShrink: 0,
                maxHeight: "340px",
                overflowY: "auto",
                scrollbarWidth: "none",
              }}
            >
              {!loading && plans.length === 0 && !errorMsg && (
                <Text size="13px" c="#B8B4B0" py="md">
                  No plans yet. Click "Add Plan" to create one.
                </Text>
              )}

              <SimpleGrid cols={planCols} spacing={14}>
                {plans.map((plan) => (
                  <Box
                    key={plan.id}
                    style={{
                      backgroundColor: accent,
                      borderRadius: "12px",
                      padding: "14px 16px",
                      boxSizing: "border-box",
                      overflow: "hidden",
                      opacity: plan.isActive ? 1 : 0.6,
                    }}
                  >
                    <Flex justify="space-between" align="center" mb={8}>
                      <Text size="18px" fw={700} c="#211E1E">
                        {plan.name}
                      </Text>

                      <Text size="18px" fw={600} c="#211E1E">
                        ${plan.planCharges}
                        <Text span size="11px" fw={500}>
                          {suffix(plan.planType)}
                        </Text>
                      </Text>
                    </Flex>

                    <Flex justify="space-between" align="center" mb={8}>
                      <Text size="10px" fw={700} c="#30251C">
                        {capitalize(plan.planType)}
                        {plan.isActive ? "" : " (Inactive)"}
                      </Text>

                      <Group gap={6} wrap="nowrap">
                        <ActionIcon
                          variant="transparent"
                          radius="xl"
                          size={22}
                          aria-label="Edit plan"
                          onClick={() => openEditForm(plan)}
                          styles={cardIconStyles}
                        >
                          <FaPen size={9} />
                        </ActionIcon>

                        <ActionIcon
                          variant="transparent"
                          radius="xl"
                          size={22}
                          aria-label="Delete plan"
                          onClick={() => handleDeletePlan(plan)}
                          styles={cardIconStyles}
                        >
                          <FaTrashAlt size={9} />
                        </ActionIcon>
                      </Group>
                    </Flex>

                    <Stack gap={5}>
                      {(plan.features ?? []).map((feature, i) => (
                        <Text
                          key={`${feature}-${i}`}
                          size="10px"
                          c="#5C5142"
                          style={{ lineHeight: 1.4 }}
                        >
                          {feature}
                        </Text>
                      ))}
                    </Stack>
                  </Box>
                ))}
              </SimpleGrid>
            </Box>

            <Flex
              justify="space-between"
              align="center"
              mt={28}
              mb={12}
              style={{ flexShrink: 0 }}
            >
              <Text size="22px" fw={700} c={accent}>
                All Subscribers
              </Text>

              <Group gap={12}>
                <TextInput
                  placeholder="Search"
                  value={search}
                  onChange={(e) => setSearch(e.currentTarget.value)}
                  leftSection={<MdSearch size={15} color="#D5D0C6" />}
                  styles={{
                    input: {
                      width: "180px",
                      height: "32px",
                      minHeight: "32px",
                      backgroundColor: "#383838",
                      border: "none",
                      borderRadius: "20px",
                      color: "#FFFFFF",
                      fontSize: "11px",
                      paddingLeft: "32px",
                    },
                  }}
                />

                <Menu shadow="md" width={150} position="bottom-end">
                  <Menu.Target>
                    <UnstyledButton
                      style={{
                        height: "32px",
                        padding: "0 14px",
                        backgroundColor:
                          statusFilter === "ALL" ? "#383838" : brown,
                        borderRadius: "20px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <MdFilterList size={14} color="#E0E0E0" />
                      <Text size="11px" c="#E0E0E0">
                        {statusFilter === "ALL" ? "Filter" : activeFilterLabel}
                      </Text>
                    </UnstyledButton>
                  </Menu.Target>

                  <Menu.Dropdown
                    style={{
                      backgroundColor: "#2B2828",
                      border: "1px solid #45413D",
                    }}
                  >
                    {SUB_FILTER_ITEMS.map((item) => (
                      <Menu.Item
                        key={item.value}
                        onClick={() => handleSelectFilter(item.value)}
                        style={{
                          color:
                            statusFilter === item.value ? accent : "#FFFFFF",
                          backgroundColor:
                            statusFilter === item.value
                              ? "rgba(129, 64, 31, 0.45)"
                              : "transparent",
                          fontSize: "11px",
                        }}
                      >
                        {item.label}
                      </Menu.Item>
                    ))}
                  </Menu.Dropdown>
                </Menu>

                <UnstyledButton
                  onClick={openAddForm}
                  style={{
                    height: "32px",
                    padding: "0 14px",
                    backgroundColor: brown,
                    borderRadius: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <MdAdd size={15} color={accent} />
                  <Text size="11px" c={accent}>
                    Add Plan
                  </Text>
                </UnstyledButton>
              </Group>
            </Flex>

            {subsError && (
              <Text c="red.4" size="xs" mb={8}>
                {subsError}
              </Text>
            )}

            <Box style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
              {loading && (
                <Text size="13px" c="#B8B4B0">
                  Loading...
                </Text>
              )}

              {!loading && !subsError && subscribers.length === 0 && (
                <Text size="13px" c="#B8B4B0">
                  No subscribers yet.
                </Text>
              )}

              {subscribers.length > 0 && (
                <Table
                  horizontalSpacing={0}
                  verticalSpacing={8}
                  style={{
                    width: "100%",
                    tableLayout: "fixed",
                    color: "#CCCCCC",
                  }}
                >
                  <Table.Thead>
                    <Table.Tr style={{ borderBottom: "none" }}>
                      <Table.Th style={{ ...thStyle, width: "20%" }}>
                        Author Detail
                      </Table.Th>
                      <Table.Th style={{ ...thStyle, width: "13%" }}>
                        Plan
                      </Table.Th>
                      <Table.Th style={{ ...thStyle, width: "14%" }}>
                        Billing
                      </Table.Th>
                      <Table.Th style={{ ...thStyle, width: "15%" }}>
                        Started
                      </Table.Th>
                      <Table.Th style={{ ...thStyle, width: "15%" }}>
                        Next Bill
                      </Table.Th>
                      <Table.Th style={{ ...thStyle, width: "23%" }}>
                        Action
                      </Table.Th>
                    </Table.Tr>
                  </Table.Thead>

                  <Table.Tbody>
                    {subscribers.map((subscriber) => (
                      <Table.Tr
                        key={subscriber.id}
                        style={{ borderBottom: "none" }}
                      >
                        <Table.Td py={10} style={tdStyle}>
                          <Group gap={8} wrap="nowrap">
                            <UserAvatar
                              url={subscriber.avatar}
                              name={subscriber.name}
                              size={32}
                            />

                            <Text
                              size="12px"
                              c="#FFFFFF"
                              fw={500}
                              style={{ lineHeight: 1.25 }}
                            >
                              {subscriber.name}
                            </Text>
                          </Group>
                        </Table.Td>

                        <Table.Td py={10} style={tdStyle}>
                          <Box
                            style={{
                              display: "inline-block",
                              borderRadius: "6px",
                              padding: "4px 10px",
                              fontSize: "10px",
                              fontWeight: 500,
                              lineHeight: 1.1,
                              ...badgeStyle(subscriber.plan),
                            }}
                          >
                            {subscriber.plan}
                          </Box>

                          {subscriber.status !== "active" && (
                            <Text size="9px" c="#FF6B6B" mt={4}>
                              {capitalize(subscriber.status) || "Inactive"}
                            </Text>
                          )}
                        </Table.Td>

                        <Table.Td py={10} style={tdStyle}>
                          <Text size="14px" c={accent} fw={400}>
                            {subscriber.billing}
                          </Text>
                        </Table.Td>

                        <Table.Td py={10} style={tdStyle}>
                          <Text size="10px" c="#E0E0E0" fw={500}>
                            {subscriber.started}
                          </Text>
                        </Table.Td>

                        <Table.Td py={10} style={tdStyle}>
                          <Text size="10px" c="#E0E0E0" fw={500}>
                            {subscriber.nextBill}
                          </Text>
                        </Table.Td>

                        <Table.Td py={10} style={tdStyle}>
                          <Group gap={12} wrap="nowrap">
                            <UnstyledButton
                              onClick={() => openProfile(subscriber.userId)}
                            >
                              <Text
                                size="10px"
                                c={accent}
                                fw={400}
                                td="underline"
                              >
                                View Profile
                              </Text>
                            </UnstyledButton>

                            {subscriber.status === "active" && (
                              <UnstyledButton
                                onClick={() =>
                                  handleCancelSubscription(subscriber)
                                }
                              >
                                <Text
                                  size="10px"
                                  c="#E99A70"
                                  fw={400}
                                  td="underline"
                                >
                                  Cancel
                                </Text>
                              </UnstyledButton>
                            )}

                            <UnstyledButton
                              onClick={() =>
                                handleDeleteSubscription(subscriber)
                              }
                            >
                              <Text
                                size="10px"
                                c="#FF6B6B"
                                fw={400}
                                td="underline"
                              >
                                Delete
                              </Text>
                            </UnstyledButton>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </Box>
          </Box>

          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}

      {isAdmin && view === "form" && (
        <Box
          style={{
            width: "100%",
            minHeight: "340px",
            backgroundColor: dark,
            borderRadius: "20px",
            padding: "22px 20px 26px 20px",
            boxSizing: "border-box",
          }}
        >
          <Text size="20px" fw={700} c={accent} mb={14}>
            {isEditing ? "Edit Plan" : "Add Plan"}
          </Text>

          <Flex gap={16} align="flex-start" mb={14}>
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Text size="16px" c={accent} mb={10}>
                Plan Name
              </Text>

              <TextInput
                placeholder="Starter"
                value={planName}
                onChange={(e) => setPlanName(e.currentTarget.value)}
                styles={inputStyles}
              />
            </Box>

            <Box style={{ flex: 1, minWidth: 0 }}>
              <Text size="16px" c={accent} mb={10}>
                Plan Type
              </Text>

              <Select
                data={["Monthly", "Yearly"]}
                value={planType}
                onChange={setPlanType}
                allowDeselect={false}
                styles={inputStyles}
              />
            </Box>

            <Box style={{ flex: 1, minWidth: 0 }}>
              <Text size="16px" c={accent} mb={10}>
                Plan Charges
              </Text>

              <TextInput
                placeholder="$29"
                value={planCharges}
                onChange={(e) => setPlanCharges(e.currentTarget.value)}
                styles={inputStyles}
              />
            </Box>
          </Flex>

          <Text size="16px" c={accent} mb={10}>
            Features
          </Text>

          <Group align="flex-start" gap={16} wrap="nowrap">
            <Stack gap={10} style={{ flex: 1, minWidth: 0 }}>
              {features.map((feature, index) => (
                <TextInput
                  key={index}
                  value={feature}
                  onChange={(e) =>
                    handleFeatureChange(index, e.currentTarget.value)
                  }
                  styles={inputStyles}
                />
              ))}
            </Stack>

            <Button
              w={100}
              h={34}
              radius={6}
              color="#FFE8B6"
              c="#81401F"
              fw={500}
              onClick={handleAddMore}
              styles={{ root: { fontSize: "13px" } }}
            >
              Add More
            </Button>
          </Group>

          {formError && (
            <Text c="red.4" size="xs" mt={14}>
              {formError}
            </Text>
          )}

          <Group gap={16} mt={formError ? 30 : 56} align="center">
            <Button
              w={160}
              h={34}
              radius={6}
              color="#81401F"
              c="#FFE8B6"
              fw={500}
              onClick={handleSubmit}
              loading={saving}
              styles={{ root: { fontSize: "13px" } }}
            >
              {isEditing ? "Update Plan" : "Add Plan"}
            </Button>

            <Button
              w={160}
              h={34}
              radius={6}
              color="#2B2B2B"
              c="#E0E0E0"
              fw={400}
              onClick={handleCancel}
              styles={{ root: { fontSize: "13px" } }}
            >
              Cancel
            </Button>
          </Group>
        </Box>
      )}

      {isAdmin && showSuccess && (
        <Box
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px",
          }}
        >
          <Overlay
            color="#000000"
            backgroundOpacity={0.5}
            blur={3}
            zIndex={0}
          />

          <Box
            style={{
              position: "relative",
              zIndex: 1,
              width: "350px",
              maxWidth: "100%",
              minHeight: "255px",
              padding: "30px 28px",
              boxSizing: "border-box",
              backgroundColor: "#FFEBBC",
              borderRadius: "14px",
              boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <HiOutlineBadgeCheck size={42} color="#81401F" />

            <Text
              size="15px"
              fw={500}
              c="#3A2A20"
              mb={26}
              style={{ lineHeight: 1.5 }}
            >
              Subscription plan has been
              <br />
              {successText} successfully
            </Text>

            <Button
              w={100}
              h={32}
              radius={6}
              color="#81401F"
              c="#FFEBBC"
              fw={600}
              onClick={handleOkay}
              styles={{ root: { fontSize: "13px" } }}
            >
              Okay
            </Button>
          </Box>
        </Box>
      )}
    </ReaderLayout>
  );
}
