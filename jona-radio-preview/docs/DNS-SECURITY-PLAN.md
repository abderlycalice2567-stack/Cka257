# DNS Security Plan — DNSSEC & CAA (F-04)

> Owner-controlled, production-only tasks. **Do not change any existing DNS
> records.** This is a plan, not an executed change. The current authoritative
> DNS appears to be Hostinger (`*.dns-parking.com`); exact steps depend on where
> the zone is finally managed.

## CAA (Certificate Authority Authorization)

Restricts which CAs may issue certificates for the domain. The site currently
uses Let's Encrypt, so:

```
jonaradio.net.  CAA  0 issue "letsencrypt.org"
jonaradio.net.  CAA  0 issuewild ";"          # disallow wildcards unless needed
jonaradio.net.  CAA  0 iodef "mailto:security@jonaradio.net"
```

- Add every CA actually in use (e.g. the host's own ACME CA) before enforcing,
  or renewals will fail.
- Low risk, quick win; validate with a CAA lookup afterwards.

## DNSSEC

Cryptographically signs DNS so resolvers can detect tampering.

**Eligibility:** both the DNS operator and the registrar must support DNSSEC and
DS-record publication. Confirm with the owner's registrar first.

**Rollout:**

1. Enable signing at the DNS operator (generate ZSK/KSK; the operator usually
   manages these).
2. Publish the **DS record** at the registrar (parent zone). This is the step
   that "turns on" validation.
3. Wait for propagation (respect TTLs; often up to 24–48 h).

**Validation procedures:**

- Check the chain of trust with a DNSSEC validator / `delv`/`dig +dnssec`.
- Confirm the `AD` (Authenticated Data) flag is set from a validating resolver.
- Monitor for `SERVFAIL` (a classic sign of a broken chain).

**Rollback:**

- Remove the **DS record at the registrar first**, wait for the parent TTL, then
  disable signing at the operator. Never disable signing while the DS is still
  published (that causes validation failures / outages).

## Change management

- Lower TTLs before changes; restore afterwards.
- Make one change at a time; verify before the next.
- Keep a written record of previous values for rollback.
- Schedule during low-traffic windows; have the owner's registrar login ready.

## Checklist

- [ ] Confirm registrar + DNS operator support DNSSEC and DS publication
- [ ] Publish CAA (all in-use CAs) and verify
- [ ] Enable DNSSEC signing at the operator
- [ ] Publish DS at the registrar; verify `AD` flag and chain
- [ ] Monitor 48 h for `SERVFAIL`
- [ ] Document final records and the rollback procedure
