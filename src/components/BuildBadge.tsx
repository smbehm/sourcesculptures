declare const __BUILD_ID__: string;

const BuildBadge = () => {
  const id = (() => {
    try {
      const d = new Date(__BUILD_ID__);
      return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
    } catch {
      return __BUILD_ID__;
    }
  })();
  return (
    <div className="fixed bottom-2 left-2 z-[100] text-[10px] font-mono text-white/50 bg-black/40 px-1.5 py-0.5 rounded pointer-events-none select-none">
      build {id}
    </div>
  );
};

export default BuildBadge;
