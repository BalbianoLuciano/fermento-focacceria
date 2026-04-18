# Fermento Focacceria — Prompt de Construcción para Claude Code

> Este documento es el plan maestro para construir la plataforma de **Fermento Focacceria** (emprendimiento de venta de focaccias artesanales). Está pensado para ejecutarse **fase por fase** en una terminal de Claude Code. Al final de cada fase, comiteá y pusheá a `main` para validar el deploy automático en Vercel.

---

## 🎯 Contexto del proyecto

**Negocio:** Fermento Focacceria — venta de focaccias artesanales recién horneadas, gestionado por Anna (única admin).

**Objetivo:** Plataforma mobile-first con dos caras:
1. **Pública:** menú, galería, reseñas → cliente arma pedido y se redirige a WhatsApp con el detalle pre-cargado (la entrega/pago se coordina por WhatsApp; nada de pasarela de pago).
2. **Admin:** Anna gestiona productos, precios, pedidos (estados + cobrado), galería, reseñas y ve analíticas de rendimiento.

**Identidad visual:**
- Paleta: off-whites + tonos marrones (cálido, foodie, artesanal)
- Tipografía títulos: **Berkshire Swash** (idéntica al logo, disponible en Google Fonts)
- Tipografía body/UI: **Outfit**
- Tono copy: foodie, invitador, frases que inciten al pedido ("Recién salida del horno", "Hecha con masa madre y paciencia", "Tu próxima obsesión", etc.)

---

## 🛠 Stack técnico

| Capa | Tecnología | Notas |
|---|---|---|
| Framework | Next.js 15 (App Router) + TypeScript | mobile-first |
| Estilos | Tailwind CSS v4 | con CSS variables para la paleta |
| UI primitives | shadcn/ui (componentes a demanda) | sólo lo que se use |
| Auth | Firebase Auth (Google provider) | sólo Anna entra al admin |
| DB | Firestore | reglas de seguridad estrictas |
| Storage | Firebase Storage | imágenes de productos, galería y reseñas |
| Forms | React Hook Form + Zod | validación type-safe |
| Animaciones | Framer Motion | sutil, no distraer de la comida |
| Carruseles | Embla Carousel | liviano, mobile touch nativo |
| Charts (admin) | Recharts | gráficos del panel de rendimientos |
| Iconos | Lucide React | |
| Fechas | date-fns + es locale | |
| Toasts | Sonner | feedback al admin |
| Deploy | Vercel | auto-deploy desde `main` |

---

## 📦 Productos iniciales (a seedear)

Estos son los datos iniciales que se cargan en Firestore al final de la fase de seeding. **Anna podrá editarlos desde el admin después.**

| Sabor | Descripción | Individual | XL |
|---|---|---|---|
| Naked | Sal y romero | $4.000 | $10.000 |
| Mediterránea | Tomate, aceituna, romero y sal | $5.000 | $10.000 |
| Garlic Lover | Ajo infusionado en aceite de oliva y queso | $6.000 | $10.000 |
| Mixta | Cualquier combinación de los 3 sabores | $6.500 | $10.000 |

> Nota: el precio XL es el mismo para todos los sabores hoy, pero el modelo de datos permite que cada sabor tenga su propio precio por tamaño (por si en el futuro cambia).

---

## 🎨 Sistema de diseño

### Paleta (definir como CSS variables en `globals.css`)

```css
:root {
  /* Backgrounds */
  --bg-primary: #FAF7F2;      /* off-white principal */
  --bg-secondary: #F5EFE6;    /* off-white más cálido, secciones */
  --bg-card: #FFFFFF;         /* tarjetas */

  /* Browns */
  --brown-900: #2C1810;       /* texto principal */
  --brown-700: #3D2817;       /* títulos oscuros */
  --brown-500: #6B4423;       /* marrón medio, acentos */
  --brown-300: #A0826D;       /* marrón claro, bordes */
  --brown-100: #E8DDD0;       /* marrón muy claro, hover/divisores */

  /* Accent */
  --accent: #C9A678;          /* dorado pan tostado, CTAs */
  --accent-dark: #A8804E;     /* hover de CTAs */

  /* Estado */
  --success: #6B8E23;
  --warning: #D4A017;
  --danger: #A0341A;
}
```

### Tipografía

```css
/* importadas vía next/font/google */
--font-display: 'Berkshire Swash', cursive;  /* títulos, logo, hero */
--font-body: 'Outfit', sans-serif;            /* todo lo demás */
```

**Escala (mobile-first):**
- Hero title: `text-5xl` (Berkshire Swash)
- Section title: `text-3xl` (Berkshire Swash)
- Card title: `text-xl` (Outfit semibold)
- Body: `text-base` (Outfit regular)
- Small/meta: `text-sm` (Outfit medium)

### Principios de UI

- **Mobile-first siempre.** Diseñá para 375px y escalá hacia arriba.
- Respiración generosa: padding amplio, no apretar elementos.
- Imágenes grandes y apetitosas (objeto principal de la página).
- Botones grandes y táctiles (min 44px de alto).
- Microcopy foodie: "Pedila ahora", "Sumar al pedido", "Ver más sabores".

---

## 🗄 Modelo de datos (Firestore)

### Colecciones

#### `products/{productId}`
```ts
{
  id: string;
  name: string;                    // "Mediterránea"
  description: string;             // "Tomate, aceituna, romero y sal"
  imageUrl: string;                // Firebase Storage URL
  sizes: Array<{
    name: string;                  // "Individual" | "XL"
    price: number;                 // 5000
  }>;
  active: boolean;                 // visible en la web
  order: number;                   // orden de aparición en menú
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `orders/{orderId}`
```ts
{
  id: string;
  customerName: string;
  customerPhone: string;           // formato internacional para wa.me
  items: Array<{
    productId: string;
    productName: string;           // snapshot
    sizeName: string;              // snapshot
    unitPrice: number;             // snapshot al momento del pedido
    qty: number;
    subtotal: number;
  }>;
  total: number;
  notes?: string;                  // notas del cliente
  status: 'pending' | 'confirmed' | 'in_preparation' | 'ready' | 'delivered' | 'cancelled';
  paid: boolean;
  paidAt?: Timestamp;
  source: 'web' | 'manual';        // 'web' si vino del sitio, 'manual' si Anna lo cargó
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `reviews/{reviewId}`
```ts
{
  id: string;
  authorName: string;
  rating: number;                  // 1-5
  text: string;
  imageUrl?: string;               // opcional, screenshot de IG por ej.
  active: boolean;                 // visible en la web
  order: number;
  createdAt: Timestamp;
}
```

#### `gallery/{imageId}`
```ts
{
  id: string;
  imageUrl: string;
  caption?: string;
  order: number;
  createdAt: Timestamp;
}
```

#### `settings/global` (documento único)
```ts
{
  whatsappNumber: string;          // "5493735456222" formato wa.me
  instagramHandle: string;         // "anna.kowalczuk"
  businessName: string;            // "Fermento Focacceria"
  tagline: string;                 // "Fresh from the oven"
  heroMessage: string;             // editable
}
```

### Reglas de seguridad (Firestore)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper: sólo Anna puede escribir (se valida por email)
    function isAdmin() {
      return request.auth != null
        && request.auth.token.email == 'EMAIL_DE_ANNA@gmail.com';
    }

    // Lectura pública para productos activos, reviews activas, gallery, settings
    match /products/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /reviews/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /gallery/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /settings/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Pedidos: lectura sólo admin. Creación pública (cualquiera puede crear desde la web).
    match /orders/{id} {
      allow read: if isAdmin();
      allow create: if true;       // validación de shape en el cliente y en Cloud Functions si se quiere reforzar
      allow update, delete: if isAdmin();
    }
  }
}
```

> Reemplazar `EMAIL_DE_ANNA@gmail.com` por el email real al final de la Fase 2.

### Reglas de seguridad (Storage)

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null
        && request.auth.token.email == 'EMAIL_DE_ANNA@gmail.com';
    }
  }
}
```

---

## 🗂 Estructura de carpetas

```
fermento-focacceria/
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── layout.tsx              # layout pública con header/footer
│   │   │   ├── page.tsx                # landing
│   │   │   ├── menu/page.tsx           # vista detallada del menú
│   │   │   ├── galeria/page.tsx        # galería
│   │   │   └── pedido/page.tsx         # carrito + datos del cliente + redirect WA
│   │   ├── admin/
│   │   │   ├── layout.tsx              # layout admin con sidebar y guard
│   │   │   ├── page.tsx                # dashboard
│   │   │   ├── pedidos/page.tsx
│   │   │   ├── productos/page.tsx
│   │   │   ├── galeria/page.tsx
│   │   │   ├── reseñas/page.tsx
│   │   │   ├── analiticas/page.tsx
│   │   │   └── ajustes/page.tsx
│   │   ├── login/page.tsx              # login Google sólo para admin
│   │   ├── api/                        # API routes si hace falta
│   │   ├── layout.tsx                  # root
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                         # shadcn components
│   │   ├── public/                     # Hero, MenuGrid, GalleryCarousel, ReviewsCarousel, etc.
│   │   ├── admin/                      # OrdersTable, ProductForm, AnalyticsCharts, etc.
│   │   └── shared/                     # Logo, Header, Footer
│   ├── lib/
│   │   ├── firebase/
│   │   │   ├── client.ts               # init cliente
│   │   │   ├── admin.ts                # init admin SDK (server-side si hace falta)
│   │   │   ├── auth.ts                 # helpers de auth
│   │   │   ├── products.ts             # CRUD productos
│   │   │   ├── orders.ts               # CRUD pedidos
│   │   │   ├── reviews.ts
│   │   │   ├── gallery.ts
│   │   │   └── storage.ts              # subir/eliminar imágenes
│   │   ├── cart/
│   │   │   └── cart-store.ts           # Zustand para el carrito
│   │   ├── whatsapp.ts                 # builder del mensaje + URL wa.me
│   │   ├── utils.ts
│   │   └── types.ts
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   ├── use-products.ts
│   │   └── use-orders.ts
│   └── styles/
├── public/
│   ├── logo.svg
│   └── og-image.jpg
├── firestore.rules
├── storage.rules
├── firebase.json
├── .env.local                          # NO commitear
├── .env.example                        # commitear con placeholders
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

# 🚀 FASES DE EJECUCIÓN

> Cada fase termina con: **commit + push a `main`** para validar deploy.

---

## Fase 0 — Preparación manual (vos, antes de Claude Code)

**Sólo lo que requiere tu intervención fuera de la terminal:**

1. **Crear repo en GitHub** vacío llamado `fermento-focacceria` (público o privado, lo que prefieras).
2. **Crear proyecto Firebase** en https://console.firebase.google.com
   - Activar **Authentication → Google provider** (agregar tu email y el de Anna como usuarios de prueba si está en testing).
   - Crear **Firestore Database** en modo producción, región `southamerica-east1` (São Paulo, lo más cercano a Corrientes).
   - Activar **Storage** en la misma región.
   - Anotar las credenciales de la web app (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId).
3. **Crear cuenta en Vercel** (con tu GitHub) si no la tenés.

> Cuando tengas esto listo, abrí Claude Code en una carpeta vacía local y pegale el comando de la Fase 1.

---

## Fase 1 — Setup inicial del proyecto y deploy a Vercel

**Prompt para Claude Code:**

> Inicializá un proyecto Next.js 15 con TypeScript, Tailwind CSS v4, App Router, ESLint y `src/` directory. Nombre del proyecto: `fermento-focacceria`.
>
> Después:
> 1. Inicializar git, agregar `.gitignore` apropiado (incluyendo `.env.local`, `.next`, `node_modules`).
> 2. Crear `.env.example` con las variables de Firebase como placeholders:
>    ```
>    NEXT_PUBLIC_FIREBASE_API_KEY=
>    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
>    NEXT_PUBLIC_FIREBASE_PROJECT_ID=
>    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
>    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
>    NEXT_PUBLIC_FIREBASE_APP_ID=
>    NEXT_PUBLIC_ADMIN_EMAIL=
>    NEXT_PUBLIC_WHATSAPP_NUMBER=
>    ```
> 3. Crear un README breve con: descripción, stack, cómo correr en local, link a este `.md`.
> 4. Configurar `next.config.ts` para permitir imágenes de `firebasestorage.googleapis.com`.
> 5. Hacer commit inicial y pedirme que conecte el repo remoto. Una vez conectado, hago push.

**Después de que termine, vos:**
```bash
git remote add origin https://github.com/TU_USER/fermento-focacceria.git
git branch -M main
git push -u origin main
```

Luego en **Vercel**:
- Importar el repo desde el dashboard.
- Configurar como Next.js (autodetecta).
- **NO agregar variables de entorno aún** (vienen en Fase 2).
- Deploy. Verificar que el "Hello World" inicial cargue.
- Confirmar que el branch `main` está marcado como Production.

---

## Fase 2 — Firebase: cliente, auth, reglas

**Prompt para Claude Code:**

> 1. Instalar `firebase`.
> 2. Crear `src/lib/firebase/client.ts` con la inicialización del SDK leyendo de `process.env.NEXT_PUBLIC_FIREBASE_*`. Inicializar Auth, Firestore y Storage. Manejar el caso de hot-reload (`getApps().length`).
> 3. Crear `src/lib/firebase/auth.ts` con:
>    - `signInWithGoogle()` usando `signInWithPopup`.
>    - `signOut()`.
>    - `onAuthChange(callback)` wrapper de `onAuthStateChanged`.
>    - `isAdmin(user)` que valide contra `process.env.NEXT_PUBLIC_ADMIN_EMAIL`.
> 4. Crear hook `src/hooks/use-auth.ts` que devuelva `{ user, loading, isAdmin }` usando un context provider en root layout.
> 5. Crear `firestore.rules` y `storage.rules` con las reglas definidas en este documento (usar `process.env.NEXT_PUBLIC_ADMIN_EMAIL` como referencia en un comentario, pero hardcodear el email en las reglas porque Firebase no soporta env vars ahí).
> 6. Crear `firebase.json` con configuración para deploy de reglas con Firebase CLI.
> 7. Crear `src/lib/types.ts` con todas las interfaces TypeScript del modelo de datos.
> 8. Documentar en el README cómo deployar las reglas: `npx firebase-tools deploy --only firestore:rules,storage`.

**Vos después:**
1. Completar `.env.local` con las credenciales reales de Firebase + tu email + el WhatsApp de Anna (`5493735456222`).
2. En Vercel → Settings → Environment Variables, agregar **las mismas variables** para Production y Preview.
3. Deployar reglas: `npx firebase-tools login` y `npx firebase-tools deploy --only firestore:rules,storage --project TU_PROJECT_ID`.
4. **Commit + push.** Verificar que el deploy de Vercel sigue funcionando (no debería romper nada visible aún).

---

## Fase 3 — Sistema de diseño base

**Prompt para Claude Code:**

> 1. En `src/app/layout.tsx` cargar las fuentes `Berkshire Swash` (weight 400) y `Outfit` (weights 300, 400, 500, 600, 700) usando `next/font/google`. Exponer como CSS variables `--font-display` y `--font-body`.
> 2. En `src/app/globals.css` definir todas las CSS variables de la paleta (mirar este `.md`, sección "Sistema de diseño"). Configurar `body` con `bg-primary` y `font-body`.
> 3. Configurar Tailwind v4 para usar las CSS variables como colores: `brown-900`, `brown-700`, `brown-500`, `brown-300`, `brown-100`, `bg-primary`, `bg-secondary`, `bg-card`, `accent`, `accent-dark`. Y las families: `font-display`, `font-body`.
> 4. Inicializar shadcn/ui con `npx shadcn@latest init`. Elegir tema neutral, base color stone, CSS variables sí. Después instalar componentes que vamos a usar: `button`, `input`, `textarea`, `label`, `card`, `dialog`, `dropdown-menu`, `table`, `badge`, `tabs`, `select`, `switch`, `tooltip`, `sonner`.
> 5. Sobrescribir los tokens de shadcn para que matcheen nuestra paleta marrón.
> 6. Crear `src/components/shared/Logo.tsx` — componente del logo (Berkshire Swash "Fermento focacceria" + tagline "Fresh from the oven", podemos hacerlo en SVG o sólo texto bien tipografiado).
> 7. Crear `src/components/shared/Header.tsx` y `Footer.tsx` para el layout público (Header sticky con logo + link a "Pedido"; Footer con IG, WhatsApp, copyright).
> 8. Crear página `src/app/(public)/page.tsx` placeholder con un Hero gigante: título grande en Berkshire Swash ("Recién horneadas, hechas con amor"), subtítulo, CTA "Ver el menú". Sólo para validar tipografías y paleta en mobile.

**Criterio de aceptación:** abrís en mobile (DevTools 375px) y se ve el hero con la fuente del logo bien renderizada, paleta marrón cálida, y se ve "appetizing".

**Commit + push.** Verificar deploy.

---

## Fase 4 — Carrito (Zustand) + helper de WhatsApp

**Prompt para Claude Code:**

> 1. Instalar `zustand`.
> 2. Crear `src/lib/cart/cart-store.ts` con un store que maneje:
>    - `items: Array<{ productId, productName, sizeName, unitPrice, qty }>`
>    - `addItem(item)`, `removeItem(productId, sizeName)`, `updateQty(productId, sizeName, qty)`, `clear()`
>    - `total` computado.
>    - Persistencia en `localStorage` con `zustand/middleware`.
> 3. Crear `src/lib/whatsapp.ts` con función `buildWhatsAppUrl(order, settings)` que arme un mensaje formateado tipo:
>    ```
>    Hola Anna! 👋 Quiero hacer un pedido en Fermento Focacceria 🍞
>
>    📝 Detalle:
>    • 2x Mediterránea (Individual) — $10.000
>    • 1x Garlic Lover (XL) — $10.000
>
>    💰 Total: $20.000
>
>    👤 Nombre: Juan Pérez
>    📞 Tel: 3735 123456
>    📍 Notas: para retirar mañana al mediodía
>    ```
>    Y devuelva la URL `https://wa.me/{number}?text={encoded}`.
> 4. Hooks utilitarios opcionales para consumir el store.

**No hay UI todavía**, sólo lógica. Test rápido en una página dummy si querés.

**Commit + push.**

---

## Fase 5 — CRUD Firestore + seeding inicial

**Prompt para Claude Code:**

> 1. Crear `src/lib/firebase/products.ts` con funciones: `listProducts({ activeOnly })`, `getProduct(id)`, `createProduct(data)`, `updateProduct(id, data)`, `deleteProduct(id)`, `setProductActive(id, active)`. Usar `serverTimestamp()` para `createdAt`/`updatedAt`.
> 2. Crear lo equivalente para `orders.ts`, `reviews.ts`, `gallery.ts` y `settings.ts` (este último con un único doc `global`).
> 3. Crear `src/lib/firebase/storage.ts` con `uploadImage(file, path)` que devuelva la URL pública, y `deleteImage(url)`.
> 4. Crear un script de seeding `scripts/seed.ts` que:
>    - Inserte los 4 productos (Naked, Mediterránea, Garlic Lover, Mixta) con sus precios. `imageUrl` vacío por ahora (Anna sube las fotos desde el admin).
>    - Inserte el doc `settings/global` con: WhatsApp number desde env, instagram `anna.kowalczuk`, businessName `Fermento Focacceria`, tagline `Fresh from the oven`, heroMessage default.
>    - Inserte 2-3 reseñas de ejemplo (placeholder, Anna las edita después).
>    - Documentar cómo correrlo: `npx tsx scripts/seed.ts` (instalar `tsx` como devDep).
>    - El script debe ser idempotente (no duplicar si ya existen, basarse en IDs estables como `product-naked`).
> 5. Correr el seed.

**Vos:** Ejecutar el seed una vez y verificar en la consola de Firebase que los datos están.

**Commit + push.**

---

## Fase 6 — Landing pública: Hero + Menú

**Prompt para Claude Code:**

> En `src/app/(public)/page.tsx`:
>
> 1. **Hero section:** ocupa casi todo el viewport mobile. Imagen de fondo (placeholder por ahora, se reemplaza después con foto real desde Storage), overlay sutil marrón, título grande en Berkshire Swash ("Recién horneadas, hechas con amor" o similar — usar el `heroMessage` de settings), subtítulo en Outfit, CTA grande "Ver el menú" que scrollea a la sección de menú.
> 2. **Sección menú:** título "Nuestros sabores" en Berkshire Swash. Cards de productos en grid 1 columna mobile / 2 desktop. Cada card: imagen, nombre, descripción, precios por tamaño, botón "Sumar al pedido" con dropdown de tamaño que agrega al carrito de Zustand. Toast de confirmación.
> 3. **Bottom bar fija** (sólo si hay items en el carrito): muestra cantidad + total + CTA "Ver pedido →" que va a `/pedido`.
> 4. Usar Server Components para fetch de productos donde se pueda; Client Components para lo interactivo (cart, dropdowns).
> 5. Frases foodie repartidas: "Masa madre, fermentación de 24 horas", "Hecha por encargo, fresquita siempre", etc.

**Criterio de aceptación:** entrás desde el celu, ves el hero, scrolleás al menú, sumás items al carrito, aparece la bottom bar.

**Commit + push.**

---

## Fase 7 — Galería + Reseñas (carruseles)

**Prompt para Claude Code:**

> 1. Instalar `embla-carousel-react` y `embla-carousel-autoplay`.
> 2. Crear `src/components/public/GalleryCarousel.tsx`: carousel mobile-first, swipe nativo, dots de navegación, autoplay lento (5s). Lee de `gallery` en Firestore. Click en imagen abre lightbox (usar dialog de shadcn).
> 3. Crear `src/components/public/ReviewsCarousel.tsx`: carousel de cards con nombre, rating en estrellas (Lucide), texto. Si tiene `imageUrl`, mostrarla. Autoplay lento.
> 4. Crear página `src/app/(public)/galeria/page.tsx` con grid masonry de toda la galería + lightbox.
> 5. Insertar ambos carruseles en la landing entre "Menú" y el footer, con títulos en Berkshire Swash: "De nuestro horno" (galería) y "Lo que dicen" (reseñas).

**Commit + push.**

---

## Fase 8 — Página de pedido + handoff a WhatsApp

**Prompt para Claude Code:**

> En `src/app/(public)/pedido/page.tsx`:
>
> 1. Mostrar items del carrito (Zustand) con imagen, nombre, tamaño, cantidad editable, subtotal. Botón quitar.
> 2. Si el carrito está vacío: mensaje + CTA volver al menú.
> 3. Form (React Hook Form + Zod) con: nombre, teléfono, notas opcionales. Validar teléfono argentino básico.
> 4. Botón gigante "Confirmar pedido por WhatsApp". Al click:
>    - Crear documento en `orders` con status `pending`, paid `false`, source `web`, items snapshotados, total calculado.
>    - Limpiar el carrito.
>    - Construir URL de WhatsApp con `buildWhatsAppUrl()` y abrirla en una nueva pestaña (o redirigir).
>    - Mostrar pantalla de "¡Pedido enviado! Anna te va a contestar por WhatsApp para coordinar."
> 5. Manejo de errores con toast.

**Criterio de aceptación:** flujo completo end-to-end desde celular: armás pedido, completás form, click → se crea en Firestore, abre WhatsApp con el mensaje pre-cargado.

**Commit + push.**

---

## Fase 9 — Login admin + protección de rutas

**Prompt para Claude Code:**

> 1. Crear `src/app/login/page.tsx` con un único botón grande "Ingresar con Google". Si el usuario ya está logueado y es admin, redirigir a `/admin`. Si está logueado pero NO es admin, mostrar mensaje "Acceso restringido" y botón de cerrar sesión.
> 2. Crear `src/app/admin/layout.tsx` que use `useAuth()`:
>    - Si loading → spinner.
>    - Si no hay user o no es admin → redirigir a `/login`.
>    - Si es admin → renderizar el layout con sidebar (links a: Dashboard, Pedidos, Productos, Galería, Reseñas, Analíticas, Ajustes) + botón "Cerrar sesión".
> 3. Sidebar mobile: hamburguesa que abre un drawer.
> 4. Crear `src/app/admin/page.tsx` (dashboard) con tarjetas resumen: pedidos pendientes hoy, total facturado del mes, últimos 5 pedidos.

**Criterio de aceptación:** sólo Anna puede entrar a `/admin/*`. Cualquier otro usuario rebota a login con mensaje claro.

**Commit + push.**

---

## Fase 10 — Admin: gestión de productos

**Prompt para Claude Code:**

> En `src/app/admin/productos/page.tsx`:
>
> 1. Tabla/lista de productos con: imagen miniatura, nombre, precios por tamaño, switch activo/inactivo, botones editar/eliminar.
> 2. Botón "Nuevo producto" abre dialog con form (RHF + Zod): nombre, descripción, sizes (array dinámico nombre+precio, mín 1), upload de imagen (a Firebase Storage en `products/{productId}/cover.jpg`), order, active.
> 3. Editar: mismo dialog precargado.
> 4. Eliminar: confirmación + borra doc + borra imagen del storage.
> 5. Toggle activo/inactivo inline (sin abrir dialog).
> 6. Reordenar: por ahora un input numérico de `order`. (Drag-and-drop opcional, si querés más adelante metemos `dnd-kit`.)

**Commit + push.**

---

## Fase 11 — Admin: gestión de pedidos

**Prompt para Claude Code:**

> En `src/app/admin/pedidos/page.tsx`:
>
> 1. Tabs por estado: Pendientes / En preparación / Listos / Entregados / Cancelados / Todos.
> 2. Tabla (mobile: cards apiladas) con: fecha, cliente, total, estado, cobrado (badge), botones acción.
> 3. Click en pedido abre dialog con detalle completo: items, total, datos del cliente, notas, botones de acción (cambiar estado, marcar/desmarcar cobrado, abrir WhatsApp con el cliente, eliminar).
> 4. Filtros: por rango de fechas, por estado, búsqueda por nombre/teléfono.
> 5. Botón "Pedido manual" para que Anna cargue un pedido que recibió por WhatsApp/teléfono fuera de la web (mismo form que `/pedido` pero desde el admin, source `manual`).
> 6. Indicador visual claro de pedidos nuevos sin atender (badge con contador en sidebar).
> 7. Real-time: usar `onSnapshot` para que la tabla se actualice sola cuando entra un pedido nuevo.

**Commit + push.**

---

## Fase 12 — Admin: galería + reseñas + ajustes

**Prompt para Claude Code:**

> 1. **`/admin/galeria`**: grid de imágenes con upload múltiple, eliminar, editar caption, reordenar (input order).
> 2. **`/admin/reseñas`**: lista con form para crear/editar reseña: nombre, rating (1-5 estrellas clickeables), texto, imagen opcional, activa, order. Eliminar.
> 3. **`/admin/ajustes`**: form para editar el doc `settings/global`: WhatsApp number, IG handle, businessName, tagline, heroMessage. Live preview opcional.

**Commit + push.**

---

## Fase 13 — Admin: analíticas con Recharts

**Prompt para Claude Code:**

> Instalar `recharts`. En `src/app/admin/analiticas/page.tsx`:
>
> 1. **Filtros de rango:** hoy / esta semana / este mes / últimos 3 meses / custom (date range picker). Persistir en query params.
> 2. **KPIs arriba (cards):**
>    - Total facturado (suma de `orders.total` con `paid=true` en el rango).
>    - Cantidad de pedidos.
>    - Ticket promedio.
>    - Pedidos cobrados vs pendientes de cobro (con %).
> 3. **Gráficos (Recharts):**
>    - **Line chart:** facturación por día en el rango.
>    - **Bar chart:** ventas por sabor (cantidad de unidades vendidas, top 5).
>    - **Pie/Donut chart:** distribución por tamaño (Individual vs XL).
>    - **Bar chart horizontal:** ranking de productos por ingreso generado.
>    - **Heatmap o bar simple:** ventas por día de la semana (¿qué día se vende más?).
> 4. **Tabla detallada:** lista de todos los pedidos del rango con export a CSV (botón).
> 5. Todos los gráficos en colores de la paleta (marrones + dorado).
> 6. Loading states y empty states amables ("Todavía no hay datos en este rango").

**Commit + push.**

---

## Fase 14 — Pulido final, SEO, OG, performance

**Prompt para Claude Code:**

> 1. **Metadata SEO:** en cada página pública, metadata específica con title + description + OpenGraph (`og:image` apuntando a `/public/og-image.jpg`, que se debe crear con el logo + una foto de focaccia).
> 2. **Favicon** del logo (generar varios tamaños).
> 3. **`robots.txt`** público (allow all en públicas, disallow en `/admin/*` y `/login`).
> 4. **Sitemap** dinámico que liste landing, menú, galería.
> 5. **Loading states** y **error boundaries** en todas las páginas.
> 6. **Empty states** con copy foodie ("Pronto vamos a tener nuevos sabores 🍞").
> 7. **Optimización de imágenes:** asegurar que todas usen `next/image` con `sizes` apropiados.
> 8. **Lighthouse audit:** apuntar a >90 en mobile en Performance y Accessibility. Corregir lo que aparezca.
> 9. **Accesibilidad:** alt text en imágenes, focus states visibles, contraste AA.
> 10. **Validar el deploy de Vercel** una última vez con todo.

**Commit + push final.**

---

## 🧪 Checklist de verificación final

- [ ] La web pública se ve y funciona perfecto en un iPhone real (no solo en DevTools).
- [ ] Cliente puede armar pedido y se redirige a WhatsApp con mensaje pre-cargado correcto.
- [ ] El pedido queda guardado en Firestore con todos los datos.
- [ ] Anna entra con su Google y accede al admin; cualquier otro email es rechazado.
- [ ] Anna puede crear/editar/eliminar productos, subir imágenes, marcar activos/inactivos.
- [ ] Anna ve los pedidos en tiempo real, cambia estados, marca cobrados.
- [ ] Anna puede cargar pedidos manuales desde el admin.
- [ ] Anna gestiona galería y reseñas.
- [ ] Las analíticas muestran datos reales y los gráficos se ven bien.
- [ ] Push a `main` deploya automáticamente en Vercel.
- [ ] Reglas de Firestore y Storage están deployadas y son seguras.
- [ ] Lighthouse mobile >90.

---

## 🌐 Post-launch (opcional, para después)

- Conectar dominio propio (ej: `fermentofocacceria.com`) en Vercel.
- Notificación push o email a Anna cuando entra un pedido nuevo (Cloud Function + FCM o Resend).
- PWA: instalable en home screen del celular.
- Programación de horarios de apertura ("hoy no estamos haciendo pedidos" como toggle en ajustes).
- Sistema de cupones/descuentos.
- Integración con Mercado Pago si en algún momento quieren pago online.

---

## 📝 Notas para vos mientras ejecutás

- **Andá fase por fase**, no le pidas todo de una a Claude Code. Validá cada commit en Vercel antes de seguir.
- Si Claude Code propone librerías distintas a las de este `.md`, podés aceptarlas si tienen sentido (ej: si dice "mejor usar TanStack Query para fetch", evaluá; pero mantenelo simple).
- **El email de admin** debe quedar bien definido en `.env.local`, en Vercel y **hardcodeado en `firestore.rules` y `storage.rules`**. Es el único lugar donde Firebase no acepta env vars.
- **Si se rompe algo**, leé el log de Vercel + la consola del browser. El 90% de los errores van a ser env vars faltantes en Vercel.
- **Testing manual sugerido**: probá el flujo de pedido en modo incógnito desde el celular antes de cantar victoria.

¡Buena suerte y que vendan muchas focaccias! 🍞✨
