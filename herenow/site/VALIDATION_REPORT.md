# Claim Interlock Product Pack - Validation Report

**Validation date:** 18 August 2026  
**Pack version:** 1.0

## Artifact validation

| Artifact | Result |
|---|---|
| Master dossier | 31 pages; DOCX converted to PDF; every rendered page visually inspected; no observed clipping or overlap. |
| Hackathon deck | 17 slides; slide overflow test passed; PPTX converted to PDF; rendered PPTX and PDF montages visually inspected. |
| Executive one-pager | 1-page landscape PDF; rendered and visually inspected; PDF preflight passed. |
| Product-pack PDFs | Openable, unencrypted, and not scan-only according to PDF preflight. |

## MVP validation

`python -m pytest -q tests/test_state_machine.py`

```text
5 passed in 0.04s
```

The headless Chromium interaction test also passed the complete golden path:

- the initial claim is blocked;
- scoped requests are issued;
- valid workshop evidence is accepted;
- an unauthorized `claim.approve` mutation is denied;
- the coordinator crashes after a real side-effect boundary;
- restart finds the existing receipt;
- the notification count remains exactly one;
- supervisor approval is required;
- the final state becomes `repair_authorised`; and
- the 84% recall scenario is classified assistive-only while the 96% sandbox scenario passes the configured safety gate.

The machine-readable browser result is stored at `02_MVP/results/browser_flow_results.json`.

## Evidence boundary

The user studies and impact figures in this pack are synthetic experiments, not field results. They are included to test assumptions and expose failure conditions. The pack does not claim a live insurer deployment or a completed Google Cloud hackathon build.
