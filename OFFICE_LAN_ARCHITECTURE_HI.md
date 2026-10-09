# Real Estate Caller System — Office LAN Architecture (Hindi)

## चुना हुआ निर्णय
- Login केवल office के trusted LAN/Wi-Fi पर होगा।
- एक Windows PC मुख्य server और shared database होगा।
- Online/offline backup या data restore/sync केवल Admin की स्पष्ट अनुमति पर होगा।
- अभी cloud backend/Supabase की जरूरत नहीं है।
- यह standalone system OM Krishna Group, MetroCRM और Metro Properties से अलग रहेगा।

## Login क्यों नहीं चल रहा था?
GitHub Pages की URL `https://useforlogin92-netizen.github.io/real-estate-caller-system/` static demo frontend है। वहाँ users और leads browser के LocalStorage में होते हैं, जो device/browser-specific हैं। इसलिए एक computer पर बनाया गया username दूसरे computer पर अपने-आप उपलब्ध नहीं होता।

Office में सभी devices को GitHub Pages के बजाय मुख्य server का LAN URL खोलना चाहिए, उदाहरण के लिए `http://192.168.1.50:8080`। यह example IP है; वास्तविक server PC IP `ipconfig` से पता करें।

## Target topology

```text
Admin PC ───────┐
Caller PC 1 ────┤
Caller PC 2 ────┼── Trusted Office Wi-Fi/LAN ── Windows Server PC
Caller PC 3 ────┤                              ├─ Node.js API :8080
Other clients ──┘                              └─ server/data/database.json
```

एक समय पर सभी callers इसी server से login करें। Server PC को चालू रखें। इस server port को router पर public internet के लिए forward न करें।

## चरण 1 — Server setup (Windows PowerShell)
Project folder से:
```powershell
cd server
node --version
npm run setup-admin -- admin "REPLACE-WITH-UNIQUE-LONG-PASSWORD" admin@local.test
npm start
```
- Node.js 20+ आवश्यक है।
- Password कम-से-कम 12 characters का unique password रखें; वास्तविक password chat/repository में न लिखें।
- `setup-admin` केवल पहली बार चलाएँ। यदि Admin पहले से है, तो इसे दोबारा चलाने की जरूरत नहीं।
- Server के terminal को खुला रखें।

## चरण 2 — Client devices
1. Server PC पर `ipconfig` चलाकर IPv4 address देखें।
2. सभी caller PCs को उसी trusted private Wi-Fi/LAN से जोड़ें।
3. प्रत्येक device पर `http://SERVER-IP:8080` खोलें।
4. GitHub Pages पर बनाए गए demo users की जगह server Admin से वास्तविक caller accounts बनवाएँ और approval दें।
5. Windows Firewall में Node.js/port 8080 को केवल Private network पर allow करें। Public network पर allow न करें।

## चरण 3 — Login/data source rules
- LAN URL: server-managed login, approval, users और leads का shared source।
- GitHub Pages URL: demo/prototype only; accounts browser-specific और production-safe नहीं।
- अलग-अलग PCs पर LocalStorage demo mode में दर्ज leads server में अपने-आप नहीं आएँगे।
- OTP LAN mode में server terminal पर दिखता है; यह SMS/email नहीं भेजता।

## चरण 4 — Admin-approved backup/restore
1. Admin LAN URL पर sign in करे और Backup / Export खोले।
2. Full JSON backup download करे और private external HDD/secure location पर save करे।
3. Restore केवल तभी करें जब Admin पुष्टि करे और target backup सही हो।
4. Server restore से पहले pre-restore snapshot बनाता है; restore के बाद active sessions invalidate होते हैं और users को फिर login करना होगा।
5. Backup file में customer data और password hashes होते हैं। इसे GitHub/public storage/chat में upload न करें।

**ध्यान दें:** Backup/restore मौजूदा server database का snapshot/restore है; यह दो स्वतंत्र databases का automatic merge नहीं है। यदि किसी दूसरे server से data लाना हो, पहले अलग backup और record comparison/conflict review की प्रक्रिया चाहिए। कोई automatic two-way merge अभी घोषित नहीं है।

## चरण 5 — Daily operation
- दिन भर office callers एक ही LAN server इस्तेमाल करें।
- तय समय पर Admin backup बनाकर external HDD पर सुरक्षित रखे।
- GitHub code ZIP backup अलग है; उसमें customer database upload नहीं होती।
- Internet बंद हो सकता है, पर office LAN और server PC चालू होने चाहिए।

## सुरक्षा/स्वीकृति जाँच
- [ ] Admin server पर login कर सके।
- [ ] Admin caller account बना, approve और disable कर सके।
- [ ] Pending/disabled caller login न कर सके।
- [ ] Caller केवल अपनी assigned leads देख/बदल सके।
- [ ] दूसरे client device से उसी LAN server account से login हो।
- [ ] Backup download और pre-restore snapshot verify हो।
- [ ] Windows Firewall private LAN तक सीमित हो।
- [ ] कोई database/password/backup public GitHub पर न जाए।

Automated smoke tests मौजूद हैं, लेकिन वास्तविक Windows PC, router, firewall और multiple-client end-to-end test अभी अलग से करना आवश्यक है। जब तक ये checks न हों, real customer data के लिए production-ready न मानें।
