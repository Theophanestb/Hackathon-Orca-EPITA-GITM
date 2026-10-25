# Deploying Lab Report Analyzer

Target: Ubuntu server, Docker, behind a Cloudflare Tunnel, served at **https://labanalyzer.stabat.fr**.

```
Browser ──HTTPS──> Cloudflare ──tunnel──> cloudflared (on the server) ──> 127.0.0.1:8085 ──> nginx container (static files)
```

The container listens on the loopback interface only, so cloudflared is the only way in. No ports need to be opened in the firewall.

## 0. Prerequisites (once)

- Docker Engine with the Compose plugin: `docker compose version` should work. If it doesn't, follow https://docs.docker.com/engine/install/ubuntu/.
- `cloudflared` installed and an existing tunnel connected (it shows **HEALTHY** in the Zero Trust dashboard).

## 1. Clone and start

```bash
cd ~
git clone <YOUR_REPO_URL> lab-report-analyzer
cd lab-report-analyzer

# Is port 8085 free? No output means it is free.
sudo ss -ltnp | grep ':8085 '
# If it is taken, pick another port (the .env file stays local and is git-ignored):
#   echo "HOST_PORT=8090" > .env      # then use 8090 everywhere below

docker compose up -d --build
```

Check it locally on the server:

```bash
docker compose ps                              # STATUS should become "Up ... (healthy)"
curl -sI http://127.0.0.1:8085/ | head -n 12   # expect 200 + Content-Security-Policy header
```

## 2. Add the public hostname to the tunnel

Use **one** of the two options below. Which one applies depends on how your tunnel was created:

- **Remotely managed** (you run `cloudflared` with a `--token`, or installed it with `cloudflared service install <token>`): use option A. A local config.yml is ignored for these tunnels.
- **Locally managed** (you ran `cloudflared tunnel create` and have a `config.yml`): use option B.

### Option A: Zero Trust dashboard

1. Go to https://one.dash.cloudflare.com, then **Networks → Tunnels**.
2. Click your tunnel, then **Edit**.
3. Open the **Public Hostname** tab (newer dashboards call it **Published application routes**) and click **Add a public hostname**.
4. Fill in:
   - Subdomain: `labanalyzer`
   - Domain: `stabat.fr`
   - Path: leave empty
   - Service type: `HTTP`
   - URL: `localhost:8085`
5. Save. Cloudflare creates the DNS record for you, and the change applies within a few seconds without a restart.

### Option B: config.yml ingress

Edit your cloudflared config (usually `/etc/cloudflared/config.yml`, or `~/.cloudflared/config.yml`). Add the hostname **above** the final catch-all rule:

```yaml
tunnel: <TUNNEL_UUID>
credentials-file: /etc/cloudflared/<TUNNEL_UUID>.json

ingress:
  # ... your existing hostnames ...
  - hostname: labanalyzer.stabat.fr
    service: http://localhost:8085
  - service: http_status:404        # must stay last
```

Then create the DNS record, validate and restart:

```bash
cloudflared tunnel route dns <TUNNEL_NAME_OR_UUID> labanalyzer.stabat.fr
cloudflared tunnel ingress validate
cloudflared tunnel ingress rule https://labanalyzer.stabat.fr   # should print the localhost:8085 rule
sudo systemctl restart cloudflared
```

> **If cloudflared itself runs in Docker**, `localhost` refers to the cloudflared container, not to the host. Run the cloudflared container with `network_mode: host`, or remove the `127.0.0.1:` prefix and put both containers on the same Docker network, then use `http://lab-report-analyzer:80` as the service.

### Verify

```bash
curl -sI https://labanalyzer.stabat.fr | head -n 15
```

Then open https://labanalyzer.stabat.fr in a browser. The DevTools console should be free of CSP errors.

**Cloudflare settings for this hostname.** Make sure **Rocket Loader** (Speed → Optimization) and automatic **Web Analytics / RUM** injection are **off**. Both inject scripts, which the CSP blocks and which would break the "no analytics" promise.

## 3. Redeploy after changes

```bash
cd ~/lab-report-analyzer
git pull
docker compose up -d --build
docker image prune -f          # optional: drop the old image layers
```

The CSP script hashes are regenerated on every build, so no manual step is needed. HTML is served with `no-cache`, so users get the new version on their next load.

Useful commands: `docker compose logs -f`, `docker compose restart`, `docker compose down`.

## Fallback: Vercel (if the server is down)

1. `npm i -g vercel && vercel --prod` from the repo root, and accept the detected Next.js settings. Static export works out of the box.
2. In the Vercel dashboard: **Settings → Domains → add `labanalyzer.stabat.fr`**, then in Cloudflare DNS replace the tunnel record with `CNAME labanalyzer → cname.vercel-dns.com` (DNS only, grey cloud).
3. Note: nginx.conf is not used on Vercel, so the security headers/CSP are not applied there. This is acceptable for an emergency demo only.
