import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { resumeText, jobTitle, company, jobDescription } = await request.json();
    if (!jobTitle || !company || !jobDescription) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let content: string;

    if (process.env.OPENAI_API_KEY) {
      try {
        const { openai, AI_MODEL } = await import('@/lib/openai');
        const completion = await openai.chat.completions.create({
          model: AI_MODEL,
          messages: [
            {
              role: 'system',
              content: `You are an expert cover letter writer. Write a professional, compelling cover letter for the given job. The letter should be personalized, demonstrate enthusiasm, and highlight relevant qualifications. Return JSON:
{ "content": "the full cover letter text" }
Return ONLY JSON.`,
            },
            {
              role: 'user',
              content: `Job Title: ${jobTitle}\nCompany: ${company}\nJob Description:\n${jobDescription}\n${resumeText ? `\nCandidate Resume:\n${resumeText}` : ''}`,
            },
          ],
          temperature: 0.5,
          response_format: { type: 'json_object' },
        });
        const result = JSON.parse(completion.choices[0].message.content || '{}');
        content = result.content;
      } catch {
        content = generateFallbackLetter(jobTitle, company, jobDescription, resumeText);
      }
    } else {
      content = generateFallbackLetter(jobTitle, company, jobDescription, resumeText);
    }

    // Save to DB
    await supabase.from('cover_letters').insert({
      user_id: user.id,
      resume_id: null,
      job_title: jobTitle,
      company,
      content,
    });

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Cover letter generation error:', error);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}

function generateFallbackLetter(jobTitle: string, company: string, jobDescription: string, resumeText?: string) {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Extract some keywords from job description
  const skills = jobDescription.match(/\b(JavaScript|TypeScript|Python|React|Node\.js|AWS|Docker|SQL|Java|C\+\+|leadership|communication|teamwork|agile|scrum)\b/gi) || [];
  const uniqueSkills = [...new Set(skills.map(s => s.toLowerCase()))].slice(0, 4);

  return `${today}

Dear Hiring Manager,

I am writing to express my strong interest in the ${jobTitle} position at ${company}. After reviewing the job description, I am confident that my skills and experience align well with the requirements of this role.

${uniqueSkills.length > 0
    ? `I bring expertise in ${uniqueSkills.join(', ')}, which are directly relevant to the responsibilities outlined in the job description. `
    : ''}Throughout my career, I have consistently demonstrated a commitment to delivering high-quality results and driving meaningful impact.

${resumeText
    ? 'Drawing from my professional background, I have developed a strong foundation in problem-solving, technical implementation, and cross-functional collaboration. I am particularly excited about the opportunity to apply these skills at ' + company + ', a company I greatly admire for its innovation and commitment to excellence.'
    : 'I am particularly drawn to ' + company + "'s reputation for innovation and excellence. I am eager to contribute my skills and grow within your organization."}

What sets me apart is my passion for continuous learning and my ability to adapt to new challenges quickly. I thrive in collaborative environments and have a track record of exceeding expectations in both independent and team settings.

I would welcome the opportunity to discuss how my experience and enthusiasm can contribute to ${company}'s continued success. Thank you for considering my application. I look forward to hearing from you.

Sincerely,
[Your Name]
[Your Email]
[Your Phone]`;
}
