import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

const agentCardVariants = cva(
  "relative overflow-hidden rounded-2xl p-6 transition-all duration-300 cursor-pointer group",
  {
    variants: {
      agent: {
        resume: "bg-gradient-to-br from-resume/10 to-resume/5 border-2 border-resume/20 hover:border-resume/40 hover:shadow-[0_0_30px_-5px_hsl(var(--resume)/0.3)]",
        skillgap: "bg-gradient-to-br from-skillgap/10 to-skillgap/5 border-2 border-skillgap/20 hover:border-skillgap/40 hover:shadow-[0_0_30px_-5px_hsl(var(--skillgap)/0.3)]",
        jobscout: "bg-gradient-to-br from-jobscout/10 to-jobscout/5 border-2 border-jobscout/20 hover:border-jobscout/40 hover:shadow-[0_0_30px_-5px_hsl(var(--jobscout)/0.3)]",
        interview: "bg-gradient-to-br from-interview/10 to-interview/5 border-2 border-interview/20 hover:border-interview/40 hover:shadow-[0_0_30px_-5px_hsl(var(--interview)/0.3)]",
      },
    },
    defaultVariants: {
      agent: "resume",
    },
  }
);

const iconWrapperVariants = cva(
  "w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110",
  {
    variants: {
      agent: {
        resume: "bg-resume/20 text-resume",
        skillgap: "bg-skillgap/20 text-skillgap",
        jobscout: "bg-jobscout/20 text-jobscout",
        interview: "bg-interview/20 text-interview",
      },
    },
    defaultVariants: {
      agent: "resume",
    },
  }
);

const statusDotVariants = cva(
  "w-2 h-2 rounded-full animate-pulse-ring",
  {
    variants: {
      agent: {
        resume: "bg-resume",
        skillgap: "bg-skillgap",
        jobscout: "bg-jobscout",
        interview: "bg-interview",
      },
    },
    defaultVariants: {
      agent: "resume",
    },
  }
);

export interface AgentCardProps extends VariantProps<typeof agentCardVariants> {
  icon: LucideIcon;
  title: string;
  description: string;
  status?: "active" | "idle" | "processing";
  stats?: { label: string; value: string }[];
  className?: string;
}

const AgentCard = React.forwardRef<HTMLDivElement, AgentCardProps>(
  ({ className, agent, icon: Icon, title, description, status = "idle", stats }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(agentCardVariants({ agent, className }))}
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-transparent via-transparent to-background/20" />
        
        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-3">
            <div className={cn(iconWrapperVariants({ agent }))}>
              <Icon className="w-7 h-7" />
            </div>
            <div className="flex items-center gap-2">
              <div className={cn(statusDotVariants({ agent }))} />
              <span className="text-xs text-muted-foreground capitalize">{status}</span>
            </div>
          </div>
          
          <h3 className="text-xl font-bold mb-2">{title}</h3>
          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{description}</p>
          
          {stats && stats.length > 0 && (
            <div className="flex gap-4 pt-3 border-t border-border/50">
              {stats.map((stat, index) => (
                <div key={index} className="flex flex-col">
                  <span className="text-lg font-bold">{stat.value}</span>
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    );
  }
);
AgentCard.displayName = "AgentCard";

export { AgentCard, agentCardVariants };
