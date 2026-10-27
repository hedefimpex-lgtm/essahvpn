const fs=require('node:fs');const crypto=require('node:crypto');
fs.copyFileSync('dist/EssahInstaller.exe','dist/setup.exe');
const hash=crypto.createHash('sha256').update(fs.readFileSync('dist/setup.exe')).digest('hex');
fs.writeFileSync('dist/setup.exe.sha256',hash+'  setup.exe\n');
console.log('Windows installer: dist/setup.exe; SHA256: '+hash);
