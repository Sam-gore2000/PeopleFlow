# Deploy LionReach HRMS on a VPS

Everything runs in Docker. One script sets it up:

| Container | What it does | Reachable from the internet? |
|---|---|---|
| `web` | Caddy: HTTPS (free Let's Encrypt certificate), the React app, forwards `/api` and `/uploads` | Yes - ports 80 and 443 |
| `backend` | Node / Express API | No |
| `mongo` | MongoDB database | No |

Data lives in Docker volumes (`mongo-data`, `uploads`, `caddy-data`) and survives restarts and updates.

---

## Before you start

- A VPS with **Ubuntu 22.04 or 24.04**, at least **1 GB RAM** (2 GB recommended), and SSH access.
- **For HTTPS:** a domain (for example `hrm.lionreachmedia.com`) with a DNS **A record** pointing to the VPS IP. Check: `ping hrm.lionreachmedia.com` shows the VPS IP.
  No domain yet? You can run on the server IP over HTTP for testing.
- Optional: the Gmail address + App Password for forgot-password emails.

## 1. Upload the project

From your PC (PowerShell), copy the zip to the server and connect:
```powershell
scp HRMS_deploy.zip root@YOUR_SERVER_IP:/opt/
ssh root@YOUR_SERVER_IP
```
On the server:
```bash
apt-get update && apt-get install -y unzip
cd /opt && unzip HRMS_deploy.zip && cd hrms
```

## 2. Deploy

```bash
bash deploy.sh
```
The script:
1. installs Docker if it's missing (asks first), adds swap on small servers, opens ports 80/443 if the firewall is on;
2. asks for your **domain**, **admin email** and (optionally) **Gmail** - nothing else;
3. creates `.env` with **random** database password, login secret and account passwords;
4. builds and starts everything (first build: 3-8 minutes);
5. creates the first logins and prints them - also saved in `credentials.txt`:

| Account | Username | Password |
|---|---|---|
| Admin | `admin` | printed by the script |
| Manager | `MGR001` | printed by the script |
| Employee | `EMP001` (reports to MGR001) | printed by the script |

Open the website address it prints. With a domain, the HTTPS certificate is issued on the first visit (up to a minute).

**After the first login:** change the passwords (My Profile → Change Password), store them safely, then delete the file: `rm credentials.txt`.
The demo manager/employee can be deleted in Employee Details once real staff are added.

## 3. Add your real staff

Admin → **Employee Details** (fill Employee ID, Email, Department, Position, Password, Joining Date, Report Manager).
Or from the server:
```bash
docker compose exec backend npm run users -- add-employee LRM_004 'Welcome@1' --name "Samadhan Vishnu Gore" --manager MGR001 --email samadhan@example.com --department IT --position "Full Stack Developer"
docker compose exec backend npm run users -- list
```

## Everyday commands (run inside /opt/hrms)

| Task | Command |
|---|---|
| Update after code changes | upload the new files, then `bash deploy.sh` (data and passwords are kept) |
| See logs | `docker compose logs -f backend` (or `web`, `mongo`) |
| Status | `docker compose ps` |
| Restart | `docker compose restart` |
| Stop / start | `docker compose down` / `docker compose up -d` (data is kept) |
| Backup now | `sh scripts/backup.sh` |
| Restore a backup | `sh scripts/restore.sh backups/hrms-db-....archive.gz` |
| Test email settings | `docker compose exec backend npm run mail-test -- you@example.com` |
| Reset a password | `docker compose exec backend npm run users -- reset-password EMP001 'NewPass@1'` |

**Daily backup at 02:00** - run `crontab -e` and add:
```
0 2 * * * cd /opt/hrms && sh scripts/backup.sh >> backups/backup.log 2>&1
```
Copy the `backups/` folder off the server regularly.

**Never run `docker compose down -v`** - the `-v` deletes the database and uploaded files.

## Changing settings later

Edit `/opt/hrms/.env` (`nano .env`), then `bash deploy.sh`. For example:
- add Gmail: set `SMTP_USER`, `SMTP_PASS` (no spaces), `MAIL_FROM`;
- move from IP to a domain: set `SITE_ADDRESS=hrm.example.com`, `PUBLIC_URL=https://hrm.example.com`, `COOKIE_SECURE=true`;
- company rules: `WEEKLY_OFF_DAYS`, `LEAVE_ACCRUAL_PER_MONTH`, `LEAVE_YEAR_START_MONTH`, `PROBATION_MONTHS`.

The `INITIAL_*` lines only matter on the very first start; changing them later does nothing (use Change Password / `users -- reset-password`).

## Moving data from your PC (optional)

On your PC: `mongodump --uri "mongodb://127.0.0.1:27017/hrms" --archive=hrms.archive.gz --gzip`, copy `hrms.archive.gz` to `/opt/hrms` on the server, then:
```bash
sh scripts/restore.sh hrms.archive.gz
docker compose exec backend npm run fix-work-hours -- --apply   # one time: saved hours include breaks
```
Profile photos: copy your `backend/uploads` folder to the server and run `docker compose cp ./uploads/. backend:/app/uploads/`.

## Troubleshooting

- **Website doesn't open / certificate error:** the domain's A record must point to this server and ports 80 + 443 must be open (also in your VPS provider's firewall panel). `docker compose logs web`.
- **`deploy.sh` says the backend didn't become ready:** read the log it prints, or `docker compose logs backend`.
- **Build killed / out of memory:** answer **Y** to the swap question, or add swap and run `bash deploy.sh` again.
- **Login works on the IP but not the domain (or the reverse):** `PUBLIC_URL` in `.env` must be the address you open; several can be listed with commas.
