import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Shared heuristic analysis function
function generateHeuristicAnalysis(content: string) {
  const lower = content.toLowerCase();
  const sections = ['education', 'experience', 'skills', 'projects', 'certifications', 'summary', 'objective', 'awards'];
  const found = sections.filter((s) => lower.includes(s));
  const missing = sections.filter(
    (s) => !lower.includes(s) && ['summary', 'education', 'experience', 'skills'].includes(s)
  );

  const hasEmail = /\S+@\S+\.\S+/.test(content);
  const hasPhone = /[\d\-\(\)]{10,}/.test(content);
  const hasLinkedIn = lower.includes('linkedin');
  const wordCount = content.split(/\s+/).length;
  const bulletPoints = (content.match(/[•\-\*]/g) || []).length;

  let atsScore = 50;
  if (hasEmail) atsScore += 8;
  if (hasPhone) atsScore += 7;
  if (found.includes('experience')) atsScore += 10;
  if (found.includes('education')) atsScore += 8;
  if (found.includes('skills')) atsScore += 10;
  if (bulletPoints > 5) atsScore += 7;
  atsScore = Math.min(atsScore, 95);

  let resumeScore = 45;
  if (wordCount > 200) resumeScore += 10;
  if (wordCount > 400) resumeScore += 5;
  if (hasLinkedIn) resumeScore += 5;
  if (found.length >= 4) resumeScore += 15;
  if (bulletPoints > 8) resumeScore += 10;
  resumeScore = Math.min(resumeScore, 95);

  return {
    strengths: [
      ...(hasEmail ? ['Contact email is present and properly formatted'] : []),
      ...(found.includes('experience') ? ['Work experience section is well-structured'] : []),
      ...(found.includes('skills') ? ['Skills section helps with ATS keyword matching'] : []),
      ...(bulletPoints > 5 ? ['Good use of bullet points for readability'] : []),
      'Resume contains relevant professional content',
    ].slice(0, 5),
    weaknesses: [
      ...(missing.includes('summary') ? ['Missing a professional summary/objective section'] : []),
      ...(missing.includes('skills') ? ['Missing a dedicated skills section — critical for ATS'] : []),
      ...(wordCount < 300 ? ['Resume may be too short — consider adding more detail'] : []),
      ...(!hasLinkedIn ? ['No LinkedIn profile link — recommended for professional roles'] : []),
      ...(bulletPoints < 5 ? ['Too few bullet points — use bullets to highlight achievements'] : []),
    ].slice(0, 4),
    suggestions: [
      'Use action verbs to start each bullet point (e.g., Developed, Implemented, Led)',
      'Add quantifiable achievements with numbers and percentages',
      'Include industry-specific keywords from the target job description',
      'Keep resume to 1-2 pages for optimal readability',
      'Use a clean, ATS-friendly format without tables or graphics',
      'Add a professional summary highlighting your key qualifications',
      'Tailor your resume for each specific job application',
    ],
    ats_score: atsScore,
    resume_score: resumeScore,
    keyword_density: Math.min(Math.floor(40 + found.length * 8), 90),
    formatting_score: Math.min(Math.floor(50 + bulletPoints * 3 + (hasEmail ? 10 : 0) + (hasPhone ? 10 : 0)), 95),
    content_score: Math.min(Math.floor(40 + wordCount / 20 + found.length * 5), 95),
    sections_found: found.map((s) => s.charAt(0).toUpperCase() + s.slice(1)),
    missing_sections: missing.map((s) => s.charAt(0).toUpperCase() + s.slice(1)),
  };
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { content, fileName } = await request.json();
    if (!content) return NextResponse.json({ error: 'No content provided' }, { status: 400 });

    let analysis;

    if (process.env.OPENAI_API_KEY) {
      try {
        const { openai, AI_MODEL } = await import('@/lib/openai');
        const completion = await openai.chat.completions.create({
          model: AI_MODEL,
          messages: [
            {
              role: 'system',
              content: `You are an expert resume analyst and ATS specialist. Analyze the following resume text and return a JSON object with this exact structure:
{
  "strengths": ["list of 4-6 strengths"],
  "weaknesses": ["list of 3-5 weaknesses"],
  "suggestions": ["list of 5-7 actionable suggestions"],
  "ats_score": number (0-100),
  "resume_score": number (0-100),
  "keyword_density": number (0-100),
  "formatting_score": number (0-100),
  "content_score": number (0-100),
  "sections_found": ["list of sections found in resume"],
  "missing_sections": ["list of important missing sections"]
}
Return ONLY the JSON object, no other text.`,
            },
            { role: 'user', content: `Analyze this resume:\n\n${content}` },
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' },
        });
        analysis = JSON.parse(completion.choices[0].message.content || '{}');
      } catch {
        analysis = generateHeuristicAnalysis(content);
      }
    } else {
      analysis = generateHeuristicAnalysis(content);
    }

    // Save to database
    await supabase.from('resumes').insert({
      user_id: user.id,
      file_name: fileName || 'image-resume.png',
      content: content.substring(0, 10000),
      ats_score: analysis.ats_score,
      resume_score: analysis.resume_score,
      analysis,
    });

    return NextResponse.json({ analysis, content });
  } catch (error) {
    console.error('Resume text analysis error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
