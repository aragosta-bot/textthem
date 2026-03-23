# TextThem — PROJECT.md

## O projekcie
Wiralowa mini-aplikacja — generator wiadomości do wysłania partnerowi. Użytkownik wybiera opcje (długość związku, aktualny vibe, cel) i dostaje spersonalizowaną wiadomość generowaną przez AI.

## Status
🚧 MVP live — prompt wymaga dopracowania, content potrzebuje copywritera

## Linki
- Live: https://aragosta-bot.github.io/textthem/
- Repo: https://github.com/aragosta-bot/textthem
- Supabase: arjmslnpxbxpxmyuoaot

## Stack
- HTML/JS/CSS (statyczny, GitHub Pages)
- Supabase Edge Function: generate-message
- OpenAI gpt-5.4-mini (Responses API)

## Model
- Tier Soft: darmowy, lekkie napięcie
- Tier Spicy: suggestive (locked)
- Tier Chaos: funny/absurdalne (locked)
- Paywall przy klikaniu locked tierów (placeholder — "wkrótce")

## Ustalenia / Decyzje

### 2026-03-20 — Prompt engineering
- HOOK → TWIST → RULE struktura wiadomości
- temperature: 1.3
- Odwrócenie ról jako główny styl Soft tier
- Spicy = suggestive, Chaos = funny (nie "gdybyśmy byli")
- Chip selectory zamiast otwartych pól tekstowych
- Pytanie o płeć nadawcy (odmiana po polsku)
- Few-shot examples z 30 wiadomości (z rozmowy ChatGPT)
- System prompt zakazuje konkretnych fraz które model klonuje

### Problemy z modelem
- GPT nie generuje treści naprawdę mocnych — guardrails
- Personalizacja jest płytka — model używa inputów dosłownie zamiast jako inspiracji
- Rozwiązanie długoterminowe: ręcznie napisana baza + AI wariantuje

### Monetyzacja
- Soft: darmowy (1 wiadomość)
- Spicy/Chaos: paywall
- Pakiety: 9-29 zł jednorazowo
- Model freemium z impulsową płatnością

### Potencjał viralowy
- 6/10 aktualnie
- 8/10 z dobrym contentem + TikTok
- Główna bariera: content jest zbyt generyczny
- Potrzebny copywriter który pisze tak jak w przykładach

## TODO
- [ ] Zaangażować copywritera do napisania 50-100 wiadomości per tier
- [ ] Zaimplementować prawdziwy paywall (Stripe)
- [ ] A/B test promptów
- [ ] TikTok/Instagram jako główny kanał viralowy
