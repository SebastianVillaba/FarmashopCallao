# Farmashop · API

```bash
npm install
npm run dev     # desarrollo (nodemon)
npm start       # producción
```

Variables de entorno: ver `.env.example`.

## Base de datos

Ejecutar una vez, en orden, sobre la base `farmashop` (SQL Server 2008 R2, compatibilidad 90):

1. `sql/001_web_pedidos.sql`: pedidos web.
2. `sql/002_admin_panel.sql`: panel administrativo (usuarios, configuración, banners, datos web de productos, analítica y auditoría).

Ninguno modifica tablas del ERP: sólo crean tablas nuevas, algunas con FK hacia `usuario` y `producto`.
Por la versión del servidor **no usar** `CONCAT`, `OFFSET/FETCH`, `IIF`, `FORMAT`, `TRY_CONVERT` ni `STRING_AGG`.

## Panel administrativo (`/admin`)

Sólo ingresan usuarios del ERP habilitados en `usuarioWeb`. La contraseña del panel es propia (bcrypt) e independiente de la del ERP.
Si el usuario se desactiva en el ERP, pierde el acceso.

Primer administrador:

```bash
npm run crear-usuario -- <nick_del_erp> <contraseña> admin
```

Después, los administradores habilitan al resto desde **Panel → Usuarios**.

Requisitos:
- `JWT_SECRET` en el `.env` (mín. 32 caracteres aleatorios).
- En producción: `NODE_ENV=production` y HTTPS. La cookie de sesión es `Secure` y la cámara del navegador sólo funciona con HTTPS.
- `BANNERS_DIR` es opcional. Por defecto se usa la carpeta `banners` al lado de `IMAGES_DIR`.

### Fotos de productos
Se guardan en `IMAGES_DIR` como `{codigo}.webp` (principal) y `{codigo}_N.webp`, en WebP de 1200 px con fondo blanco.

Cámara Nikon COOLPIX B700: conectar su salida micro-HDMI a una capturadora HDMI-USB (UVC). Windows la reconoce como webcam y aparece en el selector de cámara del panel.
Para máxima resolución, sacar la foto con la cámara y usar "Subir archivos".

### Precios web
- **Precio Farmashop**: es el que se muestra y se cobra. Si no se carga, se usa `producto.precio` del ERP. Si una oferta vigente del ERP deja el precio todavía más bajo, se usa la oferta.
- **Precio recomendado**: se muestra tachado.
- El pedido siempre recalcula el precio en el servidor (`src/utils/webProductos.js` → `precioWeb`).

### Analítica
- `POST /api/t` registra sesiones (fuente por UTM, gclid/fbclid o referrer) y eventos del embudo. No guarda IP.
- Google Analytics 4 es opcional: se configura el ID en **Panel → Temática** y se carga sólo con el consentimiento del visitante.
