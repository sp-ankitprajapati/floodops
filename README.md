# FloodOps

An early browser-based prototype for reviewing imported flood warnings, preparing source-linked checklists, assigning roles and recording follow-through. Created in November 2026 by Ankit Prajapati, with AI-assisted development.

## Current status

Working software prototype, with **no real beneficiaries, participating institutions, operational deployments, revenue or demonstrated reduction in flood losses**. The bundled CAP warning and institution are synthetic. Software tests and agent-operated UI checks are not community validation.

The core workflow works without dependencies, an API key, an LLM or a paid service. The optional local writing experiment downloads the pinned Transformers.js runtime and an open FLAN-T5 model to the visitor’s browser. Model output never creates or approves tasks. Initial small-model testing exposed poor wording and omission of the exercise label; the latter is now explicitly rejected. Generation quality is not validated.

## Run

Requires Node.js 22 or newer. From this directory:

```sh
node --test tests/core.test.mjs
node serve.mjs
```

Open the printed local address. No package installation is required. The optional local model needs internet access for its initial downloads and sufficient browser memory. Model downloads are not a metered inference API; normal connectivity and hosting/account terms still apply.

## Demonstrate the workflow

1. Select **Open sample exercise**. The replay clock is fixed at 5 November 2026, 10:00 AM IST. The message is marked `Exercise`, with a fictional area and sender ending in `.invalid`.
2. Inspect the warning and select **Build a draft checklist**.
3. Enter responsible roles for all six source-linked tasks. Inspect the public guidance behind them. The task wording is an adapted prototype checklist, not a quotation or an officially endorsed site plan.
4. Check the review box, enter an exercise reviewer role and approve the exercise plan. Approval is self-reported and bound to the exact warning revision, policy version and assignments.
5. Record progress and a note. Export the workspace or download a reviewed text brief. No public alert is sent.
6. Try evidence search, for example `documents records`. An unsupported query returns no supporting note rather than an invented answer.
7. Optionally try the local AI writing experiment. It is an unreviewed, isolated experiment with limited guards, not an emergency-communications service.

## Implemented controls

- CAP 1.2 XML import, including namespaced elements; rejects DTD/entity declarations and oversized XML.
- Required identifiers, timestamp timezones, supported status/type/scope, English information block, event/area and expiry validation. This is a documented subset, not complete CAP XSD conformance.
- Duplicate suppression; conflicting content with an existing identity is rejected.
- Explicit exercise/current-time modes; expired, future-effective, unsupported-language/hazard and superseded/cancelled messages cannot generate or progress a checklist.
- Same-sender references, chronological ordering and status checks for lifecycle messages. Reconciliation handles referenced originals arriving after their cancellation.
- Mandatory role assignments and explicit Boolean review. Assignment changes invalidate review; task-content changes fail the plan hash check.
- Six adapted source-linked preparedness notes with lexical TF–IDF-style retrieval. This is information retrieval, not a trained flood-prediction model.
- Optional in-browser pretrained `Xenova/flan-t5-base` via Transformers.js 3.8.1. No model was trained or fine-tuned for FloodOps. Numeric, movement-instruction and exercise-label checks are incomplete safeguards and do not establish factual correctness.
- Browser-local persistence and JSON/text export. Reopening/restoring resets approvals; progress and activity records remain. Imported history is explicitly unauthenticated.

## Limits

The app does not poll a live warning feed, authenticate alert signatures, determine who is in a hazard area, predict floods, verify safe routes or shelter capacity, dispatch messages, provide medical advice or replace emergency authorities. A supplied official-looking URL is not verification. CAP messages are untrusted imported content.

The prototype has no shared backend, staff authentication, cross-device synchronisation or tamper-proof records. A user can modify browser storage and source code. Real organisational use requires authenticated roles, server-side authorisation, approved site procedures, operational monitoring, source-feed agreements and drills with the intended community.

## GitHub foundations

The author’s earlier [WealthPilot](https://github.com/sp-ankitprajapati/wealthpilot) and [Strata](https://github.com/sp-ankitprajapati/strata) informed the evidence-preserving review and revision-bound approval approach. FloodOps is a new, separate application; those projects’ historical test counts or results are not FloodOps results.

## Sources

- [OASIS CAP 1.2](https://docs.oasis-open.org/emergency/cap/v1.2/CAP-v1.2.html): message structure and lifecycle references.
- [SACHET](https://sachet.ndma.gov.in/): existing Indian public warning portal; not an integration or partnership.
- [Maharashtra SDMA guidance](https://sdma.maharashtra.gov.in/en/dos-and-donts/): general flood-preparedness context.
- [NDMA urban-flood guidelines](https://www.niti.gov.in/sites/default/files/2021-03/Annexure-NDMA-Guidelines-compressed.pdf): inclusion and preparedness context.
- [FLAN-T5 ONNX model card](https://huggingface.co/Xenova/flan-t5-base) and [Transformers.js](https://huggingface.co/docs/transformers.js/): optional local generation.

See [demo and validation plan](docs/DEMO_AND_VALIDATION.md), [data and safety notes](docs/DATA_AND_SAFETY.md) and [verification record](results/verification.json).
