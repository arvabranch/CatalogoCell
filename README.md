# CatálogoCell · iPhone Colombia
#v0.3
Catálogo web (HTML + CSS + JS) con panel de administración conectado a una base de datos Neon (Postgres) mediante funciones de Vercel en `api/`.

## Configuración

1. Crea un archivo `.env` en la raíz con la conexión de Neon (nunca se sube a GitHub):

   ```
   DATABASE_URL=postgresql://...
   ```

2. Instala dependencias y prepara la base de datos (crea las tablas, carga el catálogo inicial y el usuario `admin`). Se puede correr varias veces sin borrar nada:

   ```bash
   npm install
   ```

   ```bash
   npm run db:setup
   ```

3. En Vercel, agrega la misma variable `DATABASE_URL` en *Settings → Environment Variables* del proyecto y vuelve a desplegar.

## Ver en local

```bash
npm run dev
```

Abre http://localhost:5173 (catálogo) y http://localhost:5173/admin/ (panel). El servidor local imita Vercel: sirve las páginas y las funciones de `api/`.

## Cómo funciona

- **Catálogo público** (`index.html`, `js/app.js`): carga los productos desde `GET /api/catalog`. Si el servidor no responde, muestra el catálogo incluido en [`js/catalog.js`](js/catalog.js).
- **Panel** (`/admin/`, `js/admin.js`): crea, edita y elimina productos, sube fotos, agrega colores y cambia la contraseña. Los cambios se guardan en Neon y se ven en el catálogo de todos los clientes en pocos segundos.
- **API** (`api/`): `catalog`, `login`, `logout`, `session`, `password`, `phones`, `colors` e `image`. Las rutas que modifican datos exigen sesión de administrador (cookie firmada, solo del mismo sitio). Las contraseñas se guardan cifradas con scrypt y hay bloqueo temporal tras varios intentos fallidos.
- **Base de datos**: tablas `phones` (cada producto como JSON), `colors`, `images` (fotos subidas), `admin_users`, `settings` y `login_attempts`. El esquema está en [`api/_lib/defaults.js`](api/_lib/defaults.js).

Los precios que se guardan son los finales: el cliente ve exactamente lo que se escribe en el panel. [`js/catalog.js`](js/catalog.js) solo define el catálogo inicial (y el botón "Restablecer Original" del panel).

El visor 3D del detalle (girar el celular arrastrando) está en [`js/viewer.js`](js/viewer.js). Las imágenes del catálogo inicial están en `img/phones/` con el formato `<modelo>-<color>.webp`.

## Páginas legales

- `/terminos/`: Términos y Condiciones (precios, formas de pago, entregas, garantía, marcas).
- `/privacidad/`: Política de Tratamiento de Datos Personales (Ley 1581 de 2012).

Los datos del negocio (nombre, WhatsApp, correo) se editan en `BUSINESS` dentro de [`js/catalog.js`](js/catalog.js). El correo aparece en las páginas solo cuando se completa. Haz revisar los textos con un abogado antes de usarlos como definitivos.

## Panel de administración

El panel está en `/admin/`. No tiene enlace desde el catálogo público; las credenciales se entregan aparte en el PDF de acceso.

## Seguridad

- Cabeceras de seguridad en [`vercel.json`](vercel.json): política de contenido (CSP) que solo permite código del propio sitio, HTTPS obligatorio (HSTS), bloqueo de iframes (clickjacking), `nosniff` y permisos del navegador desactivados. El panel `/admin/` no se indexa ni se guarda en caché.
- Las páginas no usan código en línea (`onclick`, `onerror`, `<script>` sin archivo) para que la CSP pueda ser estricta. Mantén esa regla al editar.
- `.env` nunca se sube a GitHub, y `.vercelignore` evita publicar `scripts/` y archivos locales.
- Login con contraseña cifrada (scrypt), cookie `HttpOnly`/`Secure`/`SameSite=Strict`, verificación de origen y bloqueo de 15 minutos tras 8 intentos fallidos.
- La contraseña inicial `admin` / `admin123` es pública en este repositorio: cámbiala desde el panel en el primer ingreso.
