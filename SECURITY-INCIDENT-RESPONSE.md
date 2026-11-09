# Elevoni security incident and personal-data breach playbook

**Owner:** Elevoni management must appoint a named incident lead and privacy lead before launch.  
**Keep this document available offline.**

## 1. Recognise and report
Treat suspected account takeover, exposed credentials, unauthorised database access, lost devices containing personal data, public exposure of private files, payment tampering, ransomware, malicious uploads or unintended disclosure as an incident.

Staff and contractors must immediately notify the incident lead. Do not investigate by downloading, forwarding or sharing more personal data than necessary.

## 2. Contain
- Disable compromised accounts, sessions, API keys or deployment credentials.
- Rotate affected secrets; revoke old tokens and provider keys.
- Restrict affected routes, uploads, database users or integrations.
- Preserve relevant logs and evidence; do not wipe or redeploy over evidence.
- Keep a timestamped incident log and record decisions.

## 3. Assess
Determine systems, time window, categories and approximate number of people/records affected; whether data was accessed, altered, lost or disclosed; likely harm; affected processors; and whether the incident is ongoing.

## 4. Notify
Escalate to Nigerian privacy counsel immediately. Under the Nigeria Data Protection Act 2023 section 40, a controller must notify NDPC within 72 hours after becoming aware of a personal-data breach likely to create a risk to individuals' rights and freedoms. Where the breach is likely to create a high risk, affected individuals must be communicated with as required by law. Processors must notify the controller without undue delay under applicable duties and the contract. GDPR, if applicable, has separate notification requirements and timelines.

Do not wait for a complete forensic report before escalating the statutory deadline. Counsel/privacy lead determines whether notification is legally required and its content.

## 5. Recover
Patch the root cause, rotate credentials, restore from verified backups where necessary, test access controls, monitor for recurrence and document residual risks.

## 6. Learn
Complete a post-incident review, update the risk register and training, record corrective actions, and retain evidence and notification records under the retention schedule.

## Emergency contact fields to complete before production
- Incident lead: ____________________
- Privacy lead / DPO (if appointed): ____________________
- Nigerian privacy counsel: ____________________
- Hosting/security escalation: ____________________
- Database backup owner: ____________________
- Payment provider escalation: ____________________
