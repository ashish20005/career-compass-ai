import { motion } from "framer-motion";
import { AgentCard } from "@/components/ui/agent-card";
import { FileText, BookOpen, Search, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

const agents = [
  {
    agent: "resume" as const,
    icon: FileText,
    title: "Resume Agent",
    description: "Upload your resume and get ATS-optimized improvements tailored for your target role.",
    status: "active" as const,
    stats: [{ label: "ATS Score", value: "85%" }, { label: "Improvements", value: "12" }],
    href: "/resume",
  },
  {
    agent: "skillgap" as const,
    icon: BookOpen,
    title: "Skill Gap Agent",
    description: "Identify missing skills for your dream job and get a personalized learning roadmap.",
    status: "processing" as const,
    stats: [{ label: "Skills Matched", value: "24" }, { label: "To Learn", value: "8" }],
    href: "/skills",
  },
  {
    agent: "jobscout" as const,
    icon: Search,
    title: "Job Scout Agent",
    description: "Find high-match job opportunities based on your skills, experience, and preferences.",
    status: "active" as const,
    stats: [{ label: "Jobs Found", value: "156" }, { label: "High Match", value: "23" }],
    href: "/jobs",
  },
  {
    agent: "interview" as const,
    icon: MessageSquare,
    title: "Interview Agent",
    description: "Practice with adaptive mock interviews and get detailed feedback to improve.",
    status: "idle" as const,
    stats: [{ label: "Sessions", value: "8" }, { label: "Confidence", value: "78%" }],
    href: "/interview",
  },
];

export function AgentsSection() {
  return (
    <section className="py-24 relative">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Meet Your <span className="text-gradient">AI Agents</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Four specialized agents work in harmony to accelerate your career growth.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {agents.map((agent) => (
            <motion.div key={agent.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}>
              <Link to={agent.href}>
                <AgentCard {...agent} />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
