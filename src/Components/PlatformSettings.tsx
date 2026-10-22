import { useState } from "react";
import type { CSSProperties } from "react";
import { Box, Flex, Text, TextInput, UnstyledButton } from "@mantine/core";
import { FaPen, FaCheck } from "react-icons/fa";

import ReaderLayout from "./ReaderLayout";

/**
 * SIZING
 * One "u" = 1 Figma pixel, scaled so the frame fits the screen height.
 * Sidebar, header, logo, search and profile come from ReaderLayout.
 */
const u = (n: number): string => `calc(var(--u) * ${n})`;
const uMin = (n: number, min: number): string =>
  `max(${min}px, calc(var(--u) * ${n}))`;

const rootVars = { "--u": "calc(100dvh / 1024)" } as CSSProperties;

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
  active: "#91451F",
  white: "#F7E5D7",
};

const fields: { key: string; label: string }[] = [
  { key: "name", label: "Platform Name" },
  { key: "email", label: "Support Email" },
  { key: "url", label: "Platform URL" },
  { key: "format", label: "Ebooks Format Allowed" },
];

export default function PlatformSettings() {
  const [editing, setEditing] = useState<boolean>(false);
  const [values, setValues] = useState<Record<string, string>>({
    name: "Storysign",
    email: "sign@gmail.com",
    url: "www.storysign.com",
    format: "PDF",
  });

  const setValue = (key: string, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleEditToggle = () => {
    // TODO: when editing is finished (check icon), save `values` with your API
    setEditing((prev) => !prev);
  };

  return (
    <ReaderLayout title="Platform Settings" activePage="settings">
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap");
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
        {/* PANEL: only as tall as its content (472 in Figma), not stretched */}
        <Box
          bg={C.panel}
          style={{
            height: u(472),
            flexShrink: 0,
            padding: `${u(40)} ${u(34)} 0 ${u(31)}`,
            borderRadius: u(18),
            overflow: "hidden",
          }}
        >
          {/* title + edit button */}
          <Flex
            align="center"
            justify="space-between"
            style={{ height: u(36) }}
          >
            <Text
              c={C.cream}
              fw={600}
              style={{ fontSize: uMin(34, 17), lineHeight: 1 }}
            >
              Configure platform settings
            </Text>

            <UnstyledButton
              aria-label={editing ? "Save settings" : "Edit settings"}
              className="action"
              onClick={handleEditToggle}
              style={{
                width: u(36),
                height: u(36),
                borderRadius: "50%",
                background: C.active,
                color: C.cream,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {editing ? (
                <Ico icon={FaCheck} n={15} min={9} />
              ) : (
                <Ico icon={FaPen} n={15} min={9} />
              )}
            </UnstyledButton>
          </Flex>

          {/* 4 rows: label on the left, field on the right */}
          <Box style={{ marginTop: u(26.5) }}>
            {fields.map((field, i) => (
              <Flex
                key={field.key}
                align="center"
                justify="space-between"
                style={{
                  height: u(59),
                  marginBottom: i === fields.length - 1 ? 0 : u(26),
                }}
              >
                <Text
                  c={C.white}
                  style={{ fontSize: uMin(28, 14), lineHeight: 1 }}
                >
                  {field.label}
                </Text>

                <TextInput
                  aria-label={field.label}
                  value={values[field.key]}
                  readOnly={!editing}
                  onChange={(e) => setValue(field.key, e.currentTarget.value)}
                  styles={{
                    root: { width: u(458) },
                    input: {
                      height: u(59),
                      minHeight: 0,
                      background: C.bg,
                      border: editing
                        ? "1px solid #77716B"
                        : "1px solid transparent",
                      borderRadius: u(3),
                      color: C.white,
                      fontSize: uMin(21, 11),
                      paddingLeft: u(23),
                    },
                  }}
                />
              </Flex>
            ))}
          </Box>
        </Box>
      </Box>
    </ReaderLayout>
  );
}
