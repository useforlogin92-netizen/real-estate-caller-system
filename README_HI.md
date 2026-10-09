# Real Estate Caller Desk — Offline-first starter

यह एक नया standalone prototype है। यह पुराने OM Krishna Group / MetroCRM project से कोई code या credentials इस्तेमाल नहीं करता।

## अभी क्या काम करता है
- Browser में local demo login
- Admin demo और Caller 01–10 demo accounts
- Leads जोड़ना/संपादित करना/हटाना
- Caller-wise local display filtering
- Follow-ups और site visits
- CSV export और Admin JSON backup/restore
- Service worker के जरिए पहली online visit के बाद app shell offline cache

## Demo credentials — केवल prototype
- Admin: `admin` / `AdminDemo123!`
- Caller 01: `caller01` / `CallerDemo123!`
- Caller 02–10: `caller02` ... `caller10` / `CallerDemo123!`

**इन passwords को production में न इस्तेमाल करें। इस prototype में client-side login और filtering सुरक्षित authentication नहीं हैं। Real customer data न डालें।**

## Chromebook पर चलाना
PWA/service worker के लिए app को HTTPS वाली website पर deploy करना या `localhost` पर serve करना होगा। `index.html` को सीधे Files app से खोलने पर offline install/service worker काम नहीं कर सकता।

1. ZIP extract करें।
2. इन files को नई GitHub repository में upload करें।
3. Repository Settings → Pages में deployment enable करें (Deploy from branch, `main`, `/root`)।
4. Published HTTPS URL Chromebook के Chrome में खोलें और पहली बार online रहते हुए पूरा load होने दें।
5. Chrome menu → Install page as app / Install app (menu wording varies) चुनें।
6. उसके बाद app shell offline खुल सकता है; local records उसी browser/device में रहते हैं।

## Offline limitation — बहुत जरूरी
- Local data दूसरे devices पर sync नहीं होगा।
- Browser/site data clear होने या device खोने पर records जा सकते हैं; नियमित backup लें।
- एक shared device पर localStorage data को अलग-अलग users के बीच secure नहीं माना जा सकता।
- Demo UI में caller filtering केवल demonstration है। Production caller-only privacy के लिए अलग backend authentication, server-side authorization/RLS, secure session management और per-record permission tests जरूरी हैं।
- Offline multi-user security के लिए आगे encrypted local storage, per-user device authorization और reliable sync/conflict handling का design जरूरी होगा।

## Suggested production architecture
- Frontend: installable PWA
- Backend: new dedicated Supabase project or another isolated backend
- Auth: server-managed password authentication
- Data access: RLS policies on every table, default deny
- Offline: IndexedDB queue with encrypted local data; sync after connection returns
- Conflict handling: updated_at/version columns and conflict review
- Admin: invite/disable callers, assignments, audit trail, backups
