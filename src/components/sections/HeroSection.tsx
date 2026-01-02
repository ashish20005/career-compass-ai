import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, Target, TrendingUp } from "lucide-react";
import { runAgent } from "@/lib/agent-logic"; 

const stats = [
  { icon: Target, value: "92%", label: "Match Rate" },
  { icon: TrendingUp, value: "3x", label: "Career Growth" },
];

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24">
      <div className="container relative z-10 px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl font-bold mb-6"
          >
            AI Career Mentor
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center gap-4 mb-16"
          >
            <Button 
              size="xl" 
              onClick={() => {
                const results = runAgent(["f1 racer", "car mechanic"]);
                alert(`Agent Found Match: ${results[0].title} (${results[0].matchScore}%)`);
              }}
            >
              Execute Agent Now
              <Sparkles className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>

          <div className="flex justify-center gap-12">
            {stats.map((stat, i) => (
              <div key={i} className="flex items-center gap-3">
                <stat.icon className="w-6 h-6 text-primary" />
                <div className="text-left">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
