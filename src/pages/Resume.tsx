import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Download,
  Sparkles,
  Target,
  Zap,
  Copy,
  RefreshCw
} from "lucide-react";

interface AnalysisResult {
  atsScore: number;
  scoreIncrease: number;
  improvements: Array<{ type: string; text: string }>;
  optimizedResume: string;
  keyChanges: string[];
  additionalSuggestions: string[];
}

const Resume = () => {
  const { requireAuth, user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showTextInput, setShowTextInput] = useState(false);

  const extractTextFromFile = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        resolve(text);
      };
      reader.onerror = () => {
        resolve("");
      };
      reader.readAsText(file);
    });
  };

  const fileToBase64 = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1] ?? result);
      };
      reader.onerror = () => reject(new Error("Could not read the selected file"));
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ok = await requireAuth("Sign in with Google to upload and analyze your resume.");
    if (!ok) { e.target.value = ""; return; }
    setUploadedFile(file);

    if (file.type === "text/plain" || file.name.endsWith('.txt')) {
      const text = await extractTextFromFile(file);
      if (text) {
        setResumeText(text);
        analyzeResume(text);
      }
    } else if (file.type === "application/pdf" || file.name.toLowerCase().endsWith('.pdf')) {
      setShowTextInput(false);
      analyzeResumeFromPdf(file);
    } else {
      setShowTextInput(true);
      toast.info("This file type needs pasted resume text. PDF uploads can be analyzed automatically.");
    }
  };

  const handleUploadClick = async () => {
    if (user) {
      fileInputRef.current?.click();
      return;
    }

    await requireAuth("Sign in with Google to upload and analyze your resume.");
  };

  const analyzeResumeFromPdf = async (file: File) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const fileBase64 = await fileToBase64(file);
      const { data, error } = await supabase.functions.invoke('analyze-resume', {
        body: {
          fileBase64,
          fileType: file.type || 'application/pdf',
          fileName: file.name,
          targetRole,
        }
      });

      if (error) throw error;

      setAnalysisResult(data);
      toast.success("PDF resume analyzed successfully!");
    } catch (error: any) {
      console.error("Error analyzing PDF resume:", error);
      toast.error(error.message || "Failed to analyze PDF resume. Please try another PDF.");
      setShowTextInput(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeResume = async (text: string) => {
    if (!text.trim()) {
      toast.error("Please provide resume text to analyze");
      return;
    }
    const ok = await requireAuth("Sign in with Google to analyze your resume.");
    if (!ok) return;


    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-resume', {
        body: { resumeText: text, targetRole }
      });

      if (error) throw error;

      setAnalysisResult(data);
      toast.success("Resume analyzed successfully!");
    } catch (error: any) {
      console.error("Error analyzing resume:", error);
      toast.error(error.message || "Failed to analyze resume. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyOptimizedResume = () => {
    if (analysisResult?.optimizedResume) {
      navigator.clipboard.writeText(analysisResult.optimizedResume);
      toast.success("Optimized resume copied to clipboard!");
    }
  };

  const downloadOptimizedResume = async () => {
    if (!analysisResult?.optimizedResume) return;
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const marginX = 54;
      const marginY = 54;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const maxWidth = pageWidth - marginX * 2;

      let y = marginY;

      const ensureSpace = (needed: number) => {
        if (y + needed > pageHeight - marginY) {
          doc.addPage();
          y = marginY;
        }
      };

      const writeLines = (
        text: string,
        opts: { size: number; style?: "normal" | "bold" | "italic"; align?: "left" | "center"; lineGap?: number; indent?: number }
      ) => {
        const { size, style = "normal", align = "left", lineGap = 4, indent = 0 } = opts;
        doc.setFont("helvetica", style);
        doc.setFontSize(size);
        const lh = size * 1.25;
        const width = maxWidth - indent;
        const wrapped = doc.splitTextToSize(text, width) as string[];
        for (const line of wrapped) {
          ensureSpace(lh);
          if (align === "center") {
            doc.text(line, pageWidth / 2, y, { align: "center" });
          } else {
            doc.text(line, marginX + indent, y);
          }
          y += lh;
        }
        y += lineGap;
      };

      const drawDivider = () => {
        ensureSpace(8);
        doc.setDrawColor(120);
        doc.setLineWidth(0.6);
        doc.line(marginX, y, pageWidth - marginX, y);
        y += 8;
      };

      const raw = analysisResult.optimizedResume.replace(/\r/g, "");
      const lines = raw.split("\n");

      // Strip markdown markers
      const clean = (s: string) => s.replace(/\*\*/g, "").replace(/^#+\s*/, "").trim();

      const isHeading = (s: string) => {
        const t = s.trim();
        if (!t || t.length > 60) return false;
        if (/^#+\s+/.test(s)) return true;
        const letters = t.replace(/[^A-Za-z]/g, "");
        if (letters.length >= 3 && letters === letters.toUpperCase() && !/[.!?]/.test(t)) return true;
        return false;
      };

      const isBullet = (s: string) => /^\s*([-*•·]|\d+\.)\s+/.test(s);
      const bulletText = (s: string) => s.replace(/^\s*([-*•·]|\d+\.)\s+/, "");

      // Header: name (first non-empty line), contact (second non-empty line if it looks like contact)
      let idx = 0;
      while (idx < lines.length && !lines[idx].trim()) idx++;
      if (idx < lines.length) {
        const name = clean(lines[idx]);
        writeLines(name, { size: 20, style: "bold", align: "center", lineGap: 2 });
        idx++;
      }
      // Contact line(s)
      while (idx < lines.length) {
        const t = lines[idx].trim();
        if (!t) { idx++; break; }
        const looksContact = /@|\|| \u2022 |linkedin|github|http|\+?\d[\d\s().-]{6,}/i.test(t) && !isHeading(t);
        if (!looksContact) break;
        writeLines(clean(t), { size: 10, style: "normal", align: "center", lineGap: 2 });
        idx++;
      }
      y += 4;
      drawDivider();

      // Body
      for (; idx < lines.length; idx++) {
        const rawLine = lines[idx];
        const t = rawLine.trim();
        if (!t) { y += 6; continue; }

        if (isHeading(rawLine)) {
          y += 4;
          writeLines(clean(rawLine).toUpperCase(), { size: 12, style: "bold", lineGap: 2 });
          drawDivider();
          continue;
        }

        if (isBullet(rawLine)) {
          const text = clean(bulletText(rawLine));
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10.5);
          const lh = 10.5 * 1.3;
          const wrapped = doc.splitTextToSize(text, maxWidth - 14) as string[];
          wrapped.forEach((line, i) => {
            ensureSpace(lh);
            if (i === 0) doc.text("•", marginX + 2, y);
            doc.text(line, marginX + 14, y);
            y += lh;
          });
          y += 2;
          continue;
        }

        // Bold-leading line like "**Role** — Company"
        const boldMatch = rawLine.match(/^\s*\*\*(.+?)\*\*\s*(.*)$/);
        if (boldMatch) {
          const bold = boldMatch[1];
          const rest = boldMatch[2];
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          const lh = 11 * 1.3;
          ensureSpace(lh);
          const boldWidth = doc.getTextWidth(bold);
          doc.text(bold, marginX, y);
          if (rest) {
            doc.setFont("helvetica", "normal");
            doc.text(" " + rest, marginX + boldWidth, y);
          }
          y += lh + 2;
          continue;
        }

        writeLines(clean(rawLine), { size: 10.5, style: "normal", lineGap: 2 });
      }

      doc.save("optimized-resume.pdf");
      toast.success("Resume downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    }
  };

  const resetAnalysis = () => {
    setUploadedFile(null);
    setResumeText("");
    setAnalysisResult(null);
    setShowTextInput(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container px-4 max-w-4xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="w-16 h-16 rounded-2xl bg-resume/20 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-resume" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Resume Agent</h1>
            <p className="text-muted-foreground">
              Upload your resume and let AI optimize it for ATS systems and your target role.
            </p>
          </motion.div>

          {/* Target Role Input */}
          {!analysisResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mb-6"
            >
              <label className="block text-sm font-medium mb-2">Target Role (Optional)</label>
              <Input
                placeholder="e.g., Senior Frontend Developer, Data Scientist..."
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="max-w-md"
              />
            </motion.div>
          )}

          {/* Upload Section */}
          {!uploadedFile && !analysisResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <button
                type="button"
                onClick={handleUploadClick}
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-resume/30 rounded-2xl cursor-pointer bg-resume/5 hover:bg-resume/10 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-12 h-12 text-resume mb-4" />
                  <p className="mb-2 text-lg font-semibold">
                    Drop your resume here
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Upload PDF or TXT, or paste text below
                  </p>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".txt,.pdf,.doc,.docx"
                onChange={handleFileUpload}
              />

              <div className="mt-6">
                <p className="text-sm text-muted-foreground mb-2">Or paste your resume text:</p>
                <Textarea
                  placeholder="Paste your resume content here..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  className="min-h-[200px] mb-4"
                />
                {resumeText && (
                  <Button 
                    variant="resume" 
                    onClick={() => analyzeResume(resumeText)}
                    disabled={isAnalyzing}
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Analyze Resume
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {/* Show text input for PDF/DOC files */}
          {showTextInput && !analysisResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="p-4 rounded-xl bg-resume/10 border border-resume/30 mb-4">
                <p className="text-sm">
                  <strong>File uploaded:</strong> {uploadedFile?.name}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Please paste your resume text below for AI analysis:
                </p>
              </div>
              <Textarea
                placeholder="Paste your resume content here..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                className="min-h-[200px] mb-4"
              />
              <Button 
                variant="resume" 
                onClick={() => analyzeResume(resumeText)}
                disabled={isAnalyzing || !resumeText.trim()}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Analyze Resume
              </Button>
            </motion.div>
          )}

          {/* Analyzing State */}
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 rounded-full bg-resume/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Sparkles className="w-8 h-8 text-resume" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Analyzing Your Resume...</h2>
              <p className="text-muted-foreground mb-6">
                Our AI is scanning for improvements and ATS optimization opportunities.
              </p>
              <Progress value={66} className="max-w-xs mx-auto" />
            </motion.div>
          )}

          {/* Analysis Complete */}
          {analysisResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Score Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-resume/20 to-resume/5 border border-resume/30 text-center">
                  <Target className="w-8 h-8 text-resume mx-auto mb-2" />
                  <div className="text-3xl font-bold text-resume">{analysisResult.atsScore}%</div>
                  <div className="text-sm text-muted-foreground">ATS Score</div>
                </div>
                <div className="p-6 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30 text-center">
                  <Zap className="w-8 h-8 text-accent mx-auto mb-2" />
                  <div className="text-3xl font-bold text-accent">{analysisResult.improvements.length}</div>
                  <div className="text-sm text-muted-foreground">Improvements</div>
                </div>
                <div className="p-6 rounded-2xl bg-gradient-to-br from-interview/20 to-interview/5 border border-interview/30 text-center">
                  <CheckCircle2 className="w-8 h-8 text-interview mx-auto mb-2" />
                  <div className="text-3xl font-bold text-interview">+{analysisResult.scoreIncrease}%</div>
                  <div className="text-sm text-muted-foreground">Score Increase</div>
                </div>
              </div>

              {/* Key Changes */}
              {analysisResult.keyChanges && analysisResult.keyChanges.length > 0 && (
                <div className="p-6 rounded-2xl bg-card border border-border/50">
                  <h3 className="text-lg font-semibold mb-4">Key Changes Made</h3>
                  <ul className="space-y-2">
                    {analysisResult.keyChanges.map((change, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                        <span className="text-sm">{change}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improvements List */}
              <div className="p-6 rounded-2xl bg-card border border-border/50">
                <h3 className="text-lg font-semibold mb-4">Detailed Improvements</h3>
                <div className="space-y-3">
                  {analysisResult.improvements.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      {item.type === "success" ? (
                        <CheckCircle2 className="w-5 h-5 text-accent mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-jobscout mt-0.5" />
                      )}
                      <span className="text-sm">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Optimized Resume */}
              <div className="p-6 rounded-2xl bg-card border border-border/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Optimized Resume</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={copyOptimizedResume}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 max-h-[400px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm font-mono">
                    {analysisResult.optimizedResume}
                  </pre>
                </div>
              </div>

              {/* Additional Suggestions */}
              {analysisResult.additionalSuggestions && analysisResult.additionalSuggestions.length > 0 && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-jobscout/10 to-transparent border border-jobscout/30">
                  <h3 className="text-lg font-semibold mb-4">Additional Suggestions</h3>
                  <ul className="space-y-2">
                    {analysisResult.additionalSuggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-jobscout mt-0.5 shrink-0" />
                        <span className="text-sm">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="resume" size="lg" onClick={downloadOptimizedResume}>
                  <Download className="w-5 h-5 mr-2" />
                  Download Optimized Resume
                </Button>
                <Button variant="outline" size="lg" onClick={resetAnalysis}>
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Analyze Another Resume
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Resume;
