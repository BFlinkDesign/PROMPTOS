# Promoted Failure Regressions

Each `.json` file in this directory is a structured regression case created
from feedback or from an explicit seed case. `npm run feedback:promote` rebuilds
`tests/promptfoo-regression.json` from this directory.

These files are part of the test suite. Do not edit the generated promptfoo
matrix by hand; edit a failure case here, then run:

```powershell
npm run feedback:promote
npm run verify
```
