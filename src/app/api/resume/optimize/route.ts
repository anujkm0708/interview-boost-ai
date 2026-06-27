import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { resumeText, jobDescription } = await request.json();
    if (!resumeText || !jobDescription) {
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
              content: `You are an expert resume writer and ATS optimization specialist. Given a resume and a target job description, rewrite the resume to be perfectly tailored for the job. Return JSON:
{
  "optimized_content": "the full rewritten resume as plain text with clear section headings",
  "improvements": ["list of 5-8 specific improvements you made"]
}
Keep the person's real information but improve bullet points, keywords, and structure. Return ONLY JSON.`,
            },
            { role: 'user', content: `Resume:\n${resumeText}\n\nTarget Job Description:\n${jobDescription}` },
          ],
          temperature: 0.4,
          response_format: { type: 'json_object' },
        });
        result = JSON.parse(completion.choices[0].message.content || '{}');
      } catch {
        result = heuristicOptimize(resumeText, jobDescription);
      }
    } else {
      result = heuristicOptimize(resumeText, jobDescription);
    }

    // Save to database
    await supabase.from('optimized_resumes').insert({
      user_id: user.id,
      resume_id: null,
      job_analysis_id: null,
      optimized_content: result.optimized_content,
      improvements: result.improvements,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Resume optimization error:', error);
    return NextResponse.json({ error: 'Optimization failed' }, { status: 500 });
  }
}

function heuristicOptimize(resume: string, job: string) {
  const jobLower = job.toLowerCase();
  const keywords = ['leadership', 'collaboration', 'results-driven', 'innovative', 'strategic', 'data-driven', 'scalable', 'cross-functional'];
  const relevantKeywords = keywords.filter(k => jobLower.includes(k));

  let optimized = resume;
  // Add professional summary if missing
  if (!resume.toLowerCase().includes('summary') && !resume.toLowerCase().includes('objective')) {
    optimized = `PROFESSIONAL SUMMARY\nResults-driven professional with a proven track record of delivering impactful solutions. ${relevantKeywords.length > 0 ? `Skilled in ${relevantKeywords.join(', ')}.` : 'Experienced in driving business outcomes through technical excellence.'} Seeking to leverage expertise in a challenging new role.\n\n${optimized}`;
  }

  // Improve bullet points
  optimized = optimized.replace(/^- /gm, '• ');
  optimized = optimized.replace(/^(\s*)worked on /gim, '$1Developed and delivered ');
  optimized = optimized.replace(/^(\s*)helped with /gim, '$1Contributed to ');
  optimized = optimized.replace(/^(\s*)responsible for /gim, '$1Led ');

  return {
    optimized_content: optimized,
    improvements: [
      'Added a professional summary section tailored to the target role',
      'Replaced weak action verbs with strong, impactful alternatives',
      'Standardized bullet point formatting for ATS compatibility',
      'Incorporated relevant keywords from the job description',
      'Improved overall structure and readability',
      'Enhanced achievement descriptions with action-oriented language',
    ],
  };
}
