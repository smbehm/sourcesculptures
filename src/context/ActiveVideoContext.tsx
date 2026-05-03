import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";

interface ActiveVideoContextValue {
  activeId: string | null;
  reportRatio: (id: string, ratio: number) => void;
  unregister: (id: string) => void;
}

const ActiveVideoContext = createContext<ActiveVideoContextValue>({
  activeId: null,
  reportRatio: () => {},
  unregister: () => {},
});

export const ActiveVideoProvider = ({ children }: { children: ReactNode }) => {
  const ratiosRef = useRef<Map<string, number>>(new Map());
  const [activeId, setActiveId] = useState<string | null>(null);
  const rafRef = useRef<number | null>(null);

  const recompute = useCallback(() => {
    rafRef.current = null;
    let bestId: string | null = null;
    let bestRatio = 0;
    ratiosRef.current.forEach((ratio, id) => {
      if (ratio > bestRatio) {
        bestRatio = ratio;
        bestId = id;
      }
    });
    // Require ~20px visibility minimum (small ratio threshold)
    setActiveId((prev) => {
      const next = bestRatio > 0.02 ? bestId : null;
      return next === prev ? prev : next;
    });
  }, []);

  const schedule = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(recompute);
  }, [recompute]);

  const reportRatio = useCallback(
    (id: string, ratio: number) => {
      ratiosRef.current.set(id, ratio);
      schedule();
    },
    [schedule]
  );

  const unregister = useCallback(
    (id: string) => {
      ratiosRef.current.delete(id);
      schedule();
    },
    [schedule]
  );

  useEffect(() => () => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <ActiveVideoContext.Provider value={{ activeId, reportRatio, unregister }}>
      {children}
    </ActiveVideoContext.Provider>
  );
};

export const useActiveVideo = () => useContext(ActiveVideoContext);
