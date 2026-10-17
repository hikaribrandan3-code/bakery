# MIGA · tienda de panadería

Tienda mobile-first para MIGA Panadería & Pastelería. Mantiene los patrones de catálogo, carrito, pedido por WhatsApp, identidad por teléfono y panel del local de las otras tiendas, con una API propia para esta tienda.

## Vista previa

Desde esta carpeta ejecutá `npm run dev` y abrí `http://localhost:5184/`. La vista previa de desarrollo permite entrar al panel sin clave solo desde esta computadora. Para el teléfono, abrí la dirección de red que Vite muestra en la terminal; el panel requiere `MIGA_ADMIN_TOKEN` cuando se accede desde la red.

## Puesta en marcha

Requiere Node.js 22 o posterior. Copiá `.env.example` a `.env` y completá `MIGA_WHATSAPP` con el número del negocio en formato internacional, sin `+` ni separadores. Configurá `MIGA_ADMIN_TOKEN` con una clave aleatoria de al menos 20 caracteres. Podés ajustar `PORT` y `MIGA_DATA_DIR`.

```sh
npm ci
npm run check
npm test
npm run build
npm start
```

El servidor sirve la web y `/api` en el mismo origen. Ejecutalo en un host Node persistente y montá `MIGA_DATA_DIR` en un disco persistente: el catálogo, stock, ajustes, pedidos, clientes y puntos se guardan en SQLite. El modo demo deja guardar pedidos de muestra y enseña el mensaje que se abriría en WhatsApp. En la operación real, la persona revisa y envía el mensaje desde WhatsApp; el local actualiza el estado del pedido en el panel.

## Recorrido de compra

- Inicio, productos del día, categorías, detalle de torta y box personalizable de 12 unidades.
- Quick add, carrito editable, nota al horno, retiro o delivery, fechas/horarios y datos del cliente.
- El servidor vuelve a calcular precios, comprueba horarios, stock y configuración, registra el pedido de forma idempotente y suma puntos por teléfono.
- Panel en `/admin`: resumen, pedidos y estados, WhatsApp del local, productos y stock, clientes/puntos, dirección, horarios, delivery y configuración.
- Enlace de Hikari Studio en el pie de página.

El número, dirección, horarios, precios, stock e Instagram de muestra deben reemplazarse por los datos reales antes de aceptar pedidos reales.
