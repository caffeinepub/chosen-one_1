import { useEffect, useState } from "react";

export function useGlobalListeners(): number {
  const [count, setCount] = useState(1247);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((prev) =>
        Math.max(500, prev + Math.floor(Math.random() * 101) - 50),
      );
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return count;
}
