# Fermento Focacceria

Plataforma mobile-first para la venta de focaccias artesanales de Anna. Cliente arma pedido en la web y se redirige a WhatsApp con el detalle pre-cargado; Anna gestiona productos, pedidos, galería, reseñas y analíticas desde un panel admin.

El plan maestro con las 14 fases de construcción vive en [`fermento-focacceria-prompt.md`](./fermento-focacceria-prompt.md).

## Stack

- Next.js 16 (App Router) + TypeScript + React Compiler
- Tailwind CSS v4 con CSS variables para la paleta
- Firebase (Auth + Firestore + Storage)
- shadcn/ui, Framer Motion, Embla Carousel, Recharts, React Hook Form + Zod, Zustand
- Deploy en Vercel (auto desde `main`)

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # completar con credenciales reales
npm run dev
```

Abrí `http://localhost:3000`.

## Variables de entorno

Ver [`.env.example`](./.env.example). Las `NEXT_PUBLIC_FIREBASE_*` vienen del panel de Firebase. `NEXT_PUBLIC_ADMIN_EMAIL` es el email de Anna (único admin). `NEXT_PUBLIC_WHATSAPP_NUMBER` es el número en formato `wa.me` (solo dígitos, con código de país).

En Vercel agregar las mismas variables en Settings → Environment Variables (Production + Preview).

## Deploy de reglas de Firebase

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules,storage --project fermento-focacceria
```

> Importante: Firebase no soporta env vars dentro de las reglas. El email de Anna está hardcodeado en `firestore.rules` y `storage.rules` como `EMAIL_DE_ANNA@gmail.com` — reemplazar por el real antes del primer deploy.

## Agentes

Hay 5 subagentes especializados en [`.claude/agents/`](./.claude/agents/) que se pueden invocar desde Claude Code para asistir por fase: frontend Next.js, Firebase, UX/UI foodie, admin de microemprendimientos, y el commiter atómico.
