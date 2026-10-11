# Go-live checklist

Work through this with the owner before sharing the site publicly. This website is a
product-information and order-request site, **not a legal exemption**: food-safety,
labelling, consumer-protection, privacy and tax rules depend on what the business actually
does. The owner must confirm what applies — with the authorities or a qualified adviser.

## Content approved by the owner (Phase 0–1)
- [ ] Owner name, business name, WhatsApp number, phone, location, delivery area note.
- [ ] Every visible product: name, **product-only price** for each pack size, pack size,
      description, ingredients, **allergens**, storage, shelf life.
- [ ] No unsubstantiated claims: no health benefits, no "organic", "natural",
      "chemical-free", "preservative-free", no certification badges without evidence.
- [ ] Photos are real (products, kitchen, village, maker) and owned by/licensed to the owner.
- [ ] YouTube links are the owner's or used with permission.
- [ ] Story, village, process and sourcing text written/approved by the owner.
- [ ] Privacy notice reviewed (retention period matches the backend `RETENTION_DAYS`), version set.
- [ ] Terms & disclaimer reviewed.
- [ ] Expected response time is realistic.
- [ ] Sample products removed or replaced; **"sample content" notice switched off**.

## Compliance reminders for the owner (not legal advice)
- [ ] FSSAI registration/licence appropriate to the business confirmed via
      [FoSCoS](https://foscos.fssai.gov.in/); number entered in *Business → FSSAI* if
      applicable. See also [fssai.gov.in](https://www.fssai.gov.in/).
- [ ] Labelling requirements for packed food checked (packs carry the required details).
- [ ] Consumer-protection / e-commerce obligations reviewed
      ([consumeraffairs.gov.in](https://consumeraffairs.gov.in/)).
- [ ] Digital Personal Data Protection Act/Rules status reviewed at launch
      ([meity.gov.in](https://www.meity.gov.in/)).
- [ ] Local permissions and GST/tax position confirmed for the actual sales volume.
- [ ] Nothing on the site claims the website removes these obligations.

## Technical (Phase 2–6)
- [ ] Backend deployed with `ENVIRONMENT=production` and a real `SECRET_KEY` (API docs disabled, HSTS on).
- [ ] `CORS_ALLOWED_ORIGINS` lists only the real site origin(s), e.g. `https://gunwatts.github.io`; no wildcard.
- [ ] Secrets only in the server `.env` (permissions 600); nothing secret in GitHub or in
      the frontend build variables.
- [ ] Owner and developer admin accounts created with strong unique passwords;
      **two-step sign-in enabled** for both.
- [ ] HTTPS enforced on PythonAnywhere and GitHub Pages / custom domain.
- [ ] Email alerts tested (*Account & data → Send test email*), or owner agrees to check the
      inbox daily without email.
- [ ] Daily backup scheduled task created and one restore tested ([OPERATIONS.md](https://github.com/gunwatts/Homemadefood-Ayudhas-Backend/blob/main/docs/OPERATIONS.md)).
- [ ] Proof-of-deployment checks done ([backend DEPLOYMENT.md](https://github.com/gunwatts/Homemadefood-Ayudhas-Backend/blob/main/docs/DEPLOYMENT.md)), including persistence after reload.
- [ ] CI green in both repositories: backend tests/migrations check, frontend typecheck/lint/tests, **no-payment guards**.
- [ ] Manual checks on a real phone: browse, add to list, Place Order, callback request,
      WhatsApp button opens WhatsApp only when tapped, YouTube video plays (and the
      "Watch on YouTube" link works).
- [ ] Customer numbers do not appear on any public page or API response (covered by tests;
      there is no analytics provider).
- [ ] Site has **no** payment gateway, cart checkout, payment collection, shipment booking or
      "order confirmed" wording.

## Launch (Phase 7)
- [ ] Site reachable at its final address with HTTPS (github.io or custom sub-domain).
- [ ] One real end-to-end request tested and deleted.
- [ ] Owner trained with [ADMIN_GUIDE.md](ADMIN_GUIDE.md) (inbox routine, statuses, hiding products, photos,
      privacy requests).

## Handover (6.2)
- [ ] Admin guide ([ADMIN_GUIDE.md](ADMIN_GUIDE.md)) and content template ([content-template.csv](content-template.csv))
      given to the owner, plus photo guidance (landscape, daylight, real photos).
- [ ] Deployment, backup/restore, account recovery and incident notes ([DEPLOYMENT.md](DEPLOYMENT.md),
      [backend DEPLOYMENT.md](https://github.com/gunwatts/Homemadefood-Ayudhas-Backend/blob/main/docs/DEPLOYMENT.md), [OPERATIONS.md](https://github.com/gunwatts/Homemadefood-Ayudhas-Backend/blob/main/docs/OPERATIONS.md)) handed to whoever maintains the site.
- [ ] List of recurring costs and free-tier limits ([OPERATIONS.md](https://github.com/gunwatts/Homemadefood-Ayudhas-Backend/blob/main/docs/OPERATIONS.md)) shared.
- [ ] **Written agreement** on who owns and controls: domain registrar account, GitHub
      repository, PythonAnywhere account, Gmail alert account, source code rights, content
      and photos, customer enquiry data — plus the support/maintenance scope.
