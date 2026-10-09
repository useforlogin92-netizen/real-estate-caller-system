# Real Estate Caller Desk — Offline-first prototype

यह standalone project है। इसे OM Krishna Group, MetroCRM और Metro Properties से अलग रखा गया है।

## अभी उपलब्ध सुविधाएँ
- Admin और 10 demo Caller accounts के साथ prototype login
- Admin के Users tab से local accounts create/edit करना, display name/username/email बदलना, password बदलना, role/active status और prototype admin approval बदलना
- Login UI में Username + Password और OTP विकल्प; OTP delivery/verification अभी backend के बिना सक्रिय नहीं है
- Leads add/edit/delete, caller assignment display, follow-ups और site visits
- CSV export और Admin JSON backup/restore
- Service worker app-shell cache, पहली online visit के बाद सीमित offline opening

## Demo login — केवल prototype
- Admin: `admin` / `AdminDemo123!`
- Caller 01: `caller01` / `CallerDemo123!`
- Caller 02–10: `caller02` ... `caller10` / `CallerDemo123!`

पहली बार Admin login के बाद Users tab में Admin credentials बदलने का local option है। यह सुविधा अभी उसी browser में काम करती है; इसे secure server-side password management न समझें।

## Caller login: password, OTP और Admin approval
- Caller login में Username + Password और OTP verification विकल्प दिखते हैं।
- Admin Users tab में caller को approve/revoke कर सकता है; prototype login pending/rejected caller को रोकता है।
- यह approval केवल उसी browser के local demo data में लागू है; वास्तविक access control के लिए local server/backend पर approval enforce होना जरूरी है।
- OTP भेजना और verify करना अभी लागू नहीं है। इसके लिए server-side OTP expiry, one-time use, rate limits और SMS/email provider या स्पष्ट offline-LAN OTP design चाहिए। इंटरनेट बंद होने पर SMS/email OTP delivery नहीं होगी।

## सुरक्षा स्थिति — जरूरी
**यह अभी production-ready नहीं है। वास्तविक ग्राहक डेटा या reused passwords न डालें।**
- यह public GitHub repository है; code और demo credentials कोई भी देख सकता है।
- Login, user roles और caller filtering frontend JavaScript में हैं।
- Account passwords browser localStorage में plaintext रूप में store होते हैं।
- Leads और accounts उसी browser/device में save होते हैं; दूसरे devices के साथ sync नहीं होते।
- UI में Caller filtering वास्तविक server-side privacy नहीं देती; browser code बदला जा सकता है।
- Secure multi-user usage से पहले dedicated backend, server-managed auth, password reset, database RLS policies, account provisioning, audit logging, sync/conflict handling और authorization tests जरूरी हैं।
- किसी existing OM Krishna Group / MetroCRM / Metro Properties backend को इस app के लिए reuse नहीं करना है।

## Windows LAN server mode (Android/Windows/Chromebook)
Windows local server setup और commands के लिए [WINDOWS_LAN_SERVER.md](./WINDOWS_LAN_SERVER.md) देखें। Server और API integration का code मौजूद है, लेकिन Windows पर वास्तविक run और end-to-end tests अभी करना बाकी है। LAN mode में सभी devices उसी trusted Wi-Fi/LAN पर server PC के IP और port 8080 से जुड़ेंगे। Internet-free OTP Windows server terminal पर दिखेगा; SMS/email OTP के लिए internet provider चाहिए।

## Chromebook पर चलाना
1. GitHub Pages site खोलें: https://useforlogin92-netizen.github.io/real-estate-caller-system/
2. पहली बार online रहते हुए पूरा load होने दें।
3. Chrome menu में “Install page as app” / “Install app” चुनें (नाम Chrome version के अनुसार बदल सकता है)।
4. App shell कुछ परिस्थितियों में offline खुल सकता है; offline खुलना multi-device sync का अर्थ नहीं है।

## Dedicated backend पूरा करने के लिए
एक नया, अलग Supabase organization/project provision करें। Project बनाने से पहले organization और estimated cost की पुष्टि आवश्यक है। उसके बाद server-managed auth, profiles, lead ownership UUIDs, strict RLS, admin-only user management, password reset और tested sync configure किए जाएँगे।

विस्तृत requirements: [ACCOUNT_MANAGEMENT_REQUIREMENTS.md](./ACCOUNT_MANAGEMENT_REQUIREMENTS.md)  
Security audit: [SECURITY_AUDIT.md](./SECURITY_AUDIT.md)


## Recommended use: mostly offline, short daily backup window

- रोजमर्रा का काम local Windows LAN server पर करें; इंटरनेट लगातार चालू रखना जरूरी नहीं।
- दिन में एक बार internet थोड़ी देर के लिए connect करके `windows\RUN-OFFLINE-BACKUP.bat` चलाएँ।
- यह पहले local database/source backups बनाता है और फिर GitHub से current code ZIP download करता है।
- Backup के बाद internet disconnect कर सकते हैं। LAN server के लिए server PC चालू और local network उपलब्ध होना जरूरी है।
- GitHub पर code backup और customer-data backup अलग चीजें हैं: इस tool से customer database public GitHub पर upload नहीं होती।
- कई अलग offline PCs पर अलग-अलग leads दर्ज करने पर automatic merge नहीं होगा; सभी callers को एक ही LAN server database इस्तेमाल करना चाहिए।
- Daily backup/update automation Windows Task Scheduler से configure की जा सकती है; पहले manually test करें।
