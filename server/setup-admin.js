'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const dataDir=path.resolve(process.env.DATA_DIR || path.join(__dirname,'data'));
const file=path.join(dataDir,'database.json');
const [usernameArg,passwordArg,emailArg='']=process.argv.slice(2);
if(!usernameArg||!passwordArg||passwordArg.length<12){
 console.error('Usage: npm run setup-admin -- <username> <password-at-least-12-chars> [email]');
 process.exit(1);
}
fs.mkdirSync(path.dirname(file),{recursive:true});
const db=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{users:[],leads:[],audit:[]};
if(db.users.some(u=>u.role==='admin')){console.error('An Admin already exists. Use the authenticated admin account to manage users.');process.exit(1)}
const salt=crypto.randomBytes(16).toString('hex');
const passwordHash=crypto.scryptSync(passwordArg,salt,64).toString('hex');
const user={id:crypto.randomUUID(),username:usernameArg.trim().toLowerCase(),email:emailArg.trim().toLowerCase(),mobile:'',name:'System Admin',role:'admin',active:true,approval:'approved',passwordSalt:salt,passwordHash,createdAt:new Date().toISOString()};
db.users.push(user);
db.audit.push({id:crypto.randomUUID(),at:new Date().toISOString(),actor:'setup-cli',action:'bootstrap_admin',target:user.id,details:{username:user.username}});
const tmp=file+'.tmp';fs.writeFileSync(tmp,JSON.stringify(db,null,2),{mode:0o600});fs.renameSync(tmp,file);
console.log('Admin created. Keep the password private; it is not stored as plaintext.');
