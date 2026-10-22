import { useEffect, useMemo, useRef, useState } from "react";
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
import { FiTrendingUp, FiTrendingDown } from "react-icons/fi";

import Highcharts from "highcharts";
import HighchartsReactWrapper from "highcharts-react-official";

const HighchartsReact =
  (HighchartsReactWrapper as any)?.default || HighchartsReactWrapper;

import ReaderLayout from "./ReaderLayout";

import profileImg from "../assets/image.jpg";
import readerImg from "../assets/Reader-image.png";
import authorImg from "../assets/Author-image.png";
import janeImg from "../assets/jane-image.png";
import nikita from "../assets/Image-1.png";
import justin from "../assets/Image-6.jpg";
import john from "../assets/Image-5.jpg";
import phil from "../assets/Image-3.jpg";
import cassius from "../assets/Image-4.jpg";
import elowen from "../assets/Image-2.jpg";

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

export default function Dashboard() {
  const innerContainerBg = "#211E1E";
  const chartBoxBg = "#262323";
  const accentCardBg = "#FFE8B6";

  const titleColor = "#6A4335";
  const numberColor = "#2A1005";

  const greenText = "#1A7F48";
  const greenBg = "rgba(26, 127, 72, 0.18)";
  const redText = "#C62828";
  const redBg = "rgba(198, 40, 40, 0.18)";

  const usersList = [
    { name: "John ibrahim", role: "Author", image: profileImg },
    { name: "Anita Job", role: "Reader", image: readerImg },
    { name: "Jane Doe", role: "Reader", image: janeImg },
    { name: "Paige Turner", role: "Author", image: janeImg },
    { name: "Nikita Vance", role: "Author", image: nikita },
    { name: "Justin Case", role: "Reader", image: justin },
    { name: "John ibrahim", role: "Author", image: john },
    { name: "Phil McCracken", role: "Reader", image: phil },
    { name: "Zane Kaelen", role: "Author", image: profileImg },
    { name: "Lyra Vane", role: "Reader", image: readerImg },
    { name: "Cassius Thorne", role: "Reader", image: cassius },
    { name: "Elowen Starling", role: "Author", image: elowen },
  ];

  const statCards = [
    {
      title: "Total Revenue",
      value: "$25.1k",
      icon: <FaDollarSign size={12} color={numberColor} />,
      circleIcon: true,
      trend: "+15%",
      up: true,
      link: "This Month",
    },
    {
      title: "Total Authors",
      value: "243",
      icon: <FaUser size={16} color={numberColor} />,
      trend: "-3.5%",
      up: false,
      link: "View More",
    },
    {
      title: "Total Readers",
      value: "3,455",
      icon: <FaBook size={16} color={numberColor} />,
      trend: "+15%",
      up: true,
      link: "View More",
    },
    {
      title: "New Requests",
      value: "430",
      icon: <FaRegAddressCard size={16} color={numberColor} />,
      trend: "+15%",
      up: true,
      link: "View More",
    },
  ];

  const revenueOptions: Highcharts.Options = {
    chart: {
      type: "spline",
      backgroundColor: "transparent",
      spacing: [10, 5, 10, 5],
    },
    title: { text: undefined },
    xAxis: {
      min: 0,
      max: 10,
      tickPositions: [0, 2, 4, 6, 8, 10],
      labels: {
        formatter: function () {
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
          const index = Number(this.value) / 2;
          return months[index] || "";
        },
        style: { color: "#A0A0A0", fontSize: "11px" },
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
        style: { color: "#A0A0A0", fontSize: "10px" },
      },
      labels: {
        formatter: function () {
          if (this.value === 0) return "0";
          return `${Number(this.value) / 1000}k`;
        },
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
      style: { color: numberColor, fontSize: "10px", fontWeight: "600" },
      formatter: function () {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
        const pointX = this.points?.[0]?.x ?? 0;
        const monthIndex = Math.round(Number(pointX) / 2);
        const month = months[monthIndex] || "";

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
          [0, 42000],
          [1, 39000],
          [2, 30000],
          [3, 22000],
          [4, 23000],
          [5, 27000],
          [6, 41000],
          [7, 44000],
          [8, 52000],
          [9, 72000],
          [10, 69000],
        ],
        color: "#C86228",
      },
      {
        type: "spline",
        name: "Author",
        data: [
          [0, 15000],
          [1, 30000],
          [2, 47000],
          [3, 50000],
          [4, 42000],
          [5, 45000],
          [6, 43000],
          [7, 38000],
          [8, 30000],
          [9, 63000],
          [10, 55000],
        ],
        color: "#FFE8B6",
      },
    ],
  };

  const userGrowthOptions: Highcharts.Options = {
    chart: {
      type: "column",
      backgroundColor: "transparent",
      spacing: [10, 5, 10, 5],
    },
    title: { text: undefined },
    xAxis: {
      categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      labels: { style: { color: "#A0A0A0", fontSize: "11px" } },
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
        style: { color: "#A0A0A0", fontSize: "10px" },
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
        pointWidth: 7,
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
        color: "#C86228",
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
        color: "#FFE8B6",
      },
    ],
  };

  const recentRequests = [
    {
      id: "742942",
      reader: "Cassius Thorne",
      author: "Cassius Thorne",
      book: "Things Fall Apart",
      status: "In progress",
      bg: "rgba(255, 232, 182, 0.12)",
      color: "#FFE8B6",
      border: "1px solid rgba(255, 232, 182, 0.4)",
    },
    {
      id: "742942",
      reader: "Cassius Thorne",
      author: "Cassius Thorne",
      book: "Things Fall Apart",
      status: "In progress",
      bg: "rgba(255, 232, 182, 0.12)",
      color: "#FFE8B6",
      border: "1px solid rgba(255, 232, 182, 0.4)",
    },
    {
      id: "742942",
      reader: "Cassius Thorne",
      author: "Cassius Thorne",
      book: "Things Fall Apart",
      status: "Delivered",
      bg: "rgba(46, 125, 50, 0.18)",
      color: "#4CAF50",
      border: "1px solid rgba(76, 175, 80, 0.5)",
    },
    {
      id: "742942",
      reader: "Cassius Thorne",
      author: "Cassius Thorne",
      book: "Things Fall Apart",
      status: "Rejected",
      bg: "rgba(198, 40, 40, 0.18)",
      color: "#EF5350",
      border: "1px solid rgba(239, 83, 80, 0.5)",
    },
  ];

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
                      {card.value}
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

                <Flex justify="space-between" align="center" mt={6}>
                  <Group gap={6} wrap="nowrap">
                    <Box
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        backgroundColor: card.up ? greenBg : redBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {card.up ? (
                        <FiTrendingUp size={12} color={greenText} />
                      ) : (
                        <FiTrendingDown size={12} color={redText} />
                      )}
                    </Box>
                    <Text
                      size="12px"
                      fw={600}
                      c={card.up ? greenText : redText}
                    >
                      {card.trend}
                    </Text>
                  </Group>

                  <Text
                    size="12px"
                    c={titleColor}
                    style={{ textDecoration: "underline", cursor: "pointer" }}
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
                    defaultValue="6 Months"
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
                  mb="xs"
                  style={{ minHeight: 30, flexShrink: 0 }}
                >
                  <Text size="16px" fw={600} c="#FFE8B6">
                    User Growth
                  </Text>
                </Flex>

                <ChartBox options={userGrowthOptions} />
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
                {recentRequests.map((req, idx) => (
                  <Table.Tr key={idx}>
                    <Table.Td>{req.id}</Table.Td>

                    <Table.Td>
                      <Group gap={8} wrap="nowrap">
                        <Avatar src={readerImg} size={22} radius="xl" />
                        <Text size="12px">{req.reader}</Text>
                      </Group>
                    </Table.Td>

                    <Table.Td>
                      <Group gap={8} wrap="nowrap">
                        <Avatar src={authorImg} size={22} radius="xl" />
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
                          backgroundColor: req.bg,
                          color: req.color,
                          border: req.border,
                          borderRadius: 20,
                          fontSize: "11px",
                        }}
                      >
                        {req.status}
                      </Box>
                    </Table.Td>

                    <Table.Td>
                      <ActionIcon variant="transparent" color="#FFE8B6">
                        <FaEye size={14} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
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
            {usersList.map((user, idx) => (
              <Group key={idx} gap="sm" wrap="nowrap">
                <Avatar src={user.image} size={40} radius="xl" />
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
          </Stack>
        </Box>
      </Flex>
    </ReaderLayout>
  );
}
