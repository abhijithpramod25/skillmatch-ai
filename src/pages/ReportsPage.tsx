import { motion } from "framer-motion";
import { FileText, Download } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function ReportsPage() {
  const { currentSession } = useAppStore();
  const candidates = currentSession?.candidates || [];

  const exportCSV = () => {
    if (candidates.length === 0) {
      toast.error("No data to export.");
      return;
    }
    const header = "Name,Email,Score,Experience (Years),Education,Skills Matched,Skills Missing,Recommendation";
    const rows = candidates.map((c) =>
      [
        `"${c.name}"`,
        `"${c.email}"`,
        c.score,
        c.experience_years,
        `"${c.education}"`,
        `"${c.skills_matched.join("; ")}"`,
        `"${c.skills_missing.join("; ")}"`,
        `"${c.recommendation}"`,
      ].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `screening-report-${currentSession?.job_title || "report"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded!");
  };

  const sorted = [...candidates].sort((a, b) => b.score - a.score);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 max-w-4xl mx-auto">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold gradient-text">Reports</h1>
          <p className="text-muted-foreground mt-1">Export and review screening summaries</p>
        </div>
        <Button variant="glow" onClick={exportCSV} disabled={candidates.length === 0}>
          <Download className="h-4 w-4 mr-1" /> Export CSV
        </Button>
      </motion.div>

      {candidates.length === 0 ? (
        <motion.div variants={item} className="flex flex-col items-center justify-center min-h-[40vh] text-center">
          <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="font-display text-xl font-semibold text-foreground">No reports available</h2>
          <p className="text-muted-foreground mt-1">Complete a screening session to generate reports.</p>
        </motion.div>
      ) : (
        <>
          {/* Summary Card */}
          <motion.div variants={item} className="glass-card p-6 space-y-3">
            <h2 className="font-display text-lg font-semibold text-foreground">Session Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 rounded-lg bg-secondary/30">
                <p className="text-2xl font-display font-bold text-foreground">{candidates.length}</p>
                <p className="text-xs text-muted-foreground">Total Candidates</p>
              </div>
              <div className="p-3 rounded-lg bg-success/10">
                <p className="text-2xl font-display font-bold text-success">
                  {candidates.filter((c) => c.score >= 75).length}
                </p>
                <p className="text-xs text-muted-foreground">Strong Match</p>
              </div>
              <div className="p-3 rounded-lg bg-warning/10">
                <p className="text-2xl font-display font-bold text-warning">
                  {candidates.filter((c) => c.score >= 50 && c.score < 75).length}
                </p>
                <p className="text-xs text-muted-foreground">Moderate</p>
              </div>
              <div className="p-3 rounded-lg bg-destructive/10">
                <p className="text-2xl font-display font-bold text-destructive">
                  {candidates.filter((c) => c.score < 50).length}
                </p>
                <p className="text-xs text-muted-foreground">Low Match</p>
              </div>
            </div>
          </motion.div>

          {/* Ranked List */}
          <motion.div variants={item} className="glass-card p-6">
            <h2 className="font-display text-lg font-semibold text-foreground mb-4">Ranked Candidates</h2>
            <div className="space-y-3">
              {sorted.map((c, i) => {
                const scoreColor =
                  c.score >= 75 ? "text-success" : c.score >= 50 ? "text-warning" : "text-destructive";
                return (
                  <div key={c.id} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/20">
                    <span className="font-display text-lg font-bold text-muted-foreground w-8">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.recommendation}</p>
                    </div>
                    <span className={`font-display text-lg font-bold ${scoreColor}`}>{c.score}%</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
