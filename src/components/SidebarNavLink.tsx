import { NavLink as RouterNavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface SidebarNavLinkProps {
  to: string;
  icon: LucideIcon;
  label: string;
  collapsed?: boolean;
}

export function SidebarNavLink({ to, icon: Icon, label, collapsed }: SidebarNavLinkProps) {
  return (
    <RouterNavLink
      to={to}
      end
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-primary/10 text-primary border border-primary/20 glow-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
        )
      }
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && <span>{label}</span>}
    </RouterNavLink>
  );
}
