import { useEffect, useState } from "react";

function hashTrackId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function useLiveListeners(trackId: string): number {
  const base = (hashTrackId(trackId) % 200) + 30;
  const [count, setCount] = useState(base);

  useEffect(() => {
    setCount(base);
    const interval = setInterval(() => {
      setCount((prev) =>
        Math.max(3, prev + Math.floor(Math.random() * 21) - 10),
      );
    }, 12000);
    return () => clearInterval(interval);
  }, [base]);

  return count;
}
