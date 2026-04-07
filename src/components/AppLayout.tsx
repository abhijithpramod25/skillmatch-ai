import { useState } from "react";
import { Outlet } from "react-router-dom";
import { LayoutDashboard, Upload, ListChecks, FileText, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { SidebarNavLink } from "./SidebarNavLink";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/upload", icon: Upload, label: "Upload Resumes" },
  { to: "/results", icon: ListChecks, label: "Results" },
  { to: "/reports", icon: FileText, label: "Reports" },
];

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex flex-col border-r border-border bg-sidebar transition-all duration-300",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 h-16 border-b border-border shrink-0">
          <Sparkles className="h-6 w-6 text-primary shrink-0" />
          {!collapsed && (
            <span className="font-display text-lg font-bold gradient-text">ResumeAI</span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-1 p-3 overflow-y-auto">
          {navItems.map((item) => (
            <SidebarNavLink key={item.to} {...item} collapsed={collapsed} />
          ))}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center h-10 border-t border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </aside>

      {/* Main content */}
      <main className={cn("flex-1 transition-all duration-300", collapsed ? "ml-16" : "ml-60")}>
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
