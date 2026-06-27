import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('interview_preps')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (data && data.length > 0) {
      return NextResponse.json(data[0]);
    }

    return NextResponse.json(null);
  } catch (error) {
    console.error('Fetch latest interview prep error:', error);
    return NextResponse.json(null, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { jobTitle, company, jobDescription } = await request.json();
    if (!jobTitle || !company) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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
              content: `You are an expert interview coach. Generate interview preparation materials. Return JSON:
{
  "hr_questions": [{ "question": "", "model_answer": "", "difficulty": "easy|medium|hard", "category": "" }],
  "technical_questions": [{ "question": "", "model_answer": "", "difficulty": "easy|medium|hard", "category": "" }],
  "preparation_plan": [{ "day": 1-7, "title": "", "tasks": [""], "focus_areas": [""], "resources": [""] }]
}
Analyze the job title and description. Determine if the position requires technical/hard skills (e.g. software engineering, IT, data analysis, specialized software, accounting, design tools).
If the position is non-technical (e.g., HR, pure sales, writing, management, customer service), set "technical_questions" to an empty array ([]) and customize the "preparation_plan" to focus on role-specific competencies, pitches, and scenario challenges instead of coding/engineering practice. If the position is technical, generate 5 targeted technical questions and model answers. Generate 5 HR questions and a 7-day preparation plan. Return ONLY JSON.`,
            },
            {
              role: 'user',
              content: `Job: ${jobTitle} at ${company}\n${jobDescription ? `Description:\n${jobDescription}` : ''}`,
            },
          ],
          temperature: 0.5,
          response_format: { type: 'json_object' },
        });
        result = JSON.parse(completion.choices[0].message.content || '{}');
      } catch {
        result = fallbackPrep(jobTitle, company);
      }
    } else {
      result = fallbackPrep(jobTitle, company);
    }

    // Save to DB
    await supabase.from('interview_preps').insert({
      user_id: user.id,
      job_title: jobTitle,
      company,
      hr_questions: result.hr_questions || [],
      technical_questions: result.technical_questions || [],
      preparation_plan: result.preparation_plan || [],
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Interview prep error:', error);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}

function fallbackPrep(jobTitle: string, company: string) {
  const nonTechKeywords = ['sales', 'marketing', 'hr', 'human resources', 'recruiter', 'writer', 'editor', 'content', 'designer', 'artist', 'legal', 'lawyer', 'consultant', 'manager', 'executive', 'support', 'customer service', 'receptionist', 'admin', 'assistant', 'teacher', 'coach', 'salesperson', 'product manager'];
  const titleLower = jobTitle.toLowerCase();
  
  // Decide if it is a technical role
  const isTechnical = !nonTechKeywords.some(keyword => titleLower.includes(keyword)) || 
                      titleLower.includes('engineer') || 
                      titleLower.includes('developer') || 
                      titleLower.includes('tech') || 
                      titleLower.includes('analyst') || 
                      titleLower.includes('data') ||
                      titleLower.includes('programmer');

  const hr_questions = [
    { question: `Tell me about yourself and why you're interested in the ${jobTitle} role at ${company}.`, model_answer: `I'm a dedicated professional with experience in [your field]. I've been following ${company}'s work in [area], and I'm excited about the opportunity to contribute my skills in [relevant area]. My background in [experience] has prepared me well for this role, and I'm particularly drawn to ${company}'s commitment to [value/mission].`, difficulty: 'easy' as const, category: 'Introduction' },
    { question: 'What are your greatest strengths and how do they apply to this role?', model_answer: 'My greatest strengths are problem-solving, communication, and adaptability. In my previous role, I demonstrated problem-solving by [specific example]. My communication skills allowed me to effectively collaborate with cross-functional teams, and my adaptability helped me quickly learn new technologies and methodologies.', difficulty: 'easy' as const, category: 'Self-Assessment' },
    { question: 'Describe a challenging situation you faced at work and how you handled it.', model_answer: 'In my previous role, I encountered a critical project deadline that was at risk due to unexpected issues. I took the initiative to organize daily stand-ups, broke down the problem into manageable tasks, and coordinated with the team to redistribute workload. We not only met the deadline but also improved our process for future projects, reducing similar issues by 40%.', difficulty: 'medium' as const, category: 'Behavioral' },
    { question: 'Where do you see yourself in 5 years?', model_answer: `In five years, I see myself having grown significantly within ${company}, taking on increased responsibility and potentially leading a team. I want to deepen my expertise in [field] while also developing my leadership skills. I'm committed to continuous learning and contributing to ${company}'s mission.`, difficulty: 'easy' as const, category: 'Career Goals' },
    { question: 'Why should we hire you over other candidates?', model_answer: `I bring a unique combination of relevant skills, proven results, and cultural alignment with ${company}. My experience in [area] directly maps to the challenges outlined in this role. I'm not just qualified — I'm genuinely passionate about the work ${company} does, and I bring a track record of [specific achievement] that demonstrates my ability to deliver results.`, difficulty: 'hard' as const, category: 'Value Proposition' },
  ];

  const technical_questions = isTechnical ? [
    { question: `What skills do you consider most important for the ${jobTitle} role?`, model_answer: `For the ${jobTitle} role, I believe the most critical skills include [relevant skills based on role]. I have hands-on experience with these, having used them in production/professional environments. I stay current with industry trends through continuous learning and practical application.`, difficulty: 'easy' as const, category: 'Domain Knowledge' },
    { question: 'Describe your approach to resolving a complex problem under pressure.', model_answer: 'My problem-solving approach follows a systematic methodology: 1) Reproduce/isolate the issue, 2) Review logs, data, or feedback to identify patterns, 3) Form hypotheses and test them methodically, 4) Implement the fix with appropriate validation, 5) Add preventive measures to avoid recurrence. I document each step for team knowledge sharing.', difficulty: 'medium' as const, category: 'Problem Solving' },
    { question: 'How do you ensure quality and consistency in your deliverables?', model_answer: 'I ensure quality through multiple layers: following established standards, conducting peer reviews, testing scenarios, using automated checks where available, maintaining comprehensive documentation, and continuously refining processes. I believe in delivering work that is maintainable and scalable.', difficulty: 'medium' as const, category: 'Best Practices' },
    { question: 'Explain a complex concept or project you worked on to a non-technical stakeholder.', model_answer: 'I use analogies and real-world comparisons to make complex concepts accessible. I focus on the "why" and business impact rather than minor implementation details, using visual aids when possible. I listen to their feedback to adjust the explanation level.', difficulty: 'medium' as const, category: 'Communication' },
    { question: 'How do you stay updated with the latest trends in your profession?', model_answer: 'I maintain a multi-channel learning approach: I follow industry blogs and newsletters, participate in professional communities, attend meetups and webinars, read case studies, and regularly experiment with new methodologies through side projects or learning courses.', difficulty: 'easy' as const, category: 'Continuous Learning' },
  ] : [];

  const preparation_plan = [
    { day: 1, title: 'Research & Foundation', tasks: [`Deep dive into ${company}'s products and culture`, 'Review the job description thoroughly', 'List your relevant experiences and achievements', 'Update your elevator pitch'], focus_areas: ['Company Research', 'Self-Assessment'], resources: [`${company}'s website and blog`, 'Glassdoor reviews', 'LinkedIn'] },
    { 
      day: 2, 
      title: isTechnical ? 'Technical Preparation' : 'Domain Competency Review', 
      tasks: isTechnical 
        ? ['Review core technical concepts for the role', 'Practice coding challenges or technical scenarios', 'Prepare examples of technical projects']
        : ['Review case studies and industry best practices', 'Analyze competitor strategies and market trends', 'Prepare examples of successful campaigns or processes'], 
      focus_areas: isTechnical ? ['Technical Skills', 'Problem Solving'] : ['Industry Knowledge', 'Competency'], 
      resources: isTechnical ? ['LeetCode/HackerRank', 'Technical documentation'] : ['Industry reports', 'Case studies', 'Competitor analysis'] 
    },
    { day: 3, title: 'Behavioral Questions', tasks: ['Prepare STAR method responses for 5 key scenarios', 'Practice answering common HR questions', 'Prepare questions to ask the interviewer', 'Record yourself and review'], focus_areas: ['STAR Method', 'Storytelling'], resources: ['STAR method guide', 'Common interview questions list'] },
    { day: 4, title: 'Mock Interviews', tasks: ['Do a mock interview with a friend or mentor', 'Practice with an AI interview tool', 'Work on body language and presentation', 'Time your responses (aim for 2-3 minutes per answer)'], focus_areas: ['Communication', 'Confidence'], resources: ['Mock interview platforms', 'Mirror practice'] },
    { 
      day: 5, 
      title: isTechnical ? 'Deep Technical Review' : 'Role-Specific Scenarios', 
      tasks: isTechnical 
        ? ['Review role-specific technical topics in depth', 'Practice whiteboard/technical problem-solving', 'Prepare your portfolio/work samples']
        : ['Review complex case studies and scenario-based questions', 'Practice pitch presentations or group negotiation drills', 'Prepare samples of your past projects or reports'], 
      focus_areas: isTechnical ? ['Domain Knowledge', 'Technical Depth'] : ['Role Strategy', 'Problem Solving'], 
      resources: isTechnical ? ['Technical blogs', 'GitHub portfolio'] : ['Professional portfolios', 'Role handbooks'] 
    },
    { day: 6, title: 'Final Review & Logistics', tasks: ['Review all prepared answers and notes', 'Plan your outfit and logistics', 'Prepare copies of your resume', 'Test video/audio setup for virtual interviews'], focus_areas: ['Organization', 'Logistics'], resources: ['Your notes and materials', 'Route/tech setup'] },
    { day: 7, title: 'Rest & Confidence Building', tasks: ['Light review of key talking points', 'Practice relaxation techniques', 'Visualize a successful interview', 'Get a good night\'s sleep'], focus_areas: ['Mindset', 'Wellness'], resources: ['Meditation apps', 'Positive affirmations'] },
  ];

  return {
    hr_questions,
    technical_questions,
    preparation_plan,
  };
}
