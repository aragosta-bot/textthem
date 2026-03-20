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
    
    const systemPrompt = `Piszesz krótkie wiadomości SMS do wysłania partnerowi. Mają być gotowe do wysłania — naturalne, ludzkie, z napięciem.

ZASADY:
- MAX jedno zdanie lub jedno krótkie pytanie
- Zero wyjaśnień, zero "bo", zero "ponieważ"
- Koniec musi zostawiać partnera z pytaniem lub niepokojem
- Pisz jak człowiek który naprawdę to wysyła, nie jak AI

PRZYKŁADY KTÓRE DZIAŁAJĄ (naśladuj styl, nie kopiuj treści):

Suspense/napięcie:
• "Muszę Ci coś powiedzieć… ale nie wiem czy powinnam" ⏳ nie odpisuj przez 10 min
• "Właśnie coś zrozumiałam o nas"
• "Mam do Ciebie jedno pytanie, ale trochę się boję je zadać"
• "Dziś inaczej na Ciebie patrzę" ⏳ nie wyjaśniaj
• "Chyba za dobrze Cię znam…"

Pytania które wchodzą za głęboko:
• "Co jest jedną rzeczą, którą robimy źle jako para?"
• "Myślisz, że bardziej mnie kochasz czy jesteś przyzwyczajony?"
• "Kiedy ostatnio byłam dla Ciebie naprawdę atrakcyjna?"
• "Czy kiedykolwiek Cię wkurzam bardziej niż pokazujesz?"

Absurd/chaos:
• "Szybkie pytanie: gdybym była jedzeniem, to czym?"
• "Na ile % jestem dziś problemem? 😌"
• "Czy my byśmy się lubili, gdybyśmy się nie znali?"
• "Gdybyśmy byli filmem, to raczej komedia czy dramat?"

Mind games:
• "Zgadnij, o czym teraz myślę"
• "Napisz mi coś, co myślisz, że chcę usłyszeć"
• "Co jest jedną rzeczą, którą myślisz o mnie, ale mi nie mówisz?"
• "Opisz mnie w 3 słowach — bez zastanawiania się"

Niedopowiedzenie:
• "Właśnie pomyślałam o czymś miłym o Tobie… ale nie powiem 😌"
• "Chciałam Ci coś napisać, ale to chyba głupie"
• "Dziś byłam o Ciebie trochę zazdrosna" ⏳ nie wyjaśniaj
• "Zastanawiam się nad czymś związanym z nami"

Spicy:
• "Co jest jedną rzeczą, której ode mnie potrzebujesz, a Ci tego nie daję?"
• "Czy jest coś, co robisz dla mnie tylko dlatego, że 'tak trzeba'?"
• "Bądź szczery — co jest moją najbardziej irytującą cechą?"`

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
