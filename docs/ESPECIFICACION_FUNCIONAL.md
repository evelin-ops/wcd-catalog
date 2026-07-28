# WCD Marketplace — Especificación funcional

## Estado actual
Versión de trabajo: 2.2.

## Alcance principal
1. Catálogo público disponible en celular y computadora.
2. Productos y promociones visibles para cualquier visitante.
3. Un solo nivel de precio público, elegido por administración.
4. Carrito y envío del pedido por WhatsApp.
5. Panel administrativo para Excel, imágenes, marcas, PDF, promociones y usuarios.
6. Vendedores con nombre, apellido y código único; solo podrán escoger niveles autorizados.
7. Tres administradores completos y un editor limitado.
8. Publicación permanente mediante GitHub, Cloudflare Pages y Supabase.
9. PWA instalable como fase posterior.

## Niveles detectados en el Excel
A1, B2, C3, D4, E5, F6, G7, H8 e I9.

La columna `Price $` del archivo recibido está vacía en las 489 filas con producto. Por eso, en esta etapa se importan los nueve niveles con valores. `SP` se conserva como opción “sin precio”, pero no genera registros en `product_prices`.

## Decisiones confirmadas
- No habrá cuentas para clientes.
- Todo visitante verá el mismo nivel público.
- Solo los vendedores iniciarán sesión para cambiar entre niveles permitidos.
- El editor no podrá administrar roles, permisos ni configuraciones críticas.

## Próximo bloque
- Cargar `product_prices` desde Excel.
- Leer el nivel público desde `app_settings`.
- Agregar acceso de administradores y vendedores.
- Crear panel de administración.


## Avance v2.2 — Vista previa del Panel Administrativo

- Se agregó la ruta `/admin`.
- Se diseñó un menú lateral adaptable a celular y computadora.
- Se creó el Dashboard visual con métricas, estado del sistema, asistente de actualización y actividad reciente.
- Los demás módulos aparecen como pantallas provisionales para validar la navegación.
- Esta versión todavía no incluye autenticación ni acciones de carga reales.


## Avance 27/07/2026 - Módulo Productos
- Consulta de productos desde Supabase.
- Búsqueda por código, descripción o marca.
- Filtros de marca, categoría y estado.
- Indicadores de productos activos y faltantes de imagen.
- Tabla paginada de solo lectura para validación inicial.
- La edición directa se habilitará después de aprobar esta vista.
