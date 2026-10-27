# VPS yönetim bağlantısı

Bu bileşen VPN sunucusu kurmaz. Contabo Linux VPS üzerinde Node.js 22+ ve SSH erişimi gerekir. Sunucuya bu dosyaları kendi SSH/SCP bağlantınızla aktarın. Program VPS parolanızı saklamaz.

1. VPS üzerinde ayrı, yetkileri sınırlı bir kullanıcıyla çalışın. Yönetim anahtarını `openssl rand -hex 32` ile üretin, parola yöneticisine kaydedin. Anahtarı komut geçmişine veya Git'e yazmayın.
2. Terminalde anahtarı görünmeden okuyup sunucuyu başlatın:

```sh
read -rs -p 'Yönetim anahtarı: ' ESSAH_MANAGEMENT_TOKEN
export ESSAH_MANAGEMENT_TOKEN
node server.js
```

Bu süreç terminal kapandığında durur. Kalıcı kullanım için kendi servis yöneticinizle aynı ortam değişkenini güvenli biçimde sağlayın. Varsayılan dinleme adresi yalnızca 127.0.0.1:8787'dir. Portu internete açmayın.

3. Windows'ta ayrı terminalde, kendi adres ve kullanıcı bilgilerinizle SSH tüneli açın:

```powershell
ssh -N -L 8787:127.0.0.1:8787 KULLANICI@SUNUCU
```

4. Essah VPN'de Yönetim API adresini `http://127.0.0.1:8787/mcp` olarak bırakın, aynı yönetim anahtarını kaydedin ve bağlantıyı sınayın.

## AI araçları

`client.js`, özel stdio MCP komutu destekleyen masaüstü araçları için köprüdür. Yerel Node.js 22+ gerekir. Aracınızın MCP ayarlarında komut `node`, argüman `client.js` dosyasının tam yolu olmalıdır. O sürece `ESSAH_MANAGEMENT_URL=http://127.0.0.1:8787/mcp` ve `ESSAH_MANAGEMENT_TOKEN` değişkenlerini güvenli yöntemle sağlayın. Her aracın MCP yapılandırma biçimi farklıdır; kendi belgelerini izleyin. Claude Desktop ve OpenCode gibi özel MCP destekleyen istemcilerde bu köprü kullanılabilir; bu istemcilerle uçtan uca doğrulama yapılmadı.

ChatGPT veya Gemini'nin tarayıcı arayüzleri keyfi yerel SSH/stdio bağlantısı açamaz. Kullandığınız ürünün uzak MCP/connector desteği gerekir; hesap veya plan kısıtları olabilir. İnternet üzerinden erişimde geçerli HTTPS ve ürünün istediği kimlik doğrulama (örneğin OAuth) ayrıca kurulmalıdır. Bu sürüm OAuth sunucusu içermez ve bu tarayıcı bağlantılarını hazır sağlamaz. API sağlayıcı anahtarları VPS yönetim anahtarıyla aynı değildir.

## Yetkiler

Varsayılan araçlar yalnızca sunucu durumu ve çalışan servisleri listeler. Rastgele kabuk komutu çalıştırma veya dosya düzenleme aracı yoktur. Servis yeniden başlatma yalnızca sunucuda `ESSAH_ALLOWED_SERVICES=nginx.service` gibi açık liste verilince görünür. Kullanıcının ayrıca sadece ilgili servis için sınırlı sudo yetkisi olmalıdır. Genel sudo/root izni vermeyin. Araçları kullanan AI istemcisinde yazma işlemleri için kullanıcı onayını etkin tutun.
