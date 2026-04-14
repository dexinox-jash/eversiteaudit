# safety.md — Security, Safety & Audit Protocols

> **Parent:** `master.md`  
> **Read this for:** Any authentication, authorization, API endpoint, input handling, cryptography, file upload, database query, third-party integration, or AI agent feature.

---

## 1. Security Mission Statement

Security is not a feature — it is a foundational requirement. This project targets **OWASP ASVS Level 3** for all critical paths and **Level 2** as the baseline minimum. Zero tolerance for known vulnerabilities.

**Reference Skills:** `owasp-security`, `security-audit`, `verification-quality`

---

## 2. OWASP Top 10:2025 Quick Reference

| # | Risk | Prevention Rule |
|---|------|-----------------|
| A01 | Broken Access Control | Deny by default; enforce authorization server-side; verify ownership |
| A02 | Security Misconfiguration | Harden configs; disable defaults; minimize attack surface |
| A03 | Supply Chain Failures | Lock dependency versions; audit packages; verify integrity |
| A04 | Cryptographic Failures | TLS 1.3; AES-256-GCM; Argon2id/bcrypt for passwords |
| A05 | Injection | Parameterized queries; input validation; safe APIs |
| A06 | Insecure Design | Threat model; rate limits; design security controls in from day one |
| A07 | Auth Failures | MFA for sensitive ops; check breached passwords; secure sessions |
| A08 | Integrity Failures | Signed packages; safe serialization; verify file uploads |
| A09 | Logging Failures | Log all security events; structured format; alerting |
| A10 | Exception Handling | Fail-closed; hide internals; log with traceable IDs |

---

## 3. Secure Coding Patterns

### 3.1 Authentication & Sessions
- Passwords hashed with **Argon2id** (minimum) or bcrypt. **Never** MD5/SHA1.
- Session tokens: 128+ bits entropy, short expiration, rotated on privilege change.
- Invalidate sessions on logout and password change.
- Biometric auth (Face ID / Touch ID / Fingerprint) must fallback to strong credential.

### 3.2 Access Control
- Authorization checked **on every request** — not just at the UI layer.
- Use object references the user cannot manipulate (UUIDs, not incrementing integers).
- **Deny by default.** If auth check fails or throws, return 403/401 — never allow.

### 3.3 Input Validation
- Validate on the **server** (or at the API boundary), not just client-side.
- Allowlist validation preferred over denylist.
- Enforce length limits on all inputs.
- Sanitize data before rendering (XSS prevention).

### 3.4 Error Handling — Fail-Closed
```typescript
// UNSAFE: Fail-open
function checkPermission(user: User, resource: Resource): boolean {
  try {
    return authService.check(user, resource);
  } catch {
    return true; // DANGEROUS
  }
}

// SAFE: Fail-closed
function checkPermission(user: User, resource: Resource): boolean {
  try {
    return authService.check(user, resource);
  } catch (error) {
    logger.error({ errorId: uuid(), error }, 'Auth check failed');
    return false; // Deny on error
  }
}
```

### 3.5 Secrets Management
- No secrets in source code or version control.
- Use environment variables or secure vaults in CI/CD.
- On device: `expo-secure-store` or Keychain/Keystore only.
- Rotate secrets quarterly or on suspected compromise.

### 3.6 Mobile-Specific Security
- **Certificate pinning** for production API communication.
- **Root/jailbreak detection** for high-risk features (optional but recommended).
- **Screenshot prevention** for screens showing sensitive data.
- **App attestation** (App Attest / SafetyNet) for critical API calls.

---

## 4. Agentic AI Security (OWASP 2026)

Because this project uses an AI agent army, the following agentic risks are explicitly mitigated:

| Risk | Mitigation |
|------|------------|
| ASI01: Goal Hijack | Input sanitization, goal boundaries, behavioral monitoring |
| ASI02: Tool Misuse | Least privilege, fine-grained permissions, validate I/O |
| ASI03: Identity & Privilege Abuse | Short-lived scoped tokens, identity verification |
| ASI04: Supply Chain | Verify skill signatures, sandbox plugins, allowlist MCP servers |
| ASI05: Code Execution | Sandbox execution, static analysis, human approval for generated scripts |
| ASI06: Memory Poisoning | Validate stored patterns, segment by trust level |
| ASI07: Insecure Inter-Agent Comms | Authenticate, encrypt, verify integrity |
| ASI08: Cascading Failures | Circuit breakers, graceful degradation, isolation |
| ASI09: Human-Agent Trust Exploitation | Label AI-generated code, require human review for security paths |
| ASI10: Rogue Agents | Behavior monitoring, kill switches, anomaly detection |

### 4.1 Agent Security Checklist
- [ ] All agent inputs sanitized and validated
- [ ] Tools operate with minimum required permissions
- [ ] Credentials are short-lived and scoped
- [ ] Third-party plugins verified and sandboxed
- [ ] Code execution happens in isolated environments
- [ ] Agent communications authenticated and encrypted
- [ ] Circuit breakers between agent components
- [ ] Human approval for sensitive operations
- [ ] Behavior monitoring for anomaly detection
- [ ] Kill switch available for agent systems

---

## 5. Security Audit Checklist

Before any security-sensitive code is considered complete:

### Input Handling
- [ ] All user input validated at API boundary
- [ ] Parameterized queries used (no string concatenation)
- [ ] Input length limits enforced
- [ ] Allowlist validation preferred

### Auth & Sessions
- [ ] Passwords hashed with Argon2id/bcrypt
- [ ] Session tokens have 128+ bits entropy
- [ ] Sessions invalidated on logout
- [ ] MFA available for sensitive operations

### Access Control
- [ ] Authorization checked on every request
- [ ] Object references are non-guessable (UUIDs)
- [ ] Deny by default policy enforced
- [ ] Privilege escalation paths reviewed

### Data Protection
- [ ] Sensitive data encrypted at rest
- [ ] TLS 1.3 for all data in transit
- [ ] No sensitive data in URLs or logs
- [ ] Secrets in secure storage (not code)

### Error Handling
- [ ] No stack traces exposed to users
- [ ] Fail-closed on errors
- [ ] All exceptions logged with context and traceable IDs
- [ ] Consistent error responses (no information enumeration)

---

## 6. Language-Specific Security Focus

### TypeScript / JavaScript / React Native
- **Prototype pollution:** Validate keys, use `Object.create(null)` for maps from user input.
- **XSS:** Never use `dangerouslySetInnerHTML` or `eval()` with untrusted data.
- **Deserialization:** Never `eval()` or `Function()` with user input.
- **Dependencies:** Run `npm audit` and Snyk scans in CI/CD.

### Dart / Flutter (if used)
- **Insecure storage:** Use `flutter_secure_storage`, not `SharedPreferences` for secrets.
- **Platform channels:** Validate all data crossing native bridges.

**Reference Skill:** `owasp-security` (Language-Specific Security Quirks section)

---

## 7. Incident Response

1. **Detection:** Automated security scans in CI/CD + runtime anomaly monitoring.
2. **Containment:** Kill switch for agent swarms; feature flags for vulnerable code paths.
3. **Investigation:** Preserve logs with traceable IDs; reproduce with minimal dataset.
4. **Remediation:** Patch, verify with security audit, deploy hotfix.
5. **Post-Mortem:** Document in `docs/security/incidents/YYYY-MM-DD-description.md`.

---

## 8. Compliance Targets

| Standard | Level | Scope |
|----------|-------|-------|
| OWASP ASVS 5.0 | L3 (Critical), L2 (Baseline) | All auth, payment, admin paths |
| OWASP Agentic AI 2026 | Full | All AI agent coordination features |
| GDPR | Compliance | User data handling, right to erasure |
| SOC 2 Type II | Alignment | Security logging, access controls |

---

**End of safety.md**
