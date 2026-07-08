# Feedback Staging

Drop raw real-world prompt failures here as `.json` files, then run:

```powershell
npm run feedback:promote
```

Promotion copies each raw feedback file into `tests/failures/` as a structured
regression case and refreshes `tests/promptfoo-regression.json`.

Raw feedback schema:

```json
{
  "id": "scope-missed-addendum",
  "prompt_id": "core.scope-pipeline",
  "input": "What the user asked or supplied.",
  "model_output": "What the model returned.",
  "user_complaint": "Why the output was wrong or unhelpful.",
  "expected_behavior": "What future runs must preserve.",
  "required_terms": ["Verify gate", "recompute"],
  "forbidden_terms": ["guess"]
}
```

Do not put secrets, customer-private records, credentials, or unredacted personal
data in this folder.
