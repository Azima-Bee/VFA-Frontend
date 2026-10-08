# VFA (Verified Flatmate App) — Cloud Deployment Guide

This guide details the step-by-step procedure to deploy the VFA Node.js/Express backend, MySQL database, and build the Android Beta APK for real student testing.

---

## 1. Create Production MySQL Database
1. Provision a managed MySQL 8.x database instance on your cloud provider (e.g. AWS RDS, DigitalOcean Managed Databases, Railway, or PlanetScale).
2. Note down your connection credentials:
   - `DB_HOST`
   - `DB_PORT` (typically `3306`)
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_NAME` (e.g. `flatmate_db`)

---

## 2. Import Database Schema
1. Connect to your production MySQL instance via MySQL CLI or client tool (e.g. MySQL Workbench, DBeaver):
   ```bash
   mysql -h <DB_HOST> -P <DB_PORT> -u <DB_USER> -p <DB_NAME> < backend/src/config/schema.sql
   ```
2. Verify all 10 tables are initialized:
   - `users`
   - `student_profiles`
   - `verifications`
   - `listings`
   - `favorites`
   - `connections`
   - `messages`
   - `notifications`
   - `reports`
   - `admin_audit_logs`

---

## 3. Configure Production Environment Variables
On your cloud hosting dashboard (or container runtime secrets), set the following environment variables:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `NODE_ENV` | Runtime environment | `production` |
| `PORT` | Cloud dynamic port | Assigned automatically (or `5000`) |
| `DB_HOST` | Database host | `db.your-cloud-provider.com` |
| `DB_PORT` | Database port | `3306` |
| `DB_USER` | Database username | `vfa_db_user` |
| `DB_PASSWORD` | Strong database password | `[YourSecretDbPassword]` |
| `DB_NAME` | Database name | `flatmate_db` |
| `JWT_SECRET` | 256-bit cryptographically random key | `[YourRandom64CharSecretKey]` |
| `JWT_EXPIRES_IN`| Token validity duration | `7d` |

---

## 4. Deploy Backend
1. Connect your repository to your cloud host (e.g. Render, Railway, AWS App Runner, or Google Cloud Run).
2. Set Root Directory to: `backend/`
3. Set Build Command:
   ```bash
   npm install
   ```
4. Set Production Start Command:
   ```bash
   npm start
   ```
   *(Executes `node src/server.js` using Node.js `>= 18.0.0`)*

---

## 5. Configure HTTPS
1. In your cloud provider domain settings, attach your custom domain (e.g. `api.vfa-app.com`).
2. Ensure TLS/SSL certificate is issued and enforced (Auto-managed via Let's Encrypt / Cloudflare).
3. Test health endpoint in browser/terminal:
   ```bash
   curl -i https://YOUR-PRODUCTION-DOMAIN/health
   ```
   *Expected response:*
   ```json
   {
     "success": true,
     "message": "FlatMate API is running"
   }
   ```

---

## 6. Configure Production API URL in Mobile App
1. In your local root `.env` (or CI/CD environment), set:
   ```env
   EXPO_PUBLIC_API_URL=https://YOUR-PRODUCTION-DOMAIN/api
   ```
2. The mobile app automatically loads `EXPO_PUBLIC_API_URL` for production builds while retaining dynamic local IP resolution during Expo Go development.

---

## 7. Build Android Beta APK
1. Install EAS CLI (if not installed):
   ```bash
   npm install -g eas-cli
   ```
2. Log in to Expo:
   ```bash
   eas login
   ```
3. Run preview build to generate a standalone testable Android `.apk`:
   ```bash
   eas build -p android --profile preview
   ```
4. Download the compiled `.apk` from the provided Expo build dashboard link.

---

## 8. Test Production API
Run the automated test suite against the live cloud endpoint:
```bash
node backend/test_phase13_production_api.js
```
Verify:
- Registration, Login & JWT verification
- Student ID upload & Admin approval
- Real-time room listing creation
- Cross-student connection requests & acceptances
- Direct messaging & notifications
- Admin reports, user blocking & audit trails

---

## 9. Test Beta APK with Real Students
1. Distribute the generated `.apk` to beta testing students.
2. Follow the test checklist in `BETA_TESTING.md`.
3. Collect tester feedback regarding UI responsiveness, room discovery, and verification clarity.
