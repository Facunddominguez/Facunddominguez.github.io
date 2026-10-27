# Mi Plato Fácil

App web para armar comidas con el método del plato, planificar la semana, guardar recetas, hacer la lista de compras y llevar la despensa. Funciona en el celular, se puede instalar como app y anda sin conexión.

## Cómo se usa

- **Publicada:** abrí la dirección de GitHub Pages de este repositorio en el celular y elegí **Instalar aplicación** (o **Agregar a pantalla de inicio**).
- **Sin publicar:** también se puede abrir `index.html` directamente desde el dispositivo.

## Cómo está organizada la app

La barra de abajo tiene cinco pestañas:

- **Hoy:** tus comidas de hoy según el plan, con **Lo comí** en un toque (queda en *Lo que comí*, sin cambiar el plan), y los atajos para armar un desayuno, un almuerzo o el plato del día.
- **Semana:** el plan semanal.
- **Compras:** la lista que sale del plan, más los productos que agregás vos.
- **Mis comidas:** tus platos guardados.
- **Más:** ideas (sugerir al azar, con lo que tengo), días de entrenamiento y ajustes (tema, respaldo, asistente de IA y modo simple).

Cada pestaña recuerda dónde quedaste (por ejemplo, un plato a medio armar). Tocar la pestaña activa, o el botón de arriba, vuelve a su inicio.

## Modo simple

La app arranca en **modo simple**: muestra lo necesario para armar comidas, planificar la semana, hacer las compras y registrar lo que comiste. Las herramientas avanzadas quedan ocultas, no borradas: sus datos siguen guardados y en uso (por ejemplo, las existencias siguen sugiriendo en Compras).

- **Ocultas en Compras:** presupuesto, compras realizadas, existencias con cantidad, precios, costos y cálculos por receta.
- **Ocultas en Recetas:** revisar una idea, recomendaciones por costo, orden de resultados, mis cantidades por receta, ingredientes equivalentes y descontar de la despensa.
- **Ocultas en el Plan:** variaciones, semanas por fecha, vista del mes, historial de cambios y objetivos semanales.

Para verlas: **Más → Modo simple**, o el botón **Mostrar herramientas avanzadas** al final de Compras, Recetas y Plan. Es un ajuste de cada dispositivo: no va en los respaldos.

## Tus datos

- Todo lo que cargás (platos, recetas, plan, compras, despensa) queda **solo en tu dispositivo**, en el almacenamiento del navegador. Este repositorio contiene únicamente el código de la app: no se sube ningún dato personal.
- Cada dirección guarda sus propios datos. Para pasarlos de un dispositivo o dirección a otra, usá **Más → Respaldo y restauración → Descargar respaldo JSON** y después **Restaurar** en el otro lado.
- Si publicás una copia de prueba, ponela en otro sitio: dos copias en el mismo sitio (por ejemplo, el mismo usuario de GitHub Pages) comparten los mismos datos.

## Nutrición

Los valores nutricionales vienen de **USDA FoodData Central** (Departamento de Agricultura de EE. UU.), de dominio público (CC0 1.0):

- **Foundation Foods**: la base que USDA actualiza unas dos veces por año.
- **SR Legacy**: la base histórica (versión final de 2018), con porciones caseras como taza, cucharada o unidad.

`datos/nutricion-mapa.json` relaciona cada ingrediente en español con su alimento de USDA. Una tarea automática (`.github/workflows/actualizar-nutricion.yml`) revisa todos los meses si hay datos nuevos, actualiza `datos/nutricion.json` y vuelve a publicar la app. Cada alimento tiene su ficha en https://fdc.nal.usda.gov/.

Los valores son aproximados y no reemplazan el consejo de un profesional.

## Asistente de IA

- **Con tu app de IA** (ChatGPT, Gemini u otra): la app arma el pedido, lo copiás o compartís y después pegás la respuesta. No necesita configuración.
- **Gemini directo:** con una clave gratuita de Google AI Studio que se guarda solo en tu dispositivo (nunca en este repositorio ni en los respaldos). En el plan gratis, Google puede usar lo que se envía para mejorar sus productos: la app solo envía el texto de la receta o los nombres de ingredientes.

La IA solo propone borradores: nada se guarda hasta que lo revisás y tocás Guardar.

## Diseño

- **Verde:** acciones y selección. **Rojo:** cualquier botón que borre datos guardados.
- Un solo tipo de botón secundario; los botones que alternan (por ejemplo Pendientes/Todos) muestran cuál está activo.
- Botones sueltos a todo el ancho; chips de 44 px de alto; casillas de tamaño normal junto a su texto.
- En el inicio, todas las entradas son tarjetas iguales (emoji, título y descripción) y cada categoría conserva su color.
- Las reglas están al final de `fuente/estilos.css` ("Sistema de diseño") y las controla `pruebas/d01_diseno.js`.

## Cómo está organizado

| Carpeta o archivo | Qué hay |
|---|---|
| `index.html`, `sw.js` | La app publicada. **No se editan a mano**: se generan desde `fuente/`. |
| `fuente/cuerpo/` | El HTML: encabezado, una parte por pantalla (`pantallas/`) y cierre. |
| `fuente/estilos.css` | Los estilos. |
| `fuente/codigo/` | El código, dividido por tema. Los archivos se unen en orden según su número. |
| `fuente/version.json` | El número de versión. |
| `datos/` | Datos de nutrición (mapa curado y valores generados). |
| `herramientas/` | `construir.mjs` arma la app, `probar.mjs` corre las pruebas, `actualizar-nutricion.mjs` baja los datos de USDA. |
| `pruebas/` | Pruebas automáticas (solo con datos inventados). |
| `.github/workflows/` | Tareas automáticas de GitHub: publicar, probar y actualizar la nutrición. |

## Cómo hacer un cambio

Con [Node.js](https://nodejs.org/) 18 o superior instalado:

1. Editá los archivos de `fuente/` (y subí el número en `fuente/version.json`).
2. `node herramientas/construir.mjs` → genera `index.html` y `sw.js`.
3. `node herramientas/probar.mjs` → corre todas las pruebas en Chrome o Edge sin ventana.
4. Subí los cambios a `main`: GitHub vuelve a correr las pruebas y, si pasan, publica la app.
