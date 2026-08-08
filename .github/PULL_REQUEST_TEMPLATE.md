## What does this PR do?

A clear summary of the change. One logical change per PR.

## Related issue

Fixes #NN or relates to #NN.

## Type of change

- [ ] Bug fix
- [ ] Feature
- [ ] ML / data pipeline (training, corpus, model)
- [ ] Documentation
- [ ] Security / Rejects layer
- [ ] Other

## Verification

Evidence over hope - how was this verified?

- [ ] `npm run check` passes (typecheck + test + build)
- [ ] New tests added for pure logic (Rejects, brands, support, indicators, training, classifier)
- [ ] Test count: (before -> after)
- [ ] Live/browser verification done (if UI or model path changed)
- [ ] Model retrained and re-exported (if ML pipeline changed)

## Privacy and security checklist

- [ ] No secrets, keys, or account/zone IDs are committed
- [ ] No raw user content is persisted; the Rejects layer still runs inbound/outbound
- [ ] No deliberate decision from AGENTS.md was silently reverted
- [ ] If this touches `/reports`, `/indicators`, or storage writes, the change is discussed

## Notes for reviewers

Anything reviewers should know: edge cases, trade-offs, follow-up work.
