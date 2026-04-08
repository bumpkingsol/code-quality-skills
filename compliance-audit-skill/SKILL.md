---
name: compliance-audit
description: >
  Audit an application's codebase for GDPR and HIPAA compliance issues, producing
  a structured report with findings organized by regulation and severity. Use this
  skill whenever the user mentions "GDPR," "HIPAA," "compliance audit," "privacy
  audit," "data protection audit," "PHI," "PII," "personal data compliance,"
  "health data compliance," "regulatory compliance," "privacy review," "is my app
  compliant," "check for compliance issues," "data privacy," "right to erasure,"
  "consent management," "DPIA," "BAA," "protected health information," or any
  variation of wanting to know whether their application meets privacy regulations.
  Even if the user just says "audit my app for privacy" or "are we GDPR compliant" —
  use this skill. Also trigger when the user is working on authentication, data
  storage, or user data handling and asks whether it meets regulatory requirements.
---

# Compliance Audit Skill

You are performing a comprehensive compliance audit of an application's codebase. Your goal is to identify concrete, actionable compliance gaps — not to produce a generic checklist, but to analyze the actual code and flag specific issues the developer needs to fix.

## How to approach the audit

### 1. Understand the application first

Before diving into compliance checks, get a lay of the land:

- Read the project's README, package.json (or equivalent), and entry points to understand what the app does
- Identify the tech stack (language, framework, database, cloud provider)
- Map out how user data flows through the system: collection → processing → storage → deletion
- Identify third-party services and integrations (analytics, payment processors, email providers, etc.)

This context matters because compliance requirements differ based on what kind of data the app handles and how it handles it. A healthcare app storing patient records has different obligations than an e-commerce site storing shipping addresses.

### 2. Determine which regulations apply

Ask the user which regulations they need to comply with if it's not clear from context. The two this skill covers are:

- **GDPR** — Applies if the app collects or processes personal data of EU/EEA residents
- **HIPAA** — Applies if the app handles Protected Health Information (PHI) in the US healthcare context

If both apply, audit for both. If only one applies, focus there but mention the other if you spot relevant issues.

**When both HIPAA and GDPR apply**, be aware of key conflicts and overlaps:
- **Retention vs erasure tension:** HIPAA requires retaining medical records for at least 6 years (§ 164.530(j)), while GDPR grants the right to erasure (Article 17). The resolution is to *anonymize* rather than delete — strip identifying information while preserving de-identified clinical records. Always flag this tension explicitly in the report so the developer understands why simple deletion won't work.
- **Consent models differ:** GDPR requires explicit, granular, withdrawable consent (Article 7). HIPAA allows processing PHI for treatment, payment, and healthcare operations *without* patient consent (§ 164.506), but requires consent for other uses. When both apply, the stricter GDPR consent requirements generally govern for EU patients.
- **Breach notification timelines differ:** GDPR requires notifying the supervisory authority within 72 hours (Article 33). HIPAA requires notifying individuals within 60 days, HHS annually for breaches under 500 affected individuals, and within 60 days for breaches over 500 (§ 164.404-408). The app needs to support both timelines.

### 3. Conduct the audit

Work through the codebase systematically. For each area below, search for relevant code patterns, configurations, and architecture decisions. The areas to examine differ by regulation.

#### GDPR audit areas

**Lawful basis & consent (Articles 6, 7, 9)**
- How does the app collect consent? Look for consent forms, cookie banners, opt-in mechanisms
- Is consent granular (separate purposes) or bundled?
- Can users withdraw consent? Is there a mechanism in the code?
- Are there pre-ticked checkboxes (not allowed under GDPR — confirmed by CJEU Planet49 ruling, C-673/17)?
- Is there a record of consent stored (who, when, what they consented to)?
- **Special category data (Article 9):** If the app processes health data, biometric data, racial/ethnic origin, political opinions, religious beliefs, trade union membership, genetic data, or sexual orientation, these require *explicit* consent under Article 9(2)(a) or another Article 9(2) legal basis. Health data is the most common case — telehealth, fitness, and healthcare apps must meet this higher bar, not just regular Article 6 consent.

**Data minimization**
- Does the app collect more data than it needs for its stated purpose?
- Are there database fields or form inputs that gather unnecessary personal data?
- Are there API endpoints that return more user data than the consumer needs?

**Right to access (Article 15)**
- Can users export their personal data? Is there a data export feature or API?
- What format is the export in? (Should be machine-readable)

**Right to erasure / Right to be forgotten (Article 17)**
- Is there a mechanism for users to delete their account and all associated data?
- Does deletion cascade to all related records, backups, logs, and third-party services?
- Are there soft-delete patterns that retain data instead of actually removing it?

**Data portability (Article 20)**
- Can users get their data in a structured, commonly used, machine-readable format?

**Data protection by design and by default (Article 25)**
- Is personal data encrypted at rest and in transit?
- Are there appropriate access controls on personal data?
- Is data pseudonymized or anonymized where possible?
- Are privacy-protective defaults in place? For example, do marketing preferences default to *off* rather than on? This is the "by default" part of Article 25 — the system's default state should be the most privacy-protective configuration, and users should have to actively opt in to less private settings.

**Data processing records (Article 30)**
- Is there documentation of what personal data is processed and why?

**Breach notification readiness (Articles 33-34)**
- Is there logging/monitoring that would detect a data breach?
- Are there incident response procedures in the code or documentation?
- GDPR requires notifying the supervisory authority within 72 hours of becoming aware of a breach (Article 33). Affected individuals must be notified "without undue delay" if the breach poses a high risk to their rights (Article 34).

**Data Protection Officer (Article 37)**
- If the app processes health data or other special category data at scale, a DPO appointment may be mandatory. Flag this in the report if the app handles health/biometric data.

**Cross-border data transfers (Chapter V)**
- Where is data stored geographically?
- Are there transfers to countries outside the EU/EEA?
- What transfer mechanisms are in place (Standard Contractual Clauses, adequacy decisions)?

**Third-party processors**
- What third-party services receive personal data?
- Are Data Processing Agreements in place?

**Cookie and tracking compliance**
- What cookies does the app set? Are they categorized (necessary, functional, analytics, marketing)?
- Is there a cookie consent mechanism that blocks non-essential cookies until consent?
- Are tracking scripts (analytics, ads) loaded before consent?

#### HIPAA audit areas

**Security Risk Analysis (§ 164.308(a)(1)(ii)(A))**
- This is the #1 most-cited violation in HHS enforcement actions. HIPAA requires a formal, documented risk analysis. While you can't perform a full SRA through code review, flag whether there's any evidence of one (risk assessment docs, security policies). If absent, flag it — it's the single most common reason organizations get fined.

**PHI identification**
- What data qualifies as PHI in this application? (Any of the 18 HIPAA identifiers combined with health information)
- Where is PHI stored, transmitted, and processed?
- Map all PHI data flows
- The 18 HIPAA identifiers: names, geographic data smaller than state, dates (except year), phone numbers, fax numbers, email addresses, SSN, medical record numbers, health plan beneficiary numbers, account numbers, certificate/license numbers, vehicle identifiers/serial numbers, device identifiers/serial numbers, web URLs, IP addresses, biometric identifiers, full-face photos, any other unique identifying number

**Access controls (§ 164.312(a))**
- Is there role-based access control (RBAC) for PHI?
- Are there unique user IDs for everyone accessing PHI?
- Is there an automatic session timeout / logoff mechanism?
- Are there emergency access procedures?

**Audit controls (§ 164.312(b))**
- Is access to PHI logged?
- Are logs tamper-resistant?
- Do logs capture who accessed what, when, and from where?
- Is there a mechanism to review audit logs?

**Integrity controls (§ 164.312(c))**
- Are there mechanisms to ensure PHI hasn't been altered or destroyed improperly?
- Are there checksums or hashing for stored PHI?

**Transmission security (§ 164.312(e))**
- Is PHI encrypted in transit (TLS/SSL)?
- Are there integrity controls for transmitted PHI?
- Are there any unencrypted transmission paths (HTTP, unencrypted email, FTP)?

**Encryption at rest (§ 164.312(a)(2)(iv))**
- Is PHI encrypted at rest in the database?
- Are backups encrypted?
- Are encryption keys managed securely?
- Note: encryption at rest is an *addressable* specification under HIPAA, not *required*. This doesn't mean it's optional — it means the covered entity must implement it OR document why an equivalent alternative is reasonable and appropriate. In practice, modern applications should always encrypt PHI at rest since the cost is negligible and alternatives are hard to justify. When reporting this finding, note that it is addressable but strongly recommended.

**Minimum necessary standard (§ 164.502(b))**
- Do API endpoints and queries return only the minimum PHI needed?
- Are there broad SELECT * queries pulling all patient data when only specific fields are needed?

**De-identification (§ 164.514)**
- Where PHI is used for analytics or secondary purposes, is it properly de-identified?
- Are the 18 HIPAA identifiers removed or generalized?

**Business Associate Agreements**
- What third-party services handle PHI?
- Is there evidence that BAAs are required/in place?

**Backup and disaster recovery (§ 164.308(a)(7))**
- Are there data backup procedures?
- Is there a disaster recovery plan?
- Are backups tested?

**Authentication (§ 164.312(d))**
- How are users authenticated?
- Is multi-factor authentication available/required for PHI access?
- Are passwords stored securely (hashed, salted)?

## 4. Generate the report

Structure your output as an actionable report. This is a to-do list for the developer — each finding should tell them exactly what's wrong and what to do about it.

### Report structure

```
# Compliance Audit Report
## Application: [name]
## Date: [date]
## Regulations audited: [GDPR / HIPAA / both]

---

## Executive Summary

[2-3 sentences: overall compliance posture, number of findings by severity, most critical areas needing attention]

---

## GDPR Findings

### Critical
[Findings that represent immediate legal risk or active non-compliance]

### High
[Findings that need to be addressed soon — significant gaps]

### Medium
[Findings that should be planned for — best practice gaps]

### Low
[Minor improvements or recommendations]

---

## HIPAA Findings

### Critical
...

### High
...

### Medium
...

### Low
...

---

## Summary To-Do List

[A prioritized, consolidated action list pulling from all findings above — the developer's roadmap for becoming compliant]
```

### How to write each finding

Each finding should follow this format:

```
#### [Finding title]
**Location:** [file path(s) and line numbers where the issue exists]
**Regulation:** [specific article/section, e.g., "GDPR Article 17" or "HIPAA § 164.312(a)"]
**Issue:** [what's wrong — be specific about the code/architecture, not generic]
**Risk:** [what could happen if this isn't fixed — regulatory fines, data breach exposure, etc.]
**Action:** [exactly what the developer needs to do to fix it]
```

### Severity guidelines

**Critical** — Active non-compliance that could result in regulatory action:
- Unencrypted PHI in transit or at rest
- No mechanism for data deletion (right to erasure)
- PHI accessible without authentication
- No audit logging for PHI access
- Personal data sent to third parties without consent

**High** — Significant gaps that need near-term remediation:
- Consent collected but not recorded
- Soft-delete instead of actual deletion for personal data
- Missing access controls on sensitive endpoints
- No data export capability
- Overly broad data queries (minimum necessary violation)

**Medium** — Best practice gaps that should be planned:
- No cookie consent mechanism
- Missing Data Processing Impact Assessment
- No incident response procedure documented
- Session timeouts too long
- Missing data processing records

**Low** — Improvements and recommendations:
- Data could be further minimized
- Pseudonymization opportunities
- Documentation improvements
- Additional encryption opportunities

## Important principles

**Be specific, not generic.** Every finding must reference actual code, files, or architecture in the project. "You should encrypt data at rest" is useless. "The `users` table in `schema.prisma:42` stores email, phone, and date_of_birth in plaintext — these personal data fields should be encrypted at rest using your database's encryption features or application-level encryption" is useful.

**Don't manufacture issues.** If the codebase handles something well, say so. A useful audit acknowledges what's already compliant. Include a brief "What's already in good shape" section if applicable.

**Prioritize ruthlessly.** A developer getting a 50-item to-do list will freeze. The summary to-do list should be ordered by impact — what fixes the most critical compliance gaps with the least effort first.

**Understand the tech stack.** Recommendations must be actionable within the project's actual technology. Don't recommend PostgreSQL-specific features for a MongoDB project. Don't suggest middleware patterns that don't exist in the framework being used.

**Consider the full data lifecycle.** Follow personal data from the moment it enters the application to the moment it's deleted. Check every touchpoint: forms, APIs, databases, logs, caches, third-party services, backups, analytics.

**Check configuration, not just code.** Look at database configs, environment variables, cloud provider settings (if visible), CI/CD configs, and infrastructure-as-code files. Compliance issues often live in configuration, not application logic.

**Use accurate penalty context.** When describing risk in HIPAA findings, reference the HITECH Act's four-tier penalty structure so developers understand the actual financial exposure:
- Tier 1 (did not know): $100–$50,000 per violation
- Tier 2 (reasonable cause): $1,000–$50,000 per violation
- Tier 3 (willful neglect, corrected within 30 days): $10,000–$50,000 per violation
- Tier 4 (willful neglect, not corrected): $50,000 per violation
- Annual cap: $1.5M per violation category per year
For GDPR, fines can reach up to 4% of annual global turnover or EUR 20 million, whichever is higher (Article 83). Lower-tier violations cap at 2% or EUR 10 million.

**Add a disclaimer.** End every report with a note that this is a code-level audit, not a substitute for legal counsel. Compliance also requires organizational measures (workforce training, policies, procedures, physical safeguards) that cannot be assessed through code review alone. Recommend the developer consult with a qualified compliance professional or attorney for a complete compliance program.
