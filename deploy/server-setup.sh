#!/usr/bin/env bash
# One-time base setup for a fresh Ubuntu server (run as root).
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

timedatectl set-timezone Europe/Moscow

apt-get update -q
apt-get -y -q -o Dpkg::Options::=--force-confold upgrade
apt-get -y -q install ca-certificates curl git ufw fail2ban unattended-upgrades

if ! command -v docker >/dev/null 2>&1; then
  if ! curl -fsSL https://get.docker.com | sh; then
    apt-get -y -q install docker.io docker-compose-v2
  fi
fi
systemctl enable --now docker
docker compose version

if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi
sysctl -w vm.swappiness=10
echo 'vm.swappiness=10' > /etc/sysctl.d/99-swappiness.conf

cat > /etc/ssh/sshd_config.d/99-hardening.conf <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
EOF
systemctl reload ssh || systemctl reload sshd

ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

systemctl enable --now fail2ban
dpkg-reconfigure -f noninteractive unattended-upgrades

echo "SETUP OK"
