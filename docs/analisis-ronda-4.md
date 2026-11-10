# Análisis para la Ronda 4 (v17.6.0)

Hecho el 10/11/2026 sobre `main` (`dab7857`, v17.6.0), en la rama `analisis-ronda-4`. No se cambió código: solo se agregan este documento y las capturas de `docs/capturas-ronda-4/`.

## Cómo se midió

- **Recorrido como usuario nuevo** con Playwright (toques reales, sin atajos de código): bienvenida completa (3 días de rutina, 2 personas, presupuesto $90.000, 3 ideas), semana armada, lista de compras y las cinco pestañas. A 390×844 y 320×844, en tema claro y oscuro.
- **Recorrido como alguien que la usa hace 4 semanas**: `pruebas/fixtures/respaldo-v14.9.94.json` más datos inventados (hogar de 2, tres "Mi precio" de hace 70 a 82 días). Hoy con "Lo comí", semana nueva ("¿Repetís el plan?"), menú ⋯, hoja de un hueco, "Rehacer la semana entera", semana que viene, tachar 6 productos, "Terminé de comprar", compartir la lista, Despensa, Comidas, detalle, Ideas y las 8 pantallas de Más. Mismos anchos y temas.
- **`herramientas/capturas.mjs`** a 390 y 320 px: 27 vistas × 3 estados × 2 temas (324 medidas).
- **`node herramientas/probar.mjs`** completo, y las tres baterías que fallan también sobre el commit anterior (`188e698`).
- **Datos**: `datos/precios.json` (119 ítems), `datos/precios-mapa.json` (134), `datos/precios-notas.json`, `datos/nutricion.json` (200), `datos/envases.json` y el catálogo de ideas, leídos y cruzados con scripts; el costo y la energía de semanas armadas con 1, 2 y 4 personas se calcularon dentro de la app.
- **GitHub Actions**: historial de corridas de `main`.

Lo que no se pudo hacer: abrir el sitio publicado (el entorno bloquea `facunddominguez.github.io`). Lo que se dice de la publicación sale de las corridas de Actions.

## Medidas

| Medida | Resultado |
|---|---|
| Toques de la bienvenida a la semana armada | 13 con todo cargado (rutina, personas, presupuesto y 3 ideas); 7 por el camino corto ("Ahora no" dos veces) |
| Toques hasta la lista de compras | 14 (uno más: la pestaña Compras) |
| Tiempo para armar la semana | 110 a 210 ms de cálculo; 1,4 s desde el toque hasta la pantalla lista |
| Arranque | 300 ms la primera carga y 70 a 85 ms las siguientes (en este equipo). `index.html` pesa 858.548 bytes (229 KB con gzip) |
| Errores de consola y pedidos a internet | 0 y 0 en los dos recorridos, los dos anchos y los dos temas |
| Productos de la lista sin precio real | 2 de 37 (usuario nuevo) y 2 de 29 (4 semanas): cebolla de verdeo, puerro y quinoa. 95 % y 93 % con precio real |
| Textos cortados, superposiciones, scroll horizontal y contraste (`capturas.mjs`) | 0 en las 324 medidas |
| Controles de menos de 44 px | Chips de los días en Semana: 43×63 a 390 px y **33×63 a 320 px**. Casillas de la lista: de 13 a 24 px de ancho. "← Hoy" de la cabecera: 40 px de alto. Días del calendario de Mi rutina: 31 a 38 px de ancho. Enlaces de Fuentes y de IA: 17 px de alto |
| Pruebas | `TOTAL 607/610` en `main`: fallan E19-plausibilidad y E20-sin-cero, y `e24_semana_clara.js` se interrumpe (sus 5 pruebas no corren). Con el commit anterior pasan las tres baterías |
| Energía de la semana que arma la app (1 persona) | Entre 1.007 y 1.582 kcal por día (media ≈ 1.340), 77 a 103 g de proteína, sin contar el aceite |
| Semana más barata que puede armar | ≈ $57.100 para 1 persona, ≈ $92.900 para 2 y ≈ $169.700 para 4 (GBA) |

## Lo que funciona bien y no hay que tocar

- **Respaldo y restauración.** De las 35 claves `miPlatoFacil_*` que usa el código, 33 están en el respaldo; `uiMode_v1` y `aiSettings_v1` quedan fuera a propósito. El respaldo de ejemplo se restaura byte a byte (K01) y cada clave nueva tiene su validador.
- **Un solo costo.** El total coincide en el aviso, Semana, Compras y la barra de presupuesto, y lo estimado se marca.
- **Cobertura de precios.** Con los datos del 4/11, 107 ítems tienen SEPA y 40 INDEC; las listas de los recorridos quedaron en 93 a 95 % con precio real. La meta del 90 % de la Ronda 3 ya se cumple.
- **Rendimiento.** Arranca en menos de un tercio de segundo y arma la semana en 0,2 s. No hace falta optimizar nada.
- **Sin conexión y sin llamadas a internet.** Cero pedidos externos en todos los recorridos.
- **Pantallas.** Ningún texto cortado, superposición ni problema de contraste en 27 vistas, a 390 y 320 px, en los dos temas.
- **La bienvenida arma la semana** en 7 a 13 toques, con Deshacer.
- **Semana que viene, "Lo comí" con Deshacer, "Terminé de comprar" hacia la Despensa, "Descontar lo que tengo" y "Compartir lista"** funcionan de punta a punta.
- **La compuerta, los criterios y los revisores.** Se extienden; no se reescriben.
- **El formato de `miPlatoFacil_referencePrices_v1`** ("Mi precio" con fecha): alcanza para lo que propone la ronda, sin clave nueva para el precio.

## Tabla de mejoras

Veredicto: **I** imprescindible · **V** vale la pena · **N** no conviene. Impacto y esfuerzo: alto, medio o bajo. "Riesgo" es el riesgo para los datos guardados.

| # | Área | Mejora | Evidencia | Impacto | Esfuerzo | Riesgo | Veredicto |
|---|---|---|---|---|---|---|---|
| 1 | Publicación | Que las pruebas no dependan de qué productos tienen precio hoy, y que la tarea de precios pruebe antes de guardar | `main` tiene 3 pruebas en rojo desde "Precios actualizados con SEPA e INDEC" (`dab7857`, 5/11): E19-plausibilidad (arándanos $31.120/kg y semillas de chía $23.367/kg quedan a más de 4 veces de la mediana y no están en `excepcionesPlausibilidad`), E20-sin-cero (espera que "Frutillas" no tenga precio, y ahora lo tiene) y `e24_semana_clara.js` (se interrumpe con "Cannot read properties of null (reading 'click')"). En `188e698` las tres pasan. En Actions, la corrida 41963019160 guardó los precios y después "publicar / pruebas" falló y "publicar / publicar" se salteó: **los precios del 5/11 están en `main` pero no se publicaron**, y cualquier PR nuevo va a salir en rojo | Alto | Bajo | Ninguno | **I** |
| 2 | Publicación | Subir el tope de tamaño de `index.html` con un criterio medido | `herramientas/construir.mjs` línea 59: falla si pasa de 860.000 bytes. Hoy pesa 858.548: quedan **1.452 bytes**. La próxima actualización de precios que sume datos rompe la construcción, y nada de esta ronda entra. Con gzip son 229 KB | Alto | Bajo | Ninguno | **I** |
| 3 | Bienvenida | Al terminar, la pestaña Hoy tiene que mostrar Hoy | Después de "Armar mi semana", tocar Hoy vuelve a mostrar "Paso 4 de 4 · Elegí de 3 a 5 ideas" con las ideas marcadas, hasta recargar. Captura `02-hoy-vuelve-a-la-bienvenida-390.png`. Causa: `switchTab()` (`32-pestanas.js`) recuerda la pila de la pestaña y `Bienvenida.terminarBienvenida()` (`40-primera-vez.js`) no la limpia | Alto | Bajo | Ninguno | **I** |
| 4 | Semana | El costo del día no puede cambiar solo | Después de "Rehacer la semana entera", un hueco queda sin costo y la línea dice "hoy ≈ $7.368"; al ir a otra pestaña y volver dice "hoy ≈ $8.771" y el hueco muestra ≈ $1.403. En el recorrido de 4 semanas ningún hueco mostró costo y la línea quedó sin "hoy". Mismo plan, sin tocar nada (`pintarCostoDia()` y `costosDelPlan()` en `43-precios.js`, llamados desde `45-armame-la-semana.js`) | Medio | Bajo | Ninguno | **I** |
| 5 | Catálogo | Catálogo propio con cantidades por persona, preparación y nombre corto (borrador, Etapa 26) | Hay 41 ideas con solo `text`, `tags` e `ingredientes`: ninguna tiene cantidades ni pasos. El detalle de una comida muestra chips sin cantidad ni cómo se hace (`06-comida-sin-cantidades-390.png`). La bienvenida ofrece las 8 primeras del catálogo: tacos de maíz con garbanzos especiados, pizza integral con puerro y verdeo, hummus de remolacha (`01-bienvenida-ideas-390.png`); milanesas, guisos y pastel de papa quedan al final y no aparecen. Solo 3 ideas llevan carne vacuna. Títulos de 48 caracteres de media y 22 de 41 con más de 45: en Semana se cortan con "…" | Alto | Alto | Bajo (campos nuevos en datos que no son del usuario) | **I**, con menos ideas (ver "Recortes") |
| 6 | Catálogo y nutrición | Porciones de adulto, controladas con una prueba de energía | La semana armada da ≈ 1.340 kcal por día. Causa: `gramosPorCuarto` de `datos/envases.json` usa 80 g para cualquier almidón (80 g de papa son 62 kcal) y 120 g de proteína; la avena del desayuno queda en 10 g. La lista de 2 personas pide "Papa: 160 g" para toda la semana. Quien come eso se queda con hambre y compra más: **el costo de la semana se queda corto** | Alto | Medio (va con el #5) | Ninguno | **I** |
| 7 | Presupuesto | Ideas y desayunos baratos, y un aviso útil cuando no alcanza | Con 2 personas y $90.000 la primera pantalla después de la bienvenida dice "No llego al presupuesto de $90.000: es lo más barato que pude armar" (≈ $110.803, `03-semana-no-llega-al-presupuesto-390.png`). Los tres productos que más pesan en la semana más barata de 1 persona son pan de molde integral $6.220, leche $5.100 y huevos $4.704; los dos primeros se usan solo en desayunos y meriendas. El pan común cuesta la mitad por kilo ($4.958 contra $9.718) y no se ofrece. El aviso no dice cuánto falta ni qué cambiar | Alto | Medio | Ninguno | **V** |
| 8 | Compras | Lista para usar en el súper con una mano | En `Compras.shoppingRow()` (`12-lista-de-compras.js`) tocar el nombre abre la ficha y tocar el precio abre el detalle: para tachar quedan la casilla y el texto del medio. A 320 px la casilla se achica hasta 13 px (`05-compras-320-oscuro.png`). La lista de 37 productos mide 3.770 px (4,5 pantallas) | Alto | Bajo | Ninguno | **V** |
| 9 | Compras | Cantidades que se puedan comprar y una sugerencia que no confunda | "Queso Port Salut descremado: 12 unidades", "Tortillas de trigo: 80 g" (hay envase de 8 en `envases.json` y no se usa), "Pan: 160 g". La lista sugiere "¿Cebolla de verdeo es lo mismo que Cebolla? Unir". El texto compartido usa los nombres largos ("Fideos y pastas (de trigo, maíz o arroz)") y la pantalla los cortos | Medio | Bajo | Ninguno | **V** |
| 10 | Semana | Cabecera más corta y avisos que no se acumulan | A 320 px la primera comida aparece a unos 700 px del borde de arriba: antes hay un aviso de 6 renglones, un segundo aviso viejo ("Listo: seguís con el mismo plan"), los objetivos y los chips (`04-semana-320-oscuro.png`). Al pasar de Hoy a Semana queda "Registrado como comido hoy. El plan no cambió". Íconos repetidos ("🍳 Desayuno" y "🍳 Banana…") y la merienda con el ícono del desayuno. Chips de los días de 33 px a 320 px | Medio | Bajo | Ninguno | **V** |
| 11 | Semana | "Armame la semana" respeta los objetivos | Con el objetivo "Pescado: 2 comidas", "Rehacer la semana entera" con presupuesto ajustado dejó "Pescado 0 de 2" y "Legumbres: 11 comidas" (`ArmameSemana.armar()` no lee `miPlatoFacil_habitGoals_v1`) | Medio | Bajo | Ninguno | **V** |
| 12 | Hoy | Costo del día y grupos del plato (borrador, Etapa 27, primera parte) | Hoy no muestra ningún costo ni qué grupos cubrís (`07-hoy-390.png`). Los datos ya existen: `costoDelDiaPlan()` y los `groups` de `miPlatoFacil_consumption_v1` | Medio | Bajo | Ninguno | **V** |
| 13 | Hoy | Compartir la semana como imagen de 1080×1350 (borrador, Etapa 27, segunda parte) | No existe. Sí existe compartir un plato como imagen (`Compartir.buildPlateCanvas()` y `Compartir.shareImage()` en `08-copiar-y-compartir.js`), que se puede reusar | Bajo | Medio | Ninguno | **V**, al final y junto con el texto |
| 14 | Precios | Tu precio al día (borrador, Etapa 25) | Un "Mi precio" de tomate de hace 82 días ($2.500/kg) se usó sin aviso; SEPA dice $6.590. `referencePrices_v1` ya guarda `date` en cada entrada. No hay ningún aviso de antigüedad | Medio | Bajo | Bajo (una clave nueva para "Sigue igual") | **V** |
| 15 | Precios | Frutas y verduras: mostrar el precio de verdulería además del de súper | En los 11 productos frescos que tienen las dos fuentes, SEPA (supermercados) queda arriba de INDEC en 10: papa +82 %, tomate +63 %, naranja +54 %, batata +52 %, limón +38 %, cebolla +33 %. Hoy gana siempre SEPA (`precioAuto()` en `43-precios.js`). INDEC es de septiembre y SEPA del 4/11, pero dos meses no explican esa diferencia | Medio | Bajo | Bajo (una preferencia nueva) | **V**, depende de una decisión tuya |
| 16 | Precios | Poner al día `datos/precios-notas.json` y revisar el yogur | `sinDato` lista 32 productos, y 16 ya tienen precio (frutilla, kiwi, arándanos, mandarina, pera, durazno, uva, ananá, ciruela, melón, sandía, mango, pomelo, granola, champiñones, semillas de chía). "Yogur natural" figura a $17.200 el litro y "Yogur descremado" a $8.667 el kilo: el mismo pote de 190 g cuesta $3.268 o $1.647 según el nombre | Medio | Bajo | Ninguno | **V** (va con el #1) |
| 17 | Datos | Respaldo sin olvidos (borrador, Etapa 29) | Todo vive en `localStorage` y no hay fecha del último respaldo ni aviso. La app tampoco pide almacenamiento persistente (`navigator.storage.persist()` no aparece en `fuente/`). Compartir el archivo se puede con el mismo camino que ya usa `Compartir.shareImage()` | Alto | Bajo | Bajo (una clave nueva) | **V** |
| 18 | Costumbre | Recordatorio en el calendario (borrador, Etapa 30) | No existe. Un `.ics` con un evento semanal se genera sin dependencias; hace falta que la app abra en "Semana que viene" desde un enlace | Bajo | Bajo | Ninguno | **V**, chico |
| 19 | Semana | "Armame la semana" usa primero la Despensa (idea suelta) | **Ya existe**: `despensaMatcher()` suma hasta 3 puntos por ingrediente que tenés (`45-armame-la-semana.js`, líneas 162 y 244). Falta decirlo: el aviso no cuenta cuánto de la Despensa aprovechó | Bajo | Bajo | Ninguno | **V**, solo el texto |
| 20 | Semana | Sobras y "cociná doble" (idea suelta) | **Ya existe**: el armado pone la cena de un día como almuerzo del siguiente y lo avisa ("Cociná doble: la cena del viernes es el almuerzo del sábado"); la lista suma las dos porciones | — | — | — | **N**: no hace falta más |
| 21 | Precios | Fruta suelta sin precio (idea suelta) | **Ya está resuelto con SEPA**: desde el 4/11 pomelo ($1.690/kg), mandarina ($1.890), pera ($3.890), durazno ($3.988) y ananá ($7.518) tienen precio en GBA con 742 a 2.963 observaciones y 3 a 11 comercios. El Mercado Central publica precios **mayoristas** en informes semanales; no encontré un archivo abierto para bajar, y un precio mayorista no sirve para estimar lo que se paga en la verdulería | — | — | — | **N** |
| 22 | Compras | Ticket del súper con foto e IA (idea suelta) | No existe. La IA de la app es Gemini con la clave de cada usuario (`29-asistente-ia.js`): quien no cargó una clave no la podría usar. Además manda la foto del ticket a Google, y un número mal leído pasaría a "Mi precio" y cambiaría todos los costos | Bajo | Alto | Medio | **N** |
| 23 | Precios | Dónde conviene comprar, por cadena (borrador, Etapa 28) | `herramientas/actualizar-precios.mjs` hoy guarda mediana y rango por región, no por cadena. Hacerlo pide cambiar la herramienta que baja 325 MB y que esta sesión no puede correr, sumar a `precios.json` unos 15 a 20 KB (estimado) (tope 60.000; hoy 43.623) y comparar productos que no son iguales entre cadenas. Almacenes, verdulerías y mayoristas, donde compra quien cuida el peso, no están en SEPA | Medio | Alto | Bajo | **N** en esta ronda (depende de una decisión tuya) |

## Recortes al borrador

- **Etapa 25 (tu precio al día):** se queda, pero no puede ir primera. Antes hay que poner `main` en verde, subir el tope de tamaño y arreglar los dos errores (#1 a #4).
- **Etapa 26 (catálogo):** imprescindible, con **100 ideas en vez de 150** (30 de desayuno y merienda, 70 de almuerzo y cena). Cada idea lleva cantidades, pasos y pruebas de energía, costo y precio; 150 escritas de una vez por un modelo, sin que nadie las cocine, bajan la calidad y suman unos 100 KB. Las 41 actuales no se borran: reciben cantidades, pasos y nombre corto.
- **Etapa 27:** el costo del día y los grupos van; la imagen va al final, junto con compartir la semana como texto.
- **Etapa 28 (cadenas):** afuera. En su lugar, el #15 (precio de verdulería) acerca el total a lo que se paga en el barrio, con datos que ya están.
- **Etapas 29 y 30:** van juntas en una sola etapa chica, más el pedido de almacenamiento persistente.
- **Se agregan** dos etapas que el borrador no tenía: la lista para el súper (#8 y #9) y la Semana más corta con objetivos (#10 y #11).

## Lo que no conviene hacer y por qué

- **Contar calorías en pantalla.** La app es el método del plato. La energía sirve como prueba interna de que las porciones son de adulto, no como número para el usuario.
- **Comparar cadenas con nombre** (#23): mucho esfuerzo, imposible de probar acá con datos reales y con riesgo de afirmar un ahorro que no es cierto.
- **Ticket con foto** (#22): pocos lo podrían usar y un error de lectura rompe la confianza en los costos.
- **Mercado Central** (#21): es mayorista y SEPA ya trae la fruta.
- **Achicar el archivo quitando comentarios o minificando.** Ahorraría unos 94 KB, pero cambia el resultado de `construir.mjs` y puede romper código que hoy anda. Subir el tope con un límite medido en gzip es más simple y se revierte en una línea.
- **Notificaciones push.** Piden un servidor. El calendario del teléfono hace lo mismo sin romper la regla 6.
- **Renombrar las 41 ideas.** Las comidas guardadas las encuentran por su texto (`IdeasHoja.ideaPorTexto()`). El nombre corto va en un campo nuevo.
- **Reescribir "cociná doble" o el uso de la Despensa.** Ya funcionan (#19 y #20).
- **Tocar el respaldo, la restauración o las migraciones que ya existen.** No se encontró ningún problema.

## Decisiones que te tocan

1. `main` está en rojo y los precios nuevos no se publican: ¿lo arreglo ya en un PR chico, o espera a la primera etapa de la ronda? ¿Y puede la ronda cambiar `.github/workflows/actualizar-precios.yml` para que pruebe antes de guardar?
2. Catálogo: ¿100 ideas bien probadas o las 150 del borrador?
3. Porciones de adulto: estimo que la semana más barata subiría entre 10 y 20 % (de unos $57.000 a entre $63.000 y $68.000 por persona; el número exacto sale al hacerlo). ¿Las subo?
4. Frutas y verduras: ¿gana el precio de verdulería (INDEC) cuando existe, o sigue ganando el de supermercado (SEPA)?
5. Dónde conviene comprar por cadena: ¿queda afuera, como propongo?
