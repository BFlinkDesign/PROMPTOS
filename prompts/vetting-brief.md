# Meta: vetting brief — before any architecture / vendor / model commitment

Use BEFORE writing a decision into any plan or doc. The incident behind this: a voice
stack was carried as "chosen, fits our tenancy" for days — half of it had never been
checked, and the unchecked half (billing, quota) was the actual blocker.

## Prompt
> Vet the claim: "**{{claim}}**" for use in {{context}}. Output four sections and do
> not blend them:
>
> - **GROUNDED** — facts verified THIS session against primary sources (official docs,
>   the actual model card/license/pricing page). Name each source.
> - **ASSUMED** — every load-bearing thing you could NOT verify, each with the exact
>   command or check that closes it, and WHERE it must run (sandbox / host / portal /
>   billing console).
> - **DISTINCTION TRAPS** — adjacent facts that feel like verification but aren't.
>   (Shared SSO ≠ a subscription. A model card ≠ an installed runtime. An API existing
>   ≠ your account having quota. TTS ≠ speech-to-speech.)
> - **ALTERNATIVES** — 1–2 kept genuinely open, each with the single decisive
>   criterion that would pick it.
>
> End with one verdict: **proceed** / **block on fact** (name it) / **choose
> alternative** (name it). Write the brief to `docs/{{topic}}-vetting.md` — vetting
> that lives only in chat evaporates.

## Standing rule
When a decision supersedes an earlier one, mark the old doc SUPERSEDED at the top and
keep it as the recorded alternative — deletion destroys the reasoning trail.
