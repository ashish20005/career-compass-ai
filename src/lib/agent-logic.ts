export const JOB_DATABASE = [
  { title: "F1 Race Engineer", company: "Red Bull Racing", skills: ["f1 racer", "car mechanic"] },
  { title: "Software Developer", company: "Google", skills: ["javascript", "html", "react"] },
  { title: "Full Stack Engineer", company: "Meta", skills: ["node.js", "python", "git"] }
];

export const runAgent = (userSkills: string[]) => {
  return JOB_DATABASE.map(job => {
    const matches = job.skills.filter(s => userSkills.includes(s.toLowerCase()));
    return { ...job, matchScore: Math.round((matches.length / job.skills.length) * 100) };
  }).filter(j => j.matchScore > 0).sort((a, b) => b.matchScore - a.matchScore);
};
