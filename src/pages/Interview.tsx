import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
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
  MessageSquare,
  Send,
  Bot,
  User,
  RotateCcw,
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
  extractedText?: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const CATEGORY_META: Record<keyof QuestionResult["categories"], { label: string; icon: typeof Code2 }> = {
  technical: { label: "Technical", icon: Code2 },
  projects: { label: "Projects", icon: FolderGit2 },
  experience: { label: "Experience", icon: Briefcase },
  behavioral: { label: "Behavioral / HR", icon: HeartHandshake },
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

const Interview = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<QuestionResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showAnswers, setShowAnswers] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chat with the Interview Agent (uses resume context)
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  const runAnalysis = useCallback(async (f: File) => {
    setLoading(true);
    setProgress(8);
    const tick = setInterval(() => setProgress((p) => Math.min(p + 6, 92)), 600);
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
    setChatOpen(false);
    setChatMessages([]);
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

  const askInChat = (q: string) => {
    setChatOpen(true);
    setChatInput(q);
    setTimeout(() => {
      const el = document.getElementById("interview-chat-panel");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const startChat = async () => {
    if (!result) return;
    setChatOpen(true);
    if (chatMessages.length > 0) return;
    setChatLoading(true);
    try {
      const intro = `You are interviewing a candidate based on this resume context:\n\nSkills: ${result.summary.skills?.join(", ")}\nTechnologies: ${result.summary.technologies?.join(", ")}\nProjects: ${result.summary.projects?.join(", ")}\nExperience: ${result.summary.experience?.join(", ")}\n\nAsk your first personalized interview question now.`;
      const { data, error } = await supabase.functions.invoke("interview-chat", {
        body: {
          action: "start",
          interviewType: "Resume-based",
          messages: [{ role: "user", content: intro }],
        },
      });
      if (error) throw error;
      setChatMessages([{ role: "assistant", content: data.message }]);
    } catch (e) {
      toast.error("Failed to start chat");
    } finally {
      setChatLoading(false);
    }
  };

  const sendChat = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    setChatInput("");
    const next = [...chatMessages, { role: "user" as const, content: text }];
    setChatMessages(next);
    setChatLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("interview-chat", {
        body: { messages: next, interviewType: "Resume-based" },
      });
      if (error) throw error;
      setChatMessages((m) => [...m, { role: "assistant", content: data.message }]);
    } catch {
      toast.error("Failed to get response");
    } finally {
      setChatLoading(false);
    }
  };

  const resetAll = () => {
    setFile(null);
    setResult(null);
    setChatOpen(false);
    setChatMessages([]);
    setProgress(0);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container px-4 max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-interview/20 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-interview" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Interview Agent</h1>
            <p className="text-muted-foreground">
              Upload your resume and get personalized interview questions tailored to your skills, projects, and experience.
            </p>
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
                    <Button type="button" onClick={(e) => (e.currentTarget.previousElementSibling as HTMLElement)?.click()}>
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
                      <Loader2 className="w-20 h-20 text-primary animate-spin absolute inset-0" />
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
                  <Button variant="outline" size="sm" onClick={resetAll}>
                    <X className="w-4 h-4 mr-1" /> New Resume
                  </Button>
                  <Button variant="outline" size="sm" onClick={regenerate}>
                    <RefreshCw className="w-4 h-4 mr-1" /> Regenerate
                  </Button>
                  <Button variant="outline" size="sm" onClick={copyAll}>
                    <Copy className="w-4 h-4 mr-1" /> Copy All
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportTxt}>
                    <Download className="w-4 h-4 mr-1" /> Export
                  </Button>
                  <Button variant="interview" size="sm" onClick={startChat}>
                    <MessageSquare className="w-4 h-4 mr-1" /> Start Mock Interview
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
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-xs"
                                    onClick={() => askInChat(q.question)}
                                  >
                                    Practice
                                  </Button>
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

              {/* Chat panel */}
              {chatOpen && (
                <motion.div
                  id="interview-chat-panel"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Bot className="w-5 h-5 text-interview" />
                        Mock Interview Chat
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setChatMessages([]);
                          setChatOpen(false);
                        }}
                      >
                        <RotateCcw className="w-4 h-4 mr-1" /> Reset
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="h-[420px] overflow-y-auto rounded-lg border bg-background p-4 space-y-4">
                        {chatMessages.length === 0 && !chatLoading && (
                          <p className="text-sm text-muted-foreground text-center py-12">
                            Click "Practice" on any question, or type a response to begin.
                          </p>
                        )}
                        {chatMessages.map((m, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                          >
                            {m.role === "assistant" && (
                              <div className="w-8 h-8 rounded-full bg-interview/20 flex items-center justify-center flex-shrink-0">
                                <Bot className="w-4 h-4 text-interview" />
                              </div>
                            )}
                            <div
                              className={`max-w-[80%] p-3 rounded-2xl text-sm whitespace-pre-wrap ${
                                m.role === "user" ? "bg-interview text-interview-foreground" : "bg-muted"
                              }`}
                            >
                              {m.content}
                            </div>
                            {m.role === "user" && (
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-primary" />
                              </div>
                            )}
                          </motion.div>
                        ))}
                        {chatLoading && (
                          <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-interview/20 flex items-center justify-center">
                              <Bot className="w-4 h-4 text-interview" />
                            </div>
                            <div className="bg-muted p-3 rounded-2xl">
                              <Loader2 className="w-4 h-4 animate-spin text-interview" />
                            </div>
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>

                      <div className="flex gap-2">
                        <Input
                          placeholder="Type your response..."
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChat()}
                          disabled={chatLoading}
                        />
                        <Button variant="interview" size="icon" onClick={sendChat} disabled={chatLoading || !chatInput.trim()}>
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Interview;
