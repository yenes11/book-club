import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { title, author, publishedYear } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: 'Kitap başlığı gerekli' },
        { status: 400 }
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key yapılandırılmamış' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

    const prompt = `Aşağıdaki kitap hakkında 1-2 cümlelik kısa ve öz bir açıklama yaz. Açıklama kitabın konusunu, temasını veya ana fikrini özetlemeli. Sadece açıklamayı döndür, başka bir şey ekleme. Türkçe yaz.

KURALLAR:
1. Açıklama MUTLAKA 1 cümle olmalı. Daha fazla değil.
2. Kitap başlığını açıklamada ASLA kullanma.
3. Yazar adını ASLA kullanma.
4. Doğrudan ve net ol. Sadece konuyu veya öncülü açıkça anlat.
5. Sadece açıklamayı döndür, JSON veya başka format kullanma.

Kitap: ${title}${author ? `\nYazar: ${author}` : ''}${
      publishedYear ? `\nYayın Yılı: ${publishedYear}` : ''
    }

Açıklama:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let description = response.text().trim();

    // Eğer response markdown code block içinde JSON içeriyorsa parse et
    if (description.includes('```json')) {
      try {
        // Markdown code block'u temizle
        const jsonMatch = description.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          const jsonStr = jsonMatch[1];
          const parsed = JSON.parse(jsonStr);
          description = parsed.summary || description;
        } else {
          // Sadece JSON varsa
          const jsonMatch2 = description.match(/\{[\s\S]*\}/);
          if (jsonMatch2) {
            const parsed = JSON.parse(jsonMatch2[0]);
            description = parsed.summary || description;
          }
        }
      } catch (e) {
        console.error('JSON parse hatası:', e);
        // Parse edilemezse orijinal metni kullan
      }
    }

    // Eğer hala JSON formatında geliyorsa
    if (description.startsWith('{')) {
      try {
        const parsed = JSON.parse(description);
        description = parsed.summary || parsed.description || description;
      } catch (e) {
        // Parse edilemezse olduğu gibi bırak
      }
    }

    return NextResponse.json({ description });
  } catch (error) {
    console.error('Gemini API hatası:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Açıklama oluşturulurken bir hata oluştu',
      },
      { status: 500 }
    );
  }
}
