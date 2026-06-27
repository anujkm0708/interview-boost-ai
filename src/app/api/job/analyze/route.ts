import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobDescription, resumeText } = await request.json();

    if (!jobDescription || !resumeText) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    let result;

    if (process.env.OPENAI_API_KEY) {
      try {
        const { openai, AI_MODEL } = await import('@/lib/openai');
        const completion = await openai.chat.completions.create({
          model: AI_MODEL,
          messages: [
            {
              role: 'system',
              content: `You are a job matching expert. Compare the resume with the job description and return JSON:
{
  "match_percentage": number (0-100),
  "matching_keywords": ["keywords found in both"],
  "missing_keywords": ["keywords in job but not in resume"],
  "matching_skills": ["skills found in both"],
  "missing_skills": ["skills required but missing from resume"],
  "recommendations": ["5-7 specific recommendations"]
}
Return ONLY JSON.`,
            },
            { role: 'user', content: `Job Description:\n${jobDescription}\n\nResume:\n${resumeText}` },
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' },
        });
        result = JSON.parse(completion.choices[0].message.content || '{}');
      } catch {
        result = heuristicJobMatch(jobDescription, resumeText);
      }
    } else {
      result = heuristicJobMatch(jobDescription, resumeText);
    }

    // Save to database so dashboard scores update
    try {
      // Extract job title / company from job description (first 2 lines heuristic)
      const lines = jobDescription.split('\n').map((l: string) => l.trim()).filter(Boolean);
      const jobTitle = lines[0]?.substring(0, 100) || 'Unknown Role';
      const company = lines[1]?.substring(0, 100) || 'Unknown Company';

      await supabase.from('job_analyses').insert({
        user_id: user.id,
        resume_id: null,
        job_title: jobTitle,
        company,
        job_description: jobDescription.substring(0, 5000),
        match_percentage: result.match_percentage,
        matching_keywords: result.matching_keywords || [],
        missing_keywords: result.missing_keywords || [],
        matching_skills: result.matching_skills || [],
        missing_skills: result.missing_skills || [],
        recommendations: result.recommendations || [],
      });
    } catch (saveErr) {
      // Non-fatal — still return result even if save fails
      console.error('Job analysis save error (non-fatal):', saveErr);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Job analysis error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}

function heuristicJobMatch(job: string, resume: string) {
  const jobLower = job.toLowerCase();
  const resumeLower = resume.toLowerCase();

  const techKeywords = ['javascript', 'typescript', 'python', 'java', 'react', 'node', 'aws', 'docker',
    'kubernetes', 'sql', 'nosql', 'mongodb', 'postgresql', 'git', 'ci/cd', 'agile', 'scrum',
    'html', 'css', 'rest', 'api', 'graphql', 'microservices', 'cloud', 'linux', 'machine learning',
    'data analysis', 'communication', 'leadership', 'teamwork', 'problem solving', 'project management'];

  const jobKeywords = techKeywords.filter(k => jobLower.includes(k));
  const matching = jobKeywords.filter(k => resumeLower.includes(k));
  const missing = jobKeywords.filter(k => !resumeLower.includes(k));

  const skills = ['react', 'node.js', 'python', 'java', 'aws', 'docker', 'typescript', 'sql', 'git', 'leadership'];
  const matchingSkills = skills.filter(s => jobLower.includes(s) && resumeLower.includes(s));
  const missingSkills = skills.filter(s => jobLower.includes(s) && !resumeLower.includes(s));

  const matchPercentage = jobKeywords.length > 0
    ? Math.round((matching.length / jobKeywords.length) * 100)
    : 50;

  return {
    match_percentage: Math.min(matchPercentage, 95),
    matching_keywords: matching,
    missing_keywords: missing,
    matching_skills: matchingSkills,
    missing_skills: missingSkills,
    recommendations: [
      `Add the following missing keywords to your resume: ${missing.slice(0, 3).join(', ') || 'N/A'}`,
      'Tailor your professional summary to match the job requirements',
      'Quantify your achievements with specific numbers and metrics',
      'Mirror the language used in the job description',
      'Highlight relevant projects that demonstrate required skills',
      `Consider adding experience with: ${missingSkills.slice(0, 3).join(', ') || 'related technologies'}`,
      'Ensure your resume format is ATS-friendly',
    ],
  };
}
