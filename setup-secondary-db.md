# Configurarea Bazei de Date Secundare

Am creat o configurație completă pentru o a doua bază de date care este complet separată de prima.

## Fișierele create:

1. **server/db-secondary.ts** - Conexiunea la baza de date secundară
2. **shared/schema-secondary.ts** - Schema pentru baza de date secundară (cu tabele de exemplu)
3. **drizzle-secondary.config.ts** - Configurația Drizzle pentru baza de date secundară

## Pași pentru configurare:

### 1. Adaugă variabila de mediu
Trebuie să adaugi o nouă variabilă de mediu `DATABASE_URL_SECONDARY` care să pointeze la a doua bază de date.

### 2. Inițializează schema
Pentru a crea tabelele în baza de date secundară, rulează:
```bash
npx drizzle-kit push --config=drizzle-secondary.config.ts
```

### 3. Exemplu de utilizare în cod:

```typescript
// Importă baza de date secundară
import { dbSecondary } from './server/db-secondary';
import { usersSecondary, projectsSecondary } from './shared/schema-secondary';

// Exemplu de inserare în baza de date secundară
const newUser = await dbSecondary.insert(usersSecondary).values({
  username: 'test',
  password: 'hashed_password',
  email: 'test@example.com'
}).returning();
```

## Schema bazei de date secundare

Am inclus următoarele tabele ca exemplu:
- **users_secondary** - Utilizatori pentru a doua aplicație
- **projects_secondary** - Proiecte
- **tasks_secondary** - Sarcini asociate proiectelor

Toate tabelele sunt complet separate de prima bază de date și nu au nicio legătură cu datele existente.

## Avantaje:

✅ **Separare completă** - Cele două baze de date sunt independente
✅ **Zero impact** - Baza de date originală rămâne neatinsă
✅ **Configurație separată** - Fiecare bază de date are propriile setări
✅ **Flexibilitate** - Poți dezvolta aplicații complet diferite pe a doua bază de date