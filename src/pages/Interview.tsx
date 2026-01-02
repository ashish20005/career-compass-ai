import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Play, 
  Mic,
  MicOff,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Brain,
  Clock,
  Sparkles
} from "lucide-react";

const interviewTypes = [
  { id: "hr", label: "HR Round", description: "Behavioral & cultural fit questions", duration: "20 min" },
  { id: "technical", label: "Technical", description: "Coding & system design questions", duration: "45 min" },
  { id: "behavioral", label: "Behavioral", description: "STAR method response practice", duration: "30 min" },
];

const mockQuestions = [
  "Tell me about yourself and your experience.",
  "Why are you interested in this role?",
  "Describe a challenging project you worked on.",
  "How do you handle tight deadlines?",
  "Where do you see yourself in 5 years?",
];

const Interview = () => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isInterviewing, setIsInterviewing] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [answers, setAnswers] = useState<string[]>([]);

  const startInterview = () => {
    setIsInterviewing(true);
    setCurrentQuestion(0);
    setAnswers([]);
  };

  const nextQuestion = () => {
    if (currentQuestion < mockQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setIsRecording(false);
    } else {
      setIsInterviewing(false);
      setShowResults(true);
    }
  };

  const results = {
    confidence: 78,
    technical: 85,
    communication: 72,
    improvements: [
      { type: "success", text: "Strong technical explanations" },
      { type: "success", text: "Good use of specific examples" },
      { type: "warning", text: "Work on maintaining eye contact" },
      { type: "warning", text: "Avoid filler words like 'um' and 'uh'" },
    ],
    weakAreas: ["Time management", "Conflict resolution"],
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
                  disabled={!selectedType}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Interview
                </Button>
              </div>
            </motion.div>
          )}

          {/* Interview in Progress */}
          <AnimatePresence mode="wait">
            {isInterviewing && (
              <motion.div
                key="interview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Progress */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      Question {currentQuestion + 1} of {mockQuestions.length}
                    </span>
                    <span className="text-sm font-medium">
                      {Math.round(((currentQuestion + 1) / mockQuestions.length) * 100)}%
                    </span>
                  </div>
                  <Progress value={((currentQuestion + 1) / mockQuestions.length) * 100} />
                </div>

                {/* Question Card */}
                <div className="p-8 rounded-2xl bg-gradient-to-br from-interview/10 to-interview/5 border border-interview/30 text-center">
                  <Brain className="w-12 h-12 text-interview mx-auto mb-4" />
                  <h2 className="text-2xl font-semibold mb-2">
                    {mockQuestions[currentQuestion]}
                  </h2>
                  <p className="text-muted-foreground">
                    Take your time to think and respond naturally.
                  </p>
                </div>

                {/* Recording Controls */}
                <div className="flex flex-col items-center gap-4">
                  <Button
                    variant={isRecording ? "destructive" : "interview"}
                    size="xl"
                    onClick={() => setIsRecording(!isRecording)}
                    className="rounded-full w-20 h-20"
                  >
                    {isRecording ? (
                      <MicOff className="w-8 h-8" />
                    ) : (
                      <Mic className="w-8 h-8" />
                    )}
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    {isRecording ? "Recording... Click to stop" : "Click to start recording"}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex justify-center gap-4">
                  <Button variant="outline" size="lg">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Skip Question
                  </Button>
                  <Button variant="interview" size="lg" onClick={nextQuestion}>
                    {currentQuestion < mockQuestions.length - 1 ? "Next Question" : "Finish Interview"}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Results */}
            {showResults && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Score Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-interview/20 to-interview/5 border border-interview/30 text-center">
                    <TrendingUp className="w-8 h-8 text-interview mx-auto mb-2" />
                    <div className="text-3xl font-bold text-interview">{results.confidence}%</div>
                    <div className="text-sm text-muted-foreground">Confidence Score</div>
                  </div>
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30 text-center">
                    <Brain className="w-8 h-8 text-accent mx-auto mb-2" />
                    <div className="text-3xl font-bold text-accent">{results.technical}%</div>
                    <div className="text-sm text-muted-foreground">Technical Score</div>
                  </div>
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-resume/20 to-resume/5 border border-resume/30 text-center">
                    <MessageSquare className="w-8 h-8 text-resume mx-auto mb-2" />
                    <div className="text-3xl font-bold text-resume">{results.communication}%</div>
                    <div className="text-sm text-muted-foreground">Communication</div>
                  </div>
                </div>

                {/* Feedback */}
                <div className="p-6 rounded-2xl bg-card border border-border/50">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-interview" />
                    AI Feedback
                  </h3>
                  <div className="space-y-3">
                    {results.improvements.map((item, index) => (
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

                {/* Weak Areas - Sent to Skill Gap */}
                <div className="p-6 rounded-2xl bg-gradient-to-r from-skillgap/10 to-transparent border border-skillgap/30">
                  <h3 className="text-lg font-semibold mb-3">Skills to Improve</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    These areas have been sent to your Skill Gap Agent for learning recommendations.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {results.weakAreas.map((area) => (
                      <Badge key={area} className="bg-skillgap">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-center gap-4">
                  <Button variant="outline" size="lg" onClick={() => {
                    setShowResults(false);
                    setSelectedType(null);
                  }}>
                    New Interview
                  </Button>
                  <Button variant="interview" size="lg">
                    View Full Report
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
