# Ronda 4: la semana que se puede cocinar y pagar

## Contexto

Las rondas 1, 2 y 3 y los arreglos v17.6 ya están en `main` (v17.6.0). Leé completos `CLAUDE.md`, `docs/plan-rediseno.md` (reglas, rondas anteriores y Registro) y `docs/analisis-ronda-4.md` (el análisis del que sale este plan, con sus capturas en `docs/capturas-ronda-4/`).

Las reglas de `CLAUDE.md`, la compuerta (`herramientas/validar-etapa.mjs`), los criterios (`docs/validacion/criterios.json`), las capturas (`herramientas/capturas.mjs`) y los revisores (`.claude/agents/`) siguen vigentes: se extienden, no se reescriben.

Objetivo: que la semana que arma la app se pueda cocinar (cantidades y pasos), alcance para un adulto, cueste lo que de verdad se paga en el barrio y se compre con una mano en el súper. Pensá cada decisión como alguien que el domingo arma la semana en el celular, con un presupuesto ajustado.

Trabajás solo, de la Etapa 25 a la 32, sin esperar entre etapas. La única intervención del dueño es el merge final a `main`.

Decisiones que ya tomó el dueño (no las vuelvas a preguntar):

1. `main` se arregla dentro de esta ronda, en la Etapa 25. No se toca ningún archivo de `.github/workflows/`.
2. El catálogo queda en 100 ideas: 70 de almuerzo y cena, y 30 de desayuno y merienda.
3. Las porciones pasan a ser de adulto, aunque el total de la semana suba.
4. Preferencia nueva "Compro frutas y verduras en: verdulería / supermercado", con verdulería por defecto. La ficha muestra los dos precios.
5. Comparar cadenas de supermercados queda afuera. Tampoco se hace el ticket con foto ni se usa el Mercado Central.

## Lo que encontré (v17.6.0, recorrido real a 390 y 320 px, tema claro y oscuro)

- **`main` está en rojo.** `node herramientas/probar.mjs` da `TOTAL 607/610`. Fallan E19-plausibilidad (arándanos $31.120/kg y semillas de chía $23.367/kg no están en `excepcionesPlausibilidad`), E20-sin-cero (espera que "Frutillas" no tenga precio, y ahora lo tiene) y `e24_semana_clara.js` (se interrumpe con "Cannot read properties of null (reading 'click')"). Con el commit anterior (`188e698`) las tres pasan: la causa es que esas pruebas leen el `datos/precios.json` del día. La tarea semanal de precios guardó los datos del 5/11 y después no pudo publicar.
- **`index.html` pesa 858.548 bytes y el tope de `herramientas/construir.mjs` es 860.000.** Quedan 1.452 bytes. Con gzip son 229 KB.
- **`docs/validacion/linea-base.json` dice 607 pruebas y hay 614.**
- **Bienvenida:** después de "Armar mi semana", tocar la pestaña Hoy vuelve a mostrar "Paso 4 de 4 · Elegí de 3 a 5 ideas" hasta recargar. `switchTab()` (`32-pestanas.js`) recuerda la pila de la pestaña y `Bienvenida.terminarBienvenida()` (`40-primera-vez.js`) no la limpia.
- **Semana:** después de "Rehacer la semana entera", un hueco queda sin costo y la línea dice "hoy ≈ $7.368"; al ir a otra pestaña y volver dice "hoy ≈ $8.771". Mismo plan, sin tocar nada.
- **Catálogo:** 41 ideas con `text`, `tags` e `ingredientes`; ninguna tiene cantidades ni preparación. Los títulos miden 48 caracteres de media (22 de 41 pasan de 45) y se cortan en Semana. La bienvenida ofrece las 8 primeras: tacos de maíz con garbanzos especiados, pizza integral con puerro, hummus de remolacha. Solo 3 ideas llevan carne vacuna.
- **Porciones:** la semana armada para 1 persona da entre 1.007 y 1.582 kcal por día (media ≈ 1.340). `gramosPorCuarto` de `datos/envases.json` usa 80 g para cualquier almidón (80 g de papa son 62 kcal) y la avena del desayuno queda en 10 g. La lista de 2 personas pide "Papa: 160 g" para toda la semana.
- **Presupuesto:** la semana más barata que arma la app cuesta ≈ $57.100 para 1 persona y ≈ $92.900 para 2. Con 2 personas y $90.000, la primera pantalla después de la bienvenida dice "No llego al presupuesto", sin decir cuánto falta ni qué pesa más. Los desayunos solo ofrecen pan de molde ($9.718/kg); el pan común cuesta $4.958/kg.
- **Lista de compras:** en `Compras.shoppingRow()` (`12-lista-de-compras.js`) tocar el nombre abre la ficha y tocar el precio abre un detalle; para tachar quedan la casilla de 24 px y el texto del medio. A 320 px la casilla se achica hasta 13 px. Hay filas como "Queso Port Salut descremado: 12 unidades" y "Tortillas de trigo: 80 g". La lista sugiere "¿Cebolla de verdeo es lo mismo que Cebolla?". El texto compartido usa nombres largos y la pantalla, cortos.
- **Semana a 320 px:** la primera comida aparece a unos 700 px del borde de arriba. Antes hay un aviso de 6 renglones, un segundo mensaje viejo en `#planStatus`, los objetivos y los chips. La comida lleva el ícono repetido ("🍳 Desayuno" y "🍳 Banana…") y la merienda, el del desayuno. Los chips de los días miden 43 px de ancho a 390 px.
- **Objetivos:** con "Pescado: 2 comidas" en `miPlatoFacil_habitGoals_v1`, "Rehacer la semana entera" dejó "Pescado 0 de 2" y "Legumbres: 11 comidas".
- **Hoy** no muestra costo ni grupos del plato.
- **Mi precio viejo:** un precio propio de tomate de hace 82 días ($2.500/kg) se usó sin aviso; SEPA dice $6.590.
- **Verdulería contra súper:** en los 11 productos frescos con las dos fuentes, SEPA queda arriba de INDEC en 10 (papa +82 %, tomate +63 %, naranja +54 %, batata +52 %). Hoy gana siempre SEPA.
- **`datos/precios-notas.json`** lista 32 productos en `sinDato` y 16 ya tienen precio. "Yogur natural" figura a $17.200 el litro y "Yogur descremado" a $8.667 el kilo.
- **Respaldo:** no hay fecha del último respaldo ni aviso, y la app no pide almacenamiento persistente.

## Lo que ya existe y conviene reusar

- `preciosDataset.data` (`43-precios.js`): si se le asigna un objeto, la app usa esos precios en vez de `PRECIOS_SNAPSHOT`. Hay que poner `preciosDataset.cache = null` y llamar a `refrescarPrecios()` (así lo hacen `e7_precios.js` y `e9_sepa.js`).
- `node herramientas/construir.mjs --salida <carpeta>`: construye en otra carpeta sin tocar `index.html`.
- Costos: `costoDeFilas()`, `costoDeIngrediente()`, `costoDelDiaPlan()`, `costoSemanaPlan()`, `preciosDeLaLista()`, `costosDelPlan()`, `pintarCostoDia()`.
- Energía de una fila: `gramosDe(nombre, q, unidad)` y `nutritionFor(nombre).v` (`v[0]` son las kcal y `v[1]` las proteínas, cada 100 g).
- Mi precio: `fichaPrecio()`, `misPreciosDe()`, `miPrecioDe()`, `guardarMiPrecio()`. Cada entrada de `miPlatoFacil_referencePrices_v1` ya trae `date`.
- Ideas: `IdeasHoja.ideaComoComida()`, `IdeasHoja.guardarIdea()` (escribe `note = idea.text.slice(0, 80)`), `IdeasHoja.ideaPorTexto()`, `Bienvenida.ideasParaArrancar()`.
- Cantidades: `cantidadesDePlatoArmado()`, `cantidadesDeComida()`, `unidadParaCompra()`, `envasar()`, `datosEnvases()` (`44-cantidades-de-platos.js`).
- Armado: `ArmameSemana.armar({ modo, primero })`, `candidatosPlato()`, `candidatosDesayuno()`, `filasDe()`, `despensaMatcher()` (ya suma hasta 3 puntos por ingrediente de la Despensa), `dobles` (ya propone "cociná doble"), `resumen()`, `avisoDe()`, `cambiarHueco()`.
- Objetivos: `loadHabitGoals()` y `FOOD_GROUPS` (`24-consumo-y-habitos.js`).
- Compartir: `Compartir.buildPlateCanvas()`, `Compartir.roundRect()`, `Compartir.wrapText()` y `Compartir.shareImage()` (`08-copiar-y-compartir.js`); `Compras.comprasText()` y `Compras.shareCompras()`.
- Respaldo: `COMPLETE_BACKUP_KEYS`, `COMPLETE_BACKUP_OPTIONAL_KEYS` y un validador por clave en `18-respaldo-completo.js`; el botón `#backupExport`.
- Semana que viene: la flecha "›" de Semana y la clave `miPlatoFacil_planProxima_v1`.
- La hoja inferior (`IdeasHoja`, `hoja`), el Deshacer del plan (`deshacerPlan`) y `capturas.mjs --ancho 360|320`.

## Modo liviano

El ciclo de cada etapa es el de `CLAUDE.md`, con estos cambios:

- **Ramas:** integración `rediseno-4`, creada desde `main`; cada etapa en `rediseno-4-etapa-N-tema`. Commit y push cada vez que se termina una parte, aunque esté a medias. Sin tags: cada etapa queda marcada por su commit "Merge etapa N: …" en `rediseno-4`.
- **Modo rápido:** mientras se trabaja se corren solo las baterías tocadas (`--suites`). La batería completa y la compuerta corren **una sola vez por etapa, al final**. De las pruebas se lee solo la línea `TOTAL` y las que fallan.
- **Revisores**, sin crítica previa del plan:
  - `revisor-codigo` (diff contra `rediseno-4`): solo en las etapas 25, 28, 29, 30 y 32, que tocan datos guardados o archivos de `datos/`.
  - `revisor-usuario` (capturas antes y después, tema claro, a 390 y 320 px, solo de las vistas que cambian): solo en las etapas 26, 27, 28, 29, 30, 31 y 32.
- Hasta 3 intentos por etapa. Las condiciones de parada son las de `CLAUDE.md`.
- **Compuerta:** `validar-etapa.mjs` acepta las etapas 25 a 32 y, desde la 25, compara contra `rediseno-4` (hoy la línea 64 elige `rediseno-3` desde la 19). `criterios.json` suma un control por cada "Hecho cuando", con los identificadores que se indican en cada etapa. Los criterios de las rondas 1 a 3 siguen valiendo: nada vuelve atrás.
- **Pruebas nuevas:** una batería por etapa, `r4e25_base.js` a `r4e32_respaldo.js`, sumadas al final de `pruebas/suites.json`. La cantidad de pruebas nunca baja.
- **Datos:** claves nuevas `miPlatoFacil_<nombre>_v1`, en el respaldo como opcionales y con validador. Nada guardado se borra, se renombra ni cambia de formato. Los respaldos viejos se siguen restaurando. La app sigue andando sin conexión y abierta como archivo local.
- **Sin dependencias nuevas ni llamadas a internet** (salvo la IA que ya existe). Ninguna función avanzada se elimina.
- **Versión:** 18.0.0 en la Etapa 25, después 18.1.0, 18.2.0… hasta 18.7.0 en la Etapa 32.
- **Registro:** sección "Ronda 4" al final de `docs/plan-rediseno.md`, con el mismo formato de la Ronda 3: plan corto, "Hecho cuando" con ✅, decisiones, pruebas adaptadas, revisores y compuerta.
- Si una prueba vieja mira la interfaz que cambia, se adapta en el mismo commit con la misma exigencia y se explica en el Registro. Si protege datos o lógica, el código nuevo la cumple.
- Lo que este plan no decide: la opción más simple para el usuario y más fácil de revertir, anotada en el Registro.

## Etapas

### Etapa 25. Base en verde (v18.0.0)

Sin cambios visibles, salvo los dos errores. Es la primera porque sin ella ninguna otra etapa puede pasar la compuerta.

**Qué hacer**

1. **Precios congelados para las pruebas y las capturas.**
   - Copiá el `datos/precios.json` de hoy a `pruebas/fixtures/precios-congelados.json`. Ese archivo no se vuelve a modificar.
   - `herramientas/construir.mjs`: opción nueva `--precios <archivo>` (por omisión, `datos/precios.json`).
   - `herramientas/probar.mjs` y `herramientas/capturas.mjs`: al arrancar construyen la app en una carpeta temporal con `--salida <tmp> --precios pruebas/fixtures/precios-congelados.json`, y su servidor local entrega ese `index.html`, ese `sw.js` y, en `/datos/precios.json`, el archivo congelado. Todo lo demás sale del repositorio como hoy. Con `--raiz` o con `--archivo`, `capturas.mjs` sigue como hoy.
   - `construir.mjs --verificar` no cambia: sigue comparando `index.html` con los datos reales.
2. **Las tres pruebas en rojo**, con la misma exigencia:
   - E19-plausibilidad: sumá a `excepcionesPlausibilidad` de `datos/precios-notas.json` "Arándanos" (fruta fina que se vende en bandejas de 125 g) y "Semillas de chía" (semilla que se vende en bolsas chicas).
   - E20-sin-cero y `e24_semana_clara.js`: en vez de suponer que un producto real no tiene precio, la prueba lo arma. Ejemplo: `w.preciosDataset.data = { ...PRECIOS_SNAPSHOT, items: PRECIOS_SNAPSHOT.items.filter(i => i.n !== "Frutilla") }`, después `preciosDataset.cache = null` y `refrescarPrecios()`.
3. **Control de los datos reales antes de guardarlos**, sin tocar el workflow. `herramientas/actualizar-precios.mjs`:
   - Al generar: si un precio de SEPA se aparta más de 4 veces de la mediana de su categoría y unidad base y el ingrediente no está en `excepcionesPlausibilidad`, ese precio no se publica (queda el de INDEC si existe) y se imprime "Descartado por plausibilidad: <ingrediente> <región> <precio>".
   - `--verificar` (el workflow ya lo corre antes de guardar) falla si queda algún precio fuera de ese rango sin excepción, o si los ítems con precio en GBA son menos de 100.
   - Probalo con `datos/precios-ejemplo-sepa.json` y sumá el caso a `pruebas/sepa-lector.mjs`.
4. **`datos/precios-notas.json`:** sacá de `sinDato` los 16 que ya tienen precio en `datos/precios.json`.
5. **Tope de tamaño** en `construir.mjs`: `index.html` hasta 1.100.000 bytes y, además, hasta 300.000 bytes con gzip (`zlib.gzipSync`). `datos/precios.json` hasta 80.000 bytes. Actualizá el texto de E9-tamano-app.
6. **Bienvenida:** `Bienvenida.terminarBienvenida()` deja la pila de la pestaña Hoy en su raíz (`home`) antes de cambiar de pestaña, para "Armar mi semana" y para "Saltar".
7. **Costo del día:** reproducí el caso (armar con la semana vacía, después "Rehacer la semana entera") y hacé que Semana vuelva a calcular los costos después de que las comidas nuevas queden guardadas. El mismo arreglo vale para el armado desde la bienvenida.
8. **Compuerta:** `validar-etapa.mjs` acepta 25 a 32 y compara contra `rediseno-4`. Subí la línea base a la cantidad real de pruebas con `--actualizar-linea-base`.

**Qué no tocar:** `.github/workflows/`, `datos/precios.json`, ninguna clave `miPlatoFacil_*`, la exigencia de ninguna prueba.

**Claves nuevas:** ninguna.

**Hecho cuando**

- `R4-25-verde`: `node herramientas/probar.mjs` da 100 % (614 o más).
- `R4-25-independiente`: con `datos/precios.json` reemplazado en una copia temporal por una versión sin 10 ítems y con todos los precios multiplicados por 1,3, las baterías de precios (`e7_precios.js`, `e9_sepa.js` y de `e13_precios_a_la_vista.js` a `e25_arreglos.js`) dan el mismo resultado. Se hace una vez, la copia no se commitea y el resultado se anota en el Registro.
- `R4-25-datos`: `actualizar-precios.mjs --verificar` pasa con los datos de hoy y falla con un archivo de ejemplo que trae un precio 10 veces mayor que la mediana de su categoría.
- `R4-25-tamano`: `construir.mjs` falla con más de 1.100.000 bytes o más de 300.000 con gzip.
- `R4-25-bienvenida`: después de "Armar mi semana" y después de "Saltar", tocar Hoy muestra la pantalla `home`.
- `R4-25-costo`: después de "Rehacer la semana entera", `#planDiaCosto` y el costo de cada hueco son iguales antes y después de ir a otra pestaña y volver, y los 4 huecos del día muestran costo.

### Etapa 26. Lista para el súper (v18.1.0)

**Qué hacer** (`12-lista-de-compras.js`, `23-equivalencias-de-ingredientes.js`, `44-cantidades-de-platos.js`, `datos/envases.json`, `fuente/estilos.css`)

- `Compras.shoppingRow()`: tocar cualquier parte de la fila tacha o destacha. El nombre y el precio dejan de ser botones. A la derecha de la fila va un botón "ⓘ" de 44×44 px, con `aria-label="Ficha de <producto>: nutrientes y precio"`, que abre `Comidas.abrirNutrientesDeIngrediente()`. La fuente, el mes y el rango del precio se ven en esa ficha, como hoy.
- La casilla mide siempre 24×24 px (`flex: 0 0 24px`) y la fila, 48 px de alto como mínimo.
- Quesos en gramos: "Queso Port Salut: 180 g" en vez de "12 unidades" (30 g por rebanada, en `pesoUnidad` de `datos/envases.json`).
- Tortillas por paquete: 2 tortillas por persona y por comida (40 g cada una), y la lista dice "Tortillas de trigo: 1 paquete de 8 unidades".
- `ingredientAliasSuggestions()`: sumá "cebolla" a `DISTINTOS`, para que no se sugiera unir "Cebolla de verdeo" con "Cebolla". "Tomate perita" con "Tomate" y "Arroz (integral, yamaní)" con "Arroz" se siguen sugiriendo.
- `Compras.comprasText()` usa los mismos nombres cortos que la pantalla.

**Qué no tocar:** `miPlatoFacil_shoppingChecks_v1` ni su formato, "Terminé de comprar", "Descontar lo que tengo", la Despensa, el total.

**Claves nuevas:** ninguna.

**Pruebas que se adaptan:** las que llegan a la ficha tocando el nombre (`e21_ficha_precio.js`, `e24_semana_clara.js`) pasan a tocar "ⓘ": sigue siendo un toque. Las que miran fuente y mes tocando el precio (`e13_precios_a_la_vista.js`) los leen en la ficha.

**Hecho cuando**

- `R4-26-fila`: un toque en el nombre, en el precio o en el espacio libre de la fila la tacha; otro la destacha; ninguno abre una hoja.
- `R4-26-ficha`: un toque en "ⓘ" abre la ficha y no tacha.
- `R4-26-casilla`: a 390 y a 320 px todas las casillas miden 24×24 px y todas las filas, 48 px o más de alto.
- `R4-26-cantidades`: con la semana armada de la prueba, ninguna fila de queso está en "unidades" y la de tortillas dice "paquete".
- `R4-26-equivalencia`: no aparece la sugerencia de cebolla de verdeo; siguen las de tomate perita y arroz.
- `R4-26-compartir`: cada producto del texto compartido tiene el mismo nombre que su fila en pantalla.
- `R4-26-alto`: la vista `compras` en estado `normal` de `capturas.mjs` mide 3.300 px o menos a 390 px (hoy 3.626), sin sumar palabras visibles (E1-palabras-compras sigue pasando).

### Etapa 27. Semana más corta y con tus objetivos (v18.2.0)

**Qué hacer** (`10-plan-semanal.js`, `45-armame-la-semana.js`, `fuente/cuerpo/pantallas/05-plan.html`, `fuente/estilos.css`)

- **Aviso de semana armada** (`ArmameSemana.resumen()` y `avisoDe()`). La primera oración no cambia ("Listo: 28 comidas armadas · ≈ $X la semana."). Después, una sola de estas:
  - Entra: "Entra en tu presupuesto de $60.000."
  - No entra: "Te pasás $20.803 de tu presupuesto de $90.000. Lo que más pesa: pan de molde, huevos y tomate." Son los 3 productos más caros de `costoSemanaPlan().productos`, con nombre corto y en minúscula.
  - Sin presupuesto: nada más.
  - "Deshacer" va en la misma línea, al final. Lo demás va en un `<details>` "Ver detalle", cerrado: "Incluye 2 precios estimados. Cociná doble: la cena del viernes es el almuerzo del sábado. Usé 6 productos de tu despensa."
- **`#planStatus`** se vacía al abrir Semana desde otra pestaña y cada vez que se muestra un aviso en `#planAviso`. Nunca se ven los dos a la vez.
- **Objetivos en una línea:** "Verduras 14/10 ✓ · Legumbres 11/3 ✓ · Pescado 0/2 · Fruta 14/7 ✓".
- **"Con precio: 35 de 37 productos · Completar 2 precios"** en una sola línea a 390 px.
- **Íconos:** el ícono va solo en la etiqueta del hueco (🍳 Desayuno, 🥗 Almuerzo, ☕ Merienda, 🌙 Cena). El nombre de la comida va sin emoji.
- **Chips de los días:** 44 px de ancho o más a 390 px. A 320 px no entran 7 chips de 44 px: quedan como están.
- **Objetivos en el armado** (`ArmameSemana.armar()`): por cada grupo de `loadHabitGoals()` (verduras, legumbres, pescado, fruta), mientras la semana no llegue al objetivo, las candidatas que tienen ese grupo suman 3 puntos. El ajuste por presupuesto no cambia una comida si eso deja un objetivo por debajo, salvo que no haya otra forma de bajar el costo. Si un objetivo no se cumple, "Ver detalle" lo dice: "No llegué a tu objetivo de pescado (1 de 2) para no pasarme del presupuesto."

**Qué no tocar:** la hoja de un hueco (quedan las tres variantes de "Cambiar"), los topes de variedad de la Etapa 22, `miPlatoFacil_habitGoals_v1`, el plan ni su historial.

**Claves nuevas:** ninguna.

**Hecho cuando**

- `R4-27-aviso`: con 2 personas y $90.000, el aviso contiene "Te pasás $", el monto es el total menos el presupuesto, y nombra 3 productos. Con 1 persona y $200.000 contiene "Entra en tu presupuesto".
- `R4-27-un-mensaje`: después de "Lo comí" en Hoy, al abrir Semana `#planStatus` está vacío; después de armar, solo `#planAviso` tiene texto.
- `R4-27-arriba`: con la semana armada y sin desplazar, el borde de arriba del primer hueco queda a 500 px o menos a 390 px (hoy unos 545) y a 600 px o menos a 320 px (hoy unos 700, con objetivos cargados).
- `R4-27-iconos`: ningún nombre de comida empieza con emoji y la merienda lleva ☕.
- `R4-27-chips`: a 390 px los 7 chips miden 44 px o más de ancho.
- `R4-27-objetivos`: con el objetivo "pescado: 2" y un presupuesto de $200.000, en 10 semanas con semillas distintas siempre hay 2 o más comidas con pescado. Con $20.000, "Ver detalle" nombra el objetivo que no se cumplió.

### Etapa 28. Ideas con cantidades y preparación (v18.3.0)

Se define el formato y se completan las 41 ideas actuales. Las ideas nuevas van en la Etapa 29.

**Qué hacer**

- **Archivo nuevo `datos/ideas.json`**, incrustado por `construir.mjs` con la marca `__DATOS_IDEAS__` (igual que `__DATOS_ENVASES__`), hasta 150.000 bytes:

  ```json
  {"version": 1, "revisado": "2026-11-10", "ideas": [
    {"text": "Milanesa de pollo al horno con puré de calabaza y ensalada",
     "corto": "Milanesa de pollo con puré",
     "tipo": "plato",
     "minutos": 40,
     "cantidades": [["Pollo (pechuga, muslo, pata-muslo)", 150, "g"], ["Pan rallado", 30, "g"],
                    ["Huevo entero de gallina", 0.5, "unidad"], ["Zapallo", 250, "g"],
                    ["Lechuga", 60, "g"], ["Tomate", 100, "g"]],
     "pasos": ["Pasá el pollo por huevo batido y pan rallado.",
               "Horneá 25 minutos a horno fuerte, dando vuelta a la mitad.",
               "Herví el zapallo 15 minutos y pisalo con sal y un chorrito de aceite.",
               "Serví con lechuga y tomate."]}
  ]}
  ```

  - `text`: en las 41 ideas actuales, idéntico al de `data.menuCatalog`. No se renombra ninguna.
  - `corto`: hasta 40 caracteres, sin "+".
  - `cantidades`: por persona. Cada nombre es un ingrediente con ítem de precios o de nutrición. Aceite, sal y condimentos no van (son básicos de alacena): se nombran solo en los pasos.
  - `pasos`: de 3 a 5, de hasta 140 caracteres cada uno, en voseo.
  - `minutos`: tiempo total, entre 5 y 90.
- **Al arrancar** (`01-datos-y-estado.js`): cada entrada de `ideas.json` cuyo `text` existe en `data.menuCatalog` le agrega sus campos a esa idea. Las ideas siguen funcionando si falta el archivo.
- **Porciones de adulto**, con estos rangos por persona: papa, batata o mandioca, 200 a 250 g; arroz, fideos o polenta en seco, 70 a 90 g; legumbres secas, 60 a 80 g; pan, 60 a 80 g; carne, pollo o pescado, 130 a 180 g; huevos, 2 cuando son la única proteína; verduras, 200 g o más en total.
- **Las cantidades de una idea se usan sin reescribir lo guardado.** Función nueva `IdeasHoja.ideaDeComida(item)`: devuelve la idea si `item.note` es igual a `idea.text.slice(0, 80)` y los ingredientes del `state` del ítem son los mismos que los de la idea; si la comida se renombró, la idea se busca por ingredientes y solo vale si hay una sola con ese mismo conjunto. `cantidadesDePlatoArmado(item)` y `filasDe()` usan `idea.cantidades` cuando hay idea; si no, el cálculo de hoy. Una comida que el usuario editó sigue con el cálculo de hoy.
- **Platos armados a mano:** en `datos/envases.json`, tabla nueva `porcionAlmidon` (papa 200, batata 200, mandioca 200, choclo 150, pan 70) que reemplaza los 80 g de `gramosPorCuarto` para esos almidones. `gramosPorCuarto.proteinas` pasa de 120 a 150.
- **Nombre corto:** Semana, Hoy, el selector de comida y los chips de la bienvenida muestran `corto` cuando la comida es una idea sin renombrar. El detalle muestra el `text` completo.
- **Detalle de una comida** (`39-comidas.js`): "Qué lleva" muestra cada ingrediente con su cantidad para el hogar ("Pollo · 300 g" con 2 personas) y, debajo, la sección "Cómo se hace · 40 min" con los pasos numerados. El ingrediente se sigue pudiendo tocar para abrir su ficha.
- **El filtro de dieta** (`46-dieta.js`) también mira los nombres de `cantidades`.

**Qué no tocar:** el `text` de las 41 ideas, `miPlatoFacil_saved` (no se le agrega ningún campo), `data.bfprot`, `data.bfcarb` ni los textos de porción del armado.

**Claves nuevas:** ninguna.

**Pruebas que se adaptan:** las que fijan presupuestos o cantidades (`e12_cantidades.js`, `e15_armame.js`, `e20_un_costo.js`) pueden necesitar valores nuevos porque las porciones crecen. Se recalculan con los precios congelados, se mantiene la exigencia y se anota el valor viejo y el nuevo en el Registro.

**Hecho cuando**

- `R4-28-41`: las 41 ideas actuales tienen `corto`, `cantidades`, `pasos` y `minutos` válidos, y cada `text` coincide con el del catálogo.
- `R4-28-nombres`: cada nombre de `cantidades` resuelve a un ítem de precios o de nutrición, y ninguno es un básico de alacena.
- `R4-28-energia`: cada idea de almuerzo o cena aporta entre 450 y 850 kcal y 18 g de proteína o más por persona, calculado con `gramosDe()` y `nutritionFor()` (el aceite no se cuenta).
- `R4-28-titulo`: la prueba de título contra ingredientes de la Etapa 23 pasa mirando también `cantidades`.
- `R4-28-lista`: con una semana de 14 ideas para 2 personas, la lista suma exactamente el doble de las `cantidades` de cada idea, antes de pasar a envases.
- `R4-28-editada`: una idea guardada a la que se le cambia un ingrediente vuelve al cálculo general y no usa las cantidades de la idea.
- `R4-28-detalle`: el detalle de una idea muestra cada ingrediente con cantidad y de 3 a 5 pasos; con 2 personas, las cantidades son el doble.
- `R4-28-corto`: en Semana, ninguna comida que viene de una idea muestra más de 40 caracteres.

### Etapa 29. Cien ideas y una semana que alcanza (v18.4.0)

**Qué hacer**

- **29 ideas nuevas de almuerzo y cena** en `datos/ideas.json` (con las 41, quedan 70), con `text` de hasta 40 caracteres, `tipo: "plato"`, `tags`, `ingredientes` (los grupos del plato, como las actuales), `cantidades`, `pasos` y `minutos`. Platos de todos los días en Argentina, con prioridad a los baratos. Ninguna repite una de las 41. Tienen que estar, como mínimo, estas 24: guiso de fideos con carne y verduras, arroz con huevo y ensalada, polenta con salsa y queso, tortilla de papas con ensalada, tarta de zapallitos, milanesa de carne con puré, milanesa de carne con ensalada, carne al horno con papas y zapallo, albóndigas con arroz, zapallitos rellenos, fideos con tuco, fideos con salsa de verduras, canelones de verdura, empanadas de carne al horno con ensalada, pastel de zapallo y carne, pollo a la cacerola con verduras, hamburguesas caseras de carne con ensalada, tortilla de acelga con arroz, ensalada de arroz con atún y huevo, ensalada de lentejas con huevo, garbanzos guisados con arroz, berenjenas a la napolitana con arroz, pollo con ensalada rusa y carbonada.
- **30 ideas de desayuno y merienda**, con `tipo: "desayuno"` y el campo `desayuno: {"fruta": "Naranja", "prot": "Queso untable descremado", "cereal": "Pan"}` además de `cantidades`, `pasos` (de 2 a 4) y `minutos`. Ejemplos: "Tostadas con queso untable y naranja", "Yogur con avena y banana", "Licuado de banana con leche y tostadas", "Huevo revuelto con tostadas y mandarina", "Avena con leche y manzana", "Pan con queso y tomate". Al menos 12 combinaciones distintas de proteína y cereal (no 30 variantes que solo cambian la fruta), y al menos 10 con "Pan" común en vez de pan de molde. Las infusiones (mate, té, café) se nombran en los pasos; no van en `cantidades`.
- **Al arrancar:** las ideas de `tipo: "plato"` que no están en `data.menuCatalog` se agregan al final. Las de `tipo: "desayuno"` van a una lista nueva, `data.desayunoCatalog`.
- **Armado** (`candidatosDesayuno()`): las ideas de desayuno entran como candidatas, con su estado armado desde el campo `desayuno` y sus `cantidades`. Las plantillas de la Etapa 22 quedan solo como respaldo, cuando los filtros de dieta dejan menos de 6 ideas de desayuno.
- **Ideas y selector de comida:** las ideas de desayuno aparecen al elegir desayuno o merienda, con el mismo detalle (cantidades y pasos).
- **Bienvenida** (`Bienvenida.ideasParaArrancar()`): en vez de las 8 primeras del catálogo, las 8 ideas de almuerzo o cena más baratas por porción que pasan los filtros de dieta, con 4 proteínas base distintas como mínimo (carne, pollo, huevo, legumbres, pescado o queso).
- **Etiquetas:** no se escriben etiquetas de dieta a mano; salen de los ingredientes con el filtro que ya existe. En Ideas, cada tarjeta puede mostrar "Económica" si su costo por porción está en el tercio más barato de su tipo.

**Qué no tocar:** las 41 ideas (ni su `text` ni su orden), los topes de variedad, `miPlatoFacil_saved`, las opciones del armado manual de desayunos.

**Claves nuevas:** ninguna.

**Hecho cuando**

- `R4-29-cien`: `datos/ideas.json` tiene 100 ideas, 70 de `plato` y 30 de `desayuno`, sin `text` ni `corto` repetidos.
- `R4-29-validas`: las 100 cumplen el formato de la Etapa 28 (los desayunos, con 2 a 4 pasos).
- `R4-29-energia`: cada almuerzo o cena aporta 450 a 850 kcal y 18 g de proteína o más; cada desayuno o merienda, 250 a 450 kcal y 8 g de proteína o más.
- `R4-29-semana`: una semana armada para 1 persona da entre 1.600 y 2.300 kcal por día de media y ningún día baja de 1.400, en 10 semillas distintas.
- `R4-29-dieta`: con cada filtro de dieta activo, ninguna idea permitida contiene un ingrediente excluido, mirando `ingredientes` y `cantidades`.
- `R4-29-baratas`: con los precios congelados, 20 o más almuerzos o cenas cuestan $2.500 o menos por porción y 10 o más desayunos, $1.300 o menos.
- `R4-29-piso`: con los precios congelados y porciones de adulto, la semana más barata cuesta $68.000 o menos para 1 persona y $110.000 o menos para 2. Si no se llega, anotá en el Registro el número real, qué productos pesan más y qué ideas baratas faltan; no es motivo de parada.
- `R4-29-bienvenida`: las 8 ideas de la bienvenida tienen 4 proteínas base distintas o más, y ninguna pasa de 40 caracteres.
- `R4-29-variedad`: las pruebas de la Etapa 22 (topes y combinaciones prohibidas) siguen pasando con el catálogo nuevo.

### Etapa 30. Precios al día y de tu barrio (v18.5.0)

**Qué hacer** (`43-precios.js`, `39-comidas.js`, `10-plan-semanal.js`, `fuente/cuerpo/pantallas/26-preferencias.html`, `18-respaldo-completo.js`)

- **Dónde comprás la verdura.** En Preferencias, junto a la región: "Compro frutas y verduras en" con las opciones "Verdulería" (por defecto) y "Supermercado".
  - Con "Verdulería", para los ítems de categoría `frutas` o `verduras` que tienen precio de INDEC, `precioAuto()` usa INDEC antes que SEPA. Con "Supermercado", todo sigue como hoy. Mi precio gana siempre.
  - La ficha de esos productos muestra los dos: "En verdulería ≈ $2.201/kg · INDEC GBA · sept. 2026" y "En súper ≈ $3.999/kg · SEPA GBA · 4 nov. 2026".
  - Anotá en el Registro cuánto cambia el total de la semana de la prueba con cada opción.
- **Tu precio al día.** Un Mi precio está "para revisar" si pasaron más de 60 días desde su fecha, o si pasaron 30 o más y el precio automático del mismo ingrediente es un 20 % o más alto. La fecha es la más nueva entre `date` de la entrada y la de "Sigue igual".
  - En Semana, en la línea de precios y solo si hay alguno: enlace "Revisar 3 precios tuyos". Abre una hoja con una fila por precio: "Tomate · tu precio $2.500/kg (20 ago.) · en la zona ≈ $4.039/kg" y los botones "Sigue igual" y "Actualizar".
  - "Sigue igual" guarda la fecha de hoy para esa entrada y la saca de la lista. "Actualizar" abre la ficha con el formulario de Mi precio.
  - En la ficha de un ingrediente con Mi precio para revisar: "Tu precio es de hace 82 días." con los mismos dos botones.
- **Yogur:** revisá en `datos/precios-mapa.json` por qué "Yogur natural" queda a $17.200 el litro y "Yogur descremado" a $8.667 el kilo. Si es un error de unidad o de búsqueda, corregí el mapa y anotalo; el dato nuevo entra con la próxima corrida de "Actualizar precios". No edites `datos/precios.json` a mano.

**Qué no tocar:** `miPlatoFacil_referencePrices_v1` (ni siquiera `date`), `datos/precios.json`, el cálculo del estimado por categoría.

**Claves nuevas** (opcionales en el respaldo, con validador):

- `miPlatoFacil_dondeCompro_v1`: `{"version": 1, "verduras": "verduleria"}` o `"super"`.
- `miPlatoFacil_preciosRevisados_v1`: `{"version": 1, "revisados": {"<id de la entrada>": "AAAA-MM-DD"}}`.

**Hecho cuando**

- `R4-30-verduleria`: con los precios congelados y "Verdulería", la papa cuesta $2.201/kg en GBA; con "Supermercado", $3.999/kg; con un Mi precio, ese.
- `R4-30-defecto`: sin la clave, se usa "Verdulería". Arroz, leche y pollo cuestan lo mismo con las dos opciones.
- `R4-30-ficha`: la ficha de la papa muestra los dos precios con su fuente y su mes.
- `R4-30-revisar`: con un Mi precio de hace 61 días aparece "Revisar 1 precio tuyo"; con uno de 59 días y el automático un 10 % arriba, no; con uno de 31 días y el automático un 25 % arriba, sí.
- `R4-30-sigue-igual`: "Sigue igual" lo saca de la lista, no cambia `referencePrices_v1` byte a byte y escribe en `preciosRevisados_v1`.
- `R4-30-respaldo`: las dos claves van y vuelven en el respaldo; el respaldo de ejemplo, que no las trae, se restaura igual.

### Etapa 31. Hoy con costo y la semana para compartir (v18.6.0)

**Qué hacer** (`31-hoy.js`, `08-copiar-y-compartir.js`, `38-selector-de-comida.js`, `fuente/cuerpo/pantallas/01-home.html`)

- **Hoy:** debajo del chip de entrenamiento, una línea con el costo del día (`costoDelDiaPlan()`, para el hogar) y los grupos que cubren las comidas planificadas de hoy:
  - Completo: "Hoy ≈ $9.020 · Plato completo: verduras, almidón, proteína y fruta".
  - Falta algo: "Hoy ≈ $6.300 · Te falta: fruta".
  - Sin plan para hoy o con los precios apagados, la parte que no corresponde no se muestra.
- **Compartir la semana:** en el menú ⋯ de Semana, "Compartir la semana", con dos opciones.
  - "Como texto": un día por bloque, con las 4 comidas en nombre corto y el total ("*Total ≈ $85.291*"). Usa `navigator.share` o copia, igual que `Compras.shareCompras()`.
  - "Como imagen": PNG de 1080×1350 hecho con canvas, reusando `Compartir.roundRect()`, `Compartir.wrapText()` y el envío de `Compartir.shareImage()`. Lleva el título "Mi semana · 9 al 15 de nov", 7 filas (día, almuerzo y cena en nombre corto) y al pie "≈ $85.291 · Mi Plato Fácil". Sin fuentes ni imágenes externas.
  - Funciona para esta semana y para la semana que viene.

**Qué no tocar:** "Lo comí", el registro, el plan.

**Claves nuevas:** ninguna.

**Hecho cuando**

- `R4-31-hoy`: con la semana armada, Hoy muestra "Hoy ≈ $" con el mismo monto que "hoy ≈" de Semana; sin fruta en el día dice "Te falta: fruta"; con los precios apagados no muestra ningún "$".
- `R4-31-texto`: el texto tiene los 7 días, 28 comidas y el mismo total que Semana.
- `R4-31-imagen`: el canvas mide 1080×1350, el PNG pesa más de 20 KB y se comparte como archivo `image/png` (con `navigator.share` simulado); sin `navigator.share`, se descarga.
- `R4-31-proxima`: desde la semana que viene, el texto y la imagen llevan las fechas y las comidas de esa semana.

### Etapa 32. Respaldo sin olvidos, recordatorio y recorrido final (v18.7.0)

**Qué hacer** (`18-respaldo-completo.js`, `27-app-instalable.js`, `31-hoy.js`, `14-eventos-y-arranque.js`, `fuente/cuerpo/pantallas/20-backupScreen.html`)

- **Aviso de respaldo.** Si hay al menos una comida guardada o un plan, y pasaron 30 días o más desde el último respaldo (o desde el primer uso con esta versión, si nunca se hizo uno), Hoy muestra una línea al pie y la tarjeta "Mis datos" de Más muestra lo mismo: "Hace 34 días que no guardás una copia de tus datos." con los botones "Guardar copia" y "Más tarde". "Más tarde" lo esconde 7 días.
- **Guardar copia:** si el teléfono lo permite (`navigator.canShare({ files })`), abre el menú de compartir con el archivo `.json` (Drive, mail, WhatsApp). Si no, lo descarga como hoy. El botón `#backupExport` de Mis datos hace lo mismo. Al terminar se guarda la fecha.
- **Almacenamiento persistente:** al terminar la bienvenida o al guardar la primera comida, una sola vez por sesión, `navigator.storage.persist()` si existe. Sin texto en pantalla y sin fallar si no existe.
- **Recordatorio semanal:** en el menú ⋯ de Semana, "Recordarme armar la semana". Hoja con día (domingo por defecto) y hora (18:00 por defecto), y el botón "Agregar al calendario", que comparte o descarga `armar-la-semana.ics`: un evento semanal (`RRULE:FREQ=WEEKLY;BYDAY=SU`) titulado "Armar la semana · Mi Plato Fácil", con alarma a la hora y un enlace a la app armado con `location.origin + location.pathname + "?ir=semana-proxima"`. No se escribe ningún dominio en el código.
- **Enlace:** al abrir la app con `?ir=semana-proxima` se muestra Semana en "Semana que viene" (la misma acción que la flecha "›").
- **Recorrido final** con `revisor-usuario`, a 390, 360 y 320 px: bienvenida, semana armada, detalle de una comida con sus pasos, cambiar "Verdulería" por "Supermercado", tachar 5 productos en la lista, "Terminé de comprar", compartir la semana y guardar una copia.

**Qué no tocar:** el formato del respaldo (`complete-local-v1`), `Respaldo.validateCompleteBackup()` y `restoreCompleteBackup()` salvo para sumar la clave nueva como opcional, la restauración.

**Claves nuevas** (opcional en el respaldo, con validador):

- `miPlatoFacil_respaldoAviso_v1`: `{"version": 1, "primerUso": "AAAA-MM-DD", "ultimo": "AAAA-MM-DD", "pospuesto": "AAAA-MM-DD"}`. `ultimo` y `pospuesto` pueden faltar.

**Hecho cuando**

- `R4-32-aviso`: con el último respaldo hace 30 días aparece el aviso en Hoy y en Más; con 29 días, no; sin comidas ni plan, no; después de "Más tarde" no aparece durante 7 días y vuelve al octavo.
- `R4-32-copia`: "Guardar copia" comparte un archivo `.json` que `Respaldo.validateCompleteBackup()` acepta (con `navigator.share` simulado) y deja `ultimo` con la fecha de hoy; sin `navigator.canShare`, descarga.
- `R4-32-persistente`: `navigator.storage.persist()` se llama una vez al terminar la bienvenida, y la app no falla si no existe.
- `R4-32-ics`: el archivo tiene `BEGIN:VCALENDAR`, un `VEVENT`, `RRULE:FREQ=WEEKLY` con el día elegido, un `VALARM` y el enlace con `?ir=semana-proxima`.
- `R4-32-enlace`: abrir `index.html?ir=semana-proxima` muestra "Semana que viene"; sin el parámetro, la app abre como siempre.
- `R4-32-respaldo`: la clave nueva va y vuelve en el respaldo, y el respaldo de ejemplo se restaura completo.
- `R4-32-recorrido`: el recorrido final pasa de punta a punta en una prueba y sin bloqueantes de `revisor-usuario`.

## Al terminar la Etapa 32

1. Si `main` cambió mientras trabajabas (por las tareas de nutrición o de precios), traelo a `rediseno-4` con merge, sin rebase, reconstruí y pasá la compuerta otra vez.
2. Escribí `docs/informe-ronda-4.md`: qué cambió para el usuario, medidas antes y después (pruebas, energía por día, piso de presupuesto por persona, alto de Compras y de Semana, tamaño de `index.html`), decisiones tomadas sin el dueño, mejoras sugeridas y pendientes para el dueño.
3. Abrí el PR `rediseno-4` → `main`, listo para revisar, con el informe como descripción. No lo mergees: ese merge lo hace el dueño.
4. Mostrá en la conversación la última salida de la compuerta y el resumen del informe.

## Arranque (solo para el primer mensaje)

Ahora hacé solo esto:

1. `git fetch origin` y creá la rama `rediseno-4` desde `origin/main`.
2. Traé los documentos de esta ronda con `git merge --no-ff origin/analisis-ronda-4` (solo agrega archivos en `docs/`).
3. Agregá al final de `docs/plan-rediseno.md` la sección "## Ronda 4: la semana que se puede cocinar y pagar", con una línea que diga que el plan completo está en `docs/prompt-ronda-4.md`, y debajo "### Registro de la Ronda 4" con la tabla de etapas 25 a 32 en estado pendiente.
4. Commit y push de `rediseno-4`, y respondé "LISTO".

No empieces la Etapa 25: enseguida te llega un `/goal` para que trabajes solo hasta el final. Si retomás más adelante, ignorá esta sección y seguí desde el Registro.

---

`/goal Completar las etapas 25 a 32 de docs/prompt-ronda-4.md, en orden y sin esperar al dueño: cada etapa termina con "VALIDACIÓN ETAPA N: OK", su merge "Merge etapa N: …" en rediseno-4 con push, y su entrada ✅ en el Registro de la Ronda 4 de docs/plan-rediseno.md. Al final, docs/informe-ronda-4.md escrito y el PR rediseno-4 → main abierto y sin mergear. Parar antes solo por las condiciones de parada de CLAUDE.md.`

**Para retomar si la sesión se corta**

> Estás retomando la Ronda 4 de Mi Plato Fácil. Leé `CLAUDE.md`, `docs/prompt-ronda-4.md` y el "Registro de la Ronda 4" al final de `docs/plan-rediseno.md`. Hacé `git fetch origin` y mirá `git log --merges origin/rediseno-4` para saber cuál fue la última etapa mergeada. Si hay una rama `rediseno-4-etapa-N-…` sin mergear, seguí ahí: corré `node herramientas/construir.mjs --verificar` y las baterías de esa etapa para ver en qué quedó. Si no, empezá la etapa siguiente desde `rediseno-4`. No repitas etapas con ✅, no toques `main` y seguí el modo liviano hasta cumplir el `/goal`.
