import { motion } from "framer-motion";
import { 
  Brain, 
  RefreshCw, 
  Shield, 
  Zap, 
  BarChart3, 
  Bell 
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Autonomous Learning",
    description: "Agents continuously learn from your progress and adapt recommendations in real-time.",
  },
  {
    icon: RefreshCw,
    title: "Closed Feedback Loop",
    description: "Interview feedback updates skill plans, which improve job matching and resume optimization.",
  },
  {
    icon: Shield,
    title: "ATS Optimization",
    description: "Resumes are automatically optimized to pass Applicant Tracking Systems with high scores.",
  },
  {
    icon: Zap,
    title: "Instant Analysis",
    description: "Get immediate insights on your skills, gaps, and job compatibility within seconds.",
  },
  {
    icon: BarChart3,
    title: "Progress Tracking",
    description: "Monitor your career readiness with detailed analytics and improvement metrics.",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description: "Receive alerts only for high-match opportunities that align with your goals.",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Agentic Intelligence at Work
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our multi-agent system operates autonomously, creating a self-improving 
            career development ecosystem.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
