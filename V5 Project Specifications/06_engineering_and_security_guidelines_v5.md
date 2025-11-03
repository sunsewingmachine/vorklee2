---
version: "5.3"
maintainer: "Vorklee2 DevSecOps & Engineering Team"
last_updated: "2025-01-15 12:00:00 UTC"
tier: "enterprise"
format: "markdown"
framework: "Next.js 14+"
database: "NeonDB"
compliance: ["SOC2", "GDPR", "HIPAA-ready"]
---

# ⚙️ 06_Engineering_and_Security_Guidelines_v5.md  
## Development, Security, CI/CD, and Compliance Standards for Vorklee2

---

## 🧭 Purpose
This document establishes **engineering, DevOps, and security practices** that ensure the reliability, compliance, and maintainability of the **Vorklee2 Enterprise Platform** under version **v5.2**.  
It aligns all services, repositories, and infrastructure to meet **SOC2, GDPR, and HIPAA** audit requirements.

---

## 🧱 1. Engineering Principles

| Principle | Description |
|------------|--------------|
| **Consistency** | All services follow unified linting, testing, and CI/CD pipelines. |
| **Security First** | Code and data security integrated into every phase (DevSecOps). |
| **Automation** | Build, test, and deploy pipelines automated via GitHub Actions. |
| **Scalability** | All modules independently deployable and horizontally scalable. |
| **Auditability** | Every production change tracked via Core Audit Logs. |

---

## 🧰 2. Development Standards

| Area | Tool | Standard |
|------|------|-----------|
| **Language** | TypeScript (strict) | 100% type coverage |
| **Framework** | Next.js 14 / Node.js 20 | Edge-ready architecture |
| **Linting** | ESLint + Prettier | Unified ruleset |
| **Testing** | Jest / Vitest | 80%+ code coverage |
| **Formatting** | Prettier | Auto-format on save |
| **Docs** | Markdown + OpenAPI | Auto-synced to `/docs/specs_v5` |

Example lint config (`.eslintrc.json`):
```json
{
  "extends": ["next", "eslint:recommended", "plugin:@typescript-eslint/recommended"],
  "rules": {"@typescript-eslint/no-explicit-any": "error"}
}
```

---

## 🧪 3. Testing Strategy

### Test Pyramid

| Level | Type | Coverage Target | Tools | Execution |
|-------|------|-----------------|-------|-----------|
| **Unit** | Component/function tests | 80%+ | Jest, Vitest | Every commit |
| **Integration** | API + DB tests | 70%+ | Jest + Supertest | Every PR |
| **E2E** | Full user flows | Critical paths | Playwright, Cypress | Pre-deploy |
| **Performance** | Load + stress tests | SLO validation | k6, Artillery | Weekly + pre-release |
| **Security** | SAST + DAST | 100% coverage | Snyk, OWASP ZAP | Every commit |

### Unit Testing Standards

```typescript
// Example: notes.service.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { NotesService } from './notes.service';

describe('NotesService', () => {
  let service: NotesService;

  beforeEach(() => {
    service = new NotesService();
  });

  describe('createNote', () => {
    it('should create note with valid data', async () => {
      const input = { title: 'Test', content: 'Content', userId: 'uuid' };
      const result = await service.createNote(input);

      expect(result).toHaveProperty('id');
      expect(result.title).toBe('Test');
    });

    it('should throw error with invalid data', async () => {
      await expect(service.createNote({})).rejects.toThrow('Validation error');
    });
  });
});
```

### Integration Testing

```typescript
// Example: notes.api.test.ts
import request from 'supertest';
import { app } from '../app';

describe('POST /api/v1/notes', () => {
  it('should create note with valid JWT', async () => {
    const response = await request(app)
      .post('/api/v1/notes')
      .set('Authorization', `Bearer ${validJWT}`)
      .send({ title: 'Test', content: 'Content' });

    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('id');
  });

  it('should return 401 without JWT', async () => {
    const response = await request(app)
      .post('/api/v1/notes')
      .send({ title: 'Test' });

    expect(response.status).toBe(401);
  });
});
```

### E2E Testing

```typescript
// Example: notes.e2e.spec.ts (Playwright)
import { test, expect } from '@playwright/test';

test.describe('Notes App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
  });

  test('should create new note', async ({ page }) => {
    await page.click('text=New Note');
    await page.fill('[name="title"]', 'E2E Test Note');
    await page.fill('[name="content"]', 'This is a test');
    await page.click('text=Save');

    await expect(page.locator('text=E2E Test Note')).toBeVisible();
  });
});
```

### Performance Testing

```javascript
// Example: load-test.js (k6)
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 200 },  // Ramp to 200
    { duration: '5m', target: 200 },  // Stay at 200
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<250'], // 95% < 250ms
    http_req_failed: ['rate<0.01'],   // <1% errors
  },
};

export default function() {
  const response = http.get('https://api.vorklee.com/v1/notes', {
    headers: { 'Authorization': `Bearer ${__ENV.JWT_TOKEN}` },
  });

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 250ms': (r) => r.timings.duration < 250,
  });

  sleep(1);
}
```

### Mutation Testing

**Purpose**: Validate test quality by introducing code changes and verifying tests catch failures.

**Tool**: Stryker (for TypeScript/JavaScript)

**Implementation:**

```bash
# Install Stryker
npm install --save-dev @stryker-mutator/core @stryker-mutator/jest-runner

# Run mutation testing
npx stryker run
```

**Configuration:**

```javascript
// stryker.conf.json
{
  "packageManager": "npm",
  "reporters": ["html", "clear-text", "progress"],
  "testRunner": "jest",
  "coverageAnalysis": "perTest",
  "mutate": [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/*.spec.ts"
  ],
  "mutator": {
    "plugins": ["typescript"]
  },
  "thresholds": {
    "high": 80,
    "low": 70,
    "break": 60
  }
}
```

**Mutation Testing Requirements:**

| Category | Minimum Score | Coverage Area |
|----------|--------------|--------------|
| **Critical Paths** | ≥ 80% | Authentication, payment processing |
| **Business Logic** | ≥ 70% | Service layer, core functions |
| **Utilities** | ≥ 60% | Helper functions, validators |

**CI/CD Integration:**

```yaml
# .github/workflows/mutation-test.yml
- name: Mutation Testing
  run: npx stryker run
  continue-on-error: true # Don't fail build, but report
```

### Contract Testing

**Purpose**: Ensure API contracts between consumer (mobile app) and provider (API) remain stable.

**Tool**: Pact (Consumer-Driven Contracts)

**Implementation:**

```typescript
// Consumer (Mobile App): Define expected contract
import { Pact } from '@pact-foundation/pact';

describe('Notes API Contract', () => {
  const provider = new Pact({
    consumer: 'notes-mobile-app',
    provider: 'notes-api',
    port: 1234,
  });

  beforeAll(() => provider.setup());
  afterAll(() => provider.finalize());

  it('returns list of notes', async () => {
    await provider.addInteraction({
      state: 'user has notes',
      uponReceiving: 'a request for notes',
      withRequest: {
        method: 'GET',
        path: '/notes/v1/notes',
        headers: { Authorization: 'Bearer token' },
      },
      willRespondWith: {
        status: 200,
        body: {
          success: true,
          data: [{ id: 'uuid', title: 'Note 1' }],
        },
      },
    });

    const response = await fetch('http://localhost:1234/notes/v1/notes');
    expect(response.status).toBe(200);
  });
});

// Provider (API): Verify against contracts
import { Verifier } from '@pact-foundation/pact';

const opts = {
  provider: 'notes-api',
  providerBaseUrl: 'http://localhost:3000',
  pactUrls: ['https://pact-broker.com/pacts/provider/notes-api/consumer/notes-mobile-app/latest'],
  publishVerificationResult: true,
  providerVersion: '1.0.0',
};

new Verifier(opts).verifyProvider().then(() => {
  console.log('Contract verification passed!');
});
```

**Contract Testing Workflow:**

1. **Consumer** (mobile app) defines expected contract → Publish to Pact Broker
2. **Provider** (API) verifies against contract in CI/CD
3. **Breaking changes** detected before deployment
4. **Contracts versioned** and stored in Pact Broker

**CI/CD Integration:**

```yaml
# Provider verification (API service)
- name: Verify API Contracts
  run: |
    npx @pact-foundation/pact-cli verify \
      --provider-base-url http://localhost:3000 \
      --pact-broker-url https://pact-broker.com \
      --provider-version ${{ github.sha }}
```

### Chaos Engineering

**Purpose**: Proactively test system resilience by injecting failures.

**Tool**: Chaos Toolkit, Litmus, or custom scripts

**Chaos Engineering Schedule:**

| Test Type | Frequency | Scope | Owner |
|-----------|-----------|-------|-------|
| **Network Latency** | Monthly | Staging | Platform Team |
| **Database Connection Failure** | Quarterly | Staging | Database Team |
| **Service Outage** | Quarterly | Staging | Platform Team |
| **High Load** | Monthly | Staging | Performance Team |
| **Cache Failure** | Monthly | Staging | Platform Team |

**Chaos Test Scenarios:**

```typescript
// Example: Database connection failure injection
import { chaos } from '@vorklee/chaos-toolkit';

describe('Chaos Test: Database Failure', () => {
  it('should degrade gracefully when DB is unavailable', async () => {
    // Simulate database failure
    await chaos.injectFailure('database', {
      type: 'connection_timeout',
      duration: 30000, // 30 seconds
    });

    // Verify application handles failure
    const response = await api.getNotes();
    
    // Should return cached data or graceful error
    expect(response.status).toBe(200); // Or 503 with retry header
    expect(response.headers['retry-after']).toBeDefined();
  });

  it('should recover when DB becomes available', async () => {
    await chaos.injectFailure('database', { duration: 5000 });
    await sleep(6000);
    
    // Service should recover automatically
    const response = await api.getNotes();
    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
  });
});
```

**Chaos Test Checklist:**

- [ ] Network latency injection (100ms, 500ms, 1000ms)
- [ ] Database connection timeout
- [ ] Redis cache unavailability
- [ ] External API failures
- [ ] High CPU/memory usage
- [ ] Partial service outages
- [ ] Network partition scenarios

**Post-Chaos Analysis:**

```typescript
// Document chaos test results
interface ChaosTestResult {
  scenario: string;
  timestamp: string;
  duration: number;
  impact: {
    errorRate: number;
    latencyIncrease: number;
    userAffected: number;
  };
  recovery: {
    timeToRecover: number;
    automatic: boolean;
  };
  improvements: string[];
}
```

### WCAG 2.1 AA Compliance Testing

**Purpose**: Ensure web applications are accessible to users with disabilities.

**WCAG 2.1 AA Requirements:**

| Principle | Requirement | Test Method |
|-----------|------------|-------------|
| **Perceivable** | Color contrast ≥ 4.5:1 | Automated (axe, pa11y) |
| **Perceivable** | Text alternatives for images | Manual + automated |
| **Operable** | Keyboard navigation | Manual testing |
| **Operable** | No seizure triggers | Automated (flash detection) |
| **Understandable** | Error messages clear | Manual review |
| **Robust** | Screen reader compatible | Manual + automated |

**Automated Accessibility Testing:**

```typescript
// E2E test with accessibility checks
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('Notes page should be accessible', async ({ page }) => {
  await page.goto('/notes');

  // Run axe accessibility scan
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();

  // Check for violations
  expect(accessibilityScanResults.violations).toEqual([]);
  
  // Check for incomplete tests (warnings)
  expect(accessibilityScanResults.incomplete).toEqual([]);
});
```

**CI/CD Integration:**

```yaml
# .github/workflows/accessibility.yml
- name: Accessibility Test
  run: |
    npm install -g pa11y-ci
    pa11y-ci --sitemap https://staging.vorklee.com/sitemap.xml \
      --standard WCAG2AA \
      --reporter json \
      --reporter cli
```

**Manual Testing Checklist:**

- [ ] Keyboard navigation (Tab, Enter, Space, Arrow keys)
- [ ] Screen reader testing (NVDA, JAWS, VoiceOver)
- [ ] Color contrast verification (WebAIM Contrast Checker)
- [ ] Focus indicators visible
- [ ] Skip to main content link
- [ ] Form labels and error messages
- [ ] Alt text for images
- [ ] Heading hierarchy (h1 → h2 → h3)

### Load Testing Schedule

**Mandatory Load Testing:**

| Environment | Frequency | Scenarios | Thresholds |
|-------------|-----------|----------|------------|
| **Staging** | Weekly (Sunday 03:00 UTC) | Baseline, peak traffic | P95 < 250ms, error rate < 1% |
| **Production** | Monthly (First Sunday 02:00 UTC) | Stress test, spike test | P95 < 250ms, error rate < 0.1% |
| **Pre-Release** | Before each release | Full regression | All SLAs met |

**Load Test Scenarios:**

```javascript
// k6 load test scenarios
export const scenarios = {
  // Baseline: Normal traffic
  baseline: {
    executor: 'constant-vus',
    vus: 100,
    duration: '10m',
  },
  
  // Peak traffic: Double normal load
  peak: {
    executor: 'ramping-vus',
    startVUs: 100,
    stages: [
      { duration: '5m', target: 200 },
      { duration: '10m', target: 200 },
      { duration: '5m', target: 100 },
    ],
  },
  
  // Stress test: Find breaking point
  stress: {
    executor: 'ramping-vus',
    startVUs: 50,
    stages: [
      { duration: '5m', target: 500 },
      { duration: '10m', target: 500 },
      { duration: '5m', target: 1000 },
      { duration: '10m', target: 1000 },
    ],
  },
  
  // Spike test: Sudden traffic increase
  spike: {
    executor: 'ramping-vus',
    startVUs: 100,
    stages: [
      { duration: '1m', target: 1000 }, // Sudden spike
      { duration: '5m', target: 1000 },
      { duration: '1m', target: 100 }, // Sudden drop
    ],
  },
};
```

### Browser/Device Testing Matrix

**Required Testing Matrix:**

| Platform | Browsers | Versions | Devices | Testing Frequency |
|----------|----------|----------|---------|-------------------|
| **Desktop** | Chrome, Firefox, Safari, Edge | Latest 2 versions | N/A | Every PR |
| **Mobile Web** | Chrome (Android), Safari (iOS) | Latest 2 versions | iPhone 12+, Samsung Galaxy S21+ | Every PR |
| **Tablet** | Safari (iPad), Chrome (Android) | Latest 2 versions | iPad Air, Samsung Galaxy Tab | Weekly |
| **Native iOS** | N/A | iOS 15+, iOS 16+ | iPhone 12, iPhone 14, iPhone 15 | Every PR |
| **Native Android** | N/A | Android 12+, Android 13+ | Samsung Galaxy S21, Pixel 7 | Every PR |

**Mobile-Specific Testing:**

```typescript
// React Native device testing
describe('Mobile Network Conditions', () => {
  it('should handle slow 3G network', async () => {
    await device.setNetworkCondition('slow-3g');
    
    const startTime = Date.now();
    await api.getNotes();
    const duration = Date.now() - startTime;
    
    // Should complete within reasonable time even on slow network
    expect(duration).toBeLessThan(5000);
  });

  it('should handle offline mode', async () => {
    await device.setNetworkCondition('offline');
    
    const response = await api.getNotes();
    
    // Should return cached data or queue for sync
    expect(response).toBeDefined();
  });
});

// Battery usage testing
describe('Battery Usage', () => {
  it('should not drain battery with background sync', async () => {
    const initialBattery = await getBatteryLevel();
    
    // Run background sync for 10 minutes
    await runBackgroundSync(10 * 60 * 1000);
    
    const finalBattery = await getBatteryLevel();
    const batteryDrain = initialBattery - finalBattery;
    
    // Should drain < 5% per hour
    expect(batteryDrain).toBeLessThan(0.05);
  });
});
```

### Test Data Management

- **Test Databases**: Separate Neon branch per PR (ephemeral)
- **Fixtures**: Seed data for consistent tests
- **Mocking**: External services mocked in unit/integration tests
- **Cleanup**: Automatic teardown after each test run

### Continuous Testing

- **Pre-commit**: Unit tests + linting + mutation testing (critical paths only)
- **PR**: Full test suite + coverage report + contract tests + accessibility scan
- **Nightly**: E2E + performance + security scans + chaos tests (staging)
- **Pre-release**: Full regression + load testing + chaos engineering + WCAG audit

---

## 🔄 4. CI/CD Pipeline

| Stage | Action | Tool |
|--------|---------|------|
| **Build** | Install, compile, and test | GitHub Actions / Turborepo |
| **Deploy** | Deploy apps via Vercel / Cloud Run | GitHub Actions |
| **Migrations** | Run DB migrations | Drizzle ORM |
| **Security Scan** | Run Snyk and Trivy | Automated |
| **Audit Log** | Notify Core service | @core-audit webhook |

### Enhanced CI/CD Workflow

```yaml
name: Build, Test, Security & Deploy
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      # Verify commit signatures
      - name: Verify GPG signatures
        run: |
          git verify-commit HEAD || exit 1

      # Dependency vulnerabilities
      - name: npm audit
        run: npm audit --audit-level=moderate

      # Snyk security scan
      - uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

      # Container image scanning
      - uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          severity: 'CRITICAL,HIGH'

      # Secret scanning
      - uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD

  build-and-test:
    needs: security-scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      # Setup Node with caching
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      # Install dependencies
      - run: npm ci

      # Lint
      - run: npm run lint

      # Type check
      - run: npm run type-check

      # Unit tests with coverage
      - run: npm run test:coverage

      # Upload coverage to Codecov
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: true

      # Build application
      - run: npm run build

      # Generate SBOM
      - run: npm run sbom:generate

      # Upload build artifacts
      - uses: actions/upload-artifact@v3
        with:
          name: build-artifacts
          path: |
            .next/
            sbom-*.json

  database-migration:
    needs: build-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci

      # Validate migration
      - run: npx drizzle-kit check

      # Run migration
      - run: npx drizzle-kit push
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      # Verify migration success
      - run: npx drizzle-kit verify

  deploy:
    needs: database-migration
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      # Download build artifacts
      - uses: actions/download-artifact@v3
        with:
          name: build-artifacts

      # Deploy to Vercel
      - run: npx vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }}
        id: deploy

      # Health check
      - name: Health check
        run: |
          curl -f ${{ steps.deploy.outputs.url }}/api/health || exit 1

      # Notify Core Audit
      - name: Log deployment
        run: |
          curl -X POST ${{ secrets.CORE_AUDIT_URL }}/deployments \
            -H "Authorization: Bearer ${{ secrets.CORE_API_KEY }}" \
            -d '{"service": "${{ github.repository }}", "version": "${{ github.sha }}"}'

      # Notify Slack
      - uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "✅ Deployment successful: ${{ github.repository }} @ ${{ github.sha }}"
            }
```

---

## 🚀 5. Deployment Strategies

### Blue-Green Deployment

```
┌──────────┐     ┌──────────┐
│  Blue    │────▶│  Green   │
│ (v5.2.0) │     │ (v5.2.1) │
│ Active   │     │ Staging  │
└──────────┘     └──────────┘
      │                │
      │    Switch      │
      └───────────────▶│
           Traffic     │
                  (v5.2.1 Active)
```

**Process:**
1. Deploy new version to Green environment
2. Run smoke tests on Green
3. Switch 10% traffic to Green (canary)
4. Monitor metrics for 15 minutes
5. If healthy → switch 100% traffic to Green
6. Keep Blue as rollback target for 24 hours

### Canary Deployments

| Stage | Traffic % | Duration | Rollback Threshold |
|-------|-----------|----------|-------------------|
| **Canary** | 5% | 10 minutes | Error rate > 0.5% |
| **Small** | 25% | 30 minutes | Error rate > 0.2% |
| **Medium** | 50% | 1 hour | Error rate > 0.1% |
| **Full** | 100% | N/A | Standard monitoring |

**Automated Rollback Triggers:**
- Error rate exceeds threshold
- P95 latency > 500ms
- Any P0 incident detected
- Health check failures > 3

### Feature Flags

**Platform:** LaunchDarkly / Unleash / split.io

```typescript
// Example: Feature flag usage
import { useFeatureFlag } from '@vorklee/feature-flags';

export function NotesApp() {
  const aiSummaryEnabled = useFeatureFlag('ai-summary-v2', {
    userId: user.id,
    orgId: user.orgId,
    plan: user.plan
  });

  return (
    <div>
      {aiSummaryEnabled && <AISummaryButton />}
    </div>
  );
}
```

**Feature Flag Categories:**

| Type | Purpose | Example | Lifetime |
|------|---------|---------|----------|
| **Release** | Gradual rollout | New UI component | 2-4 weeks |
| **Experiment** | A/B testing | Pricing page variant | 2-8 weeks |
| **Ops** | Kill switch | AI service | Permanent |
| **Permission** | Plan-based features | Enterprise analytics | Permanent |

**Flag Lifecycle:**
1. **Development**: Flag created, default OFF
2. **Testing**: Enabled for dev/staging environments
3. **Canary**: Enabled for 5% production users
4. **Rollout**: Gradual increase to 100%
5. **Cleanup**: Remove flag after 2 weeks at 100%

### Zero-Downtime Migrations

**Database Migrations:**
```sql
-- Step 1: Add new column (nullable)
ALTER TABLE notes ADD COLUMN new_field TEXT NULL;

-- Step 2: Deploy code that writes to both old and new fields

-- Step 3: Backfill data
UPDATE notes SET new_field = old_field WHERE new_field IS NULL;

-- Step 4: Deploy code that only uses new field

-- Step 5: Drop old column
ALTER TABLE notes DROP COLUMN old_field;
```

**Deployment Order:**
1. Database schema changes (additive only)
2. Deploy new application code
3. Run data migrations (background jobs)
4. Remove deprecated code (next release)

### Rollback Procedures

| Scenario | Method | Time | Validation |
|----------|--------|------|------------|
| **Application Bug** | Blue-green switch | < 30 seconds | Health checks |
| **Database Migration** | Restore from PITR | < 5 minutes | Data integrity check |
| **Config Error** | Revert commit + redeploy | < 2 minutes | Smoke tests |
| **Feature Flag Issue** | Toggle flag OFF | < 10 seconds | User reports |

---

## 🔐 6. Security Guidelines

### OWASP Top 10 2021 Mapping & Prevention

The OWASP Top 10 represents the most critical security risks. Vorklee2 implements comprehensive controls to prevent each:

| OWASP Risk | Prevention Strategy | Implementation | Verification |
|------------|-------------------|----------------|-------------|
| **A01:2021 - Broken Access Control** | RBAC + RLS + JWT validation | Role-based permissions, org_id scoping, RLS policies | Quarterly access reviews, automated tests |
| **A02:2021 - Cryptographic Failures** | Strong encryption + key management | TLS 1.3, AES-256, Argon2id, CMK rotation | Annual crypto audit, key rotation logs |
| **A03:2021 - Injection** | Parameterized queries + input validation | Drizzle ORM (no raw SQL), Zod schemas | SAST scans, dependency checks |
| **A04:2021 - Insecure Design** | Secure design patterns + threat modeling | Security reviews, architecture decisions | Design reviews, threat modeling sessions |
| **A05:2021 - Security Misconfiguration** | Hardened defaults + automated checks | Security headers, CSP, secure configs | Configuration scanning, compliance checks |
| **A06:2021 - Vulnerable Components** | Dependency scanning + updates | Snyk, Dependabot, SBOM, 48h patch SLA | Weekly scans, quarterly updates |
| **A07:2021 - Authentication Failures** | Strong auth + MFA + rate limiting | Argon2id, JWT, MFA, rate limits | Penetration testing, audit logs |
| **A08:2021 - Software & Data Integrity** | Signed artifacts + supply chain security | GPG commits, SBOM, provenance | CI/CD checks, artifact verification |
| **A09:2021 - Logging Failures** | Comprehensive audit logging | Structured logs, trace_id, PII redaction | Log analysis, incident response drills |
| **A10:2021 - SSRF** | Input validation + network restrictions | URL validation, IP whitelisting, network policies | Security testing, network audits |

**OWASP Prevention Checklist:**
- ✅ Access control tested with automated tests
- ✅ Encryption at rest and in transit enforced
- ✅ All inputs validated with Zod schemas
- ✅ Security headers configured (see below)
- ✅ Dependencies scanned weekly
- ✅ Authentication failures logged and rate-limited
- ✅ All code changes GPG-signed
- ✅ Audit logs comprehensive and tamper-proof
- ✅ SSRF protections in place for external requests

### Security Headers (Complete List)

**Required Security Headers for All Applications:**

| Header | Purpose | Value | Implementation |
|--------|---------|-------|----------------|
| **Strict-Transport-Security (HSTS)** | Force HTTPS | `max-age=31536000; includeSubDomains; preload` | Prevents downgrade attacks |
| **Content-Security-Policy (CSP)** | XSS protection | See CSP configuration below | Blocks inline scripts, unsafe eval |
| **X-Frame-Options** | Clickjacking protection | `DENY` or `SAMEORIGIN` | Prevents iframe embedding |
| **X-Content-Type-Options** | MIME sniffing protection | `nosniff` | Prevents MIME type confusion |
| **Referrer-Policy** | Privacy protection | `strict-origin-when-cross-origin` | Limits referrer information |
| **Permissions-Policy** | Feature restrictions | See configuration below | Restricts browser features |
| **X-XSS-Protection** | Legacy XSS protection | `1; mode=block` | Additional XSS protection (legacy) |

**Next.js Implementation:**

```typescript
// next.config.ts
export default {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Remove unsafe-* in production
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.vorklee.com https://*.sentry.io",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: [
              'camera=()',
              'microphone=()',
              'geolocation=()',
              'interest-cohort=()', // Disable FLoC
            ].join(', '),
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};
```

**CSP Configuration (Production-Ready):**

```typescript
// Production CSP (strict)
const productionCSP = [
  "default-src 'self'",
  "script-src 'self'", // No unsafe-inline or unsafe-eval
  "style-src 'self' 'unsafe-inline'", // CSS may need inline for Material-UI
  "img-src 'self' data: https://cdn.vorklee.com https://*.cloudflare.com",
  "font-src 'self' data:",
  "connect-src 'self' https://api.vorklee.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
  "report-uri /api/csp-report", // CSP violation reporting
].join('; ');
```

**CSP Violation Reporting:**

```typescript
// apps/notes/app/api/csp-report/route.ts
export async function POST(request: NextRequest) {
  const report = await request.json();
  
  // Log CSP violations (potential XSS attempts)
  logger.warn('CSP Violation', {
    'csp-report': report['csp-report'],
    ip: request.headers.get('x-forwarded-for'),
    user_agent: request.headers.get('user-agent'),
  });
  
  // Alert security team if critical violation
  if (report['csp-report']['blocked-uri']?.includes('malicious')) {
    await sendSecurityAlert('CSP Violation Detected', report);
  }
  
  return new Response(null, { status: 204 });
}
```

**Mobile App Security Headers:**

Mobile apps (iOS/Android) use platform-specific security:
- **iOS**: Certificate pinning, App Transport Security (ATS), Keychain storage
- **Android**: Network Security Config, certificate pinning, Keystore

### Vulnerability Disclosure Policy

**Responsible Disclosure Process:**

1. **Report**: Security researchers report via `security@vorklee.com` or HackerOne (if applicable)
2. **Acknowledgment**: Response within 24 hours
3. **Investigation**: Security team investigates within 7 days
4. **Resolution**: Patch developed and deployed based on severity
5. **Disclosure**: Public disclosure after patch deployment (coordinated disclosure)

**Severity Response Times:**
- **Critical**: 24 hours (immediate fix + emergency deploy)
- **High**: 7 days
- **Medium**: 30 days
- **Low**: 90 days

**Bug Bounty Program (Optional):**
- HackerOne or similar platform
- Rewards: $100 (Low) to $10,000 (Critical)
- Scope: Production applications only
- Exclusions: DoS attacks, social engineering, physical access

### Penetration Testing

**Frequency:**
- **External Pentest**: Quarterly by certified third-party (e.g., Offensive Security, Synack)
- **Internal Pentest**: Monthly by security team
- **Automated Scans**: Weekly (OWASP ZAP, Burp Suite)

**Scope:**
- All public APIs
- Authentication endpoints
- Admin interfaces
- Mobile apps (annual)
- Infrastructure (quarterly)

**Pentest Deliverables:**
- Executive summary
- Technical findings with CVSS scores
- Remediation recommendations
- Re-test after fixes

### Security Testing in CI/CD

**SAST (Static Application Security Testing):**

```yaml
# .github/workflows/security.yml
- name: SAST Scan
  uses: github/super-linter@v4
  with:
    VALIDATE_ALL_CODEBASE: true

- name: Snyk SAST
  uses: snyk/actions/node@master
  env:
    SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
  with:
    args: --severity-threshold=high
```

**DAST (Dynamic Application Security Testing):**

```yaml
- name: OWASP ZAP Scan
  uses: zaproxy/action-baseline@v0.10.0
  with:
    target: 'https://staging.vorklee.com'
    rules_file_name: '.zap/rules.tsv'
    cmd_options: '-a'
```

**Secrets Scanning:**

```yaml
- name: TruffleHog Secret Scan
  uses: trufflesecurity/trufflehog@main
  with:
    path: ./
    base: ${{ github.event.repository.default_branch }}
    head: HEAD
```

**False-Positive Handling:**
- Security team reviews all findings
- Confirmed false positives added to `.secretsignore`
- Real secrets trigger immediate incident response
- Quarterly review of ignored patterns

### Authentication
- All user and service authentication handled by Core Identity.
- JWT validation occurs at app layer with Core's public key.
- No credentials hardcoded or logged.

### Authorization
- Enforced per `org_id` via RLS (Row-Level Security).
- Role-based access controlled by JWT claims.

### Secrets Management
- All secrets stored in **HashiCorp Vault** or **Vercel Secret Store**.
- Developers access only staging credentials via SSO.
- Rotated every 90 days.

### Secure Coding Practices
- No direct SQL queries (use ORM only).
- Input validation via Zod schemas.
- XSS and CSRF prevention through Next.js middleware.
- HTTPS enforced on all requests.

---

## 🧠 5. Monitoring and Incident Management

| Component | Tool | Purpose |
|------------|------|----------|
| **Logging** | Sentry / Datadog | Centralized error tracking |
| **Metrics** | Grafana + Neon Insights | DB and service health |
| **Uptime** | Pingdom / Healthcheck.io | 99.9% SLA verification |
| **Alerts** | Slack + PagerDuty | Real-time alerts |
| **Incident Reports** | Jira | Root-cause analysis |

Incident workflow:
1. Automatic alert → Slack/PagerDuty.  
2. Affected service identified via Grafana dashboards.  
3. RCA (Root Cause Analysis) logged in `core.audit_logs`.  
4. Postmortem reviewed in weekly ops meeting.

---

## 🧩 6. Compliance Standards

| Standard | Practice |
|-----------|-----------|
| **SOC2** | Continuous monitoring + encrypted backups |
| **GDPR** | Right to erasure implemented (soft delete) |
| **HIPAA** | PHI encrypted, logged access only |
| **PCI DSS (if applicable)** | No card data stored in-house |
| **ISO 27001 Alignment** | Documented security and continuity plan |

Each app undergoes quarterly **compliance review**.

---

## 🧮 7. Backup & Disaster Recovery

| Type | Frequency | Retention |
|------|------------|------------|
| **Neon PITR** | Continuous | 7 days |
| **Snapshot** | Daily | 30 days |
| **Offsite Archive** | Weekly | AWS S3 Glacier (90 days) |

Disaster recovery test conducted every 3 months.

---

## 🧾 8. Code Review & QA Process

1. Developer creates feature branch (`feature/...`).  
2. Submit PR → automatic lint/test run.  
3. Review by two peers + one maintainer.  
4. AI review suggestions (if available) logged in comments.  
5. Merge only if all checks pass.  

### AI Contribution Policy
- AI code contributions allowed only with `AI-METADATA` header.  
- Must pass human review and testing.  
- Tracked in Core Audit Logs.

---

## 📊 9. SLI/SLO Definitions

### Service Level Indicators (SLIs)

| Service | SLI | Measurement |
|---------|-----|-------------|
| **API** | Availability | % of successful requests (non-5xx) |
| **API** | Latency | % of requests < 250ms (P95) |
| **API** | Error Rate | % of requests without errors |
| **Database** | Query Latency | % of queries < 100ms (P95) |
| **Auth** | Login Success | % of successful authentications |

### Service Level Objectives (SLOs)

| Service | Metric | Target | Error Budget |
|---------|--------|--------|--------------|
| **API Availability** | Uptime | 99.9% (43m downtime/month) | 0.1% |
| **API Latency P95** | Response time | < 250ms | 5% can exceed |
| **API Latency P99** | Response time | < 500ms | 1% can exceed |
| **Error Rate** | 5xx responses | < 0.1% | 10 errors per 10k requests |
| **DB Query P95** | Query time | < 100ms | 5% can exceed |
| **Auth Success** | Login rate | > 99.5% | 0.5% failures allowed |

### Error Budget Policy

**Monthly Error Budget:** 43.2 minutes of downtime (99.9% SLO)

**Actions when budget consumed:**
- **> 50% consumed**: Review and prioritize reliability work
- **> 75% consumed**: Freeze feature releases, focus on stability
- **> 90% consumed**: All hands on deck, incident response mode
- **100% consumed**: Complete feature freeze until budget recovers

## 📝 10. Structured Logging Standard

### Log Format (JSON)

```json
{
  "timestamp": "2025-01-15T10:30:45.123Z",
  "level": "error",
  "service": "notes-api",
  "environment": "production",
  "version": "v5.3.0",
  "trace_id": "550e8400-e29b-41d4-a716-446655440000",
  "span_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "org_id": "987fcdeb-51a2-43f7-9c8d-123456789abc",
  "request_id": "req_abc123",
  "method": "POST",
  "path": "/api/v1/notes",
  "status_code": 500,
  "duration_ms": 145,
  "message": "Database connection failed",
  "error": {
    "type": "DatabaseError",
    "message": "Connection timeout after 5000ms",
    "stack": "Error: Connection timeout\n  at Connection.connect..."
  },
  "context": {
    "note_id": "note_xyz789",
    "retry_count": 2
  },
  "retention_tier": "hot" // Used for lifecycle management
}
```

### Log Retention & Lifecycle Management

**See Section 12 for detailed log retention tiers and cost optimization strategies.**

### Log Levels

| Level | Usage | Examples |
|-------|-------|----------|
| **ERROR** | System errors requiring attention | DB failures, API errors, unhandled exceptions |
| **WARN** | Potential issues, degraded performance | High latency, retry attempts, deprecated API usage |
| **INFO** | Important business events | User login, note created, payment processed |
| **DEBUG** | Detailed diagnostic information | Function calls, variable values, state transitions |

### Logging Best Practices

- **Never log PII** directly (redact email, phone, IP after first octet)
- **Always include** trace_id, user_id, org_id for correlation
- **Structured fields** for filtering and aggregation
- **Consistent timezone**: UTC for all timestamps
- **Performance**: Async logging to avoid blocking
- **Retention**: 90 days in hot storage, 1 year in cold storage

### Distributed Tracing

Using **OpenTelemetry** for end-to-end request tracing:

```typescript
import { trace, context } from '@opentelemetry/api';

const tracer = trace.getTracer('notes-service');

export async function createNote(data: NoteInput) {
  const span = tracer.startSpan('notes.create');

  try {
    span.setAttribute('note.title', data.title);
    span.setAttribute('user.id', data.userId);

    const result = await db.notes.create(data);

    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message
    });
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}
```

## 🚨 11. Incident Response Procedures

### Incident Severity Levels

| Severity | Description | Response Time | Example |
|----------|-------------|---------------|---------|
| **P0 (Critical)** | Complete service outage | < 15 minutes | Database down, auth failure |
| **P1 (High)** | Major feature broken | < 1 hour | Payment processing failing |
| **P2 (Medium)** | Minor feature degraded | < 4 hours | Slow API response times |
| **P3 (Low)** | Cosmetic issues | < 24 hours | UI rendering glitch |

### Incident Response Workflow

1. **Detection** (Automated monitoring alerts → PagerDuty)
2. **Acknowledgment** (On-call engineer responds within SLA)
3. **Investigation** (Logs, metrics, traces analysis)
4. **Mitigation** (Immediate fix or rollback)
5. **Communication** (Status page + Slack updates)
6. **Resolution** (Service restored, monitoring normal)
7. **Post-Mortem** (Within 48 hours, blameless)

### Post-Mortem Template

```markdown
# Incident Post-Mortem: [Brief Description]

**Date**: 2025-01-15
**Duration**: 45 minutes
**Severity**: P1
**Services Affected**: Notes API

## Summary
Brief description of what happened

## Timeline
- 10:00 UTC: Alert triggered
- 10:05 UTC: Engineer paged
- 10:15 UTC: Root cause identified
- 10:30 UTC: Fix deployed
- 10:45 UTC: Service restored

## Root Cause
Technical explanation of what went wrong

## Impact
- Users affected: 1,500
- Requests failed: 12,000
- Revenue impact: $500

## Resolution
What was done to fix it

## Action Items
- [ ] Improve monitoring (Owner: @john, Due: 2025-01-20)
- [ ] Add circuit breaker (Owner: @jane, Due: 2025-01-25)
- [ ] Update runbook (Owner: @bob, Due: 2025-01-18)

## Lessons Learned
What we learned and how to prevent recurrence
```

## 🧩 12. Observability & Monitoring

### Log Retention Tiers & Cost Optimization

**Log Retention Strategy:**

| Tier | Retention Period | Storage | Cost Estimate | Purpose |
|------|-----------------|---------|---------------|---------|
| **Hot Storage** | 7 days | Elasticsearch / Datadog | $0.50/GB/month | Active debugging, real-time alerts |
| **Warm Storage** | 30 days | S3 (Standard) | $0.023/GB/month | Recent investigation, compliance |
| **Cold Storage** | 1 year | S3 Glacier | $0.004/GB/month | Compliance, audit trails |
| **Archive** | 7 years | S3 Glacier Deep Archive | $0.00099/GB/month | Legal requirements (HIPAA) |

**Cost Optimization Example:**

```typescript
// Log lifecycle management
export class LogLifecycleManager {
  async archiveOldLogs() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Move logs older than 7 days to warm storage
    await this.moveToWarmStorage(sevenDaysAgo);
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Move logs older than 30 days to cold storage
    await this.moveToColdStorage(thirtyDaysAgo);
  }

  async moveToWarmStorage(beforeDate: Date) {
    // Compress and move to S3
    const logs = await this.getLogsBefore(beforeDate);
    const compressed = await this.compressLogs(logs);
    await s3.putObject({
      Bucket: 'vorklee-logs-warm',
      Key: `logs-${beforeDate.toISOString()}.gz`,
      Body: compressed,
      StorageClass: 'STANDARD',
    });
    
    // Delete from hot storage
    await this.deleteFromHotStorage(beforeDate);
  }
}
```

**Log Retention Policies by Log Type:**

| Log Type | Hot (7d) | Warm (30d) | Cold (1y) | Archive (7y) | Rationale |
|----------|----------|------------|-----------|--------------|----------|
| **Application Logs** | ✅ | ✅ | ✅ | ❌ | Debugging, compliance |
| **Audit Logs** | ✅ | ✅ | ✅ | ✅ (HIPAA: 6y) | Compliance requirement |
| **Access Logs** | ✅ | ✅ | ❌ | ❌ | Security investigation |
| **Error Logs** | ✅ | ✅ | ✅ | ❌ | Long-term analysis |
| **Performance Logs** | ✅ | ❌ | ❌ | ❌ | Real-time optimization |

**Cost Monitoring:**

```typescript
// Monitor log storage costs
export async function monitorLogCosts() {
  const hotSize = await getHotStorageSize();
  const warmSize = await getWarmStorageSize();
  const coldSize = await getColdStorageSize();
  
  const monthlyCost = 
    (hotSize * 0.50) +      // Hot: $0.50/GB/month
    (warmSize * 0.023) +    // Warm: $0.023/GB/month
    (coldSize * 0.004);     // Cold: $0.004/GB/month
  
  // Alert if costs exceed budget
  if (monthlyCost > 1000) {
    await sendAlert('Log storage costs exceeding budget', {
      monthlyCost,
      budget: 1000,
    });
  }
}
```

### Alert Management & Fatigue Prevention

**Alert Aggregation Strategy:**

**Problem**: Too many alerts → Alert fatigue → Critical alerts ignored

**Solution**: Severity-based aggregation and routing

**Alert Severity Levels:**

| Severity | Description | Routing | Frequency Limit |
|----------|-------------|---------|----------------|
| **P0 (Critical)** | Service down, data loss | PagerDuty → On-call → Escalate to manager | No limit |
| **P1 (High)** | Major feature broken | PagerDuty → On-call | Max 10/hour |
| **P2 (Medium)** | Degraded performance | Slack #alerts channel | Max 20/hour |
| **P3 (Low)** | Minor issues | Slack #monitoring channel | Max 50/hour |

**Alert Aggregation Rules:**

```typescript
// Alert aggregation service
export class AlertAggregator {
  private alertWindow = 60000; // 1 minute window
  
  async processAlert(alert: Alert) {
    // Group similar alerts
    const key = `${alert.service}-${alert.type}-${alert.severity}`;
    const existing = await this.getAlertsInWindow(key, this.alertWindow);
    
    if (existing.length > 0) {
      // Aggregate: Update count, suppress duplicate
      await this.aggregateAlert(existing[0], alert);
      return; // Don't send duplicate
    }
    
    // New alert or outside window → send
    await this.sendAlert(alert);
  }

  private async aggregateAlert(existing: Alert, newAlert: Alert) {
    // Update count and timestamp
    existing.count = (existing.count || 1) + 1;
    existing.lastOccurrence = new Date();
    
    // Only re-send if severity is P0 or count threshold reached
    if (existing.severity === 'P0' || existing.count >= 5) {
      await this.sendAlert({
        ...existing,
        message: `${existing.message} (${existing.count} occurrences)`,
      });
    }
  }
}
```

**Alert Routing Configuration:**

```yaml
# alert-routing.yml
routing:
  p0:
    channels: [pagerduty, slack-critical]
    escalation: true
    deduplication_window: 0 # No deduplication for P0
    
  p1:
    channels: [pagerduty, slack-alerts]
    escalation: false
    deduplication_window: 300000 # 5 minutes
    
  p2:
    channels: [slack-alerts]
    deduplication_window: 600000 # 10 minutes
    frequency_limit: 20 # Max 20 per hour
    
  p3:
    channels: [slack-monitoring]
    deduplication_window: 1800000 # 30 minutes
    frequency_limit: 50 # Max 50 per hour
```

**Alert Fatigue Prevention Checklist:**

- ✅ Aggregate similar alerts within time window
- ✅ Use severity-based routing (P0 → PagerDuty, P2 → Slack)
- ✅ Frequency limits per alert type
- ✅ Deduplication rules (suppress duplicates for N minutes)
- ✅ Alert grouping by service/type
- ✅ Escalation only for P0/P1
- ✅ Regular review of alert rules (quarterly)
- ✅ Metrics: Alert volume, response time, false positive rate

### Synthetic Monitoring

**Purpose**: Proactively monitor critical user journeys from external perspective.

**Synthetic Monitoring Requirements:**

| Journey | Frequency | Locations | Success Criteria |
|---------|-----------|-----------|------------------|
| **User Login** | Every 5 minutes | US, EU, APAC | < 3s, success rate > 99.5% |
| **Create Note** | Every 5 minutes | US, EU | < 2s, success rate > 99% |
| **View Dashboard** | Every 10 minutes | US, EU, APAC | < 2s, success rate > 99% |
| **API Health Check** | Every 1 minute | All regions | < 500ms, success rate > 99.9% |
| **Mobile App API** | Every 5 minutes | US, EU | < 250ms, success rate > 99% |

**Implementation:**

```typescript
// Synthetic monitoring with Playwright
import { chromium } from 'playwright';
import { test, expect } from '@playwright/test';

export async function syntheticUserLogin() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const startTime = Date.now();
  
  try {
    // Navigate to login page
    await page.goto('https://app.vorklee.com/login');
    
    // Fill credentials
    await page.fill('[name="email"]', process.env.SYNTHETIC_USER_EMAIL);
    await page.fill('[name="password"]', process.env.SYNTHETIC_USER_PASSWORD);
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForURL('**/dashboard', { timeout: 5000 });
    
    const duration = Date.now() - startTime;
    
    // Verify success
    expect(duration).toBeLessThan(3000); // < 3 seconds
    
    // Report to monitoring
    await reportSyntheticMetric('user_login', {
      duration,
      success: true,
      location: process.env.SYNTHETIC_LOCATION || 'us',
    });
    
  } catch (error) {
    await reportSyntheticMetric('user_login', {
      duration: Date.now() - startTime,
      success: false,
      error: error.message,
      location: process.env.SYNTHETIC_LOCATION || 'us',
    });
    throw error;
  } finally {
    await browser.close();
  }
}
```

**Synthetic Monitoring Schedule (GitHub Actions):**

```yaml
# .github/workflows/synthetic-monitoring.yml
name: Synthetic Monitoring

on:
  schedule:
    - cron: '*/5 * * * *' # Every 5 minutes
  workflow_dispatch:

jobs:
  synthetic-tests:
    strategy:
      matrix:
        location: [us-east-1, eu-west-1, ap-southeast-1]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:synthetic
        env:
          SYNTHETIC_LOCATION: ${{ matrix.location }}
      - name: Report failures
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "⚠️ Synthetic test failed",
              "attachments": [{
                "color": "warning",
                "fields": [{
                  "title": "Location",
                  "value": "${{ matrix.location }}",
                  "short": true
                }]
              }]
            }
```

### Error Budget Dashboard & Freeze Policies

**Error Budget Definition:**

| Service | SLO | Monthly Error Budget | Alert Threshold |
|---------|-----|---------------------|-----------------|
| **API Availability** | 99.9% | 43.2 minutes downtime | > 50% consumed |
| **API Latency P95** | < 250ms | 5% can exceed | > 50% consumed |
| **Error Rate** | < 0.1% | 10 errors per 10k requests | > 50% consumed |

**Error Budget Dashboard Implementation:**

```typescript
// Error budget tracking
export class ErrorBudgetTracker {
  async calculateErrorBudget() {
    const currentTime = new Date();
    const monthStart = new Date(currentTime.getFullYear(), currentTime.getMonth(), 1);
    const monthEnd = new Date(currentTime.getFullYear(), currentTime.getMonth() + 1, 0);
    const totalMinutes = (monthEnd.getTime() - monthStart.getTime()) / (1000 * 60);
    
    const downtimeMinutes = await this.getDowntimeMinutes(monthStart, currentTime);
    const errorBudgetMinutes = totalMinutes * 0.001; // 0.1% of month
    const consumed = (downtimeMinutes / errorBudgetMinutes) * 100;
    
    return {
      total: errorBudgetMinutes,
      consumed: downtimeMinutes,
      remaining: errorBudgetMinutes - downtimeMinutes,
      percentage: consumed,
    };
  }

  async checkFreezePolicy() {
    const budget = await this.calculateErrorBudget();
    
    if (budget.percentage > 90) {
      // Freeze all deployments except critical fixes
      await this.enableDeploymentFreeze({
        reason: 'Error budget > 90% consumed',
        allowed: ['hotfix', 'security-patch'],
      });
    } else if (budget.percentage > 75) {
      // Require additional approvals
      await this.enableDeploymentReview({
        reason: 'Error budget > 75% consumed',
        requiredApprovals: 2,
      });
    }
  }
}
```

**Error Budget Dashboard Metrics:**

```typescript
// Grafana dashboard queries
// Error Budget Consumption
sum(rate(http_requests_total{status=~"5.."}[5m])) 
  / 
sum(rate(http_requests_total[5m])) 
  * 100 
  as "Error Rate %"

// Error Budget Remaining
(43.2 - (uptime_downtime_minutes / 60)) 
  as "Error Budget Remaining (hours)"

// Alert when > 50% consumed
(consumed_budget_percentage > 50) 
  as "Error Budget Alert"
```

### Distributed Tracing Sampling

**Sampling Strategy:**

| Scenario | Sampling Rate | Rationale |
|----------|--------------|-----------|
| **Errors (5xx)** | 100% | Capture all errors for debugging |
| **Slow Requests (>500ms)** | 100% | Performance optimization |
| **Normal Success** | 10% | Cost optimization, representative sample |
| **High Traffic (>1000 req/s)** | Adaptive (5-10%) | Reduce overhead during peak |
| **Low Traffic (<100 req/s)** | Adaptive (50-100%) | More visibility when needed |

**Adaptive Sampling Implementation:**

```typescript
// OpenTelemetry adaptive sampling
import { TraceIdRatioBasedSampler, ParentBasedSampler } from '@opentelemetry/sdk-trace-base';

export function createAdaptiveSampler() {
  return new ParentBasedSampler({
    root: new TraceIdRatioBasedSampler(0.1), // Default 10%
    
    // Override for errors
    remoteParentSampled: (span) => {
      const statusCode = span.attributes['http.status_code'];
      if (statusCode >= 500) {
        return true; // Sample all errors
      }
      
      // Override for slow requests
      const duration = span.duration;
      if (duration > 500000000) { // > 500ms in nanoseconds
        return true; // Sample all slow requests
      }
      
      // Use parent decision or default 10%
      return span.parentSpanId ? undefined : Math.random() < 0.1;
    },
  });
}

// Initialize tracing with adaptive sampler
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';

const provider = new NodeTracerProvider({
  sampler: createAdaptiveSampler(),
});
```

**Sampling Configuration:**

```yaml
# OpenTelemetry configuration
tracing:
  sampling:
    default_rate: 0.10 # 10%
    error_rate: 1.0 # 100% errors
    slow_request_threshold_ms: 500
    adaptive:
      enabled: true
      high_traffic_threshold: 1000 # req/s
      high_traffic_rate: 0.05 # 5%
      low_traffic_threshold: 100 # req/s
      low_traffic_rate: 0.50 # 50%
```

### Business Metrics Dashboard Template

**Standard Business KPIs:**

```typescript
// Business metrics dashboard queries
export const businessMetrics = {
  // User Growth
  newSignups: 'sum(increase(user_signups_total[24h]))',
  activeUsers: 'sum(active_users{period="daily"})',
  retentionRate: 'sum(returning_users) / sum(new_users) * 100',
  
  // Engagement
  notesCreated: 'sum(increase(notes_created_total[24h]))',
  apiCallsPerUser: 'sum(api_calls_total) / sum(active_users)',
  sessionDuration: 'avg(session_duration_seconds)',
  
  // Revenue (if applicable)
  mrr: 'sum(monthly_recurring_revenue)',
  arr: 'sum(annual_recurring_revenue)',
  churnRate: 'sum(churned_subscriptions) / sum(total_subscriptions) * 100',
  
  // Feature Usage
  featureAdoption: 'sum(feature_usage{feature="ai-summary"}) / sum(active_users) * 100',
};
```

**Grafana Dashboard Template:**

```json
{
  "dashboard": {
    "title": "Vorklee2 Business Metrics",
    "panels": [
      {
        "title": "New Signups (24h)",
        "targets": [{
          "expr": "sum(increase(user_signups_total[24h]))"
        }]
      },
      {
        "title": "Active Users",
        "targets": [{
          "expr": "sum(active_users{period=\"daily\"})"
        }]
      },
      {
        "title": "Notes Created (24h)",
        "targets": [{
          "expr": "sum(increase(notes_created_total[24h]))"
        }]
      }
    ]
  }
}
```

### Mobile App Performance Monitoring

**Mobile-Specific Metrics:**

| Metric | Target | Monitoring Tool |
|--------|--------|-----------------|
| **App Launch Time (Cold)** | < 2 seconds | Firebase Performance, Sentry |
| **App Launch Time (Warm)** | < 500ms | Firebase Performance |
| **API Response Time** | < 250ms P95 | New Relic, Datadog |
| **Crash Rate** | < 0.1% | Sentry, Firebase Crashlytics |
| **ANR Rate** | < 0.05% | Firebase Performance |
| **Battery Usage** | < 5% per hour | Custom metrics |
| **Network Failures** | < 1% | Custom metrics |
| **Offline Sync Success** | > 99% | Custom metrics |

**Mobile Performance Tracking:**

```typescript
// React Native performance monitoring
import perf from '@react-native-firebase/perf';

export async function trackAppLaunch() {
  const trace = await perf().startTrace('app_launch');
  
  // App initialization
  await initializeApp();
  trace.putAttribute('launch_type', 'cold');
  
  // First screen render
  await renderFirstScreen();
  const duration = await trace.stop();
  
  // Report to analytics
  await analytics.logEvent('app_launch', {
    duration_ms: duration,
    launch_type: 'cold',
  });
}

// Network performance
export async function trackAPICall(endpoint: string) {
  const httpMetric = await perf().newHttpMetric(endpoint, 'GET');
  
  await httpMetric.start();
  try {
    const response = await fetch(endpoint);
    httpMetric.setHttpResponseCode(response.status);
    httpMetric.setResponseContentType(response.headers.get('content-type'));
    await httpMetric.stop();
  } catch (error) {
    httpMetric.setHttpResponseCode(500);
    await httpMetric.stop();
    throw error;
  }
}
```

## 🧩 13. DevOps Observability Dashboard

All metrics centralized in **Grafana** under `/vorklee-observability`.

Dashboards include:
- **Golden Signals**: Latency, Traffic, Errors, Saturation
- **API Metrics**: Request throughput, response times (P50/P95/P99), error rates
- **Database Metrics**: Connection pool usage, query latency, slow queries
- **Infrastructure**: CPU, memory, disk I/O, network
- **Business Metrics**: User signups, notes created, API calls per org
- **Security Metrics**: Failed auth attempts, rate limit hits, unusual activity
- **CI/CD Metrics**: Build duration, deploy frequency, failure rate, MTTR
- **Error Budget**: Consumption tracking with automatic freeze policies
- **Log Storage Costs**: Hot/warm/cold storage monitoring
- **Mobile Performance**: App launch time, crash rate, battery usage

---

## 🔐 14. Certificate & Secret Management

### TLS Certificate Management

| Component | Provider | Renewal | Validation |
|-----------|----------|---------|------------|
| **Primary Domain** | Let's Encrypt | Auto (60-day before expiry) | ACME DNS-01 |
| **Wildcard Certs** | Let's Encrypt | Auto via cert-manager | DNS validation |
| **Internal Services** | Private CA | Manual (1-year) | mTLS validation |
| **CDN** | Cloudflare | Automatic | Origin CA |

**Certificate Monitoring:**
```bash
# Automated certificate expiry check (daily)
openssl s_client -connect api.vorklee.com:443 -servername api.vorklee.com \
  | openssl x509 -noout -dates

# Alert if < 30 days remaining
```

**cert-manager Configuration (Kubernetes):**
```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: devops@vorklee.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - dns01:
        cloudflare:
          apiTokenSecretRef:
            name: cloudflare-api-token
            key: api-token
```

### Secret Rotation Automation

**Automated Rotation Schedule:**
```yaml
# secrets-rotation.yml
rotation_policies:
  jwt_keys:
    schedule: "every 90 days"
    overlap: "7 days"
    notification: "7 days before"

  database_passwords:
    schedule: "every 90 days"
    downtime: "zero"  # Rolling update

  api_keys:
    schedule: "every 90 days"
    services: ["stripe", "sendgrid", "twilio"]

  redis_passwords:
    schedule: "every 90 days"
    method: "dual-password"  # Support both old/new
```

**Rotation Process:**
1. Generate new secret in Vault
2. Deploy applications with dual-secret support
3. Verify new secret works
4. Remove old secret after 7-day grace period
5. Update audit logs

---

## 📚 14. Operational Runbooks

### Standard Operating Procedures

| Scenario | Runbook | MTTR Target |
|----------|---------|-------------|
| **Database Connection Pool Exhausted** | `runbooks/db-pool-exhausted.md` | < 15 minutes |
| **High API Latency** | `runbooks/high-api-latency.md` | < 30 minutes |
| **Failed Deployment** | `runbooks/deployment-rollback.md` | < 5 minutes |
| **Certificate Expiry** | `runbooks/cert-renewal.md` | < 1 hour |
| **Redis Failure** | `runbooks/redis-failover.md` | < 10 minutes |
| **Auth Service Down** | `runbooks/auth-outage.md` | < 5 minutes |

### Example Runbook: Database Pool Exhausted

```markdown
# Runbook: Database Connection Pool Exhausted

## Symptoms
- API returning 500 errors
- "Connection pool exhausted" in logs
- Dashboard shows 100/100 connections in use

## Immediate Actions (< 5 min)
1. Check Grafana: Identify which service is leaking connections
2. Restart the leaking service (rolling restart, no downtime)
3. Monitor connection count - should drop to < 25 per service

## Investigation (< 15 min)
1. Check for long-running queries:
   ```sql
   SELECT * FROM pg_stat_activity
   WHERE state = 'active' AND query_start < now() - interval '5 minutes';
   ```
2. Review recent deployments - was code change related?
3. Check for unusual traffic patterns

## Long-term Fix
1. Add connection leak detection in code
2. Implement connection timeout (10 minutes max)
3. Add alerts for > 80% pool utilization
4. Consider increasing pool size if legitimate usage

## Post-Incident
- Create Jira ticket for root cause analysis
- Update this runbook with learnings
- Review connection management in codebase
```

### Escalation Matrix

| Severity | Initial | +15 min | +30 min | +1 hour |
|----------|---------|---------|---------|---------|
| **P0** | On-call engineer | Engineering manager | CTO | CEO |
| **P1** | On-call engineer | Team lead | Engineering manager | - |
| **P2** | On-call engineer | Team lead | - | - |
| **P3** | On-call engineer | - | - | - |

---

## 💰 15. Cost Optimization

### Cloud Cost Monitoring

**FinOps Dashboard:** Track costs per service, environment, and resource

| Resource | Monthly Budget | Current | Trend | Alert |
|----------|----------------|---------|-------|-------|
| **Neon DB** | $2,000 | $1,850 | ↗ +10% | Yellow |
| **Vercel** | $1,500 | $1,200 | ↔ Stable | Green |
| **Redis** | $500 | $450 | ↔ Stable | Green |
| **S3/R2** | $300 | $280 | ↔ Stable | Green |
| **Cloudflare** | $200 | $150 | ↘ -5% | Green |
| **Total** | $4,500 | $3,930 | ↗ +8% | Green |

### Cost Optimization Strategies

| Area | Strategy | Savings | Implementation |
|------|----------|---------|----------------|
| **Database** | Auto-pause staging DBs after hours | 30% | Neon auto-suspend |
| **Compute** | Right-size container resources | 20% | Resource profiling |
| **Storage** | S3 lifecycle policies (90-day glacier) | 40% | Automated |
| **CDN** | Cloudflare caching rules | 50% | Cache optimization |
| **Monitoring** | Log retention tuning (90-day hot) | 35% | Automated archival |

### Resource Tagging Strategy

```yaml
# Standard tags for all resources
tags:
  environment: production | staging | development
  service: core | notes | attendance | hr
  cost_center: engineering | operations | analytics
  owner: team-name
  criticality: high | medium | low
```

**Cost Allocation:**
- **Per Customer**: Track costs by org_id for enterprise billing
- **Per Feature**: Identify expensive features for optimization
- **Per Environment**: Ensure staging < 20% of production costs

---

## 📖 16. Documentation Standards

### Code Documentation

```typescript
/**
 * Creates a new note in the database.
 *
 * @param input - Note creation payload
 * @param input.title - Note title (max 200 chars)
 * @param input.content - Note content (markdown supported)
 * @param input.userId - Owner user ID
 * @param input.orgId - Organization ID
 *
 * @returns Created note with generated ID
 *
 * @throws {ValidationError} If input validation fails
 * @throws {DatabaseError} If database operation fails
 * @throws {AuthorizationError} If user lacks permission
 *
 * @example
 * ```typescript
 * const note = await createNote({
 *   title: "Meeting Notes",
 *   content: "# Agenda\n- Item 1",
 *   userId: "uuid-123",
 *   orgId: "uuid-456"
 * });
 * ```
 */
export async function createNote(input: NoteInput): Promise<Note> {
  // Implementation
}
```

### API Documentation

- **OpenAPI 3.1** specs for all REST endpoints
- **GraphQL SDL** with detailed field descriptions
- **Postman Collections** for manual testing
- **SDK Documentation** auto-generated from specs

### Architecture Documentation

**ADR (Architecture Decision Records):**
```markdown
# ADR-001: Use Neon for Multi-Project Database

## Status
Accepted (2025-01-15)

## Context
Need multi-tenant database with project isolation and serverless scaling.

## Decision
Use Neon Postgres with separate projects per service.

## Consequences
**Positive:**
- Complete data isolation per service
- Independent scaling
- Simplified backup/restore

**Negative:**
- No foreign keys across services
- Cross-service queries require APIs
- Higher base cost than single DB

## Alternatives Considered
1. Single Postgres with schemas
2. MongoDB multi-tenancy
3. Supabase

## References
- Neon docs: https://neon.tech/docs/
- Multi-tenancy patterns: ...
```

---

## ✅ 17. Summary

The **Engineering & Security Guidelines** establish the foundation for safe, scalable, and compliant development in Vorklee2.

**Key Enhancements in v5.3:**
- **OWASP Top 10 2021 Mapping**: Comprehensive prevention strategies for all 10 critical risks with verification methods
- **Security Headers**: Complete list with Next.js implementation examples (HSTS, CSP, X-Frame-Options, etc.)
- **Vulnerability Disclosure Policy**: Responsible disclosure process with severity-based response times
- **Penetration Testing**: Quarterly external, monthly internal, weekly automated scans
- **Security Testing in CI/CD**: SAST, DAST, and secrets scanning with false-positive handling
- **CSP Violation Reporting**: Automated detection and alerting for potential XSS attempts
- **Mutation Testing**: Stryker integration for test quality validation (≥80% for critical paths)
- **Contract Testing**: Pact-based API contract testing to prevent breaking changes
- **Chaos Engineering**: Monthly/quarterly failure injection tests for resilience validation
- **WCAG 2.1 AA Compliance**: Automated accessibility testing with pa11y and manual testing checklist
- **Load Testing Schedule**: Weekly staging, monthly production with multiple scenarios (baseline, peak, stress, spike)
- **Browser/Device Matrix**: Comprehensive testing matrix for web and mobile platforms

**Previous Enhancements:**
- **Enhanced CI/CD**: Multi-stage pipeline with security scanning, SBOM generation, and GPG verification
- **Supply Chain Security**: Snyk, Trivy, TruffleHog integrated into every build
- **SLO Targets**: 99.9% availability, P95 < 250ms, P99 < 500ms with error budget policy
- **Structured Logging**: JSON format with trace_id, PII redaction, OpenTelemetry tracing
- **Incident Response**: 4-tier severity system with < 15min response for P0 incidents
- **Observability**: Comprehensive Grafana dashboards with golden signals and business metrics

By integrating DevSecOps, continuous audits, SLOs, comprehensive observability, and industry-standard security controls (OWASP Top 10), the platform ensures **trust, uptime, and data protection** at every layer.

---

**End of File — 06_Engineering_and_Security_Guidelines_v5.md**
