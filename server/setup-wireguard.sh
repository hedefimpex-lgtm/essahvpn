#!/usr/bin/env bash
# Ubuntu 24.04: a single Windows peer, IPv4 routing, existing UFW preserved.
set -euo pipefail
umask 077
export LC_ALL=C
[[ $EUID -eq 0 ]] || { echo 'Bu komutu VPS uzerinde root olarak calistirin.'; exit 1; }
for tool in wg wg-quick ip iptables ufw systemctl sysctl python3; do
  command -v "$tool" >/dev/null || { echo "Eksik arac: $tool"; exit 1; }
done
for file in /etc/wireguard/essah0.conf /root/essah-windows.conf /etc/sysctl.d/99-essah-vpn.conf; do
  [[ ! -e "$file" ]] || { echo "Mevcut dosya korunuyor: $file. Kurulum durduruldu."; exit 1; }
done
ip link show eth0 >/dev/null
if [[ -n $(ss -H -lun 'sport = :51820') ]]; then
  echo '51820/UDP kullanimda. Kurulum durduruldu.'; exit 1
fi
python3 - <<'PY'
import ipaddress, json, subprocess
candidate=ipaddress.ip_network('10.77.0.0/24')
for route in json.loads(subprocess.check_output(['ip','-j','-4','route','show','table','all'])):
    dst=route.get('dst','default')
    if dst=='default': continue
    if candidate.overlaps(ipaddress.ip_network(dst,strict=False)):
        raise SystemExit('10.77.0.0/24 mevcut bir rota ile cakisiyor; kurulum durduruldu.')
PY
ufw status | head -n 1 | grep -q 'Status: active' || { echo 'Beklenen etkin UFW bulunamadi; kurulum durduruldu.'; exit 1; }
install -d -m 700 /etc/wireguard
server_private=$(wg genkey)
server_public=$(printf '%s' "$server_private" | wg pubkey)
client_private=$(wg genkey)
client_public=$(printf '%s' "$client_private" | wg pubkey)
cat > /etc/wireguard/essah0.conf <<CONFIG
[Interface]
Address = 10.77.0.1/24
ListenPort = 51820
PrivateKey = $server_private
PostUp = iptables -t nat -A POSTROUTING -s 10.77.0.0/24 -o eth0 -j MASQUERADE
PostDown = iptables -t nat -D POSTROUTING -s 10.77.0.0/24 -o eth0 -j MASQUERADE

[Peer]
PublicKey = $client_public
AllowedIPs = 10.77.0.2/32
CONFIG
cat > /root/essah-windows.conf <<CONFIG
[Interface]
PrivateKey = $client_private
Address = 10.77.0.2/32
DNS = 1.1.1.1

[Peer]
PublicKey = $server_public
Endpoint = 207.180.197.215:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
CONFIG
unset server_private client_private
chmod 600 /etc/wireguard/essah0.conf /root/essah-windows.conf
printf 'net.ipv4.ip_forward=1\n' > /etc/sysctl.d/99-essah-vpn.conf
sysctl -p /etc/sysctl.d/99-essah-vpn.conf
ufw allow 51820/udp comment 'Essah VPN'
ufw route allow in on essah0 out on eth0 from 10.77.0.0/24
systemctl start wg-quick@essah0
systemctl enable wg-quick@essah0
wg show essah0
printf '\nWireGuard arayuzu baslatildi. Windows profili: /root/essah-windows.conf\n'
printf 'Profil ozel anahtar icerir; icerigini sohbette paylasmayin.\n'
printf 'Bu profil IPv4 trafigini yonlendirir. Gercek baglanti henuz dogrulanmadi.\n'
