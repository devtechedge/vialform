# Changelog

## 0.1.0

Initial public demonstration of VIALFORM, an evidence-first B2B peptide research
procurement portal.

- Precision-instrument design system with light/dark themes and WCAG 2.2 AA.
- Jurisdiction-gated catalogue with server search over name, synonym, SKU and
  molecular metadata; scientific dossiers with evidence tiers and lot passports.
- Synthetic HPLC/MS plots and demo COAs clearly labelled not-a-test-result.
- Compare up to four dossiers with missing fields exposed.
- Database-backed auth, institution onboarding and verification, RBAC and tenant
  isolation.
- Compliance lifecycle (discovery to active) with legal-basis gating, global sales
  pause, kill switch and fulfilment gate.
- RFQ to quote to PO to order to shipment workflow with immutable snapshots,
  server-computed pricing and atomic lot reservation; demo cannot order or invoice.
- Admin console, private market watchlist with provenance-preserving CSV export,
  and an append-only audit trail.
- Private signed expiring downloads with SHA-256 integrity; upload limits and a
  malware-scan hook.
- Vitest unit and PGLite integration tests, Playwright e2e with axe, and CI.