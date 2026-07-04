# Adversarial safety red-team (shields, filters, validators)

> You are attacking a safety control — a scam filter, an input validator, an
> allow/deny list — that was just changed. Do NOT read the diff to confirm it
> works; reading the diff is exactly how structural holes survive. Instead, try
> to get a bad input THROUGH. Enumerate the categories the control must stop,
> and for each construct the specific input that reaches the user anyway: a
> trusted brand name that rescues a scam, an unchecked non-remote path, a
> homoglyph or zero-width evasion, the phrasing the vocabulary doesn't cover.
> Run each through the REAL function and record the verdict. Then run the
> NEGATIVE control: a legitimate input that collides with the new rule — it must
> still pass, or the fix over-blocks a real user. Report as a table: every
> input, its verdict, and whether it is a hole (bad got through) or an
> over-block (good got hidden). The control is verified only when every
> adversarial input is caught AND every legitimate input still passes — and the
> receipt is the harness output an outsider can re-run, not your summary of it.

## When to use

Any change to code that decides what a user is allowed to see or do: scam/spam
shields, moderation filters, auth/permission checks, input validators, rate
limits, allow/deny lists. Run it as a *separate actor* from whoever wrote the
change — a control graded by its own author caps at ASSERTED, never VERIFIED.

## Why it beats reviewing the diff

Additive changes (adding vocabulary, adding a rule) make a control look stronger
while leaving structural holes untouched — a trusted-name rescue, a branch that
skips the check, a path the new pattern doesn't reach. Those are found only by
adversarial input, never by reading the addition. Pair every "it now catches X"
with "and it still passes legitimate Y," because over-blocking is a silent
failure that costs a real user real access.
