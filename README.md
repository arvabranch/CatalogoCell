# CatálogoCell · iPhone Colombia

Catálogo web estático (HTML + CSS + JS, sin dependencias).

## Ver en local

```bash
python3 -m http.server 5173
```

Luego abre http://localhost:5173. (Se necesita un servidor porque `js/app.js` usa módulos ES.)

## Editar precios y modelos

Todo está en [`js/catalog.js`](js/catalog.js):

- `NEW_PHONES`: cada modelo tiene `colors` (los que se muestran) y `variants` (capacidad + colores a los que aplica + precio en COP).
- `MARGIN`: valor que se suma a todos los precios (hoy $200.000). Los precios de `variants` son los de la lista original.
- `cover`: color opcional para la foto de la tarjeta.

El visor 3D del detalle (girar el celular arrastrando) está en [`js/viewer.js`](js/viewer.js).

Las imágenes están en `img/phones/` con el formato `<modelo>-<color>.webp`.

## Panel de administración

Abre `admin.html` desde el catálogo o directamente en el navegador. El acceso inicial es `admin` / `admin123`; cambia la contraseña desde el panel después del primer ingreso.

El proyecto no tiene servidor ni base de datos. La sesión y los productos se guardan en el almacenamiento local del navegador, por lo que los cambios solo aparecen en ese navegador. Para publicar cambios para todos los visitantes, conecta el panel a una API y una base de datos.
