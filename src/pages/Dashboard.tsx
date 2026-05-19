import { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AgentCard } from "@/components/ui/agent-card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  BookOpen, 
  Search, 
  MessageSquare,
  TrendingUp,
  Target,
  Award,
  Clock,
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";

const agents = [
  {
    agent: "resume" as const,
    icon: FileText,
    title: "Resume Agent",
    description: "Upload your resume and get ATS-optimized improvements tailored for your target role.",
    status: "active" as const,
    stats: [
      { label: "ATS Score", value: "85%" },
      { label: "Improvements", value: "12" },
    ],
    href: "/resume",
  },
  {
    agent: "skillgap" as const,
    icon: BookOpen,
    title: "Skill Gap Agent",
    description: "Identify missing skills for your dream job and get a personalized learning roadmap.",
    status: "processing" as const,
    stats: [
      { label: "Skills Matched", value: "24" },
      { label: "To Learn", value: "8" },
    ],
    href: "/skills",
  },
  {
    agent: "jobscout" as const,
    icon: Search,
    title: "Job Scout Agent",
    description: "Find high-match job opportunities based on your skills, experience, and preferences.",
    status: "active" as const,
    stats: [
      { label: "Jobs Found", value: "156" },
      { label: "High Match", value: "23" },
    ],
    href: "/jobs",
  },
  {
    agent: "interview" as const,
    icon: MessageSquare,
    title: "Interview Agent",
    description: "Practice with adaptive mock interviews and get detailed feedback to improve.",
    status: "idle" as const,
    stats: [
      { label: "Sessions", value: "8" },
      { label: "Confidence", value: "78%" },
    ],
    href: "/interview",
  },
];

const quickStats = [
  { icon: TrendingUp, label: "Career Score", value: "76", change: "+5" },
  { icon: Target, label: "Job Matches", value: "23", change: "+8" },
  { icon: Award, label: "Skills Gained", value: "12", change: "+3" },
  { icon: Clock, label: "Hours Saved", value: "45", change: "+12" },
];

const Dashboard = () => {
  const [overallProgress] = useState(68);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold mb-2">Welcome back! 👋</h1>
            <p className="text-muted-foreground">
              Your AI agents are working hard to advance your career.
            </p>
          </motion.div>

          {/* Overall Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-interview/10 to-accent/10 border border-primary/20"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">Career Readiness</h2>
                <p className="text-sm text-muted-foreground">
                  Overall progress towards your goal
                </p>
              </div>
              <span className="text-3xl font-bold text-gradient">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-3" />
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            {quickStats.map((stat, index) => (
              <div
                key={stat.label}
                className="p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs text-accent font-medium">{stat.change}</span>
                </div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Agent Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Your AI Agents</h2>
              <Button variant="ghost" size="sm">
                View All Activity
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {agents.map((agent) => (
                <Link key={agent.title} to={agent.href}>
                  <AgentCard {...agent} />
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            <Button variant="resume" size="lg" className="w-full" asChild>
              <Link to="/resume">
                <FileText className="w-5 h-5 mr-2" />
                Upload Resume
              </Link>
            </Button>
            <Button variant="skillgap" size="lg" className="w-full" asChild>
              <Link to="/skills">
                <BookOpen className="w-5 h-5 mr-2" />
                Add Skills
              </Link>
            </Button>
            <Button variant="interview" size="lg" className="w-full" asChild>
              <Link to="/interview">
                <MessageSquare className="w-5 h-5 mr-2" />
                Start Interview
              </Link>
            </Button>
          </motion.div>

          {/* Interview Prep highlight */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6"
          >
            <Link
              to="/interview"
              className="block p-6 rounded-2xl border border-primary/30 bg-gradient-to-r from-interview/10 via-primary/10 to-accent/10 hover:border-primary/60 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-interview to-primary flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">AI Resume Interview Question Generator</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload your resume (PDF / DOCX) and get personalized interview questions across technical, project, experience, and HR rounds.
                  </p>
                </div>
                <Button variant="default">Try it</Button>
              </div>
            </Link>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
