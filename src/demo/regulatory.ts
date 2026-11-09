import type { ConfidenceLevel } from "@/domain/enums";

/**
 * Official regulatory references for the jurisdiction framework. URLs were
 * verified to resolve on 2026-11-08 except where noted. These are references,
 * not legal advice and not a determination that any compound is lawful to sell.
 * Unclear or unverified sources keep the related approval disabled.
 */
export type RegulatorySeed = {
  jurisdiction: string;
  title: string;
  publisher: string;
  sourceUrl: string;
  scope: string;
  accessedAt: string;
  confidence: ConfidenceLevel;
  uncertainty: string;
};

const ACCESSED = "2026-11-08T00:00:00.000Z";

export const REGULATORY_SEEDS: RegulatorySeed[] = [
  { jurisdiction: "IN", title: "CDSCO homepage", publisher: "Central Drugs Standard Control Organization", sourceUrl: "https://cdsco.gov.in/", scope: "India's national regulator for drugs, medical devices and cosmetics; licensing and clinical trials under the Drugs and Cosmetics Act 1940.", accessedAt: ACCESSED, confidence: "HIGH", uncertainty: "Verified resolving. Specific licensing pathways must be confirmed against the primary Acts and Rules." },
  { jurisdiction: "IN", title: "CDSCO SUGAM online portal", publisher: "CDSCO", sourceUrl: "https://cdscoonline.gov.in/CDSCO/homepage", scope: "Online import/registration/manufacturing applications (e.g. registration certificate and import licence forms).", accessedAt: ACCESSED, confidence: "HIGH", uncertainty: "Verified resolving. Form numbers and current process should be confirmed on the portal." },
  { jurisdiction: "IN", title: "Drugs Rules 1945 (compiled, with amendments)", publisher: "CDSCO", sourceUrl: "https://cdsco.gov.in/opencms/resources/UploadCDSCOWeb/2022/drug_rules/Drugs%20Rules%201945_2024%2009.pdf", scope: "Import, manufacture and sale licensing rules under the Drugs and Cosmetics Act 1940.", accessedAt: ACCESSED, confidence: "MEDIUM", uncertainty: "PDF resolves; text was not machine-extracted in this environment. Confirm current amendments against the official compilation." },
  { jurisdiction: "IN", title: "New Drugs and Clinical Trials Rules 2019", publisher: "CDSCO / Government of India", sourceUrl: "https://cdsco.gov.in/opencms/export/sites/CDSCO_WEB/Pdf-documents/NewDrugs_CTRules_2019.pdf", scope: "Defines 'new drug', investigational new drugs and the import/clinical-trial/approval framework (G.S.R. 227(E)).", accessedAt: ACCESSED, confidence: "HIGH", uncertainty: "Verified resolving at the Pdf-documents path; the older legacy path returns 404." },
  { jurisdiction: "IN", title: "Drugs and Cosmetics Act 1940 (India Code)", publisher: "India Code / Government of India", sourceUrl: "https://www.indiacode.nic.in/handle/123456789/18562", scope: "Parent Act regulating import, manufacture, distribution and sale of drugs.", accessedAt: ACCESSED, confidence: "INSUFFICIENT", uncertainty: "Could not verify this URL resolves from the build environment (network/geo block). Treat as unverified until confirmed; do not rely on it for an approval." },
  { jurisdiction: "US", title: "Certain bulk drug substances that may present significant safety risks", publisher: "US FDA", sourceUrl: "https://www.fda.gov/drugs/human-drug-compounding/certain-bulk-drug-substances-use-compounding-may-present-significant-safety-risks", scope: "Lists nominated bulk substances including BPC-157 flagged for safety risk (immunogenicity, peptide-related impurities).", accessedAt: ACCESSED, confidence: "HIGH", uncertainty: "BPC-157 is a nominated Category 2 substance, not on the approved 503A bulks list; PCAC review status is evolving and not settled." },
  { jurisdiction: "US", title: "Bulk drug substances used in compounding under section 503A", publisher: "US FDA", sourceUrl: "https://www.fda.gov/drugs/human-drug-compounding/bulk-drug-substances-used-compounding-under-section-503a-fdc-act", scope: "The 503A framework (USP monograph, approved-drug component, 503A bulks list) governing which bulk substances may be compounded.", accessedAt: ACCESSED, confidence: "HIGH", uncertainty: "A narrow licensed-compounding policy is not retail permission. Confirm current list status before any approval." },
  { jurisdiction: "US", title: "FDA warning letter: Gram Peptides (721806, 31 Mar 2026)", publisher: "US FDA", sourceUrl: "https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/warning-letters/gram-peptides-721806-03312026", scope: "Enforcement against research peptides sold for human use; cites unapproved new drugs including retatrutide and tirzepatide.", accessedAt: ACCESSED, confidence: "HIGH", uncertainty: "Illustrates enforcement risk; not a compound-by-compound legality determination." },
  { jurisdiction: "US", title: "FDA warning letter: Peak Performance Peptides (735127, 24 Aug 2026)", publisher: "US FDA", sourceUrl: "https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/warning-letters/peak-performance-peptides-735127-08242026", scope: "Violations for peptides marketed for human use.", accessedAt: ACCESSED, confidence: "HIGH", uncertainty: "Illustrates enforcement risk; not a compound-by-compound legality determination." },
];