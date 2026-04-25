# Detection Patterns by Language

Search/regex patterns used during Phase 2 of the production gap audit. Load this file once
Phase 1.2 has detected the stack, then pull only the sections relevant to that stack.

Each section below mirrors a Phase 2 subsection (2.1–2.9). Within each section:
- **Generic patterns** apply across most languages (or are language-agnostic enough to try first).
- **Language-specific** patterns are keyed by language and should only be used when that
  language is present in the codebase.

---

## 2.1 Silent Failures

**Generic patterns (JavaScript/TypeScript):**
```
catch\s*\([^)]*\)\s*\{[\s]*\}
catch\s*\([^)]*\)\s*\{\s*console\.(log|warn|error)
\.catch\(\s*\(\)\s*=>
\.catch\(\s*console\.(log|warn|error)\s*\)
```

**Language-specific:**
- **Python**: `except:\s*pass`, `except Exception.*:\s*(pass|continue)`, `except.*:\s*logging\.(warn|error|info)`
- **Go**: `_ = `, `err\s*=.*\n[^i]` (error assigned but next line isn't `if err`), `//\s*nolint`
- **Rust**: `\.unwrap\(\)` in non-test files, `let _ =`, `\.ok\(\)` discarding errors
- **Java/Kotlin**: `catch\s*\([^)]*\)\s*\{\s*\}`, `catch\s*\([^)]*\)\s*\{\s*//`, `@SuppressWarnings`
- **Ruby**: `rescue\s*=>?\s*nil`, `rescue\s*StandardError`, `rescue\s*Exception`

---

## 2.2 Incomplete Implementations

**Generic patterns:**
```
TODO|FIXME|HACK|XXX|NOCOMMIT|STOPSHIP
lorem ipsum|placeholder|test@example\.com|changeme|CHANGEME|your-api-key|sk-xxx|pk_test
```

**Language-specific:**
- **JavaScript/TypeScript**: `throw new Error\(.*not.implemented`, `return.*\/\/\s*TODO`
- **Python**: `raise NotImplementedError`, `pass\s*#\s*TODO`, `def.*:\s*\.\.\.\s*$`
- **Go**: `panic\("not implemented"\)`, `// TODO`, `func.*\{\s*return nil\s*\}`
- **Rust**: `todo!\(\)`, `unimplemented!\(\)`, `panic!\("not implemented"\)`
- **Java/Kotlin**: `throw.*UnsupportedOperationException`, `throw.*NotImplementedException`

---

## 2.3 Integration Gaps

**Generic patterns:**
```
process\.env\.\w+|os\.environ|os\.getenv|env::var|System\.getenv
fetch\(|axios\.|httpClient\.|\.get\(|\.post\(|\.put\(|\.delete\(|\.patch\(
\.emit\(|\.on\(|addEventListener|removeEventListener|\.dispatch\(
webhook|callback.*url|redirect.*uri|oauth.*callback
```

**Language-specific:** none — patterns above cover most ecosystems via env-var and HTTP-client conventions.

---

## 2.4 State & Data Integrity

**Generic patterns:**
```
optimistic|\.update\(|\.set\(.*\).*(?!rollback|revert|catch)
setInterval|setTimeout
\.subscribe\(|\.on\(|addEventListener
cache|Cache|memo|Memo|staleTime|cacheTime|ttl|TTL
transaction|BEGIN|COMMIT|ROLLBACK
ON DELETE (SET NULL|NO ACTION|RESTRICT)
```

**Language-specific:**
- **React**: `useState.*set.*fetch` (state set before async completes), `useEffect` without cleanup return
- **Python**: `with db.session` without `commit()`/`rollback()`, missing `finally` blocks
- **Go**: goroutines writing to shared state without mutex/channels

---

## 2.5 User Experience Black Holes

**Generic patterns:**
```
loading|isLoading|spinner|pending|isFetching
empty.*state|no.*results|no.*data|no.*items
Something went wrong|An error occurred|Unknown error|Unexpected error
disabled={true}|\.disabled\s*=\s*true|aria-disabled
```

**Language-specific:** none — these are mostly UI-framework agnostic string matches.

---

## 2.6 Security Theater

**Generic patterns:**
```
Access-Control-Allow-Origin.*\*
localStorage\.(set|get)Item.*(token|auth|session|key|secret|jwt|credential)
cors\(\s*\)|cors\(\{|allowOrigin|allow_origin
@Public|isPublic|skipAuth|noAuth|AllowAnonymous|permit_all
rate.?limit|throttle|RateLimit
innerHTML\s*=|v-html|safe\|
```

**Language-specific:** none — auth/CORS/rate-limit primitives are similar across stacks.

---

## 2.7 Performance Traps That Affect Behavior

**Generic patterns:**
```
SELECT \*|SELECT.*FROM(?!.*LIMIT)(?!.*WHERE)
\.find\(\s*\)|\.findAll\(\s*\)|\.all\(\s*\)|\.list\(\s*\)
for.*await|\.forEach\(.*await|\.map\(.*await
setInterval|setTimeout|new WebSocket|\.connect\(
```

**Language-specific:**
- **Python/Django/SQLAlchemy**: `.all()` without `.limit()`, `for obj in queryset` (lazy eval in loop)
- **Go**: unbuffered channels in loops, `defer` inside loops
- **Ruby/Rails**: `.each` on ActiveRecord relation without `.find_each` or `.in_batches`

---

## 2.8 Observability & Monitoring Gaps

**Generic patterns:**
```
sentry|bugsnag|datadog|newrelic|errorTracking|captureException|captureMessage
structlog|winston|pino|bunyan|log4j|slog|tracing::
health|healthz|readiness|liveness|ping
correlation.?id|request.?id|trace.?id|x-request-id
```

**Language-specific:** none — observability libraries above span the major ecosystems.

---

## 2.9 API Contract Validation

**Generic patterns:**
```
interface.*Response|type.*Response|schema|Schema
openapi|swagger|graphql|\.graphql
\.json\(\)|\.data\.|response\.data|res\.json
status.*===.*200|response\.ok|res\.status
```

**Language-specific:** none — most contract patterns are framed in terms of HTTP/JSON conventions.
