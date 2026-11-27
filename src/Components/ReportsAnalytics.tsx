import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Flex,
  Text,
  Group,
  SimpleGrid,
  Avatar,
  Select,
  Table,
  Loader,
} from "@mantine/core";

import Highcharts from "highcharts";
import HighchartsReactWrapper from "highcharts-react-official";

import { FiBook, FiUsers, FiUserCheck } from "react-icons/fi";
import { BiDollarCircle } from "react-icons/bi";
import { useAvatarSrc } from "./useAvatarSrc";

import ReaderLayout from "./ReaderLayout";
import {
  getDashboardOverview,
  getDashboardUserGrowth,
  getDashboardRevenueAnalytics,
  getMonthlyAutographRequests,
  getTopAuthors,
} from "../api";

const HighchartsReact =
  (HighchartsReactWrapper as any)?.default || HighchartsReactWrapper;

const cream = "#FFE8B6";
const brown = "#98491F";
const dark = "#211E1E";
const panelBg = "#2B2828";
const muted = "#A0A0A0";
const numberColor = "#2A1005";

// Paise ka nishan: Dashboard page ke saath match karne ke liye dollar.
// Badalna ho to sirf yahan badlein (jaise "PKR" aur "Rupees").
const CURRENCY = "$";
const CURRENCY_NAME = "Dollars";

/* ---------------- helpers ---------------- */

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

// "2026-11" -> "Nov"
const monthShort = (m: string): string =>
  MONTHS[Number(String(m).slice(5, 7)) - 1] ?? String(m);

// "2026-11" -> "Nov 2026"
const monthFull = (m: string): string =>
  `${monthShort(m)} ${String(m).slice(0, 4)}`;

// 1500 -> "1.5k", 80 -> "80"
const axisNum = (v: number): string =>
  v >= 1000 ? `${Number((v / 1000).toFixed(1))}k` : String(v);

// "Iqra Baig" -> "IB"
const initialsOf = (name: string): string =>
  String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

function UserAvatar({
  url,
  name,
  size = 30,
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

type LoadState<T> = { loading: boolean; error: string; data: T | null };

// Ek API call: loading / error / data teeno sambhalta hai. deps badle to dobara call.
function useLoad<T>(fn: () => Promise<T>, deps: unknown[]): LoadState<T> {
  const [state, setState] = useState<LoadState<T>>({
    loading: true,
    error: "",
    data: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: "" }));

    fn()
      .then((data) => {
        if (!cancelled) setState({ loading: false, error: "", data });
      })
      .catch((err) => {
        if (!cancelled)
          setState({
            loading: false,
            error: err instanceof Error ? err.message : "Something went wrong",
            data: null,
          });
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}

// Response ma se list nikalna ({ data: [...] } ya seedha array)
const pickList = (res: any): any[] =>
  Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];

// Tooltip ke andar hover hue point ka index (typing se bachne ke liye any use kiya hai)
const idxOf = (ctx: any): number =>
  ctx?.points?.[0]?.point?.index ??
  ctx?.points?.[0]?.index ??
  ctx?.point?.index ??
  0;

/* ---------------- chart box ---------------- */

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
    <div ref={wrapRef} style={{ position: "relative", flex: 1, minHeight: 90 }}>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        {height > 0 && (
          <HighchartsReact highcharts={Highcharts} options={merged} />
        )}
      </div>
    </div>
  );
}

// Chart ki jagah: loading / error / khali data / asli chart
function ChartPanel({
  loading,
  error,
  empty,
  options,
}: {
  loading: boolean;
  error: string;
  empty: boolean;
  options: Highcharts.Options;
}) {
  if (loading) {
    return (
      <Flex justify="center" align="center" style={{ flex: 1, minHeight: 90 }}>
        <Loader color={cream} size="sm" />
      </Flex>
    );
  }
  if (error) {
    return (
      <Flex justify="center" align="center" style={{ flex: 1, minHeight: 90 }}>
        <Text c="red.4" size="13px" ta="center">
          {error}
        </Text>
      </Flex>
    );
  }
  if (empty) {
    return (
      <Flex justify="center" align="center" style={{ flex: 1, minHeight: 90 }}>
        <Text c={muted} size="13px">
          No data available.
        </Text>
      </Flex>
    );
  }
  return <ChartBox options={options} />;
}

/* ---------------- chart options (asli data se bante hain) ---------------- */

const xAxisFor = (categories: string[]): Highcharts.XAxisOptions => ({
  categories,
  labels: { style: { color: muted, fontSize: "11px" } },
  lineColor: "rgba(255,255,255,0.1)",
  lineWidth: 1,
  tickColor: "transparent",
});

const yAxisLabels: Highcharts.YAxisLabelsOptions = {
  formatter: function () {
    return axisNum(Number(this.value));
  },
  style: { color: muted, fontSize: "10px" },
};

function makeRevenueOptions(rows: any[]): Highcharts.Options {
  const cats = rows.map((r) => monthShort(r.month));
  const full = rows.map((r) => monthFull(r.month));

  return {
    chart: {
      type: "spline",
      backgroundColor: "transparent",
      spacing: [10, 5, 10, 5],
    },
    title: { text: undefined },
    accessibility: { enabled: false },
    xAxis: xAxisFor(cats),
    yAxis: {
      min: 0,
      allowDecimals: false,
      title: {
        text: `Revenue (${CURRENCY_NAME})`,
        style: { color: muted, fontSize: "10px" },
      },
      labels: yAxisLabels,
      gridLineColor: "rgba(255, 255, 255, 0.08)",
    },
    legend: {
      align: "center",
      verticalAlign: "bottom",
      symbolWidth: 8,
      symbolHeight: 8,
      symbolRadius: 4,
      itemStyle: { color: cream, fontSize: "11px", fontWeight: "400" },
    },
    credits: { enabled: false },
    tooltip: {
      shared: true,
      backgroundColor: cream,
      borderRadius: 6,
      borderWidth: 0,
      style: { color: numberColor, fontSize: "10px", fontWeight: "600" },
      formatter: function () {
        const idx = idxOf(this);
        let html = `<b>${full[idx] ?? ""}</b>`;
        this.points?.forEach((point) => {
          html += `<br/><span style="color:${point.color}">●</span> ${
            point.series.name
          }: ${CURRENCY}${Number(point.y).toLocaleString()}`;
        });
        return html;
      },
    },
    plotOptions: {
      spline: { lineWidth: 3, marker: { enabled: false } },
      series: { animation: false },
    },
    series: [
      {
        type: "spline",
        name: "Reader",
        data: rows.map((r) => Number(r.readerRevenue) || 0),
        color: brown,
      },
      {
        type: "spline",
        name: "Author",
        data: rows.map((r) => Number(r.authorRevenue) || 0),
        color: cream,
      },
    ],
  };
}

function makeGrowthOptions(rows: any[]): Highcharts.Options {
  const cats = rows.map((r) => monthShort(r.month));
  const full = rows.map((r) => monthFull(r.month));
  const readers = rows.map((r) => Number(r.readers) || 0);
  const authors = rows.map((r) => Number(r.authors) || 0);

  // Dono ke beech design wali chhoti khali jagah (sirf jab dono ka data ho)
  const maxTotal = Math.max(0, ...readers.map((v, i) => v + authors[i]));
  const gapVal = maxTotal > 0 ? Math.max(1, Math.round(maxTotal * 0.06)) : 0;
  const gaps = readers.map((v, i) => (v > 0 && authors[i] > 0 ? gapVal : 0));

  return {
    chart: {
      type: "column",
      backgroundColor: "transparent",
      spacing: [10, 5, 10, 5],
    },
    title: { text: undefined },
    accessibility: { enabled: false },
    xAxis: xAxisFor(cats),
    yAxis: {
      min: 0,
      allowDecimals: false,
      title: { text: undefined },
      labels: yAxisLabels,
      gridLineColor: "rgba(255, 255, 255, 0.08)",
    },
    legend: { enabled: false },
    credits: { enabled: false },
    tooltip: {
      shared: true,
      backgroundColor: cream,
      borderRadius: 6,
      borderWidth: 0,
      style: { color: numberColor, fontSize: "10px", fontWeight: "600" },
      formatter: function () {
        const idx = idxOf(this);
        let html = `<b>${full[idx] ?? ""}</b>`;
        this.points?.forEach((point) => {
          html += `<br/><span style="color:${point.color}">●</span> ${
            point.series.name
          }: ${Number(point.y).toLocaleString()}`;
        });
        return html;
      },
    },
    plotOptions: {
      column: {
        stacking: "normal",
        borderWidth: 0,
        borderRadius: 6,
        pointWidth: 9,
        groupPadding: 0.38,
        pointPadding: 0,
      },
      series: { animation: false },
    },
    series: [
      { type: "column", name: "Reader", data: readers, color: brown },
      {
        type: "column",
        name: "Gap",
        data: gaps,
        color: "transparent",
        showInLegend: false,
        enableMouseTracking: false,
      },
      { type: "column", name: "Author", data: authors, color: cream },
    ],
  };
}

function makeRequestsOptions(rows: any[]): Highcharts.Options {
  const cats = rows.map((r) => monthShort(r.month));
  const full = rows.map((r) => monthFull(r.month));

  return {
    chart: {
      type: "column",
      backgroundColor: "transparent",
      spacing: [10, 5, 10, 5],
    },
    title: { text: undefined },
    accessibility: { enabled: false },
    xAxis: xAxisFor(cats),
    yAxis: {
      min: 0,
      allowDecimals: false,
      title: { text: "Requests", style: { color: muted, fontSize: "10px" } },
      labels: yAxisLabels,
      gridLineColor: "rgba(255, 255, 255, 0.08)",
    },
    legend: { enabled: false },
    credits: { enabled: false },
    tooltip: {
      backgroundColor: cream,
      borderRadius: 6,
      borderWidth: 0,
      style: { color: numberColor, fontSize: "10px", fontWeight: "600" },
      formatter: function () {
        const idx = idxOf(this);
        return `<b>${full[idx] ?? ""}</b><br/>Requests: ${Number(
          this.y,
        ).toLocaleString()}`;
      },
    },
    plotOptions: {
      column: {
        borderWidth: 0,
        borderRadius: 4,
        pointWidth: 9,
        groupPadding: 0.2,
        pointPadding: 0.1,
      },
      series: { animation: false },
    },
    series: [
      {
        type: "column",
        name: "Requests",
        color: brown,
        data: rows.map((r) => Number(r.requests) || 0),
      },
    ],
  };
}

/* ---------------- shared styles ---------------- */

const thStyle = {
  color: cream,
  fontSize: "13px",
  fontWeight: 700,
  paddingTop: 6,
  paddingBottom: 6,
  borderBottom: "none",
};

const tdStyle = {
  borderBottom: "1px solid rgba(255,255,255,0.12)",
};

const selectStyles = {
  input: {
    height: 26,
    minHeight: 26,
    backgroundColor: "transparent",
    color: "#E0E0E0",
    border: "1px solid rgba(255,255,255,0.3)",
    borderRadius: 14,
    fontSize: 11,
    paddingLeft: 12,
  },
  dropdown: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #E0E0E0",
    borderRadius: 8,
  },
  option: {
    color: "#211E1E",
    fontSize: 11,
  },
};

const MONTH_CHOICES = [
  { value: "6", label: "6 Months" },
  { value: "12", label: "12 Months" },
];

/* ================= PAGE ================= */

export default function ReportsAnalytics() {
  // Dropdowns: Revenue aur Autograph chart ke mahine alag alag
  const [revMonths, setRevMonths] = useState<number>(6);
  const [reqMonths, setReqMonths] = useState<number>(6);

  const overview = useLoad(() => getDashboardOverview(), []);
  const growth = useLoad(() => getDashboardUserGrowth(6), []);
  const topAuthors = useLoad(() => getTopAuthors(), []);
  const revenue = useLoad(
    () => getDashboardRevenueAnalytics(revMonths),
    [revMonths],
  );
  const requests = useLoad(
    () => getMonthlyAutographRequests(reqMonths),
    [reqMonths],
  );

  /* ---- upar ke 4 cards (Dashboard Overview se) ---- */
  const o: any = overview.data;
  const num = (v: unknown) => Number(v ?? 0).toLocaleString();

  const stats = [
    {
      title: "Total Revenue",
      value: o ? `${CURRENCY} ${num(o.totalRevenue)}` : "-",
      Icon: BiDollarCircle,
    },
    {
      title: "Signed Ebooks",
      value: o ? num(o.signedEbooks) : "-",
      Icon: FiBook,
    },
    {
      title: "Total Reader",
      value: o ? num(o.totalReaders) : "-",
      Icon: FiUsers,
    },
    {
      title: "Total Authors",
      value: o ? num(o.totalAuthors) : "-",
      Icon: FiUserCheck,
    },
  ];

  /* ---- charts ---- */
  const revenueRows = pickList(revenue.data);
  const growthRows = pickList(growth.data);
  const requestRows = pickList(requests.data);

  const revenueOptions = useMemo(
    () => makeRevenueOptions(revenueRows),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [revenue.data],
  );
  const growthOptions = useMemo(
    () => makeGrowthOptions(growthRows),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [growth.data],
  );
  const requestOptions = useMemo(
    () => makeRequestsOptions(requestRows),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [requests.data],
  );

  /* ---- Top Artist By Requests (sirf top 3) ---- */
  const artists = pickList(topAuthors.data).slice(0, 3);

  return (
    <ReaderLayout title="Reports & Analytics" activePage="analytics">
      <Box
        style={{
          backgroundColor: dark,
          borderRadius: "20px",
          flex: 1,
          minHeight: 0,
          padding: "18px 20px",
          boxSizing: "border-box",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <SimpleGrid cols={4} spacing="md" style={{ flexShrink: 0 }}>
          {stats.map(({ title, value, Icon }) => (
            <Box
              key={title}
              style={{
                backgroundColor: cream,
                borderRadius: "14px",
                padding: "10px 14px",
              }}
            >
              <Group justify="space-between" align="flex-start">
                <Box>
                  <Text size="12px" c={numberColor} fw={600}>
                    {title}
                  </Text>

                  <Text size="22px" fw={800} c={numberColor} mt={2}>
                    {value}
                  </Text>
                </Box>

                <Icon size={18} color={numberColor} />
              </Group>
            </Box>
          ))}
        </SimpleGrid>

        {overview.error && (
          <Text c="red.4" size="12px" style={{ flexShrink: 0 }}>
            {overview.error}
          </Text>
        )}

        <Box
          style={{
            backgroundColor: panelBg,
            borderRadius: "16px",
            padding: "12px 18px",
            flex: "0.95 1 0",
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
                mb={2}
                style={{ minHeight: 28, flexShrink: 0 }}
              >
                <Text size="16px" fw={600} c={cream}>
                  Revenue Analytics
                </Text>

                <Select
                  size="xs"
                  value={String(revMonths)}
                  onChange={(v) => v && setRevMonths(Number(v))}
                  data={MONTH_CHOICES}
                  allowDeselect={false}
                  w={105}
                  styles={selectStyles}
                />
              </Flex>

              <ChartPanel
                loading={revenue.loading}
                error={revenue.error}
                empty={revenueRows.length === 0}
                options={revenueOptions}
              />
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
                mb={2}
                style={{ minHeight: 28, flexShrink: 0 }}
              >
                <Text size="16px" fw={600} c={cream}>
                  User Growth
                </Text>
              </Flex>

              <ChartPanel
                loading={growth.loading}
                error={growth.error}
                empty={growthRows.length === 0}
                options={growthOptions}
              />
            </Box>
          </SimpleGrid>
        </Box>

        <SimpleGrid
          cols={2}
          spacing="xl"
          style={{
            flex: "1 1 0",
            minHeight: 0,
            gridTemplateRows: "minmax(0, 1fr)",
          }}
        >
          <Box
            style={{
              minWidth: 0,
              minHeight: 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Text
              size="20px"
              fw={700}
              c={cream}
              mb={2}
              style={{ flexShrink: 0 }}
            >
              Top Artist By Requests
            </Text>

            {topAuthors.loading ? (
              <Flex justify="center" pt="md">
                <Loader color={cream} size="sm" />
              </Flex>
            ) : topAuthors.error ? (
              <Text c="red.4" size="13px">
                {topAuthors.error}
              </Text>
            ) : artists.length === 0 ? (
              <Text c={muted} size="13px">
                No data available.
              </Text>
            ) : (
              <Table
                horizontalSpacing={0}
                verticalSpacing={0}
                style={{ tableLayout: "fixed", width: "100%" }}
              >
                <Table.Thead>
                  <Table.Tr style={{ borderBottom: "none" }}>
                    <Table.Th style={{ ...thStyle, width: "20%" }}>
                      Index
                    </Table.Th>
                    <Table.Th style={{ ...thStyle, width: "42%" }}>
                      Profile
                    </Table.Th>
                    <Table.Th style={{ ...thStyle, width: "38%" }}>
                      Sign Requests
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>

                <Table.Tbody>
                  {artists.map((artist: any, i: number) => (
                    <Table.Tr
                      key={artist.index ?? i}
                      style={{ borderBottom: "none" }}
                    >
                      <Table.Td
                        py={6}
                        fw={700}
                        c="#FFE8B6"
                        style={{ ...tdStyle, fontSize: "13px" }}
                      >
                        #{artist.index ?? i + 1}
                      </Table.Td>

                      <Table.Td py={6} style={tdStyle}>
                        <Group gap={8} wrap="nowrap">
                          <UserAvatar
                            url={artist.avatarUrl || artist.avatar}
                            name={artist.authorName}
                            size={28}
                          />

                          <Text
                            size="12px"
                            fw={500}
                            c="#FFFFFF"
                            truncate
                            style={{ lineHeight: 1.2 }}
                          >
                            {artist.authorName}
                          </Text>
                        </Group>
                      </Table.Td>

                      <Table.Td
                        py={6}
                        fw={500}
                        c="#E0E0E0"
                        style={{ ...tdStyle, fontSize: "12px" }}
                      >
                        {Number(artist.totalRequests ?? 0).toLocaleString()}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Box>

          <Box
            style={{
              minWidth: 0,
              minHeight: 0,
              backgroundColor: panelBg,
              borderRadius: "16px",
              padding: "12px 18px",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Flex
              justify="space-between"
              align="center"
              mb={2}
              style={{ minHeight: 28, flexShrink: 0 }}
            >
              <Text size="14px" fw={600} c={cream}>
                Autograph Requests
              </Text>

              <Select
                size="xs"
                value={String(reqMonths)}
                onChange={(v) => v && setReqMonths(Number(v))}
                data={MONTH_CHOICES}
                allowDeselect={false}
                w={105}
                styles={selectStyles}
              />
            </Flex>

            <ChartPanel
              loading={requests.loading}
              error={requests.error}
              empty={requestRows.length === 0}
              options={requestOptions}
            />
          </Box>
        </SimpleGrid>
      </Box>
    </ReaderLayout>
  );
}
