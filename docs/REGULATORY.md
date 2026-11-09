# Regulatory framework

This document records the regulatory references and rules the portal enforces.
It is a research reference, not legal advice, and not a determination that any
compound is lawful to sell, import or export.

## Stance

- Only a lawful institution-facing research / analytical-reference workflow is
  built. Nothing promotes human or veterinary self-experimentation, dosing,
  administration, cycles or clinical protocols, and no therapeutic, bodybuilding
  or anti-ageing claims are made.
- Research-use-only wording is not proof of legality. Sale/import/export legality
  is never inferred from competitor listings or an RUO label.
- Candidates default to NOT_APPROVED and are unpurchasable. A product-country pair
  advances only through recorded server-side review states: DISCOVERY,
  LEGAL_REVIEW, DOCUMENT_REVIEW, JURISDICTION_APPROVED, ACTIVE, plus REJECTED,
  SUSPENDED and EXPIRED. Only ACTIVE permits an RFQ.
- Compliance admins record lawful purpose, legal basis, licences, supplier
  evidence, reviewer and review/expiry dates for each pair. Unclear evidence keeps
  the approval disabled.
- Prescription medicines, approved drugs, APIs and pharmacy/medical-licensed
  compounds are excluded from RUO sale unless cleared for a proper licensed
  channel. A narrow licensed-pharmacy or compounding policy is not retail
  permission.

## Jurisdictions researched (accessed 2026-11-08)

### India

Regulator: Central Drugs Standard Control Organization (CDSCO), under the Drugs
and Cosmetics Act 1940 and Drugs and Cosmetics Rules 1945. The New Drugs and
Clinical Trials Rules 2019 define "new drug" and the investigational/import/
clinical-trial framework. Licensing and import applications run through the SUGAM
portal.

- CDSCO: https://cdsco.gov.in/ (verified resolving)
- SUGAM: https://cdscoonline.gov.in/CDSCO/homepage (verified resolving)
- Drugs Rules 1945 compilation: https://cdsco.gov.in/opencms/resources/UploadCDSCOWeb/2022/drug_rules/Drugs%20Rules%201945_2024%2009.pdf (resolves; confirm current amendments)
- NDCT Rules 2019: https://cdsco.gov.in/opencms/export/sites/CDSCO_WEB/Pdf-documents/NewDrugs_CTRules_2019.pdf (verified; the older legacy path returns 404)
- Drugs and Cosmetics Act 1940 (India Code): https://www.indiacode.nic.in/handle/123456789/18562 (could not be verified from the build environment; treat as unverified)

### United States

Regulator: FDA. The section 503A/503B compounding framework governs which bulk
substances may be compounded; a narrow compounding policy is not retail
permission. FDA has flagged certain bulk substances (including BPC-157) for
significant safety risk and issued warning letters against research peptides
marketed for human use.

- Bulk substances safety risk (BPC-157): https://www.fda.gov/drugs/human-drug-compounding/certain-bulk-drug-substances-use-compounding-may-present-significant-safety-risks (verified; BPC-157 Category 2 / advisory-committee status is evolving)
- 503A bulk substances: https://www.fda.gov/drugs/human-drug-compounding/bulk-drug-substances-used-compounding-under-section-503a-fdc-act (verified)
- Warning letter, Gram Peptides (31 Mar 2026): https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/warning-letters/gram-peptides-721806-03312026 (verified)
- Warning letter, Peak Performance Peptides (24 Aug 2026): https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/warning-letters/peak-performance-peptides-735127-08242026 (verified)

## Excluded approved medicines

The watchlist flags these as approved medicines (or regionally approved /
investigational) and excludes them from RUO sale: tesamorelin, bremelanotide
(PT-141), tirzepatide, semaglutide, liraglutide, oxytocin (US-approved); semax,
selank, thymosin alpha-1 (regionally approved); retatrutide (investigational, not
approved as of Nov 2026).

## Watchlist method

The private watchlist ranks public market visibility and supplier coverage, never
sales. Search interest, seller counts, public prices and advertised stock are not
verified units sold or audited revenue. Each signal stores source URL, publisher,
date, geography, metric, observation, confidence and limitations. Insufficient or
stale evidence is flagged. Demonstration signals are synthetic and labelled.