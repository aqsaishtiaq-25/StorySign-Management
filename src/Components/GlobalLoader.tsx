import { useEffect, useState, useSyncExternalStore } from "react";
import { Flex, Loader } from "@mantine/core";
import { getPendingCount, subscribeLoading } from "../api"; // path apne folder ke hisaab se theek kar lein

export default function GlobalLoader() {
  const pending = useSyncExternalStore(subscribeLoading, getPendingCount);
  const [visible, setVisible] = useState(true);

  // Saari requests khatam hone ke baad thora ruk kar chhupta hai,
  // taake peeche peeche aane wali requests (jaise users ki details) bhi cover hon
  useEffect(() => {
    if (!visible || pending > 0) return;
    const t = setTimeout(() => setVisible(false), 350);
    return () => clearTimeout(t);
  }, [pending, visible]);

  // Safety: 15 second baad har haal mein hat jaye
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 15000);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <Flex
      align="center"
      justify="center"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "#211E1E",
      }}
    >
      <Loader color="#FFE8B6" size="md" />
    </Flex>
  );
}
