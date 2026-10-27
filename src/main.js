const {app,BrowserWindow,ipcMain,dialog,safeStorage,shell}=require('electron');
const fs=require('node:fs/promises');
const path=require('node:path');
const {execFile}=require('node:child_process');
const {promisify}=require('node:util');
const exec=promisify(execFile);
const core=require('./core');
let win;
const dir=()=>app.getPath('userData');
const wg=()=>path.join(process.env.ProgramFiles||'C:\\Program Files','WireGuard','wireguard.exe');
const tunnel=()=>path.join(dir(),'essah.conf');
async function keys(){try{return JSON.parse(safeStorage.decryptString(await fs.readFile(path.join(dir(),'keys.bin'))));}catch(e){if(e.code==='ENOENT')return {};throw Error('Kaydedilmiş anahtarlar çözülemedi.');}}
async function status(){
 if(process.platform!=='win32')return {installed:false,connected:false,message:'VPN bağlantısı Windows gerektirir.'};
 const installed=await fs.access(wg()).then(()=>true,()=>false);
 const r=await exec('powershell.exe',['-NoProfile','-NonInteractive','-Command',"$s=Get-Service -Name 'WireGuardTunnel$essah' -ErrorAction SilentlyContinue; if($s){$s.Status.ToString()}else{'Stopped'}"],{windowsHide:true});
 return {installed,connected:r.stdout.trim()==='Running',message:r.stdout.trim()==='Running'?'Tünel servisi çalışıyor':'Bağlı değil'};
}
ipcMain.handle('status',status);
ipcMain.handle('import',async()=>{
 const result=await dialog.showOpenDialog(win,{title:'WireGuard profili seçin',properties:['openFile'],filters:[{name:'WireGuard',extensions:['conf']}]});
 if(result.canceled)return false;
 const text=await fs.readFile(result.filePaths[0],'utf8');
 if(text.length>65536||!/^\s*\[Interface\]/m.test(text)||!/^\s*\[Peer\]/m.test(text)||!/^\s*PrivateKey\s*=/m.test(text))throw Error('Geçerli bir WireGuard profili seçin.');
 if(/^\s*(PreUp|PostUp|PreDown|PostDown)\s*=/im.test(text))throw Error('Komut içeren profiller güvenlik nedeniyle kabul edilmiyor.');
 // Encrypt the private profile at rest using Windows DPAPI.
 if(!safeStorage.isEncryptionAvailable())throw Error('Windows güvenli depolaması kullanılamıyor.');
 await fs.writeFile(path.join(dir(),'profile.bin'),safeStorage.encryptString(text),{mode:0o600});return true;
});
ipcMain.handle('vpn',async(_,connect)=>{
 if(process.platform!=='win32')throw Error('Windows gerekli.');
 if(!(await status()).installed)throw Error('Önce resmi WireGuard Windows istemcisini kurun.');
 if(connect){
 const profile=safeStorage.decryptString(await fs.readFile(path.join(dir(),'profile.bin')).catch(()=>{throw Error('Önce profil içe aktarın.');}));
 await fs.writeFile(tunnel(),profile,{mode:0o600});
 }
 // Only fixed executable and profile paths enter the elevated command.
 const psQuote=s=>"'"+s.replaceAll("'","''")+"'";
 const args=connect?'/installtunnelservice "'+tunnel()+'"':'/uninstalltunnelservice essah';
 try{await exec('powershell.exe',['-NoProfile','-NonInteractive','-Command',`$p=Start-Process -FilePath ${psQuote(wg())} -ArgumentList ${psQuote(args)} -Verb RunAs -Wait -PassThru; exit $p.ExitCode`],{windowsHide:true,timeout:120000});}
 catch{throw Error('VPN işlemi tamamlanamadı. Windows yönetici iznini ve profili kontrol edin.');}
 finally{if(connect)await fs.rm(tunnel(),{force:true});}
 return status();
});
ipcMain.handle('key',async(_,provider,key)=>{
 if(!core.providers[provider])throw Error('Geçersiz sağlayıcı.');
 if(!safeStorage.isEncryptionAvailable())throw Error('Güvenli depolama kullanılamıyor.');
 const saved=await keys();if(key)saved[provider]=key;else delete saved[provider];
 await fs.writeFile(path.join(dir(),'keys.bin'),safeStorage.encryptString(JSON.stringify(saved)),{mode:0o600});return true;
});
ipcMain.handle('chat',async(_,provider,model,prompt)=>{
 if(typeof prompt!=='string'||prompt.length>32000)throw Error('Mesaj en fazla 32.000 karakter olmalı.');
 const saved=await keys();const r=core.request(provider,saved[provider],model,prompt);
 const response=await fetch(r.url,{method:'POST',redirect:'error',headers:r.headers,body:JSON.stringify(r.body),signal:AbortSignal.timeout(60000)});
 if(!response.ok)throw Error(`API isteği başarısız (${response.status}). Anahtar, model ve kotayı kontrol edin.`);
 return core.answer(provider,await response.json())||'Sağlayıcı metin yanıtı döndürmedi.';
});
ipcMain.handle('wireguard-site',()=>shell.openExternal('https://www.wireguard.com/install/'));
app.whenReady().then(()=>{win=new BrowserWindow({width:1060,height:800,minWidth:800,minHeight:650,title:'Essah VPN',webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:true}});win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',e=>e.preventDefault());win.loadFile(path.join(__dirname,'index.html'));});
app.on('window-all-closed',()=>app.quit());
ipcMain.handle('save-vps',async(_,host,user,port)=>{
 if(typeof host!=='string'||!/^[a-zA-Z0-9][a-zA-Z0-9.-]{0,252}$/.test(host))throw Error('Geçerli IPv4 adresi veya alan adı girin.');
 if(typeof user!=='string'||!/^[a-zA-Z_][a-zA-Z0-9_-]{0,31}$/.test(user))throw Error('Geçerli SSH kullanıcı adı girin.');
 port=Number(port);if(!Number.isInteger(port)||port<1||port>65535)throw Error('SSH portu geçersiz.');
 const settings={host,user,port};await fs.writeFile(path.join(dir(),'vps.json'),JSON.stringify(settings));return settings;
});
ipcMain.handle('load-vps',async()=>{try{return JSON.parse(await fs.readFile(path.join(dir(),'vps.json'),'utf8'));}catch{return null;}});
ipcMain.handle('ssh',async()=>{
 if(process.platform!=='win32')throw Error('SSH terminali Windows gerektirir.');
 const settings=JSON.parse(await fs.readFile(path.join(dir(),'vps.json'),'utf8').catch(()=>{throw Error('Önce VPS bilgilerini kaydedin.');}));
 if(!/^[a-zA-Z0-9][a-zA-Z0-9.-]{0,252}$/.test(settings.host)||!/^[a-zA-Z_][a-zA-Z0-9_-]{0,31}$/.test(settings.user)||!Number.isInteger(settings.port)||settings.port<1||settings.port>65535)throw Error('VPS ayarları geçersiz.');
 const target=settings.user+'@'+settings.host;
 await exec('powershell.exe',['-NoProfile','-NonInteractive','-Command',`Start-Process -FilePath 'ssh.exe' -ArgumentList '-p ${settings.port} ${target}'`],{windowsHide:true});return true;
});
ipcMain.handle('export-management',async()=>{
 const result=await dialog.showOpenDialog(win,{title:'VPS yönetim dosyaları için klasör seçin',properties:['openDirectory','createDirectory']});if(result.canceled)return false;
 const destination=path.join(result.filePaths[0],'Essah-VPS-'+Date.now());await fs.mkdir(destination);
 for(const name of ['server.js','client.js','KURULUM.md'])await fs.copyFile(path.join(__dirname,'..','management',name),path.join(destination,name));return true;
});
ipcMain.handle('management-save',async(_,url,token)=>{
 const u=new URL(url);if(u.username||u.password||u.search||u.hash)throw Error('API adresi kimlik bilgisi veya sorgu içeremez.');
 if(u.protocol!=='https:'&&!(u.protocol==='http:'&&['127.0.0.1','localhost'].includes(u.hostname)))throw Error('HTTPS veya yerel SSH tüneli kullanın.');
 if(typeof token!=='string'||token.length<32)throw Error('Yönetim anahtarı en az 32 karakter olmalı.');
 if(!safeStorage.isEncryptionAvailable())throw Error('Güvenli depolama kullanılamıyor.');
 await fs.writeFile(path.join(dir(),'management.bin'),safeStorage.encryptString(JSON.stringify({url:u.href,token})));return true;
});
ipcMain.handle('management-check',async()=>{
 const encrypted=await fs.readFile(path.join(dir(),'management.bin')).catch(()=>{throw Error('Önce yönetim adresini ve anahtarını kaydedin.');});
 const config=JSON.parse(safeStorage.decryptString(encrypted));
 const r=await fetch(config.url,{method:'POST',redirect:'error',headers:{Authorization:'Bearer '+config.token,'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-03-26',capabilities:{},clientInfo:{name:'essah-vpn',version:'0.1.0'}}}),signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw Error('Yönetim API bağlantısı başarısız: HTTP '+r.status);
 const data=await r.json();if(data.result?.serverInfo?.name!=='essah-vps')throw Error('Beklenen Essah yönetim sunucusu yanıt vermedi.');return true;
});
