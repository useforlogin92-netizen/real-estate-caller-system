# Offline PC + GitHub Backup Flow (Hindi)

यह setup केवल Real Estate Caller Desk के लिए है। OM Krishna Group, MetroCRM और Metro Properties को इससे न जोड़ें और उनका code/data न बदलें.

## क्या करेगा?

1. windows\RUN-OFFLINE-BACKUP.bat चलाने पर local server\data\database.json की timestamp वाली copy offline-backups में बनेगी।
2. Project source की ZIP backup भी offline-backups में बनेगी।
3. Internet उपलब्ध होने पर GitHub की main branch का ZIP github-packages में download होगा और SHA-256 hash लिखा जाएगा।
4. Internet न होने पर GitHub download fail हो सकता है, लेकिन local backup का प्रयास पहले किया जाता है।
5. Script downloaded code को live project पर अपने-आप overwrite नहीं करती, जिससे update से server/data टूटने का जोखिम कम रहता है।

## First setup

- Windows PC पर Node.js 20+ install करें और server को कम-से-कम एक बार setup करें।
- GitHub repo की ZIP download करके extract करें।
- Extracted project root से windows\RUN-OFFLINE-BACKUP.bat चलाएँ।
- Backup folders में पर्याप्त खाली जगह रखें। बेहतर सुरक्षा के लिए पूरा project/backup external HDD पर रखें।

## Offline काम

- LAN server पहले से setup और Node.js उपलब्ध होने पर internet के बिना भी चल सकता है।
- Server PC चालू होना चाहिए; दूसरे devices उसी local Wi-Fi/LAN पर जुड़े हों।
- server\START-LAN-SERVER.bat server शुरू करता है। Admin account न बना हो तो WINDOWS_LAN_SERVER.md के setup steps पूरा करें।
- GitHub Pages अकेले multi-device shared data server नहीं है। Shared leads के लिए local LAN server चालू होना चाहिए।

## Automatic recurring run

Windows Task Scheduler में task बनाएँ:
- Trigger: user logon पर या रोज़ अपनी पसंद के समय (उदाहरण: 7:00 PM)
- Action: powershell.exe
- Arguments: -NoProfile -ExecutionPolicy Bypass -File "FULL_PATH\windows\Backup-And-Download-Latest.ps1"
- Start in: project folder (वैकल्पिक)

Task Scheduler को पहले manually test करें। PC बंद हो या internet न हो तो GitHub ZIP download नहीं होगी; अगली run पर फिर प्रयास करें।

## महत्वपूर्ण सुरक्षा

- Public GitHub repository में database.json, customer leads, passwords, OTPs या backup ZIP upload न करें।
- यह script GitHub से code package download करती है; customer database GitHub पर upload नहीं करती।
- Local backups में ग्राहक डेटा हो सकता है; external HDD को सुरक्षित रखें और जरूरत हो तो device encryption इस्तेमाल करें।
- SHA-256 hash integrity check में मदद करता है; यह publisher signature का विकल्प नहीं है।
- Script downloaded ZIP को automatic install/update नहीं करती। पहले database backup लें, server बंद करें, package inspect/test करें और फिर update लागू करें।