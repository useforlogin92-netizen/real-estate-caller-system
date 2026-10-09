> **स्थिति: इस project के चुने हुए LAN-only setup के लिए लागू नहीं।** अब requirement office LAN-only login और Admin-confirmed backup/restore है; इसलिए अभी cloud/Supabase project न बनाएँ। सही योजना के लिए [OFFICE_LAN_ARCHITECTURE_HI.md](./OFFICE_LAN_ARCHITECTURE_HI.md) देखें। यह दस्तावेज़ केवल भविष्य में office के बाहर online login की आवश्यकता होने पर संदर्भ के लिए रखा गया है।

# Online shared accounts — implementation gate (Hindi)

## मौजूदा समस्या
GitHub Pages केवल static frontend host करता है। `app.js` में `USERS_KEY='re_caller_users_v1'` के जरिए users browser के localStorage में save होते हैं। इसलिए हर browser/device की अलग user list होती है। GitHub Pages पर बनाए गए account का दूसरे computer पर दिखना संभव नहीं, जब तक app को central backend से connect न किया जाए।

## सुरक्षा के नियम
- इस public demo पर वास्तविक customer details या वास्तविक passwords न डालें।
- Demo passwords को production account के रूप में reuse न करें।
- Frontend में service-role key, database password या कोई server secret न डालें।
- Caller lead isolation backend/database policies में enforce होना चाहिए; UI filtering पर्याप्त नहीं है।
- Passwords को sync/export/backup JSON में plaintext रूप में कभी न रखें।
- Online और LAN server की databases अलग हैं; अभी automatic two-way synchronization implemented नहीं है।

## प्रस्तावित architecture
1. एक अलग, dedicated online backend/database provision करें — OM Krishna Group, MetroCRM या Metro Properties का backend reuse नहीं करना है।
2. Server-managed authentication तथा profiles रखें: stable user UUID, username, display name, role, active/approval status.
3. Admin-only server function से caller create/disable/approve और password reset करें। Admin existing password न देख सके।
4. Leads का owner stable user UUID हो। Database policy हर request पर caller ownership verify करे।
5. LAN server पर सीमित offline cache रखें। Connectivity न होने पर UI स्पष्ट offline/pending state दिखाए।
6. Sync को explicit admin confirmation के बाद चलाएं: पहले backup/snapshot, फिर ID-based comparison, conflict report, user approval, और अंत में apply. Records को चुपचाप overwrite/delete न करें।
7. Online auth/cache और offline auth के बीच credential handling को security review के बिना enable न करें। Offline access केवल पहले से authorized, trusted device पर सीमित हो।

## अभी क्यों रुका है
Repository में LAN server और उसकी integration smoke test मौजूद हैं, लेकिन online backend project/credentials अभी configure नहीं हैं। Static GitHub Pages पर code-only बदलाव से cross-device accounts सुरक्षित रूप से साझा नहीं हो सकते। इस वजह से सिर्फ frontend में login lookup बदलना सही fix नहीं होगा।

## Backend चालू करने से पहले आवश्यक पुष्टि
- Dedicated backend project/account की अनुमति और कोई संभावित paid usage.
- Backend provider/project बन जाने के बाद project URL और public client key. केवल public/anon key frontend config में आ सकती है; service-role/secret key कभी नहीं।
- Initial admin को सुरक्षित तरीके से provision करना और existing demo users को production users में अपने-आप migrate न करना।
- RLS/auth/sync acceptance tests पास होने तक production customer data न डालना।

## Acceptance checklist
- [ ] अलग browser/device पर वही approved account online login कर सके।
- [ ] Disabled/pending/rejected users online और LAN पर policy के अनुसार block हों।
- [ ] Caller दूसरे caller की leads API request से भी न पढ़/बदल सके।
- [ ] Password/reset tokens exports या logs में न हों।
- [ ] Admin-confirmed sync से पहले backup और conflict preview बने।
- [ ] Network disconnect/reconnect और duplicate sync tests पास हों।
