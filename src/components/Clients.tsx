const clients = ["Terrae", "Northlane", "Harbor Co.", "Glass & Grain", "Field Day"];

const Clients = () => {
  return (
    <section id="clients" className="relative w-full bg-background py-24 sm:py-32 px-6">
      <div className="mx-auto max-w-6xl text-center">
        <span className="font-display tracking-cinema text-[11px] uppercase text-muted-foreground">
          Selected Clients
        </span>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
          {clients.map((c) => (
            <span
              key={c}
              className="font-display tracking-cinema text-[13px] uppercase text-foreground/30"
            >
              {c}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Clients;
