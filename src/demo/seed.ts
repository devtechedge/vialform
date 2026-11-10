import { eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import * as schema from "@/db/schema";
import type { ApprovalStatus } from "@/domain/enums";
import { hashPassword } from "@/server/auth/password";
import { getStorage, sha256Hex, syntheticDocument } from "@/server/storage";
import { CANDIDATE_SEEDS } from "./candidates";
import { REGULATORY_SEEDS } from "./regulatory";
import { did } from "./ids";

export const DEMO_PASSWORD = "Vialform-Demo-2026!";
export const DEMO_ACCOUNTS = {
  admin: "admin@vialform.demo",
  research: "research@vialform.demo",
  buyer: "buyer@helix.demo",
  member: "member@helix.demo",
} as const;

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();
const iso = (ms: number) => new Date(ms);

function familyFor(name: string): string {
  if (/CJC|GHRP|Ipamorelin|Hexarelin|Tesamorelin/.test(name)) return "Growth-hormone secretagogue";
  if (/BPC|TB-500|PEG-MGF|IGF/.test(name)) return "Repair / growth factor";
  if (/GHK|KPV|LL-37/.test(name)) return "Antimicrobial / matrikine";
  if (/MOTS/.test(name)) return "Mitochondrial-derived";
  if (/Epitalon|DSIP/.test(name)) return "Short regulatory peptide";
  if (/Kisspeptin|Melanotan|PT-141|Oxytocin/.test(name)) return "Melanocortin / reproductive";
  if (/Semax|Selank/.test(name)) return "Neurotropic";
  if (/AOD|Retatrutide|Dihexa/.test(name)) return "Metabolic research";
  if (/Semaglutide|Tirzepatide|Liraglutide/.test(name)) return "Incretin (approved medicine)";
  return "Research peptide";
}

const ACTIVE_DEMO = new Set(["GHK-Cu", "Epitalon", "Ipamorelin", "KPV", "MOTS-c", "GHRP-6"]);

function approvalStatus(name: string, country: string, index: number): ApprovalStatus {
  if (name === "BPC-157" && country === "US") return "REJECTED";
  if (ACTIVE_DEMO.has(name) && country === "US") return "ACTIVE";
  if (name === "GHK-Cu" && country === "EU") return "ACTIVE";
  if (name === "Ipamorelin" && country === "IN") return "ACTIVE";
  if (name === "Epitalon" && country === "EU") return "SUSPENDED";
  if (name === "KPV" && country === "IN") return "EXPIRED";
  const cycle: ApprovalStatus[] = ["DISCOVERY", "LEGAL_REVIEW", "DOCUMENT_REVIEW", "LEGAL_REVIEW"];
  return cycle[index % cycle.length]!;
}

/**
 * Populate a fresh demo database with synthetic, clearly-labelled data and
 * DETERMINISTIC ids so every serverless instance serves identical records and
 * links never 404 across instances. Idempotent via the demo_seeded marker.
 */
export async function seedDemo(db: Database): Promise<void> {
  const marker = await db.select().from(schema.appMeta).where(eq(schema.appMeta.key, "demo_seeded"));
  if (marker.length > 0) return;

  const storage = getStorage();
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  const regulatoryIds: Record<string, string[]> = { US: [], IN: [], EU: [] };
  for (const source of REGULATORY_SEEDS) {
    const id = did(`reg:${source.title}`);
    await db.insert(schema.regulatorySources).values({ ...source, id, accessedAt: iso(Date.parse(source.accessedAt)), isDemo: false });
    if (regulatoryIds[source.jurisdiction]) regulatoryIds[source.jurisdiction]!.push(id);
  }

  const candidateIds = new Map<string, string>();
  for (const candidate of CANDIDATE_SEEDS) {
    const id = did(`cand:${candidate.canonicalName}`);
    candidateIds.set(candidate.canonicalName, id);
    await db.insert(schema.candidates).values({ ...candidate, id, status: candidate.excludedFromRuo ? "EXCLUDED" : "NOT_APPROVED", isDemo: false });
  }

  const adminId = did(`user:${DEMO_ACCOUNTS.admin}`);
  const researchId = did(`user:${DEMO_ACCOUNTS.research}`);
  const buyerId = did(`user:${DEMO_ACCOUNTS.buyer}`);
  const memberId = did(`user:${DEMO_ACCOUNTS.member}`);
  await db.insert(schema.users).values([
    { id: adminId, email: DEMO_ACCOUNTS.admin, passwordHash, fullName: "Demo Compliance Admin", staffRole: "COMPLIANCE_ADMIN", emailVerified: true, isDemo: true },
    { id: researchId, email: DEMO_ACCOUNTS.research, passwordHash, fullName: "Demo Research Admin", staffRole: "RESEARCH_ADMIN", emailVerified: true, isDemo: true },
    { id: buyerId, email: DEMO_ACCOUNTS.buyer, passwordHash, fullName: "Demo Buyer", emailVerified: true, isDemo: true },
    { id: memberId, email: DEMO_ACCOUNTS.member, passwordHash, fullName: "Demo Team Member", emailVerified: true, isDemo: true },
  ]);

  const helixId = did("org:helix-demo");
  const meridianId = did("org:meridian-demo");
  await db.insert(schema.organizations).values([
    { id: helixId, name: "Helix Research Institute (Demo)", slug: "helix-demo", type: "RESEARCH_INSTITUTE", country: "US", deliveryCountry: "US", verificationStatus: "VERIFIED", isDemo: true },
    { id: meridianId, name: "Meridian Biotech (Demo)", slug: "meridian-demo", type: "BIOTECH", country: "IN", deliveryCountry: "IN", verificationStatus: "PENDING", isDemo: true },
    { id: did("org:northstar-demo"), name: "Northstar Wellness (Demo)", slug: "northstar-demo", type: "OTHER", country: "US", deliveryCountry: "US", verificationStatus: "UNVERIFIED", isConsumerDestination: true, isDemo: true },
  ]);

  await db.insert(schema.memberships).values([
    { id: did("mem:helix:buyer"), organizationId: helixId, userId: buyerId, role: "OWNER" },
    { id: did("mem:helix:member"), organizationId: helixId, userId: memberId, role: "MEMBER" },
  ]);
  await db.insert(schema.verificationRequests).values([
    { id: did("ver:helix"), organizationId: helixId, submittedBy: buyerId, legalName: "Helix Research Institute (Demo)", purpose: "Institutional analytical reference research (demo).", status: "APPROVED", reviewerId: adminId, reviewedAt: iso(now - 10 * DAY), reviewNotes: "Synthetic demo verification.", isDemo: true },
    { id: did("ver:meridian"), organizationId: meridianId, submittedBy: buyerId, legalName: "Meridian Biotech (Demo)", purpose: "Pending institution verification (demo).", status: "PENDING", isDemo: true },
  ]);

  const apexId = did("sup:Apex Peptide Labs (Demo)");
  const nordicId = did("sup:Nordic Reference Standards (Demo)");
  await db.insert(schema.suppliers).values([
    { id: apexId, name: "Apex Peptide Labs (Demo)", country: "US", licenseNumber: "DEMO-SUP-001", qualificationStatus: "QUALIFIED", isDemo: true },
    { id: nordicId, name: "Nordic Reference Standards (Demo)", country: "SE", licenseNumber: "DEMO-SUP-002", qualificationStatus: "QUALIFIED", isDemo: true },
  ]);

  const productIds = new Map<string, string>();
  let skuCounter = 1000;
  const ruoCandidates = CANDIDATE_SEEDS.filter((candidate) => !candidate.excludedFromRuo);
  for (const candidate of ruoCandidates) {
    skuCounter += 1;
    const sku = `VF-${skuCounter}`;
    const id = did(`prod:${candidate.canonicalName}`);
    productIds.set(candidate.canonicalName, id);
    await db.insert(schema.products).values({
      id, sku,
      candidateId: candidateIds.get(candidate.canonicalName),
      name: candidate.canonicalName,
      family: familyFor(candidate.canonicalName),
      moleculeType: candidate.moleculeType,
      lengthAa: candidate.lengthAa,
      sequence: null, sequenceSource: null, formula: null, molecularWeight: null,
      modifications: candidate.construct === "MODIFIED" ? "Modified construct (demo record; details require sourced verification)." : null,
      identifiers: candidate.casNumber ? [`CAS ${candidate.casNumber}`] : [],
      grade: "Research reference grade (demo)",
      spec: "Identity and purity require sourced verification before procurement.",
      status: "PUBLISHED",
      evidenceNotes: "Demonstration dossier. Identity classification is grounded; sequence, formula and assays are not asserted.",
      isDemo: true,
    });
    for (const alias of candidate.aliases) {
      await db.insert(schema.productAliases).values({ id: did(`alias:${candidate.canonicalName}:${alias}`), productId: id, alias, kind: "SYNONYM" });
    }
    await db.insert(schema.productAliases).values({ id: did(`alias:${candidate.canonicalName}:${sku}`), productId: id, alias: sku, kind: "CODE" });
  }

  let index = 0;
  for (const candidate of ruoCandidates) {
    const productId = productIds.get(candidate.canonicalName)!;
    for (const country of ["US", "IN", "EU"]) {
      const status = approvalStatus(candidate.canonicalName, country, index);
      const active = status === "ACTIVE";
      await db.insert(schema.jurisdictionApprovals).values({
        id: did(`app:${candidate.canonicalName}:${country}`),
        productId, country, status,
        lawfulPurpose: active ? "Institutional research reference (demo)." : null,
        legalBasis: active ? "Synthetic demonstration basis - not a legal determination." : null,
        licenses: active ? ["DEMO-LIC-0001"] : [],
        regulatorySourceIds: regulatoryIds[country] ?? [],
        reviewerId: active ? adminId : null,
        reviewedAt: active ? iso(now - 5 * DAY) : null,
        expiresAt: status === "EXPIRED" ? iso(now - 2 * DAY) : active ? iso(now + 180 * DAY) : null,
        reviewNotes: active ? "Synthetic demonstration approval. Not a regulatory determination." : null,
        isDemo: true,
      });
    }
    index += 1;
  }

  let lotCounter = 5000;
  for (const candidate of ruoCandidates) {
    const productId = productIds.get(candidate.canonicalName)!;
    lotCounter += 1;
    const lotNumber = `VF-LOT-${lotCounter}`;
    const lotId = did(`lot:${lotNumber}`);
    const released = ACTIVE_DEMO.has(candidate.canonicalName);
    const supplierId = lotCounter % 2 === 0 ? apexId : nordicId;
    await db.insert(schema.lots).values({
      id: lotId, lotNumber, productId, supplierId,
      status: released ? "RELEASED" : "QUARANTINE",
      manufactureDate: iso(now - 60 * DAY), expiryDate: iso(now + 365 * DAY),
      unit: "mg", quantityMinor: 5000, reservedMinor: 0,
      custody: [{ at: iso(now - 60 * DAY).toISOString(), event: "Received (demo)", actor: "Demo supplier" }, { at: iso(now - 55 * DAY).toISOString(), event: "Quarantine intake (demo)", actor: "Demo QA" }],
      storageConditions: "-20 C, desiccated (demo)",
      isDemo: true,
    });
    for (const kind of ["COA", "HPLC", "MASS_SPEC"] as const) {
      const key = `demo/${lotNumber}/${kind.toLowerCase()}.txt`;
      const bytes = syntheticDocument(`${kind} for lot ${lotNumber} (${candidate.canonicalName})`);
      await storage.put(key, bytes, "text/plain");
      const docId = did(`doc:${lotNumber}:${kind}`);
      await db.insert(schema.lotDocuments).values({
        id: docId, lotId, kind, origin: "DEMO", storageKey: key,
        sha256: sha256Hex(bytes), fileName: `${lotNumber}-${kind.toLowerCase()}.txt`, mimeType: "text/plain", sizeBytes: bytes.length, version: 1,
        method: kind === "HPLC" ? "HPLC (synthetic demo)" : kind === "MASS_SPEC" ? "ESI-MS (synthetic demo)" : null,
        assayDate: iso(now - 50 * DAY),
        units: kind === "HPLC" ? "% area (demo)" : kind === "MASS_SPEC" ? "m/z (demo)" : null,
        reviewerId: researchId, reviewedAt: iso(now - 48 * DAY), isDemo: true,
      });
      if (kind === "COA") await db.update(schema.lots).set({ primaryCoaId: docId }).where(eq(schema.lots.id, lotId));
    }
    if (released) await db.insert(schema.lotReviews).values({ id: did(`lotrev:${lotNumber}`), lotId, reviewerId: researchId, decision: "RELEASED", notes: "Synthetic demo release. Not a real quality decision." });
  }

  for (const candidate of CANDIDATE_SEEDS) {
    await db.insert(schema.marketSignals).values({
      id: did(`sig:${candidate.canonicalName}`),
      candidateId: candidateIds.get(candidate.canonicalName)!,
      metric: "SELLER_COUNT", sourceUrl: "https://example.demo/watchlist", publisher: "VIALFORM demo (synthetic)",
      observedAt: iso(now - 3 * DAY), geography: "Global (illustrative)",
      observation: "Illustrative demo signal. Not measured demand, sales or supplier coverage.",
      valueText: null, confidence: "INSUFFICIENT",
      limitations: "Synthetic demo data. Search interest, seller counts and advertised prices are not verified units sold or audited revenue.",
      isDemo: true,
    });
  }

  const ghk = productIds.get("GHK-Cu")!;
  const epitalon = productIds.get("Epitalon")!;
  await db.insert(schema.savedDossiers).values({ id: did("saved:buyer:ghk"), organizationId: helixId, userId: buyerId, productId: ghk });
  await db.insert(schema.comparisons).values({ id: did("cmp:buyer:short"), organizationId: helixId, userId: buyerId, name: "Short peptides (demo)", productIds: [ghk, epitalon] });
  await db.insert(schema.notifications).values({ id: did("note:buyer:verified"), organizationId: helixId, userId: buyerId, kind: "VERIFICATION", title: "Institution verified (demo)", body: "Helix Research Institute is verified in this demonstration.", link: "/workspace", isDemo: true });

  await db.insert(schema.appMeta).values([
    { key: "sales_paused", value: "false" },
    { key: "kill_switch", value: "false" },
    { key: "fulfilment_enabled", value: "false" },
    { key: "demo_seeded", value: iso(now).toISOString() },
  ]);
  await db.insert(schema.auditEvents).values({ id: did("audit:seed"), actorId: adminId, actorRole: "COMPLIANCE_ADMIN", action: "SEED_DEMO", entityType: "system", entityId: "demo", summary: "Synthetic demo data seeded.", metadata: { candidates: CANDIDATE_SEEDS.length, products: ruoCandidates.length } });
}