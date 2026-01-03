import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
  Bell,
  Loader2,
  RefreshCw,
  Briefcase
} from "lucide-react";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  match: number;
  posted: string;
  type: string;
  skills: string[];
  description?: string;
  applyUrl?: string;
  featured: boolean;
  experienceLevel?: string;
}

const Jobs = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  const toggleSaveJob = (id: string) => {
    setSavedJobs(prev => 
      prev.includes(id) ? prev.filter(j => j !== id) : [...prev, id]
    );
  };

  const addSkill = (skill: string) => {
    if (skill && !userSkills.includes(skill)) {
      setUserSkills([...userSkills, skill]);
    }
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    setUserSkills(userSkills.filter(s => s !== skill));
  };

  const searchJobs = async () => {
    setIsLoading(true);
    setHasSearched(true);

    try {
      const { data, error } = await supabase.functions.invoke('search-jobs', {
        body: { 
          query: searchQuery, 
          location: locationQuery,
          skills: userSkills
        }
      });

      if (error) throw error;

      setJobs(data.jobs || []);
      toast.success(`Found ${data.jobs?.length || 0} jobs!`);
    } catch (error: any) {
      console.error("Error searching jobs:", error);
      toast.error(error.message || "Failed to search jobs. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job =>
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
              Search for live jobs matching your skills and preferences.
            </p>
          </motion.div>

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 p-6 rounded-2xl bg-card border border-border/50"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Job title, keywords, or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchJobs()}
                  className="pl-10"
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Location (e.g., Remote, New York, CA...)"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchJobs()}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Skills for better matching */}
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">Your skills (for better matching):</p>
              <div className="flex gap-2 mb-2 flex-wrap">
                {userSkills.map((skill) => (
                  <Badge 
                    key={skill} 
                    variant="secondary"
                    className="px-2 py-1 text-xs cursor-pointer hover:bg-destructive/20"
                    onClick={() => removeSkill(skill)}
                  >
                    {skill} ×
                  </Badge>
                ))}
                <div className="flex gap-1">
                  <Input
                    placeholder="Add skill..."
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addSkill(skillInput)}
                    className="h-7 w-32 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant="jobscout" 
                className="flex-1"
                onClick={searchJobs}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search Jobs
                  </>
                )}
              </Button>
            </div>

            {/* Quick stats */}
            {hasSearched && (
              <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-jobscout">{jobs.length}</span>
                  <span className="text-sm text-muted-foreground">Jobs Found</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-accent">{jobs.filter(j => j.match >= 80).length}</span>
                  <span className="text-sm text-muted-foreground">High Match</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{savedJobs.length}</span>
                  <span className="text-sm text-muted-foreground">Saved</span>
                </div>
              </div>
            )}
          </motion.div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 text-jobscout mx-auto mb-4 animate-spin" />
              <p className="text-muted-foreground">Searching for live job listings...</p>
            </div>
          )}

          {/* No Results */}
          {!isLoading && hasSearched && jobs.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
              <p className="text-muted-foreground mb-4">Try different keywords or location</p>
              <Button variant="outline" onClick={() => setHasSearched(false)}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Start New Search
              </Button>
            </div>
          )}

          {/* Job Listings */}
          {!isLoading && jobs.length > 0 && (
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
                  transition={{ delay: 0.05 * index }}
                  className={`p-6 rounded-2xl border transition-all hover:shadow-lg ${
                    job.featured 
                      ? "bg-gradient-to-r from-jobscout/10 to-transparent border-jobscout/30" 
                      : "bg-card border-border/50 hover:border-jobscout/30"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {job.featured && (
                          <Badge className="bg-jobscout">
                            <Star className="w-3 h-3 mr-1" />
                            Top Match
                          </Badge>
                        )}
                        <Badge variant="outline">{job.type}</Badge>
                        {job.experienceLevel && (
                          <Badge variant="secondary">{job.experienceLevel}</Badge>
                        )}
                      </div>
                      
                      <h3 className="text-xl font-semibold mb-1">{job.title}</h3>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
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

                      {job.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {job.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {job.skills.slice(0, 5).map((skill) => (
                          <Badge key={skill} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                        {job.skills.length > 5 && (
                          <Badge variant="outline">+{job.skills.length - 5} more</Badge>
                        )}
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
                        <Button 
                          variant="jobscout" 
                          size="sm"
                          onClick={() => job.applyUrl && window.open(job.applyUrl, '_blank')}
                        >
                          Apply
                          <ExternalLink className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Initial State - Show prompt to search */}
          {!hasSearched && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center py-12"
            >
              <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Ready to find your next opportunity?</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Enter your desired job title, location, and skills above to discover live job listings tailored to your profile.
              </p>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Jobs;
