import { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Search, 
  MapPin, 
  Building2, 
  DollarSign,
  Clock,
  Star,
  Bookmark,
  ExternalLink,
  Filter,
  Bell
} from "lucide-react";

const jobListings = [
  {
    id: 1,
    title: "Senior Frontend Developer",
    company: "TechCorp Inc.",
    location: "San Francisco, CA",
    salary: "$150K - $180K",
    match: 95,
    posted: "2 days ago",
    type: "Full-time",
    skills: ["React", "TypeScript", "GraphQL"],
    featured: true,
  },
  {
    id: 2,
    title: "Full Stack Engineer",
    company: "StartupXYZ",
    location: "Remote",
    salary: "$120K - $150K",
    match: 88,
    posted: "5 days ago",
    type: "Full-time",
    skills: ["Node.js", "React", "PostgreSQL"],
    featured: false,
  },
  {
    id: 3,
    title: "Software Engineer II",
    company: "BigTech Solutions",
    location: "New York, NY",
    salary: "$130K - $160K",
    match: 82,
    posted: "1 week ago",
    type: "Full-time",
    skills: ["JavaScript", "Python", "AWS"],
    featured: false,
  },
  {
    id: 4,
    title: "Frontend Developer",
    company: "Digital Agency Pro",
    location: "Austin, TX",
    salary: "$100K - $130K",
    match: 78,
    posted: "3 days ago",
    type: "Full-time",
    skills: ["React", "CSS", "Figma"],
    featured: false,
  },
];

const Jobs = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [savedJobs, setSavedJobs] = useState<number[]>([]);

  const toggleSaveJob = (id: number) => {
    setSavedJobs(prev => 
      prev.includes(id) ? prev.filter(j => j !== id) : [...prev, id]
    );
  };

  const filteredJobs = jobListings.filter(job =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <div className="w-16 h-16 rounded-2xl bg-jobscout/20 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-jobscout" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Job Scout Agent</h1>
            <p className="text-muted-foreground">
              AI-curated job matches based on your skills and preferences.
            </p>
          </motion.div>

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 p-6 rounded-2xl bg-card border border-border/50"
          >
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search jobs or companies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <Button variant="jobscout">
                <Bell className="w-4 h-4 mr-2" />
                Set Alert
              </Button>
            </div>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border/50">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-jobscout">{jobListings.length}</span>
                <span className="text-sm text-muted-foreground">Jobs Found</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-accent">{jobListings.filter(j => j.match >= 80).length}</span>
                <span className="text-sm text-muted-foreground">High Match</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{savedJobs.length}</span>
                <span className="text-sm text-muted-foreground">Saved</span>
              </div>
            </div>
          </motion.div>

          {/* Job Listings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {filteredJobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className={`p-6 rounded-2xl border transition-all hover:shadow-lg ${
                  job.featured 
                    ? "bg-gradient-to-r from-jobscout/10 to-transparent border-jobscout/30" 
                    : "bg-card border-border/50 hover:border-jobscout/30"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {job.featured && (
                        <Badge className="bg-jobscout">
                          <Star className="w-3 h-3 mr-1" />
                          Top Match
                        </Badge>
                      )}
                      <Badge variant="outline">{job.type}</Badge>
                    </div>
                    
                    <h3 className="text-xl font-semibold mb-1">{job.title}</h3>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        {job.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {job.salary}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {job.posted}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {job.skills.map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-jobscout">{job.match}%</div>
                      <div className="text-xs text-muted-foreground">Match</div>
                      <Progress value={job.match} className="w-20 h-2 mt-1" />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => toggleSaveJob(job.id)}
                        className={savedJobs.includes(job.id) ? "text-jobscout" : ""}
                      >
                        <Bookmark className={`w-5 h-5 ${savedJobs.includes(job.id) ? "fill-current" : ""}`} />
                      </Button>
                      <Button variant="jobscout" size="sm">
                        Apply
                        <ExternalLink className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Jobs;
