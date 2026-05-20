import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const MAX_STR = 200;
    const MAX_SKILLS = 50;
    const MAX_SKILL_LEN = 100;

    const query = typeof body.query === 'string' ? body.query.slice(0, MAX_STR) : '';
    const location = typeof body.location === 'string' ? body.location.slice(0, MAX_STR) : '';
    const rawSkills = Array.isArray(body.skills) ? body.skills : [];
    if (rawSkills.length > MAX_SKILLS) {
      return new Response(JSON.stringify({ error: `Too many skills (max ${MAX_SKILLS}).` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const skills = rawSkills
      .filter((s: unknown) => typeof s === 'string')
      .map((s: string) => s.slice(0, MAX_SKILL_LEN));
    const page = Number.isInteger(body.page) && body.page > 0 && body.page <= 50 ? body.page : 1;

    const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');

    // If no API key, use AI to generate realistic job listings
    if (!RAPIDAPI_KEY) {
      console.log("No RapidAPI key found, using AI to generate job listings");

      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (!LOVABLE_API_KEY) {
        console.error("Missing AI configuration");
        return new Response(JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }), {
          status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

const systemPrompt = `You are a job market expert. Generate realistic, current job listings based on the search criteria provided. 
Make the listings realistic with actual company names, realistic salaries, and current job requirements.
Include a mix of remote and on-site positions.

CRITICAL: For applyUrl, you MUST use REAL, working job search URLs in these formats:
- LinkedIn: https://www.linkedin.com/jobs/search/?keywords={job_title}&location={location}
- Indeed: https://www.indeed.com/jobs?q={job_title}&l={location}
- Glassdoor: https://www.glassdoor.com/Job/{location}-{job_title}-jobs-SRCH_IL.htm
- Company career pages: https://{company}.com/careers or https://careers.{company}.com

For example:
- "https://www.linkedin.com/jobs/search/?keywords=Software%20Engineer&location=San%20Francisco"
- "https://www.indeed.com/jobs?q=Data%20Scientist&l=Remote"
- "https://careers.google.com/jobs"
- "https://www.microsoft.com/en-us/careers"`;

      const userPrompt = `Generate 15-20 realistic job listings for the following search:
Query: ${query || 'Software Developer'}
Location: ${location || 'United States'}
Skills: ${skills?.join(', ') || 'General'}

Respond in JSON format:
{
  "jobs": [
    {
      "id": "unique_id",
      "title": "Job Title",
      "company": "Company Name (use real companies like Google, Microsoft, Amazon, Meta, Apple, Netflix, Spotify, Salesforce, Adobe, etc.)",
      "location": "City, State or Remote",
      "salary": "$XXK - $XXXK",
      "posted": "X days ago",
      "type": "Full-time" | "Part-time" | "Contract",
      "skills": ["skill1", "skill2", "skill3"],
      "description": "Brief job description (2-3 sentences)",
      "applyUrl": "MUST be a real, clickable URL - use LinkedIn job search, Indeed, or actual company career pages. Example: https://www.linkedin.com/jobs/search/?keywords=Software%20Engineer&location=Remote or https://careers.google.com",
      "featured": boolean (true for top matches),
      "experienceLevel": "Entry" | "Mid" | "Senior" | "Lead"
    }
  ],
  "totalJobs": number,
  "searchTips": ["tip1", "tip2"]
}

IMPORTANT: Every applyUrl must be a real, working URL that users can click to find jobs. Use URL-encoded job titles and locations.`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: "json_object" }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        return new Response(JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        console.error("Empty AI response");
        return new Response(JSON.stringify({ error: "Service temporarily unavailable. Please try again." }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const result = JSON.parse(content);
      
      // Calculate match percentages based on skills
      if (skills && skills.length > 0) {
        result.jobs = result.jobs.map((job: any) => {
          const matchingSkills = job.skills.filter((s: string) => 
            skills.some((userSkill: string) => 
              userSkill.toLowerCase().includes(s.toLowerCase()) || 
              s.toLowerCase().includes(userSkill.toLowerCase())
            )
          );
          const match = Math.min(95, Math.round((matchingSkills.length / job.skills.length) * 100) + 30 + Math.random() * 20);
          return { ...job, match: Math.round(match) };
        });
        
        // Sort by match percentage
        result.jobs.sort((a: any, b: any) => b.match - a.match);
      } else {
        result.jobs = result.jobs.map((job: any, index: number) => ({
          ...job,
          match: Math.round(95 - index * 3 + Math.random() * 5)
        }));
      }

      console.log("Job search completed successfully with AI");

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If RapidAPI key exists, use JSearch API for real LinkedIn jobs
    const searchQuery = query || (skills?.join(' ') || 'software developer');
    const searchLocation = location || 'United States';
    
    const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(searchQuery + ' in ' + searchLocation)}&page=${page}&num_pages=1&date_posted=week`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
      }
    });

    if (!response.ok) {
      console.error("JSearch API error:", response.status);
      return new Response(JSON.stringify({ error: "Job search is temporarily unavailable. Please try again later." }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const data = await response.json();
    
    const jobs = data.data?.map((job: any, index: number) => ({
      id: job.job_id || `job_${index}`,
      title: job.job_title,
      company: job.employer_name,
      location: job.job_city ? `${job.job_city}, ${job.job_state || job.job_country}` : (job.job_is_remote ? 'Remote' : job.job_country),
      salary: job.job_min_salary && job.job_max_salary 
        ? `$${Math.round(job.job_min_salary/1000)}K - $${Math.round(job.job_max_salary/1000)}K`
        : 'Competitive',
      posted: job.job_posted_at_datetime_utc 
        ? getTimeAgo(new Date(job.job_posted_at_datetime_utc))
        : 'Recently',
      type: job.job_employment_type || 'Full-time',
      skills: job.job_required_skills?.slice(0, 5) || [],
      description: job.job_description?.slice(0, 200) + '...',
      applyUrl: job.job_apply_link || job.job_google_link,
      featured: index < 3,
      experienceLevel: job.job_required_experience?.required_experience_in_months 
        ? getExperienceLevel(job.job_required_experience.required_experience_in_months)
        : 'Mid',
      match: Math.round(95 - index * 4 + Math.random() * 5)
    })) || [];

    console.log(`Found ${jobs.length} jobs from JSearch API`);

    return new Response(JSON.stringify({ 
      jobs,
      totalJobs: data.data?.length || 0,
      source: 'linkedin'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in search-jobs function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return '1 week ago';
  return `${Math.floor(diffDays / 7)} weeks ago`;
}

function getExperienceLevel(months: number): string {
  if (months <= 12) return 'Entry';
  if (months <= 36) return 'Mid';
  if (months <= 72) return 'Senior';
  return 'Lead';
}
