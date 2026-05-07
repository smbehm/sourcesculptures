import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LayoutGrid, LogOut, Settings } from "lucide-react";

const AdminLayout = () => {
  const { session, isAdmin, loading } = useAdminAuth();
  const nav = useNavigate();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }
  if (!session || !isAdmin) {
    nav("/admin/login", { replace: true });
    return null;
  }

  const linkBase = "flex items-center gap-3 px-4 py-2.5 rounded-md text-sm transition-colors";
  const linkActive = "bg-secondary text-foreground";
  const linkIdle = "text-muted-foreground hover:text-foreground hover:bg-secondary/50";

  return (
    <div className="h-screen flex w-full bg-background text-foreground overflow-hidden">
      <aside className="w-60 shrink-0 border-r border-border flex flex-col h-full overflow-y-auto">
        <div className="px-5 py-5 border-b border-border">
          <div className="font-display uppercase text-sm tracking-cinema leading-tight">
            <div>SOURCE</div>
            <div>SCULPTURES</div>
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">Admin CMS</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <NavLink end to="/admin" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}>
            <LayoutGrid className="h-4 w-4" /> Projects
          </NavLink>
          <NavLink to="/admin/settings" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}>
            <Settings className="h-4 w-4" /> Site Settings
          </NavLink>
        </nav>
        <div className="p-3 border-t border-border space-y-2">
          <div className="text-[11px] text-muted-foreground px-2 truncate">{session.user.email}</div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={async () => {
              await supabase.auth.signOut();
              nav("/admin/login", { replace: true });
            }}
          >
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 h-full overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
