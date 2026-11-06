# Zero-cost policy

No payment method, paid cloud plan, prepaid credit, commercial LLM API, R2 bucket, D1 database, paid analytics, or subscription product was configured. A local build has no service billing dependency.

OpenAlex or gateway quota exhaustion stops online results and offers official links. Crossref failure stops the lookup. Without a gateway, OA resolution uses the public OpenAlex API; no unconfigured Unpaywall request is attempted. No automatic upgrade, paid substitution, or background retry loop exists.

Cloudflare account identity was readable, but the subscriptions endpoint returned 403: OAuth cannot read billing subscriptions; an API token with Billing Read is required. workers/account-settings returned default_usage_model=standard, which is insufficient evidence of free-only billing. Consequently no Cloudflare resource was created and zero-cost deployment verification remains pending.

Before deployment verify Workers Free and resource inventory with read-only billing access. Never deploy the optional gateway to a potentially billable account on an assumption. Application flags are not a billing control. Public request volume can exhaust free quotas and availability is not guaranteed.
