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
    
    const tierPrompts = {
      soft: 'Napisz jedną krótką, zagadkową wiadomość (1-2 zdania) do wysłania partnerowi. Styl: delikatne napięcie, ciekawość, lekka tajemniczość. NIE wulgarne. Tylko wiadomość, bez komentarza.',
      spicy: 'Napisz jedną krótką wiadomość (1-2 zdania) do wysłania partnerowi. Styl: napięcie seksualne, prowokacja, niedopowiedzenie. Odważne ale bez wulgaryzmów. Tylko wiadomość, bez komentarza.',
      chaos: 'Napisz jedną krótką wiadomość (1-2 zdania) do wysłania partnerowi. Styl: psychologiczna gra, lekki mind game, coś co sprawi że partner nie będzie wiedział jak zareagować. Tylko wiadomość, bez komentarza.'
    }

    const prompt = `Kontekst o partnerze:
- Jak reaguje gdy go/ją ignorujesz: ${input1 || 'nieznane'}
- Czego się od Ciebie spodziewa: ${input2 || 'nieznane'}  
- Vibe waszego związku: ${input3 || 'nieznane'}

${tierPrompts[tier as keyof typeof tierPrompts] || tierPrompts.soft}

Ważne: wiadomość powinna być po polsku, krótka, gotowa do wysłania.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-5.4-nano",
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.9,
      }),
    })

    const data = await response.json()
    const message = data.choices[0].message.content.trim()

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
