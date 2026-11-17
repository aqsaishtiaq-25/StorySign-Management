import { useEffect, useRef, useState } from "react";
import { loadAvatarSrc } from "../api";

// Avatar ka URL de do, <img> ke liye chalne wala link wapas milta hai.
// version badle to photo dobara mangwai jati hai (jaise naya upload hone ke baad).
export function useAvatarSrc(
  url?: string | null,
  version: number = 0,
): string | null {
  const [src, setSrc] = useState<string | null>(null);
  const blobRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!url) {
      setSrc(null);
      return;
    }

    loadAvatarSrc(url)
      .then((s) => {
        if (cancelled) {
          if (s && s.startsWith("blob:")) URL.revokeObjectURL(s);
          return;
        }
        // purana blob hata do, naya lagao
        if (blobRef.current) URL.revokeObjectURL(blobRef.current);
        blobRef.current = s && s.startsWith("blob:") ? s : null;
        setSrc(s);
      })
      .catch(() => {
        if (!cancelled) setSrc(null);
      });

    return () => {
      cancelled = true;
    };
  }, [url, version]);

  // page band hone par blob saaf karo
  useEffect(
    () => () => {
      if (blobRef.current) URL.revokeObjectURL(blobRef.current);
    },
    [],
  );

  return src;
}
