export const JOB_DATABASE = [
  { title: "F1 Race Engineer", skills: ["f1 racer", "car mechanic", "racing", "engines"] },
  { title: "Frontend Developer", skills: ["javascript", "react", "html", "css", "tailwind"] },
  { title: "Data Scientist", skills: ["python", "sql", "machine learning", "statistics"] },
  { title: "Digital Marketer", skills: ["seo", "ads", "social media", "content"] },
  { title: "Healthcare Assistant", skills: ["nursing", "first aid", "patient care", "medical"] },
  { title: "Chef de Cuisine", skills: ["cooking", "baking", "food safety", "menu planning"] }
];

export const runAgent = (userSkills: string[]) => {
  if (userSkills.length === 0) return [];

  return JOB_DATABASE.map(job => {
    // This looks for any partial match between what you typed and the job skills
    const matches = job.skills.filter(jobSkill => 
      userSkills.some(uSkill => uSkill.toLowerCase().includes(jobSkill.toLowerCase()) || 
                               jobSkill.toLowerCase().includes(uSkill.toLowerCase()))
    );
    
    // Calculate match percentage
    const score = job.skills.length > 0 ? (matches.length / job.skills.length) * 100 : 0;
    
    return { ...job, matchScore: Math.round(score) };
  })
  .filter(j => j.matchScore > 0) // Only show jobs that have at least one match
  .sort((a, b) => b.matchScore - a.matchScore); // Highest match at the top
};
