import { Flex, Text, UnstyledButton } from "@mantine/core";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const C = {
  cream: "#FFE8B6",
  active: "#91451F",
  pageBg: "#D9CBAE",
};

type PaginationProps = {
  page: number; // abhi kaunsa page khula hai (1 se shuru)
  totalPages: number; // kul kitne pages
  onChange: (page: number) => void; // page badalne par yeh chalega
};

// Kaunse numbers dikhane hain: 1 ... 4 5 6 ... 99
function getPages(current: number, total: number): (number | "...")[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "...")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("...");
  pages.push(total);

  return pages;
}

const boxStyle = {
  width: 28,
  height: 28,
  padding: 0,
  borderRadius: 4,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 14,
  fontWeight: 700,
};

export default function Pagination({
  page,
  totalPages,
  onChange,
}: PaginationProps) {
  // Sirf 1 page ho to pagination dikhane ki zaroorat nahi
  if (totalPages <= 1) return null;

  const atStart = page === 1;
  const atEnd = page === totalPages;

  return (
    <Flex
      align="center"
      justify="center"
      gap={16}
      py={14}
      style={{ flexShrink: 0 }}
    >
      <UnstyledButton
        className="action"
        aria-label="Previous page"
        disabled={atStart}
        onClick={() => onChange(page - 1)}
        style={{
          ...boxStyle,
          background: C.cream,
          color: "#171717",
          opacity: atStart ? 0.4 : 1,
          cursor: atStart ? "not-allowed" : "pointer",
        }}
      >
        <FaChevronLeft size={11} />
      </UnstyledButton>

      {getPages(page, totalPages).map((p, i) =>
        p === "..." ? (
          <Text key={`dots-${i}`} size="14px" c={C.cream}>
            ...
          </Text>
        ) : (
          <UnstyledButton
            key={p}
            className="action"
            onClick={() => onChange(p)}
            style={{
              ...boxStyle,
              background: p === page ? C.active : C.pageBg,
              color: p === page ? "#FFFFFF" : "#25211E",
            }}
          >
            {p}
          </UnstyledButton>
        ),
      )}

      <UnstyledButton
        className="action"
        aria-label="Next page"
        disabled={atEnd}
        onClick={() => onChange(page + 1)}
        style={{
          ...boxStyle,
          background: C.cream,
          color: "#171717",
          opacity: atEnd ? 0.4 : 1,
          cursor: atEnd ? "not-allowed" : "pointer",
        }}
      >
        <FaChevronRight size={11} />
      </UnstyledButton>
    </Flex>
  );
}
