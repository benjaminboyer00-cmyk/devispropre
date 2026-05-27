# Checklist post-déploiement VPS — DevisPropre

Ce document liste **ce que vous devez faire vous-même** après le déploiement. Le code est prêt ; la configuration infra, les comptes tiers et la validation métier restent de votre côté.

---

## 1. Avant le premier déploiement

- [ ] **Serveur** : Docker + Docker Compose installés (Hetzner ou équivalent)
- [ ] **DNS** : `devispropre.fr` et `www.devispropre.fr` pointent vers l’IP du VPS
- [ ] **Cloner le repo** sur le serveur (ex. `/opt/devispropre`)
- [ ] **Copier** `.env.production.example` → `.env.production`
- [ ] **Générer des secrets forts** :
  - `JWT_SECRET` (64+ caractères aléatoires)
  - `POSTGRES_PASSWORD`
  - `CRON_SECRET`

---

## 2. Variables d’environnement (`.env.production`)

| Variable | Action requise |
|----------|----------------|
| `JWT_SECRET` | Secret unique, jamais réutilisé ailleurs |
| `NEXT_PUBLIC_APP_URL` | `https://devispropre.fr` |
| `ALLOWED_ORIGINS` | `https://devispropre.fr` (ou liste séparée par virgules) |
| `CRON_SECRET` | Secret pour `/api/cron/reminders` |
| `RESEND_API_KEY` | Créer compte [Resend](https://resend.com), vérifier le domaine d’envoi |
| `RESEND_FROM_EMAIL` | Ex. `DevisPropre <noreply@devispropre.fr>` — domaine vérifié chez Resend |
| `STRIPE_SECRET_KEY` | Clé **live** Stripe |
| `STRIPE_WEBHOOK_SECRET` | Secret du webhook prod (voir §3) |
| `STRIPE_PRICE_STARTER` / `STRIPE_PRICE_PRO` | IDs `price_...` des abonnements live |
| `R2_*` | Bucket Cloudflare R2 + clés API + `R2_PUBLIC_URL` (recommandé prod) |
| `SITE_SAME_AS` | URLs LinkedIn/X réelles, séparées par des virgules |
| `SLACK_WEBHOOK_URL` ou `ALERT_WEBHOOK_URL` | Optionnel — alertes orphelins R2 / erreurs critiques |

---

## 3. Stripe (obligatoire pour les abonnements)

1. Créer les produits **Starter (19€/mois)** et **Pro (39€/mois)** en mode **live**
2. Copier les `price_...` dans `.env.production`
3. **Essai gratuit** : géré côté app (`trial_period_days: 15` + carte obligatoire à l'inscription). Ne pas configurer de trial sur le prix Stripe Dashboard (éviter le double essai).
4. **Webhook** → URL : `https://devispropre.fr/api/stripe/webhook`
5. **Événements à cocher** :
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copier le **signing secret** (`whsec_...`) dans `STRIPE_WEBHOOK_SECRET`
6. Tester : inscription → carte Stripe → essai 15 j → plan Starter actif → annuler dans Stripe → retour FREE (3 devis/mois)

---

## 4. Resend (emails)

1. Vérifier le domaine `devispropre.fr` (SPF, DKIM, DMARC)
2. Tester :
   - [ ] Connexion par **lien magique** (`/connexion` → onglet « Lien par email »)
   - [ ] Relance J+3 (cron, voir §6)
   - [ ] Support Pro (si utilisé)

Sans `RESEND_API_KEY`, les relances et magic links ne partent pas (le reste de l’app fonctionne).

---

## 5. Cloudflare R2 (archives PDF — recommandé)

1. Créer le bucket `devispropre-pdfs`
2. Générer clés API R2 → remplir `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`
3. Configurer un domaine public ou worker pour `R2_PUBLIC_URL`
4. **Volume Docker `pdfs`** : fallback local déjà monté dans `docker-compose.prod.yml` si R2 est indisponible

---

## 6. Déploiement et HTTPS

```bash
cd /opt/devispropre
chmod +x scripts/*.sh
./scripts/deploy.sh
```

- [ ] Nginx : copier `deploy/nginx/devispropre.conf`, activer le site
- [ ] Certbot : `sudo certbot --nginx -d devispropre.fr -d www.devispropre.fr`
- [ ] Vérifier : `curl -f https://devispropre.fr/api/health`

---

## 7. Cron (relances J+3 + sauvegardes)

Installer le crontab depuis `deploy/cron/crontab.example` :

```bash
0 8 * * * /opt/devispropre/scripts/cron-reminders.sh
0 3 * * * /opt/devispropre/scripts/backup-db.sh
```

- [ ] `CRON_SECRET` identique entre `.env.production` et le script cron
- [ ] Vérifier qu’un backup apparaît dans `backups/` après la première nuit

---

## 8. SEO et marketing (votre côté)

- [ ] Remplacer `SITE_SAME_AS` par vos **vrais** profils LinkedIn / X
- [ ] Soumettre `https://devispropre.fr/sitemap.xml` dans **Google Search Console**
- [ ] Vérifier l'indexation des pages locales (ex. `/devis-artisan/plombier/paris`)
- [ ] Vérifier l’aperçu Open Graph (partage WhatsApp / LinkedIn) — image générée via `/opengraph-image`
- [ ] Contenu : témoignages artisans, pages métier (plombier, électricien…) si vous visez la longue traîne

---

## 9. Tests manuels post-mise en ligne

| Flux | Vérification |
|------|----------------|
| Inscription | Compte créé, dashboard accessible |
| Magic link | Email reçu, connexion sans mot de passe |
| Déconnexion | Bouton dans la barre dashboard → retour `/connexion` |
| Devis | Création → envoi → WhatsApp → acceptation client |
| Facture | Émission → partage WhatsApp → page publique `/facture/[token]` |
| Stripe | Upgrade Starter/Pro → downgrade à l’annulation |
| Conformité | Hash facture, attestation PDF (Starter+) |

---

## 10. Monitoring (recommandé)

- [ ] Configurer `SLACK_WEBHOOK_URL` ou `ALERT_WEBHOOK_URL` pour les alertes `[CRITICAL]` (orphelins R2)
- [ ] Surveiller les logs Docker : `docker compose -f docker-compose.prod.yml logs -f app`
- [ ] Optionnel : Sentry / Grafana Loki pour agrégation des logs

---

## 11. Ce qui est déjà fait dans le code (rien à coder)

- Webhook Stripe annulation / mise à jour abonnement
- Partage facture (`shareToken` + page publique)
- Volume Docker PDFs fallback
- Magic link connexion par email (onglet par défaut)
- Validation Zod partagée client/serveur
- Bouton déconnexion dashboard
- Sitemap (66+ pages SEO local), robots.txt, JSON-LD
- PWA + sync devis hors-ligne (file d'attente locale)
- Pages SEO local `/devis-artisan/[metier]/[ville]` (6 métiers × 10 villes)
- Migration Next.js 16 : `src/proxy.ts` (ex-middleware)
- CSP Stripe + mode sombre

---

## 12. Non prévu / évolutions futures

- Auth SMS / WhatsApp OTP (nécessite Twilio ou Meta Business API)
- Mode sombre automatique selon l’heure
- Tests E2E Playwright en CI

---

**Contact technique projet** : Benjamin Boyer — contact@devispropre.fr
