# Real Estate Caller Desk — Offline-first prototype

यह standalone project है। इसे OM Krishna Group, MetroCRM और Metro Properties से अलग रखा गया है।

## अभी उपलब्ध सुविधाएँ
- Admin और 10 demo Caller accounts के साथ prototype login
- Admin के Users tab से local accounts create/edit करना, display name/username/email बदलना, password बदलना, role और active status बदलना
- Leads add/edit/delete, caller assignment display, follow-ups और site visits
- CSV export और Admin JSON backup/restore
- Service worker app-shell cache, पहली online visit के बाद सीमित offline opening

## Demo login — केवल prototype
- Admin: `admin` / `AdminDemo123!`
- Caller 01: `caller01` / `CallerDemo123!`
- Caller 02–10: `caller02` ... `caller10` / `CallerDemo123!`

पहली बार Admin login के बाद Users tab में Admin credentials बदलने का local option है। यह सुविधा अभी उसी browser में काम करती है; इसे secure server-side password management न समझें।

## सुरक्षा स्थिति — जरूरी
**यह अभी production-ready नहीं है। वास्तविक ग्राहक डेटा या reused passwords न डालें।**
- यह public GitHub repository है; code और demo credentials कोई भी देख सकता है।
- Login, user roles और caller filtering frontend JavaScript में हैं।
- Account passwords browser localStorage में plaintext रूप में store होते हैं।
- Leads और accounts उसी browser/device में save होते हैं; दूसरे devices के साथ sync नहीं होते।
- UI में Caller filtering वास्तविक server-side privacy नहीं देती; browser code बदला जा सकता है।
- Secure multi-user usage से पहले dedicated backend, server-managed auth, password reset, database RLS policies, account provisioning, audit logging, sync/conflict handling और authorization tests जरूरी हैं।
- किसी existing OM Krishna Group / MetroCRM / Metro Properties backend को इस app के लिए reuse नहीं करना है।

## Chromebook पर चलाना
1. GitHub Pages site खोलें: https://useforlogin92-netizen.github.io/real-estate-caller-system/
2. पहली बार online रहते हुए पूरा load होने दें।
3. Chrome menu में “Install page as app” / “Install app” चुनें (नाम Chrome version के अनुसार बदल सकता है)।
4. App shell कुछ परिस्थितियों में offline खुल सकता है; offline खुलना multi-device sync का अर्थ नहीं है।

## Dedicated backend पूरा करने के लिए
एक नया, अलग Supabase organization/project provision करें। Project बनाने से पहले organization और estimated cost की पुष्टि आवश्यक है। उसके बाद server-managed auth, profiles, lead ownership UUIDs, strict RLS, admin-only user management, password reset और tested sync configure किए जाएँगे।

विस्तृत requirements: [ACCOUNT_MANAGEMENT_REQUIREMENTS.md](./ACCOUNT_MANAGEMENT_REQUIREMENTS.md)  
Security audit: [SECURITY_AUDIT.md](./SECURITY_AUDIT.md)
