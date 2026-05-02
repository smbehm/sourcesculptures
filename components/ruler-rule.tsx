type RulerRuleProps = {
  className?: string;
  /** Approximate number of major tick segments across the width */
  segments?: number;
};

export function RulerRule({ className = "", segments = 48 }: RulerRuleProps) {
  return (
    <div
      className={`relative h-3 w-full overflow-hidden border-y border-white/15 bg-black ${className}`}
      aria-hidden
    >
      <div
        className="absolute inset-0 flex justify-between px-1"
        style={{
          maskImage:
            "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        }}
      >
        {Array.from({ length: segments }).map((_, i) => {
          const isMajor = i % 4 === 0;
          return (
            <span
              key={i}
              className={`w-px shrink-0 bg-white/25 ${
                isMajor ? "h-full opacity-90" : "h-1/2 self-end opacity-50"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
