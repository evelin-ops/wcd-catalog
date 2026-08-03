# WCD Marketplace 2.5 — Home Profesional

## Incluido
- Hero administrable con textos, imagen y enlaces configurables.
- Sección Productos Nuevos con interruptor, título, cantidad y orden.
- Hasta 3 promociones principales administrables con imagen, título, descripción, botón, enlace, color y vigencia.
- Secciones generadas desde las categorías de productos con iconos SVG de Lucide.
- Diseño responsive para escritorio, tablet y móvil.
- Nuevos módulos del Panel Administrativo: Productos nuevos, Promociones Home y Secciones.

## Estado de almacenamiento
En esta fase de revisión, la configuración visual se guarda en localStorage del navegador. La conexión global de estas configuraciones a Supabase se realizará antes de publicar la versión final en la web.

## Ejecutar
1. Abrir una terminal en la carpeta del proyecto.
2. Ejecutar `npm install`.
3. Ejecutar `npm run dev`.
4. Marketplace: `/`
5. Panel: `/admin`

## Ajuste 2.5.1
- Inicio simplificado: Productos Nuevos, Promociones Destacadas y Compra por Categoría.
- Eliminada la sección “Oportunidades para tu negocio”.
- “Promociones disponibles” solo aparece al abrir la pestaña Promociones.
- “Todos los productos” solo aparece al abrir la pestaña Productos o una categoría.
- Productos Nuevos ahora se seleccionan manualmente por ITEM #, código, nombre o marca desde Admin.
- Las categorías permiten cambiar ícono SVG y color desde Admin.
