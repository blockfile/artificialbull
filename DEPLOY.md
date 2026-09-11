# Deploying artificialbull-api to Ubuntu 24.04

Site: **https://artificialbull.example** · API: **https://api.artificialbull.example**

> **No domain yet.** `artificialbull.example` is a placeholder — `.example` can
> never resolve, so nothing below can half-work against the wrong host. Once the
> domain is bought, substitute it everywhere in this file before you start (and
> in `.env`'s `CORS_ORIGINS`), e.g. `sed 's/artificialbull.example/yourdomain.com/g' DEPLOY.md`.

**One** PM2 process out of `/var/www/artificialbull`:

| Process | Port | Reachable from |
| --- | --- | --- |
| `artificialbull-api` (`server.js`) | 3000 | the internet, via nginx → `api.artificialbull.example` |

That is the whole deployment. There is no bot, no MongoDB, no wallet key and no
on-chain contract to deploy, because **this project distributes nothing**. Pons's
own per-token fee distributor pays holders directly; everything here reads what
already happened, from three public upstreams (Pons, Blockscout, DexScreener),
none of which needs an API key. If a step below looks like it is missing
something compared with the distributing forks (artificialneko, ashiba,
artidoge), that is the point — nothing here can move money.

Everything runs as **root**. One account, one pm2 daemon: pm2 keeps a separate
daemon per user, and mixing accounts is what leaves `pm2 list` empty while the
API is actually running.

**Before you start:** point a DNS `A` record for `api.artificialbull.example` at the
server's public IP and let it propagate (`dig +short api.artificialbull.example`).
Certbot cannot issue a certificate until it resolves.

## 1. Base prep

```bash
apt update && apt upgrade -y
apt install -y curl git ufw ca-certificates gnupg
timedatectl set-timezone UTC
```

## 2. Firewall

Only SSH and web. The app port is never exposed.

Allow the ports by NUMBER, not by the `'Nginx Full'` profile: that profile does
not exist until nginx is installed in step 6, so the rule fails silently here
and leaves ufw enabled with SSH as the only way in. Certbot then cannot be
reached for its challenge and fails with `Timeout during connect (likely
firewall problem)` — having correctly resolved the domain.

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
ufw status
```

On a cloud provider with its own firewall (DigitalOcean, AWS, Hetzner), open
80 and 443 there too. It sits in front of ufw, so traffic is dropped before the
server ever sees it and every check on the box still looks correct.

## 3. Node.js 22 LTS + npm

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
node -v && npm -v          # v22.x, 10.x
npm install -g pm2
pm2 -v
```

## 4. Clone into /var/www

```bash
mkdir -p /var/www
cd /var/www
git clone https://github.com/blockfile/artificialbull.git artificialbull
cd artificialbull
npm ci --omit=dev
```

`npm ci` needs `package-lock.json`, which is committed. Use `npm install` only
if the lock file is ever out of date.

## 5. Configure

```bash
cp .env.example .env
chmod 600 .env
nano .env
```

The only lines that must change from the committed example:

```ini
# The CA, once the token exists. Blank is a VALID state before launch: every
# stat answers null (the site draws "—") and the payout feed is empty. Nothing
# errors — do not invent a placeholder address to make the tiles fill in.
TOKEN_ADDRESS=

# Already correct — NVDA, verified on chain. Leave these alone unless the
# token turns out to be paired with a different stock (the pons page says).
REWARD_TOKEN_ADDRESS=0xd0601ce157db5bdc3162bbac2a2c8af5320d9eec
REWARD_SYMBOL=NVDA

# Must contain the site's origin EXACTLY, scheme included, or the browser gets
# a 403 and the site falls back to placeholder numbers against a working API.
CORS_ORIGINS=https://artificialbull.example,https://www.artificialbull.example
```

Then check it before starting anything. This calls every upstream once and
prints exactly what `/stats` and `/rewards` would answer — the fastest way to
tell a config mistake apart from a token that simply is not listed yet:

```bash
npm run check
```

## 6. PM2

```bash
cd /var/www/artificialbull
pm2 start server.js --name artificialbull-api --time
pm2 save
pm2 startup systemd -u root --hp /root      # then run the line it prints
pm2 list
pm2 logs artificialbull-api --lines 30
```

## 7. nginx

```bash
apt install -y nginx

tee /etc/nginx/sites-available/api.artificialbull.example > /dev/null <<'NGINX'
server {
    listen 80;
    listen [::]:80;
    server_name api.artificialbull.example;

    access_log /var/log/nginx/artificialbull.access.log;
    error_log  /var/log/nginx/artificialbull.error.log;

    client_max_body_size 1m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 30s;
    }
}
NGINX

ln -s /etc/nginx/sites-available/api.artificialbull.example /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
curl http://api.artificialbull.example/health
```

## 8. Certbot / HTTPS

The site is HTTPS, so the API must be — a browser on `https://artificialbull.example`
refuses to fetch `http://api.artificialbull.example` as mixed content.

```bash
snap install core && snap refresh core
snap install --classic certbot
ln -sf /snap/bin/certbot /usr/bin/certbot

certbot --nginx -d api.artificialbull.example --redirect \
  -m you@example.com --agree-tos --no-eff-email

certbot renew --dry-run
systemctl list-timers | grep certbot
```

## 9. Verify

```bash
curl https://api.artificialbull.example/health
curl https://api.artificialbull.example/token
curl https://api.artificialbull.example/stats
curl "https://api.artificialbull.example/rewards?limit=5"

# CORS — must echo the site's origin back
curl -s -H "Origin: https://artificialbull.example" -D- -o /dev/null \
  https://api.artificialbull.example/stats | grep -i access-control-allow-origin
```

A 403 on the CORS check means the origin is missing from `CORS_ORIGINS` — the
usual reason the site shows placeholder data against a working API.

Before launch, `/stats` answering `null` for every field and `/rewards`
answering an empty `transactions` array is **correct**, not a failure. Both are
also what a wrong `TOKEN_ADDRESS` looks like, so confirm with `npm run check`
rather than by staring at the JSON.

Then point the site at it (`VITE_API_BASE_URL=https://api.artificialbull.example`,
`VITE_USE_MOCK=false`) and redeploy the frontend.

## At launch

Once the token is created on Pons:

```bash
cd /var/www/artificialbull
nano .env                # set TOKEN_ADDRESS
npm run check            # distributor found? curve price sane? feed rows real?
pm2 restart artificialbull-api
curl https://api.artificialbull.example/stats
```

`npm run check` prints the distributor address Pons resolved for the token. If
it says *no distributor found for this token yet*, holder fee-sharing was not
switched on at creation — the rewards tile and the payout feed will stay empty
for the life of the token, and no setting in this repo can change that. That is
a launchpad choice, not a deployment problem.

## Redeploying

```bash
cd /var/www/artificialbull
git pull
npm ci --omit=dev
pm2 restart artificialbull-api
pm2 logs artificialbull-api --lines 30
curl https://api.artificialbull.example/health
```
