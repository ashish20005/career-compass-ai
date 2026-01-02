import { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Download,
  Sparkles,
  Target,
  Zap
} from "lucide-react";

const Resume = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setIsAnalyzing(true);
      // Simulate analysis
      setTimeout(() => {
        setIsAnalyzing(false);
        setAnalysisComplete(true);
      }, 2000);
    }
  };

  const improvements = [
    { type: "success", text: "Added quantifiable achievements to experience section" },
    { type: "success", text: "Improved action verbs for bullet points" },
    { type: "success", text: "Optimized keywords for ATS compatibility" },
    { type: "warning", text: "Consider adding relevant certifications" },
    { type: "warning", text: "Skills section could be more specific" },
  ];

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

          {/* Upload Section */}
          {!uploadedFile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-resume/30 rounded-2xl cursor-pointer bg-resume/5 hover:bg-resume/10 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-12 h-12 text-resume mb-4" />
                  <p className="mb-2 text-lg font-semibold">
                    Drop your resume here
                  </p>
                  <p className="text-sm text-muted-foreground">
                    PDF, DOC, or DOCX (Max 10MB)
                  </p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                />
              </label>
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
          {analysisComplete && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Score Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-resume/20 to-resume/5 border border-resume/30 text-center">
                  <Target className="w-8 h-8 text-resume mx-auto mb-2" />
                  <div className="text-3xl font-bold text-resume">85%</div>
                  <div className="text-sm text-muted-foreground">ATS Score</div>
                </div>
                <div className="p-6 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30 text-center">
                  <Zap className="w-8 h-8 text-accent mx-auto mb-2" />
                  <div className="text-3xl font-bold text-accent">12</div>
                  <div className="text-sm text-muted-foreground">Improvements</div>
                </div>
                <div className="p-6 rounded-2xl bg-gradient-to-br from-interview/20 to-interview/5 border border-interview/30 text-center">
                  <CheckCircle2 className="w-8 h-8 text-interview mx-auto mb-2" />
                  <div className="text-3xl font-bold text-interview">+23%</div>
                  <div className="text-sm text-muted-foreground">Score Increase</div>
                </div>
              </div>

              {/* Improvements List */}
              <div className="p-6 rounded-2xl bg-card border border-border/50">
                <h3 className="text-lg font-semibold mb-4">Suggested Improvements</h3>
                <div className="space-y-3">
                  {improvements.map((item, index) => (
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

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="resume" size="lg">
                  <Download className="w-5 h-5 mr-2" />
                  Download Optimized Resume
                </Button>
                <Button variant="outline" size="lg" onClick={() => {
                  setUploadedFile(null);
                  setAnalysisComplete(false);
                }}>
                  Upload Different Resume
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
