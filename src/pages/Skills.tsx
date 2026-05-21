import { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { 
  BookOpen, 
  Plus, 
  X, 
  Sparkles,
  TrendingUp,
  Target,
  BookMarked,
  CheckCircle2,
  Loader2,
  Briefcase,
  ArrowRight
} from "lucide-react";

const suggestedSkills = [
  "React", "TypeScript", "Node.js", "Python", "AWS", "Docker", 
  "GraphQL", "PostgreSQL", "Kubernetes", "Machine Learning",
  "Java", "C++", "Go", "Ruby", "PHP", "MongoDB", "Redis",
  "TensorFlow", "PyTorch", "Vue.js", "Angular", "Swift", "Kotlin"
];

interface JobMatch {
  title: string;
  company: string;
  match: number;
  required: string[];
  missing: string[];
  salaryRange?: string;
  demandLevel?: string;
}

interface LearningItem {
  skill: string;
  priority: string;
  duration: string;
  reason?: string;
  resources?: string[];
}

interface AnalysisResult {
  jobMatches: JobMatch[];
  learningPath: LearningItem[];
  skillGaps: string[];
  strengths: string[];
  careerAdvice: string;
}

const Skills = () => {
  const { requireAuth } = useAuth();
  const [skills, setSkills] = useState<string[]>(["JavaScript", "HTML", "CSS", "Git"]);
  const [newSkill, setNewSkill] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const addSkill = (skill: string) => {
    if (skill && !skills.includes(skill)) {
      setSkills([...skills, skill]);
    }
    setNewSkill("");
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const analyzeSkills = async () => {
    if (skills.length === 0) {
      toast.error("Please add at least one skill");
      return;
    }
    const authed = await requireAuth("Sign in with Google to get your personalized skill analysis.");
    if (!authed) return;


    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-skills', {
        body: { skills }
      });

      if (error) throw error;

      setAnalysisResult(data);
      toast.success("Skills analyzed successfully!");
    } catch (error: any) {
      console.error("Error analyzing skills:", error);
      toast.error(error.message || "Failed to analyze skills. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container px-4 max-w-5xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="w-16 h-16 rounded-2xl bg-skillgap/20 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-skillgap" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Skill Gap Agent</h1>
            <p className="text-muted-foreground">
              Enter your skills and discover which jobs you're perfect for.
            </p>
          </motion.div>

          {/* Skills Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 p-6 rounded-2xl bg-card border border-border/50"
          >
            <h3 className="text-lg font-semibold mb-4">Your Skills</h3>
            
            {/* Add skill input */}
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Add a skill..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSkill(newSkill)}
                className="flex-1"
              />
              <Button onClick={() => addSkill(newSkill)} variant="skillgap">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Current skills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {skills.map((skill) => (
                <Badge 
                  key={skill} 
                  variant="secondary"
                  className="px-3 py-1.5 text-sm flex items-center gap-2"
                >
                  {skill}
                  <X 
                    className="w-3 h-3 cursor-pointer hover:text-destructive" 
                    onClick={() => removeSkill(skill)}
                  />
                </Badge>
              ))}
            </div>

            {/* Suggested skills */}
            <div className="pt-4 border-t border-border/50">
              <p className="text-sm text-muted-foreground mb-2">Suggested skills:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedSkills.filter(s => !skills.includes(s)).slice(0, 10).map((skill) => (
                  <Badge 
                    key={skill} 
                    variant="outline"
                    className="px-3 py-1.5 text-sm cursor-pointer hover:bg-skillgap/10 hover:border-skillgap/30"
                    onClick={() => addSkill(skill)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Analyze Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <Button 
              variant="skillgap" 
              size="xl" 
              onClick={analyzeSkills}
              disabled={isAnalyzing || skills.length === 0}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Analyze My Skills
                </>
              )}
            </Button>
          </motion.div>

          {/* Analysis Results */}
          {analysisResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Career Advice */}
              {analysisResult.careerAdvice && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/30">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Career Advice
                  </h3>
                  <p className="text-muted-foreground">{analysisResult.careerAdvice}</p>
                </div>
              )}

              {/* Strengths & Gaps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysisResult.strengths && analysisResult.strengths.length > 0 && (
                  <div className="p-6 rounded-2xl bg-card border border-border/50">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-accent" />
                      Your Strengths
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.strengths.map((skill, index) => (
                        <Badge key={index} className="bg-accent/20 text-accent border-0">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {analysisResult.skillGaps && analysisResult.skillGaps.length > 0 && (
                  <div className="p-6 rounded-2xl bg-card border border-border/50">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Target className="w-5 h-5 text-jobscout" />
                      Skills to Develop
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.skillGaps.map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-jobscout border-jobscout/30">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Job Matches */}
              <div className="p-6 rounded-2xl bg-card border border-border/50">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-skillgap" />
                    <h3 className="text-lg font-semibold">Best Job Matches ({analysisResult.jobMatches.length})</h3>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysisResult.jobMatches.map((job, index) => (
                    <div 
                      key={index}
                      className="p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{job.title}</h4>
                          <p className="text-sm text-muted-foreground">{job.company}</p>
                          {job.salaryRange && (
                            <p className="text-xs text-skillgap mt-1">{job.salaryRange}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-skillgap">{job.match}%</span>
                          <p className="text-xs text-muted-foreground">Match</p>
                          {job.demandLevel && (
                            <Badge 
                              variant="outline" 
                              className={`mt-1 text-xs ${
                                job.demandLevel === 'High' 
                                  ? 'border-accent text-accent' 
                                  : job.demandLevel === 'Medium'
                                  ? 'border-jobscout text-jobscout'
                                  : ''
                              }`}
                            >
                              {job.demandLevel} Demand
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Progress value={job.match} className="h-2 mb-3" />
                      <div className="flex flex-wrap gap-1">
                        {job.required.slice(0, 3).map((skill) => (
                          <Badge key={skill} className="bg-accent/20 text-accent border-0 text-xs">
                            <CheckCircle2 className="w-2 h-2 mr-1" />
                            {skill}
                          </Badge>
                        ))}
                        {job.missing.slice(0, 2).map((skill) => (
                          <Badge key={skill} variant="outline" className="text-muted-foreground text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Learning Roadmap */}
              <div className="p-6 rounded-2xl bg-card border border-border/50">
                <div className="flex items-center gap-2 mb-6">
                  <BookMarked className="w-5 h-5 text-skillgap" />
                  <h3 className="text-lg font-semibold">Recommended Learning Path</h3>
                </div>
                <div className="space-y-4">
                  {analysisResult.learningPath.map((item, index) => (
                    <div 
                      key={index}
                      className="p-4 rounded-xl border border-border/50 hover:border-skillgap/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start gap-3">
                          <span className="w-8 h-8 rounded-full bg-skillgap/20 flex items-center justify-center text-sm font-bold text-skillgap shrink-0">
                            {index + 1}
                          </span>
                          <div>
                            <h4 className="font-semibold">{item.skill}</h4>
                            <p className="text-sm text-muted-foreground">{item.duration}</p>
                            {item.reason && (
                              <p className="text-sm text-muted-foreground mt-1">{item.reason}</p>
                            )}
                          </div>
                        </div>
                        <Badge 
                          variant={item.priority === "High" ? "default" : "secondary"}
                          className={item.priority === "High" ? "bg-skillgap" : ""}
                        >
                          {item.priority} Priority
                        </Badge>
                      </div>
                      {item.resources && item.resources.length > 0 && (
                        <div className="ml-11 mt-2">
                          <p className="text-xs text-muted-foreground mb-1">Resources:</p>
                          <div className="flex flex-wrap gap-1">
                            {item.resources.slice(0, 3).map((resource, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {resource}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-skillgap/20 to-skillgap/5 border border-skillgap/30 text-center">
                  <TrendingUp className="w-8 h-8 text-skillgap mx-auto mb-2" />
                  <div className="text-3xl font-bold text-skillgap">{skills.length}</div>
                  <div className="text-sm text-muted-foreground">Skills Added</div>
                </div>
                <div className="p-6 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30 text-center">
                  <Target className="w-8 h-8 text-accent mx-auto mb-2" />
                  <div className="text-3xl font-bold text-accent">{analysisResult.jobMatches.length}</div>
                  <div className="text-sm text-muted-foreground">Jobs Matched</div>
                </div>
                <div className="p-6 rounded-2xl bg-gradient-to-br from-interview/20 to-interview/5 border border-interview/30 text-center">
                  <BookMarked className="w-8 h-8 text-interview mx-auto mb-2" />
                  <div className="text-3xl font-bold text-interview">{analysisResult.learningPath.length}</div>
                  <div className="text-sm text-muted-foreground">Skills to Learn</div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Skills;
