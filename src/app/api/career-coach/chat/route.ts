import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Only return messages from the last 24 hours
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('chat_messages')
      .select('id, role, content, created_at')
      .eq('user_id', user.id)
      .gte('created_at', since)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Fetch chat history error:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('user_id', user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Clear chat history error:', error);
    return NextResponse.json({ error: 'Failed to clear chat' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { message, history } = await request.json();
    if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 });

    let reply: string;

    if (process.env.OPENAI_API_KEY) {
      try {
        const { openai, AI_MODEL } = await import('@/lib/openai');
        const messages = [
          {
            role: 'system' as const,
            content: `You are an expert AI career coach. You help job seekers with:
- Resume writing and optimization
- Interview preparation and mock interviews
- Career planning and transitions
- Salary negotiation
- Networking strategies
- Skills development
- Job search strategies
- LinkedIn profile optimization

Be friendly, professional, and provide actionable advice. Keep responses concise but comprehensive. Use bullet points for clarity when appropriate.`,
          },
          ...history.map((h: { role: string; content: string }) => ({
            role: h.role as 'user' | 'assistant',
            content: h.content,
          })),
          { role: 'user' as const, content: message },
        ];

        const completion = await openai.chat.completions.create({
          model: AI_MODEL,
          messages,
          temperature: 0.7,
          max_tokens: 1000,
        });

        reply = completion.choices[0].message.content || 'I apologize, I was unable to generate a response. Please try again.';
      } catch {
        reply = getFallbackReply(message);
      }
    } else {
      reply = getFallbackReply(message);
    }

    // Save messages to DB
    await supabase.from('chat_messages').insert([
      { user_id: user.id, role: 'user', content: message },
      { user_id: user.id, role: 'assistant', content: reply },
    ]);

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Career coach error:', error);
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 });
  }
}

function getFallbackReply(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('resume') || lower.includes('cv')) {
    return `Great question about resumes! Here are my top recommendations:

• **Use action verbs** to start each bullet point (Led, Developed, Implemented, Achieved)
• **Quantify your achievements** — use numbers, percentages, and metrics whenever possible
• **Tailor your resume** for each specific job application by matching keywords from the job description
• **Keep it concise** — 1 page for <5 years experience, 2 pages maximum for senior roles
• **Include a professional summary** at the top highlighting your key qualifications
• **Use a clean, ATS-friendly format** — avoid tables, graphics, and fancy formatting

Would you like me to help with a specific section of your resume?`;
  }

  if (lower.includes('interview') || lower.includes('prepare')) {
    return `Here's a comprehensive interview preparation strategy:

**Before the Interview:**
• Research the company thoroughly — mission, products, recent news, culture
• Prepare 5-7 STAR method stories (Situation, Task, Action, Result)
• Practice common questions out loud — record yourself and review
• Prepare thoughtful questions to ask the interviewer

**During the Interview:**
• Make a strong first impression — firm handshake, eye contact, genuine smile
• Use the STAR method for behavioral questions
• Be specific — avoid vague answers, use concrete examples
• Show enthusiasm and genuine interest in the role

**After the Interview:**
• Send a thank-you email within 24 hours
• Reference specific topics discussed
• Reiterate your interest and fit for the role

Would you like to practice with some common interview questions?`;
  }

  if (lower.includes('salary') || lower.includes('negotiat')) {
    return `Here's how to approach salary negotiation effectively:

• **Research the market rate** on Glassdoor, Levels.fyi, PayScale, and LinkedIn Salary
• **Never give the first number** — let the employer make the initial offer
• **Consider the full package** — base salary, bonus, equity, benefits, PTO, remote work
• **Use the "anchoring" technique** — if you must give a number, aim 10-20% above your target
• **Practice your negotiation** conversation beforehand
• **Get it in writing** — always request the final offer in writing

**Key phrases to use:**
- "Based on my research and experience, I was expecting something in the range of..."
- "I'm very excited about this opportunity. Is there flexibility in the compensation package?"
- "What would it take to get to [target number]?"

Remember: Negotiation is expected and professional. Most employers have room to negotiate!`;
  }

  if (lower.includes('career') || lower.includes('transition') || lower.includes('switch')) {
    return `Career transitions can be exciting! Here's a strategic approach:

**Planning Phase:**
• Identify transferable skills from your current role
• Research target industry/role requirements
• Fill skill gaps through courses, certifications, or side projects
• Network with professionals in your target field

**Execution Phase:**
• Update your LinkedIn to reflect your target role
• Tailor your resume to emphasize transferable skills
• Build a portfolio or side projects relevant to the new field
• Consider freelance or volunteer work to gain experience
• Join professional communities and attend industry events

**Top Resources:**
• Coursera, Udemy, LinkedIn Learning for courses
• Meetup.com for networking events
• LinkedIn for connecting with professionals
• GitHub for building a technical portfolio

What specific career transition are you considering?`;
  }

  return `That's a great question! Here are some key career tips:

• **Continuous Learning** — Stay current with industry trends and develop new skills regularly
• **Network Actively** — Build genuine relationships in your industry, both online and offline
• **Personal Branding** — Maintain a strong LinkedIn presence and share your expertise
• **Set Clear Goals** — Define short-term and long-term career objectives with measurable milestones
• **Seek Feedback** — Regularly ask for constructive feedback from peers and mentors
• **Document Achievements** — Keep a running log of your accomplishments and impact

I'm here to help with specific career questions including resume writing, interview preparation, salary negotiation, career transitions, and job search strategies.

What specific area would you like to explore further?`;
}
