# Import coaching autofill

Back-and-biceps imports now recognize the six supplied exercise names. The four
new catalogue entries are Cable Face Pull, Dumbbell Deadlift, Barbell Bicep Curl
and Dumbbell Hammer Curl. Kannada names are transliterations. Catalogue muscle
roles and form cues are suggestions for coach review, separate from source data.

## Review controls

- `Autofill all coaching details` fills blank Kannada names, muscle roles and
  coaching notes for matched exercises across all sessions.
- Enter a coach-selected tempo and/or RIR, then select `Apply tempo / RIR to
  blank fields`. Inputs start empty. RIR follows the existing Studio range, 1-4.
- Existing values, exercise names, numeric set rows and Each Side flags are
  retained. Repeated clicks do not duplicate content. The explicit coach-default
  provenance is retained in saved draft notes; it is not labelled source text.
- Exercises exceeding the six-note Studio limit are skipped by the defaults
  action and reported for manual review.

`Dumbbell Deadlift` does not identify a variation. Its Kannada name and a coach
review note can fill automatically, but its muscle arrays stay empty until the
coach identifies the intended variation. It is not treated as a Romanian
deadlift. Unsupported name variations do not get a guessed match.

This change does not add superset grouping or set-specific Each Side fields.
The existing review/confirmation gate remains in place. Nothing is published or
assigned to members by autofill.

## Coaching references

New cues are brief original paraphrases for review, not copied exercise articles.

- Cable face pull: https://www.nasm.org/resource-center/exercise-library/face-pull
- Barbell bicep curl: https://www.acefitness.org/resources/everyone/exercise-library/70/bicep-curl/
- Dumbbell hammer curl: https://www.acefitness.org/resources/everyone/exercise-library/10/hammer-curl/
- Distinct Romanian variant: https://www.nasm.org/resource-center/exercise-library/dumbbell-romanian-deadlift

## Validation

`node --test test/coaching-autofill.test.mjs` passes 10 tests, including all six
source names, preserved set rows, explicit defaults, invalid input, idempotence,
note capacity, saved provenance and the existing catalogue regression cases.
JavaScript syntax checks pass for the changed modules. Browser interaction QA
was attempted but could not launch because this environment has no Chromium
executable. The full server suite was not run; Express and other server-only
dependencies are not installed in this local workspace. Production deployment
and signed-in browser verification remain pending.
