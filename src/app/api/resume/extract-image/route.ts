import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert image to base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Image = buffer.toString('base64');
    const mimeType = file.type || 'image/jpeg';

    let extractedText = '';

    if (process.env.OPENAI_API_KEY) {
      try {
        const { openai } = await import('@/lib/openai');

        // Use Groq's vision model to extract text from the resume image
        const completion = await openai.chat.completions.create({
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `You are an expert OCR system. Extract ALL text from this resume image exactly as it appears. 
Preserve the structure with proper line breaks and section headings.
Return ONLY the raw extracted text — no commentary, no JSON, just the resume content.`,
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
          temperature: 0.1,
          max_tokens: 3000,
        });

        extractedText = completion.choices[0].message.content || '';
      } catch (err) {
        console.error('Vision OCR error:', err);
        // Fallback: return a message asking user to type their resume
        extractedText = '';
      }
    }

    if (!extractedText.trim()) {
      return NextResponse.json(
        { error: 'Could not extract text from image. Please type or paste your resume instead.' },
        { status: 422 }
      );
    }

    return NextResponse.json({ content: extractedText });
  } catch (error) {
    console.error('Image extraction error:', error);
    return NextResponse.json({ error: 'Image extraction failed' }, { status: 500 });
  }
}
