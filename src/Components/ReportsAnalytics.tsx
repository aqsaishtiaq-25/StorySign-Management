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
} from "@mantine/core";

import Highcharts from "highcharts";
import HighchartsReactWrapper from "highcharts-react-official";

const HighchartsReact =
  (HighchartsReactWrapper as any)?.default || HighchartsReactWrapper;

import {
  FiTrendingUp,
  FiTrendingDown,
  FiBook,
  FiUsers,
  FiUserCheck,
} from "react-icons/fi";
import { BiDollarCircle } from "react-icons/bi";

import ReaderLayout from "./ReaderLayout";
import authorimg from "../assets/Reader-image.png";

const cream = "#FFE8B6";
const brown = "#98491F";
const dark = "#211E1E";
const panelBg = "#2B2828";
const muted = "#A0A0A0";
const numberColor = "#2A1005";

const greenText = "#1A7F48";
const greenBg = "rgba(26, 127, 72, 0.18)";
const redText = "#C62828";
const redBg = "rgba(198, 40, 40, 0.18)";

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

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

const revenueOptions: Highcharts.Options = {
  chart: {
    type: "spline",
    backgroundColor: "transparent",
    spacing: [10, 5, 10, 5],
  },
  title: { text: undefined },
  accessibility: { enabled: false },
  xAxis: {
    min: 0,
    max: 10,
    tickPositions: [0, 2, 4, 6, 8, 10],
    labels: {
      formatter: function () {
        const index = Number(this.value) / 2;
        return monthNames[index] || "";
      },
      style: { color: muted, fontSize: "11px" },
    },
    lineColor: "rgba(255,255,255,0.1)",
    lineWidth: 1,
    tickColor: "transparent",
  },
  yAxis: {
    min: 0,
    max: 100000,
    tickInterval: 20000,
    title: {
      text: "Revenue (Dollars)",
      style: { color: muted, fontSize: "10px" },
    },
    labels: {
      formatter: function () {
        if (this.value === 0) return "0";
        return `${Number(this.value) / 1000}k`;
      },
      style: { color: muted, fontSize: "10px" },
    },
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
      const pointX = this.points?.[0]?.x ?? 0;
      const monthIndex = Math.round(Number(pointX) / 2);
      const month = monthNames[monthIndex] || "";

      let html = `<b>${month}</b>`;
      this.points?.forEach((point) => {
        html += `<br/><span style="color:${point.color}">●</span> ${
          point.series.name
        }: $${Number(point.y).toLocaleString()}`;
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
      data: [
        [0, 60000],
        [1, 55000],
        [2, 45000],
        [3, 30000],
        [4, 25000],
        [5, 32000],
        [6, 52000],
        [7, 70000],
        [8, 62000],
        [9, 50000],
        [10, 55000],
      ],
      color: brown,
    },
    {
      type: "spline",
      name: "Author",
      data: [
        [0, 15000],
        [1, 25000],
        [2, 38000],
        [3, 44000],
        [4, 45000],
        [5, 42000],
        [6, 40000],
        [7, 37000],
        [8, 36000],
        [9, 38000],
        [10, 37000],
      ],
      color: cream,
    },
  ],
};

const growthOptions: Highcharts.Options = {
  chart: {
    type: "column",
    backgroundColor: "transparent",
    spacing: [10, 5, 10, 5],
  },
  title: { text: undefined },
  accessibility: { enabled: false },
  xAxis: {
    categories: monthNames,
    labels: { style: { color: muted, fontSize: "11px" } },
    lineColor: "rgba(255,255,255,0.1)",
    lineWidth: 1,
    tickColor: "transparent",
  },
  yAxis: {
    min: 0,
    max: 100000,
    tickInterval: 20000,
    title: { text: undefined },
    labels: {
      formatter: function () {
        if (this.value === 0) return "0";
        return `${Number(this.value) / 1000}k`;
      },
      style: { color: muted, fontSize: "10px" },
    },
    gridLineColor: "rgba(255, 255, 255, 0.08)",
  },
  legend: { enabled: false },
  credits: { enabled: false },
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
    {
      type: "column",
      name: "Reader",
      data: [16000, 12000, 17000, 16000, 14000, 15000],
      color: brown,
    },
    {
      type: "column",
      name: "Gap",
      data: [7000, 8000, 8000, 7000, 7000, 7000],
      color: "transparent",
      showInLegend: false,
      enableMouseTracking: false,
    },
    {
      type: "column",
      name: "Author",
      data: [31000, 50000, 42000, 34000, 26000, 40000],
      color: cream,
    },
  ],
};

const autographOptions: Highcharts.Options = {
  chart: {
    type: "column",
    backgroundColor: "transparent",
    spacing: [10, 5, 10, 5],
  },
  title: { text: undefined },
  accessibility: { enabled: false },
  xAxis: {
    categories: monthNames,
    labels: { style: { color: muted, fontSize: "11px" } },
    lineColor: "rgba(255,255,255,0.1)",
    lineWidth: 1,
    tickColor: "transparent",
  },
  yAxis: {
    min: 0,
    max: 100000,
    tickInterval: 20000,
    title: {
      text: "Requests",
      style: { color: muted, fontSize: "10px" },
    },
    labels: {
      formatter: function () {
        if (this.value === 0) return "0";
        return `${Number(this.value) / 1000}k`;
      },
      style: { color: muted, fontSize: "10px" },
    },
    gridLineColor: "rgba(255, 255, 255, 0.08)",
  },
  legend: { enabled: false },
  credits: { enabled: false },
  tooltip: {
    backgroundColor: cream,
    borderRadius: 6,
    borderWidth: 0,
    style: { color: numberColor, fontSize: "10px", fontWeight: "600" },
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
      data: [65000, 40000, 50000, 40000, 50000, 70000],
    },
  ],
};

const stats = [
  {
    title: "Total Revenue",
    value: "$ 3,248",
    change: "+15%",
    positive: true,
    Icon: BiDollarCircle,
  },
  {
    title: "Signed Ebooks",
    value: "243",
    change: "-3.5%",
    positive: false,
    Icon: FiBook,
  },
  {
    title: "Total Reader",
    value: "3,455",
    change: "+15%",
    positive: true,
    Icon: FiUsers,
  },
  {
    title: "Total Authors",
    value: "30",
    change: "+5%",
    positive: true,
    Icon: FiUserCheck,
  },
];

const artists = [
  { id: "#1", name: "Cordell Edwards", requests: 235 },
  { id: "#2", name: "Cordell Edwards", requests: 235 },
  { id: "#3", name: "Cordell Edwards", requests: 235 },
];

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
    backgroundColor: "#383838",
    border: "1px solid #45413B",
  },
  option: {
    color: "#FFFFFF",
    fontSize: 11,
  },
};

export default function ReportsAnalytics() {
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
          {stats.map(({ title, value, change, positive, Icon }) => (
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

              <Group gap={6} align="center" mt={6}>
                <Box
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    backgroundColor: positive ? greenBg : redBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {positive ? (
                    <FiTrendingUp size={11} color={greenText} />
                  ) : (
                    <FiTrendingDown size={11} color={redText} />
                  )}
                </Box>

                <Text size="11px" fw={700} c={positive ? greenText : redText}>
                  {change}
                </Text>
              </Group>
            </Box>
          ))}
        </SimpleGrid>

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
                  defaultValue="6 Months"
                  data={["6 Months", "12 Months"]}
                  allowDeselect={false}
                  w={105}
                  styles={selectStyles}
                />
              </Flex>

              <ChartBox options={revenueOptions} />
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

              <ChartBox options={growthOptions} />
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
                {artists.map((artist) => (
                  <Table.Tr key={artist.id} style={{ borderBottom: "none" }}>
                    <Table.Td
                      py={6}
                      fw={700}
                      c="#FFE8B6"
                      style={{ ...tdStyle, fontSize: "13px" }}
                    >
                      {artist.id}
                    </Table.Td>

                    <Table.Td py={6} style={tdStyle}>
                      <Group gap={8} wrap="nowrap">
                        <Avatar src={authorimg} size={28} radius="xl" />

                        <Box style={{ minWidth: 0 }}>
                          <Text
                            size="12px"
                            fw={500}
                            c="#FFFFFF"
                            style={{ lineHeight: 1.2 }}
                          >
                            {artist.name}
                          </Text>

                          <Text
                            size="10px"
                            c="#C9C9C9"
                            style={{ lineHeight: 1.2 }}
                          >
                            Edwards@gmail.com
                          </Text>
                        </Box>
                      </Group>
                    </Table.Td>

                    <Table.Td
                      py={6}
                      fw={500}
                      c="#E0E0E0"
                      style={{ ...tdStyle, fontSize: "12px" }}
                    >
                      {artist.requests}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
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
                defaultValue="6 Months"
                data={["6 Months", "12 Months"]}
                allowDeselect={false}
                w={105}
                styles={selectStyles}
              />
            </Flex>

            <ChartBox options={autographOptions} />
          </Box>
        </SimpleGrid>
      </Box>
    </ReaderLayout>
  );
}
