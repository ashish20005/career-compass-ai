import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  MessageSquare, 
  Play, 
  Send,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Brain,
  Clock,
  Sparkles,
  Loader2,
  User,
  Bot
} from "lucide-react";

const interviewTypes = [
  { id: "HR", label: "HR Round", description: "Behavioral & cultural fit questions", duration: "20 min" },
  { id: "Technical", label: "Technical", description: "Coding & system design questions", duration: "45 min" },
  { id: "Behavioral", label: "Behavioral", description: "STAR method response practice", duration: "30 min" },
];

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AnalysisResult {
  overallScore: number;
  confidenceScore: number;
  communicationScore: number;
  technicalScore: number;
  strengths: string[];
  areasToImprove: string[];
  detailedFeedback: string;
  recommendedResources: string[];
  skillsToImprove: string[];
}

const Interview = () => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isInterviewing, setIsInterviewing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startInterview = async () => {
    if (!selectedType) return;
    
    setIsInterviewing(true);
    setMessages([]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('interview-chat', {
        body: { 
          action: 'start',
          interviewType: selectedType
        }
      });

      if (error) throw error;

      setMessages([{ role: "assistant", content: data.message }]);
    } catch (error: any) {
      console.error("Error starting interview:", error);
      toast.error("Failed to start interview. Please try again.");
      setIsInterviewing(false);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('interview-chat', {
        body: { 
          messages: [...messages, { role: "user", content: userMessage }],
          interviewType: selectedType
        }
      });

      if (error) throw error;

      setMessages(prev => [...prev, { role: "assistant", content: data.message }]);
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error("Failed to get response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const endInterview = async () => {
    if (messages.length < 2) {
      toast.error("Please have at least one exchange before ending the interview.");
      return;
    }

    setIsAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke('interview-chat', {
        body: { 
          messages,
          interviewType: selectedType,
          action: 'analyze'
        }
      });

      if (error) throw error;

      setAnalysis(data.analysis);
      setIsInterviewing(false);
      setShowResults(true);
    } catch (error: any) {
      console.error("Error analyzing interview:", error);
      toast.error("Failed to analyze interview. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetInterview = () => {
    setSelectedType(null);
    setIsInterviewing(false);
    setShowResults(false);
    setMessages([]);
    setAnalysis(null);
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
            className="text-center mb-8"
          >
            <div className="w-16 h-16 rounded-2xl bg-interview/20 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-interview" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Interview Agent</h1>
            <p className="text-muted-foreground">
              Practice with AI-powered mock interviews and get personalized feedback.
            </p>
          </motion.div>

          {/* Interview Type Selection */}
          {!isInterviewing && !showResults && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-semibold text-center mb-4">Choose Interview Type</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {interviewTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`p-6 rounded-2xl border-2 transition-all text-left ${
                      selectedType === type.id
                        ? "border-interview bg-interview/10"
                        : "border-border/50 hover:border-interview/30"
                    }`}
                  >
                    <h4 className="font-semibold mb-1">{type.label}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{type.description}</p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {type.duration}
                    </div>
                  </button>
                ))}
              </div>

              <div className="text-center pt-4">
                <Button 
                  variant="interview" 
                  size="xl" 
                  onClick={startInterview}
                  disabled={!selectedType || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Start Interview
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Chat Interface */}
          <AnimatePresence mode="wait">
            {isInterviewing && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {/* Chat Messages */}
                <div className="h-[450px] overflow-y-auto rounded-2xl bg-card border border-border/50 p-4 space-y-4">
                  {messages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-interview/20 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-interview" />
                        </div>
                      )}
                      <div className={`max-w-[80%] p-4 rounded-2xl ${
                        message.role === 'user' 
                          ? 'bg-interview text-interview-foreground' 
                          : 'bg-muted'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                      {message.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 rounded-full bg-interview/20 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-interview" />
                      </div>
                      <div className="bg-muted p-4 rounded-2xl">
                        <Loader2 className="w-4 h-4 animate-spin text-interview" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your response..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button 
                    variant="interview" 
                    size="icon"
                    onClick={sendMessage}
                    disabled={isLoading || !inputValue.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>

                {/* Actions */}
                <div className="flex justify-center gap-4 pt-4">
                  <Button variant="outline" size="lg" onClick={resetInterview}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Cancel Interview
                  </Button>
                  <Button 
                    variant="interview" 
                    size="lg" 
                    onClick={endInterview}
                    disabled={isAnalyzing || messages.length < 2}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        End & Get Feedback
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Results */}
            {showResults && analysis && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Score Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-interview/20 to-interview/5 border border-interview/30 text-center">
                    <TrendingUp className="w-6 h-6 text-interview mx-auto mb-2" />
                    <div className="text-2xl font-bold text-interview">{analysis.overallScore}%</div>
                    <div className="text-xs text-muted-foreground">Overall</div>
                  </div>
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30 text-center">
                    <Brain className="w-6 h-6 text-accent mx-auto mb-2" />
                    <div className="text-2xl font-bold text-accent">{analysis.technicalScore}%</div>
                    <div className="text-xs text-muted-foreground">Technical</div>
                  </div>
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-resume/20 to-resume/5 border border-resume/30 text-center">
                    <MessageSquare className="w-6 h-6 text-resume mx-auto mb-2" />
                    <div className="text-2xl font-bold text-resume">{analysis.communicationScore}%</div>
                    <div className="text-xs text-muted-foreground">Communication</div>
                  </div>
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-jobscout/20 to-jobscout/5 border border-jobscout/30 text-center">
                    <Sparkles className="w-6 h-6 text-jobscout mx-auto mb-2" />
                    <div className="text-2xl font-bold text-jobscout">{analysis.confidenceScore}%</div>
                    <div className="text-xs text-muted-foreground">Confidence</div>
                  </div>
                </div>

                {/* Detailed Feedback */}
                <div className="p-6 rounded-2xl bg-card border border-border/50">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-interview" />
                    AI Feedback
                  </h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{analysis.detailedFeedback}</p>
                </div>

                {/* Strengths & Improvements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 rounded-2xl bg-card border border-border/50">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-accent" />
                      Strengths
                    </h4>
                    <ul className="space-y-2">
                      {analysis.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-6 rounded-2xl bg-card border border-border/50">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-jobscout" />
                      Areas to Improve
                    </h4>
                    <ul className="space-y-2">
                      {analysis.areasToImprove.map((area, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <AlertCircle className="w-4 h-4 text-jobscout mt-0.5 flex-shrink-0" />
                          {area}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Skills to Improve */}
                <div className="p-6 rounded-2xl bg-gradient-to-r from-skillgap/10 to-transparent border border-skillgap/30">
                  <h3 className="text-lg font-semibold mb-3">Skills to Focus On</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    These skills can help you perform better in future interviews.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {analysis.skillsToImprove.map((skill) => (
                      <Badge key={skill} className="bg-skillgap">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-center gap-4">
                  <Button variant="outline" size="lg" onClick={resetInterview}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    New Interview
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Interview;
