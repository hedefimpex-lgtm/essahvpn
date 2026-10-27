const $=id=>document.getElementById(id);let connected=false;
const models={openai:'gpt-4.1-mini',anthropic:'claude-sonnet-4-20250514',gemini:'gemini-2.5-flash'};
function notice(t){$('notice').textContent=t;}
async function task(button,fn){button.disabled=true;try{await fn();}catch(e){notice(e.message.replace(/^Error invoking remote method '[^']+': Error: /,''));}finally{button.disabled=false;}}
async function refresh(){const s=await window.essah.status();connected=s.connected;$('state').textContent=s.connected?'Tünel servisi etkin':'Bağlı değilsiniz';$('detail').textContent=s.installed?s.message:'Resmi WireGuard Windows istemcisini kurun.';$('toggle').textContent=connected?'Bağlantıyı kes':'Bağlan';$('toggle').disabled=!s.installed;}
$('import').onclick=()=>task($('import'),async()=>{if(await window.essah.importProfile()){$('profile').textContent='Profil güvenli olarak kaydedildi.';notice('WireGuard profili hazır.');}});
$('download').onclick=()=>task($('download'),()=>window.essah.wireguardSite());
$('toggle').onclick=()=>task($('toggle'),async()=>{notice('Windows yönetici onayı bekleniyor…');await window.essah.vpn(!connected);await refresh();notice('VPN durumu güncellendi.');});
$('save').onclick=()=>task($('save'),async()=>{if(!$('key').value.trim())throw Error('API anahtarını girin.');await window.essah.saveKey($('provider').value,$('key').value.trim());$('key').value='';notice('API anahtarı şifrelenerek kaydedildi.');});
$('delete').onclick=()=>task($('delete'),async()=>{await window.essah.saveKey($('provider').value,'');$('key').value='';notice('Seçili sağlayıcının anahtarı silindi.');});
$('provider').onchange=()=>{$('model').value=models[$('provider').value];$('key').value='';};
$('send').onclick=()=>task($('send'),async()=>{notice('Yanıt bekleniyor…');$('answer').textContent=await window.essah.chat($('provider').value,$('model').value,$('prompt').value);notice('Yanıt alındı.');});
refresh().catch(e=>notice(e.message));setInterval(()=>refresh().catch(()=>{}),10000);

$('vps-save').onclick=()=>task($('vps-save'),async()=>{await window.essah.saveVps($('host').value.trim(),$('user').value.trim(),$('port').value);notice('VPS bilgileri kaydedildi.');});
$('ssh').onclick=()=>task($('ssh'),async()=>{await window.essah.ssh();notice('SSH terminali açıldı. İlk bağlantıda sunucu kimliğini doğrulayın.');});
window.essah.loadVps().then(s=>{if(s){$('host').value=s.host;$('user').value=s.user;$('port').value=s.port;}}).catch(e=>notice(e.message));

$('export-management').onclick=()=>task($('export-management'),async()=>{if(await window.essah.exportManagement())notice('VPS dosyaları dışa aktarıldı. KURULUM.md dosyasını izleyin.');});
$('management-save').onclick=()=>task($('management-save'),async()=>{await window.essah.managementSave($('management-url').value.trim(),$('management-token').value.trim());$('management-token').value='';notice('VPS yönetim anahtarı şifrelenerek kaydedildi.');});
$('management-check').onclick=()=>task($('management-check'),async()=>{await window.essah.managementCheck();notice('Essah VPS yönetim API bağlantısı doğrulandı.');});
