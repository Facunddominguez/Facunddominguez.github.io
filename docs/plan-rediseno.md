# Rediseño de Mi Plato Fácil: plan para Claude Code

## Tu rol y prioridades

Vas a rediseñar Mi Plato Fácil (este repositorio) para que sea simple de usar desde el celular, en etapas. Pensá cada decisión desde el usuario: alguien que quiere comer equilibrado con el método del plato, planificar la semana y hacer las compras sin pensar demasiado.
Prioridades, en este orden:

1. No perder ni romper datos guardados por los usuarios.
2. Que la app siga funcionando y publicable al final de cada etapa.
3. Que cada etapa la haga visiblemente más simple.

Vas a trabajar solo, de la Etapa 0 a la 10: cada etapa se valida sola (ver "Modo autónomo") y pasás a la siguiente sin esperarme. Mi única intervención es el merge final a `main`.
Este plan sale de recorrer la v14.9.94 como usuario. Si algo de acá no coincide con el código, anotalo en el Registro, decidí según los principios y seguí.

## Contexto técnico (verificalo vos)

* PWA sin frameworks ni dependencias. Se edita solo `fuente/`: HTML por pantalla en `fuente/cuerpo/pantallas/`, código en `fuente/codigo/NN-*.js` (se une en orden numérico), estilos en `fuente/estilos.css`.
* `node herramientas/construir.mjs` genera `index.html` y `sw.js`. Nunca los edites a mano. `--verificar` comprueba que estén al día.
* Pruebas: `node herramientas/probar.mjs` (Chrome sin ventana; `--suites a.js,b.js` para correr algunas). Hoy pasan 375 de 375. Si no hay Chrome, instalá Chrome for Testing fuera del proyecto (por ejemplo, `npx @puppeteer/browsers install chrome@stable`) y pasalo con `--navegador <ruta>`.
* Datos del usuario: solo en `localStorage`, en claves `miPlatoFacil_*` (hoy 26). Respaldo y restauración en `fuente/codigo/18-respaldo-completo.js`.
* Cada push a `main` corre las pruebas y publica en GitHub Pages: lo que llega a `main` lo usan personas reales.
* Un PR hacia `main` corre las mismas pruebas en GitHub sin publicar nada (`.github/workflows/pruebas.yml`). En Claude Code en la nube, `gh pr` no funciona: usá `gh api` (REST) para el PR y sus checks.
* Nutrición: `herramientas/actualizar-nutricion.mjs` (tarea mensual de GitHub Actions) genera `datos/nutricion.json`, que `construir.mjs` incrusta con la marca `__DATOS_NUTRICION__`. Los precios se van a hacer igual.
* Textos en español rioplatense, con voseo.

## Reglas que no se rompen

1. IMPORTANTE: nunca trabajes, hagas push ni merge en `main`. Todo se junta en la rama `rediseno`. Cada etapa se trabaja en `rediseno/etapa-N-tema`, con commits chicos, y entra a `rediseno` solo con la compuerta en verde (ver "Modo autónomo"). Nada de force push, `reset --hard` ni reescribir historia: lo que falla queda en su rama, sin mergear.
2. Datos: no renombres ni borres claves de `localStorage` ni cambies el formato guardado de forma incompatible. Lo nuevo va en claves nuevas `miPlatoFacil_<nombre>_v1`. Una migración lee lo viejo, escribe lo nuevo, se puede correr dos veces sin efecto y no borra lo viejo. Todo dato nuevo entra en el respaldo y la restauración; los respaldos de versiones anteriores se siguen restaurando.
3. Ninguna función avanzada se elimina: se integra (ver "Herramientas avanzadas"). Si algo sale de la vista, sus datos se siguen usando y se pueden consultar desde algún lugar.
4. Al cerrar cada etapa: construir, todas las pruebas en verde y, si cambió la app, subir `fuente/version.json` (15.0.0 en la Etapa 1, después 15.1.0, 15.2.0…).
5. Pruebas: si un cambio de interfaz rompe una prueba, entendé qué protege. Si protege datos o lógica, el código nuevo la tiene que cumplir. Si solo mira la interfaz vieja (ids, textos, ubicación), adaptala en el mismo commit y explicalo en el Registro. Nunca borres una prueba sin reemplazo ni reduzcas las de respaldo, despensa, compras y plan: la compuerta compara la cantidad de pruebas con la línea base y no deja que baje.
6. Sin dependencias nuevas en la app ni llamadas a internet mientras se usa (salvo la IA que ya existe). Los datos externos se bajan en GitHub Actions y se incrustan al construir, para que siga andando sin conexión.
7. Respetá el sistema de diseño (final de `fuente/estilos.css` y `pruebas/d01_diseno.js`): verde para acciones, rojo para borrar, objetivos táctiles de 44 px, tema claro y oscuro.
8. Antes de arreglar un problema de este plan, reproducilo. Si una decisión de producto no está acá, no me preguntes: elegí la opción más simple para el usuario y más fácil de revertir, anotala en el Registro ("Decisiones que tomaste sin mí") y seguí. Solo parás en los casos de "Condiciones de parada".

## Problemas a resolver (recorrido real como usuario nuevo, 390×844, v14.9.94)

* P1. Primera vez: Hoy muestra cuatro "Sin plan para hoy" y nada explica el método del plato ni el primer paso.
* P2. "Elegir" en Hoy lleva a Semana: 28 bloques (7 días × 4 comidas) con selector, "Asignar" y "Crear y guardar un plato". Vacía mide 5.898 px (7 pantallas) y no marca el hueco elegido.
* P3. Crear un plato desde un hueco no lo asigna a ese hueco: hay que volver, buscar el día, elegir en un `select` y tocar Asignar (unos 12 toques).
* P4. Desayuno: el paso "Frutas" ofrece formas (Budín, Waffle, En trozos…) y nunca pregunta qué fruta. La lista de compras termina pidiendo "En trozos" y "Huevo | Clara de huevo".
* P5. Compras: sin cantidades para platos armados; los tachados se pierden al recargar; lo comprado con "Lo compré" vuelve a figurar como pendiente; lo marcado en la despensa sigue pendiente con una nota.
* P6. El armado de almuerzo o cena pregunta "¿Entrenás hoy?" aunque la rutina semanal ya lo sabe.
* P7. Nombres: los platos se guardan como "Desayuno / Merienda" o "Almuerzo / Cena · Día de entrenamiento" y dos platos distintos se ven iguales en los selectores. Al guardar no se pide nombre.
* P8. "Plato del día" y "Sugerir al azar" combinan ingredientes sueltos sin sentido (cebolla + harina de avena + porotos; ajo + maicena + queso cremoso). Los almidones del armado incluyen harinas, féculas y pan rallado.
* P9. Las ideas reales (catálogo de 29 platos) están en un botón flotante "Consejos" que tapa tarjetas y campos. En "Con lo que tengo" las ideas no se pueden tocar.
* P10. "Con lo que tengo" mezcla despensa, recetas, crear receta, IA, nutrientes y preferencias: 3.854 px con 5 ítems; con todo abierto, 8.336 px y 1.718 palabras.
* P11. Cinco registros parecidos: "Lo comí", "Lo que comí", "Lo cociné", "✓ Cociné" e "Historial de comidas preparadas".
* P12. Herramientas avanzadas: con todo visible, Compras mide 7.915 px (9,4 pantallas), 941 palabras y 10 herramientas manuales (precios con moneda de 3 letras, fechas DD/MM/AAAA).
* P13. Textos de advertencia en casi todas las secciones ("No modifica el plan ni Compras…").
* P14. El Asistente de IA vive dentro de la pantalla de Respaldo; hay inputs blancos sin estilo (buscador de recetas del plan, clave de Gemini); la barra "Volver al paso anterior" aparece en pantallas sin pasos.
* P15. Listas largas en una columna: 34 verduras ocupan 2.531 px.

Conservar: "Lo comí" con Deshacer, "Lo compré" hacia la despensa, uso sin conexión, nutrición automática y pestañas que recuerdan dónde quedaste.

## Principios de experiencia

1. Una pantalla, una tarea. Lo ocasional va a un menú "⋯" o a Más.
2. Cada pantalla tiene una acción principal (botón lleno) y como mucho dos secundarias visibles.
3. Una línea de ayuda como máximo por sección, en positivo. Lo largo va en "ⓘ" o en Más → Cómo funciona.
4. Solo comida real: listas, sugerencias y compras muestran alimentos comprables con nombre claro.
5. No preguntar lo que la app ya sabe (rutina, despensa, precios).
6. Deshacer en vez de confirmaciones.
7. Vocabulario único: Comida (todo lo guardado), Receta (comida con preparación), Semana, Lista, Despensa, Lo comí, Lo cociné.

## Estructura objetivo

Pestañas: Hoy · Semana · Comidas · Compras · Más.

* Hoy: chip "Hoy entrenás · cambiar"; las 4 comidas del día con "Lo comí"; un hueco vacío abre el Selector de comida y asigna ahí mismo; "Mañana" plegado; atajos Armar una comida · Sugerime algo · Con lo que tengo (Ideas filtradas por tu despensa).
* Semana: "Esta semana · 26 oct – 1 nov", chips de lunes a domingo con indicador de completitud y el día elegido con sus 4 comidas. Hueco vacío: Selector. Hueco lleno: Cambiar, Quitar, Porciones, Lo comí. Menú ⋯: Repetir semana anterior, Copiar un día, Vaciar, Planes guardados (variaciones), Semanas anteriores y mes, Historial de cambios, Descargar.
* Comidas: "Mis comidas | Ideas". Una sola tarjeta para platos y recetas: nombre, componentes, etiquetas, ≈ costo por porción. Detalle: Agregar a la semana, Lo cociné, Editar, Compartir y nutrientes. "+ Nueva": Armar con el método del plato · Escribir receta · Pegar receta con IA. Ideas: catálogo, snacks, pre-entreno, filtro "Con lo que tengo" y "Pedir ideas a la IA".
* Compras: "Lista | Despensa". Lista por secciones del súper, con cantidades, ≈ precio por ítem, total y presupuesto arriba, tachados que no se pierden y "Terminé de comprar". Despensa: lo básico y otros ingredientes, cantidad opcional, historial por ítem.
* Más: Mi rutina, Preferencias (ingredientes a evitar, región de precios, presupuesto, objetivos, mostrar precios), Mis datos (respaldo, exportar e importar comidas), Asistente de IA (pantalla propia), Apariencia, Fuentes de datos, Cómo funciona.
* Componentes compartidos: Selector de comida (hoja inferior con búsqueda, Recientes, Mis comidas del tipo, Ideas, Armar nueva y Sugerime), Hoja de detalle, Menú ⋯ y Aviso con Deshacer.

## Herramientas avanzadas: se integran, no se borran

* Mis precios de referencia: pasan a ser "Mi precio", una corrección por ingrediente sobre el precio automático (misma clave `miPlatoFacil_referencePrices_v1`).
* Costos: automáticos. ≈ por porción en cada comida, por día y semana en Semana, por ítem y total en Compras. Si faltan precios: "≈ $X (faltan 2 precios)".
* Presupuesto: barra arriba de la lista, estimado contra presupuesto. Se edita tocándola o en Preferencias.
* Compras realizadas: "Terminé de comprar" pide, opcional, monto y comercio; "Cargar detalle del ticket" actualiza Mis precios. Historial en el menú ⋯ de Compras.
* Existencias y movimientos: una sola despensa; cada ítem muestra cantidad e historial. Lo compré suma y Lo cociné descuenta.
* Calcular compras por recetas, Descontar lo que tengo y Ajustar porciones: pasan a ser el comportamiento de la lista (porciones de cada comida del plan e interruptor "Descontar lo que tengo").
* Comparar alternativas de precio: rango del ingrediente (más barato y típico) y diferencia con Mi precio.
* Equivalencias: sugerencias en la lista ("¿Tomate perita es lo mismo que Tomate?"); administración en Preferencias → Ingredientes.
* Objetivos semanales y Lo que comí: resumen en Semana ("Verduras en 9 de 14 comidas"); objetivos en Preferencias.
* Historial del plan, semanas con fecha y variaciones: menú ⋯ de Semana.
* Modo simple: lo reemplaza "Mostrar precios y presupuesto" en Preferencias; `miPlatoFacil_uiMode_v1` define su valor inicial.

## Precios automáticos (igual que la nutrición)

* Fuente base (Etapa 7): INDEC, precios promedio de una selección de alimentos según regiones (Cuadro 19 del informe del IPC). Archivo `https://www.indec.gob.ar/ftp/cuadros/economia/sh_ipc_precios_promedio.xls`, mensual, regiones GBA, Pampeana, Noreste, Noroeste, Cuyo y Patagonia, series desde diciembre de 2016. Referencia de septiembre de 2026 en GBA: arroz blanco $1.905,45 el kg; fideos guiseros $1.751,06 los 500 g; huevos $3.940,50 la docena.
* Ampliación (Etapa 9): Precios Claros – Base SEPA, `https://datos.produccion.gob.ar/dataset/sepa-precios` (portal CKAN, licencia CC BY 4.0). Un ZIP diario de unos 300 MB (zip de zips por comercio) con `comercio.csv`, `sucursales.csv` y `productos.csv`. Este trae `productos_precio_lista`, `productos_precio_referencia`, `productos_cantidad_referencia` y `productos_unidad_medida_referencia` (precio por kg o litro). Cubre todo lo que tiene código de barras, por provincia.
* Archivos: `datos/precios-mapa.json` (curado: cada ingrediente de la app con su producto INDEC y la conversión de unidad; para SEPA, reglas de búsqueda por descripción, marca o EAN y unidad), `herramientas/actualizar-precios.mjs`, `datos/precios.json` (por ingrediente y región: precio por unidad base, mes y fuente; con SEPA, mediana y percentiles 25 y 75), marca `__DATOS_PRECIOS__` en `construir.mjs` y `.github/workflows/actualizar-precios.yml` (INDEC mensual; semanal si se suma SEPA), que reconstruye y publica como la de nutrición.
* Antes de programar, mirá el formato real del archivo (XLS binario o XLSX). Preferí sin dependencias; si no se puede, una dependencia fijada solo para la tarea, nunca en la app. Si la descarga falla, se conserva el último archivo.
* En la app, el precio sale de Mi precio, si no de SEPA y si no de INDEC, con fuente y mes visibles ("Promedio INDEC · GBA · sept. 2026"). Región en Preferencias, GBA por defecto. Para convertir cantidades, usá las porciones unidad→gramos que ya trae la nutrición. Atribución en Más → Fuentes de datos.
* Las pruebas usan un archivo de ejemplo chico, nunca descargas reales.
* Si desde tu entorno no llegás a INDEC o a SEPA, no es motivo de parada: la descarga real la hace GitHub Actions, que sí tiene internet. Para ver el formato, sumá al PR borrador una tarea de prueba que descargue, procese y suba el resultado como artifact, sin commitear, y leelo con `gh api`. Si tampoco se puede, usá un archivo de ejemplo armado con el Cuadro 19 del informe del IPC y anotalo en los pendientes para mí.

## Modo autónomo: cómo se valida sola cada etapa

Trabajás las etapas en orden y pasás a la siguiente sin esperarme. Cada etapa sigue este ciclo:

1. Rama: `git switch -c rediseno/etapa-N-tema rediseno`.
2. Plan corto en el Registro: archivos, riesgos para los datos y pruebas que van a cambiar. `revisor-codigo` lo critica antes de que toques código.
3. Implementación. Conviene delegarla en un subagente con contexto limpio mientras vos coordinás; así tu contexto no se llena de una etapa a otra.
4. Compuerta: `node herramientas/validar-etapa.mjs N` tiene que terminar en "VALIDACIÓN ETAPA N: OK". Controla:
   * `construir.mjs --verificar` y todas las pruebas en verde;
   * que la cantidad de pruebas, total y por batería, no baje respecto de `docs/validacion/linea-base.json`;
   * que siga existiendo cada clave `miPlatoFacil_*` de la línea base y que el respaldo de ejemplo se restaure completo;
   * las medidas de `herramientas/capturas.mjs` contra `docs/validacion/criterios.json`: los criterios de esta etapa y de las anteriores (nada vuelve atrás), sin errores de JavaScript ni scroll horizontal, en tema claro y oscuro;
   * que `criterios.json` no sea más permisivo que en el tag `etapa-0-ok`;
   * que no haya dominios externos nuevos en `fuente/` ni dependencias nuevas en la app.
5. Revisores independientes, con contexto limpio y sin editar: `revisor-codigo` lee el diff contra este plan (datos en riesgo, pruebas debilitadas, requisitos sin cumplir) y `revisor-usuario` mira las capturas antes y después como alguien que abre la app por primera vez (si se entiende, si hay una acción principal clara, si hay textos cortados o superpuestos). Cada uno responde BLOQUEANTE o NO BLOQUEANTE. Lo bloqueante se corrige y se vuelve al paso 4; lo no bloqueante va al Registro como mejora sugerida, sin perseguirlo. Si los subagentes nuevos no aparecen en la sesión, usá uno general y pasale el archivo como instrucciones.
6. Si todo pasa: merge sin fast-forward de la rama de la etapa en `rediseno`, tag `etapa-N-ok` y push de `rediseno` y del tag. Actualizá la línea base (las pruebas solo pueden subir), el Registro (✅, medidas antes y después, decisiones) y el PR borrador. Mostrá en la conversación la salida de la compuerta y la línea del Registro.
7. Si después del push fallan las pruebas de GitHub del PR borrador, la etapa siguiente empieza arreglando eso.
8. Pasá a la siguiente etapa sin esperarme.

## Condiciones de parada

* Hasta 3 intentos completos por etapa. Si el tercero falla, la rama queda sin mergear (con push, para que la vea), escribís en el Registro "⛔ PARADA" con el diagnóstico y 2 o 3 opciones, y terminás.
* También parás, sin hacer el cambio, si algo necesitara borrar datos de usuarios, cambiar su formato sin una migración segura, o tocar `main`, permisos o configuración de GitHub, secretos o cuentas.
* Fuera de esos casos no parás: lo externo que falte va a los pendientes para mí y seguís.

## Etapas

Cada etapa entra a `rediseno` cuando pasa su compuerta. En la Etapa 0, cada "Hecho cuando" se vuelve un control de `docs/validacion/criterios.json` o una prueba; lo que no se pueda medir lo juzga `revisor-usuario` con las capturas.

### Etapa 0. Red de seguridad (sin cambios visibles)

* Agregá al final de `docs/plan-rediseno.md` (lo guardaste al arrancar) la sección "Registro": por etapa, estado (✅, ⏳ o ⛔), tag, medidas antes y después, decisiones que tomaste sin mí, mejoras sugeridas y pendientes para mí.
* Creá un `CLAUDE.md` corto con los comandos (construir, verificar, pruebas, capturas y validar), las reglas 1 a 8 resumidas, el ciclo del modo autónomo, las condiciones de parada, el vocabulario y la línea "El plan del rediseño y el Registro están en docs/plan-rediseno.md".
* Si podés, abrí un PR borrador `rediseno` → `main` con `gh api`: así cada push a `rediseno` corre las pruebas en GitHub y el avance se ve desde ahí.
* `herramientas/validar-etapa.mjs N`: la compuerta del modo autónomo. Termina con "VALIDACIÓN ETAPA N: OK" o con la lista de fallas, y sale con código distinto de 0 si algo falla.
* `docs/validacion/criterios.json`: un control medible por cada "Hecho cuando" de las etapas 1 a 10, con la etapa desde la que aplica. `docs/validacion/linea-base.json`: pruebas por batería, claves `miPlatoFacil_*` y medidas de la v14.9.94.
* Subagentes `.claude/agents/revisor-codigo.md` y `.claude/agents/revisor-usuario.md`: herramientas Read, Grep, Glob y Bash, nunca editan y responden BLOQUEANTE o NO BLOQUEANTE con el motivo.
* `herramientas/capturas.mjs`, sin dependencias y con el mismo enfoque que `probar.mjs`: abre la app a 390×844 con datos de ejemplo, en tema claro y oscuro, y guarda una captura por pantalla en una carpeta ignorada por git. También mide el alto (px) y las palabras visibles de cada pantalla.
* `pruebas/fixtures/respaldo-v14.9.94.json`: respaldo completo inventado, con todos los módulos y datos realistas. Prueba nueva: se restaura, cada pantalla abre sin errores y los conteos coinciden. Corre en todas las etapas.
* `pruebas/j01_recorridos.js`: recorridos que hoy funcionan y no se pueden romper: armar y guardar un plato, asignarlo a un día, ver la lista, tachar y Lo compré, Lo comí con Deshacer, respaldar y restaurar. Sumá las pruebas nuevas a `pruebas/suites.json`.

Hecho cuando: pruebas en verde (375 más las nuevas); `validar-etapa.mjs 0` en OK; la compuerta probada en falso (en una rama aparte rompés una prueba a propósito, la compuerta tiene que fallar y esa rama no se mergea); y capturas y medidas de referencia en el Registro.

### Etapa 1. Confianza (P4 a P9, P13 y P14)

* Desayuno: elegir qué fruta (banana, manzana, naranja, mandarina, pera, frutillas, kiwi, durazno, uvas…) y aparte la forma. "Huevo | Clara de huevo" pasa a "Huevos". Revisá todas las opciones para que lo comprable sea un alimento. Los platos ya guardados se corrigen al mostrarlos, sin reescribir lo guardado.
* Lista: tachados guardados por semana (clave nueva) que sobreviven a recargar; lo comprado sale de Pendientes y va a "Ya en tu despensa"; lo que está en la despensa va a "Ya tenés" (plegado), salvo que falte cantidad.
* Sin "¿Entrenás hoy?" cuando la rutina lo sabe: chip "Día de entrenamiento · cambiar" y el armado arranca en Verduras.
* Al guardar, una hoja con nombre sugerido y editable ("Pollo con arroz y ensalada"). Los platos viejos sin nombre reciben uno automático al mostrarlos. Nunca dos nombres iguales en un selector.
* "Sugerir al azar" y "Plato del día" eligen del catálogo de ideas y de tus comidas, filtrando por tipo de comida, entrenamiento, preferencias y despensa. En desayunos pueden seguir combinando las opciones del armado. Si el catálogo queda corto, proponé platos comunes en Argentina con sus ingredientes vinculados, para que los revise en el PR final. En el armado, harinas, féculas y pan rallado pasan a "Más opciones".
* Las ideas se pueden tocar: abren un detalle con Guardar y Agregar a la semana.
* Sin botón flotante "Consejos": las ideas, los métodos de cocción, los snacks y el pre-entreno pasan a una pantalla Ideas (en la Etapa 4 va a Comidas).
* Asistente de IA en pantalla propia; inputs con el estilo del sistema; sin barra de pasos fuera del armado.
* Textos: reescribí las ayudas largas en una línea.

Hecho cuando: ningún ítem de la lista es una forma ("En trozos", "Licuado"); los tachados sobreviven a recargar; el armado con rutina no pregunta; 50 sugerencias seguidas de almuerzo o cena salen del catálogo o de tus comidas; las pantallas tocadas tienen 40 % menos palabras visibles.

### Etapa 2. Selector de comida y nueva Semana (P2, P3 y P15)

* Selector de comida reutilizable (hoja inferior).
* Semana según "Estructura objetivo". El plan sigue guardado por día de la semana: las fechas son solo de presentación.
* Primer uso de una semana nueva: aviso "¿Repetís el plan o empezás de cero?". Si empieza de cero, antes se guarda una copia fechada de la semana anterior.
* Armar una comida desde un hueco vuelve a ese hueco con la comida asignada.
* Verduras y demás listas largas del armado, en grilla de chips con búsqueda.

Hecho cuando: Semana con plan completo mide 1,5 pantallas o menos, y asignar una comida guardada a un hueco lleva 3 toques o menos.

### Etapa 3. Hoy (P1 y parte de P2)

* Hoy según "Estructura objetivo", con el Selector: elegir y registrar sin salir de Hoy.
* "Sugerime algo" reemplaza a Plato del día y a Sugerir al azar como entradas separadas.

Hecho cuando: desde Hoy, elegir y marcar Lo comí en un hueco vacío lleva 3 toques o menos.

### Etapa 4. Comidas y nueva estructura (P9 y P10)

* Pestañas Hoy · Semana · Comidas · Compras · Más. Las recetas salen de "Con lo que tengo" y viven en Comidas.
* Tarjeta única para platos y recetas: los datos siguen separados y un adaptador los presenta igual.
* Formulario de receta en pantalla propia, con secciones plegables: Ingredientes, Preparación y Más detalles.
* Nutrientes de cada comida en su detalle y de cada ingrediente al tocarlo (reemplaza "Consultar nutrientes").
* Primera vez: 3 pantallas (el método del plato con un dibujo, rutina opcional, elegir de 3 a 5 ideas para arrancar o saltar). Se vuelve a ver en Más → Cómo funciona.

Hecho cuando: un usuario nuevo arma una semana con 3 comidas en 15 toques o menos (recorrido probado) y ninguna pantalla mezcla dos temas.

### Etapa 5. Compras y Despensa (P5 y P12)

* "Lista | Despensa". Lista por secciones del súper, con cantidades sumadas y el interruptor "Descontar lo que tengo".
* Productos extra en la misma lista ("+ Agregar producto" arriba).
* "Terminé de comprar": monto y comercio opcionales (compras realizadas) y detalle de ticket opcional, que alimenta Mis precios.
* Despensa con cantidad e historial por ítem; editar y quitar con Deshacer.
* Las calculadoras sueltas se reemplazan por ese comportamiento; lo que no quede cubierto va al menú ⋯.

Hecho cuando: Compras con todo activado tiene 60 % menos palabras visibles que en la Etapa 0, y el respaldo de ejemplo se ve completo.

### Etapa 6. Un solo registro (P11)

* "Lo comí" (consumo) y "Lo cociné" (preparación), con una vista Registro por día. Los datos existentes se muestran juntos y no se borra ningún registro. Todo con Deshacer.

Hecho cuando: hay un solo lugar para ver y corregir lo registrado.

### Etapa 7. Precios automáticos de INDEC

* Según "Precios automáticos".

Hecho cuando: la lista muestra ≈ precio por ítem y total; cada comida, ≈ costo por porción; cambiar la región cambia los valores; Mi precio gana; la tarea de precios corre en el PR borrador, sin commitear, y genera un `datos/precios.json` válido (o, sin red, el archivo de ejemplo pasa las mismas comprobaciones).

### Etapa 8. Resto de las herramientas avanzadas

* Presupuesto, costos, rangos, equivalencias sugeridas, objetivos y "Mostrar precios y presupuesto", según "Herramientas avanzadas".

Hecho cuando: cada línea de "Herramientas avanzadas" está hecha o tiene una decisión escrita en el Registro.

### Etapa 9. Precios de SEPA (ampliación)

* SEPA en la tarea, semanal: mediana y rango por ingrediente y provincia, para lo que INDEC no cubre.

Hecho cuando: el 80 % o más de los ingredientes del catálogo y de las comidas de ejemplo tienen precio.

### Etapa 10. Pulido

* Dibujo del plato en el armado, estados vacíos con un próximo paso, contraste, etiquetas accesibles en todos los campos y revisión final de textos con el vocabulario.

Hecho cuando: las capturas en tema claro y oscuro no muestran superposiciones ni textos cortados, y todos los campos tienen etiqueta.

## Al terminar la Etapa 10

1. Si `main` cambió mientras trabajabas (por ejemplo, por la tarea mensual de nutrición), traelo a `rediseno` con merge, sin rebase; reconstruí y pasá la compuerta completa otra vez.
2. Escribí `docs/informe-rediseno.md`: qué cambió para el usuario, medidas antes y después por pantalla, decisiones que tomaste sin mí, mejoras sugeridas y pendientes para mí.
3. Pasá el PR `rediseno` → `main` de borrador a listo para revisar, con el informe como descripción y capturas antes y después. Si no pudiste crear el PR, explicá en el informe cómo abrirlo.
4. No lo mergees: ese merge lo hago yo.
5. Mostrá en la conversación la última salida de la compuerta y el resumen del informe.

## Arranque (solo para el primer mensaje)

Ahora hacé solo esto: creá la rama `rediseno` desde `main`, guardá este plan textual en `docs/plan-rediseno.md`, hacé commit y push de la rama, y respondé "LISTO". No empieces la Etapa 0: enseguida te mando un /goal para que trabajes solo hasta el final. Si retomás más adelante, ignorá esta sección y seguí el modo autónomo desde el Registro.

## Registro

Estados: ✅ hecha · ⏳ en curso · ⛔ parada. Cada etapa entra a `rediseno` con su tag `etapa-N-ok` cuando pasa la compuerta (`node herramientas/validar-etapa.mjs N`) y los dos revisores.

| Etapa | Estado | Tag | Versión de la app |
|---|---|---|---|
| 0. Red de seguridad | ✅ | `etapa-0-ok` | 14.9.94 |
| 1. Confianza | ✅ | `etapa-1-ok` | 15.0.0 |
| 2. Selector de comida y nueva Semana | ✅ | `etapa-2-ok` | 15.1.0 |
| 3. Hoy | ✅ | `etapa-3-ok` | 15.2.0 |
| 4. Comidas y nueva estructura | ⏳ | — | 15.3.0 |
| 5. Compras y Despensa | — | — | — |
| 6. Un solo registro | — | — | — |
| 7. Precios automáticos de INDEC | — | — | — |
| 8. Resto de las herramientas avanzadas | — | — | — |
| 9. Precios de SEPA | — | — | — |
| 10. Pulido | — | — | — |

### Etapa 0 · Red de seguridad ✅

Rama `rediseno-etapa-0-red-de-seguridad`.

**Plan corto** (revisado: revisor-codigo marcó 2 bloqueantes en la primera versión, el PR borrador y los apartados del Registro, ya corregidos)
- Archivos nuevos:
  - `CLAUDE.md`.
  - `.claude/agents/revisor-codigo.md` y `revisor-usuario.md`.
  - `herramientas/validar-etapa.mjs` (compuerta) y `herramientas/capturas.mjs` (capturas y medidas a 390×844, claro y oscuro).
  - `docs/validacion/criterios.json` y `docs/validacion/linea-base.json`.
  - `pruebas/fixtures/respaldo-v14.9.94.json`, generado con `completeBackupSnapshot` de la v14.9.94: los 24 módulos con datos inventados, incluidos los casos que las etapas siguientes corrigen al mostrar ("En trozos", "Huevo | Clara de huevo", platos repetidos como "Desayuno / Merienda" y los cinco registros de P11). Su hash va a la línea base.
  - `pruebas/k01_respaldo_ejemplo.js` y `pruebas/j01_recorridos.js`, al final de `suites.json`.
  - `.gitattributes`.
- Archivos que cambian, sin tocar la app:
  - `pruebas/suites.json` (suma k01 y j01).
  - `pruebas/run_all.js`: agrega el detalle de cada prueba sin cambiar lo que ya devolvía (`TOTAL`, cada batería y `_fallas`, que leen `probar.mjs` y la tarea de `main`).
  - `herramientas/probar.mjs`: opción `--json <archivo>` con esos resultados.
  - `.gitignore`: carpeta `capturas/`.
- PR borrador `rediseno` → `main` con `gh api`, para que cada push a `rediseno` corra las pruebas en GitHub (`pruebas.yml` solo corre en PR). Si no se puede crear, va a "Pendientes para vos".
- Capturas (`capturas.mjs`), en tres estados:
  - `vacio`: primer uso, sin datos;
  - `normal`: el respaldo de ejemplo, con la semana completa (7 × 4), en modo simple;
  - `todo`: modo completo y todos los paneles abiertos.

  Mide alto, palabras visibles, errores de JavaScript, scroll horizontal, campos sin etiqueta, elementos fuera de la pantalla, textos cortados y controles superpuestos. Las imágenes se llaman `<vista>-<estado>-<tema>.png`, con un `medidas.json` al lado. Reloj fijo: lunes 26/10/2026 a las 12:00 (Argentina). El "antes" de cada etapa se mide en este mismo equipo, desde una copia del tag anterior.
- `criterios.json`:
  - cada control tiene `id`, etapa desde la que aplica, tipo (medida, prueba, comando, registro o revisor), vista, estado, métrica, operador y umbral;
  - los de tipo prueba nombran la prueba (por su código) y la compuerta falla si desde esa etapa no existe o no pasa;
  - la compuerta compara contra el tag `etapa-0-ok`: quitar un control o aflojar un umbral cuenta como falla.
- Compuerta (`validar-etapa.mjs`):
  - nunca usa `--suites`;
  - compara la cantidad de pruebas contra la mayor entre la línea base de la rama y la de `rediseno`;
  - falla si falta una batería, si no hay navegador, si el JSON de resultados está incompleto o si, desde la Etapa 1, falta el tag `etapa-0-ok`;
  - controla que toda clave `miPlatoFacil_*` nueva entre en el respaldo como opcional (`COMPLETE_BACKUP_KEYS` y `COMPLETE_BACKUP_OPTIONAL_KEYS`);
  - no escribe archivos versionados, salvo `--actualizar-linea-base`, que solo deja subir los conteos.
- Línea base: las 26 claves (incluidas `miPlatoFacil_aiSettings_v1` y `miPlatoFacil_uiMode_v1`, que no van en el respaldo) y aparte las 24 del respaldo; los 3 dominios externos de hoy (aistudio.google.com, fdc.nal.usda.gov y generativelanguage.googleapis.com); navegador, sistema y medidas de la v14.9.94.
- k01 y j01 abren la app en un iframe del mismo origen, porque restaurar recarga la página.
  - k01: el respaldo de ejemplo se restaura y las 24 claves quedan idénticas byte a byte; recorrer todas las pantallas no escribe nada; los conteos coinciden sin depender de la fecha real.
  - j01, seis recorridos que verifican lo guardado y no textos ni ids: armar y guardar un plato, asignarlo a un día, ver la lista, tachar y Lo compré, Lo comí con Deshacer, y respaldar y restaurar. No dan por bueno nada que el plan va a cambiar (P5, P6), solo lo de "Conservar".
- Riesgos para los datos: ninguno. `fuente/` no cambia e `index.html` tiene que seguir idéntico (`construir.mjs --verificar`).
- Pruebas que cambian: ninguna existente. Se suman dos baterías.
- Compuerta probada en falso, en una rama aparte sin push ni merge, con tres casos: romper una prueba, borrar una prueba y aflojar un umbral de `criterios.json`. Se anotan la salida y el código de salida de cada uno.

**Medidas antes y después**
- La app no cambió: antes y después son la v14.9.94. Son la referencia de todas las etapas: 84 capturas (14 vistas × 3 estados × 2 temas) en `capturas/etapa-0/` (no se versionan) y sus medidas en `docs/validacion/linea-base.json` (`medidasEtapa0`).
- Entorno: Windows 10.0.22631, Chrome 156.0.8078.73, 390×844, reloj fijo lunes 26/10/2026 12:00.
- Pruebas: 387 de 387 (375 de antes, más k01 con 6 y j01 con 6), en 31 baterías.
- Alto en px / palabras visibles, tema claro:

| Vista | Vacío | Normal | Todo |
|---|---|---|---|
| Hoy | 882 / 62 | 896 / 58 | 896 / 58 |
| Semana | 5.983 / 676 | 8.118 / 1.695 | 12.357 / 2.225 |
| Compras | 1.494 / 136 | 3.820 / 438 | 15.279 / 1.857 |
| Mis comidas | 1.116 / 73 | 3.811 / 459 | 5.826 / 684 |
| Más | 964 / 74 | 964 / 74 | 964 / 74 |
| Despensa (Con lo que tengo) | 3.136 / 484 | 4.824 / 653 | 9.825 / 1.756 |
| Entrenamiento | 1.721 / 172 | 1.895 / 159 | 1.984 / 161 |
| Respaldo | 1.305 / 152 | 1.305 / 152 | 2.751 / 484 |
| Asistente de IA | 1.966 / 311 | 1.966 / 311 | 2.751 / 484 |
| Ideas (Consejos) | 3.786 / 368 | 3.786 / 366 | 3.786 / 366 |
| Armado: desayuno | 1.276 / 51 | 1.276 / 51 | 1.276 / 51 |
| Armado: almuerzo | 844 / 18 | 844 / 18 | 844 / 18 |
| Armado: verduras | 2.536 / 57 | 2.536 / 57 | 2.536 / 57 |
| Resumen | 1.169 / 49 | 1.169 / 49 | 1.169 / 49 |

- Controles de la Etapa 0: sin errores de JavaScript, pedidos a internet ni scroll horizontal en las 84 capturas, sin campos sin etiqueta ni elementos fuera de pantalla. Textos cortados: los 28 selectores de Semana ("Elegir un plato…" no entra) y uno en Compras y en Despensa con todo abierto. Las únicas superposiciones son del botón flotante "Consejos" (P9), que tapa controles en Hoy, Más, el armado y el resumen.
- Ideas mide el contenido del modal "Consejos", que tiene scroll propio (3.786 px). Semana "todo" deja abierto "Editar mi plan actual": la app cierra ese panel al abrir el editor de semanas guardadas, así que las capturas reabren los paneles que se cerraron.
- Calibración contra el plan: Semana vacía mide 5.983 px (el plan dice 5.898) y la lista de verduras, 2.536 px (el plan dice 2.531).

**Compuerta**
- `node herramientas/validar-etapa.mjs 0`: "VALIDACIÓN ETAPA 0: OK (18 controles, 3.1 min)", después de sumar lo que pidieron los revisores.
- Probada en falso en la rama local `prueba-en-falso-etapa-0` (sin push ni merge), con un commit por caso:

| Caso | Qué rompí | Qué detectó | Salida y código |
|---|---|---|---|
| 1 | La prueba K2 de k01 (pide 25 claves en vez de 24) | Pruebas en verde: 386/387, y k01 sin restaurar completo | FALLÓ (2 de 17 controles), código 1 |
| 2 | Borré la prueba J6 de j01 | Cantidad de pruebas: 386 (mínimo 387), j01 con 5 de 6 | FALLÓ (1 de 17 controles), código 1 |
| 3 | Aflojé E2-semana-alto de 1266 a 2000 px en `criterios.json` (sin commit) | criterios.json más permisivo: "E2-semana-alto: umbral más laxo (1266 → 2000)" | FALLÓ (1 de 17 controles), código 1 |

**Decisiones que tomé sin vos**
- Las ramas de etapa se llaman `rediseno-etapa-N-tema`: git no permite que existan a la vez `rediseno` y `rediseno/etapa-N-tema`, porque `rediseno` ya es una rama y no puede ser también una carpeta de ramas.
- `.gitattributes` con `* text=auto eol=lf`: los archivos se bajan con saltos de línea LF también en Windows. Sin esto, un clon en Windows los convierte y `construir.mjs --verificar` falla aunque no haya cambios.
- Las capturas usan un reloj fijo, lunes 26/10/2026 a las 12:00 (Argentina), y los datos del respaldo de ejemplo, para que las medidas sean comparables entre etapas.
- Los enlaces de atribución de los precios (Etapa 7) van en `datos/precios.json`, no en `fuente/`: así la app no suma dominios externos y la compuerta no se afloja.
- La compuerta toma las medidas de la Etapa 0, el hash del respaldo de ejemplo, los dominios y los criterios siempre del tag `etapa-0-ok`, no del archivo de la rama: así una etapa no puede pasar cambiándolos. Antes de que exista el tag, compara `criterios.json` contra el último commit (por eso el caso 3 de la prueba en falso se hizo sin commit).
- La línea base solo sube: `--actualizar-linea-base` suma pruebas y claves nuevas (y las claves nuevas quedan protegidas también en el respaldo), nunca baja nada.
- El "antes" de cada etapa son las capturas que tomó la compuerta de la etapa anterior en este mismo equipo (`capturas/etapa-(N-1)`), que equivalen al tag anterior.
- La compuerta guarda sus resultados (pruebas, registros y capturas) en `capturas/`, que no se versiona.

**Revisores**
- revisor-codigo: NO BLOQUEANTE. Sumé en esta etapa, antes del tag, lo que endurece la compuerta:
  - J6 comprueba que toda clave `miPlatoFacil_*` guardada (salvo los ajustes del dispositivo) entra al respaldo, también las armadas en el momento;
  - J4 comprueba que solo lo tachado pasa a la despensa;
  - los espacios de nombres de SVG no cuentan como dominios, y sí cuentan `wss://` y `//host`;
  - las capturas marcan como error cualquier pedido a internet;
  - la compuerta usa `origin/rediseno` si no está la rama local (y falla sin ninguna) y comprueba que el tag `etapa-0-ok` sea el publicado;
  - avisa si cambiaron las herramientas de medición desde el tag;
  - el alto toma el scroll propio de la vista y `medidas.json` guarda qué pantalla se midió;
  - control nuevo `E7-tarea-en-pr` para "la tarea de precios corre en el PR borrador".
- revisor-usuario: NO BLOQUEANTE. Las capturas sirven de referencia (las 84 revisadas por luminancia; las claras entre 224 y 246, las oscuras entre 30 y 40). Corregí en esta etapa:
  - las barras fijas tapaban contenido en las capturas largas: ahora quedan al pie;
  - Semana "todo" no mostraba el plan;
  - los selectores cortados no se detectaban.
  Sus observaciones de primer uso coinciden con P1 a P14.

**Mejoras sugeridas**
- K6 de k01 compara textos ("Tenés 28 comidas asignadas", "Tenés 9 platos y 5 recetas") que cambian en las Etapas 2 y 4: se adapta ahí, contando lo que se ve.
- En tema oscuro, el botón lleno ("Lo compré", "Sí, entreno") tiene texto blanco sobre #57C8A4, con un contraste de 2,06:1. Va a la Etapa 10 (contraste).
- En Compras aparecen cantidades como "416,666667 g" y "3 cucharada": redondear y concordar el plural (Etapa 5).

**Pendientes para vos**
- Ninguno en esta etapa. El merge final a `main` es tuyo.

### Etapa 1 · Confianza ✅

Rama `rediseno-etapa-1-confianza`. Versión 15.0.0.

**Plan corto**
- Comida real en la lista (P4):
  - El paso Frutas pide qué fruta (16: banana, manzana, naranja, mandarina, pera, frutillas, kiwi, durazno, uvas, ananá, ciruela, melón, sandía, arándanos, mango y pomelo), con una fila de chips arriba para la forma (Entera, En trozos, Licuado, Budín, Panqueque, Tarta, Waffle, Galletas; Entera por defecto). Se guarda `fruta: {name: "Banana", quantity: "1 unidad", forma: "En trozos"}`: `name` pasa a ser la fruta y `forma` es un campo nuevo opcional.
  - Archivo nuevo `fuente/codigo/35-comida-real.js`: `comprables(nombre)` dice qué se compra para cada opción guardada. "Huevo | Clara de huevo" → "Huevos"; una forma de fruta sin fruta (platos viejos) → "Fruta de estación"; la regla de pre-entreno → "Pan blanco" y "Fruta de estación"; "Opción ocasional: asado, vacío…" → "Carne para asado"; los snacks compuestos, a sus alimentos.
  - `extractIngredients` usa `comprables`, así la lista, las equivalencias y los objetivos ven alimentos.
  - Sinónimo nuevo "huevo | clara de huevo" → Huevo (con nombre visible "Huevos"), para que precios o existencias cargados con el nombre viejo sigan coincidiendo. Las variedades que hoy se distinguen (Avena y "Avena arrollada o instantánea", Arroz y "Arroz (integral, yamaní)") siguen distintas, como pide f01_key.
  - Los platos guardados se corrigen al mostrarlos: tarjetas, resumen y lista usan los nombres nuevos sin reescribir `miPlatoFacil_saved`.
- Lista (P5):
  - Clave nueva `miPlatoFacil_shoppingChecks_v1`: los tachados por semana, `{"2026-10-26": ["tomate", …]}` (la semana empieza el lunes). Entra al respaldo como opcional y se valida al restaurar; un respaldo viejo sin ella no la toca.
  - Lo que está en la despensa (lo básico, otros ingredientes o existencias que alcanzan) va a un grupo plegado "Ya tenés (N)". Si hay cantidad registrada y no alcanza, sigue en Pendientes con "faltan X".
  - "Lo compré" suma a la despensa (como hoy) y destacha lo que pasó, así lo comprado sale de Pendientes y queda en "Ya tenés".
- Sin "¿Entrenás hoy?" cuando la rutina lo sabe (P6):
  - Si `trainingDayForDate(hoy)` no es null, el armado de almuerzo o cena arranca en Verduras, con un chip "Día de entrenamiento · cambiar" (o "Día libre · cambiar") arriba de cada paso.
  - Sin rutina, pregunta como hoy. Las proporciones se editan desde el resumen, como ya se puede.
- Nombres (P7):
  - Al guardar, una hoja inferior con el nombre sugerido y editable ("Merluza con papa y tomate"). Se guarda en `note`, el campo que ya usa "Renombrar".
  - `mealName(item)` arma un nombre automático, al mostrarlos, para los platos viejos sin nombre (Mis comidas, Semana, Hoy, historial).
  - `mealLabels(items)` evita nombres repetidos en los selectores: agrega "· día de entrenamiento" o "· día libre" y, si siguen iguales, un número.
- Sugerencias (P8):
  - "Sugerir al azar" y "Plato del día" eligen del catálogo de ideas y de tus comidas guardadas.
  - Filtran por tipo de comida y por preferencias (ingredientes a evitar), y dan más chances a lo que usa tu despensa.
  - Cada idea del catálogo suma `ingredientes` vinculados a las opciones del armado, así se puede guardar como comida y entra a la lista. El día (entrenamiento o libre) sale de la rutina.
  - Sumo unos 12 platos comunes en Argentina con sus ingredientes vinculados, marcados para revisar en el PR final.
  - Desayuno sigue combinando las opciones del armado.
  - En Almidones, harinas, féculas y pan rallado pasan a "Más opciones" (plegado).
- Ideas (P9):
  - Sin botón flotante "Consejos". El modal pasa a ser una pantalla Ideas con sus cuatro partes (platos, cocción, snacks y pre-entreno), con entrada desde Hoy y Mis comidas.
  - Tocar una idea abre su detalle en una hoja inferior, con Guardar y Agregar a la semana (día y comida). Las ideas de "Con lo que tengo" también se pueden tocar.
- Asistente de IA en pantalla propia (Más → Asistente de IA), con el estilo del sistema en sus campos (clave de Gemini, buscador de recetas del plan y selector de archivo del respaldo). La barra "Volver al paso anterior" solo aparece en los pasos del armado (P14).
- Textos (P13): ayudas de una línea, sin advertencias, en Compras, Despensa, Respaldo y Asistente de IA (meta: 40 % menos palabras visibles en el estado normal).
- Archivos:
  - `fuente/codigo/`: 01, 02, 04, 06, 07, 08, 09, 10, 12, 13, 14, 18, 29, 32 y 34, y los nuevos `35-comida-real.js`, `36-sugerencias.js` y `37-ideas-y-hoja.js`;
  - `fuente/cuerpo/`: `final.html` (sin el modal) y en `pantallas/` las de frutas, almidones, compras, despensa y respaldo, más las nuevas `21-ideas.html` y `22-asistente.html`;
  - `fuente/estilos.css`;
  - `herramientas/capturas.mjs`: solo el camino de las vistas `ideas` e `ia`, que pasan a ser pantallas; miden lo mismo.
- Riesgos para los datos:
  - clave nueva `miPlatoFacil_shoppingChecks_v1`: respaldo opcional y validación al restaurar;
  - `fruta.forma` es un campo nuevo opcional dentro de lo guardado, que la validación de importar ya acepta; los platos viejos no se reescriben;
  - el nombre va en `note`, que ya existe; ninguna clave cambia ni se borra.
- Pruebas que cambian, porque solo miran la interfaz vieja:
  - `regression.js`: R20 abría "Consejos" (ahora abre la pantalla Ideas) y los pasos que tocan `[data-day]` cuando ya no se pregunta;
  - `n01_nav.js`: N16 (el asistente ya no está dentro de Respaldo);
  - `f08_ai.js`: abre la pantalla nueva;
  - `r2_shop.js` y `r4_ux.js`: lo que leen del texto de ayuda de Compras y de las sugerencias de despensa, que pasan a "Ya tenés".
  Las de datos y lógica no cambian.
- Pruebas nuevas, batería `e1_confianza.js`:
  - C1-1: la lista del respaldo de ejemplo no tiene formas;
  - C1-2: los tachados sobreviven a recargar;
  - C1-3: con rutina no pregunta;
  - C1-4: 50 sugerencias seguidas de almuerzo o cena salen del catálogo o de tus comidas;
  - además: nombres sin repetir, fruta elegida en la lista, respaldo con la clave nueva, respaldo viejo sin ella y "Lo compré" que pasa a "Ya tenés".

**Plan corto, segunda versión** (revisor-codigo marcó 4 bloqueantes en la primera; esto la corrige y manda sobre lo de arriba)
- Lista:
  - La clave nueva `miPlatoFacil_shoppingChecks_v1` guarda por semana `{"2026-10-26": {"t": [tachados], "c": [comprados]}}`.
  - "Lo compré" pasa lo tachado a "Ya en tu despensa (N)", plegado, y ahí queda toda la semana aunque después cambie la despensa o "Lo cociné" descuente. Lo que ya estaba en la despensa va a "Ya tenés (N)", también plegado; si hay cantidad registrada y no alcanza, sigue en Pendientes con "faltan X".
  - "Lo compré" suma lo que falta cuando se conoce (lo que hoy hace "Anotar"), si no la cantidad del plan. Así no infla las existencias. "Anotar" queda integrado como comportamiento normal.
  - El Deshacer de "Lo compré" restaura también los tachados y comprados: la clave nueva entra a lo que guarda el Deshacer.
  - Se escribe solo cuando el usuario actúa (nunca al mostrar). Al escribir se conservan las últimas 12 semanas. La semana se calcula con `mondayOf`.
  - Respaldo: la clave va en `COMPLETE_BACKUP_KEYS`, en `COMPLETE_BACKUP_OPTIONAL_KEYS` y en la lista que se omite cuando no hay datos, así un respaldo sin tachados lo sigue restaurando la v14.9.94. Tiene un validador con límites (fechas válidas, listas de textos, máximo 520 semanas, sin `__proto__`) y una lectura tolerante.
- Pruebas de lógica que cambian, con su reemplazo de la misma fuerza:
  - `r2_shop.js` S1 a S4, S8, S10 y S12; `u01_toque.js` U6, U8 y U9; `dp01_despensa.js` DP10; `r4_ux.js` X7.
  - Lo que antes era "la lista no cambia" pasa a ser: Pendientes, "Ya tenés" y "Ya en tu despensa" juntos tienen siempre los mismos ítems, con las mismas cantidades del plan, cambie o no la despensa.
  - El multiplicador, los precios y el presupuesto no mueven ningún ítem entre grupos.
  - Tocar "Lo compré" dos veces no suma dos veces (U8).
  - Con "faltan X", "Lo compré" suma solo lo que faltaba (U9).
  - U7: Deshacer devuelve también los tachados.
  - Las sugerencias de despensa (`shoppingSuggestion`) no cambian; cambia dónde se muestran.
- Sugerencias por entrenamiento:
  - Con rutina, para un día de entrenamiento no salen tus comidas guardadas como "Día libre", ni al revés. Las ideas del catálogo se cargan con el día de la rutina, y así toman sus proporciones.
  - El armado iniciado desde un hueco de Semana usa la rutina de ese día, no la de hoy.
  - Si las preferencias dejan sin candidatos, se avisa ("No hay ideas que no tengan lo que evitás"); nunca se vuelve a combinar ingredientes sueltos.
  - "Sugerir al azar" de desayuno elige una fruta real.
- Comida real:
  - `comprables` cubre también los platos que solo tienen `lines`, con la cantidad en el nombre ("En trozos (2 unidades…)", "Huevo | Clara de huevo (1 unidad | 2 unidades)").
  - C1-1 suma un plato así. "Frutos secos: …", "Semillas: …" y las "Opción ocasional" se acortan a alimentos.
  - No cambia el `text` de las ideas ni las etiquetas de `data.snacks`, que son la clave de los favoritos: solo se suma `ingredientes`.
- Nombres:
  - El nombre se acorta antes de agregarle el sufijo que lo diferencia.
  - Todos los selectores (plan, semanas guardadas, consumo e historial) usan `mealLabels`.
- Agregar a la semana desde una idea: se guarda con el mismo formato que un plato armado (`state`, `lines`, nombre en `note`). Se asigna con la función de asignación de siempre (historial y porciones), con Deshacer si reemplaza algo.
- Decisión: el paso Frutas suma palabras (16 frutas y las formas). El 40 % menos se mide en las 4 pantallas de `criterios.json`.
- Revisión de la segunda versión: NO BLOQUEANTE. Decisiones tomadas con sus sugerencias:
  - "Lo compré" tiene su propia lista de claves para el Deshacer, así tachar algo después de "Lo cociné" no bloquea el Deshacer de "Lo cociné".
  - Las semanas guardadas se recortan a las últimas 12 recién en la próxima escritura, nunca al leer.
  - Cada semana nueva (lunes) empieza sin tachados; lo de semanas anteriores queda guardado.
  - Quitar la marca a algo de "Ya en tu despensa" lo devuelve a Pendientes sin tocar la despensa (para revertirla está el Deshacer).

**Medidas antes y después** (alto en px / palabras visibles, estado normal, tema claro; antes = `capturas/etapa-0`, después = `capturas/etapa-1`)

| Vista | Antes | Después |
|---|---|---|
| Compras | 3.820 / 438 | 2.940 / 225 |
| Despensa (Con lo que tengo) | 4.824 / 653 | 3.558 / 268 |
| Respaldo | 1.305 / 152 | 944 / 36 |
| Asistente de IA | 1.966 / 311 | 975 / 83 |
| Ideas | 3.786 / 366 | 6.047 / 460 |
| Hoy | 896 / 58 | 984 / 69 |
| Armado: almuerzo | 844 / 18 | 2.575 / 56 |
| Armado: desayuno | 1.276 / 51 | 1.436 / 71 |
| Resumen | 1.169 / 49 | 1.148 / 50 |

- Las cuatro pantallas tocadas bajaron 49 %, 59 %, 76 % y 73 % de palabras (meta: 40 %).
- "Armado: almuerzo" crece porque, con rutina, arranca directo en Verduras en vez de preguntar "¿Entrenás hoy?".
- Ideas crece porque pasó de un modal con scroll propio a pantalla, con las 12 ideas nuevas y "Guardar idea" en cada una.

**Compuerta**
- "VALIDACIÓN ETAPA 1: OK (28 controles)". Pruebas: 413/413 (eran 387). Batería nueva `e1_confianza.js` con 26 pruebas.

**Revisores**
- revisor-codigo, sobre el plan: BLOQUEANTE en la primera versión (4 puntos); NO BLOQUEANTE en la segunda.
- revisor-codigo, sobre el diff: NO BLOQUEANTE. Corregí su sugerencia: "Lo compré" ya no suma cantidad si la despensa alcanzaba (prueba E1-6b).
- revisor-usuario: BLOQUEANTE (el resumen seguía mostrando "Huevo | Clara de huevo", el título "Desayuno / Merienda" y "Guardar" como secundario). Corregido; en la segunda revisión, NO BLOQUEANTE.

**Pruebas adaptadas** (ninguna borrada; ninguna batería bajó)
- `r2_shop`:
  - S1b, S10a y S10b: además de la sugerencia, verifican que el ítem va a "Ya tenés".
  - S2a a S2d: "Anotar" pasa a "· faltan X" en la fila y en Copiar.
  - S3: los tres grupos juntos tienen siempre los mismos ítems y cantidades; multiplicador, precios y presupuesto no mueven nada de grupo.
  - S4a a S4c: "Tachar" se reemplaza por el grupo "Ya tenés".
  - S8: "faltan" se actualiza.
  - S12: el texto de ayuda nuevo.
- `u01`:
  - U6: lo comprado pasa a "Ya en tu despensa".
  - U7: el Deshacer devuelve tachados y comprados.
  - U9: suma solo lo que falta.
- `regression`: R1, R3, R7 y R14 eligen forma y fruta, confirman la hoja de nombre y verifican "Banana" y nunca "Licuado". R20 abre la pantalla Ideas en vez de "Consejos".
- `n01`: N8 (Hoy muestra el nombre de la comida) y N16 (el Asistente tiene pantalla propia).
- `j01`: `manejo.guardar` confirma la hoja de nombre (lo que se verifica no cambió).
- Otras:
  - `f03` P7 y `l01` L4/L12 usan el nombre automático;
  - `bkp02` C5 lee la nota como texto;
  - `f04` G10b busca la idea por nombre (las 12 nuevas la corrieron de página);
  - `r2_fixtures` `reset()` cierra los grupos.

**Decisiones que tomé sin vos**
- La lista ya no es "intocable": nada se borra, pero lo que tenés y lo que compraste pasan a grupos plegados ("Ya tenés", "Ya en tu despensa"), como pide la Etapa 1. Esto reemplaza la regla vieja "Compras no cambia sola".
- Paso Frutas: primero la forma (Entera por defecto) y después la fruta, en dos columnas.
- Ideas es una tarjeta más en "Armar una comida" de Hoy y tiene un enlace en Mis comidas.
- "Copiar lista" copia solo lo pendiente sin tachar.
- El nombre de una comida se guarda en `note`. La nota ya no se muestra aparte ("🏷️"): pasa a ser el título de la tarjeta.
- El aviso de privacidad de Gemini quedó plegado ("ⓘ Privacidad").
- El registro de consumo sigue guardando el título viejo (`savedItemTitle`), para no cambiar ese dato guardado.
- Las 12 ideas argentinas nuevas están marcadas `nueva: true` en `01-datos-y-estado.js`, para que las revises.

**Mejoras sugeridas**
- Cantidades sin plural y con muchos decimales ("5 unidad", "166,666667 g"): Etapa 5 (las fijan varias pruebas de lógica).
- Resumen con 4 acciones secundarias (Compartir, Imagen, Copiar y Armar otro plato): pasar Imagen y Copiar a un menú "⋯".
- Ideas: lista larga en una columna; conviene paginar o plegar por tipo (Etapa 4, Comidas | Ideas).
- Una sugerencia "info" (parte sin cantidad) manda el ítem a "Ya tenés", plegado; puede esconder algo que falta.
- El contador "N pendientes · M tachados" no cuenta lo tachado dentro de "Ya tenés".
- Quedan reglas CSS `.advice-fab` del botón que ya no existe.
- "Publicación e instalación" no encaja en Respaldo (Etapa 4: Más).
- El aviso de "herramientas ocultas" ocupa 3 líneas en Compras, Despensa y Mis comidas.

**Pendientes para vos**
- Revisar las 12 ideas argentinas nuevas del catálogo (`nueva: true`).

### Etapa 2 · Selector de comida y nueva Semana ✅

Rama `rediseno-etapa-2-selector-y-semana`. Versión 15.1.0.

**Plan corto**
- Selector de comida (componente compartido, P2 y P3):
  - Usa la `hoja` que ya existe (`37-ideas-y-hoja.js`); `selectorDeComida({dia, comida, alElegir})` arma su contenido. Título "Almuerzo del martes".
  - Arriba, un buscador (filtra por `mealName`, sin tildes, con `normalizeSearchText`). Debajo, en este orden:
    - Recientes: hasta 4 comidas del tipo, por último uso en Lo que comí y `savedAt`.
    - Mis comidas del tipo: favoritas primero, nombres de `mealLabels` (nunca dos iguales). Incluye tus recetas con ingredientes, que se asignan con la misma lógica de "Asignar receta al plan actual".
    - Ideas: el catálogo filtrado con `sugerenciasPara`, solo en almuerzo y cena.
    - Dos botones: Armar nueva y Sugerime (propone una con `elegirSugerencia`: "Usar esta" u "Otra").
  - Tocar una comida asigna en el momento (con `setSlot`: historial y porciones como siempre), cierra la hoja y muestra "Asignado · Deshacer" si reemplazó algo. Tocar una idea la guarda y asigna con `agregarIdeaALaSemana`.
  - Desayuno y merienda usan las comidas de tipo `desayuno`; almuerzo y cena, las de tipo `plato` (`slotPool`, como hoy).
- Semana (`05-plan.html` reescrita, render nuevo en `10-plan-semanal.js`):
  - Encabezado "Esta semana · 26 oct – 1 nov" (lunes con `mondayOf`, solo de presentación) y el botón ⋯.
  - Fila de 7 chips L–D con el número del día y la completitud ("3/4", con un anillo). El día elegido arranca en hoy y queda marcado (`aria-pressed`). Debajo, ese día con sus 4 comidas en el orden del día.
  - Hueco vacío: una fila "Elegir" que abre el Selector.
  - Hueco lleno: nombre (dos líneas como máximo); al tocarlo, una hoja con Cambiar (abre el Selector), Quitar (con Deshacer), Porciones (solo recetas con rendimiento: el mismo campo `data-plan-portions` y su validación de hoy) y Lo comí (solo en el día de hoy: el mismo registro `data-plan-eaten` de hoy).
  - Se van los 28 `select` con "Asignar", "Crear y guardar un plato" en cada hueco y las ayudas largas (resuelve los selectores cortados de la Etapa 0).
  - "Elegir" en Hoy abre Semana en ese día con el Selector de ese hueco (la Hoy nueva es la Etapa 3).
- Menú ⋯ de Semana: una hoja con la lista. Cada ítem abre una pantalla nueva `planHerramientas` ("Semana › …", con Volver) que muestra solo ese panel. Los paneles de hoy se mudan ahí sin cambiar ids ni lógica.
  - Repetir semana anterior: usa la copia fechada del lunes anterior (`reuseDatedWeek`); si no hay, el ítem lo dice y no hace nada.
  - Copiar un día: hoja "Copiar el lunes a…" con chips de días; una sola escritura del plan, `prunePlanPortions`, una línea de historial y Deshacer.
  - Vaciar: sin confirmación, con Deshacer (plan y porciones).
  - Planes guardados: las variaciones (`varSelect`, Guardar y Borrar variación).
  - Semanas anteriores y mes: `monthlyPlanPanel`, `datedWeeksPanel` y `datedEditPanel`.
  - Historial de cambios: `planHistoryPanel`.
  - Descargar: el panel de descarga HTML.
  - Además, para que nada quede sin lugar: "Buscar en mis recetas" (`planRecipeReference`) y "Lo que comí y objetivos" (`consumptionPanel` con `habitGoalsPanel`).
  - Modo simple: el menú muestra todo en los dos modos, porque ya nada ocupa la vista. Sale el grupo `plan` de `ADVANCED_TOOLS` y su aviso de "herramientas ocultas" en Semana; los demás grupos no cambian.
- Semana nueva:
  - Sin clave nueva: la semana del plan es el lunes de la última entrada de `miPlatoFacil_planHistory_v1` (cada cambio ya se registra ahí). Si es anterior al lunes actual y el plan tiene comidas, arriba de los chips aparece "¿Repetís el plan o empezás de cero?" con Repetir (botón lleno) y Empezar de cero. Sin historial válido, no aparece. Mostrarlo no escribe nada.
  - Repetir: no toca el plan; guarda la copia fechada de la semana del plan si no existe y registra "Plan repetido para la semana del 26/10" (así el aviso no vuelve).
  - Empezar de cero: primero guarda la copia fechada (`datedWeekSnapshot`, con las comidas usadas) en `miPlatoFacil_datedWeeks_v1`, con el lunes de la semana del plan; si esa fecha ya tiene copia, la deja como está (puede estar editada). Después vacía el plan, poda porciones y registra. Deshacer devuelve plan y porciones; la copia queda.
- Armar desde un hueco (P3):
  - "Armar nueva" llama a `start(tipo, dia)` (ya usa la rutina de ese día) y guarda en memoria, no en `localStorage`, `armadoDestino = {dia, comida}`.
  - Al confirmar la hoja de nombre, si hay destino: guarda (o, si ya estaba igual, usa la guardada por `sig`), asigna con `setSlot`, vuelve a Semana con ese día elegido y muestra "Asignado al almuerzo del martes · Deshacer". `restart()` y cualquier armado empezado fuera de un hueco borran el destino.
- Armado en grilla (P15): las listas de más de 12 opciones (verduras, proteínas, almidones, legumbres y frutas) pasan a una grilla de chips de 2 columnas (44 px de alto) con un buscador arriba. Los chips conservan `data-name`, `data-multi` y `data-pick`, así el armado y lo guardado no cambian; lo elegido sigue marcado aunque el filtro lo esconda.
- Archivos:
  - `fuente/cuerpo/pantallas/05-plan.html` (Semana nueva) y la nueva `23-planHerramientas.html` (los paneles que se mudan).
  - `fuente/codigo/`: 06 (`start` con destino y la grilla), 09 (`savePlate` devuelve la guardada si ya existía), 10 (render de Semana, Vaciar, Copiar un día y semana nueva), 14 (eventos), 16 (se va `appendPlanAssignmentControls`), 24 (Lo comí desde la hoja), 30 (sale el grupo `plan`), 31 ("Elegir" de Hoy), 37 (destino al guardar) y el nuevo `38-selector-de-comida.js`.
  - `fuente/estilos.css`: chips de días, huecos, grilla y buscador con el sistema de diseño.
  - `herramientas/capturas.mjs`: solo cómo el estado `todo` abre los paneles de Semana, que pasan a `planHerramientas`. Las medidas son las mismas (la compuerta va a avisar que cambió la herramienta).
  - `fuente/version.json` → 15.1.0.
- Orden de arranque: `init()` corre al cargar `14-eventos-y-arranque.js`, y la pestaña recordada (32) puede llamar a `renderPlan()` antes de que carguen 37 y 38. Por eso `renderPlan` solo usa lo definido hasta el 13 o declaraciones `function` (que se elevan); la `hoja`, el Selector y `armadoDestino` se usan recién al tocar.
- Riesgos para los datos:
  - `miPlatoFacil_plan` sigue con el mismo formato, por día de la semana (`lunes`…`domingo` × 4 comidas). Las fechas son solo de presentación.
  - Se leen: `plan`, `saved`, `planPortions_v1`, `planHistory_v1`, `datedWeeks_v1`, `planVars`, `consumption_v1`, `recipeDetails_v1` y `recipeAmounts_v1`.
  - Se escriben, solo cuando el usuario actúa: `plan`; `planPortions_v1` (poda al cambiar un hueco, como hoy); `planHistory_v1`; `datedWeeks_v1` (copia de la semana nueva, sin pisar una existente); `saved` (ideas, recetas y armados asignados, con el formato de siempre) y `consumption_v1` (Lo comí, como hoy).
  - No hace falta clave nueva: el destino del armado y lo que guarda el Deshacer viven en memoria, y la semana del plan sale del historial. Respaldo y restauración no cambian.
- Pruebas que cambian porque solo miran la interfaz vieja (ningún dato ni regla cambia; la misma cantidad de pruebas):
  - `j01` `asignar`: toca el hueco y la comida en el Selector, en vez de `select` + Asignar. Sigue verificando lo guardado en `miPlatoFacil_plan`.
  - `regression` (las de plan, líneas 45 a 63): asignan con el Selector; variaciones, semanas fechadas y mes se abren desde el menú ⋯; las mismas comprobaciones de datos.
  - `e1_confianza`: C1-3 entra al armado por "Armar nueva" del Selector del lunes y del martes; la de nombres sin repetir lee las filas del Selector de `lunes|cena` en vez de las `option`.
  - `k01` K6 (anotada en la Etapa 0): cuenta lo que se ve, la suma de los chips ("28 de 28"), en vez del texto "Tenés 28 comidas asignadas".
  - `n01` N10: "Elegir" abre Semana en el día de hoy y con el Selector de ese hueco (antes miraba `currentPlanPanel`).
  - `m01`, grupo `plan`: en los dos modos la vista de Semana no muestra ningún panel avanzado, el menú ⋯ los lista todos y cada uno abre con sus datos.
  - `l01` L8: "Planificar" abre "Buscar en mis recetas" en `planHerramientas` con la receta elegida.
  - `bkp02` C5 y `r3_saved`: eligen el día con el chip antes de leer `#planList`; siguen comprobando que el título se muestra como texto y los nombres de receta.
- Pruebas de lógica que cambian de camino, con la misma fuerza:
  - `f03` P1 y P2 (porciones): abren la hoja del hueco lleno → Porciones; los mismos valores válidos e inválidos y lo guardado en `planPortions_v1`. El vaciado y P8 siguen llamando a las mismas funciones (`clearPlan` ya no pide confirmación; la prueba lo admite).
  - `f06` C2a y C2b: Lo comí aparece en la hoja de los huecos de hoy y no en otros días; el registro es el mismo.
- Pruebas nuevas, batería `e2_semana.js` (al final de `suites.json`):
  - C2-1: con el respaldo de ejemplo y un hueco vacío, asignar una comida guardada cuenta 2 toques (hueco y comida); la prueba exige 3 o menos y verifica `miPlatoFacil_plan`.
  - C2-2: el plan sigue por día de semana: asignar el miércoles escribe `plan.miercoles`, con el mismo formato.
  - C2-3: armar desde un hueco vuelve a Semana en ese día con la comida asignada; si el plato ya estaba guardado, asigna el existente sin duplicarlo.
  - C2-4: semana nueva: el aviso aparece con historial de la semana anterior y no escribe al mostrarse; Empezar de cero guarda antes la copia fechada (con sus comidas) y no pisa una existente; Deshacer devuelve plan y porciones; Repetir no cambia el plan y el aviso no vuelve.
  - C2-5: hueco lleno: Cambiar, Quitar con Deshacer, Porciones solo en recetas y Lo comí solo hoy.
  - C2-6: el menú ⋯ tiene los 7 ítems del plan (más recetas y Lo que comí) y cada uno abre su panel funcionando.
  - C2-7: Copiar un día y Vaciar, con Deshacer.
  - C2-8: Selector: el buscador filtra; Recientes, Mis comidas e Ideas (solo almuerzo y cena); sin nombres repetidos; una receta con ingredientes se asigna.
  - C2-9: la grilla de verduras con búsqueda deja elegir igual que antes (`state.verduras`).
  - C2-10: encabezado "Esta semana · 26 oct – 1 nov" con el reloj fijo y chips "4/4" con la semana completa.
- Alto de Semana ≤ 1.266 px (E2-semana-alto; estado `normal`: el respaldo de ejemplo con la semana completa, en modo simple, lunes 26/10; claro y oscuro):
  - Se ve un solo día: encabezado (≈ 110 px), aviso de semana nueva (≈ 140 px; aparece porque el historial del respaldo termina el domingo 25/10), chips (≈ 70 px), 4 comidas de ≈ 90 px (nombre en dos líneas como máximo) y la barra inferior. Estimado: menos de 1.000 px, desde 8.118.
  - Ningún panel ni aviso de modo queda en la vista. El estado `todo` (modo completo) no tiene criterio de alto; sus paneles están en `planHerramientas`.

**Plan corto, segunda versión** (revisor-codigo marcó 2 bloqueantes en la primera; esto la corrige y manda sobre lo de arriba)
- Empezar de cero nunca pierde el plan:
  - Antes de vaciar se guarda la copia fechada del lunes de la semana del plan. Si esa fecha ya tiene una copia distinta del plan actual (comparando `plan` y las comidas usadas), no se pisa: el plan actual se guarda además como variación en `miPlatoFacil_planVars` ("Semana del 19/10"; si ese nombre ya existe con otro contenido, "Semana del 19/10 (2)"). Las dos claves ya están en el respaldo.
  - Si una escritura falla (`setItem` tira o `persistVars` devuelve false), no se vacía nada y se avisa "No se pudo guardar una copia; tu plan no cambió".
  - C2-4 cubre los dos casos: copia existente distinta (queda intacta y aparece la variación con el plan) y escritura que falla (con `setItem` que tira: el plan sigue igual).
- La semana del plan es `mondayOf(localTrainingDate(new Date(at)))` de la última entrada del historial (`at` está en UTC). C2-4 incluye el caso domingo 22 h de Argentina (lunes 01 h UTC), que es de la semana que termina ese domingo.
- Copia automática: en la primera escritura del plan de una semana nueva (cualquier cambio, no solo desde el aviso), si el lunes de la semana del plan no tiene copia fechada, se guarda antes de escribir. Si esa copia falla, el cambio de un hueco sigue (no borra nada) y se avisa.
- Toda escritura nueva del plan (Selector, Copiar un día, Vaciar, Deshacer, Repetir, Empezar de cero y armar desde un hueco) pasa por una sola función que guarda, poda porciones y llama a `logPlanChange`.
- Vaciar mantiene el `confirm` de hoy y suma Deshacer. Lo que guarda el Deshacer (plan y porciones de antes) vive en memoria hasta la próxima escritura del plan, así sobrevive al cambio de pestaña: al volver a Semana sigue el aviso "Plan vaciado · Deshacer".
- `m01`, reemplazo con la misma fuerza:
  - M3 (lo esencial no se oculta en modo simple): en modo simple, desde Semana, se ve `#planList` dentro de `#currentPlanPanel` (el id pasa a la vista del día), y el menú ⋯ ofrece Buscar en mis recetas, Lo que comí y objetivos, Vaciar (`[data-clear-plan]`) y Descargar. Al tocar cada uno se muestra `#planRecipeReference`, `#consumptionPanel` y `[data-download-week]`, y funcionan (la prueba busca una receta, registra una comida y descarga).
  - M4: Compras y Recetas mantienen su aviso de modo. Semana ya no lo tiene porque no oculta nada: la prueba comprueba que no haya aviso y que el menú liste todo.
  - M6 (en modo completo se ve todo): desde el menú ⋯ se muestran `varSelect`, `monthlyPlanPanel`, `datedWeeksPanel`, `planHistoryPanel` y `[data-del-var]`. La prueba lo exige en los dos modos, así que queda más estricta.
  - M7 vuelve al modo simple con el aviso de Compras en vez del de Semana.
- Pruebas de lógica que cambian de camino sin perder condiciones: R9 a R13 de `regression` (asignar, reemplazar, variaciones independientes, semana fechada independiente y mes) y `f03` P1, P2 y P8 conservan cada comprobación; solo cambia cómo se llega (Selector, hoja del hueco y menú ⋯).
- C2-7 comprueba también que el Deshacer de Vaciar devuelve las porciones (`planPortions_v1`) además del plan.
- K6 de `k01` suma los "N/4" de los 7 chips del DOM y exige "28 de 28" (no usa `loadPlan()`).
- Queda para la Etapa 8: el resumen de Lo que comí y objetivos en Semana ("Verduras en 9 de 14 comidas"). En esta etapa se llega desde el menú ⋯.

**Decisiones que tomé sin vos**
- Sugerencias de revisor-codigo sobre la segunda versión, incorporadas:
  - la copia automática de la semana anterior se guarda solo si esa semana tenía comidas;
  - si ya existe una variación "Semana del …" con el mismo contenido, se reutiliza en vez de crear "(2)";
  - el Deshacer de "Empezar de cero" devuelve el plan y las porciones, y no borra la variación ni la copia recién creadas (C2-4e).
- La copia automática va en `persistPlan`, por donde pasa toda escritura del plan (también variaciones y semanas reutilizadas). El Deshacer guarda el plan y las porciones de antes; vale hasta la próxima escritura del plan y sobrevive al cambio de pestaña.
- Cada cambio hecho desde la Semana (asignar, cambiar, quitar, copiar un día, vaciar, repetir la semana anterior y empezar de cero) se puede deshacer, no solo los que reemplazan algo.
- "Lo comí" en la hoja de un hueco solo aparece en el día de hoy (el registro no acepta fechas futuras y así era antes). Porciones aparece en todas las recetas, como antes, no solo en las que tienen rendimiento.
- En el Selector, Armar nueva y Sugerime van arriba, debajo del buscador, para no tener que bajar hasta el final de una lista larga. Recientes aparece si hay más de 4 comidas del tipo. Ideas muestra 6 (las que más usan tu despensa) y hasta 20 al buscar.
- Sugerime en desayuno o merienda arma una combinación al azar (como "Sugerir al azar") y, al guardarla, se asigna al hueco.
- El destino del armado recuerda la pestaña: guardar un armado de otra pestaña no lo asigna a un hueco de la Semana.
- La hoja inferior abre el Selector y los menús sin poner el foco en el buscador (`foco:false`), así no se abre el teclado sin pedirlo.
- La grilla con buscador se aplica sola a las listas del armado con más de 12 opciones: frutas, verduras, almidones, proteínas y legumbres.
- Sugerencias de revisor-codigo sobre el diff, incorporadas:
  - guardar porciones también pasa por la copia automática de la semana anterior;
  - si esa copia no se puede guardar, el cambio del plan no se escribe (ni historial ni Deshacer), se avisa y se puede reintentar. El Selector queda abierto con el motivo (C2-4k y C2-4l);
  - el Deshacer de la Semana sobrevive a volver al inicio (C2-7b);
  - M3 de `m01` busca una receta, registra una comida, pide la descarga y exige las herramientas de la Semana en modo simple.
- `herramientas/capturas.mjs` no cambió. En el estado `todo`, Semana ya no tiene paneles para abrir (están en la pantalla `planHerramientas`, que se abre desde el menú ⋯).

**Medidas antes y después** (alto en px / palabras visibles, estado normal, tema claro; antes = `capturas/etapa-1`, después = `capturas/etapa-2`)

| Vista | Antes | Después |
|---|---|---|
| Semana | 8.118 / 1.860 | 1.013 / 177 |
| Armado: almuerzo | 2.575 / 56 | 1.544 / 56 |
| Armado: verduras | 2.575 / 55 | 1.544 / 55 |
| Armado: desayuno | 1.436 / 71 | 1.416 / 71 |

- Semana mide 1,2 pantallas (meta: 1,5) y ya no tiene los 28 selectores cortados. Asignar una comida guardada lleva 3 toques desde Semana, o 2 si el hueco es de hoy (C2-1).

**Compuerta**
- "VALIDACIÓN ETAPA 2: OK (30 controles)". Pruebas: 442/442 (eran 413). Batería nueva `e2_semana.js` con 29 pruebas.

**Revisores**
- revisor-codigo, sobre el plan: BLOQUEANTE en la primera versión ("Empezar de cero" podía perder el plan y faltaba el reemplazo de M3 y M6); NO BLOQUEANTE en la segunda.
- revisor-codigo, sobre el diff: NO BLOQUEANTE. Igual corregí sus 5 sugerencias (están en las decisiones de arriba).
- revisor-usuario: NO BLOQUEANTE. Semana es mucho más simple y se lee bien en los dos temas; nada cortado ni superpuesto.

**Mejoras sugeridas**
- El aviso "¿Repetís el plan o empezás de cero?" empuja los chips hacia abajo: ponerlo debajo o en una línea.
- En los huecos llenos solo se ve "›": nada dice que ahí están Cambiar, Quitar, Porciones y Lo comí.
- Los íconos ⭐/🔍/📖 delante del nombre suman ruido. Algunos nombres viejos todavía muestran la forma ("Fruta en trozos…").
- Semana vacía no tiene un botón lleno; el armado tiene dos salidas hacia atrás ("← Hoy" arriba y "Volver al paso anterior" abajo).
- La pestaña dice "Mis comidas" y la estructura objetivo, "Comidas" (Etapa 4).
- El Selector y el menú ⋯ no tienen captura propia: los cubren solo las pruebas. Conviene sumar vistas a `capturas.mjs` en la Etapa 10.

**Pendientes para vos**
- Ninguno nuevo.

### Etapa 3 · Hoy ✅

Rama `rediseno-etapa-3-hoy`. Versión 15.2.0.

**Plan corto**
- Hoy según la estructura objetivo (`01-home.html` y `renderToday` en `31-hoy.js`), de arriba hacia abajo:
  - Encabezado "Hoy · lunes 26 de octubre" (como ahora). La línea de ayuda de `todayHint` deja de repetir el tipo de día: eso lo dice el chip.
  - Chip de entrenamiento, dentro de `#todayPanel`:
    - Con rutina o excepción para hoy: "🏋️ Hoy entrenás · cambiar" o "Hoy descansás · cambiar" (sale de `trainingDayForDate(new Date())`).
    - Sin rutina ni excepción: "¿Entrenás hoy? · elegir"; abre una hoja con Sí, No y "Configurar mi rutina" (va a `trainingCalendar`).
    - Lo que escribe está en "Riesgos para los datos".
  - Las 4 comidas en el orden del día (`#todayRows`, `data-today-slot`, el mismo orden de hoy):
    - Hueco lleno: el nombre (dos líneas como máximo) es un botón que abre la hoja del hueco de la Semana (`abrirHueco(hoy, comida)`: Cambiar, Quitar con Deshacer, Porciones y "Lo comí hoy"), y al lado el botón "Lo comí" (el mismo `data-plan-eaten`) o "✓ Comido".
    - Hueco vacío: "Sin elegir" y el botón "Elegir" (`data-today-choose`), que ahora abre el Selector de ese hueco sobre Hoy, sin ir a Semana (`abrirSelector(todayPlanDay(), comida)`). Elegir asigna ahí mismo (`setSlot`: historial, poda de porciones y copia automática de la semana, como en la Etapa 2) y la fila pasa a mostrar "Lo comí".
    - Después de asignar desde Hoy, `#todayStatus` dice "Asignado al almuerzo · Deshacer" (el mismo `deshacerPlan` y `data-plan-deshacer` de la Semana; al deshacer se repinta Hoy además de la Semana).
    - "Armar nueva" desde el Selector de Hoy: `armadoDestino` ya guarda la pestaña. Al guardar, `asignarArmadoAlHueco` vuelve a la pestaña de origen: si es Hoy, a `home` con la comida asignada y el aviso en `#todayStatus`; si es Semana, como ahora.
  - "Mañana · martes" plegado (`<details>` cerrado): las 4 comidas de mañana del plan (el domingo muestra el lunes, porque el plan es por día de la semana). Hueco vacío: "Elegir" abre el Selector de ese día; hueco lleno: abre su hoja, sin "Lo comí" (solo vale hoy, como en la Semana).
  - Atajos (grupo `home-group--main`, tarjetas iguales para `d01`): "Armar una comida" con Desayuno / Merienda y Almuerzo / Cena (los mismos `data-start`), "Sugerime algo" y "Con lo que tengo" (el mismo `data-open-pantry`: abre la pantalla `ingredientes`; filtrar Ideas por la despensa es de la Etapa 4).
- Primera vez (P1):
  - Si no hay comidas guardadas (`loadSaved()` vacío) y hoy no tiene plan, arriba de las comidas aparece una sola línea con el método y el primer paso: "Medio plato de verduras, un cuarto de almidones y un cuarto de proteínas. Empezá eligiendo tu almuerzo." El "Elegir" del almuerzo pasa a ser el botón lleno (acción principal).
  - No se guarda ninguna marca: la línea se va sola cuando guardás la primera comida. Sin clave nueva.
  - Las filas vacías dejan de decir "Sin plan para hoy" (P1); dicen "Sin elegir".
- "Sugerime algo" reemplaza a Plato del día y a Sugerir al azar como entradas separadas; las dos funciones se integran:
  - Abre el Selector del primer hueco vacío de hoy en el orden del día (si están todos llenos, el de la próxima comida según la hora) con la propuesta ya a la vista: "¿Qué tal …?" con "Usar esta" (botón lleno, asigna al hueco), "Otra" y "Ver y cambiar". Arriba, chips de las 4 comidas para cambiar de hueco.
  - Almuerzo y cena: la primera propuesta del día es la del Plato del día (la misma semilla `hashStr("plato_"+todayKey())`, igual todo el día); "Otra" usa `Math.random`, como Sugerir al azar. Las dos con `elegirSugerencia` y el día de la rutina (C1-4 sigue valiendo).
  - "Ver y cambiar" hace lo que hacían las dos tarjetas: `cargarSugerencia` y el resumen, para editarla, guardarla con su nombre o compartirla. Si se guarda, se asigna al hueco (`armadoDestino`).
  - Desayuno y merienda: lo mismo que el Sugerime del Selector (`randomDesayuno` con fruta real, resumen y, al guardar, asignado al hueco).
  - Sin candidatas: la hoja muestra `avisoSinSugerencias()` y no toca el armado.
  - Siguen existiendo `platoDelDia`, `randomMeal`, la pantalla `azar` (a la que vuelve "Otra" del resumen si no hay ideas) y sus manejadores (`data-plato-dia`, `data-open-azar`, `data-random-type`, `data-regen-random`). Salen de la vista solo las tarjetas "Plato del día" (Hoy) y "Sugerir al azar" (Más).
- Para que nada quede sin lugar: la tarjeta "Ideas" (`data-open-ideas`) pasa de Hoy a Más (`home-group--find`), junto a Con lo que tengo, Días de entrenamiento y los ajustes. En la Etapa 4 va a Comidas → Ideas.
- Archivos:
  - `fuente/cuerpo/pantallas/01-home.html`: chip, primera vez, Mañana y atajos.
  - `fuente/codigo/`: 31 (render de Hoy, chip, Mañana, primera vez, Sugerime algo y Deshacer en `#todayStatus`), 32 (`homeTexts` sin el tipo de día), 05 (`cambiarEntrenamientoDeHoy` y su Deshacer), 13 (`sugerenciaDelDia(comida)`: la semilla del Plato del día en una función que usan `platoDelDia` y Sugerime), 38 (Selector abierto desde Hoy con propuesta inicial, chips de comida y "Ver y cambiar"; `asignarArmadoAlHueco` vuelve a la pestaña de origen; `elegirEnSelector` avisa en Hoy) y 14 (manejadores nuevos).
  - `fuente/estilos.css`: chip y filas de Hoy y Mañana con el sistema de diseño (44 px, verde para acciones, claro y oscuro).
  - `fuente/version.json` → 15.2.0.
  - `herramientas/capturas.mjs` no cambia (la vista `hoy` ya está en los estados vacío, normal y todo).
- Orden de arranque: `paint()` (32) llama a `renderToday` durante `init()`, antes de que carguen 36 a 38. `renderToday` y sus ayudantes son declaraciones `function` y solo usan lo definido hasta el 13 o con `var`; la `hoja`, el Selector, las sugerencias y `armadoDestino` se usan recién al tocar. En 31 no hay `const`/`let` de nivel superior que lea el render.
- Riesgos para los datos:
  - Sin claves nuevas ni cambios de formato; respaldo y restauración no cambian.
  - Se leen: `plan`, `saved`, `consumption_v1`, `trainingWeek`, `trainingExceptions`, `planPortions_v1`, `planHistory_v1`, `datedWeeks_v1`, `recipeDetails_v1`, `recipeAmounts_v1`, `recipePreferences_v1` y la despensa (marcados y `pantryQuantities_v1`, para el peso de las sugerencias).
  - Pintar Hoy no escribe nada (k01 lo controla al recorrer las pantallas).
  - Se escriben solo cuando el usuario actúa, con las funciones de siempre: `plan` (con `planHistory_v1`, poda de `planPortions_v1` y copia automática en `datedWeeks_v1`, todo por `persistPlan`); `saved` (una idea o un armado que se usa, como en la Etapa 2); `consumption_v1` (Lo comí, igual que hoy, `planned:true`).
  - El chip "cambiar" sí escribe una excepción de la rutina en `miPlatoFacil_trainingExceptions`, con el formato de siempre (`{"AAAA-MM-DD": true|false}`) y solo para la fecha de hoy: invierte el tipo de día. Si el valor nuevo coincide con la rutina semanal, borra la excepción de hoy en vez de guardar una redundante. No toca las excepciones de otras fechas ni `miPlatoFacil_trainingWeek`. Aviso "Hoy descansás · Deshacer": el Deshacer vuelve a escribir el texto exacto que había (o quita la clave si no existía). Si `setItem` falla, no cambia nada y se avisa. Es lo mismo que guardar una excepción en Días de entrenamiento, donde se ve y se puede quitar.
- Pruebas existentes que cambian porque solo miran la interfaz vieja (la misma cantidad; las comprobaciones de datos quedan):
  - `n01` N8: cuenta las 3 filas vacías por `.today-row__plate.is-empty` en vez del texto "Sin plan para hoy"; lo demás igual (orden, nombre, "Lo comí", título "Hoy · ").
  - `n01` N10: "Elegir" en un hueco vacío abre el Selector de ese hueco sin salir de Hoy (`home`, pestaña Hoy marcada, hoja "Elegir cena del …" con Mis comidas). Antes esperaba Semana; C3-1 suma la asignación y Lo comí.
  - `n01` N11: Más reúne Ideas, Con lo que tengo, Días de entrenamiento, Respaldo, Tema y Modo simple (antes pedía "Sugerir al azar", que se integra en Sugerime algo); además, ninguna tarjeta visible de Hoy ni de Más dice "Plato del día" ni "Sugerir al azar".
  - `e1_confianza` E1-7 y `regression` (Ideas, línea 92): abren Ideas desde Más en vez de Hoy; las mismas comprobaciones.
  - `e1_confianza` E1-9 y `n01` N12 tocan `#home [data-open-pantry]` desde Más: el selector se acota al grupo visible (`.home-group--find`), porque Hoy también tiene esa tarjeta.
- Pruebas de lógica que cambian de camino, con la misma fuerza:
  - `e1_confianza` C1-4c: "Sugerime algo" en el almuerzo de hoy → "Ver y cambiar" lleva al resumen con una idea del catálogo o una comida tuya, con su nombre y con ingredientes (las mismas condiciones que con Sugerir al azar).
  - C1-4d: Sugerime algo en el desayuno elige una fruta real y una forma válida.
  - C1-4e: con preferencias que dejan sin ideas, la hoja muestra "No hay ideas que no tengan lo que evitás", el armado (`state`) no cambia y no se combinan ingredientes sueltos.
  - C1-4 y C1-4b (50 sugerencias reales, tipo de día) no cambian.
- Pruebas nuevas, batería `e3_hoy.js` (al final de `suites.json`):
  - C3-1 (E3-hoy-toques): con el respaldo de ejemplo y el almuerzo de hoy vacío, desde Hoy: "Elegir" (1), una comida guardada en el Selector (2) y "Lo comí" (3). Exige 3 toques o menos, seguir en `home`, `plan[hoy].almuerzo` con esa comida y un registro en `consumption_v1` de hoy, almuerzo, `planned:true` y ese `sourceId`.
  - C3-2: chip con rutina (entreno y descanso) y sin rutina; "cambiar" escribe solo la excepción de hoy y conserva las demás; volver al valor de la rutina la borra; Deshacer deja `trainingExceptions` byte a byte como estaba; si `setItem` tira, nada cambia; el Selector y el armado usan el tipo de día nuevo (`diaDeRutina`).
  - C3-3: primera vez: sin comidas, Hoy muestra la línea del método y el primer paso, el "Elegir" del almuerzo es el botón lleno y ninguna fila dice "Sin plan para hoy"; con comidas guardadas, la línea no está. Pintar Hoy no escribe.
  - C3-4: Mañana arranca plegado, muestra el día siguiente del plan (domingo → lunes, con reloj fijo); elegir ahí asigna a ese día y no ofrece Lo comí.
  - C3-5: Sugerime algo abre el primer hueco vacío de hoy; en almuerzo, la primera propuesta es la misma dos veces en el día (la del Plato del día, comparada con `sugerenciaDelDia`); "Otra" cambia; "Usar esta" asigna con Deshacer; "Ver y cambiar" lleva al resumen y, al guardar, queda asignada al hueco.
  - C3-6: atajos: Hoy muestra Armar (desayuno y almuerzo), Sugerime algo y Con lo que tengo; ninguna entrada visible "Plato del día" ni "Sugerir al azar"; Ideas y Días de entrenamiento se abren desde Más; `platoDelDia`, `randomMeal` y la pantalla `azar` siguen funcionando.
  - C3-7: hueco lleno en Hoy: tocar el nombre abre Cambiar, Quitar (con Deshacer en `#todayStatus`) y "Lo comí hoy"; Armar nueva desde un hueco de Hoy vuelve a Hoy con la comida asignada (y desde Semana, a Semana).
  - C3-8: lo asignado en Hoy se ve en la Semana (chip del día con su "N/4") y lo asignado en la Semana, en Hoy.
- Cómo se mantienen los controles anteriores:
  - `validar-etapa.mjs 3` corre los criterios de las Etapas 1 y 2 además del nuevo.
  - E2-semana-alto: la vista de Semana no cambia; solo `asignarArmadoAlHueco` y el Deshacer repintan también Hoy.
  - E2-asignar-toques (C2-1) y el resto de `e2_semana.js` quedan como están.
  - Palabras de la Etapa 1 (Compras, Con lo que tengo, Respaldo y Asistente de IA): esas pantallas no se tocan; `ingredientes` se abre igual desde Hoy y desde Más.
  - C1-1 a C1-4 y las pruebas de respaldo, despensa, compras y plan no cambian; la cantidad de pruebas sube (8 nuevas).
  - Hoy no tiene criterio de alto. Objetivo propio: con el respaldo de ejemplo, Hoy con Mañana plegado en 1,5 pantallas o menos (hoy mide 896 px).

**Plan corto, segunda versión** (revisor-codigo marcó 1 bloqueante en la primera; esto la corrige y manda sobre lo de arriba)
- C1-4c, C1-4d y C1-4e no se mueven a "Sugerime algo": la pantalla `azar` y `randomMeal` siguen, así que solo cambia cómo se entra (desde la hoja de "Sugerime algo", con el botón "Al azar", que abre la pantalla `azar`: así no vuelve a ser una entrada separada). Conservan todas sus condiciones, incluidos el aviso sin candidatas y el `state` sin cambios.
- C3-5 repite esas mismas condiciones para Sugerime algo: idea del catálogo o comida tuya con nombre e ingredientes, fruta real en el desayuno y, sin candidatas, el aviso con el `state` sin cambios. Ningún conteo baja.
- El chip guarda partiendo del JSON crudo de `miPlatoFacil_trainingExceptions`: solo cambia la entrada de hoy y conserva tal cual las demás, aunque sean raras (C3-2 lo prueba con una entrada que `loadTrainingExceptions` descarta).
- El Deshacer del chip restaura solo la entrada de hoy; si el texto guardado cambió después, deja de servir y lo dice.
- La fecha de hoy sale de `localTrainingDate(new Date())`, no de `todayKey()`.
- Semilla: la propuesta inicial del almuerzo es igual a la de `platoDelDia`; la de la cena suma la comida a la semilla (`"plato_"+fecha+"_cena"`). C3-5 lo compara.
- `armadoDestino` se fija después de `resetForRandom`, en Sugerime y en "Ver y cambiar"; C3-5 incluye un desayuno que, al guardarse, queda asignado.
- C3-6 comprueba cómo se ven en modo simple el chip, Mañana y los atajos (iguales que en modo completo).

**Decisiones que tomé sin vos**
- Sin rutina ni excepción, el chip pregunta "¿Entrenás hoy?" y Sí o No guardan la excepción de hoy en `miPlatoFacil_trainingExceptions` (no crean una rutina); la hoja también ofrece "Configurar mi rutina".
- Si el texto guardado de las excepciones no es un objeto JSON, el chip no escribe nada y pide revisarlas en Días de entrenamiento (así no se pisa lo que haya).
- En cada fila, el botón de acción (Elegir o Lo comí) va primero en el orden del documento y el nombre del hueco lleno es un botón al lado (abre Cambiar, Quitar, Porciones y Lo comí hoy). Así las pruebas que tocan "el primer botón de la fila" siguen tocando la acción.
- El Lo comí de Hoy lleva la marca `data-today-eaten`: el manejador del plan repinta Hoy antes que el de Hoy, y el botón ya no está en `#todayPanel` cuando este corre.
- `renderPlan` repinta también Hoy, y cada cambio de un hueco recuerda la pestaña desde la que se hizo (`deshacerPlan.tab`): Hoy muestra su aviso "… asignado … · Deshacer" una sola vez por cambio y lo saca cuando el Deshacer deja de valer.
- "Sugerime algo" es una hoja propia: chips de las 4 comidas, la propuesta con Usar esta, Otra y Ver y cambiar, y "🎲 Al azar", que abre la pantalla `azar` de siempre (así se sigue llegando a ella sin una tarjeta aparte). En desayuno y merienda, "Armalo" hace lo mismo que el Sugerime del Selector.
- La línea de ayuda de Hoy queda vacía (el tipo de día lo dice el chip) y se oculta. El grupo de atajos se llama "Atajos".
- La tarjeta "Con lo que tengo" está en Hoy y en Más. `e1_confianza` E1-9 y `n01` N12 no hubo que tocarlas: siguen pasando igual.
- La semilla del Plato del día pasa a usar `localTrainingDate` (antes `todayKey()`, sin ceros): la sugerencia del día puede ser otra que la de la v15.1, una sola vez.

**Medidas de Hoy** (alto en px / palabras visibles, tema claro; antes = `capturas/etapa-2`, después = `capturas/etapa-3`; iguales en oscuro)

| Estado | Antes | Después |
|---|---|---|
| Vacío | 962 / 68 | 1.118 / 72 |
| Normal | 984 / 69 | 1.057 / 69 |
| Todo | 984 / 69 | 1.358 / 90 |

- Normal mide 1,25 pantallas (objetivo propio: 1,5). Vacío suma la línea de primera vez y el chip; "todo" abre Mañana.

**Compuerta**
- "VALIDACIÓN ETAPA 3: OK (31 controles)". Pruebas: 472/472 (eran 442). Batería nueva `e3_hoy.js` con 30 pruebas.

**Revisores**
- revisor-codigo, sobre el plan: BLOQUEANTE en la primera versión (C1-4c/d/e perdían condiciones al pasar por Sugerime). Se resolvió en la segunda versión y se verificó directo en el diff, sin otra ronda sobre el plan.
- revisor-codigo, sobre el diff: NO BLOQUEANTE. Confirmó que C1-4c/d/e conservan todas sus condiciones y que C3-5 las repite para Sugerime.
- revisor-usuario: NO BLOQUEANTE. Hoy vacío explica el método del plato en una línea, con "Elegir" del almuerzo como acción principal.

**Mejoras sugeridas**
- Sin rutina, el chip "¿Entrenás hoy? · elegir" vuelve a preguntar: mejor llevar a Mi rutina u ocultarlo.
- Hoy con plan no tiene botón lleno: llenar el "Lo comí" de la próxima comida pendiente.
- "✓ Comido" → "✓ Lo comí" (vocabulario). "Mañana" plegado no tiene flecha.
- Los atajos "Desayuno / Merienda" y "Almuerzo / Cena" repiten nombres viejos: un solo "Armar una comida" (Etapa 4).
- "Con lo que tengo" está en Hoy y en Más.
- N8 o C3-3 deberían exigir "Sin elegir" en las filas vacías.
- El Selector dice "en vez de tu …" para un hueco cuyo plato ya no existe: filtrar con los guardados.
- `homeTexts` (32) no cambió: la línea de ayuda de Hoy se apaga con `todayHint()` devolviendo "".

### Etapa 4 · Comidas y nueva estructura ⏳

Rama `rediseno-etapa-4-comidas`. Versión 15.3.0.

**Plan corto**
- Pestañas Hoy · Semana · Comidas · Compras · Más:
  - `final.html`: se reordenan los botones y la pestaña dice "Comidas". La clave interna sigue siendo `miscomidas` (no se ve, y así no cambian `openTab`, la memoria de cada pestaña ni el camino de la vista `comidas` de las capturas). `TABS` (06) cambia solo la etiqueta.
  - Comidas tiene arriba un segmento "Mis comidas | Ideas", igual en `misplatos` y en `ideas`. Ideas pasa a ser parte de Comidas: en esa pestaña no se muestra "← Comidas" sobre Ideas (`nav` y `paint` tratan a `ideas` como una segunda raíz de `miscomidas`).
  - Cada pestaña sigue recordando su recorrido. Moverse entre pestañas no escribe nada (N15).
- Las recetas salen de "Con lo que tengo" (`04-ingredientes.html`) y viven en Comidas. Se mueve el HTML con los mismos ids; los manejadores de 21 se registran igual al cargar:
  - `#recipeReadView` (leer una receta) → la pantalla nueva `comida` (detalle).
  - `#recipeEditorView`, `#aiRecipePanel` y `#recipeAmountsPanel` → la pantalla nueva `recetaEditar`.
  - `#recipeBrowseView` (explorar el catálogo con búsqueda, tiempo, orden, "solo mis recetas" y recomendaciones por despensa o costo) → Ideas, plegado en "🔎 Buscar con filtros".
  - `#aiIdeasPanel` → Ideas, como "✨ Pedir ideas a la IA".
  - `#pantryResults` ("Ideas con lo que tenés") → Ideas, con el filtro "Con lo que tengo".
  - Preferencias de recetas (`#recipeAvoidWords`…) e `#ingredientAliasPanel` → Más → Preferencias.
  - `#nutritionLookupPanel` → Más → Fuentes de datos.
  - En la despensa quedan lo básico, otros ingredientes y cantidades, "Revisar qué tengo y qué falta" (avanzado) y una línea "Ver ideas con lo que tenés (N) →", que abre Comidas → Ideas con el filtro puesto.
  - `showRecipeView("browse")` abre Ideas con el panel de búsqueda abierto; `showRecipeView("editor")`, la pantalla `recetaEditar`; `showRecipeRead(id)`, el detalle. Así las pruebas que llaman a esas funciones siguen probando lo mismo.
- Tarjeta única para platos y recetas, con un adaptador que no junta los datos:
  - `comidaDesdePlato(item)` y `comidaDesdeReceta(r, cantidades, enPlan)` (39) devuelven `{tipo, id, nombre, componentes, etiquetas, fav, cocinado, enPlan, origen}`. Solo leen: `saved` y `recipeDetails_v1` siguen separados y con el formato de siempre.
  - `tarjetaComida(c)` pinta las dos igual: nombre, componentes en una línea, etiquetas (tipo de comida, ⭐, Receta, ⏱, En el plan) y el lugar del "≈ costo por porción", vacío hasta la Etapa 7. Lleva `data-comida-tipo` y `data-comida-id`, y las recetas conservan `data-recipe-id`. Tocarla abre el detalle.
  - `renderSaved` (09) pinta una sola lista (favoritas primero, después el orden elegido), con los chips Todo · Platos · Recetas (`data-saved-kind`), el buscador y la misma lógica de copias del plan (las huérfanas se ven con su aviso y las demás van plegadas al final, en modo completo). La línea de ayuda dice "14 comidas guardadas".
  - Botón lleno "+ Nueva": abre una hoja con Armar con el método del plato (Desayuno o merienda / Almuerzo o cena, los mismos `data-start`), Escribir receta y Pegar receta con IA (el editor con `#aiRecipePanel` abierto).
  - Pantalla `comida` (detalle, en la pestaña Comidas):
    - Nombre, etiquetas, componentes y nutrientes.
    - Acción principal "Agregar a la semana": hoja con día y comida. Un plato se asigna con `setSlot`; una receta, con la misma lógica que "Asignar receta al plan actual" (copia con `recipeSourceId`). Si reemplaza algo, ofrece Deshacer.
    - "Lo cociné": las mismas funciones y registros de hoy (`cookedPlate`, `recipeReadCookNow` y `recipeReadCooked`).
    - "Editar": una receta abre `recetaEditar`; un plato, la hoja de nombre (Renombrar).
    - "Compartir": el texto de la comida, con `navigator.share` o copiar, como `sharePlate`.
    - Menú ⋯: Favorito, Copiar, Duplicar y "Agregar lo que falta a Compras" (recetas) y Eliminar, con los mismos `data-*` y la misma confirmación de hoy.
  - "Planificar" (`planSavedRecipe`) y su manejador siguen existiendo: lo reemplaza "Agregar a la semana" como entrada, y la herramienta "Buscar en mis recetas" sigue en el menú ⋯ de Semana.
- Formulario de receta en pantalla propia (`recetaEditar`, "Nueva receta" o "Editar receta"):
  - El nombre siempre visible y tres secciones plegables: Ingredientes (porciones que rinde y filas), Preparación (pasos) y Más detalles (idea del menú, cantidades vinculadas, notas, etiquetas, minutos y reemplazos).
  - Al editar, se abren las secciones que tienen contenido; si al guardar falta algo obligatorio, se abre su sección.
  - "Guardar receta" es el botón lleno. Receta guardada, Nueva, Duplicar y Eliminar quedan en un plegable "Otras acciones". `#recipeAmountsPanel` va al final (avanzado). Mismos ids y la misma `persistRecipeDetailsForm`.
- Nutrientes:
  - En el detalle de una receta con cantidades sigue el cuadro por porción (`recipeNutritionBox`).
  - En un plato, la estimación sale de las porciones del armado cuando se pueden convertir (`nutritionGrams`); si no, dice "Tocá un ingrediente para ver sus nutrientes".
  - Cada ingrediente del detalle es un botón: abre una hoja con sus nutrientes cada 100 g y la fuente (`nutritionFor`). Se extrae `nutrientesDeIngrediente(nombre)` de `renderNutritionLookup`, que pasa a usarla.
  - "Consultar nutrientes" no se elimina: queda en Más → Fuentes de datos, con la misma lógica.
- Primera vez: 3 pantallas en la pantalla nueva `bienvenida` (40):
  1. El método del plato, con un dibujo (SVG en línea, sin archivos externos).
  2. Mi rutina, opcional: chips de lunes a domingo. "Guardar" usa `saveTrainingWeek` (el formato de siempre) y "Ahora no" no escribe nada.
  3. Elegir de 3 a 5 ideas para arrancar (almuerzo y cena del catálogo). "Armar mi semana" las guarda con `guardarIdea`, sin duplicar, y abre la Semana. "Saltar" va a Hoy.
  - Se abre sola al cargar solo si no hay comidas ni recetas guardadas, el plan está vacío y no existe la marca (ver riesgos). Quien ya tiene datos nunca la ve y no se le escribe nada.
  - Se vuelve a ver en Más → Cómo funciona ("Ver la bienvenida"). La línea de primera vez de Hoy (C3-3) sigue igual.
- Más según la estructura objetivo (grupo `#sectionSettings`, el mismo id):
  - Mi rutina (`trainingCalendar`, el mismo `data-open-training`).
  - Preferencias: pantalla nueva con ingredientes a evitar, ingredientes equivalentes (avanzado) y la tarjeta de Modo simple (`uiModeToggle`, la misma función). Región, presupuesto y objetivos llegan en las Etapas 7 y 8.
  - Mis datos: `backupScreen` con el título "Mis datos". Se suman exportar, importar y vaciar comidas (`#savedTools`, desde Mis comidas, con los mismos ids y avanzado como hoy).
  - Asistente de IA (`aiSettingsOpen`).
  - Apariencia (`themeToggle`, la misma función).
  - Fuentes de datos: pantalla nueva con la fuente de la nutrición (`#nutritionSourceInfo`) y Consultar nutrientes.
  - Cómo funciona: pantalla nueva con el método en tres líneas, "Ver la bienvenida" y "Publicación e instalación" (`#deploymentGuide`, que sale de Respaldo con su id).
  - Salen de Más: Ideas (va a Comidas → Ideas) y Con lo que tengo (queda en Hoy, así no está duplicado). La despensa se abre desde Compras: un enlace "🧺 Mi despensa" arriba de la lista (`data-open-pantry`), anticipo de "Lista | Despensa" de la Etapa 5.
- Hoy (solo los atajos):
  - "Armar una comida" es una sola tarjeta (deja de repetir "Desayuno / Merienda" y "Almuerzo / Cena"). Abre una hoja con los dos `data-start`.
  - "Con lo que tengo" abre Comidas → Ideas con el filtro "Con lo que tengo" (las ideas que más usan tu despensa, tocables como en E1-9).
  - El resto de Hoy no cambia.
- Ideas, lista larga: "Ideas de menú" muestra 8 por filtro y "Ver todas (N)"; con búsqueda o filtro de favoritas se ven todas las que coinciden.
- Archivos:
  - `fuente/cuerpo/pantallas/`: 01 (atajos y Más), 04 (despensa sin recetas), 06 (enlace a la despensa), 18 (segmento, "+ Nueva", lista única, sin `#savedTools`), 20 (Mis datos, sin `#deploymentGuide`), 21 (segmento, filtro Con lo que tengo, búsqueda con filtros, IA y "Ver todas").
  - Pantallas nuevas: 24 `comida`, 25 `recetaEditar`, 26 `preferencias`, 27 `fuentes`, 28 `comoFunciona` y 29 `bienvenida`.
  - `fuente/cuerpo/final.html`: orden y nombre de las pestañas.
  - `fuente/codigo/`: 06 (`TABS`, `nav` con la segunda raíz), 07 (`renderPantryResults` y la línea de la despensa), 09 (`renderSaved` con la tarjeta única), 21 (`showRecipeView` y `showRecipeRead` navegan, y las secciones plegables), 28 (`nutrientesDeIngrediente`), 30 (`ADVANCED_TOOLS` por pantalla nueva: `ingredientes`, `ideas`, `comida`, `recetaEditar`, `preferencias`, `backupScreen` y `misplatos`, con los mismos elementos), 32 (`homeTexts` de Más), 14 (manejadores), 18 (clave nueva en el respaldo), 37 (ideas: "Ver todas").
  - Archivos nuevos: 39 `comidas.js` (adaptador, tarjeta, detalle, "+ Nueva" y segmento), 40 `primera-vez.js` y 41 `mas.js` (Preferencias, Fuentes de datos y Cómo funciona).
  - `fuente/estilos.css`: tarjeta, segmento, detalle, editor, bienvenida y Más, con el sistema de diseño (44 px, verde para acciones, rojo para borrar, claro y oscuro).
  - `fuente/version.json` → 15.3.0.
  - `herramientas/capturas.mjs`: solo cambian dos caminos, con el mismo significado. `despensa` pasa a `openTab("compras"); go("ingredientes")` (sigue midiendo la pantalla de la despensa) e `ideas`, a `openTab("miscomidas"); go("ideas")`. Las demás vistas y `MEDIR` no cambian.
- Orden de arranque: `init()` corre durante la carga de 14, antes de 39 a 41.
  - `renderSaved` (09) solo corre al abrir `misplatos` y llama a `tarjetaComida` y a los adaptadores, que son declaraciones `function` sin `const` ni `let` de nivel superior. El estado de 39 a 41 va en `var`.
  - La bienvenida se abre al final de 40, después de `init()`.
  - 30 corre antes de 39 y busca por id las pantallas nuevas, que ya están en el HTML.
- Riesgos para los datos:
  - Clave nueva `miPlatoFacil_bienvenida_v1`, `{"vista":true,"fecha":"AAAA-MM-DD"}`:
    - Se escribe solo al tocar "Saltar" o "Armar mi semana" (o al terminar desde Cómo funciona). Abrir o pintar la bienvenida no escribe.
    - Entra al respaldo como módulo opcional (`COMPLETE_BACKUP_KEYS` y `COMPLETE_BACKUP_OPTIONAL_KEYS`): al restaurar en otro teléfono no vuelve a aparecer. No es un ajuste del dispositivo, y así J6 la exige en el respaldo.
    - Los respaldos viejos, sin esta clave, se restauran igual (`restoreCompleteBackup` saltea los módulos que faltan y deja la clave local como está). Con los datos restaurados la bienvenida tampoco se abre, porque hay comidas.
    - La línea base suma la clave con `--actualizar-linea-base`, que nunca baja nada.
  - Ningún formato cambia:
    - `saved`, `recipeDetails_v1`, `recipeAmounts_v1`, `cookingHistory_v1`, `plan` (con `planHistory_v1`, `planPortions_v1` y `datedWeeks_v1` por `persistPlan`), `trainingWeek` y la despensa se escriben con las funciones de siempre y solo cuando el usuario actúa.
    - El adaptador y la tarjeta solo leen: L11, k01 y C4-3 comparan el almacenamiento byte a byte.
  - La bienvenida guarda las ideas con `guardarIdea`, igual que la Etapa 1 (si la idea ya está, no la duplica). La rutina se guarda solo con "Guardar".
  - Mover HTML entre pantallas no toca datos. Los controles de sesión ocultos (`resetHiddenSessionControls`) conservan sus ids.
- Pruebas existentes que cambian porque miran la interfaz vieja (la misma cantidad; las comprobaciones de datos quedan):
  - `n01`:
    - N1: el orden y los nombres pasan a ser "Hoy,Semana,Comidas,Compras,Más".
    - N2: cada pestaña abre la misma raíz.
    - N11: Más muestra Mi rutina, Preferencias, Mis datos, Asistente de IA, Apariencia, Fuentes de datos y Cómo funciona, y ninguna entrada dice "Plato del día" ni "Sugerir al azar".
    - N12: Con lo que tengo se abre desde Hoy (Ideas filtrada, con Comidas marcada) y la despensa, desde Compras (con Compras marcada y "← Compras").
    - N13: Hoy muestra "Armar una comida" en vez de las dos tarjetas `data-start`, que se comprueban dentro de su hoja.
    - N16: `aiSettingsOpen` sigue en `#sectionSettings`.
  - `k01` K6 (anotada en la Etapa 0): cuenta las tarjetas que se ven en Mis comidas por `data-comida-tipo` (9 platos y 5 recetas) en vez del texto "Tenés 9 platos y 5 recetas".
  - `l01`:
    - L1: título "Comidas", segmento y una sola lista.
    - L2: la tarjeta muestra nombre, ingredientes y las etiquetas ⏱ y En el plan; el detalle, rinde y pasos.
    - L3 y L4: las mismas comprobaciones sobre la lista única.
    - L6: tocar la tarjeta abre el detalle y "Volver" regresa a Mis comidas.
    - L7: Editar, desde el detalle, abre `recetaEditar`.
    - L8: "Agregar a la semana" asigna la receta como "Asignar receta al plan actual" (más fuerte que solo abrir la herramienta). `planSavedRecipe` se sigue probando directo con las condiciones de antes.
    - L9 y L10: `#savedTools` en Mis datos y el aviso de modo simple en `backupScreen`; las copias del plan siguen en Mis comidas.
  - `r3_saved`:
    - G1a, G2, G3b y G5: las mismas comprobaciones sobre la tarjeta única (`data-comida-tipo` y `data-recipe-id`).
    - G1b: la línea de ayuda cuenta las comidas y la separación platos/recetas se comprueba por las tarjetas.
  - `u01` U2 a U4: "Lo cociné" se toca en el detalle; los mismos registros y Deshacer.
  - `e1_confianza`:
    - E1-7: abre Ideas desde Comidas.
    - E1-9: marca pollo en la despensa (desde Compras) y toca la idea en Ideas → Con lo que tengo (desde Hoy).
  - `regression`:
    - Ideas, línea 92: desde Comidas.
    - Crear receta, líneas 81 y 82: "+ Nueva" → Escribir receta.
    - R0 no cambia (`#deploymentGuide` conserva el id).
  - `e3_hoy` C3-6: los atajos pasan a ser ["Armar una comida", "Sugerime algo", "Con lo que tengo"], Ideas se abre desde Comidas y Mi rutina desde Más. C3-6c, con las mismas cuatro comprobaciones.
  - `dp01`: DP1 (la despensa muestra lo básico, otros ingredientes y la línea hacia las ideas) y DP12 (`#pantryHint` igual; las 8 ideas y "Ver todas" en Ideas).
  - `m01`: cada herramienta oculta o visible se busca en su pantalla nueva (la misma lista) y `uiModeToggle`, en Preferencias.
  - `d01`: la revisión de diseño de línea 60 abre los plegables de `ingredientes` y también de `ideas`, `comida`, `recetaEditar`, `preferencias` y `fuentes` (cubre más que antes).
  - `f07` N11 y N12: Consultar nutrientes desde Fuentes de datos, con la misma lógica.
  - Las pruebas que hacen `go("ingredientes")` y después llaman a `showRecipeView` o `showRecipeRead`, o usan los ids de las recetas (bkp02, f01_rec, f01_alias, f02_desp, f04_gasto, f08_ai, r2_pan, r3_dup y r3_rec), no deberían cambiar. Si alguna exige estar en `ingredientes`, se adapta a la pantalla nueva y se anota acá.
- Pruebas nuevas, batería `e4_comidas.js` (al final de `suites.json`):
  - C4-1 (E4-semana-nueva-toques). En un marco con el almacenamiento vacío y reloj fijo, un usuario nuevo arma la semana:
    - La bienvenida se abre sola: Siguiente (1), "Ahora no" (2), tres ideas (3 a 5), "Armar mi semana" (6).
    - En la Semana, tres huecos vacíos: hueco y comida en Mis comidas del Selector (7 a 12).
    - Exige 15 toques o menos, 3 comidas en `plan` (días y comidas distintos), esas 3 en `saved`, la marca escrita, `trainingWeek` sin tocar y estar en `plan`.
  - C4-2: pestañas en orden. Cada una recuerda su recorrido. El segmento Mis comidas | Ideas, sin "← Comidas". Moverse no escribe.
  - C4-3: adaptador.
    - Un plato y una receta dan la misma estructura de tarjeta.
    - Pintar no escribe (comparación byte a byte).
    - Las copias huérfanas se ven con su aviso.
    - Con recetas dañadas, los platos se siguen viendo.
    - Los conteos coinciden con `saved` y `recipeDetails_v1`.
  - C4-4: detalle.
    - Agregar a la semana: un plato con `setSlot`; una receta, como copia con `recipeSourceId`. Deshacer devuelve el plan byte a byte.
    - Lo cociné: los mismos registros que antes.
    - Editar, Compartir (sin escribir) y Eliminar (con confirmación).
  - C4-5: formulario de receta.
    - Pantalla propia con las tres secciones plegables.
    - Crear, editar, duplicar y eliminar dejan `recipeDetails_v1` y `recipeAmounts_v1` igual que con el formulario viejo (mismos datos de entrada, mismo resultado).
    - "Pegar receta con IA" abre el editor con su panel.
  - C4-6: nutrientes.
    - El detalle de una receta con cantidades muestra los valores de `recipeNutrition`.
    - Tocar un ingrediente abre la hoja con los de `nutritionFor`.
    - Un plato sin cantidades lo dice.
    - Consultar nutrientes sigue funcionando en Fuentes de datos.
  - C4-7: primera vez.
    - No se abre con datos (respaldo de ejemplo) ni con la marca.
    - "Saltar" escribe solo la marca.
    - "Guardar" en la rutina escribe `trainingWeek` con su formato.
    - Abrirla o pintarla no escribe.
    - Más → Cómo funciona la vuelve a abrir.
    - La marca entra al respaldo y un respaldo sin ella se restaura.
  - C4-8: nada se pierde. Cada herramienta movida se abre desde su lugar nuevo y funciona: Ideas, Con lo que tengo, despensa, Respaldo, Publicación e instalación, equivalencias, ingredientes a evitar, Modo simple, Consultar nutrientes, Mis cantidades por receta, Buscar con filtros, Pedir ideas a la IA, Revisar qué tengo y exportar o importar comidas.
  - C4-9: Con lo que tengo, desde Hoy, abre Ideas filtrada por la despensa (cambia al marcar un ingrediente) y las ideas se pueden tocar. La línea de la despensa lleva ahí.
  - C4-10 (apoyo de E4-un-tema): `ingredientes` ya no contiene elementos de recetas, IA ni nutrición, y cada pantalla nueva contiene solo los de su tema (por ids). El juicio final es de revisor-usuario.
- Cómo se mantienen los controles anteriores:
  - `validar-etapa.mjs 4` corre también los criterios de las Etapas 1 a 3.
  - Palabras de la Etapa 1:
    - Despensa: hoy 268 y el umbral es 391. Baja, porque salen las recetas, la IA y la nutrición; la vista sigue midiendo `ingredientes`.
    - Compras: 225 + el enlace "Mi despensa" ≈ 228; el umbral es 262.
    - Respaldo: 36, ahora "Mis datos". En modo simple `#savedTools` queda oculto y suma solo el aviso (≈ 60); el umbral es 91. Sale "Publicación e instalación".
    - Asistente de IA: no cambia (83; el umbral es 186).
  - E2-semana-alto: la Semana no cambia (1.013 px; el umbral es 1.266).
  - C1-1 a C1-4, C2-1 y C3-1: sin cambios de lógica. C3-6 se adapta (ver arriba).
  - Las pruebas de respaldo, despensa, compras y plan no bajan, y la cantidad total sube (10 nuevas como mínimo).
  - En el estado "vacío", la bienvenida se abre al cargar, pero `capturas.mjs` llama a `restart()` antes de cada vista, así que Hoy y las demás vistas se miden como siempre.
  - La bienvenida, el detalle y el editor no tienen vista propia en las capturas (no se agregan vistas a la herramienta de medición): las cubren C4-1 y C4-4 a C4-7, y para revisor-usuario se toman capturas sueltas aparte, sin tocar `capturas.mjs` y fuera de la compuerta.

**Plan corto, segunda versión** (revisor-codigo marcó 2 bloqueantes en la primera; esto los corrige y manda sobre lo de arriba)
- Medición. Hay dos controles nuevos desde esta etapa: E4-palabras-ideas (vista `ideas`, normal, ≤ 391; hoy son 460) y E4-palabras-comidas (vista `comidas`, normal, ≤ 607). Para cumplirlos:
  - Ideas:
    - "Ideas de menú" muestra 8 ideas y "Ver todas (N)"; con búsqueda o con Solo favoritas se ven todas.
    - Las ayudas quedan en una línea.
    - Se pliegan "🔎 Buscar con filtros", "✨ Pedir ideas a la IA" y el bloque "Con lo que tengo" (solo se ve con el filtro puesto).
  - Mis comidas: tarjetas sin la fila de botones ni la lista de componentes (una línea), así que las palabras bajan.
  - La vista `despensa` sigue midiendo `ingredientes`.
- d01 D7 junta los chips de `misplatos`, `ingredientes`, `trainingCalendar`, `ideas`, `comida` y `preferencias`, y de la hoja "+ Nueva" abierta. D8 abre los plegables de las pantallas nuevas.
- m01 protege la lógica del modo simple:
  - Cada pantalla nueva que oculta herramientas tiene su aviso `[data-mode-note]` con el botón:
    - `ideas`: recomendaciones, orden y tamaño de página;
    - `comida`: descontar de la despensa;
    - `recetaEditar`: cantidades vinculadas y Mis cantidades por receta;
    - `preferencias`: equivalencias;
    - `backupScreen`: exportar, importar y vaciar comidas.
    - `ingredientes` conserva el suyo (Revisar qué tengo).
  - M2 y M6 recorren exactamente la misma lista de ids de antes, repartida por pantalla. M4 suma los avisos nuevos.
- f07 N11 y N12 conservan sus textos; solo cambia el camino. K6 de k01 sigue exigiendo exactamente 9 platos y 5 recetas: se cuentan las tarjetas por `data-comida-tipo`, sin las copias del plan.
- `miPlatoFacil_bienvenida_v1`:
  - Va en el respaldo como opcional y en la lista de omitir si es null.
  - Se valida al leer y al restaurar: solo vale `{"vista":true}` (si trae otra cosa, la validación del respaldo falla igual que con otros módulos; al leer, se toma como no vista).
  - Se escribe solo al tocar Saltar o "Armar mi semana". Verla desde Cómo funciona no la reescribe.
- La bienvenida es una pantalla del `stack` (`go("bienvenida")`), no una capa. En el estado vacío de las capturas, `restart()` deja Hoy activo antes de medir; lo compruebo en `capturas/etapa-4`.
- C4-8 nombra y prueba que siguen alcanzables:
  - "Asignar receta al plan actual" (menú ⋯ de Semana);
  - "Calcular nutrientes" (el cuadro de nutrientes de la receta, ahora en `comida`);
  - "Ver solo mis recetas" y el tamaño de página del catálogo (Ideas → Buscar con filtros);
  - `planSavedRecipe`.
- Preferencias y Fuentes de datos se hacen en esta etapa como pantallas simples, que reciben el HTML movido. Si no alcanza el tiempo, se anota como decisión, sin dejar nada inalcanzable.
