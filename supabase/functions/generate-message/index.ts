import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { input1, input2, input3, tier } = await req.json()
    
    // Rate limiting via IP (simple, stored in memory - good enough for MVP)
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    
    const systemPrompt = `Piszesz krótkie wiadomości SMS do wysłania partnerowi. 

ZASADY ABSOLUTNE:
- MAX jedno zdanie. Jedno. Nigdy dwa.
- Zero wyjaśnień, zero kontekstu, zero "bo", zero "dlatego że"
- Wiadomość MUSI wywołać reakcję — niepokój, ciekawość lub chęć natychmiastowej odpowiedzi
- Pisz jak człowiek, nie jak AI
- Żadnych emoji na końcu zdania tłumaczących żart

DOBRE przykłady (ucz się tej długości i stylu, NIE kopiuj):
- "Muszę Ci coś powiedzieć."
- "Zgadnij, o czym teraz myślę."
- "Właśnie pomyślałam o Tobie coś, czego Ci nie powiem."
- "Nie odpisuj przez 10 minut."
- "Właśnie zrobiłam coś, o czym Ci nie powiem."
- "Czekam."
- "Wiesz co? Nieważne."

ZŁE przykłady (nigdy tak):
- "Nie odpisywałam chwilę i pewnie już masz gotowe 5 wiadomości..." ← za długie, za wyjaśniające
- "Piszesz jakbyś chciała..." ← punkt widzenia się nie zgadza`

    const tierContext = {
      soft: `Poziom: Soft — lekkie napięcie, ciekawość, tajemniczość. Można wysłać mamie na urodziny (prawie). Przykład: "Właśnie pomyślałam o Tobie coś miłego… ale nie powiem 😌"`,
      spicy: `Poziom: Spicy — napięcie, prowokacja, niedopowiedzenie. Wywołuje reakcję i chęć odpisania natychmiast. Przykład: "Muszę Ci coś powiedzieć… ale chyba poczekam do wieczora 😈"`,
      chaos: `Poziom: Chaos — psychologiczna gra, odwrócenie sytuacji, coś nieoczekiwanego. Partner nie wie jak zareagować. Unikaj "Powiedz szczerze" — to zbyt przewidywalne.`
    }

    const context = [
      input1 && `czas związku: ${input1}`,
      input2 && `aktualny vibe: ${input2}`,
      input3 && `cel wiadomości: ${input3}`,
    ].filter(Boolean).join(' | ')

    const prompt = `${tierContext[tier as keyof typeof tierContext] || tierContext.soft}

${context ? `Kontekst (użyj jako inspirację, nie cytuj): ${context}` : ''}

Napisz jedną wiadomość po polsku. Krótka, naturalna, gotowa do wysłania. Tylko wiadomość.`

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-5.4-mini-2026-03-17",
        instructions: systemPrompt,
        input: prompt,
        max_output_tokens: 100,
        temperature: 1.3,
        store: false,
      }),
    })

    const data = await response.json()
    const message = data.output_text?.trim() || data.output?.[0]?.content?.[0]?.text?.trim()

    return new Response(JSON.stringify({ message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
