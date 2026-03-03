# Déployer ZapPay sur un VPS — Guide complet

> Temps estimé : 1 à 2 heures pour un premier déploiement.

---

## Table des matières

1. [Prérequis](#1-prérequis)
2. [Provisionner le VPS](#2-provisionner-le-vps)
3. [Installer les dépendances système](#3-installer-les-dépendances-système)
4. [Cloner le projet](#4-cloner-le-projet)
5. [Configurer PostgreSQL](#5-configurer-postgresql)
6. [Configurer les variables d'environnement](#6-configurer-les-variables-denvironnement)
7. [Builder le frontend](#7-builder-le-frontend)
8. [Lancer l'API](#8-lancer-lapi)
9. [Configurer Nginx (reverse proxy)](#9-configurer-nginx-reverse-proxy)
10. [SSL avec Let's Encrypt](#10-ssl-avec-lets-encrypt)
11. [Process manager avec PM2](#11-process-manager-avec-pm2)
12. [Déploiement Docker (alternative)](#12-déploiement-docker-alternative)
13. [Mises à jour & maintenance](#13-mises-à-jour--maintenance)
14. [Checklist finale](#14-checklist-finale)
15. [Dépannage](#15-dépannage)

---

## 1. Prérequis

| Élément | Minimum | Recommandé |
|---------|---------|------------|
| CPU | 1 vCPU | 2 vCPU |
| RAM | 1 Go | 2 Go |
| Disque | 10 Go SSD | 20 Go SSD |
| OS | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |
| Domaine | 1 domaine ou sous-domaine | 2 (app + api) |

**Fournisseurs VPS économiques :** Hetzner (~€4/mois), OVH (~€3.50/mois), DigitalOcean ($6/mois), Contabo (~€5/mois).

**Avant de commencer :**
- Un nom de domaine pointant vers l'IP du VPS (enregistrement DNS A)
- Un compte chez un RPC provider (Alchemy, Infura ou QuickNode) pour la production
- Accès SSH au VPS (`ssh root@VOTRE_IP`)

---

## 2. Provisionner le VPS

Après achat du VPS, connectez-vous en SSH :

```bash
ssh root@VOTRE_IP
```

### Créer un utilisateur non-root

```bash
adduser zappay
usermod -aG sudo zappay
```

### Configurer l'authentification SSH par clé (recommandé)

```bash
# Sur votre machine locale
ssh-copy-id zappay@VOTRE_IP
```

### Configurer le pare-feu

```bash
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw enable
```

Ensuite, reconnectez-vous avec l'utilisateur `zappay` :

```bash
ssh zappay@VOTRE_IP
```

---

## 3. Installer les dépendances système

### Node.js 22 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Vérifier :

```bash
node -v   # v22.x.x
npm -v    # 10.x.x
```

### PostgreSQL 16

```bash
sudo apt install -y postgresql postgresql-contrib
```

### Nginx

```bash
sudo apt install -y nginx
```

### PM2 (process manager)

```bash
sudo npm install -g pm2
```

### Git

```bash
sudo apt install -y git
```

---

## 4. Cloner le projet

```bash
cd /home/zappay
git clone https://github.com/VOTRE_USERNAME/ZapPay.git
cd ZapPay
```

Installer les dépendances :

```bash
# Frontend (racine du projet)
npm install

# API
cd api
npm install
cd ..
```

---

## 5. Configurer PostgreSQL

### Créer la base de données et l'utilisateur

```bash
sudo -u postgres psql
```

```sql
CREATE USER zappay WITH PASSWORD 'VOTRE_MOT_DE_PASSE_FORT';
CREATE DATABASE zappay_prod OWNER zappay;
GRANT ALL PRIVILEGES ON DATABASE zappay_prod TO zappay;
\q
```

### Exécuter les migrations Prisma

```bash
cd /home/zappay/ZapPay/api

DATABASE_URL="postgresql://zappay:VOTRE_MOT_DE_PASSE_FORT@localhost:5432/zappay_prod" \
  npx prisma migrate deploy

DATABASE_URL="postgresql://zappay:VOTRE_MOT_DE_PASSE_FORT@localhost:5432/zappay_prod" \
  npx prisma generate
```

> `migrate deploy` applique toutes les migrations existantes sans en créer de nouvelles (safe pour la production).

---

## 6. Configurer les variables d'environnement

### API (`api/.env`)

```bash
cp api/.env.example api/.env
nano api/.env
```

Contenu à adapter :

```env
# API
PORT=4010

# Base de données
DATABASE_URL="postgresql://zappay:VOTRE_MOT_DE_PASSE_FORT@localhost:5432/zappay_prod"

# URL du frontend (votre domaine)
FRONTEND_URL=https://zappay.votredomaine.com

# RPCs blockchain — UTILISEZ DES CLÉS PAYANTES EN PRODUCTION
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/VOTRE_CLE_ALCHEMY
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/VOTRE_CLE_ALCHEMY

# Adresse treasury ZapPay
ZAPPAY_TREASURY_ADDRESS=0xVOTRE_ADRESSE_TREASURY

# Expiration des paiements
PAYMENT_TTL_MINUTES=30
CONFIRMATION_COUNT_ETHEREUM=2
CONFIRMATION_COUNT_BASE=1
```

### Frontend (`.env` à la racine)

```bash
nano .env
```

```env
VITE_API_URL=https://api.zappay.votredomaine.com
VITE_ZAPPAY_TREASURY_ADDRESS=0xVOTRE_ADRESSE_TREASURY
VITE_WALLETCONNECT_PROJECT_ID=VOTRE_WALLETCONNECT_PROJECT_ID
```

> **Important :** Les variables `VITE_*` sont embarquées dans le build statique. Il faut rebuilder le frontend à chaque changement.

---

## 7. Builder le frontend

```bash
cd /home/zappay/ZapPay
npm run build
```

Cela génère un dossier `dist/` contenant le site statique (HTML/JS/CSS). Nginx servira directement ce dossier.

---

## 8. Lancer l'API

Test rapide :

```bash
cd /home/zappay/ZapPay/api
node index.js
# => API listening on 4010
```

Vérifier :

```bash
curl http://localhost:4010/health
# => {"status":"ok"}
```

`Ctrl+C` pour arrêter — on utilisera PM2 à l'étape 11.

---

## 9. Configurer Nginx (reverse proxy)

### Option A : Un seul domaine (frontend + API)

```bash
sudo nano /etc/nginx/sites-available/zappay
```

```nginx
# Redirection HTTP → HTTPS (sera activé après Certbot)
server {
    listen 80;
    server_name zappay.votredomaine.com;

    # Frontend (fichiers statiques Vite)
    root /home/zappay/ZapPay/dist;
    index index.html;

    # API reverse proxy
    location /pay/ {
        proxy_pass http://127.0.0.1:4010;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /payments/ {
        proxy_pass http://127.0.0.1:4010;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SSE (Server-Sent Events) — désactiver le buffering
    location ~* /stream$ {
        proxy_pass http://127.0.0.1:4010;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding off;
        proxy_read_timeout 86400s;
    }

    location /health {
        proxy_pass http://127.0.0.1:4010;
    }

    location /docs {
        proxy_pass http://127.0.0.1:4010;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # SPA fallback — toutes les autres routes → index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache des assets statiques
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### Option B : Deux sous-domaines séparés

Si vous préférez `app.zappay.com` + `api.zappay.com` :

**Frontend** (`/etc/nginx/sites-available/zappay-app`) :

```nginx
server {
    listen 80;
    server_name app.zappay.votredomaine.com;

    root /home/zappay/ZapPay/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

**API** (`/etc/nginx/sites-available/zappay-api`) :

```nginx
server {
    listen 80;
    server_name api.zappay.votredomaine.com;

    location / {
        proxy_pass http://127.0.0.1:4010;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SSE
    location ~* /stream$ {
        proxy_pass http://127.0.0.1:4010;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding off;
        proxy_read_timeout 86400s;
    }
}
```

### Activer le(s) site(s)

```bash
# Option A
sudo ln -s /etc/nginx/sites-available/zappay /etc/nginx/sites-enabled/

# Option B
sudo ln -s /etc/nginx/sites-available/zappay-app /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/zappay-api /etc/nginx/sites-enabled/

# Supprimer le site par défaut
sudo rm /etc/nginx/sites-enabled/default

# Tester la config
sudo nginx -t

# Recharger
sudo systemctl reload nginx
```

---

## 10. SSL avec Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Option A (un domaine)

```bash
sudo certbot --nginx -d zappay.votredomaine.com
```

### Option B (deux domaines)

```bash
sudo certbot --nginx -d app.zappay.votredomaine.com -d api.zappay.votredomaine.com
```

Certbot modifie automatiquement la config Nginx pour ajouter le SSL et la redirection HTTP → HTTPS.

### Renouvellement automatique

```bash
# Tester le renouvellement
sudo certbot renew --dry-run
```

Le renouvellement est automatique via un timer systemd. Rien d'autre à faire.

---

## 11. Process manager avec PM2

PM2 maintient l'API en vie et la relance au reboot.

### Démarrer l'API

```bash
cd /home/zappay/ZapPay/api
pm2 start index.js --name zappay-api --env production
```

### Commandes utiles

```bash
pm2 status              # Voir les processus
pm2 logs zappay-api     # Voir les logs en temps réel
pm2 restart zappay-api  # Redémarrer
pm2 stop zappay-api     # Arrêter
pm2 monit               # Dashboard monitoring
```

### Démarrage automatique au boot

```bash
pm2 startup
# Copier-coller la commande affichée, puis :
pm2 save
```

---

## 12. Déploiement Docker (alternative)

Si vous préférez Docker à l'installation manuelle :

### Créer `api/Dockerfile`

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

EXPOSE 4010

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:4010/health || exit 1

CMD ["node", "index.js"]
```

### Créer `Dockerfile` (frontend — build multi-stage)

```dockerfile
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### Créer `nginx.conf` (pour le container frontend)

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### Créer `docker-compose.prod.yml`

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: zappay_prod
      POSTGRES_USER: zappay
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5432:5432"

  api:
    build: ./api
    restart: unless-stopped
    depends_on:
      - postgres
    env_file: ./api/.env
    environment:
      DATABASE_URL: postgresql://zappay:${DB_PASSWORD}@postgres:5432/zappay_prod
    ports:
      - "127.0.0.1:4010:4010"

  web:
    build: .
    restart: unless-stopped
    ports:
      - "127.0.0.1:3080:80"

volumes:
  pgdata:
```

### Lancer

```bash
# Créer un fichier .env pour le mot de passe DB
echo "DB_PASSWORD=VOTRE_MOT_DE_PASSE_FORT" > .env.prod

# Lancer les migrations
docker compose -f docker-compose.prod.yml run --rm api \
  npx prisma migrate deploy

# Démarrer tous les services
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

Avec Docker, Nginx sur le VPS fait reverse proxy vers les ports `4010` (API) et `3080` (frontend).

---

## 13. Mises à jour & maintenance

### Script de déploiement rapide

Créer `deploy.sh` à la racine du projet sur le VPS :

```bash
#!/bin/bash
set -e

echo "=== Pulling latest code ==="
cd /home/zappay/ZapPay
git pull origin main

echo "=== Installing dependencies ==="
npm install
cd api && npm install && cd ..

echo "=== Running database migrations ==="
cd api
npx prisma migrate deploy
npx prisma generate
cd ..

echo "=== Building frontend ==="
npm run build

echo "=== Restarting API ==="
pm2 restart zappay-api

echo "=== Done! ==="
pm2 status
```

```bash
chmod +x deploy.sh
./deploy.sh
```

### Sauvegardes PostgreSQL

```bash
# Backup manuel
pg_dump -U zappay zappay_prod > backup_$(date +%Y%m%d).sql

# Cron automatique (tous les jours à 3h)
crontab -e
```

```cron
0 3 * * * pg_dump -U zappay zappay_prod > /home/zappay/backups/backup_$(date +\%Y\%m\%d).sql 2>&1
```

### Monitoring

```bash
# Logs API
pm2 logs zappay-api

# Logs Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Espace disque
df -h

# Mémoire
free -h
```

---

## 14. Checklist finale

- [ ] VPS provisionné avec utilisateur non-root
- [ ] Pare-feu configuré (ports 22, 80, 443 uniquement)
- [ ] Node.js 22 installé
- [ ] PostgreSQL installé et base créée
- [ ] Projet cloné et dépendances installées
- [ ] Migrations Prisma exécutées
- [ ] Variables d'environnement configurées (API + frontend)
- [ ] Frontend buildé (`dist/` généré)
- [ ] Nginx configuré et actif
- [ ] SSL Let's Encrypt installé
- [ ] API lancée avec PM2
- [ ] PM2 startup configuré (survit au reboot)
- [ ] `https://zappay.votredomaine.com` accessible
- [ ] `https://zappay.votredomaine.com/health` retourne `{"status":"ok"}`
- [ ] `https://zappay.votredomaine.com/docs` affiche Swagger
- [ ] RPCs blockchain configurés avec des clés de production
- [ ] Backup PostgreSQL automatisé
- [ ] Script `deploy.sh` prêt pour les MAJ futures

---

## 15. Dépannage

### L'API ne démarre pas

```bash
# Vérifier les logs
pm2 logs zappay-api --lines 50

# Vérifier la connexion DB
cd /home/zappay/ZapPay/api
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL)"
```

### 502 Bad Gateway (Nginx)

```bash
# L'API tourne ?
pm2 status

# Le port est bien 4010 ?
curl http://localhost:4010/health

# Vérifier la config Nginx
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### Les paiements SSE ne fonctionnent pas

Vérifiez que la config Nginx pour les routes SSE inclut bien :

```nginx
proxy_buffering off;
proxy_cache off;
chunked_transfer_encoding off;
```

### Erreur Prisma "Can't reach database server"

```bash
# PostgreSQL tourne ?
sudo systemctl status postgresql

# Le mot de passe est correct ?
psql -U zappay -d zappay_prod -h localhost
```

### Le frontend affiche une page blanche

```bash
# Le build a réussi ?
ls -la /home/zappay/ZapPay/dist/

# La config Nginx pointe vers le bon dossier ?
# Vérifier le `root` dans /etc/nginx/sites-available/zappay

# Les variables VITE_ sont correctes ?
# Rebuilder après changement de .env
npm run build
```

### Certificat SSL expiré

```bash
sudo certbot renew
sudo systemctl reload nginx
```

---

## Architecture déployée

```
Internet
    │
    ▼
┌─────────┐
│  Nginx  │  :443 (HTTPS)
│         │  :80  (→ redirige vers 443)
└────┬────┘
     │
     ├── /pay/* /payments/* /health /docs
     │   └──► API Express (:4010, PM2)
     │            │
     │            ├──► PostgreSQL (:5432)
     │            └──► Blockchain RPCs (Alchemy/Infura)
     │
     └── /* (fichiers statiques)
         └──► dist/ (Vite build)
```
