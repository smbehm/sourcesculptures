import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { SoundProvider } from "@/context/SoundContext";

type State = "loading" | "valid" | "already" | "invalid" | "submitting" | "done" | "error";

const Unsubscribe = () => {
  const [state, setState] = useState<State>("loading");
  const [error, setError] = useState<string>("");
  const token = new URLSearchParams(window.location.search).get("token") ?? "";

  useEffect(() => {
    document.title = "Unsubscribe — SOURCEsculptures";
    window.scrollTo(0, 0);

    if (!token) {
      setState("invalid");
      return;
    }

    const validate = async () => {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`;
        const res = await fetch(url, {
          headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        });
        const data = await res.json();
        if (data.valid) setState("valid");
        else if (data.reason === "already_unsubscribed") setState("already");
        else setState("invalid");
      } catch {
        setState("invalid");
      }
    };
    validate();
  }, [token]);

  const confirm = async () => {
    setState("submitting");
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      if (data?.success) setState("done");
      else if (data?.reason === "already_unsubscribed") setState("already");
      else {
        setError("Could not process your request.");
        setState("error");
      }
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong.");
      setState("error");
    }
  };

  return (
    <SoundProvider>
      <Header />
      <main className="relative min-h-screen w-full bg-background text-foreground flex items-center justify-center px-6">
        <div className="max-w-xl w-full text-center py-32">
          <span className="font-display tracking-cinema text-[11px] uppercase text-muted-foreground">
            Email preferences
          </span>
          <h1 className="mt-6 font-display uppercase text-foreground font-bold leading-[0.95] text-[clamp(1.75rem,4vw,3rem)]">
            Unsubscribe
          </h1>

          <div className="mt-12 text-muted-foreground leading-relaxed">
            {state === "loading" && <p>Verifying your link…</p>}

            {state === "valid" && (
              <>
                <p>
                  Click the button below to stop receiving emails from
                  SOURCEsculptures.
                </p>
                <button
                  onClick={confirm}
                  className="mt-10 group inline-flex items-center gap-3 font-display tracking-cinema text-[12px] uppercase text-foreground border-b border-foreground pb-2 hover:text-accent hover:border-accent transition-colors"
                >
                  Confirm unsubscribe
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </button>
              </>
            )}

            {state === "submitting" && <p>Processing…</p>}

            {state === "done" && (
              <p>You've been unsubscribed. We're sorry to see you go.</p>
            )}

            {state === "already" && (
              <p>This email has already been unsubscribed.</p>
            )}

            {state === "invalid" && (
              <p>This unsubscribe link is invalid or has expired.</p>
            )}

            {state === "error" && <p>{error}</p>}
          </div>
        </div>
      </main>
    </SoundProvider>
  );
};

export default Unsubscribe;
