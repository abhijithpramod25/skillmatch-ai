import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

export function ScoreBadge({ score, size = "md" }: ScoreBadgeProps) {
  const colorClass = score >= 75 ? "score-high" : score >= 50 ? "score-medium" : "score-low";
  const bgClass = score >= 75 ? "bg-success/10 border-success/30" : score >= 50 ? "bg-warning/10 border-warning/30" : "bg-destructive/10 border-destructive/30";

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full border font-display font-bold",
        bgClass,
        colorClass,
        size === "sm" && "h-8 w-8 text-xs",
        size === "md" && "h-12 w-12 text-sm",
        size === "lg" && "h-20 w-20 text-2xl"
      )}
    >
      {score}%
    </div>
  );
}
