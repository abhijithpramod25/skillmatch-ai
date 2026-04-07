import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, X, Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore, type Candidate, type ScreeningSession } from "@/store/appStore";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const { addSession, setCurrentSession } = useAppStore();
  const navigate = useNavigate();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files).filter(
      (f) => f.type === "application/pdf" || f.name.endsWith(".docx")
    );
    setFiles((prev) => [...prev, ...dropped]);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files).filter(
        (f) => f.type === "application/pdf" || f.name.endsWith(".docx")
      );
      setFiles((prev) => [...prev, ...selected]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!jobDescription.trim() || files.length === 0) {
      toast.error("Please add a job description and at least one resume.");
      return;
    }

    setIsProcessing(true);
    setProcessedCount(0);

    const sessionId = crypto.randomUUID();
    const session: ScreeningSession = {
      id: sessionId,
      job_title: jobTitle || "Untitled Position",
      job_description: jobDescription,
      candidates: [],
      created_at: new Date().toISOString(),
      status: "processing",
      total_resumes: files.length,
      processed_resumes: 0,
    };
    addSession(session);
    setCurrentSession(session);

    const candidates: Candidate[] = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const file = files[i];
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
          reader.readAsDataURL(file);
        });

        const { data, error } = await supabase.functions.invoke("analyze-resume", {
          body: {
            file_base64: base64,
            file_name: file.name,
            file_type: file.type || (file.name.endsWith(".docx") ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : "application/pdf"),
            job_description: jobDescription,
            job_title: jobTitle,
          },
        });

        if (error) throw error;

        candidates.push({
          id: crypto.randomUUID(),
          ...data.candidate,
          file_name: file.name,
          created_at: new Date().toISOString(),
        });
        setProcessedCount(i + 1);
      } catch (err) {
        console.error("Error processing resume:", err);
        toast.error(`Failed to process ${files[i].name}`);
      }
    }

    const updatedSession: ScreeningSession = {
      ...session,
      candidates,
      status: "completed",
      processed_resumes: candidates.length,
    };

    const { updateSession } = useAppStore.getState();
    updateSession(sessionId, updatedSession);
    setCurrentSession(updatedSession);
    setIsProcessing(false);

    if (candidates.length > 0) {
      toast.success(`Successfully analyzed ${candidates.length} resumes!`);
      navigate("/results");
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 max-w-4xl mx-auto">
      <motion.div variants={item}>
        <h1 className="font-display text-3xl font-bold gradient-text">Upload Resumes</h1>
        <p className="text-muted-foreground mt-1">Upload resumes and provide a job description for AI screening</p>
      </motion.div>

      {/* Job Description */}
      <motion.div variants={item} className="glass-card p-6 space-y-4">
        <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" /> Job Description
        </h2>
        <input
          type="text"
          placeholder="Job Title (e.g. Senior Frontend Developer)"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
        />
        <textarea
          placeholder="Paste the full job description here including required skills, qualifications, and responsibilities..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          rows={6}
          className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition resize-none"
        />
      </motion.div>

      {/* Drop Zone */}
      <motion.div variants={item}>
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="glass-card-hover border-2 border-dashed border-border hover:border-primary/50 p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all"
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <Upload className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="font-display text-lg font-semibold text-foreground">
            Drag & drop resumes here
          </p>
          <p className="text-sm text-muted-foreground mt-1">or click to browse · PDF / DOCX</p>
          <input
            id="file-input"
            type="file"
            accept=".pdf,.docx"
            multiple
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      </motion.div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div variants={item} initial="hidden" animate="show" exit={{ opacity: 0 }} className="glass-card p-6 space-y-3">
            <h3 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {files.length} Resume{files.length !== 1 ? "s" : ""} Selected
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {files.map((f, i) => (
                <motion.div
                  key={`${f.name}-${i}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 group"
                >
                  <FileText className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm text-foreground flex-1 truncate">{f.name}</span>
                  <span className="text-xs text-muted-foreground">{(f.size / 1024).toFixed(0)} KB</span>
                  <button onClick={() => removeFile(i)} className="opacity-0 group-hover:opacity-100 transition">
                    <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Processing Indicator */}
      {isProcessing && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
          <div className="flex items-center gap-3 mb-3">
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
            <span className="font-display font-semibold text-foreground">
              Analyzing resumes... ({processedCount}/{files.length})
            </span>
          </div>
          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: "var(--gradient-primary)" }}
              initial={{ width: 0 }}
              animate={{ width: `${(processedCount / files.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </motion.div>
      )}

      {/* Submit */}
      <motion.div variants={item} className="flex justify-end">
        <Button
          variant="glow"
          size="lg"
          disabled={files.length === 0 || !jobDescription.trim() || isProcessing}
          onClick={handleSubmit}
          className="font-display"
        >
          {isProcessing ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
          ) : (
            <><CheckCircle2 className="h-4 w-4" /> Analyze {files.length} Resume{files.length !== 1 ? "s" : ""}</>
          )}
        </Button>
      </motion.div>
    </motion.div>
  );
}
