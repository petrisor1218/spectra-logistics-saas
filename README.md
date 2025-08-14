# 🚛 Spectra Logistics - Platforma SaaS Multi-Tenant

O platformă completă de logistică cu arhitectură multi-tenant, fiecare client având propria bază de date separată și izolată.

## 🏗️ Arhitectura Sistemului

### Multi-Tenancy cu Baze de Date Separate
- **Fiecare tenant primește propria bază de date NeonDB**
- **Izolare completă a datelor** - nicio tabelă partajată între tenanți
- **Provisioning automat** al bazelor de date la înregistrare
- **Connection pooling** pentru 100+ tenanți concurenți
- **Backup automat** și scalare per tenant

### Arhitectura Tehnică
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Main Domain   │    │  Admin Domain   │    │ Tenant Domains  │
│   (Landing)     │    │   (Dashboard)   │    │  (Subdomains)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   API Gateway   │
                    │  (Express.js)   │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Tenant Router  │
                    │  (Middleware)   │
                    └─────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Admin Database │    │ Tenant Database │    │ Tenant Database │
│   (Secondary)   │    │    (Tenant 1)   │    │    (Tenant N)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 💳 Modelul de Abonament Stripe

### Structura Prețurilor
- **3 zile TRIAL GRATUIT** (fără card de credit inițial)
- **Preț promotional**: €99.99/lună pentru primele 3 luni
- **Preț normal**: €149.99/lună după perioada promotională
- **Plan unic** - toate funcționalitățile incluse
- **Scalabilitate**: 100+ abonați activi

### Integrarea Stripe
- ✅ Crearea automată a abonamentelor cu preț promotional
- ✅ Gestionarea perioadei de trial (3 zile gratuit, apoi facturare)
- ✅ Tranziția automată de la €99.99 la €149.99 după 3 luni
- ✅ Procesarea webhook-urilor pentru toate evenimentele de abonament
- ✅ Logică de reîncercare pentru plățile eșuate
- ✅ Suspendarea automată a tenantilor la eșecul plății
- ✅ Portal client pentru gestionarea abonamentelor
- ✅ Analitici de venituri și tracking MRR

## 🛡️ Dashboard Super Admin

### Gestionarea Tenantilor
- 📊 **Lista completă a tenantilor** cu status abonament, MRR, statistici de utilizare
- 🔍 **Monitorizare în timp real** a sănătății tenantilor (mărime DB, apeluri API, utilizatori activi)
- 👤 **Impersonificare tenant** pentru suport (login ca orice tenant)
- ⚡ **Acțiuni bulk**: suspendare/activare/anulare tenantilor
- 💾 **Gestionarea bazelor de date** (backup, restore, migrare)

### Analitici de Business
- 📈 **Monthly Recurring Revenue (MRR)** tracking
- 📉 **Analiza ratei de churn**
- 📊 **Metrici de creștere a tenantilor**
- 💳 **Rate de succes/eșec la plăți**
- 💾 **Utilizarea bazelor de date și costurile per tenant**
- 🎫 **Integrarea tichetelor de suport**

### Monitorizarea Sistemului
- 🗄️ **Performanța bazelor de date** pe toți tenantii
- 🚦 **Rate limiting și utilizarea API-ului**
- ⚠️ **Alerte de sănătate a sistemului**
- 📈 **Triggeri de scalare automată**
- 💰 **Recomandări de optimizare a costurilor**

## 🏢 Funcționalități pentru Tenanți

Fiecare tenant primește platforma completă de logistică:

### Gestionarea Companiilor
- ✅ Companiile nelimitate per tenant
- ✅ Detalii complete (CIF, registrul comerțului, adrese)
- ✅ Rate de comision personalizate
- ✅ Istoric complet de activitate

### Gestionarea Șoferilor
- ✅ Șoferi nelimitați per companie
- ✅ Tracking documente (permis, certificat medical)
- ✅ Variante de nume pentru matching
- ✅ Contacte și informații personale

### Procesarea Comenzilor
- ✅ Procesare și tracking comenzi
- ✅ Generare facturi și procesare plăți
- ✅ Rapoarte săptămânale/lunare
- ✅ Integrare calendar
- ✅ Balanțe și istoric plăți
- ✅ Export capabilități (Excel, PDF)
- ✅ Notificări în timp real

## 🔒 Securitate și Conformitate

### Izolare Completă a Datelor
- 🗄️ **Baze de date separate** pentru fiecare tenant
- 🏗️ **Arhitectură SOC 2 Type II** compliant
- 📋 **Conformitate GDPR** cu export/ștergere date
- 📝 **Audit logging** pentru toate acțiunile tenantilor
- 🚦 **Rate limiting** per tenant
- 🔐 **SSL/TLS encryption** pentru toate conexiunile
- 💾 **Encryption la rest** pentru bazele de date

## ⚡ Cerințe Tehnice

### Backend
- **Node.js + Express** cu TypeScript
- **Drizzle ORM** cu conexiuni multiple la baze de date
- **Redis** pentru gestionarea sesiunilor și caching
- **Sistem de cozi** pentru job-uri în background (provisioning DB, backup-uri)

### Frontend
- **React + TypeScript + Vite**
- **Routing bazat pe subdomain** (tenant.mydomain.com)
- **Actualizări în timp real** via WebSockets
- **Progressive Web App (PWA)** capabilities
- **Design responsive** pentru mobile

### Baza de Date
- **NeonDB** cu provisioning automat
- **Connection pooling** pentru 100+ baze de date
- **Backup-uri automate** și monitorizare
- **Sistem de migrări** per tenant

### Deployment
- **Containerizat cu Docker**
- **Auto-scaling** pentru high availability
- **Pipeline CI/CD** ready
- **Configurare bazată pe environment**

## 📊 Fluxul de Onboarding

1. **Înregistrare**: Detalii companie + crearea utilizatorului admin
2. **Începerea Trial**: 3 zile acces gratuit cu toate funcționalitățile
3. **Configurarea Plății**: Stripe checkout înainte de expirarea trial-ului
4. **Perioada Promotională**: €99.99/lună pentru 3 luni
5. **Tranziția de Preț**: Upgrade automat la €149.99/lună
6. **Acces Complet**: Platforma completă cu baza de date dedicată

## 🎯 Metrici de Succes

### Tracking-ul Performanței
- 📈 **Rata de achiziție a tenantilor**
- 🔄 **Conversia trial-to-paid**
- 📉 **Rata de churn lunară**
- 💰 **Venitul mediu per tenant**
- 💾 **Costurile bazelor de date per tenant**
- 🎫 **Volumul tichetelor de suport per tenant**
- ⏱️ **Uptime-ul platformei per tenant**

## 🚀 Instalare și Configurare

### Cerințe Preliminare
- Node.js 18+
- PostgreSQL sau NeonDB
- Redis (opțional, pentru sesiuni)
- Stripe account

### Pașii de Instalare

1. **Clonează repository-ul**
```bash
git clone <repository-url>
cd SpectraRedesign-2023-cursor
```

2. **Instalează dependențele**
```bash
npm install
```

3. **Configurează variabilele de mediu**
```bash
cp env.example .env
# Editează .env cu valorile tale
```

4. **Configurează bazele de date**
```bash
# Baza de date principală (pentru admin)
npm run db:push

# Baza de date secundară (pentru management tenantilor)
npm run db:push:secondary
```

5. **Configurează Stripe**
- Creează produsele în Stripe Dashboard
- Configurează webhook-urile
- Adaugă cheile în .env

6. **Pornește aplicația**
```bash
npm run dev
```

### Configurarea DNS pentru Subdomain-uri

Pentru producție, configurează DNS-ul pentru a suporta subdomain-urile:

```
*.yourdomain.com     CNAME   yourdomain.com
admin.yourdomain.com CNAME   yourdomain.com
```

## 📁 Structura Proiectului

```
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componente UI
│   │   ├── pages/         # Pagini
│   │   ├── hooks/         # Custom hooks
│   │   └── lib/           # Utilități
├── server/                # Backend Express
│   ├── middleware/        # Middleware-uri
│   ├── routes/           # Rute API
│   └── services/         # Servicii business logic
├── shared/               # Schema și tipuri partajate
│   ├── schema.ts         # Schema principală
│   └── schema-secondary.ts # Schema pentru admin
└── docs/                 # Documentație
```

## 🔧 Scripturi Disponibile

```bash
npm run dev          # Pornește în development
npm run build        # Build pentru producție
npm run start        # Pornește în producție
npm run db:push      # Push schema la baza de date
npm run db:push:secondary # Push schema secundară
```

## 🧪 Testing

```bash
npm run test         # Rulează testele
npm run test:watch   # Teste în watch mode
npm run test:coverage # Teste cu coverage
```

## 📈 Monitoring și Logging

- **Logging structurat** pentru toate operațiunile
- **Metrics collection** pentru performanță
- **Error tracking** cu stack traces
- **Health checks** pentru toate serviciile
- **Alerting** pentru probleme critice

## 🔄 Backup și Disaster Recovery

- **Backup automat zilnic** pentru toate bazele de date
- **Retenție 30 zile** pentru backup-uri
- **Point-in-time recovery** pentru bazele de date
- **Plan de disaster recovery** documentat

## 🤝 Contribuție

1. Fork repository-ul
2. Creează un branch pentru feature (`git checkout -b feature/amazing-feature`)
3. Commit schimbările (`git commit -m 'Add amazing feature'`)
4. Push la branch (`git push origin feature/amazing-feature`)
5. Deschide un Pull Request

## 📄 Licență

Acest proiect este licențiat sub MIT License - vezi fișierul [LICENSE](LICENSE) pentru detalii.

## 🆘 Suport

Pentru suport și întrebări:
- 📧 Email: support@spectralogistics.com
- 📖 Documentație: [docs.spectralogistics.com](https://docs.spectralogistics.com)
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/issues)

---

**Spectra Logistics** - Platforma de logistică pentru viitorul digital 🚛✨
