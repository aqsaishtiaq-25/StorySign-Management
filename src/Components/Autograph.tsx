import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  Box,
  Button,
  Flex,
  Modal,
  Stack,
  Table,
  Text,
  TextInput,
  UnstyledButton,
} from "@mantine/core";
import { FaSearch, FaFilter, FaEdit } from "react-icons/fa";
import { MdOutlineVerified } from "react-icons/md";

import ReaderLayout from "./ReaderLayout";
import Pagination from "./Pagination"; // path apne folder ke hisaab se theek kar lein

/**
 * SIZING
 * One "u" = 1 Figma pixel, scaled so the frame fits the screen height.
 * Sidebar, header, logo, search and profile come from ReaderLayout.
 */
const u = (n: number): string => `calc(var(--u) * ${n})`;
const uMin = (n: number, min: number): string =>
  `max(${min}px, calc(var(--u) * ${n}))`;

const rootVars = { "--u": "calc(100dvh / 1024)" } as CSSProperties;

/** ek page par kitni rows dikhani hain */
const PAGE_SIZE = 4;

/** Icon wrapper: size comes from the Box, icon fills it (avoids the style typing error) */
const Ico = ({
  icon: Icon,
  n,
  min,
  color,
}: {
  icon: any;
  n: number;
  min: number;
  color?: string;
}) => (
  <Box
    style={{
      width: uMin(n, min),
      height: uMin(n, min),
      display: "flex",
      flexShrink: 0,
      color,
    }}
  >
    <Icon size="100%" />
  </Box>
);

const C = {
  bg: "#303030",
  panel: "#211F1F",
  cream: "#FFE8B6",
  brown: "#8C451F",
  active: "#91451F",
  border: "#45413D",
  white: "#F7E5D7",
  muted: "#C9C3B6",
};

type HistoryRow = {
  id: number;
  fee: string;
  updatedBy: string;
  date: string;
};

// 10 rows => PAGE_SIZE 4 par 3 pages banenge (4, 4, 2)
const initialHistory: HistoryRow[] = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  fee: "$9/m",
  updatedBy: "Fee has been updated by Admin (Lisa)",
  date: "23 Jul, 2026",
}));

export default function Autograph() {
  // "list" = screen 1, "edit" = screen 2, success popup = screen 3
  const [view, setView] = useState<"list" | "edit">("list");
  const [successOpen, setSuccessOpen] = useState<boolean>(false);

  const [currentFee, setCurrentFee] = useState<string>("$10");
  const [history, setHistory] = useState<HistoryRow[]>(initialHistory);

  const [tableSearch, setTableSearch] = useState<string>("");
  const [activePage, setActivePage] = useState<number>(1);
  const [fee, setFee] = useState<string>("");

  const filteredHistory = useMemo(() => {
    const query = tableSearch.trim().toLowerCase();

    return history.filter(
      (row) =>
        !query ||
        `${row.fee} ${row.updatedBy} ${row.date}`.toLowerCase().includes(query),
    );
  }, [tableSearch, history]);

  // ---------- Pagination ----------
  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / PAGE_SIZE));
  const currentPage = Math.min(activePage, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visibleHistory = filteredHistory.slice(start, start + PAGE_SIZE);
  // --------------------------------

  const cleanFee = fee.replace("$", "").trim();
  const canSubmit = cleanFee !== "" && !Number.isNaN(Number(cleanFee));

  const openEdit = () => {
    setFee("");
    setView("edit");
  };

  const handleUpdate = () => {
    if (!canSubmit) return;
    // TODO: call your API here with the new fee
    setSuccessOpen(true);
  };

  const handleOkay = () => {
    // apply the new fee, add a history row, go back to screen 1
    setCurrentFee(`$${cleanFee}`);
    setHistory((prev) => [
      {
        id: Date.now(),
        fee: `$${cleanFee}/m`,
        updatedBy: "Fee has been updated by Admin (John)",
        date: new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
      },
      ...prev,
    ]);
    setActivePage(1); // nayi row sab se upar aati hai, isliye page 1 par wapas
    setSuccessOpen(false);
    setView("list");
  };

  return (
    <ReaderLayout
      title={view === "list" ? "Autograph Fee Management" : "Autograph Fee"}
      activePage="autograph"
    >
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap");
        :root { --u: calc(100dvh / 1024); }
        .hide-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .action:hover { opacity: .85; }
      `}</style>

      <Box
        style={{
          ...rootVars,
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          fontFamily: '"Nunito", Arial, sans-serif',
        }}
      >
        {/* ================= SCREEN 1: LIST ================= */}
        {view === "list" && (
          <>
            <Box
              bg={C.panel}
              style={{
                flex: 1,
                minHeight: 0,
                padding: `${u(38)} ${u(30)} 0`,
                borderRadius: u(18),
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <Text
                c={C.cream}
                fw={600}
                style={{ fontSize: uMin(34, 17), lineHeight: 1 }}
              >
                Current Autograph Fee
              </Text>

              {/* CURRENT FEE CARD */}
              <Box
                bg={C.cream}
                style={{
                  position: "relative",
                  flexShrink: 0,
                  height: u(84),
                  marginTop: u(30),
                  borderRadius: u(10),
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: u(25),
                  paddingRight: u(44),
                }}
              >
                <Text
                  c="#51473B"
                  style={{ fontSize: uMin(20, 11), lineHeight: 1 }}
                >
                  Autograph Fee
                </Text>

                <Text
                  c="#171717"
                  fw={800}
                  style={{
                    position: "absolute",
                    left: "54.5%",
                    transform: "translateX(-50%)",
                    fontSize: uMin(32, 16),
                    lineHeight: 1,
                  }}
                >
                  {currentFee}
                </Text>

                <UnstyledButton
                  aria-label="Edit autograph fee"
                  className="action"
                  onClick={openEdit}
                  style={{
                    marginLeft: "auto",
                    color: C.brown,
                    display: "flex",
                  }}
                >
                  <Ico icon={FaEdit} n={32} min={16} />
                </UnstyledButton>
              </Box>

              {/* TITLE + SEARCH + FILTER */}
              <Flex
                align="center"
                justify="space-between"
                style={{ marginTop: u(30), height: u(42), flexShrink: 0 }}
              >
                <Text
                  c={C.cream}
                  fw={600}
                  style={{ fontSize: uMin(34, 17), lineHeight: 1 }}
                >
                  Autograph Fee History
                </Text>

                <Flex align="center" style={{ gap: u(25) }}>
                  <TextInput
                    placeholder="Search"
                    value={tableSearch}
                    onChange={(e) => {
                      setTableSearch(e.currentTarget.value);
                      setActivePage(1); // search badalne par page 1 par wapas
                    }}
                    leftSection={<Ico icon={FaSearch} n={13} min={9} />}
                    styles={{
                      root: { width: u(296) },
                      input: {
                        height: u(42),
                        minHeight: 0,
                        background: "#303030",
                        border: "none",
                        borderRadius: 999,
                        color: "#FFFFFF",
                        paddingLeft: `max(34px, ${u(44)})`,
                        fontSize: uMin(16, 11),
                      },
                      section: { color: C.cream, width: `max(34px, ${u(44)})` },
                    }}
                  />

                  <UnstyledButton
                    className="action"
                    style={{
                      width: u(122),
                      height: u(42),
                      borderRadius: 999,
                      background: "#303030",
                      color: C.cream,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: u(8),
                    }}
                  >
                    <Ico icon={FaFilter} n={13} min={9} />
                    <Text style={{ fontSize: uMin(16, 11) }}>Filter</Text>
                  </UnstyledButton>
                </Flex>
              </Flex>

              {/* TABLE */}
              <Box
                className="hide-scrollbar"
                style={{
                  flex: 1,
                  minHeight: 0,
                  marginTop: u(24),
                  overflowY: "auto",
                  overflowX: "auto",
                }}
              >
                <Table
                  withRowBorders={false}
                  verticalSpacing={0}
                  horizontalSpacing={0}
                  styles={{
                    table: {
                      width: "100%",
                      minWidth: 520,
                      tableLayout: "fixed",
                      borderCollapse: "collapse",
                    },
                    th: {
                      height: u(34),
                      padding: 0,
                      color: C.cream,
                      fontSize: uMin(27, 13),
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      textAlign: "left",
                      borderBottom: "none",
                    },
                    td: {
                      height: u(97),
                      padding: 0,
                      verticalAlign: "middle",
                      whiteSpace: "nowrap",
                      borderTop: "none",
                      borderBottom: `1px solid ${C.border}`,
                    },
                  }}
                >
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th w="42.7%">Autograph Fee</Table.Th>
                      <Table.Th w="46.9%">Updated By</Table.Th>
                      <Table.Th w="10.4%" style={{ textAlign: "center" }}>
                        Date
                      </Table.Th>
                    </Table.Tr>
                  </Table.Thead>

                  <Table.Tbody>
                    {visibleHistory.map((row) => (
                      <Table.Tr key={row.id}>
                        <Table.Td>
                          <Text c="#B85A2A" style={{ fontSize: uMin(22, 12) }}>
                            {row.fee}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text c={C.white} style={{ fontSize: uMin(17, 10) }}>
                            {row.updatedBy}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text
                            c={C.white}
                            ta="center"
                            style={{ fontSize: uMin(17, 10) }}
                          >
                            {row.date}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>

                {filteredHistory.length === 0 && (
                  <Text
                    ta="center"
                    c={C.muted}
                    py="xl"
                    style={{ fontSize: uMin(18, 11) }}
                  >
                    No history found.
                  </Text>
                )}
              </Box>
            </Box>

            {/* PAGINATION */}
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              onChange={setActivePage}
            />
          </>
        )}

        {/* ================= SCREEN 2: EDIT ================= */}
        {view === "edit" && (
          <Box
            bg={C.panel}
            style={{
              flex: "0 0 auto",
              height: u(394),
              padding: `${u(38)} ${u(30)} 0`,
              borderRadius: u(12),
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <Text
              c={C.cream}
              fw={600}
              style={{ fontSize: uMin(34, 17), lineHeight: 1 }}
            >
              Updated Autograph Fee
            </Text>

            <TextInput
              aria-label="Updated autograph fee"
              placeholder="$12"
              value={fee}
              onChange={(e) => setFee(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleUpdate();
              }}
              styles={{
                root: { marginTop: u(30), flexShrink: 0 },
                input: {
                  height: u(48),
                  minHeight: 0,
                  background: C.bg,
                  border: "none",
                  borderRadius: u(4),
                  color: "#FFFFFF",
                  fontSize: uMin(18, 11),
                  paddingLeft: u(25),
                },
              }}
            />

            <Flex style={{ marginTop: u(119), gap: u(24), flexShrink: 0 }}>
              <Button
                className="action"
                onClick={handleUpdate}
                disabled={!canSubmit}
                w={u(249)}
                h={u(51)}
                radius={u(3)}
                styles={{
                  root: {
                    background: C.brown,
                    color: C.white,
                    fontSize: uMin(19, 11),
                    fontWeight: 400,
                    minWidth: 110,
                  },
                }}
              >
                Update Fee
              </Button>

              <Button
                className="action"
                onClick={() => setView("list")}
                w={u(252)}
                h={u(51)}
                radius={u(3)}
                styles={{
                  root: {
                    background: C.bg,
                    color: C.white,
                    fontSize: uMin(19, 11),
                    fontWeight: 400,
                    minWidth: 110,
                  },
                }}
              >
                Cancel
              </Button>
            </Flex>
          </Box>
        )}
      </Box>

      {/* ================= SCREEN 3: SUCCESS POPUP ================= */}
      <Modal
        opened={successOpen}
        onClose={handleOkay}
        withCloseButton={false}
        centered
        padding={0}
        radius={u(12)}
        size="auto"
        overlayProps={{ color: "#000", backgroundOpacity: 0.6, blur: 0 }}
        styles={{
          content: {
            background: C.cream,
            flex: "0 0 auto",
            width: u(610),
            minWidth: 300,
            maxWidth: "92vw",
            height: u(370),
            minHeight: 240,
          },
          body: { height: "100%" },
        }}
      >
        <Stack
          align="center"
          justify="flex-start"
          gap={0}
          h="100%"
          style={{ paddingTop: u(60) }}
        >
          <Ico icon={MdOutlineVerified} n={64} min={40} color="#3B2A1A" />

          <Text
            c="#1F1F1F"
            ta="center"
            style={{
              marginTop: u(30),
              fontSize: uMin(22, 13),
              lineHeight: 1.5,
            }}
          >
            Autograph fee plan has been
            <br />
            Updated successfully
          </Text>

          <Button
            className="action"
            onClick={handleOkay}
            w={u(160)}
            h={u(50)}
            radius={u(2)}
            style={{ marginTop: u(40) }}
            styles={{
              root: {
                background: C.brown,
                color: C.white,
                fontSize: uMin(19, 11),
                fontWeight: 400,
                minWidth: 90,
                outline: "none",
                boxShadow: `0 ${u(10)} ${u(18)} rgba(0,0,0,0.35)`,
              },
            }}
          >
            Okay
          </Button>
        </Stack>
      </Modal>
    </ReaderLayout>
  );
}
