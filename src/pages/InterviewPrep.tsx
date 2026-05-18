import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  Sparkles,
  RefreshCw,
  Copy,
  Download,
  Loader2,
  Code2,
  Briefcase,
  FolderGit2,
  HeartHandshake,
  CheckCircle2,
  X,
} from "lucide-react";

type Difficulty = "easy" | "medium" | "hard";
interface Question {
  question: string;
  difficulty: Difficulty;
  topic: string;
  sampleAnswer?: string;
}
interface QuestionResult {
  summary: {
    skills: string[];
    projects: string[];
    experience: string[];
    education: string[];
    certifications: string[];
    technologies: string[];
  };
  categories: {
    technical: Question[];
    projects: Question[];
    experience: Question[];
    behavioral: Question[];
  };
}

const CATEGORY_META: Record<keyof QuestionResult["categories"], { label: string; icon: typeof Code2; color: string }> = {
  technical: { label: "Technical", icon: Code2, color: "text-resume" },
  projects: { label: "Projects", icon: FolderGit2, color: "text-skillgap" },
  experience: { label: "Experience", icon: Briefcase, color: "text-jobscout" },
  behavioral: { label: "Behavioral / HR", icon: HeartHandshake, color: "text-interview" },
};

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  easy: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  medium: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  hard: "bg-rose-500/15 text-rose-500 border-rose-500/30",
};

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result as string;
      resolve(r.split(",")[1] ?? r);
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });

const InterviewPrep = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<QuestionResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showAnswers, setShowAnswers] = useState<Record<string, boolean>>({});

  const runAnalysis = useCallback(async (f: File) => {
    setLoading(true);
    setProgress(10);
    const tick = setInterval(() => setProgress((p) => Math.min(p + 7, 92)), 600);
    try {
      const fileBase64 = await fileToBase64(f);
      const { data, error } = await supabase.functions.invoke("generate-interview-questions", {
        body: { fileBase64, fileType: f.type, fileName: f.name },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      setResult(data as QuestionResult);
      setProgress(100);
      toast.success("Interview questions ready!");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to analyze resume";
      toast.error(msg);
      setProgress(0);
    } finally {
      clearInterval(tick);
      setLoading(false);
    }
  }, []);

  const handleFile = (f: File) => {
    const ok =
      f.type === "application/pdf" ||
      f.name.toLowerCase().endsWith(".pdf") ||
      f.name.toLowerCase().endsWith(".docx") ||
      f.type.includes("officedocument.wordprocessingml");
    if (!ok) {
      toast.error("Please upload a PDF or DOCX file.");
      return;
    }
    setFile(f);
    setResult(null);
    runAnalysis(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const regenerate = () => {
    if (file) runAnalysis(file);
  };

  const allQuestions = useMemo(() => {
    if (!result) return "";
    let out = "AI Resume Interview Questions\n\n";
    (Object.keys(result.categories) as Array<keyof QuestionResult["categories"]>).forEach((k) => {
      out += `=== ${CATEGORY_META[k].label} ===\n`;
      result.categories[k].forEach((q, i) => {
        out += `${i + 1}. [${q.difficulty.toUpperCase()}] ${q.question}\n`;
        if (q.sampleAnswer) out += `   Sample answer: ${q.sampleAnswer}\n`;
      });
      out += "\n";
    });
    return out;
  }, [result]);

  const copyAll = async () => {
    await navigator.clipboard.writeText(allQuestions);
    toast.success("Copied all questions to clipboard");
  };

  const exportTxt = () => {
    const blob = new Blob([allQuestions], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "interview-questions.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container px-4 max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-interview to-primary flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">AI Resume Interview Question Generator</h1>
                <p className="text-muted-foreground">
                  Upload your resume to get personalized interview questions tailored to your experience.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Upload */}
          {!result && !loading && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardContent className="p-0">
                  <label
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDrop}
                    className={`flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                      dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
                    }`}
                  >
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Upload className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Drop your resume here</h3>
                    <p className="text-muted-foreground mb-4">PDF or DOCX • up to 10MB</p>
                    <Button type="button" variant="default" onClick={(e) => (e.currentTarget.previousElementSibling as HTMLElement)?.click()}>
                      <FileText className="w-4 h-4 mr-2" />
                      Choose File
                    </Button>
                    <input
                      type="file"
                      accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFile(f);
                      }}
                    />
                  </label>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Loading */}
          <AnimatePresence>
            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card>
                  <CardContent className="p-10 flex flex-col items-center text-center">
                    <div className="relative w-20 h-20 mb-6">
                      <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                      <Loader2 className="w-20 h-20 text-primary animate-spin" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Analyzing your resume…</h3>
                    <p className="text-muted-foreground mb-6">
                      Extracting skills, projects, and crafting tailored interview questions.
                    </p>
                    <div className="w-full max-w-md">
                      <Progress value={progress} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-2">{progress}%</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Result */}
          {result && !loading && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* File + actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-card border">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <div>
                    <div className="font-medium">{file?.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Generated {Object.values(result.categories).reduce((a, b) => a + b.length, 0)} questions
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setResult(null); setFile(null); }}>
                    <X className="w-4 h-4 mr-1" /> New Resume
                  </Button>
                  <Button variant="outline" size="sm" onClick={regenerate}>
                    <RefreshCw className="w-4 h-4 mr-1" /> Regenerate
                  </Button>
                  <Button variant="outline" size="sm" onClick={copyAll}>
                    <Copy className="w-4 h-4 mr-1" /> Copy All
                  </Button>
                  <Button variant="default" size="sm" onClick={exportTxt}>
                    <Download className="w-4 h-4 mr-1" /> Export
                  </Button>
                </div>
              </div>

              {/* Summary chips */}
              {result.summary && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Resume Snapshot</CardTitle>
                  </CardHeader>
                  <CardContent className="grid sm:grid-cols-2 gap-4">
                    {(
                      [
                        ["Skills", result.summary.skills],
                        ["Technologies", result.summary.technologies],
                        ["Projects", result.summary.projects],
                        ["Experience", result.summary.experience],
                      ] as const
                    ).map(([label, items]) => (
                      <div key={label}>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">{label}</div>
                        <div className="flex flex-wrap gap-1.5">
                          {(items ?? []).slice(0, 12).map((t, i) => (
                            <Badge key={`${label}-${i}`} variant="secondary" className="font-normal">
                              {t}
                            </Badge>
                          ))}
                          {(!items || items.length === 0) && (
                            <span className="text-xs text-muted-foreground">Not detected</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Tabs */}
              <Tabs defaultValue="technical">
                <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full">
                  {(Object.keys(CATEGORY_META) as Array<keyof QuestionResult["categories"]>).map((k) => {
                    const Icon = CATEGORY_META[k].icon;
                    return (
                      <TabsTrigger key={k} value={k}>
                        <Icon className="w-4 h-4 mr-2" />
                        {CATEGORY_META[k].label}
                        <span className="ml-2 text-xs opacity-60">({result.categories[k]?.length ?? 0})</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {(Object.keys(CATEGORY_META) as Array<keyof QuestionResult["categories"]>).map((k) => (
                  <TabsContent key={k} value={k} className="space-y-3 mt-4">
                    {(result.categories[k] ?? []).map((q, i) => {
                      const id = `${k}-${i}`;
                      const open = showAnswers[id];
                      return (
                        <motion.div
                          key={id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                        >
                          <Card className="hover:border-primary/40 transition-colors">
                            <CardContent className="p-5">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <span className="text-xs font-mono text-muted-foreground">#{i + 1}</span>
                                    <Badge variant="outline" className={DIFFICULTY_STYLES[q.difficulty]}>
                                      {q.difficulty}
                                    </Badge>
                                    {q.topic && (
                                      <Badge variant="outline" className="font-normal">
                                        {q.topic}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-base leading-relaxed">{q.question}</p>
                                  {open && q.sampleAnswer && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      className="mt-3 p-3 rounded-lg bg-muted/50 border text-sm text-muted-foreground"
                                    >
                                      <span className="font-medium text-foreground">Sample answer: </span>
                                      {q.sampleAnswer}
                                    </motion.div>
                                  )}
                                </div>
                                <div className="flex flex-col gap-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => {
                                      navigator.clipboard.writeText(q.question);
                                      toast.success("Question copied");
                                    }}
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                  {q.sampleAnswer && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-xs"
                                      onClick={() => setShowAnswers((s) => ({ ...s, [id]: !s[id] }))}
                                    >
                                      {open ? "Hide" : "Answer"}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                    {(!result.categories[k] || result.categories[k].length === 0) && (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No questions generated for this category.
                      </p>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default InterviewPrep;
