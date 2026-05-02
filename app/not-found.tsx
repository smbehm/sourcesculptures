import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-lg flex-1 flex-col justify-center px-5 py-32 text-center sm:px-8">
      <p className="text-xs tracking-[0.35em] text-white/45 uppercase">
        404
      </p>
      <h1 className="font-display mt-4 text-3xl tracking-wide text-white uppercase">
        Page not found
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-white/55">
        That project or page does not exist. Return home to keep browsing work.
      </p>
      <Link
        href="/"
        className="font-display mt-10 inline-flex justify-center border border-white/30 bg-white/5 px-6 py-3 text-sm tracking-[0.2em] text-white uppercase transition hover:border-white/50 hover:bg-white/10"
      >
        Back home
      </Link>
    </main>
  );
}
