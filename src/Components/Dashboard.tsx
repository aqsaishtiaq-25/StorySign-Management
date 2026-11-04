import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Flex,
  Text,
  Group,
  Stack,
  Avatar,
  SimpleGrid,
  Table,
  ActionIcon,
  Select,
} from "@mantine/core";

import {
  FaUser,
  FaBook,
  FaRegAddressCard,
  FaDollarSign,
  FaEye,
} from "react-icons/fa";

import Highcharts from "highcharts";
import HighchartsReactWrapper from "highcharts-react-official";

const HighchartsReact =
  (HighchartsReactWrapper as any)?.default || HighchartsReactWrapper;

import ReaderLayout from "./ReaderLayout";
import readerImg from "../assets/Reader-image.png";
import authorImg from "../assets/Author-image.png";
import {
  getAutographRequests,
  getDashboardOverview,
  getDashboardRevenueAnalytics,
  getDashboardUserGrowth,
  getUsers,
} from "../api";

// "View More" / "View All" / eye icon ke routes: apni route file ke hisaab se theek karein
const ROUTES = {
  requests: "/requests",
  readers: "/readers",
  authors: "/author-management",
  requestDetail: (id: string) => `/request-detail/${id}`,
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const unwrap = (res: any) => res?.data ?? res;

function toNum(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !isNaN(Number(v))) {
    return Number(v);
  }
  return null;
}

// Nested object ko "a.b.c" keys mein baraabar karta hai
function flatten(
  obj: any,
  prefix = "",
  depth = 0,
  out: Record<string, any> = {},
) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj) || depth > 3) {
    return out;
  }
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      flatten(v, key, depth + 1, out);
    } else {
      out[key] = v;
    }
  }
  return out;
}

const SKIP_KEYS = /change|growth|percent|trend|rate|diff/i;

function findNumber(
  flat: Record<string, any>,
  patterns: RegExp[],
  skipTrendKeys = true,
): number | null {
  const keys = Object.keys(flat).filter(
    (k) => !skipTrendKeys || !SKIP_KEYS.test(k),
  );
  for (const p of patterns) {
    for (const k of keys) {
      if (p.test(k)) {
        const n = toNum(flat[k]);
        if (n !== null) return n;
      }
    }
  }
  return null;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatLabel(v: unknown): string {
  if (typeof v === "number" && v >= 1 && v <= 12) return MONTHS[v - 1];
  const s = String(v ?? "");
  if (/^\d{4}-\d{2}/.test(s)) {
    const d = new Date(s.length === 7 ? `${s}-01` : s);
    if (!isNaN(d.getTime())) return MONTHS[d.getMonth()];
  }
  if (/^[A-Za-z]{4,}$/.test(s)) return s.slice(0, 3);
  return s;
}

function formatMoney(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return `$${n.toLocaleString()}`;
}

type Series = { categories: string[]; reader: number[]; author: number[] };

// Revenue / user-growth ka response -> chart ka data (kai shaklein sambhalta hai)
function toSeries(res: any): Series | null {
  const src = unwrap(res);

  // Shakal 1: rows ki array, har row mein month + reader(s) + author(s)
  let rows: any[] | null = null;
  if (Array.isArray(src)) {
    rows = src;
  } else if (src && typeof src === "object") {
    for (const k of [
      "items",
      "data",
      "months",
      "monthly",
      "growth",
      "analytics",
      "series",
    ]) {
      if (Array.isArray(src[k])) {
        rows = src[k];
        break;
      }
    }
  }

  if (rows) {
    const categories: string[] = [];
    const reader: number[] = [];
    const author: number[] = [];

    rows.forEach((r) => {
      const flat = flatten(r);
      const label =
        r?.month ?? r?.label ?? r?.name ?? r?.period ?? r?.date ?? "";
      categories.push(formatLabel(label));
      reader.push(findNumber(flat, [/reader/i], false) ?? 0);
      author.push(findNumber(flat, [/author/i], false) ?? 0);
    });

    return { categories, reader, author };
  }

  // Shakal 2: object jis mein arrays hon (labels, reader[], author[])
  if (src && typeof src === "object") {
    const keys = Object.keys(src);
    const arrKey = (p: RegExp) =>
      keys.find((k) => p.test(k) && Array.isArray(src[k]));

    const lk = arrKey(/month|label|categor|period/i);
    const rk = arrKey(/reader/i);
    const ak = arrKey(/author/i);

    if (rk || ak) {
      const len = Math.max(
        src[rk ?? ""]?.length ?? 0,
        src[ak ?? ""]?.length ?? 0,
      );
      const categories = lk
        ? (src[lk] as any[]).map(formatLabel)
        : Array.from({ length: len }, (_, i) => String(i + 1));
      const nums = (k?: string) =>
        k ? (src[k] as any[]).map((n) => toNum(n) ?? 0) : Array(len).fill(0);

      return { categories, reader: nums(rk), author: nums(ak) };
    }
  }

  return null;
}

/* ------------------------------------------------------------------ */
/* Chart                                                               */
/* ------------------------------------------------------------------ */

function ChartBox({ options }: { options: Highcharts.Options }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const update = () => setHeight(el.clientHeight);
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const merged = useMemo<Highcharts.Options>(
    () => ({
      ...options,
      chart: { ...options.chart, height },
    }),
    [options, height],
  );

  return (
    <div
      ref={wrapRef}
      style={{ position: "relative", flex: 1, minHeight: 120 }}
    >
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        {height > 0 && (
          <HighchartsReact highcharts={Highcharts} options={merged} />
        )}
      </div>
    </div>
  );
}

const kLabel = function (this: any) {
  const v = Number(this.value);
  if (v === 0) return "0";
  return v >= 1000 ? `${v / 1000}k` : String(v);
};

function buildRevenueOptions(s: Series): Highcharts.Options {
  return {
    chart: {
      type: "spline",
      backgroundColor: "transparent",
      spacing: [10, 5, 10, 5],
    },
    title: { text: undefined },
    xAxis: {
      categories: s.categories,
      labels: { style: { color: "#A0A0A0", fontSize: "11px" } },
      lineColor: "rgba(255,255,255,0.1)",
      lineWidth: 1,
      tickColor: "transparent",
    },
    yAxis: {
      min: 0,
      title: {
        text: "Revenue (Dollars)",
        style: { color: "#A0A0A0", fontSize: "10px" },
      },
      labels: {
        formatter: kLabel,
        style: { color: "#A0A0A0", fontSize: "10px" },
      },
      gridLineColor: "rgba(255, 255, 255, 0.08)",
    },
    legend: {
      align: "center",
      verticalAlign: "bottom",
      symbolWidth: 8,
      symbolHeight: 8,
      symbolRadius: 4,
      itemStyle: { color: "#FFE8B6", fontSize: "11px", fontWeight: "400" },
    },
    credits: { enabled: false },
    tooltip: {
      shared: true,
      backgroundColor: "#FFE8B6",
      borderRadius: 6,
      borderWidth: 0,
      style: { color: "#2A1005", fontSize: "10px", fontWeight: "600" },
      formatter: function (this: any) {
        let html = `<b>${this.x}</b>`;
        (this.points ?? []).forEach((p: any) => {
          html += `<br/><span style="color:${p.color}">●</span> ${
            p.series.name
          }: $${Number(p.y).toLocaleString()}`;
        });
        return html;
      },
    },
    plotOptions: {
      spline: { lineWidth: 3, marker: { enabled: false } },
      series: { animation: false },
    },
    series: [
      { type: "spline", name: "Reader", data: s.reader, color: "#C86228" },
      { type: "spline", name: "Author", data: s.author, color: "#FFE8B6" },
    ],
  };
}

function buildGrowthOptions(s: Series): Highcharts.Options {
  const tallest = Math.max(1, ...s.reader.map((r, i) => r + s.author[i]));
  const gap = Math.max(1, Math.round(tallest * 0.1));

  return {
    chart: {
      type: "column",
      backgroundColor: "transparent",
      spacing: [10, 5, 10, 5],
    },
    title: { text: undefined },
    xAxis: {
      categories: s.categories,
      labels: { style: { color: "#A0A0A0", fontSize: "11px" } },
      lineColor: "rgba(255,255,255,0.1)",
      lineWidth: 1,
      tickColor: "transparent",
    },
    yAxis: {
      min: 0,
      allowDecimals: false,
      title: { text: undefined },
      labels: {
        formatter: kLabel,
        style: { color: "#A0A0A0", fontSize: "10px" },
      },
      gridLineColor: "rgba(255, 255, 255, 0.08)",
    },
    legend: { enabled: false },
    credits: { enabled: false },
    tooltip: {
      backgroundColor: "#FFE8B6",
      borderRadius: 6,
      borderWidth: 0,
      style: { color: "#2A1005", fontSize: "10px", fontWeight: "600" },
      formatter: function (this: any) {
        if (this.series.name === "Gap") return false;
        return `<b>${this.x}</b><br/>${this.series.name}: ${Number(
          this.y,
        ).toLocaleString()}`;
      },
    },
    plotOptions: {
      column: {
        stacking: "normal",
        borderWidth: 0,
        borderRadius: 6,
        pointWidth: 7,
        groupPadding: 0.38,
        pointPadding: 0,
      },
      series: { animation: false },
    },
    series: [
      { type: "column", name: "Reader", data: s.reader, color: "#C86228" },
      {
        type: "column",
        name: "Gap",
        data: s.reader.map(() => gap),
        color: "transparent",
        showInLegend: false,
        enableMouseTracking: false,
      },
      { type: "column", name: "Author", data: s.author, color: "#FFE8B6" },
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type RequestRow = {
  id: string;
  shortId: string;
  reader: string;
  readerAvatar: string;
  author: string;
  authorAvatar: string;
  book: string;
  status: "Pending" | "In progress" | "Delivered" | "Rejected";
};

type UserRow = {
  id: string;
  name: string;
  role: string;
  avatar: string;
};

function fullName(u: any) {
  if (!u) return "Unknown";
  return `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "Unknown";
}

function statusLabel(raw: unknown): RequestRow["status"] {
  const s = String(raw ?? "").toUpperCase();
  if (s === "COMPLETED") return "Delivered";
  if (s === "REJECTED") return "Rejected";
  if (s === "IN_PROGRESS") return "In progress";
  return "Pending";
}

function statusStyle(status: RequestRow["status"]) {
  if (status === "Delivered") {
    return {
      bg: "rgba(46, 125, 50, 0.18)",
      color: "#4CAF50",
      border: "1px solid rgba(76, 175, 80, 0.5)",
    };
  }
  if (status === "Rejected") {
    return {
      bg: "rgba(198, 40, 40, 0.18)",
      color: "#EF5350",
      border: "1px solid rgba(239, 83, 80, 0.5)",
    };
  }
  return {
    bg: "rgba(255, 232, 182, 0.12)",
    color: "#FFE8B6",
    border: "1px solid rgba(255, 232, 182, 0.4)",
  };
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Dashboard() {
  const navigate = useNavigate();

  const innerContainerBg = "#211E1E";
  const chartBoxBg = "#262323";
  const accentCardBg = "#FFE8B6";
  const titleColor = "#6A4335";
  const numberColor = "#2A1005";

  const [overview, setOverview] = useState<any>(null);
  const [revenue, setRevenue] = useState<Series | null>(null);
  const [growth, setGrowth] = useState<Series | null>(null);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<string>("6 Months");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [ov, rev, gr, rq, us] = await Promise.allSettled([
        getDashboardOverview(),
        getDashboardRevenueAnalytics(),
        getDashboardUserGrowth(6),
        getAutographRequests(1, 4),
        getUsers(1, 20),
      ]);

      if (cancelled) return;

      const errs: Record<string, string> = {};
      const msg = (r: PromiseRejectedResult) =>
        r.reason instanceof Error ? r.reason.message : "Something went wrong";

      // Overview (cards)
      if (ov.status === "fulfilled") {
        console.log("Dashboard overview:", ov.value);
        setOverview(unwrap(ov.value));
      } else errs.overview = msg(ov);

      // Revenue chart
      if (rev.status === "fulfilled") {
        console.log("Dashboard revenue:", rev.value);
        const s = toSeries(rev.value);
        if (s) setRevenue(s);
        else errs.revenue = "Unexpected response format";
      } else errs.revenue = msg(rev);

      // User growth chart
      if (gr.status === "fulfilled") {
        console.log("Dashboard user growth:", gr.value);
        const s = toSeries(gr.value);
        if (s) setGrowth(s);
        else errs.growth = "Unexpected response format";
      } else errs.growth = msg(gr);

      // Recent requests
      if (rq.status === "fulfilled") {
        const list: any[] = Array.isArray(rq.value?.data) ? rq.value.data : [];
        setRequests(
          list.slice(0, 4).map((r) => ({
            id: String(r.id),
            shortId: String(r.id).slice(0, 8),
            reader: fullName(r.reader),
            readerAvatar: r.reader?.avatarUrl || readerImg,
            author: fullName(r.author),
            authorAvatar: r.author?.avatarUrl || authorImg,
            book: r.ebook?.title ?? "-",
            status: statusLabel(r.status),
          })),
        );
      } else errs.requests = msg(rq);

      // Users list (admin ko chhor kar)
      if (us.status === "fulfilled") {
        const v: any = us.value;
        const raw = Array.isArray(v)
          ? v
          : (v?.data?.items ?? v?.data ?? v?.items ?? v?.users ?? []);
        const list: any[] = Array.isArray(raw) ? raw : [];

        setUsers(
          list
            .filter((u) => String(u.role).toUpperCase() !== "ADMIN")
            .slice(0, 12)
            .map((u) => {
              const role = String(u.role ?? "");
              const isAuthor = role.toUpperCase() === "AUTHOR";
              return {
                id: String(u.id),
                name: fullName(u),
                role:
                  role.charAt(0).toUpperCase() + role.slice(1).toLowerCase(),
                avatar: u.avatarUrl || (isAuthor ? authorImg : readerImg),
              };
            }),
        );
      } else errs.users = msg(us);

      setErrors(errs);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Dropdown: backend se poora data aata hai, yahan aakhri 6 ya 12 mahine kaat te hain
  const months = period === "12 Months" ? 12 : 6;
  const cut = (s: Series | null): Series | null =>
    s
      ? {
          categories: s.categories.slice(-months),
          reader: s.reader.slice(-months),
          author: s.author.slice(-months),
        }
      : null;

  const revenueSeries = useMemo(() => cut(revenue), [revenue, months]);
  const growthSeries = useMemo(() => cut(growth), [growth, months]);

  const revenueOptions = useMemo(
    () => (revenueSeries ? buildRevenueOptions(revenueSeries) : null),
    [revenueSeries],
  );
  const growthOptions = useMemo(
    () => (growthSeries ? buildGrowthOptions(growthSeries) : null),
    [growthSeries],
  );

  // Cards ke numbers
  const flat = useMemo(() => flatten(overview), [overview]);
  const fmt = (n: number | null, money = false) =>
    n === null ? "-" : money ? formatMoney(n) : n.toLocaleString();

  const statCards = [
    {
      title: "Total Revenue",
      value: fmt(findNumber(flat, [/total.*revenue/i, /revenue/i]), true),
      icon: <FaDollarSign size={12} color={numberColor} />,
      circleIcon: true,
      link: "This Month",
      to: null as string | null,
    },
    {
      title: "Total Authors",
      value: fmt(findNumber(flat, [/total.*authors?/i, /authors?/i])),
      icon: <FaUser size={16} color={numberColor} />,
      link: "View More",
      to: ROUTES.authors,
    },
    {
      title: "Total Readers",
      value: fmt(findNumber(flat, [/total.*readers?/i, /readers?/i])),
      icon: <FaBook size={16} color={numberColor} />,
      link: "View More",
      to: ROUTES.readers,
    },
    {
      title: "New Requests",
      value: fmt(findNumber(flat, [/new.*requests?/i, /requests?/i])),
      icon: <FaRegAddressCard size={16} color={numberColor} />,
      link: "View More",
      to: ROUTES.requests,
    },
  ];

  const emptyMsg = (text: string) => (
    <Flex align="center" justify="center" style={{ flex: 1, minHeight: 120 }}>
      <Text size="12px" c="#B8B4B0" ta="center">
        {text}
      </Text>
    </Flex>
  );

  const chartBody = (options: Highcharts.Options | null, error?: string) => {
    if (loading) return emptyMsg("Loading...");
    if (error) return emptyMsg(error);
    if (!options) return emptyMsg("No data");
    return <ChartBox options={options} />;
  };

  return (
    <ReaderLayout title="My Dashboard" activePage="dashboard">
      <Flex
        gap="xl"
        align="stretch"
        style={{ flex: 1, minHeight: 0, overflow: "hidden" }}
      >
        <Box
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            backgroundColor: innerContainerBg,
            borderRadius: 24,
            padding: 20,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxSizing: "border-box",
          }}
        >
          {errors.overview && (
            <Text size="12px" c="#FF6B6B" mb="xs">
              {errors.overview}
            </Text>
          )}

          <SimpleGrid cols={4} spacing="md" mb="md" style={{ flexShrink: 0 }}>
            {statCards.map((card) => (
              <Box
                key={card.title}
                p="sm"
                style={{
                  backgroundColor: accentCardBg,
                  borderRadius: 14,
                }}
              >
                <Flex justify="space-between" align="flex-start">
                  <Box>
                    <Text size="12px" fw={600} c={numberColor}>
                      {card.title}
                    </Text>
                    <Text size="24px" fw={700} c={numberColor}>
                      {loading ? "..." : card.value}
                    </Text>
                  </Box>

                  {card.circleIcon ? (
                    <Box
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        border: `1.5px solid ${numberColor}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {card.icon}
                    </Box>
                  ) : (
                    card.icon
                  )}
                </Flex>

                <Flex justify="flex-end" align="center" mt={6}>
                  <Text
                    size="12px"
                    c={titleColor}
                    style={{
                      textDecoration: "underline",
                      cursor: card.to ? "pointer" : "default",
                    }}
                    onClick={() => card.to && navigate(card.to)}
                  >
                    {card.link}
                  </Text>
                </Flex>
              </Box>
            ))}
          </SimpleGrid>

          <Box
            p="md"
            mb="md"
            style={{
              backgroundColor: chartBoxBg,
              borderRadius: 18,
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <SimpleGrid
              cols={2}
              spacing="xl"
              style={{
                flex: 1,
                minHeight: 0,
                gridTemplateRows: "minmax(0, 1fr)",
              }}
            >
              <Box
                style={{
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 0,
                  minWidth: 0,
                }}
              >
                <Flex
                  justify="space-between"
                  align="center"
                  mb="xs"
                  style={{ minHeight: 30, flexShrink: 0 }}
                >
                  <Text size="16px" fw={600} c="#FFE8B6">
                    Revenue Analytics
                  </Text>

                  <Select
                    data={["6 Months", "12 Months"]}
                    value={period}
                    onChange={(v) => v && setPeriod(v)}
                    allowDeselect={false}
                    w={120}
                    size="xs"
                    styles={{
                      input: {
                        backgroundColor: "transparent",
                        border: "1px solid rgba(255,255,255,0.25)",
                        borderRadius: 20,
                        color: "#FFFFFF",
                        fontSize: "11px",
                      },
                    }}
                  />
                </Flex>

                {chartBody(revenueOptions, errors.revenue)}
              </Box>

              <Box
                style={{
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 0,
                  minWidth: 0,
                }}
              >
                <Flex
                  align="center"
                  mb="xs"
                  style={{ minHeight: 30, flexShrink: 0 }}
                >
                  <Text size="16px" fw={600} c="#FFE8B6">
                    User Growth
                  </Text>
                </Flex>

                {chartBody(growthOptions, errors.growth)}
              </Box>
            </SimpleGrid>
          </Box>

          <Box style={{ flexShrink: 0 }}>
            <Flex justify="space-between" align="center" mb="xs">
              <Text size="16px" fw={600} c="#FFE8B6">
                Recent Requests
              </Text>
              <Text
                size="12px"
                c="#FFE8B6"
                style={{ textDecoration: "underline", cursor: "pointer" }}
                onClick={() => navigate(ROUTES.requests)}
              >
                View All
              </Text>
            </Flex>

            <Table
              verticalSpacing={6}
              horizontalSpacing="sm"
              withRowBorders
              styles={{
                table: { color: "#FFFFFF" },
                th: {
                  color: "#FFE8B6",
                  fontSize: "12px",
                  fontWeight: 500,
                  borderBottom: "1px solid rgba(255,255,255,0.15)",
                },
                td: {
                  fontSize: "12px",
                  borderBottom: "1px solid rgba(255,255,255,0.12)",
                },
              }}
            >
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>ID</Table.Th>
                  <Table.Th>Reader</Table.Th>
                  <Table.Th>Author</Table.Th>
                  <Table.Th>Book Name</Table.Th>
                  <Table.Th>Book Status</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>

              <Table.Tbody>
                {requests.map((req) => {
                  const st = statusStyle(req.status);

                  return (
                    <Table.Tr key={req.id}>
                      <Table.Td>{req.shortId}</Table.Td>

                      <Table.Td>
                        <Group gap={8} wrap="nowrap">
                          <Avatar
                            src={req.readerAvatar}
                            size={22}
                            radius="xl"
                          />
                          <Text size="12px">{req.reader}</Text>
                        </Group>
                      </Table.Td>

                      <Table.Td>
                        <Group gap={8} wrap="nowrap">
                          <Avatar
                            src={req.authorAvatar}
                            size={22}
                            radius="xl"
                          />
                          <Text size="12px">{req.author}</Text>
                        </Group>
                      </Table.Td>

                      <Table.Td fw={500}>{req.book}</Table.Td>

                      <Table.Td>
                        <Box
                          px={10}
                          py={3}
                          style={{
                            display: "inline-block",
                            backgroundColor: st.bg,
                            color: st.color,
                            border: st.border,
                            borderRadius: 20,
                            fontSize: "11px",
                          }}
                        >
                          {req.status}
                        </Box>
                      </Table.Td>

                      <Table.Td>
                        <ActionIcon
                          variant="transparent"
                          color="#FFE8B6"
                          onClick={() => navigate(ROUTES.requestDetail(req.id))}
                        >
                          <FaEye size={14} />
                        </ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>

            {!loading && requests.length === 0 && (
              <Text ta="center" c="#B8B4B0" size="xs" py="sm">
                {errors.requests ?? "No requests found."}
              </Text>
            )}
          </Box>
        </Box>

        <Box
          w={230}
          style={{
            flexShrink: 0,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Text size="20px" fw={600} c="#FFE8B6" mb="sm">
            Users
          </Text>

          <Stack
            gap="md"
            style={{
              flex: 1,
              overflowY: "auto",
              scrollbarWidth: "none",
            }}
          >
            {users.map((user) => (
              <Group key={user.id} gap="sm" wrap="nowrap">
                <Avatar src={user.avatar} size={40} radius="xl" />
                <Box>
                  <Text
                    size="13px"
                    fw={500}
                    c="#FFE8B6"
                    style={{ lineHeight: 1.2 }}
                  >
                    {user.name}
                  </Text>
                  <Text size="11px" c="#8C8C8C" style={{ lineHeight: 1.2 }}>
                    {user.role}
                  </Text>
                </Box>
              </Group>
            ))}

            {!loading && users.length === 0 && (
              <Text size="12px" c="#B8B4B0">
                {errors.users ?? "No users found."}
              </Text>
            )}
          </Stack>
        </Box>
      </Flex>
    </ReaderLayout>
  );
}
