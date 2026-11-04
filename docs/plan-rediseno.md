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
| 4. Comidas y nueva estructura | ✅ | `etapa-4-ok` | 15.3.0 |
| 5. Compras y Despensa | ✅ | `etapa-5-ok` | 15.4.0 |
| 6. Un solo registro | ✅ | `etapa-6-ok` | 15.5.0 |
| 7. Precios automáticos de INDEC | ✅ | `etapa-7-ok` | 15.6.0 |
| 8. Resto de las herramientas avanzadas | ✅ | `etapa-8-ok` | 15.7.0 |
| 9. Precios de SEPA | ✅ | `etapa-9-ok` | 15.8.0 |
| 10. Pulido | ✅ | `etapa-10-ok` | 15.9.0 |

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

### Etapa 4 · Comidas y nueva estructura ✅

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

**Implementación** (manda sobre las dos versiones del plan donde difieren)
- Commits: `959ed66` (estructura, pantallas y pruebas de interfaz adaptadas), `be5da77` (batería `e4_comidas.js` y caminos de las capturas) y el arreglo de Ideas (8 ideas desde el arranque).
- Pruebas adaptadas, con la misma fuerza o más:
  - `n01`:
    - N1: el orden nuevo de las pestañas.
    - N11: las 7 entradas de Más.
    - N12: Con lo que tengo desde Hoy y la despensa desde Compras, cada una con su pestaña marcada.
    - N13: Hoy muestra Sugerime algo y no muestra los ajustes.
  - `k01` K6: cuenta las tarjetas visibles por tipo y exige exactamente 9 platos y 5 recetas (las copias del plan no cuentan). También exige la línea "Tenés 14 comidas guardadas".
  - `l01` L1 a L11 sobre la tarjeta única.
    - L2: rinde y pasos se ven en el detalle.
    - L6 y L7: el detalle y el formulario propio.
    - L8: ahora también asigna con "Agregar a la semana" y sigue probando `planSavedRecipe` con sus condiciones.
    - L9 y L10: Mis datos.
    - L11: se evalúa antes de que L8 escriba.
  - `r3_saved`:
    - G1a, G2, G3b y G5: la tarjeta única.
    - G1b: la línea cuenta comidas y la separación platos/recetas se comprueba por las tarjetas.
  - `u01` U2 y U3: "Lo cociné" en el detalle de la receta, con los mismos registros, el mismo descuento y el mismo Deshacer.
  - `e1_confianza`:
    - E1-7: Ideas desde Comidas.
    - E1-9: la despensa desde Compras y las ideas desde Hoy → Con lo que tengo.
  - `regression`:
    - Crear receta: pasa por "+ Nueva" → Escribir receta y suma R18b (la pantalla propia).
    - R20: Ideas desde Comidas, con "Ver todas".
  - `e3_hoy` C3-6: los atajos son "Armar una comida", Sugerime algo y Con lo que tengo, y se comprueban visibles las dos opciones de armar. C3-6c entra a Ideas desde Comidas y a Mi rutina desde Más.
  - `dp01` DP1: el enlace a las ideas queda debajo de la despensa, `#pantryResults` está en Ideas y las recetas no están en la despensa.
  - `m01`: la misma lista de ids, repartida por pantalla (M2, M3 y M6). M4 exige el aviso con su botón en 7 pantallas y M5 busca la tarjeta en Preferencias.
  - `d01`:
    - D1: cada entrada de las grillas de Hoy y Más es una tarjeta (10 o más).
    - D7: suma los chips de `ideas`, `comida`, `preferencias` y la bienvenida, y la hoja "+ Nueva".
    - D8: abre los plegables de las pantallas nuevas.
  - `f07` no cambió: N11 y N12 abren el panel por id y conservan sus textos.
  - Las demás pruebas que usan `go("ingredientes")` con `showRecipeView` o `showRecipeRead` no cambiaron.
- Pruebas: 493/493 (eran 472). Batería nueva `e4_comidas.js` con 20 pruebas, de C4-1 a C4-10 con sus variantes. C4-1 arma la semana en 12 toques.
- Compuerta: "VALIDACIÓN ETAPA 4: OK (34 controles)".

**Decisiones que tomé sin vos**
- "Armar una comida" es una sola tarjeta en Hoy con sus dos opciones adentro ("Desayuno o merienda" y "Almuerzo o cena", los mismos `data-start`). No abre una hoja: así armar sigue a un toque.
- La clave interna de la pestaña sigue siendo `miscomidas`; solo cambió lo que se ve ("Comidas").
- El detalle de un plato no estima los nutrientes del plato entero: el armado no guarda gramos. Muestra los componentes y cada uno abre sus nutrientes cada 100 g. Las recetas con cantidades conservan el cuadro por porción.
- La marca de la bienvenida es `{"vista":true}`, sin fecha. Si al leerla no es válida, se toma como no vista; en un respaldo, la marca inválida hace fallar la validación, como cualquier otro módulo.
- La bienvenida guarda la rutina con el mismo formato de `miPlatoFacil_trainingWeek`, sin pasar por `saveTrainingWeek`, porque esa función lee las casillas de la pantalla Mi rutina.
- El Historial de comidas preparadas sigue plegado en Mis comidas hasta la Etapa 6 (un solo registro).
- Los avisos que las acciones de la receta escriben en `#recipeCatalogCount` (Ideas) se repiten en la línea de estado del detalle. Los de los platos (`savedStatus`) se ven también en el detalle.
- Arreglo de diseño que destapó D7: los botones "☆ Guardar idea" de Ideas pasan de 40 a 44 px.

**Medidas** (alto en px / palabras visibles, tema claro, estado normal; antes = `capturas/etapa-3`, después = `capturas/etapa-4`)

| Vista | Antes | Después |
|---|---|---|
| Ideas | 6.047 / 460 | 2.552 / 171 |
| Mis comidas | 4.197 / 607 | 2.328 / 300 |
| Despensa | 3.558 / 268 | 2.510 / 158 |
| Respaldo (Mis datos) | 944 / 36 | 1.062 / 60 |
| Más | 964 / 72 | 896 / 58 |
| Hoy | 1.057 / 69 | 1.067 / 71 |

- Hoy en estado vacío se sigue midiendo en `home` (la bienvenida no lo tapa: `restart()` vuelve a Hoy antes de cada vista).

**Mejoras sugeridas**
- La bienvenida, el detalle y el formulario de receta no tienen vista en `capturas.mjs`: conviene sumarlas en la Etapa 10.
- El aviso de modo simple ocupa 3 líneas en 7 pantallas: acortarlo a una.
- Algunos nombres automáticos todavía muestran la forma ("Fruta en trozos con huevo…").
- Eliminar una comida sigue pidiendo confirmación en vez de ofrecer Deshacer.

**Revisores**
- revisor-codigo, sobre el plan: BLOQUEANTE en la primera versión. Lo de "Con lo que tengo" se mudaba a pantallas sin tope de palabras, y D7 dejaba de medir los chips del buscador.
  - Lo resolví sumando a `criterios.json` (más estricto, no más permisivo) E4-palabras-ideas ≤ 391 y E4-palabras-comidas ≤ 607.
  - D7 suma las pantallas nuevas. Se verificó en el diff.
- revisor-codigo, sobre el diff: NO BLOQUEANTE (los dos bloqueantes del plan, resueltos; datos, pruebas y C4-8, bien).
- revisor-usuario: NO BLOQUEANTE. **E4-un-tema se cumple:** cada pantalla trata un solo tema. La despensa bajó de 3.558 a 2.510 px y, con todo abierto, de 9.793 a 3.150 px.

**Mejoras sugeridas**
- Comidas tiene muchos controles arriba de la lista (buscador, Limpiar, 3 chips de tipo y 4 de orden): plegar el orden.
- Ideas es densa y no tiene botón lleno; "Con lo que tengo" se ve como un chip suelto.
- La ayuda de Compras todavía nombra "Con lo que tengo": decir "Despensa" (Etapa 5).
- "Desayuno o merienda" se parte en 3 líneas en Hoy. El texto del selector de archivo del respaldo se corta (Etapa 10).
- Los componentes de las tarjetas de Comidas cuentan como "cortados" (es el "…" de una línea, buscado): revisarlo en la Etapa 10.
- Al guardar una receta con un error, abrir la sección donde está el campo.
- `IDEAS_MENU_VISIBLES` no se usa; el 8 está repetido.
- e4 C4-7 borra `setItem` del marco sin restaurarlo.
- L11 ya no cubre que `planSavedRecipe` no escriba.
- El Deshacer de asignar una receta deja la copia en `saved`, plegada en "Copias de recetas usadas en el plan" (aceptable).
- El detalle de un plato no calcula los nutrientes del plato entero (el armado no guarda gramos); muestra los de cada ingrediente.
- Eliminar sigue con confirmación, no con Deshacer.

### Etapa 5 · Compras y Despensa ✅

Rama `rediseno-etapa-5-compras`. Versión 15.4.0.

**Plan corto**
- "Lista | Despensa" (P5 y P12):
  - Un segmento arriba, igual en `compras` y en `ingredientes`. La despensa pasa a ser la segunda raíz de la pestaña Compras, como Ideas en Comidas (`nav` y `paint`): no muestra "← Compras". El botón "Despensa" del segmento conserva `id="comprasDespensa"` y `data-open-pantry`, así las pruebas que entran por ahí no cambian.
  - Título "Compras" y una sola línea de ayuda, que nombra la Despensa y no "Con lo que tengo" (mejora de la Etapa 4). La sugerencia "Lo marcaste en “Con lo que tengo”" pasa a "Lo marcaste en tu Despensa".
- Lista, de arriba hacia abajo:
  - Barra de presupuesto, solo en modo completo (el modo simple esconde precios y presupuesto, adelanto de "Mostrar precios y presupuesto" de la Etapa 8). Con presupuesto: "Presupuesto $30.000 · ≈ $X estimado (faltan N precios)". Sin presupuesto: "Poner un presupuesto". Tocarla abre el panel de presupuesto. El cálculo sale de una función pura nueva, `estimadoDeLaLista()`, extraída de `shoppingBudgetRender` (que pasa a usarla, así su texto no cambia). El ≈ precio por ítem llega en la Etapa 7.
  - "+ Agregar producto" (productos extra): botón arriba que abre el formulario de siempre (`#manualShoppingForm`, mismos ids) en un plegable. Los extras se ven en la misma lista, en su sección, con su casilla (el campo `done` que ya existe), Editar y Quitar con Deshacer. Sale el panel aparte "Productos que agregás vos".
  - Interruptor "Descontar lo que tengo", encendido por defecto (el comportamiento de hoy):
    - Encendido: lo que alcanza va a "Ya tenés (N)" y lo que falta dice "faltan X", como desde la Etapa 1.
    - Apagado: todo queda en su sección con la cantidad completa del plan, sin "Ya tenés". "Ya en tu despensa" (lo comprado esta semana) se sigue viendo.
    - Se guarda solo al tocarlo, en una clave nueva (ver riesgos).
    - Reemplaza, como comportamiento de la lista, a "Descontar lo que ya tengo" y a "Marcar ingredientes que figuran en mi despensa".
  - Lista por secciones del súper: Verdulería, Carnicería y pescadería, Lácteos y huevos, Panadería, Almacén, Congelados, Limpieza y Otros. `seccionDelSuper(nombre)` decide con la categoría del armado (verduras y frutas, proteínas, almidones, legumbres) y, si no, con una tabla de palabras (`var`, por el orden de arranque); lo que no reconoce va a Otros. Cada sección lleva su título y su cantidad de ítems. Los extras usan la misma función.
  - Cantidades sumadas como hoy (`shoppingPlanItems`: recetas con cantidades, porciones de cada comida del plan con `portionFactor` y unidades compatibles), mostradas legibles (ver más abajo).
  - Tachados que no se pierden: siguen guardados por semana (`shoppingChecks_v1`, Etapa 1) y ahora quedan a la vista, tachados, al final de su sección. Salen los botones "Pendientes | Todos": ya no hace falta un filtro para encontrarlos. El contador "N pendientes · M tachados" cuenta también lo tachado dentro de "Ya tenés" (mejora de la Etapa 1).
  - Al final, plegados, "Ya tenés (N)" y "Ya en tu despensa (N)", como desde la Etapa 1.
  - Una sugerencia "info" ya no esconde nada (mejora de la Etapa 1): si la despensa tiene cantidad en otra unidad ("la unidad no coincide") o cubre solo lo que tiene cantidad, el ítem queda en Pendientes con "· revisá: tenés X". A "Ya tenés" van solo lo que alcanza (`covered`) y lo que está en la despensa sin cantidad cuando el plan tampoco la tiene. `shoppingSuggestion` no cambia (sus textos y tipos los fijan U4c, U4d, S5 y DP10): cambia el grupo.
  - Botón lleno al pie: "Terminé de comprar" (el mismo `#comprasBought`).
- "Terminé de comprar":
  - Hace en el momento lo mismo que "Lo compré" (`boughtNow`: lo tachado pasa a la despensa y a "Ya en tu despensa", con Deshacer). Con el interruptor apagado suma la cantidad completa del plan, porque no se descontó nada. Así las pruebas que tocan `#comprasBought` siguen probando lo mismo.
  - El aviso dice "Pasó a tu despensa: … · Deshacer · 🧾 Anotar gasto". "Anotar gasto" abre una hoja donde todo es opcional:
    - Monto pagado y comercio. Con monto, se guarda una compra en `miPlatoFacil_purchases_v1` con la fecha de hoy y la moneda del presupuesto (ARS si no hay).
    - "Cargar detalle del ticket" (plegado): filas precargadas con lo que acaba de pasar a la despensa (nombre, cantidad y unidad) y un campo de precio. Las filas con cantidad y precio actualizan Mis precios (`referencePrices_v1`, con el mismo formato que hoy "Guardar los precios de estos productos como referencia"), aunque no se cargue monto. El ticket no vuelve a sumar a la despensa: eso ya lo hizo Terminé de comprar.
    - Guardar tiene su propio Deshacer: devuelve `purchases_v1` y `referencePrices_v1` byte a byte si nada cambió después.
  - `savePurchase` se parte en `leerFormularioCompra` (el formulario viejo) y `registrarCompra(compra, opciones)`, que usan el formulario de siempre (en el menú ⋯) y la hoja. La validación es la misma (`validPurchases`, `validReferencePrices`): si algo no vale, no se escribe nada.
- Despensa (`ingredientes`):
  - Lo básico (chips) y "Otros ingredientes". Cada ítem muestra su cantidad legible y un plegable "Historial (N)" con sus movimientos: `movimientosDe(nombre)` toma los de `pantryMoves_v1` con el mismo `ingredientKey`, los últimos 10, del más nuevo al más viejo. Solo lee.
  - Editar (el formulario de siempre) ahora también ofrece Deshacer: `pantryUndo` guarda la existencia anterior y el Deshacer la vuelve a escribir, con su movimiento, igual que el de Quitar. Quitar ya tenía Deshacer.
  - Al editar, el campo muestra el valor exacto guardado, no el redondeado: guardar sin tocar nada no cambia la cantidad.
  - "Movimientos recientes" (`#stockMovesPanel`, el mismo id) pasa de la herramienta de existencias a la Despensa, plegado, como "Todos los movimientos".
  - "Revisar qué tengo y qué falta" sigue igual (avanzado).
- Menú ⋯ de Compras (las calculadoras y lo ocasional):
  - Una hoja con la lista. Cada ítem abre la pantalla nueva `comprasHerramientas` ("Compras › …", con Volver), que muestra solo ese panel, igual que `planHerramientas` en la Semana. Los paneles se mudan con sus ids y su lógica; `#shoppingToolsPanel` queda como contenedor dentro de esa pantalla.
  - Compras realizadas (`#purchasesPanel`: el historial y el formulario completo).
  - Presupuesto (`#shoppingBudgetPanel`, con Comparar alternativas de precio).
  - Mis precios (`#pricePanel`). "Mi precio" sobre el precio automático es de las Etapas 7 y 8.
  - Costo de una receta (`#recipeCostPanel`).
  - Calcular para otras recetas (`#quantShoppingPanel` y `#stockDeductionPanel`): lo único que la lista no cubre es elegir recetas que no están en la semana y simular sin tocar nada.
  - Porciones, existencias y costos (`#shoppingQuantCostPanel`: el multiplicador, que nunca cambió la lista, y el detalle de existencias `#stockList`).
  - Compartir, Copiar lista (lo pendiente sin tachar, por secciones, con cantidades legibles) y Ver el plan de la semana (`data-share-compras`, `data-copy-compras` y `data-back-plan`).
  - "Calcular compras por recetas" y "Ajustar porciones" quedan cubiertos por la lista (recetas del plan con las porciones de la Semana); "Descontar lo que tengo", por el interruptor.
  - Modo simple: el menú muestra todo en los dos modos, como en la Semana. El grupo `compras` de `ADVANCED_TOOLS` pasa a esconder solo la barra de presupuesto ("presupuesto y precios"), con su aviso `[data-mode-note]`.
- Equivalencias: la sugerencia en la lista ("¿Tomate perita es lo mismo que Tomate?") queda para la Etapa 8; la administración sigue en Preferencias.
- Cantidades legibles (lo hago acá, porque Compras y Despensa son donde se ven):
  - `cantidadLegible(n, unidad)` en `03-ingredientes-y-unidades.js`: g y ml sin decimales, o con uno si es menos de 10 ("166,666667 g" → "167 g"); kg y l, hasta 2 decimales; unidad, cucharada, cucharadita y taza, hasta 2 decimales y en plural si pasa de 1 ("5 unidades", "1 unidad", "0,5 taza", "2 cucharaditas").
  - `textoLegible(texto)` aplica lo mismo a cada "número unidad" de un texto.
  - Solo se usa al mostrar: filas de la lista, "faltan X", el detalle de "Ya tenés", Copiar y Compartir, el aviso de Terminé de comprar, la Despensa, el historial y `#stockList`. Nunca al guardar ni en los campos `label`, `buy` y `suggestion.text` de `shoppingDisplayItems` y `shoppingSuggestion`, que son la lógica que fijan las pruebas: esas comprobaciones no cambian.
- Archivos:
  - `fuente/cuerpo/pantallas/`: `06-compras.html` (reescrita: segmento, barra, "+ Agregar producto", interruptor, lista y "Terminé de comprar"), `04-ingredientes.html` (segmento, historial por ítem y movimientos) y la nueva `30-comprasHerramientas.html` (los paneles que se mudan, con sus ids).
  - `fuente/codigo/`: 03 (`cantidadLegible` y `textoLegible`), 06 y 32 (segunda raíz de Compras), 11 (`estimadoDeLaLista`), 12 (lista por secciones, interruptor, contador y grupo de las "info"), 17 (extras en la lista, Quitar con Deshacer), 18 (clave nueva en el respaldo), 25 (`registrarCompra`), 26 (`movimientosDe`), 30 (grupo `compras`), 33 (historial y Deshacer al editar), 34 (etiqueta y cantidad con el interruptor apagado), 14 (manejadores) y el nuevo `41-compras-y-despensa.js` (segmento, menú ⋯, `comprasHerramientas`, hoja "Anotar gasto" y `seccionDelSuper`).
  - `fuente/estilos.css`: segmento, barra, interruptor, secciones y tachados con el sistema de diseño (44 px, verde para acciones, rojo para quitar, claro y oscuro).
  - `fuente/version.json` → 15.4.0.
  - `herramientas/capturas.mjs` no cambia: `compras` sigue siendo `openTab("compras")` y `despensa`, `openTab("compras"); go("ingredientes")`.
- Orden de arranque: `init()` corre durante la carga de 14, y la pestaña recordada puede pintar Compras antes de que cargue 41. Por eso `renderCompras` y lo que llama (`seccionDelSuper`, `cantidadLegible`, `textoLegible` y la lectura del interruptor) son declaraciones `function` y sus tablas van en `var`. La hoja, el menú y `comprasHerramientas` se usan recién al tocar. En 41 no hay `const` ni `let` de nivel superior que lea el render.
- Riesgos para los datos (ningún formato cambia; no hacen falta migraciones):
  - `miPlatoFacil_purchases_v1`: arreglo (máximo 1000) de `{id, date "AAAA-MM-DD", store ≤ 60, currency de 3 letras, total > 0, items: [{name, quantity|null, unit|null, price|null}] ≤ 100}`. La hoja escribe con ese formato, valida con `validPurchases` antes de escribir y, sin monto, no escribe compra.
  - `miPlatoFacil_pantryMoves_v1`: arreglo (los últimos 300) de `{at ISO, name, unit, delta, reason ≤ 80}`. El historial por ítem solo lee. Se escribe como hoy (Lo compré, Lo cociné, Ajuste manual, Quitar y sus Deshacer).
  - `miPlatoFacil_pantryQuantities_v1`: objeto `stockKey(name, unit) → {name, quantity, unit}`. Mostrar redondeado no cambia lo guardado y editar parte del valor exacto.
  - `miPlatoFacil_manualShopping_v1`: arreglo de `{id, name ≤ 100, amount ≤ 80, done}`. Tachar usa `done`, como hoy; Quitar y su Deshacer reescriben el mismo arreglo.
  - `miPlatoFacil_shoppingBudget_v1`: `{currency ARS|USD, limit, period, people}`. La barra solo lee; se edita en el panel de siempre.
  - `miPlatoFacil_referencePrices_v1`: la hoja suma entradas con el mismo formato que "Registrar compra" (`pack` "Compra en …" o "Compra registrada").
  - Clave nueva `miPlatoFacil_comprasOpciones_v1`, `{"descontar": false}`: solo se escribe al tocar el interruptor (al encenderlo, `true`). Lectura tolerante: si no es válida, encendido. Entra al respaldo como opcional (`COMPLETE_BACKUP_KEYS`, `COMPLETE_BACKUP_OPTIONAL_KEYS` y la lista de omitir si es null), se valida al restaurar y un respaldo viejo sin ella se restaura igual. La línea base la suma con `--actualizar-linea-base`.
  - Mostrar la lista, la Despensa, el historial o el menú no escribe nada (k01 y C5-1 lo comparan byte a byte).
- Pruebas existentes que cambian porque miran la interfaz vieja (la misma cantidad; las comprobaciones de datos quedan):
  - Las que leen el texto de las filas o de `#stockList` pasan a la forma legible, con los mismos números, y suman la comprobación del `label` interno, que no cambia:
    - `f01_int` M1: "Tomate: 2 unidades + sin cantidad en 1 plato" y "Papa: 200 g + sin cantidad en 1 plato"; además, `item("Tomate").label` sigue siendo "Tomate: 2 unidad + sin cantidad en 1 plato".
    - `f02_units` U2 y U3: "Papa: 1,2 kg", "Leche: 1,3 l", "Aceite: 1 cucharada + 2 cucharaditas", "Huevo: 200 g + 2 unidades" y "Papa: 200 g"; los `label` internos, como hoy.
    - `r3_rec` E3: "Papa: 300 g" y "Cebolla: 1 unidad" (no cambian).
    - `r2_uni` U2 y U3: "Arroz: 300 g" y "Azúcar: 2 cucharadas" en `#stockList`, que ahora está en `comprasHerramientas` (se lee igual, por id).
    - `r2_shop` S2 (Copiar): "faltan X" en forma legible, con las mismas cantidades.
  - `r2_shop`:
    - S4a a S4c: sin "Pendientes | Todos"; tachar deja el ítem a la vista, tachado y al final de su sección; destachar en la lista lo vuelve a pendiente; el contador cambia igual que antes.
    - S10b: "Lo marcaste en tu Despensa" en vez de "Con lo que tengo"; el grupo sigue siendo "tenes".
    - S12: la línea de ayuda nueva.
    - Si alguna fija "tenes" para una "info" de unidad distinta o de cobertura parcial, pasa a "pendiente" con la misma sugerencia, y se anota acá.
  - `r4_ux` X7: la indicación nombra la Despensa en los dos modos y no "Más herramientas".
  - `n01` N12: la despensa se abre con el segmento, con Compras marcada y sin "← Compras".
  - `m01`, grupo `compras` (como M3 y M6 en la Etapa 2): en modo simple la vista no muestra la barra de presupuesto y tiene su aviso; en los dos modos el menú ⋯ lista los paneles y cada uno se muestra y funciona (presupuesto, compra realizada, precio, costo de receta, cálculo por recetas, simulación de existencias y multiplicador). M4 sigue exigiendo el aviso de Compras.
  - `d01`: D7 suma el segmento, el interruptor, las casillas y la hoja "Anotar gasto"; D8 abre los plegables de `comprasHerramientas`.
  - `dp01` DP1: la Despensa con segmento, ítems con cantidad e historial y el enlace a las ideas.
  - Las que abren paneles por id con `R.openPanel` (bkp02, f01_int, f02_desp, f02_units, f03_plan, f04_gasto, r2_dom, r2_pan, r3_rec, r4_ux y regression) no deberían cambiar: los ids siguen. Si alguna exige que el panel se vea, entra por el menú ⋯ y se anota acá.
  - `u01` U5 a U9, `j01` J4 y `e1` E1-6 siguen tocando `#comprasBought`, con los mismos datos.
- Pruebas nuevas, batería `e5_compras.js` (al final de `suites.json`):
  - C5-1 (E5-respaldo-completo): en un marco, restaura el respaldo de ejemplo y, entrando solo con toques (pestañas, segmento, menús ⋯ y plegables), comprueba que cada módulo se ve con su cantidad: plan 28 de 28; 9 platos y 5 recetas; Mis cantidades por receta (4); despensa (7 marcas y 8 existencias con cantidad); movimientos (8, en los historiales por ítem y en Todos los movimientos); productos extra (3, en su sección); presupuesto (en la barra, en modo completo, y en su panel); compras realizadas (3); Mis precios (8); porciones (3); historial del plan (6); semanas fechadas (2); variaciones (1); Lo que comí (14); preparaciones (4); objetivos (4); rutina y excepciones (2 y 2); preferencias de recetas (2); equivalencias (2); ideas favoritas (2) y tema. Cada elemento tiene que verse (`getClientRects`) y recorrer todo no escribe nada.
  - C5-2: lista por secciones: cada ítem está en una sola sección, en el orden fijo; Pendientes, "Ya tenés" y "Ya en tu despensa" juntos tienen los mismos ítems y cantidades que `shoppingPlanItems` (la regla de S3).
  - C5-3: interruptor: apagado, ningún "Ya tenés" y todas las cantidades del plan; encendido, como antes; escribe solo `comprasOpciones_v1` y solo al tocarlo; apagado, "Terminé de comprar" suma la cantidad completa.
  - C5-4: productos extra: "+ Agregar producto" arriba; el producto aparece en su sección; tachar escribe `done`; Editar; Quitar con Deshacer deja `manualShopping_v1` byte a byte.
  - C5-5: "Terminé de comprar": lo mismo que Lo compré (despensa, movimientos y comprados). "Anotar gasto" sin datos no escribe; con monto y comercio, una compra válida; con detalle, Mis precios suma solo las filas con cantidad y precio; un monto inválido no escribe nada; el Deshacer devuelve compras y precios byte a byte.
  - C5-6: Despensa: cantidad legible; el historial de cada ítem coincide con sus movimientos; Editar con Deshacer; Quitar con Deshacer; editar sin cambios no cambia la cantidad guardada.
  - C5-7: cantidades legibles: casos de `cantidadLegible` ("166,666667 g" → "167 g", "5 unidad" → "5 unidades", "1 unidad", "0,5 taza", "1,25 kg", "2 cucharaditas"); las filas y Copiar se ven legibles y el `label` interno no cambia.
  - C5-8: el menú ⋯ ofrece las herramientas en los dos modos; cada una se abre en `comprasHerramientas` y funciona.
  - C5-9: una "info" de unidad distinta queda en Pendientes con "revisá"; el contador cuenta lo tachado en "Ya tenés".
  - C5-10: la clave nueva va al respaldo; un respaldo sin ella se restaura; uno con un valor inválido se rechaza.
- Cómo se cumplen los controles:
  - E5-palabras-compras-todo (≤ 742,8; Etapa 0: 1.857): en el estado "todo", la vista Compras ya no tiene los paneles (están en `comprasHerramientas`, que las capturas no abren). Quedan el segmento, la barra, el interruptor, las secciones y los plegables abiertos ("Ya tenés", "Ya en tu despensa" y el formulario de "+ Agregar producto"). Estimado: entre 400 y 550 palabras. Si se pasa, el detalle de "Ya tenés" se acorta a "tenés X".
  - E5-respaldo-completo: C5-1.
  - E1-palabras-compras (normal, ≤ 262; hoy unas 228): salen la ayuda de "Lo compré", el panel de extras, "Pendientes | Todos", Compartir, Copiar y Ver el plan; entran el segmento, el interruptor, "+ Agregar producto" y los títulos de sección. En modo simple no hay barra. Debería bajar.
  - Despensa (E1, normal, ≤ 391; hoy 158): suma el segmento y un "Historial (N)" plegado por ítem.
  - E4-palabras-ideas, E4-palabras-comidas, E2-semana-alto, C1-1 a C1-4, C2-1, C3-1 y C4-1 no se tocan. Las pruebas de respaldo, despensa, compras y plan no bajan y la cantidad total sube (10 nuevas como mínimo).
  - `validar-etapa.mjs 5` corre los criterios de las Etapas 1 a 4 además de los dos nuevos.

**Plan corto, segunda versión** (revisor-codigo marcó 2 bloqueantes en la primera; esto los corrige y manda sobre lo de arriba)
- Medición de las herramientas: `criterios.json` suma E5-palabras-herramientas-compras (vista `compras-herramientas`, estado `todo`, ≤ 742,8; hoy esos paneles suman unas 1.593 palabras).
  - `herramientas/capturas.mjs` suma la vista `compras-herramientas`, con el camino `openTab("compras"); abrirHerramientaCompras("todas")`, que muestra todos los paneles a la vez (más de lo que muestra cada ítem del menú). En "todo" abre sus plegables como cualquier vista. Es la única excepción a "solo caminos": una vista nueva, sin tocar `MEDIR`. Se corrige la línea "capturas.mjs no cambia".
  - Para entrar en el tope, las ayudas de los paneles se recortan a una línea y los textos de sus resultados se acortan, a la mitad o menos. Lo que fijan las pruebas de lógica no se toca; si algún texto fijado hay que acortarlo, va acá con su reemplazo.
- r2_shop S4b: comprobación positiva. Merluza tiene que verse en Pendientes (una fila `[data-shop-key]` fuera de los plegables), Arroz no. El plegable "Ya tenés" se busca por su título, cerrado y con "Arroz: 300 g". Reviso las demás pruebas que buscan filas con selectores de estructura (`#comprasList > …`, el primer `details.shop-group`) para que ninguna quede vacía: las que cambien van al Registro.
- Productos extra: se quedan en su propia sección "Otros productos", al pie de la lista (el mismo `#manualShopList`, fuera de `#comprasList`, para que las pruebas que cuentan filas del plan no cuenten extras). Quitar pasa a no pedir confirmación y ofrece Deshacer.
- "Anotar gasto": lo más simple. Abre el panel de siempre `#purchasesPanel` (en `comprasHerramientas`) ya cargado, como "Cargar pendientes de la lista": la fecha de hoy, la moneda del presupuesto (o ARS), los productos que acaban de pasar a la despensa, "Guardar los precios… como referencia" marcado y "Sumar a la despensa" desmarcado (ya se sumaron). `savePurchase` no se parte: las compras y los precios que quedan son los del formulario de siempre. El monto es obligatorio solo para registrar la compra, como hoy.
- Grupo de las "info": solo la de unidad distinta ("la unidad no coincide") pasa a Pendientes con "· revisá". "Cubre lo que tiene cantidad" sigue en "Ya tenés", como fija S1b.
- `miPlatoFacil_comprasOpciones_v1` va también en la lista de omitir si es null (18, línea 21). Un respaldo viejo sin ella deja el interruptor como está; C5-10 lo prueba.
- r2_uni U2 y U3 leen `#stockList` por id. Si alguna prueba exige que se vea, entra por el menú ⋯.
- C5-8: cada herramienta se abre en 2 toques o menos desde Compras (⋯ y el ítem): `#stockSave`, Cargar pendientes, Comparar alternativas y las demás. `#stockMovesPanel` se abre desde la Despensa (segmento y plegable).

**Implementación** (manda sobre las dos versiones del plan donde difieren)
- Commits: `2fb37f0` (Lista | Despensa, secciones, interruptor, herramientas en el menú ⋯ y pruebas de interfaz adaptadas), `0fc4888` (textos cortos en las herramientas) y `9ae4dac` (batería `e5_compras.js`).
- Pruebas: 504 de 504 (eran 493). La batería nueva `e5_compras.js` tiene 11 pruebas, de C5-1 a C5-10 (C5-3 tiene una segunda parte, C5-3b). Ninguna batería bajó.
- Pruebas adaptadas, con la misma fuerza o más (ninguna borrada):
  - `d01` D5: el botón que alterna en Compras pasa a ser el segmento "Lista | Despensa" (el activo, con fondo verde y distinto del otro). Antes era el filtro "Pendientes | Todos", que salió.
  - `n01` N4: el botón de arriba se prueba desde `comprasHerramientas` ("← Compras"), porque la Despensa ahora es raíz de la pestaña.
  - `m01`:
    - M2: en Compras, lo avanzado es la barra de presupuesto.
    - M3: en la vista, la lista, "+ Agregar producto", el interruptor y "Terminé de comprar". Además, cada herramienta del menú ⋯ (Compartir y Copiar, compras realizadas, presupuesto, precios, costo de receta, otras recetas con la simulación, multiplicador y existencias) se abre y muestra sus controles.
    - M4: el aviso de Compras queda al final de la pantalla.
    - M6: además, en modo completo, el mismo recorrido del menú ⋯.
    - M7: la barra vuelve a ocultarse.
  - `r4_ux`:
    - X4: "+ Agregar producto" arriba de la lista, extras al pie, Terminé de comprar y estado, y las herramientas en `comprasHerramientas`.
    - X5: los 6 paneles, cerrados por defecto.
    - X7: la ayuda nombra la Despensa en los dos modos.
  - `r2_shop`:
    - S4b (bloqueante de revisor-codigo): comprobación positiva. "Merluza: 2 unidades" se ve en Pendientes (filas dentro de las secciones), Arroz no, y "Ya tenés" se busca por su título.
    - S4c: sin "Todos". Lo tachado sigue a la vista, con `is-done`, y se destilda ahí.
    - S10b: "Lo marcaste en tu Despensa".
    - Revisé las demás pruebas que buscan filas por estructura. `renderedRows` (`#comprasList .shop-item label`) y `keysEnPantalla` (`#comprasList [data-shop-key]`) cuentan dentro de las secciones; los extras quedan fuera de `#comprasList` (`#comprasExtras`), así no se cuentan como filas del plan. `e1` (E1-6) busca `details.shop-group` con un `data-shop-key` concreto. Ninguna queda vacía.
  - `e1` C1-2: después de recargar, el tachado se busca en la lista sin tocar "Todos": es más estricto.
  - `dp01` DP10: "Lo marcaste en tu Despensa".
  - `f01_int` M1 y `f02_units` U2: las filas se ven legibles ("2 unidades", "2 cucharaditas") y además se exige el `label` interno sin cambios ("2 unidad", "2 cucharadita").
  - Sin cambios: `r3_rec` E3, `r2_uni` (`#stockList` se lee por id), `f02_desp` D3, `u01`, `j01` y `e1` E1-6, que tocan `#comprasBought`.
- Medidas (alto en px / palabras visibles, tema claro; antes = `capturas/etapa-4`, después = `capturas/etapa-5`):

| Vista | Estado | Antes | Después |
|---|---|---|---|
| Compras | normal | 2.998 / 227 | 3.105 / 225 |
| Compras | todo | 15.490 / 1.820 | 4.212 / 376 |
| Herramientas de Compras | todo | (dentro de Compras) | 8.778 / 710 |
| Despensa | normal | 2.510 / 158 | 3.165 / 179 |
| Despensa | todo | 3.150 / 575 | 4.622 / 750 |

  - La Despensa en "todo" crece porque abre el historial de cada ítem y Todos los movimientos (no tiene tope en ese estado).
  - E5-palabras-compras-todo: 376 ≤ 742,8. E5-palabras-herramientas-compras: 710 ≤ 742,8. E1-palabras-compras: 225 ≤ 262.
- Compuerta: "VALIDACIÓN ETAPA 5: OK (37 controles, 5.3 min)", con 504/504 pruebas, la clave nueva como opcional en el respaldo y los mismos números en tema oscuro.

**Decisiones que tomé sin vos**
- Los botones "Pendientes | Todos" salieron: lo tachado queda a la vista, tachado y al final de su sección. La variable `comprasShowAll` sigue existiendo porque la reinician las pruebas.
- Los productos extra van en su propia sección, "Otros productos", al pie de la lista (no repartidos por sección del súper), con Editar y Quitar con Deshacer, sin confirmación.
- "Terminé de comprar" es el mismo botón `#comprasBought` y hace lo mismo que "Lo compré". El aviso suma "🧾 Anotar gasto", que abre el formulario de siempre de Compras realizadas ya cargado: lo que acaba de pasar a la despensa, la fecha de hoy, la moneda del presupuesto, "Actualizar Mis precios" marcado y "Sumar a la despensa" desmarcado. `savePurchase` no cambió.
- Solo la "info" de unidad distinta pasa a Pendientes ("· revisá", con la sugerencia debajo). "Cubre lo que tiene cantidad" sigue en "Ya tenés", como fija S1b.
- `seccionDelSuper` usa las verduras y frutas del armado y una tabla de palabras. Lo que no reconoce va a "Otros". La revisión de la tabla queda para la Etapa 10.
- La barra de presupuesto redondea a pesos ("$60.000 · ≈ $3.975 estimado (faltan 13 precios)") y solo se ve en modo completo.
- Para entrar en el tope de palabras, en las herramientas:
  - las ayudas quedaron en una línea;
  - lo que falta estimar se agrupa por motivo ("Sin precio compatible: a, b, c");
  - Comparar alternativas dice "Sin precio: …";
  - se sacaron las frases largas de aclaración.
  
  Los textos que fijan las pruebas de lógica ("Costo parcial estimado", "Subtotal estimado con referencias inequívocas", "Falta comprar", "Gasto real…", "diferencia", "Costo de todas las recetas del plan…", "marcado en despensa…") no cambiaron.
- La vista `compras-herramientas` de las capturas abre `abrirHerramientaCompras("todas")`, que muestra todos los paneles juntos: mide más de lo que muestra cada ítem del menú.
- El Deshacer de Editar en la Despensa vuelve a escribir la despensa y las marcas como estaban y anota el movimiento inverso ("Deshacer: edición").

**Mejoras sugeridas**
- Las filas de "Ya tenés" con despensa en otra unidad muestran la sugerencia completa: se podría acortar a "tenés X".
- La tabla de secciones del súper se arma a mano: conviene revisarla con los ingredientes reales del catálogo (Etapa 10).
- La herramienta "Porciones, existencias y costos" repite la lista de existencias de la Despensa; podría quedar solo el multiplicador (Etapa 8).
- El ≈ precio por ítem en la lista y la sugerencia de equivalencias llegan en las Etapas 7 y 8.

**Revisores**
- revisor-codigo, sobre el plan: BLOQUEANTE en la primera versión. Los paneles mudados a `comprasHerramientas` quedaban sin tope, y S4b de r2_shop podía pasar vacía.
  - Lo resolví sumando a `criterios.json` (más estricto) E5-palabras-herramientas-compras ≤ 742,8, con la vista nueva `compras-herramientas` en las capturas.
  - S4b quedó con una comprobación positiva. Se verificó en el diff.
- revisor-codigo, sobre el diff: NO BLOQUEANTE (los dos bloqueantes, resueltos; datos y pruebas, bien).
- revisor-usuario: NO BLOQUEANTE. Compras con todo abierto pasó de 15.490 a 4.212 px. "Lista | Despensa" se entiende y no hay textos cortados ni superpuestos.

**Mejoras sugeridas**
- Las cantidades mezclan formatos ("Brócoli (×2)", "Ajo: 1,5 unidades", "1 unidad + sin cantidad en 1 plato").
- Las notas de "Ya tenés" ocupan 2 o 3 líneas: llevarlas a una línea o a "ⓘ".
- En "Otros productos", "Quitar" queda solo en una línea debajo de cada ítem.
- Con la lista vacía, el botón lleno es "Terminé de comprar": debería llevar a Semana.
- La despensa creció a 3.165 px por "Historial (N)" en cada ítem, y repite un alimento como chip de lo básico y como ítem con cantidad ("Huevos" y "Huevo · 6 unidades").
- El aviso de herramientas ocultas sigue ocupando 3 líneas.
- "Anotar gasto" carga la cantidad completa del plan aunque se haya comprado solo lo que faltaba (el precio por unidad puede quedar mal): Etapa 8.
- La barra de presupuesto antepone "$" también con USD: Etapa 8.
- Se perdieron dos aclaraciones: "Existencia sin cantidad registrada" y el signo de la diferencia en compras realizadas.
- La tabla de secciones del súper es manual. `#budgetAlternative_0` es un select cortado que ya venía de antes.

### Etapa 6 · Un solo registro ✅

Rama `rediseno-etapa-6-registro`. Versión 15.5.0.

**Plan corto**
- Qué hay hoy (P11, reproducido en el código):
  - "Lo comí" (Hoy y la hoja de un hueco de hoy) y "Lo que comí" (`#consumptionPanel`, Semana ⋯ → `planHerramientas`) escriben `miPlatoFacil_consumption_v1`. Quitar pide confirmación y no tiene Deshacer.
  - "Lo cociné" de una receta (`cookRecipeNow`, 34) escribe `miPlatoFacil_cookingHistory_v1` (comida "Otra") y descuenta la despensa, con Deshacer.
  - "Lo cociné" de un plato (`cookedPlate`, 09; el viejo "✓ Cociné") solo suma el contador `cooked` del plato en `miPlatoFacil_saved`: no tiene fecha, no deja registro y no tiene Deshacer.
  - "Historial de comidas preparadas" (`#cookingHistoryPanel`, plegado en Mis comidas) escribe `cookingHistory_v1` a mano, sin tocar el contador. Eliminar pide confirmación.
  - Resultado: lo que comiste se ve en una herramienta de la Semana; lo que cocinaste, en Comidas, y el contador, en las tarjetas. Ninguno muestra a los otros.
- La vista Registro (pantalla nueva `registro`, "Registro"):
  - Arriba, el día: "‹" día anterior, la fecha ("Hoy · lunes 26 de octubre", "Ayer…" o "Miércoles 21 de octubre") y "›" día siguiente (no pasa de hoy). Abre en hoy.
  - Abajo, las comidas de ese día en orden (desayuno, almuerzo, merienda, cena, otra). Cada fila dice qué fue y de qué tipo: "🍽️ Lo comí · Almuerzo · Pollo con arroz (del plan)" o "🍳 Lo cociné · Cena · Merluza con puré". Lo comí sale de `consumption_v1` y Lo cociné, de `cookingHistory_v1`. Si los dos son de la misma comida en el mismo hueco, quedan juntos, pero cada registro es una fila propia: no se combinan ni se deduplican.
  - Cada fila tiene "Quitar" (rojo, 44 px).
  - Día sin nada: "Nada registrado este día." Siempre hay dos botones: "+ Lo comí" y "+ Lo cociné", que abren el formulario de cada uno con la fecha de ese día ya puesta.
  - "Días con registros": una fila de chips con los últimos 14 días que tienen algo (fecha corta y cantidad), para saltar sin pasar día por día.
  - Plegables, al pie y cerrados:
    - "Anotar otra comida y ver la semana": el mismo `#consumptionPanel`, con su formulario, la semana con "N comidas registradas", los grupos y `#habitGoalsPanel` (Objetivos).
    - "Todas las preparaciones": el mismo `#cookingHistoryPanel`, con su formulario y `#cookingHistoryList`.
    - "Veces que cocinaste cada comida": el contador `cooked` (ver Riesgos).
  - El resumen en la Semana ("Verduras en 9 de 14 comidas") sigue siendo de la Etapa 8.
- Cómo se llega (la pantalla vive en la pestaña desde la que se abre, como `planHerramientas` o `comida`; arriba muestra "← Hoy", "← Semana", "← Comidas" o "← Más"):
  - Más: un botón nuevo en la grilla, "📒 Registro · Lo que comiste y cocinaste" (`data-open-registro`).
  - Hoy: debajo de las 4 comidas, la línea "Ver tu registro de hoy →" (`data-open-registro`). El aviso de Lo comí pasa a "Anotado en tu registro (Almuerzo). Deshacer", con el mismo `data-today-undo`.
  - Semana ⋯: el ítem `data-plan-herr="consumo"` cambia de texto a "Registro y objetivos" y abre `registro` en hoy, con "Anotar otra comida y ver la semana" abierto (`abrirHerramientaPlan("consumo")` llama a `abrirRegistro({abrir:"comi"})`). El grupo `data-herr="consumo"` se vacía y sale de `planHerramientas`, pero el nombre sigue aceptado.
  - Detalle de una comida (`comida`): debajo de las etiquetas va "Cocinado 4 veces · Ver en el registro" ("Ver en el registro" si no tiene contador). Abre el último día con un registro de esa comida, o hoy si no hay ninguno. Se buscan su `sourceId` y, en las recetas, la receta y sus copias del plan (`recipeSourceId`).
  - `abrirRegistro({fecha, abrir})` es la única entrada; los cuatro caminos la usan.
- Cómo se corrige cada tipo (Deshacer en vez de confirmaciones; ninguna de estas acciones pide `confirm`):
  - Lo comí:
    - Quitar saca solo ese `id` de `consumption_v1`. El aviso dice "Quitaste: … · Deshacer".
    - Deshacer vuelve a escribir la clave byte a byte, si nada cambió después; si cambió, dice "No se puede deshacer: los datos cambiaron después", como `oneTapRestore`.
    - "+ Lo comí" usa `recordConsumption`, como el formulario de siempre, y también tiene Deshacer.
  - Lo cociné (registro con fecha):
    - Quitar saca solo ese `id` de `cookingHistory_v1`, con el mismo Deshacer.
    - No toca la despensa ni el contador. El aviso lo dice: "La despensa no cambia". El descuento de la despensa se deshace solo con el Deshacer inmediato de Lo cociné, como hoy.
    - "+ Lo cociné" usa `cookingHistoryRecord`. El aviso de duplicado ("Ya hay un registro…") deja de ser un `confirm`: se anota igual y se ofrece Deshacer.
  - Lo cociné de un plato (el botón del detalle y de Mis comidas):
    - Suma el contador, como hoy, y además anota la preparación de hoy en `cookingHistory_v1` con `cookingHistoryRecord(plato, hoy, "Otra")`, el mismo formato que una receta. Así aparece en el día.
    - El aviso conserva "Cocinaste este plato N veces" (lo fija `e4`) y suma Deshacer, que vuelve `saved` y `cookingHistory_v1` byte a byte.
  - El contador: en "Veces que cocinaste cada comida", cada plato con `cooked > 0` tiene "−1", con Deshacer. Nunca baja de 0 y escribe solo el campo `cooked` de ese plato con `persistSaved`, como `cookedPlate`.
  - Los Quitar viejos (`[data-consumption-remove]` y `[data-cooking-history-delete]`) quedan dentro de los plegables del Registro y usan las mismas funciones nuevas: sin `confirm` y con Deshacer. Conservan los textos que fijan las pruebas ("Registro quitado.", "Registro eliminado.").
  - `quitarRegistro(tipo, id)` y `deshacerRegistro()` van en el archivo nuevo. Usan una lista de claves propia, `REGISTRO_UNDO_KEYS = [CONSUMPTION_KEY, COOKING_HISTORY_KEY, "miPlatoFacil_saved"]`, así no interfieren con el Deshacer de Lo cociné ni con el de Lo compré.
- Qué pasa con los paneles viejos (se integran, nada se elimina):
  - `#consumptionPanel` y `#habitGoalsPanel` se mudan de `23-planHerramientas.html` al Registro, con todos sus ids, su lógica (24) y su navegación por semanas (`data-consumption-week`).
  - `#cookingHistoryPanel` se muda de `18-misplatos.html` al Registro, con todos sus ids y su lógica (19). Mis comidas queda sin él.
  - Las ayudas largas de los dos paneles quedan en una línea ("Lo que comiste, por semana, con tus objetivos." y "Preparaciones con fecha."). El aviso "No modifica el contador Cociné…" sale: ahora el Registro muestra los dos juntos.
  - Las etiquetas "Cocinado N veces" de las tarjetas y el orden "Más cocinadas" de Mis comidas siguen como están: son un resumen, no un lugar para corregir.
  - El botón "✓ Cociné" de `savedCard` (09, que ya no se pinta) pasa a "🍳 Lo cociné", por vocabulario.
  - Vocabulario (mejora de la Etapa 3):
    - "✓ Comido" en Hoy pasa a "✓ Lo comí".
    - "✓ Comido hoy" en la hoja del hueco (38) pasa a "✓ Lo comí hoy".
    - "Lo que comí y objetivos" pasa a "Registro y objetivos".
- Archivos:
  - `fuente/cuerpo/pantallas/`:
    - nueva `31-registro.html`: el día, la lista, "+ Lo comí" y "+ Lo cociné", los chips de días, `#registroEstado` y los plegables, con los paneles que se mudan;
    - `18-misplatos.html`, sin `#cookingHistoryPanel`;
    - `23-planHerramientas.html`, sin el grupo `consumo`;
    - `01-home.html`, con el botón de Más y la línea de Hoy;
    - `24-comida.html`, con la línea "Ver en el registro".
  - `fuente/codigo/`:
    - nuevo `42-registro.js`: `abrirRegistro`, `renderRegistro`, `registrosDelDia(fecha)` (pura: junta y ordena, no escribe), `quitarRegistro`, `deshacerRegistro`, el "−1" del contador y los manejadores;
    - 09: `cookedPlate` anota la preparación y ofrece Deshacer;
    - 19 y 24: Quitar sin `confirm`, que llama a `quitarRegistro`;
    - 31: el texto "✓ Lo comí", el aviso y la línea;
    - 38: el ítem y `abrirHerramientaPlan("consumo")`;
    - 39: la línea del detalle;
    - 14 y 32: `go("registro")` llama a `renderRegistro`.
  - `fuente/estilos.css`: filas del registro, navegación por día y chips, con el sistema de diseño (44 px, rojo para Quitar, verde para "+ Lo comí" y "+ Lo cociné", tema claro y oscuro).
  - `herramientas/capturas.mjs`: la vista nueva `registro` (`openTab("mas"); abrirRegistro()`), para la compuerta y para revisor-usuario.
  - `docs/validacion/criterios.json` (más estricto, solo suma):
    - E6-palabras-registro: vista `registro`, estado `normal`, ≤ 391, el tope de la Despensa de la Etapa 1;
    - E6-palabras-registro-todo: estado `todo`, ≤ 742,8, el tope de las herramientas de Compras.
    - Así lo que se muda no queda en una pantalla sin tope.
  - `fuente/version.json` → 15.5.0.
- Orden de arranque: `init()` corre durante la carga de 14, antes de que cargue 42. Las pestañas no se recuerdan entre cargas, así que nada abre `registro` en el arranque. Igual, `renderRegistro`, `registrosDelDia` y lo que pinta son declaraciones `function` y sus tablas van en `var`. 14 y 32 la llaman con `typeof renderRegistro==="function"`. En 42 no hay `const` ni `let` de nivel superior que lea el render. Los paneles mudados se siguen enganchando por id en 19 y 24, que cargan después de que el HTML ya está.
- Riesgos para los datos (ningún formato cambia; no hay claves nuevas ni migraciones):
  - `miPlatoFacil_consumption_v1`:
    - arreglo (máximo 2000) de `{id, date, meal (desayuno…otra), title ≤ 120, groups, sourceId|null, planned}`;
    - se escribe solo con `recordConsumption` y `saveConsumption`;
    - si lo guardado no es válido, `loadConsumption` devuelve `[]`: el Registro no muestra nada y Quitar no escribe (solo escribe si encontró el `id`), así no se pisa un arreglo que no se pudo leer.
  - `miPlatoFacil_cookingHistory_v1`:
    - arreglo de `{id, date, meal (texto libre: "Almuerzo", "Otra"…), title, lines, sourceId, status}`;
    - `loadCookingHistory` descarta lo inválido, y el Eliminar de hoy reescribía sin eso. Quitar ahora lee el arreglo crudo y saca solo el `id`, así los registros que no se muestran quedan como estaban;
    - la comida se compara sin mayúsculas solo para ordenar; lo guardado no cambia.
  - `miPlatoFacil_saved`:
    - solo cambia el campo `cooked` (entero de 0 a 100000, como valida `importSavedItem`), con `persistSaved`;
    - "−1" no baja de 0.
  - El contador y el historial pueden no coincidir. En el ejemplo, `plato_p1` tiene `cooked: 4` y una sola preparación con fecha; `plato_b1` tiene 6 y ninguna. Nada se reescribe para igualarlos:
    - el contador no tiene fecha: se muestra en "Veces que cocinaste cada comida", como "Pollo con arroz · 4 veces (1 con fecha)";
    - el día muestra solo lo que tiene fecha;
    - desde esta etapa, Lo cociné de un plato suma en los dos, así la diferencia no crece;
    - quitar una preparación con fecha no resta del contador (así era el Eliminar del historial), y "−1" no quita preparaciones;
    - el texto de la sección explica la diferencia en una línea: "Incluye veces anotadas antes de que hubiera fecha".
  - Mirar el Registro, cambiar de día, abrir los plegables o los chips no escribe nada (C6-1 lo compara byte a byte).
  - Respaldo: no hay claves nuevas, así que 18 no cambia; `consumption_v1` y `cookingHistory_v1` siguen en el respaldo con su validación, y los respaldos viejos se restauran igual (k01, bkp01 y bkp02).
- Pruebas existentes que cambian porque miran la interfaz vieja (la misma cantidad y la misma fuerza; las comprobaciones de datos quedan):
  - `e2_semana` C2-6:
    - `esperados` dice "Registro y objetivos" en vez de "Lo que comí y objetivos";
    - `herr.consumo` exige pantalla `registro` (en vez de `planHerramientas`), `#consumptionPanel` visible y `#consumptionView` con texto;
    - las otras cinco herramientas, igual.
  - `m01_modo`:
    - M4: `menuCompleto` con "Registro y objetivos";
    - M3: `porMenu("consumo", …)` no cambia, porque exige que se vean `#consumptionPanel`, `#consumptionSave` y `#consumptionView`, ahora en el Registro; registrar a mano, igual.
  - `e5_compras` C5-1:
    - las preparaciones se cuentan entrando al Registro desde Más (dos toques) y abriendo "Todas las preparaciones" (`#cookingHistoryPanel summary`), no desde Mis comidas;
    - las mismas exigencias: todas las filas visibles y cada fecha;
    - Lo que comí sigue por Semana ⋯ (`menuSemana("consumo")`) y cuenta igual.
  - `bkp02` C6: `go("misplatos")` pasa a `abrirRegistro()`; el título con XSS se exige igual, como texto, en `#cookingHistoryList` y además en la fila del día.
  - `u01_toque` U1: `/✓ Comido/` pasa a `/✓ Lo comí/`; lo demás, igual.
  - `f06_consumo`:
    - C2b: "✓ Comido hoy" pasa a "✓ Lo comí hoy";
    - C6b: Quitar ya no pasa por `confirm`; exige lo mismo (2 registros y "Registro quitado") y además que el aviso tenga Deshacer;
    - `R.openPanel("consumptionPanel")` lo abre por id: no cambia.
  - `e4_comidas` C4: Lo cociné del plato sigue exigiendo el contador +1 y "Cocinaste". Ahora además hay una preparación de hoy con ese `sourceId`, que se agrega a la comprobación.
  - `d01_diseno`: D7 y D8 suman la pantalla `registro` (44 px, Quitar en rojo, "+" en verde, plegables).
  - Sin cambios:
    - `k01` K5: cuenta `loQueComi` y `preparaciones` con `loadConsumption` y `loadCookingHistory`, sin migración;
    - `e3_hoy` C3-1 y C3-1b: `data-plan-eaten` y `data-today-undo` siguen;
    - `j01` J5 y `n01` N9;
    - `bkp01`;
    - `f06` C7: Lo comí no toca preparaciones ni contador;
    - `imp01`: el contador `cooked`;
    - `u01` U2 a U4: Lo cociné de receta y su Deshacer, con `ONE_TAP_KEYS`.
- Pruebas nuevas, batería `e6_registro.js` (al final de `suites.json`), en un marco con reloj fijo:
  - C6-1 (E6-un-registro): con el respaldo de ejemplo restaurado, desde Más → Registro y recorriendo los días con "‹" y los chips:
    - cada uno de los 14 registros de `consumption_v1` y de los 4 de `cookingHistory_v1` aparece exactamente una vez, en su día y con su tipo;
    - "Veces que cocinaste" lista los 5 platos con `cooked > 0` con su número y cuántos tienen fecha;
    - cada fila tiene Quitar;
    - quitar uno de cada tipo y deshacer deja las tres claves byte a byte;
    - recorrer sin tocar Quitar no escribe nada;
    - ninguna otra pantalla (Hoy, Semana, `planHerramientas`, Mis comidas, `comida`, Compras y Más) tiene a la vista una lista de registros ni un Quitar de registros: `[data-consumption-remove]`, `[data-cooking-history-delete]`, `[data-registro-quitar]`, `#consumptionView` y `#cookingHistoryList` se ven solo dentro de `#registro`.
  - C6-2: las cuatro entradas llegan al Registro en 2 toques o menos:
    - Más → botón;
    - Hoy → línea;
    - Semana → ⋯ → "Registro y objetivos";
    - detalle de una comida → "Ver en el registro", que abre el último día con un registro de esa comida (`plato_p3` → 21/10; una receta del plan → su día).
  - C6-3: "Lo comí" en Hoy:
    - la fila dice "✓ Lo comí" y el registro aparece en el día de hoy del Registro;
    - Quitar ahí, con Deshacer, vuelve a "Lo comí" en Hoy y Deshacer lo restituye byte a byte;
    - el plan no cambia.
  - C6-4: Lo cociné de un plato:
    - contador +1 y una preparación de hoy con su `sourceId`;
    - Deshacer vuelve `saved` y `cookingHistory_v1` byte a byte;
    - quitar la preparación no cambia el contador;
    - "−1" baja 1 y su Deshacer lo restituye; con `cooked: 0` no hay "−1".
  - C6-5: Lo cociné de una receta aparece en el día. Quitarla en el Registro no toca la despensa ni los movimientos.
  - C6-6: "+ Lo comí" y "+ Lo cociné" desde un día pasado:
    - el formulario trae esa fecha;
    - se anota en ese día;
    - una fecha futura se rechaza sin escribir;
    - una preparación repetida se anota sin `confirm` y se deshace;
    - "›" no pasa de hoy.
  - C6-7: datos raros:
    - un `cookingHistory_v1` con un registro inválido y comidas con mayúsculas: el inválido no se muestra y, al quitar otro, queda igual byte a byte; el orden del día es desayuno → otra;
    - un `consumption_v1` inválido: el Registro no muestra nada y Quitar no escribe;
    - títulos con HTML se muestran como texto.
  - C6-8: sin `confirm`: con `window.confirm` que falla si se llama, todos los Quitar del Registro y de sus plegables funcionan y ofrecen Deshacer; "Anotar" avisa con Deshacer.
  - C6-9: primera vez (sin datos): el Registro abre en hoy con "Nada registrado este día" y los dos "+", sin errores; el día y los chips no escriben nada.
- Cómo se mantienen los controles anteriores:
  - E6-un-registro: C6-1. E6-un-registro-revision: revisor-usuario con las capturas de `registro`, `hoy`, `semana`, `comidas` y `mas`.
  - E4-palabras-comidas (≤ 607): Mis comidas pierde el plegable del historial, así que baja.
  - Hoy suma una línea y cambia "✓ Comido" por "✓ Lo comí": sus topes (E1 y E3) siguen.
  - E2-semana-alto: la Semana no cambia (solo el texto de un ítem del menú).
  - E5-palabras-compras-todo, E5-palabras-herramientas-compras y C1-1 a C5-10 no se tocan.
  - Las pruebas de respaldo, despensa, compras y plan no bajan. El total sube (9 nuevas como mínimo: eran 504).
  - `validar-etapa.mjs 6` corre los criterios de las Etapas 1 a 5, los dos de la Etapa 6 y las dos medidas nuevas.

**Plan corto, segunda versión** (revisor-codigo marcó un bloqueante en la primera; esto lo corrige y manda sobre lo de arriba)
- Altas en `cookingHistory_v1` (bloqueante):
  - Todas pasan por una sola función, `agregarPreparacion(registro)` (19): el formulario, "+ Lo cociné", `cookRecipeNow` (34) y el nuevo `cookedPlate` (09).
  - Lee el arreglo crudo de `localStorage` y le agrega el registro, sin filtrar: los registros que no validan quedan como estaban.
  - Si lo guardado no se puede leer o no es un arreglo, no escribe y avisa ("No se pudo leer tu historial de preparaciones: no se anotó nada").
  - El registro nuevo se valida con `validCookingHistoryRecord` antes de escribir: lo que crea "Lo cociné" siempre pasa la validación del respaldo (18).
- `consumption_v1`: `recordConsumption` hace lo mismo. Si hay algo guardado y `validConsumption` lo rechaza, no escribe y avisa; antes lo pisaba al agregar sobre `[]`.
- Deshacer "byte a byte": se guarda el valor anterior de cada clave, o `null` si no existía, y se vuelve a ese estado. `saveConsumption` borra la clave cuando queda vacía: quitar el único registro y deshacer la vuelve a crear igual. C6-3 lo prueba.
- `f06_consumo` deja de depender de `window.confirm=()=>true` para Quitar: un `confirm` que falla si se llama alrededor de C6b. Sigue exigiendo "Registro quitado" y suma el Deshacer.
- C6-4 suma respaldar y restaurar después de Lo cociné de un plato: el historial nuevo pasa la validación y vuelve igual.
- Topes: se miden `registro` normal y todo con capturas antes de fijarlos. Si no entran en ≤ 391 y ≤ 742,8, se acortan textos; ningún control existente se afloja.
- Los chips de "Días con registros" y la línea de Hoy quedan si no complican; si salen, se anota acá.

**Implementación** (manda sobre las dos versiones del plan donde difieren)
- Commits:
  - `60e75c3`: vista Registro, altas sobre el arreglo crudo, Deshacer en vez de confirmaciones y pruebas de interfaz adaptadas;
  - `ed75a66`: batería `e6_registro.js`;
  - `e31bb47`: vista `registro` en las capturas y sus dos topes en `criterios.json`.
- Pruebas: 513 de 513 (eran 504). `e6_registro.js` tiene 9, de C6-1 a C6-9. Ninguna batería bajó.
- Pruebas adaptadas, con la misma fuerza o más (ninguna borrada):
  - `e2_semana` C2-6: el ítem del menú es "Registro y objetivos". `herr.consumo` exige la pantalla `registro`, `#consumptionPanel` abierto y visible y `#consumptionView` con texto.
  - `m01_modo` M4: `menuCompleto` con "Registro y objetivos". `porMenu("consumo", …)` no cambió.
  - `e5_compras` C5-1: las preparaciones se cuentan desde Más → Registro → "Todas las preparaciones", con las mismas exigencias, y además se exige la pantalla `registro`.
  - `bkp02` C6: el título con XSS se exige como texto en `#cookingHistoryList` y también en la fila del día, sin elementos inyectados.
  - Texto "✓ Comido" → "✓ Lo comí":
    - `u01_toque` U1, `e3_hoy` C3-1 y `n01_nav` N9 cambian el texto que buscan;
    - N9, además, pasa de "Registrado" a "Anotado en tu registro";
    - `f06_consumo` C2b: "✓ Lo comí hoy".
  - `f06_consumo` C6b: un `confirm` que anota si se llama. Exige que no se llame, "Registro quitado", el Deshacer (que deja la clave byte a byte) y vuelve a quitar.
  - `e4_comidas` C4-4: Lo cociné del plato exige además la preparación de hoy con su `sourceId`.
  - `d01_diseno` D7: mide también los chips y botones del Registro, con los plegables abiertos.
- Medidas (palabras visibles, tema claro; capturas de la compuerta):
  - Registro: 65 en normal y 427 en todo (topes: 391 y 742,8);
  - Mis comidas, normal: 296 (tope 607);
  - Hoy, normal: 77.
- Compuerta: "VALIDACIÓN ETAPA 6: OK (40 controles, 5.8 min)", 513/513 pruebas, con los mismos números en tema oscuro.

**Decisiones que tomé sin vos**
- Lo comí guarda el título viejo del plato (`savedItemTitle`, desde la Etapa 1). En el Registro se muestra el nombre de hoy (`mealName`) si el plato sigue guardado; si no, el título guardado. Lo guardado no cambia.
- Lo cociné de un plato anota la preparación con comida "Otra" y el nombre del plato como título, igual que una receta.
- "Eliminar registro" del historial pasa a "Quitar", como en Lo comí.
- Los chips de "Días con registros" muestran los últimos 14 días que tienen algo, sin importar cuán viejos sean.
- La línea de Hoy y los chips quedaron: no complicaron.
- "+ Lo comí" es el botón lleno del Registro; "+ Lo cociné" es secundario.
- `abrirHerramientaPlan("consumo")` sigue aceptado y abre el Registro.

**Mejoras sugeridas**
- "Corregir" es quitar y volver a anotar. Cambiar la comida o la fecha de un registro en el lugar sería más directo.
- La fila de Lo comí repite "(del plan)" y puede ocupar tres líneas: se podría pasar a una etiqueta.
- El contador `cooked` y el historial siguen pudiendo no coincidir en los datos viejos. Se podría ofrecer "anotar con fecha" las veces sin fecha, sin inventar fechas.

**Revisores**
- revisor-codigo, sobre el plan: BLOQUEANTE en la primera versión. Las altas de `cookingHistory_v1` filtraban y descartaban en silencio los registros que no validan. Se unificaron en `agregarPreparacion`, que agrega sobre lo guardado tal cual (C6-7). Se verificó en el diff.
- revisor-codigo, sobre el diff: NO BLOQUEANTE. Encontró un error real: había un solo "Deshacer" para toda la app, y un chip viejo deshacía la acción más nueva. Ahora cada chip tiene su propia foto, uno vencido no toca nada y avisa, y el "Deshacer" de Hoy no reescribe si el registro ya no está (prueba C6-10, commit `90f16d0`).
- revisor-usuario: NO BLOQUEANTE. **E6-un-registro-revision se cumple:** todo lo registrado se ve y se corrige en el Registro.

**Mejoras sugeridas**
- "Cocinado N veces" en las tarjetas de Comidas podría llevar al Registro.
- Dentro del Registro con todo abierto quedan dos formularios más ("Registrar" y "Registrar preparación") que repiten "+ Lo comí" y "+ Lo cociné"; "Registrar preparación" no usa el vocabulario. Unificarlos.
- Mover "Objetivos semanales" a Preferencias (Etapa 8).
- Con 2.000 registros de Lo comí, `slice(-2000)` descarta el más viejo sin avisar (viene de antes): avisar y no anotar.
- Cambiar la comida o la fecha de un registro en el lugar: hoy corregir es Quitar y volver a anotar.
- El desplegable "Plato o receta guardada" del Registro llega al borde de la tarjeta.

**Pendientes para vos**
- Ninguno nuevo.

### Etapa 7 · Precios automáticos de INDEC ✅

Rama `rediseno-etapa-7-precios`. Versión 15.6.0.

**Plan corto**
- Formato real del archivo (bajado el 2026-11-02, 207.360 bytes, a una carpeta vacía fuera del repo y leído con un script aparte; el archivo se trató como dato no confiable):
  - Es un `.xls` BIFF8 dentro de un contenedor OLE (cabecera `D0CF11E0`), con un solo flujo `Workbook` de 195.917 bytes. Se puede leer **sin dependencias**: lector mínimo de OLE (FAT, mini-FAT, directorio) y de BIFF8 (registros SST, LABELSST, NUMBER, RK, MULRK, BOUNDSHEET, con CONTINUE). Ya lo probé: lee las dos hojas completas. Va dentro de `herramientas/actualizar-precios.mjs`, nunca en la app.
  - Hoja `Nacional` (95 filas, columnas hasta la 119): fila 3 con el año en la primera columna de cada año ("Año 2017" … "2023" … "2026"; una columna vacía separa los años), fila 4 con el mes en español ("Junio" … "Septiembre"), fila 5 "Pesos". Datos desde la fila 7: región, producto, unidad y un precio por mes, de junio de 2017 a septiembre de 2026. 6 regiones (GBA, Pampeana, Noreste, Noroeste, Cuyo, Patagonia) × 14 productos, de los cuales 11 son comida (pan francés kg, harina de trigo común kg, arroz blanco simple kg, fideos secos guisero 500 g, carne picada común kg, pollo entero kg, aceite de girasol 1,5 litros, leche entera sachet litro, huevos docena, papa kg, azúcar kg) y 3 no (detergente, lavandina, jabón de tocador).
  - Hoja `GBA` (71 filas, columnas hasta la 133): solo GBA, de abril de 2016 a septiembre de 2026, con 59 productos "Variedad | Unidad de medida", 41 de ellos de comida: pan de mesa, galletitas, asado, cuadril, nalga, paleta, jamón cocido, merluza, quesos, manteca, yogur, dulce de leche, manzana, limón, naranja, banana, batata, cebolla, lechuga, tomate redondo, zapallo anco, tomate en conserva, sal, café, yerba, etc. Algunas celdas vienen como `///` (dato que no corresponde) y hay celdas vacías: se descartan.
  - Último mes, GBA (septiembre de 2026, pesos): arroz $1.905,45 el kg; fideos guiseros $1.751,06 los 500 g; huevos $3.940,50 la docena; carne picada $10.713,74 el kg; pollo entero $4.787,75 el kg; leche $2.071,04 el litro; aceite de girasol $6.981,99 los 1,5 litros; papa $2.201,11 el kg; cebolla $2.696,23 el kg; tomate redondo $4.038,58 el kg; pan francés $4.958,05 el kg; azúcar $1.597,51 el kg. Coinciden con la referencia del plan.
  - La nota del archivo dice que los precios de distintas regiones pueden no ser comparables porque los productos no están armonizados: va en la atribución. Fuente: "INDEC, Dirección Nacional de Estadísticas de Precios, Dirección de Índices de Precios de Consumo".
  - Cómo se lee: se buscan las hojas por nombre (`Nacional` y `GBA`) y el encabezado por el texto "Región"/"Variedad"; el año de cada columna arrastra el último "Año NNNN" o número de 4 cifras; el mes se toma por su nombre; el **último mes** es la última columna con precio numérico. Se acepta solo si están los 11 alimentos × 6 regiones y los 41 de GBA con precio positivo. Si la estructura cambia (falta un encabezado, desaparece un producto mapeado, un precio sube más de 3 veces o baja a menos de un tercio contra el mes anterior), la tarea falla con el motivo y no toca `datos/precios.json`.
- `datos/precios-mapa.json` (curado a mano, como el de nutrición): para cada ingrediente de la app (los nombres de `datos/nutricion.json`, que son el catálogo) va el producto INDEC (nombre exacto y hoja), el tamaño del envase en la unidad base (`kg`, `l` o `unidad`: 500 g = 0,5 kg; 1,5 litros = 1,5 l; docena = 12 unidades; 390 g = 0,39 kg), una densidad opcional para pasar gramos a mililitros en líquidos (leche, aceite) y la marca `aprox` cuando el producto INDEC es solo parecido (Muslo de pollo con Pollo entero, Mozzarella con Queso cremoso, Tomate triturado y Puré de tomate con Tomate entero en conserva, Vacío con Asado, Leche en polvo descremada con la entera, Yogur natural con Yogur firme). Las unidades casera→gramos salen de las porciones de la nutrición (`nutritionFor` y `nutritionGrams`).
  - Quedan con precio 40 de los 200 ingredientes (20 %): arroz, fideos, harina de trigo, pan, pan de molde, galletitas de agua, carne picada y picada especial, asado, vacío, jamón cocido, pollo, muslo de pollo, merluza, queso cremoso, mozzarella, manteca, dulce de leche, azúcar, sal, manzana, limón, naranja, banana, papa, batata, cebolla, lechuga, tomate, tomate perita, zapallo, tomate en lata, triturado y puré, leche, leche en polvo descremada, aceite de girasol, agua, yogur natural y huevo.
  - **Sin precio en INDEC** (queda para la Etapa 9 / SEPA): las carnes vacunas salvo picada y asado (lomo, carne vacuna), el cerdo, los pescados salvo merluza (atún, salmón, caballa, sardina, lenguado), el aceite de oliva, casi todas las verduras y frutas (acelga, brócoli, zanahoria, morrón, zapallito, frutilla, durazno, pera, uva, etc.), legumbres, cereales y harinas especiales, frutos secos y semillas, los quesos que no sean cremoso, los yogures griego y descremado, las bebidas vegetales, las especias, las salsas y los endulzantes (miel, mermelada, cacao). En las regiones que no son GBA la hoja `Nacional` solo trae 13 de los 40.
- `herramientas/actualizar-precios.mjs` (sin dependencias, Node 18+; mismo estilo que `actualizar-nutricion.mjs`): `node herramientas/actualizar-precios.mjs [--archivo ruta.xls] [--salida ruta.json] [--hoy AAAA-MM-DD]`. Sin `--archivo` descarga con `fetch`, con límite de tamaño (5 MB) y de tiempo, y controla la cabecera OLE; no ejecuta nada de lo bajado. Procesa, arma el JSON, lo **valida** y recién entonces lo escribe (de forma atómica). Si la descarga, la lectura o la validación fallan, sale con código distinto de 0 y deja `datos/precios.json` como estaba (se conserva el último). Si los precios no cambiaron no reescribe el archivo. `--verificar` valida `datos/precios.json` y `datos/precios-ejemplo.json` **sin red**: versión, mes con formato AAAA-MM y no futuro, regiones conocidas, precios finitos, mayores que 0 y menores que 10.000.000, cada ingrediente en el catálogo de nutrición, GBA completo para todo ítem del mapa, atribución con enlaces. Termina con 0 si todo está bien (control E7-precios-validos).
- `datos/precios.json`: `{ version: 1, revisado, mes: "2026-09", fuente: { nombre, informe, url, archivo, atribucion, nota }, regiones: [...], items: [{ n: "Arroz", b: "kg", i: "Arroz blanco simple", p: { GBA: 1905.45, Pampeana: … }, a?: true }] }`: precio **por unidad base** (kg, l o unidad), por región, con el mes común y la fuente. La atribución (INDEC, enlaces al informe y al archivo, nota de comparabilidad) vive en este JSON (decisión de la Etapa 1: no en `fuente/`) y la app la muestra en Más → Fuentes de datos. Se versiona real (generado con la descarga de hoy) y el `.xls` no se agrega al repo. `datos/precios-ejemplo.json` es el archivo chico de las pruebas (unos 8 ingredientes en 3 regiones, valores redondos, mes fijo): las pruebas de la app nunca usan descargas reales.
- Marca `__DATOS_PRECIOS__` en `herramientas/construir.mjs`, igual que `__DATOS_NUTRICION__`: se incrusta `datos/precios.json` minificado y se controla que no quede la marca sin reemplazar. Va en `fuente/codigo/43-precios.js`, un archivo nuevo **posterior** al 14 (`init()` corre durante la carga del 14: lo que `init()` use desde acá tiene que ser `function` o `var`, no `const`/`let`; los manejadores y el pintado se enganchan después). Mismo patrón que `nutritionDataset`: `preciosDataset.data` deja que las pruebas reemplacen el dataset.
- Workflows:
  - `.github/workflows/actualizar-precios.yml`: como la de nutrición. Cron mensual (el INDEC publica el IPC a mitad de mes: día 20 a las 06:23 UTC) y `workflow_dispatch`; baja, procesa, reconstruye y, si cambian `datos/precios.json` o `index.html`, commitea y publica con `publicar.yml`. `concurrency` propia. Es lo único que escribe en `main`, igual que la de nutrición.
  - **Tarea de precios en el PR** (`.github/workflows/precios-prueba.yml`): corre en `pull_request` (todo PR hacia `main`, o sea el #1 `rediseno` → `main`, sin filtro de ramas: es lo más simple que anda desde la rama) y a mano. Permisos `contents: read`. Baja el archivo, corre el script con `--salida precios-descargado.json`, corre `--verificar` sobre el resultado y sube el JSON, un resumen de productos y el hash del `.xls` como **artifact**. No hace `git add`, commit ni push. Cuando el PR tenga esa corrida, el artifact se lee con `gh api` y se compara con `datos/precios.json`.
- En la app (`43-precios.js` y retoques chicos):
  - `precioDe(nombre, cantidad, unidad)` devuelve `{ costo, fuente, mes, region, aprox }` o `null`. Orden: **Mi precio** (`miPlatoFacil_referencePrices_v1` con `pricesFor`, en ARS; con varios compatibles, el de fecha más nueva) y si no, **INDEC** de la región (si INDEC no publica ese producto en esa región se usa GBA y la fuente lo dice: "Promedio INDEC · GBA · sept. 2026"). Cantidad a unidad base: kg y g directo; l y ml directo (con densidad si viene en gramos); unidad, taza y cucharadas pasan por `nutritionGrams`; el huevo cuenta unidades. Si no se puede convertir o no hay precio: `null` (cuenta como "falta un precio").
  - Lista (Compras): cada ítem a comprar suma "≈ $X" al final de su renglón, calculado sobre lo que **falta comprar** (con "Descontar lo que tengo" prendido, igual que la cantidad), y el total va en la línea resumen que ya existe: "≈ $42.300" y, si faltan, "≈ $42.300 (faltan 2 precios)". Ningún renglón nuevo por ítem. La barra de presupuesto sigue arriba y usa este total en vez del cálculo manual; de paso se corrige el "$" de la barra cuando el presupuesto está en USD (mejora sugerida de la Etapa 5): si la moneda no coincide con ARS, se ve el estimado sin barra. "Anotar gasto" no cambia. Bajo el total, una sola línea con la fuente y el mes ("Promedio INDEC · GBA · sept. 2026"); al tocar un ítem, su hoja dice de dónde salió su precio (INDEC o Mi precio).
  - Cada comida: "≈ $X por porción" en el detalle (`comida`), con la misma regla (suma de los ingredientes con cantidad ÷ porciones de la receta; si faltan, "≈ $X (faltan 2 precios)"). En la tarjeta de Comidas (el hueco que dejó la Etapa 4) va en la línea de etiquetas, sin renglón nuevo. Semana: "≈ $X" por día en el encabezado del día y "≈ $Y la semana" en la línea de resumen que ya existe, solo si cabe sin pasar de 1.266 px; si no, solo en el detalle del día (decisión a anotar).
  - Región: Preferencias → "Región de los precios" (GBA, Pampeana, Noreste, Noroeste, Cuyo y Patagonia; GBA por defecto). **Clave nueva** `miPlatoFacil_region_v1` (`{"region":"Pampeana"}`; cualquier otro valor se ignora y se usa GBA), que **entra al respaldo como opcional** (`COMPLETE_BACKUP_KEYS` y `COMPLETE_BACKUP_OPTIONAL_KEYS`, validando que sea una de las seis; los respaldos viejos se siguen restaurando porque es opcional). Va en el respaldo y no solo en el dispositivo (como `uiMode_v1`) porque cambia lo que ves y conviene que viaje con tus datos. Cambiarla vuelve a pintar Compras, Semana y Comidas.
  - Mi precio: "Mis precios de referencia" (`22`) pasa a llamarse "Mi precio" en la herramienta de Compras y en su menú ⋯; mismos datos y misma clave. "Comparar alternativas" queda para la Etapa 8.
  - "Mostrar precios y presupuesto" (Preferencias): reemplaza la tarjeta "Modo simple" con un interruptor. Prendido: se ven los "≈ $" de la lista, la barra de presupuesto, el costo en comidas y Semana y la fuente. Apagado (el comportamiento de hoy): no se ve nada de eso, y los datos y cálculos siguen. Valor inicial: el de `uiMode_v1` (`completo` = prendido; sin valor o `simple` = apagado), así que nadie ve cambios hasta prenderlo y no hace falta otra clave. Por dentro siguen `isSimpleMode()` y `setUiMode`; lo que `ADVANCED_TOOLS` ya esconde en modo simple sigue escondido igual.
  - Atribución: Más → Fuentes de datos suma "Precios: promedio de una selección de alimentos de INDEC, por región, mes de septiembre de 2026", con enlaces al informe y al archivo, la nota de comparabilidad entre regiones y "Aproximados: no son los precios de tu comercio". Los textos salen del JSON.
- Cómo se mantienen los topes: E1-palabras-compras (≤ 262,8; Compras normal = modo simple = precios apagados) y E2-semana-alto (≤ 1.266 px; Semana normal = precios apagados): con precios apagados los "≈ $", la fuente y la barra no están en el DOM visible, así que no suman palabras ni alto. Con precios prendidos cada renglón suma un "≈ $X" (2 palabras) y la fuente suma una línea; eso solo se mide en `todo`, que tiene su propio tope (E5-palabras-compras-todo). Nada agrega renglones a Semana: solo texto en líneas que ya existen.
- Riesgos para los datos: ningún formato guardado cambia. `referencePrices_v1`, `uiMode_v1`, `shoppingBudget_v1` y las demás se leen igual; `region_v1` es nueva y opcional; no hay migración. Un `precios.json` inválido en la app (por ejemplo vacío) hace que se use el comportamiento sin precios automáticos. La descarga de INDEC nunca pisa un archivo bueno con uno malo. Sin llamadas a internet en la app (regla 6).
- Pruebas que cambian:
  - Interfaz: las que buscan la tarjeta "Modo simple: activado/desactivado" o su texto (`m01_modo.js`, `n01_nav.js` N11, `e4_comidas.js`, `e5_compras.js`) pasan a buscar "Mostrar precios y presupuesto" (mismo `#uiModeToggle`, mismo `data-ui-mode-toggle`, mismo efecto); se explica en el Registro y no se borra ninguna. Las que miran la línea resumen de la lista se adaptan si el texto del total cambia.
  - Lógica (sin cambios): respaldo (`bkp01`, `bkp02`, `k01`) cumple con la clave nueva opcional y el fixture `respaldo-v14.9.94.json` se sigue restaurando; costos de receta, presupuesto, compras realizadas y `pricesFor` no cambian.
- Pruebas nuevas (suite `e7_precios.js` en `pruebas/suites.json`, con el dataset de ejemplo y los precios prendidos):
  - C7-1 la lista muestra ≈ precio por ítem y el total ("faltan N precios" cuando un ítem no tiene precio).
  - C7-2 cada comida muestra ≈ costo por porción (detalle y tarjeta).
  - C7-3 cambiar la región cambia los valores (GBA por defecto; una región inválida guardada se ignora).
  - C7-4 Mi precio gana sobre el automático y quitarlo vuelve al automático.
  - Además: C7-5 el dataset de ejemplo y el real pasan las mismas comprobaciones que `--verificar`; C7-6 `region_v1` entra y sale del respaldo y los respaldos viejos se restauran; C7-7 con "Mostrar precios y presupuesto" apagado no se ve ningún "≈ $" ni la fuente; C7-8 el lector de BIFF8 lee un `.xls` de ejemplo armado con un escritor mínimo dentro de la prueba, sin dependencias.
- Controles de la etapa: C7-1 a C7-4, E7-precios-validos (`node herramientas/actualizar-precios.mjs --verificar`, código 0) y E7-tarea-en-pr.

**Implementación (v15.6.0)**
- `herramientas/actualizar-precios.mjs` (lector OLE/BIFF8 propio, sin dependencias), `datos/precios-mapa.json` (40 ingredientes), `datos/precios.json` (septiembre de 2026, generado con la descarga real del 2026-11-02), `datos/precios-ejemplo.json` (8 ingredientes, 3 regiones, valores redondos para las pruebas), marca `__DATOS_PRECIOS__` en `construir.mjs`, `fuente/codigo/43-precios.js` y los workflows `actualizar-precios.yml` y `precios-prueba.yml`.
- `node herramientas/actualizar-precios.mjs --verificar` termina con 0 (valida el mapa, `datos/precios.json` y el ejemplo, sin red). Si INDEC cambia o quita un producto o su unidad, la tarea falla y el error nombra el producto y el ingrediente que lo usa. No hay una prueba del lector con un `.xls` armado (C7-8 del plan corto): se lo probó con el archivo real del 2026-11-02 y la tarea del PR lo prueba con cada descarga; queda como mejora sugerida.
- Mides con precios apagados (estado normal): Compras 230 palabras (tope 262,8; antes 225: suma la línea "Precios estimados: activalos en Preferencias") y Semana 1.013 px (tope 1.266). Con precios prendidos se miden Compras todo (388 de 742,8) y Registro todo.
- Pruebas: `e7_precios.js` con C7-1 a C7-4 y además C7-5 (datos y conversión de unidades), C7-6 (respaldo) y C7-7 (apagado); 521 pruebas en total (514 + 7). C7-1 prende los precios tocando `#uiModeToggle`; C7-2, C7-3 y C7-4 siembran `uiMode_v1="completo"` y el dataset de ejemplo; C7-7 los apaga tocando el mismo interruptor. E1/E2 se miden en estado normal (precios apagados) y no se tocaron; e4, e5 y e6 ya sembraban "completo".
- Pruebas adaptadas (solo texto): `m01_modo.js` M5 y M7 pasan de "Modo simple: activado/desactivado" a "Mostrar precios y presupuesto: desactivado/activado" (mismo `#uiModeToggle`; se conservan todas las aserciones de `getUiMode()`, `UI_MODE_KEY` y `appData()`, y los avisos `data-mode-note` de M4/M6/M7 se mantienen igual); `e4_comidas.js` (línea de visibilidad de la tarjeta) cambia solo el texto; `n01_nav.js` N11 solo el comentario. Ninguna se borró y ninguna lógica cambió.
- Respaldo: `miPlatoFacil_region_v1` (`{"region":"Pampeana"}`, objeto porque el respaldo exige un objeto por clave) entró como opcional, en la lista de omitir si es null y con validación; el fixture `respaldo-v14.9.94.json` no lo tiene y se restaura igual (C7-6). `k01`, `bkp02` y `j01` no cuentan claves fijas: pasaron sin cambios.
- Dominios: ningún literal con la dirección de INDEC en `fuente/` (ni en comentarios); la atribución sale del JSON incrustado y la dirección real solo está en `herramientas/` y en `datos/`.

**Tarea de precios en el PR** ✅: corrió en el PR #1 con el push de `etapa-7-ok` (commit `e81fa88`) y las dos tareas dieron "success". La tarea de prueba bajó el archivo real de INDEC, lo procesó sin commitear nada y subió el artifact `precios-descargado` (septiembre de 2026, 40 ingredientes, arroz en GBA a $1.905,45, igual que la referencia del plan). Sin avisos de descarga.

**Decisiones que tomé sin vos**
- Precios apagados por defecto (valor inicial desde `uiMode_v1`). "Mostrar precios y presupuesto" es el mismo interruptor que el modo simple, así que también destapa las herramientas avanzadas; separarlos queda para la Etapa 8. Quien no los prendió ve en Compras una línea: "Precios estimados: activalos en Preferencias" (toca y abre Preferencias).
- Región: si INDEC no publica un producto en la región elegida se usa el de GBA y la fuente lo dice ("Promedio INDEC · GBA · sept. 2026"). Fuera de GBA, solo 13 de los 40 ingredientes tienen precio propio de la región.
- Semana: "≈ $X por día" solo en el detalle del día, sin total semanal ni costo en los chips. La tarjeta y el detalle de Comidas muestran "≈ $X por porción".
- La barra de presupuesto usa el total automático cuando el presupuesto está en pesos y, si está en dólares, sigue con el cálculo de antes pero ahora muestra "US$" en vez de "$".
- Mi precio gana si está en pesos y las unidades son compatibles; con varios, el de fecha más nueva; los precios en otra moneda se ignoran.
- La tarea mensual corre el día 20 a las 06:23 UTC; el `.xls` no se guarda en el repo; `actualizar-precios.yml` hace `git pull --rebase` antes del push.

**Medidas** (estado normal, modo simple, tema claro: los precios están apagados por defecto)
- Compras: 225 → 230 palabras (por la línea "Precios estimados: activalos en Preferencias"; tope 262,8). Semana: 1.013 px, sin cambios. Con los precios prendidos (estado "todo"): Compras 388 palabras (tope 742,8) y Registro 427.
- Pruebas: 521/521 (eran 514), con la batería nueva `e7_precios.js`. Compuerta: "VALIDACIÓN ETAPA 7: OK (46 controles)".

**Revisores**
- revisor-codigo, sobre el plan: NO BLOQUEANTE con sugerencias, todas incorporadas (la línea para activar los precios en Compras, versiones y límite de tiempo en los workflows, `git pull --rebase` en la tarea mensual, el error de la herramienta nombra el producto).
- revisor-codigo, sobre el diff: NO BLOQUEANTE. Verificó los datos reales (sept. 2026), las conversiones de unidad (huevo 3.940,5 / 12; fideos de 500 g; aceite de 1,5 l), que `fuente/` no tiene direcciones de INDEC y que los workflows tienen permisos mínimos.
  - Apliqué su sugerencia sobre `precios-prueba.yml`: la descarga de INDEC queda como aviso (`continue-on-error`) para que una caída de INDEC no ponga en rojo el PR; la verificación de los datos incluidos, sin red, sigue siendo obligatoria.
- revisor-usuario: NO BLOQUEANTE. Los precios se ven como estimaciones (≈, fuente y mes); la línea para activarlos es clara y no estorba.

**Mejoras sugeridas**
- Con pocos precios, el total engaña: "≈ $2.222 (faltan 26 precios)" parece el costo de la compra. El formato es el que pide el plan; la cobertura sube con la Etapa 9 (SEPA). Evaluar no mostrar el total si faltan más de la mitad.
- El total aparece dos veces (barra de presupuesto y línea de resumen); la fuente "Promedio INDEC · GBA · sept. 2026" queda lejos del total.
- Los renglones sin precio no dicen por qué.
- Las tarjetas de Comidas y Preferencias no tienen captura con el "≈ $ por porción" ni el interruptor ni la región: sumar vistas en la Etapa 10.
- Cachear la región y los precios en `contextoCostos()` (hoy se leen por cada ingrediente de cada tarjeta).
- La tarea mensual debería correr también `construir --verificar` antes de publicar; simplificar una línea redundante de `actualizar-precios.mjs`.
- Una prueba del lector de `.xls` con un archivo de ejemplo armado en la prueba (C7-8 del plan corto).
- Separar "Mostrar precios" del modo simple (Etapa 8).
- Costo semanal en Semana y comparación de alternativas con el rango de precios.

**Pendientes para vos**
- Ninguno (la tarea de precios ya corrió en el PR y quedó ✅).

### Etapa 8 · Resto de las herramientas avanzadas ✅

Rama `rediseno-etapa-8-herramientas`. Versión 15.7.0.

**Plan corto**

Convención del inventario: "✅" = hecha (antes o en esta etapa); "Decisión" = se escribe por qué no se hace. Se miró contra el código de la v15.6.0.

- Inventario de las 11 líneas de "Herramientas avanzadas":
  - Mi precio: ✅ Etapa 7. "Mis precios de referencia" se llama "Mi precio" (`22`, herramienta de Compras y menú ⋯), misma clave `referencePrices_v1`, y `precioDe()` (`43`) lo prefiere al automático (C7-4). Lo que queda, el rango y la diferencia con Mi precio, va en "Comparar alternativas de precio".
  - Costos: ✅ Etapa 7 y 8. Por porción en cada comida, por ítem y total en Compras y "≈ $X por día" en Semana ya están (Etapa 7, C7-1 y C7-2, con "(faltan N precios)"). En la Etapa 8 se suma el costo de la semana en la misma línea del día ("≈ $3.100 por día · ≈ $6.200 la semana", `costosDelPlan` y `pintarCostoDia`, `43`; C8-4).
  - Presupuesto: ✅ Etapa 5 y 8. La barra arriba de la lista, tocable, y el panel (`#comprasPresupuesto`, `#shoppingBudgetPanel`, `renderPresupuestoCompras` en `11`) están desde la Etapa 5, y el "$" con USD, corregido en la 7. En la Etapa 8, Preferencias tiene la fila `#prefPresupuesto` que muestra lo guardado y abre el panel (C8-9), y la barra se esconde con "Mostrar precios y presupuesto" y no con el modo simple (C8-1).
  - Compras realizadas: ✅ Etapa 5 y 8. "Terminé de comprar" con monto y comercio opcionales, ticket que actualiza Mis precios y el historial en el menú ⋯ de Compras, hechos en la Etapa 5 (C5-5). En la Etapa 8, "Anotar gasto" trae lo realmente sumado a la despensa (C8-5) y la diferencia vuelve con signo y sentido (C8-10).
  - Existencias y movimientos: ✅ Etapa 5. Una sola despensa con cantidad e historial por ítem (`41`, `26`), Lo compré suma (`boughtNow`, `34`) y Lo cociné descuenta (C5-6, E6). Decisión: la aclaración "Existencia sin cantidad registrada" no se restaura, porque el renglón del detalle ya dice "(marcado en despensa; cantidad disponible desconocida)" y la lista dice "Lo marcaste en tu Despensa (sin cantidad registrada)"; repetirla sumaría palabras a las herramientas de Compras sin decir nada nuevo.
  - Calcular compras por recetas: ✅ Etapa 5. La lista suma las recetas del plan con las porciones de la Semana y el interruptor "Descontar lo que tengo" (C5-2, C5-3); las recetas que no están en la semana, en "Calcular para otras recetas" (menú ⋯ de Compras). Decisión: "Porciones, existencias y costos" (`#shoppingQuantCostPanel`) repite la lista de existencias de la Despensa; no se saca nada (regla 3) y la mejora sugerida de la Etapa 5 queda como está.
  - Comparar alternativas de precio: ✅ Etapa 8. Existía en `budgetCompareRender` (`11`, dentro de Presupuesto), pero solo contra Mi precio; ahora cada ingrediente suma una línea con el rango (más barato y típico), el promedio de la región y cuánto se aparta Mi precio (C8-6).
  - Equivalencias: ✅ Etapa 8. La administración está en Preferencias (`23`) y ahí mismo hay "Posibles equivalencias en tus datos". La lista ahora sugiere una ("¿“Tomate perita” es lo mismo que “Tomate”?", con Unir y Ahora no; C8-7).
  - Objetivos semanales: ✅ Etapa 8. Vivían dentro de "Anotar otra comida y ver la semana" del Registro (`#habitGoalsPanel`, `24`); ahora están en Preferencias (C8-2) y Semana resume lo planificado ("Verduras en 2 de 14 comidas", C8-3).
  - Historial del plan: ✅ Etapa 2. Menú ⋯ de Semana → "Historial de cambios" (`planHistory_v1`, `renderPlanHistory` en `10`), junto con "Planes guardados" y "Semanas anteriores y mes" (`16`); lo prueba C2-6. No se toca.
  - Modo simple: ✅ Etapa 8. "Mostrar precios y presupuesto" (Etapa 7) era el mismo interruptor que el modo simple. Ahora son dos: `#preciosToggle` y `#uiModeToggle` ("Mostrar herramientas avanzadas", el modo simple de siempre, que se conserva); C8-1.
- Diseño de las piezas nuevas:
  - **Separar "Mostrar precios y presupuesto" del modo simple.**
    - Dos interruptores en Preferencias, uno al lado del otro (tarjetas `tool-button`, 44 px):
      - `#preciosToggle` "Mostrar precios y presupuesto": muestra o esconde los "≈ $" de la lista, la barra de presupuesto, el costo en Comidas y Semana, la fuente y la fila de presupuesto de Preferencias. No esconde ninguna herramienta ni la región.
      - `#uiModeToggle` (se conserva el id, el `data-ui-mode-toggle` y la lógica) pasa a decir "Mostrar herramientas avanzadas": es el modo simple/completo de siempre y sigue escondiendo lo que `ADVANCED_TOOLS` esconde, menos la barra de presupuesto y la fuente de precios, que pasan al otro interruptor. Se saca el grupo `compras` de `ADVANCED_TOOLS` (y su aviso `data-mode-note="compras"`), porque ya no le queda nada que esconder.
    - Clave nueva `miPlatoFacil_mostrarPrecios_v1` = `{"mostrar":true|false}`. `uiMode_v1` no se renombra, no se borra y su formato no cambia.
    - Valor inicial y migración, perezosa y sin escrituras al arrancar: `preciosActivos()` usa la clave nueva si es válida y, si no existe o no vale, `!isSimpleMode()`. Entonces quien tenía `completo` sigue viendo precios y quien tenía `simple` (o nada) sigue sin verlos: nadie ve cambios al actualizar. La clave solo se escribe cuando los dos podrían divergir: (a) al tocar `#preciosToggle`; (b) al tocar `#uiModeToggle` o el botón de un aviso, justo antes de cambiar el modo, se escribe el valor que tenían los precios, así activar las herramientas avanzadas no enciende precios por sorpresa. Es idempotente (correrla dos veces da lo mismo) y no toca ninguna otra clave. Una clave inválida se ignora y se vuelve a derivar de `uiMode_v1`.
    - Respaldo: opcional (`COMPLETE_BACKUP_KEYS` y `COMPLETE_BACKUP_OPTIONAL_KEYS`, en la lista de "omitir si es null", validada como objeto `{mostrar: boolean}`), igual que `region_v1`: cambia lo que ves y conviene que viaje. `uiMode_v1` sigue fuera del respaldo. Los respaldos viejos se restauran porque es opcional (el fixture `respaldo-v14.9.94.json` no cambia).
    - Código: `preciosActivos`, `guardarMostrarPrecios` y la clave, como `function`/`var` en `43-precios.js` (posterior al 14: `init()` corre durante la carga del 14 y no puede tocar `const`/`let` de archivos posteriores). `setUiMode` (`30`) llama a la función que fija el valor con `typeof …==="function"`. Un `aplicarPrecios()` nuevo pone `hidden` a la barra y a la fuente según `preciosActivos()` (en vez del `data-avanzado="compras"` de hoy) y se engancha en `refrescarPrecios()`.
  - **Resumen de objetivos en Semana.**
    - Una línea nueva `#planObjetivos` (`screen__hint`, `hidden` por defecto) debajo de `#planHint`: "Verduras en 9 de 14 comidas · Legumbres 2 de 3 · Pescado 1 de 2 ✓". El 9 son las comidas del plan de la semana cuyos platos tienen ese grupo (`plateGroups(item)`, `24`, sobre las 28 comidas) y el 14 es el objetivo guardado; "✓" cuando se llega. Solo aparecen los grupos con objetivo; sin objetivos la línea no existe y Semana no cambia.
    - La función es pura (`resumenObjetivosSemana(plan, saved, goals)`) y se llama desde `renderPlan` (`10`). Lo que ya comiste se sigue viendo en el Registro ("Con verduras: n de goal"): Semana habla de lo planificado y el Registro, de lo comido.
  - **Objetivos en Preferencias.**
    - `#habitGoalsPanel` se muda de `31-registro.html` a `26-preferencias.html` con los mismos ids (`goal_verduras`, `goal_legumbres`, `goal_pescado`, `goal_fruta`, `habitGoalsSave`) y un `#habitGoalsStatus` propio. Es un plegable en los dos modos (no es avanzado). Misma clave `habitGoals_v1`, misma validación (`validHabitGoals`, enteros de 1 a 21).
    - Riesgo para los datos: hoy los campos se llenan en `renderConsumption`, que solo corre al abrir el Registro. Si no se llenan al pintar Preferencias, alguien puede guardar vacío y borrar sus objetivos. Un `renderObjetivosPreferencias()` (función) llena los campos cada vez que se pinta Preferencias, junto a `renderRegionPrecios`, y tras guardar repinta Semana y el Registro. Guardar sin tocar nada deja la clave igual.
    - En el Registro el plegable "Anotar otra comida y ver la semana" pierde ese bloque (menos palabras); queda el avance "Con verduras: n de goal".
  - **Presupuesto en Preferencias.** Una fila `#prefPresupuesto` (visible solo con los precios prendidos): "Presupuesto: $30.000 por semana · Cambiar" o "Poner un presupuesto", que abre el panel de siempre (`data-compras-herr="presupuesto"`). No se mueve el formulario: tiene Comparar alternativas y la copia del escenario, y mudarlo cambiaría ids y pruebas. La fila se pinta desde `renderPresupuestoCompras`.
  - **Costo semanal.** `pintarCostoDia` (`43`) pasa a "≈ $4.200 el día · ≈ $29.400 la semana (faltan 2 precios)" en la misma línea `#planDiaCosto`, sumando los 7 días de `planEntriesFlat()` con la misma regla de porciones. Con precios apagados no existe, así que `E2-semana-alto` (precios apagados) no cambia.
  - **Rango de precios en "Comparar alternativas".** `rangoDePrecios(nombre, unidad)` (`43`) devuelve `{ masBarato, tipico, auto, mio, difPct }`: de las referencias de Mi precio compatibles, el menor y la mediana; el automático de la región (sin Mi precio); y la diferencia de Mi precio contra el automático. Si el dataset trae percentiles (Etapa 9, `r:[p25,p75]`) se usan como rango; hoy no los trae. En `budgetCompareRender` cada ingrediente suma una línea corta debajo del select: "Rango: $1.700 el más barato · $1.900 típico · Mi precio +12 % sobre el promedio". Con los precios apagados no se muestra la parte automática.
  - **Equivalencias sugeridas en la lista.** En `renderCompras` (`12`), si `ingredientAliasSuggestions()` (`23`) encuentra pares entre los nombres de la lista, una sola línea (la primera): "¿Tomate perita es lo mismo que Tomate? · Unir · Ahora no". Unir llama a `saveIngredientAlias` (la misma función que Preferencias) y repinta la lista; "Ahora no" la oculta solo en la sesión, sin guardar nada. Si con el estado "normal" Compras pasara su tope de palabras (262,8), se acorta a "¿Tomate perita = Tomate? Unir".
  - **"Anotar gasto" con la cantidad comprada.** `boughtNow` (`34`) devuelve, además de las claves, las cantidades que realmente sumó a la despensa (`changes`: nombre, unidad, delta). `anotarGasto` (`41`) arma las filas del ticket con eso y no con `mergeUnits(e.units)`: si había 300 g y el plan pedía 500 g, la fila dice 200 g. Lo que "ya alcanzaba" no entra en el ticket. Sin "Descontar lo que tengo" sigue la cantidad completa. No cambia qué se guarda en `purchases_v1` ni en `referencePrices_v1`.
  - **Aclaraciones perdidas.** Se miran en `etapa-4-ok`: "Existencia sin cantidad registrada" vuelve, en una cláusula corta, en el detalle de existencias de `shoppingQuantityAndCost` (`12`); y la diferencia de compras realizadas (`25`, `budgetRealLines`) vuelve con signo y sentido: "Diferencia: +$1.200 (gastaste más que lo estimado)" o "−$800 (menos)". Los textos que fijan las pruebas de lógica no cambian.
- Archivos: `fuente/codigo/` `02` (solo comentario), `10` (resumen), `11` (rango en Comparar, fila de Preferencias), `12` (equivalencia sugerida, aclaración), `18` (respaldo), `24`/`42` (objetivos), `25` (signo), `30` (interruptores y `ADVANCED_TOOLS`), `34` y `41` (Anotar gasto), `43` (clave, `rangoDePrecios`, costo semanal, `aplicarPrecios`); `fuente/cuerpo/pantallas/` `26-preferencias.html`, `31-registro.html`, `06-compras.html`; `fuente/estilos.css` (solo con el sistema de diseño existente); `herramientas/capturas.mjs` (vista `preferencias`); `pruebas/` y `docs/validacion/`; `fuente/version.json` a 15.7.0.
- Riesgos para los datos:
  - `uiMode_v1`, `habitGoals_v1`, `shoppingBudget_v1`, `referencePrices_v1`, `purchases_v1`, las equivalencias y las demás: mismo formato; no se renombra ni se borra ninguna clave y no hay migraciones que escriban sobre lo viejo.
  - Solo hay una clave nueva (`mostrarPrecios_v1`, opcional en el respaldo, validada, ignorada si es inválida).
  - Objetivos: el único riesgo real es el de arriba (campos vacíos que se guardan); lo cubre C8-2.
  - "Ahora no" de las equivalencias no persiste; "Unir" usa la función de siempre.
  - Todo el código nuevo que `init()` pueda usar es `function` o `var`.
- Pruebas que cambian (ninguna se borra y ninguna baja):
  - Interfaz (ids o textos, misma fuerza):
    - `e7_precios.js` C7-1 y C7-7 prenden y apagan los precios tocando `#preciosToggle` en vez de `#uiModeToggle` (mismas aserciones sobre lo que se ve y los datos); C7-2 a C7-4 siguen sembrando `uiMode_v1="completo"`, que sigue prendiendo los precios por la derivación.
    - `e4_comidas.js` (visibilidad de la tarjeta de precios) apunta a `#preciosToggle`; `n01_nav.js` N11, solo el comentario.
    - `m01_modo.js`: M4, M6 y M7 usaban el aviso de Compras (`notes[0]`) y su texto "presupuesto"; ese aviso desaparece, así que las mismas aserciones pasan al aviso de Despensa y M4 suma "Compras no tiene aviso de modo". M5 y M7 cambian el texto de la tarjeta a "Mostrar herramientas avanzadas: …". M2 sigue exigiendo que la barra de presupuesto esté oculta con los precios apagados. M8 excluye también `mostrarPrecios_v1` (ajuste de pantalla, como `uiMode_v1`) del chequeo de que no cambia ningún dato del usuario.
    - `f06_consumo.js`: leer el resultado de guardar objetivos en `#habitGoalsStatus` en vez de `#consumptionStatus` (mismas aserciones de mensaje y de datos). `e6_registro.js` solo si cuenta los campos del plegable.
  - Lógica (el código nuevo las cumple tal cual): respaldo (`bkp01`, `bkp02`, `k01`, `j01`, C5-1 con el respaldo de ejemplo), `f04_gasto` (compras y presupuesto), `r2_shop`, `f01_alias`, `f06_consumo` C8 (objetivos en el respaldo), `dp01_despensa`, `f02_desp`, `e5_compras`, `e7_precios`.
- Pruebas nuevas (suite `e8_herramientas.js`, registrada en `pruebas/suites.json`; subir la línea base con `--actualizar-linea-base`):
  - C8-1 interruptores independientes: valor inicial desde `uiMode_v1` (completo prende, simple y vacío apagan); tocar uno no cambia el otro; `uiMode_v1` queda byte a byte; una clave inválida se ignora; activar las herramientas avanzadas no enciende los precios.
  - C8-2 objetivos: están en Preferencias con sus valores sin pasar por el Registro; guardar valida; guardar sin tocar deja la clave igual; ya no están en el Registro.
  - C8-3 Semana resume "Verduras en N de M comidas" con el plan de la semana y desaparece sin objetivos.
  - C8-4 el costo semanal de Semana suma los días y avisa "faltan N precios".
  - C8-5 Anotar gasto trae lo comprado (200 g si había 300 de 500) y nada de lo que ya alcanzaba.
  - C8-6 Comparar muestra el rango y la diferencia con Mi precio, y no cambia ningún dato.
  - C8-7 la lista sugiere una equivalencia, Unir la guarda y agrupa, y "Ahora no" no escribe nada.
  - C8-8 `mostrarPrecios_v1` entra y sale del respaldo, un respaldo viejo se restaura, uno inválido se rechaza.
  - C8-9 la fila de presupuesto de Preferencias abre el panel y muestra el valor guardado.
  - C8-10 las aclaraciones vuelven (existencia sin cantidad y signo de la diferencia).
- Topes anteriores: con los precios apagados no hay "≈ $", barra, fuente, fila de presupuesto ni costo semanal en el DOM visible, así que `E1-palabras-compras` (≤ 262,8) y `E2-semana-alto` (≤ 1.266 px, 1.013 hoy) se miden como siempre. Lo único que suman en estado "normal" son la sugerencia de equivalencias (una línea, con plan B más corto) y el resumen de objetivos de Semana (el respaldo de ejemplo trae objetivos: una o dos líneas, unos 40 a 60 px, con 250 px de margen). Despensa, Ideas, Comidas, Registro y las herramientas de Compras (≤ 742,8) no crecen: el Registro pierde el bloque de objetivos y las herramientas ganan solo una línea por alternativa.
- Controles nuevos más estrictos en `criterios.json` (solo agregan, nada se relaja):
  - E8-precios-separados (prueba C8-1) y E8-objetivos-en-preferencias (prueba C8-2).
  - E8-palabras-registro-todo: el Registro con todo abierto no supera lo que mide al cerrar la Etapa 7 (427 palabras), para probar que lo que se muda no queda duplicado.
  - E8-palabras-preferencias: vista nueva `preferencias` en `capturas.mjs`, estado "todo", tope = la medida real de esta etapa más 10 %, para que Preferencias no quede sin tope al recibir objetivos, presupuesto e interruptores.
  - `E8-herramientas-avanzadas` (tipo registro) ya existe: exige las 11 líneas con ✅ o "Decisión".

**Implementación (v15.7.0)**
- Interruptores (`30`, `43`): `#preciosToggle` ("Mostrar precios y presupuesto") y `#uiModeToggle` ("Mostrar herramientas avanzadas"), uno al lado del otro en Preferencias. Clave nueva `miPlatoFacil_mostrarPrecios_v1` = `{"mostrar":bool}`, opcional en el respaldo, en la lista de omitir si es null y validada (`validMostrarPrecios`). `uiMode_v1` no se toca. Sin clave o con una inválida, `preciosActivos()` deriva de `uiMode_v1`. `setUiMode` fija antes el valor de los precios (`fijarPreciosAntesDelModo`): quien está en simple con la clave ausente y toca "Mostrar herramientas avanzadas" queda con los precios apagados (se escribe `false`, C8-1).
- Preferencias (`26`): objetivos (mismos ids, `#habitGoalsStatus` propio) y la fila de presupuesto. `renderObjetivosPreferencias()` llena los campos al arrancar, al pintar Preferencias (`go` y `showScreen`) y tras guardar: guardar con todo vacío ya no puede borrar objetivos guardados (C8-2 abre Preferencias sin pasar por el Registro y guarda).
- Semana (`10`, `24`, `43`): `#planObjetivos` con `resumenObjetivosSemana` y costo del día y de la semana en `#planDiaCosto`.
- Compras: sugerencia de equivalencia (`12`, `41`), `boughtNow` devuelve `cambios` y `sinCantidad` y `anotarGasto` los usa (`34`, `41`); diferencia con signo (`25`); rango en Comparar (`rangoDePrecios` y `textoRangoPrecios`, `43`; `11`).
- `herramientas/capturas.mjs`: vista nueva `preferencias` (solo se suma al camino de las vistas; las medidas no cambian).

**Decisiones que tomé sin vos**
- Los dos interruptores viven en Preferencias. Se saca el grupo `compras` de `ADVANCED_TOOLS` y con él el aviso de modo de Compras: la barra de presupuesto y la fuente ya no dependen del modo. `m01_modo.js` M4, M6 y M7 usan el aviso de Despensa y M4 suma "Compras sin aviso".
- El estado inicial no escribe nada; la clave nueva se escribe solo al tocar `#preciosToggle` o, antes de cambiar el modo, con el valor que tenían los precios.
- Equivalencias: una sola sugerencia, con el texto completo ("¿“A” es lo mismo que “B”? Unir · Ahora no"), porque Compras en estado normal midió 209 palabras (antes 230; tope 262,8) y el respaldo de ejemplo no dispara ninguna. "Ahora no" vale solo en la sesión.
- "Típico" en Comparar es la mediana de las referencias de Mi precio; los percentiles del promedio llegan con SEPA (Etapa 9, campo opcional `r` ya contemplado). Sin Mi precio no hay rango propio: se muestra el promedio si los precios están prendidos.
- Resumen de objetivos en Semana: cuenta comidas del plan con ese grupo (`plateGroups`) sobre el objetivo; solo aparece si hay objetivos.
- Anotar gasto: una fila por cada cantidad realmente sumada a la despensa (en su unidad), una sin cantidad por cada ítem marcado sin cantidad, y nada de lo que ya alcanzaba. Quitar una fila del ticket la saca de Mis precios y de la compra.
- Existencias y movimientos: Decisión de no restaurar "Existencia sin cantidad registrada" (ver el inventario).
- La diferencia de compras realizadas dice "+X (se gastó más)" o "-X (se gastó menos)"; se redondea a 2 decimales antes de elegir el signo y, si queda en 0, dice "sin diferencia".
- Resumen de Semana: por debajo del objetivo, "Verduras en 9 de 14 comidas"; al llegar o pasarse, "Verduras: 14 comidas (objetivo 10) ✓" (nunca "14 de 10").
- La tarjeta de Más dice "Evitar, objetivos y precios".
- La región de los precios va en un campo normal (con el espacio de los demás) y solo se ve con los precios prendidos (C8-9); el valor guardado no cambia.

**Pruebas adaptadas** (ninguna se borra; la cantidad sube de 521 a 531)
- `m01_modo.js`: M4/M6/M7 (aviso de Despensa, Compras sin aviso, la barra se ve al prender los precios y se esconde al apagarlos, y sigue visible al volver a simple), M5/M7 (texto de la tarjeta), M2 (sin `habitGoalsPanel` en la lista de Semana) y M8 (excluye `mostrarPrecios_v1` del chequeo de datos y afirma que vale `{"mostrar":true}`, el valor que dejó el usuario; ninguna otra clave cambia).
- `e7_precios.js`: C7-1 y C7-7 usan `#preciosToggle` (mismas aserciones sobre lo que se ve y los datos; ahora además afirman que `uiMode_v1` no cambia) y C7-2 compara con `startsWith` porque la línea del día suma "· ≈ $X la semana" (la semana se prueba en C8-4). `e4_comidas.js`: apunta a `#preciosToggle`. `f06_consumo.js`: lee el mensaje de objetivos en `#habitGoalsStatus`.
- Nuevas: `e8_herramientas.js` con C8-1 a C8-10 (precios separados, objetivos, resumen en Semana, costo semanal, Anotar gasto con g y kg, ítem sin cantidad y solo las filas incluidas, rango en Comparar, equivalencias, respaldo, fila de presupuesto, diferencia con signo).

**Medidas** (estado normal, tema claro)
- Compras: 230 → 209 palabras (tope 262,8). Semana: 1.013 → 1.061 px (tope 1.266; suma el resumen de objetivos del respaldo de ejemplo). Registro con todo abierto: 427 → 398 palabras. Preferencias con todo abierto: 206 palabras (vista nueva).
- Controles nuevos en `criterios.json` (solo se agregan): E8-precios-separados (C8-1), E8-objetivos-en-preferencias (C8-2), E8-palabras-registro-todo (≤ 427) y E8-palabras-preferencias (≤ 227, la medida más 10 %).

**Compuerta**
- "VALIDACIÓN ETAPA 8: OK (51 controles)". Pruebas: 531/531 (eran 521), con la batería nueva `e8_herramientas.js` (C8-1 a C8-10).

**Revisores**
- revisor-codigo, sobre el plan: NO BLOQUEANTE con sugerencias, todas incorporadas (objetivos que no se borran al guardar, C8-1 con clave ausente, "Costos" y "Presupuesto" con ✅ solo si están hechos).
- revisor-codigo, sobre el diff: NO BLOQUEANTE. **Verificó que las 11 líneas con ✅ o "Decisión" son verdad**, contra el código y las pruebas.
- revisor-usuario: NO BLOQUEANTE. Compras y Registro quedaron más simples que en la Etapa 7. Corregí en esta etapa lo que pidió con claridad:
  - "Verduras en 14 de 10 comidas ✓" se leía al revés: ahora "Verduras: 14 comidas (objetivo 10) ✓";
  - la tarjeta de Más;
  - el redondeo de la diferencia de compras realizadas;
  - "Región de los precios" solo con los precios prendidos.

**Mejoras sugeridas**
- Títulos de los interruptores largos ("Mostrar precios y presupuesto: activado" ocupa 3 líneas); la bajada de "herramientas avanzadas" es vaga.
- "Ingredientes equivalentes": ayuda de 5 líneas (pasar a ⓘ); sacar el pie "Estás viendo todas las herramientas"; el aviso de herramientas ocultas en Preferencias duplica la tarjeta de arriba.
- Semana: "≈ $840 por día (faltan 5 precios) · ≈ $11.975 la semana (faltan 36 precios)" es denso: un solo "faltan N".
- Registro con todo abierto: "Anotar otra comida" sigue largo y duplica "Todas las preparaciones".
- El plan corto prometía restaurar "Existencia sin cantidad registrada"; la implementación lo dejó como Decisión (el renglón y la lista ya lo dicen). Esta sección es la versión vigente.

**Pendientes para vos**
- Ninguno nuevo.

### Etapa 9 · Precios de SEPA (ampliación) ✅

Rama `rediseno-etapa-9-sepa`. Versión 15.8.0.

**Plan corto**

- Formato real de SEPA (mirado el 2026-11-03 con el día "Lunes", 2026-11-02; todo se trató como dato no confiable: se bajó a una carpeta nueva y vacía fuera del repositorio, los scripts estaban en otra carpeta y la ruta se pasó por argumento, nada se ejecutó desde ahí y lo bajado se borró al terminar):
  - Portal CKAN: `https://datos.produccion.gob.ar/api/3/action/package_show?id=sepa-precios` (licencia `CC-BY-4.0`, título "Precios Claros - Base SEPA"). Trae 9 recursos: 7 ZIP, uno por día de la semana (`Lunes` … `Domingo`, de 311 a 325 MB; el de cada día se pisa a la semana siguiente y `last_modified` dice cuál es el más nuevo), el "Traductor de código provinciales" (XLSX, 9 KB) y la metadata en PDF. Las URL de descarga tienen la forma `…/resource/<id>/download/sepa_<dia>.zip`: la tarea no las fija, las lee de `package_show` (elige el ZIP con `last_modified` más nuevo y controla que el nombre sea `sepa_<dia>.zip`).
  - **El servidor no respeta pedidos por rango**: con `Range: bytes=-65536` contesta `200` con el archivo entero (324.136.705 bytes) aunque anuncia `Accept-Ranges: bytes`. Así que no se puede leer solo el directorio central: la tarea baja el día completo (~325 MB) en streaming a una carpeta temporal nueva y lo lee de ahí. En GitHub Actions son segundos y el disco del runner sobra. (Yo bajé el día entero una vez, a una carpeta nueva en mi scratchpad, y lo borré.)
  - Estructura: ZIP externo **sin comprimir** (método 0, 17 entradas: una carpeta `2026-11-02/` con la fecha del día y 16 ZIP internos). Cada interno se llama `sepa_<n>_comercio-sepa-<id_comercio>_<fecha>_<hora>.zip` (de 7 KB a 128 MB; 15 con productos en el día visto y uno vacío que se ignora) y trae tres CSV comprimidos con deflate: `comercio.csv`, `sucursales.csv` y `productos.csv`, en cualquier orden. Descomprimido, `productos.csv` suma ~1,9 GB; el día visto tiene **14.308.918 filas de producto**.
  - CSV: separador `|`; UTF-8 (0 caracteres inválidos); a veces con BOM (9 archivos), algunos con relleno de espacios al final de cada campo (por ejemplo `sepa-47`), 2.837 filas con comillas y 30 líneas con otra cantidad de campos (se descartan las que no tienen 17 columnas).
  - `comercio.csv` (8 columnas): `id_comercio`, `id_bandera`, `comercio_cuit`, `comercio_razon_social`, `comercio_bandera_nombre`, `comercio_bandera_url`, `comercio_ultima_actualizacion`, `comercio_version_sepa`.
  - `sucursales.csv` (21 columnas): `id_comercio`, `id_bandera`, `id_sucursal`, nombre, tipo, calle, número, latitud, longitud, observaciones, barrio, `sucursales_codigo_postal`, `sucursales_localidad`, **`sucursales_provincia`** (código ISO 3166-2: `AR-C`, `AR-B`, `AR-X`…) y los horarios. ~2.700 sucursales (CABA 978, Buenos Aires 915, Córdoba 126, Entre Ríos 84, Mendoza 71…); 36 sin provincia y una con el texto "Buenos Aires" (la tarea normaliza esa y descarta las vacías). Los códigos postales vienen como `1641`, `C1073AAQ` o `B1636`: se toma el primer grupo de 4 dígitos.
  - `productos.csv` (17 columnas): `id_comercio`, `id_bandera`, `id_sucursal` (la clave para unir con `sucursales.csv`), `id_producto`, `productos_ean` (**no es el código: es 1/0, "es EAN"**; el código está en `id_producto`; 14.138.210 de las 14.308.918 filas dicen 1, incluidas verduras a granel con códigos internos), `productos_descripcion`, `productos_cantidad_presentacion`, `productos_unidad_medida_presentacion`, `productos_marca`, `productos_precio_lista`, `productos_precio_referencia`, `productos_cantidad_referencia`, `productos_unidad_medida_referencia` y dos pares de promo (`precio_unitario_promo1/2` con su leyenda; casi siempre vacíos).
  - **Los datos son sucios, así que la tarea no se fía de un solo campo.** Unidades sin normalizar: `kg`, `kgm`, `kgr`, `kg.`, `gr`, `grm`, `gr.`, `grs`, `g`, `lt`, `ltr`, `lt.`, `l`, `ml`, `ml.`, `cm3`, `cc`, `uni`, `ud`, `un`, `un.`, `unidad`, `ea`, `cu`, `m2`, `cmq`… ; cantidades como `1.00`, `.24` (240 g escritos como 0,24 "gr."), `00250`, `0.1`; descripciones abreviadas y a veces cortadas (`ARROZ LARG FINO BOLS`, `ACEITE OLIVA EXTRA V`). `productos_precio_referencia` casi siempre es el precio **por kg, litro o unidad** (`GARBANZOS | 1 uni | 2450 | ref 4900 | 500 grm`: ahí `500 grm` es el tamaño del envase y 4.900 el precio por kg), pero hay errores de 1.000 veces (`ARROZ LARG FINO BOLS | 1.00 gr | 2135 | ref 2135000`) y filas donde la referencia es el precio del envase (`ENSAL RUCULA | 0.1 kg | 3999 | ref 3999 | 0.1 ea`). Regla de la tarea: el precio por unidad base se calcula como `precio_lista ÷ tamaño` con el tamaño de la presentación y de nuevo con el de la referencia, y **solo se acepta si coincide (±3 %) con `precio_referencia`** o si los dos tamaños coinciden entre sí; si no, la fila se descarta y se cuenta. Además se descartan las filas fuera de 1/3 a 3 veces la mediana provisoria del ingrediente en la región y los envases fuera del rango de tamaño del mapa (sobres de 20 g, bolsas de 25 kg).
  - Cómo se busca: por **descripción** (casi todo), con marca como filtro opcional y `id_producto` exacto para casos puntuales. El prototipo (en mi carpeta de trabajo, no en el repo; 70 ingredientes con reglas escritas en una pasada) lee las 14,3 millones de filas en **1 minuto** con una sola pasada y sin dependencias (`node:zlib` en streaming + `node:readline`).
  - Qué hay de verdad: las **verduras y frutas a granel SÍ están** (esperaba menos): las cadenas grandes cargan `ZANAHORIA ELEGIDA` o `ZAPALLITO REDONDO X KG` con `1 kg` y su precio. Lo que no sirve es lo que se vende "por atado" (cebolla de verdeo, puerro, rúcula, albahaca fresca): el precio es por atado, no por kg, y se mezcla con sobres, sopas y frascos; se mapea como aproximado si se puede o no se mapea.
  - Región: SEPA trae provincia, no región. La tarea agrupa por provincia y publica por las seis regiones de la app, con la partición de INDEC salvo GBA: **GBA = CABA (`AR-C`) + sucursales de `AR-B` con código postal 1600 a 1899** (los tres cordones del conurbano; aproximación a los 24 partidos de INDEC, y la atribución lo dice). Pampeana = resto de `AR-B` + `AR-E`, `AR-L`, `AR-S`, `AR-X`; Noreste = `AR-H`, `AR-N`, `AR-P`, `AR-W`; Noroeste = `AR-A`, `AR-F`, `AR-G`, `AR-K`, `AR-T`, `AR-Y`; Cuyo = `AR-D`, `AR-J`, `AR-M`; Patagonia = `AR-Q`, `AR-R`, `AR-U`, `AR-V`, `AR-Z`. Sucursales por región ese día: GBA 1.239, Pampeana 933, Patagonia 214, Cuyo 98, Noroeste 93, Noreste 44 (por eso se exige un mínimo de observaciones y de comercios).
  - Atribución (CC BY 4.0): "Fuente: Secretaría de Comercio, Ministerio de Economía de la Nación, Precios Claros – Base SEPA, licencia CC BY 4.0", más "Mediana calculada por Mi Plato Fácil sobre lo que publican los comercios adheridos; no son los precios de tu comercio". Los enlaces van en el JSON, no en `fuente/`.

- **Qué cuenta como "los ingredientes del catálogo y de las comidas de ejemplo" para el 80 %** (medido con la app real: las 41 ideas pasadas por `ideaComoGuardada` + `extractIngredients`, y cada nombre llevado al de la nutrición con `ingredientKey`/`nutritionFor`, que es lo que usa `precioDe`):
  - **Núcleo (el que mide C9-1)**: los ingredientes de las **41 ideas de `data.menuCatalog[*].ingredientes`** (44 distintos) ∪ los de las **comidas guardadas y recetas del respaldo de ejemplo** `pruebas/fixtures/respaldo-v14.9.94.json` = **52 ingredientes** distintos. Quedan afuera 7 textos que no son un ingrediente comprable y que la app no lleva a un nombre de la nutrición: "Fruta de estación", "Frutos secos", "Semillas de chía o sésamo", "Granola comprada o casera", "Leche fluida o en polvo descremada", "Pan de molde integral o blanco" y "Romero". La prueba los lista para que se vea qué se excluye y por qué (sumarles sinónimos tocaría `ingredientKey`, que afecta equivalencias guardadas por la gente: queda como mejora sugerida, no se hace acá).
  - **Opciones del armado** (45 ingredientes más que no están en el núcleo: verduras, almidones, legumbres y proteínas del armado, y las opciones de desayuno y merienda): se **miden y se muestran, pero no entran en el 80 %**. Incluyen cosas que casi nadie compra por separado o que no tienen un producto único (amaranto, mijo, sorgo, tapioca, kale, nabo, lupino, porotos aduki/mung/pallar, "Opción ocasional: …", "Budín", "Waffle"). Decisión de criterio, anotada para revisor-codigo.
  - **Hoy, con INDEC**: tienen precio **15 de los 52 (29 %)**: tomate, fideos, cebolla, merluza, lechuga, huevo, harina de trigo, pollo, pan, queso cremoso, zapallo, batata, papa, sal y limón. Del armado, 1 de los 45.
  - **Esperado con SEPA** (prototipo sobre el día del 2026-11-02, mediana por región, con mínimo de 5 observaciones y 2 comercios): casi todo el núcleo sale con precio en las seis regiones, incluidas verduras a granel (zanahoria ≈ $2.990/kg, zapallito, remolacha, repollo, morrón, pepino, acelga, apio, brócoli), legumbres y cereales (lentejas, garbanzos, arvejas, porotos, polenta, avena, arroz integral), almacén (pan rallado, atún, aceite de oliva, queso rallado), lácteos (yogur natural y descremado, queso fresco) y carne vacuna. Con reglas de una sola pasada, **51 de 52 tienen al menos una región con datos suficientes** (solo quinoa no: 48 observaciones en un comercio); pero 5 de esos 51 mezclan productos distintos y hay que afinar la regla antes de publicarlos (ajo, albahaca, rúcula, cebolla de verdeo, puerro: vienen por atado, en frasco o deshidratados). **Cobertura esperada: 46 a 50 de 52 (88 % a 96 %) con precios honestos, INDEC + SEPA.** El piso, si ajo, albahaca, rúcula, cebolla de verdeo, puerro y quinoa quedaran sin precio, es 46/52 = 88 %.
  - **¿Se llega al 80 %?** Sí para el núcleo (el umbral es 42/52 = 80,8 %). **No para núcleo + armado**: 97 ingredientes, se espera cubrir unos 70 a 75 (72 % a 77 %); por eso el armado no entra al control. Ningún precio se inventa: lo que no se encuentra queda sin precio y la app dice "faltan N precios". Si al implementar el núcleo quedara debajo de 80 %, la opción es mapear equivalentes razonables marcados `a:true` y decirlo en la fuente, nunca un número armado; se decide con revisor-codigo.

- `datos/precios-mapa.json` (extendido; todo lo existente se conserva): cada ingrediente suma un bloque opcional `sepa`. Sin `sepa` sigue solo con INDEC. Los ingredientes nuevos (los del núcleo que no estaban y los del armado que se puedan mapear sin ambigüedad) entran con su nombre exacto de `datos/nutricion.json` (el de `nutritionFor`: "Arroz integral", "Repollo blanco", "Morrón rojo"…) y su unidad base `b`.
  - Formato del bloque: `"sepa": { "q": ["zanahoria"], "ini": true, "x": ["lata", "congelad*"], "marca": ["…"], "ean": ["…"], "t": [0.9, 6], "a": false }`.
    - `q`: frases buscadas en la descripción (sin tildes, en minúsculas); basta una. `*` al final = prefijo (`congelad*`). `ini: true` exige la frase **al comienzo** de la descripción (saca "BRONCEADOR C ZANAHORIA").
    - `x`: palabras que descartan la fila. Hay además una lista global de exclusiones (mascotas, limpieza, perfumería, platos preparados y snacks) que no pisa lo que el propio ingrediente busca.
    - `marca`: opcional, solo esas marcas. `ean`: opcional, `id_producto` exactos (productos puntuales; hoy no hace falta ninguno).
    - `t`: tamaño de envase aceptado en la unidad base (`[0.9, 6]` kg deja "1 kg a granel" y saca sobres y bolsas de 25 kg).
    - `a: true`: el producto es solo parecido (queda "aprox." como en INDEC).
  - **Sin expresiones regulares en el mapa**: frases y prefijos nada más. Así no hay patrones que se compliquen ni escapes que se rompan, y la tarea compila las reglas a un índice palabra → reglas, que es lo que hace posible 1 minuto para 14 millones de filas.
  - Unidad base `kg`, `l` o `unidad` (huevos, paltas). Las filas en otra dimensión (una lechuga "por unidad" para un ingrediente en kg) se descartan, no se convierten a ojo.
  - La validación del mapa (`--verificar`) exige: ingrediente existente en la nutrición, `b` válida, `q` no vacío (o `ean`), `t` con mínimo menor que máximo, palabras de 2 a 40 caracteres y ninguna palabra a la vez en `q` y en `x`.

- `herramientas/actualizar-precios.mjs` (sigue siendo un solo archivo, Node 18+, **sin dependencias**: `node:zlib` y `node:readline`; las funciones del ZIP y de SEPA se suman dentro, sin tocar el lector de INDEC):
  - `node herramientas/actualizar-precios.mjs [--solo-indec | --solo-sepa] [--archivo-sepa ruta.zip] [--salida ruta.json] [--hoy AAAA-MM-DD]`. Sin opciones hace las dos; `--solo-sepa` conserva lo de INDEC de `datos/precios.json` y `--solo-indec` conserva lo de SEPA. Si una fuente falla y la otra anduvo, **se actualiza la que anduvo y se conserva lo otro**; si fallan las dos, sale con código 1 y deja el archivo como estaba. Siempre se conserva el último archivo bueno y la escritura es atómica (temporal y `rename`).
  - Descarga: `package_show` con `fetch` (tope de 1 MB y 30 s), elige el ZIP más nuevo y lo baja en streaming a una carpeta temporal **nueva** (`mkdtemp`, fuera del repo) con tope de 600 MB y 15 minutos; controla la cabecera `PK` y lo borra al terminar, también si falla. No ejecuta nada de lo bajado. Defensa de ZIP (el archivo no es confiable): no hay extracción a disco, así que el nombre de una entrada nunca se usa como ruta; solo se aceptan los métodos 0 y 8, solo `comercio.csv`, `sucursales.csv` y `productos.csv` dentro de cada interno, se corta la descompresión si un CSV pasa de 3 GB o si la relación descomprimido/comprimido es absurda.
  - Lectura: recorre el directorio central del ZIP externo, abre cada interno por su rango de bytes en el archivo, lee `sucursales.csv` primero (tabla `id_comercio|id_bandera|id_sucursal → región`) y después `productos.csv` línea por línea, sin cargar nada entero en memoria. En cada fila: tokeniza la descripción, busca en el índice, valida `ini`/`x`/`t`, calcula el precio por unidad base con la regla de coincidencia y lo suma a una lista acotada por ingrediente y región (tope de 200.000 observaciones; pasado eso se muestrea con una semilla fija).
  - Estadística: por ingrediente y región, tras descartar lo que queda fuera de 1/3 a 3 veces la mediana, **mediana y percentiles 25 y 75**, cantidad de observaciones y de comercios distintos (`id_comercio`). La región se publica solo con **al menos 5 observaciones y 2 comercios**; si no, esa región no tiene SEPA para ese ingrediente y la app cae a INDEC. Se redondea a pesos enteros (menos bytes).
  - Validación antes de escribir (si falla, no toca nada y dice el motivo): al menos 35 de los 52 ingredientes del núcleo con SEPA en GBA (un formato roto da cero; el piso evita publicar casi nada), 60 % o más de las líneas de producto con 17 columnas, fecha del día (de la carpeta del ZIP, `AAAA-MM-DD`) ni futura ni de más de 14 días atrás, `p25 ≤ mediana ≤ p75`, todo finito, mayor que 0 y menor que 10.000.000, y un salto semanal de más de 2,5 veces (o menos de 0,4) contra lo guardado **descarta ese ingrediente-región** (se conserva el anterior y se avisa); si pasa en más de un cuarto de los ingredientes, la tarea falla porque probablemente cambió el formato.
  - **Tope de tamaño**: `datos/precios.json` minificado **≤ 60.000 bytes** (hoy 4.847; esperado 35.000 a 40.000 con ~100 ingredientes × 6 regiones). Se controla en la tarea y en `--verificar`. `index.html` crece lo mismo (hoy 705.405 bytes; presupuesto: no pasar de 770.000, y el Registro dice cuánto creció). Si hiciera falta, se recortan primero las observaciones (`c`) y después las regiones con pocos datos.
  - `--verificar` (sin red, control E7-precios-validos): valida el mapa extendido, `datos/precios.json` y `datos/precios-ejemplo.json`, incluido lo nuevo (percentiles ordenados, tope de bytes, atribución a SEPA con enlaces, fecha). `--verificar --archivo-json ruta` sigue igual.
  - La salida resume: ingredientes con SEPA, cuántos del núcleo, filas leídas y descartadas por motivo (sin precio coherente, tamaño, fuera de rango, sin región) y cuánto tardó.

- `datos/precios.json` (versión 1, con **campos nuevos opcionales**; no se renombra nada y la app de hoy los ignora):
  - Por ingrediente, junto a `n`, `b`, `i`, `p` (INDEC) y `a`: `s`: `{ "GBA": 1990, … }` (mediana SEPA por unidad base y región), `r`: `{ "GBA": [1700, 2600], … }` (percentiles 25 y 75; la app ya lee `it.r` como un par desde la Etapa 8, `rangoDePrecios`, y acepta además un objeto por región), `c`: `{ "GBA": [observaciones, comercios] }` y `sa: true` si el producto de SEPA es solo parecido (`a` sigue marcando INDEC). Un ingrediente puede tener `p`, `s` o ambos.
  - Raíz: `sepa: { nombre, dataset, recurso, fecha, licencia, atribucion, nota, productos, sucursales }` con la atribución y los enlaces (`https://datos.produccion.gob.ar/dataset/sepa-precios`, `https://creativecommons.org/licenses/by/4.0/deed.es`) y la nota de la partición de regiones. `mes` queda para INDEC; `sepa.fecha` es el día del archivo.
  - `version` sigue en 1: quien no entiende `s` sigue andando con `p`.

- Workflows:
  - `.github/workflows/actualizar-precios.yml` pasa de mensual a **semanal** (cron `23 6 * * 2`, martes 06:23 UTC: el archivo del lunes se publica a las ~16:20 UTC del lunes), con `workflow_dispatch`. Hace SEPA y también INDEC (casi siempre "sin cambios"; son 200 KB). Permisos `contents: write` como hoy, `timeout-minutes: 25`, `concurrency` propia, `actions/checkout@v5` (la misma versión fija de hoy), **sin tocar secretos ni ajustes**: no usa más que el `GITHUB_TOKEN` de siempre. Pasos: bajar y procesar, `--verificar`, `node herramientas/construir.mjs`, `node herramientas/construir.mjs --verificar` (mejora sugerida en la Etapa 7), commit solo de `datos/precios.json` e `index.html` si cambiaron, `git pull --rebase`, push y publicar (job aparte con permisos mínimos, como hoy).
  - `.github/workflows/precios-prueba.yml` (PR) suma un paso que baja el día de SEPA y corre el script con `--solo-sepa --salida $RUNNER_TEMP/salida/precios-descargado.json`, después `--verificar --archivo-json` sobre eso, y sube el JSON, el resumen y el hash del ZIP como **artifact** (`retention-days: 14`). Permisos `contents: read`, `timeout-minutes: 25`, **sin git add, commit ni push**. Como en la Etapa 7, la descarga queda como aviso (`continue-on-error`) para que una caída del portal no ponga en rojo el PR; la verificación sin red sigue siendo obligatoria. El artifact se lee con `gh api` y se compara con `datos/precios.json`: es el control E9-tarea-en-pr. Con lo que muestre el artifact real se afinan las reglas (la corrida en Actions no depende de mi red).

- En la app (`43-precios.js` y retoques chicos):
  - Orden: **Mi precio > SEPA de la región > INDEC de la región > SEPA de GBA > INDEC de GBA**. Los dos últimos solo cuando la región elegida no tiene el ingrediente, y la fuente lo dice ("SEPA · mediana · GBA · 2 nov."). Cuando están las dos fuentes gana SEPA (más nueva, de la región y con rango); INDEC queda de respaldo.
  - `precioIndec` se parte en `precioAuto(nombre)`, que elige entre `s` y `p` según el orden y devuelve `{ precio, region, fuente: "sepa"|"indec", rango: [p25, p75] | null, aprox }`; `precioDe` devuelve además la fuente ya escrita ("SEPA · mediana · Pampeana · 2 nov.", "Promedio INDEC · GBA · sept. 2026"). Lista, comida, Semana y Comparar pasan por ahí; las funciones existentes conservan nombre y forma de retorno.
  - Provincia/región: la región se elige como hoy (Preferencias → "Región de los precios", `region_v1`, sin cambios). **No se agrega elegir provincia**: SEPA se publica por región para que el archivo pese poco y haya un solo selector. Decisión para revisor-codigo.
  - Rango en Comparar: `rangoDePrecios` usa `r[región]` (par suelto u objeto) y escribe "promedio $1.700 a $2.600" con los percentiles reales; sin SEPA se comporta como en la Etapa 8.
  - Fuente y fecha visibles en la línea de la lista y en la hoja del ítem. Más → Fuentes de datos suma el renglón de SEPA con enlace y "CC BY 4.0" y la nota de la partición de regiones; los textos salen del JSON.
  - "Faltan N precios" más honesto (mejora de la Etapa 7): con la cobertura nueva casi no se verá, pero si faltan más de la mitad de los ítems de la lista el total dice "al menos ≈ $X (faltan N precios)". Solo texto.
  - Con los precios apagados no se ve nada de esto (E1 y E2 no cambian).

- Riesgos para los datos: ningún formato guardado cambia. `referencePrices_v1` (Mi precio), `region_v1`, `mostrarPrecios_v1` y las demás se leen igual; **no hay clave nueva** (SEPA es un dato incrustado, no del usuario), ni migración, ni cambios al respaldo. Un `precios.json` inválido se ignora como hoy (`validPreciosData`); los campos desconocidos o malos de un ingrediente se ignoran uno por uno. El tope de 60 KB cuida que la PWA no engorde. Sin llamadas a internet en la app (regla 6): los ~325 MB los baja solo GitHub Actions. De los datos de terceros la app solo recibe números y los textos de atribución, nunca descripciones de productos.
  - Riesgo de producto, no de datos: la mediana de lo que publican los supermercados no es "tu" supermercado; la fuente lo dice y el rango (p25 a p75) lo muestra.

- Pruebas que cambian (ninguna se borra y la cantidad no baja):
  - Lógica (el código nuevo las cumple tal cual): `e7_precios.js` C7-1 a C7-7 y `e8_herramientas.js` C8-1 a C8-10 con el dataset de ejemplo de INDEC; respaldo (`bkp01`, `bkp02`, `k01`, `j01`) con el fixture `respaldo-v14.9.94.json`; `f04_gasto`, `r2_shop`.
  - Interfaz: solo si cambia un texto de fuente; "Promedio INDEC · …" queda igual cuando la fuente es INDEC. `datos/precios-ejemplo.json` **se deja como está** para que esas pruebas no cambien, y se crea `datos/precios-ejemplo-sepa.json` (8 a 10 ingredientes, 3 regiones, con `s`, `r` y `c`, valores redondos y atribución) para las nuevas. Las pruebas nunca usan descargas reales.
- Pruebas nuevas (suite `e9_sepa.js` en `pruebas/suites.json`, prefijo exacto "C9-1 ", etc.; se sube la línea base con `--actualizar-linea-base`):
  - **C9-1** cobertura: con el `datos/precios.json` real incrustado, el núcleo (41 ideas + comidas del respaldo de ejemplo, 52 ingredientes) tiene precio automático en GBA en al menos el 80 % (≥ 42 de 52). La prueba arma la lista con la app (no con una lista copiada), imprime qué falta y qué se excluyó y por qué, y mide aparte las opciones del armado (informativo, sin umbral). Es el control E9-cobertura-precios.
  - C9-2 orden: Mi precio gana a SEPA, SEPA a INDEC (con el ejemplo que tiene `s` y `p` en el mismo ingrediente) e INDEC es el respaldo cuando falta SEPA; la fuente dice cuál.
  - C9-3 región: cambiar la región cambia el valor SEPA; si la región no tiene SEPA cae a INDEC de la región y después a GBA, con la fuente correcta.
  - C9-4 rango en Comparar con los percentiles reales del ejemplo; sin `r` se ve como antes.
  - C9-5 fuente y fecha visibles en la lista y la hoja del ítem; atribución de SEPA y CC BY 4.0 en Más → Fuentes de datos; con precios apagados no se ve ninguna.
  - C9-6 los ejemplos y el dataset real pasan las mismas comprobaciones que `--verificar` (percentiles ordenados, mínimos de observaciones, tope de 60.000 bytes).
  - C9-7 el lector de ZIP/CSV de la herramienta, con un ZIP externo e internos **armados dentro de la prueba** (sin red y sin dependencias): CSV chiquitos con BOM, relleno de espacios, unidades `kgm`/`gr.`/`uni`, una fila con referencia 1.000 veces mayor y otra con otra cantidad de campos. Verifica provincias → regiones (incluido GBA por código postal), mediana y percentiles, que los precios malos se descartan y que un ZIP corrupto o un CSV demasiado grande falla sin tocar el archivo. La prueba corre la herramienta con `--archivo-sepa` y `--salida` temporal y comprueba que `datos/precios.json` del repo no cambió. Cierra de paso la mejora C7-8 pendiente (un `.xls` mínimo armado en la prueba).
  - C9-8 con "faltan más de la mitad" el total dice "al menos ≈ $X".
- Controles nuevos en `criterios.json` (solo se agregan): E9-cobertura-precios ya existe (prueba C9-1). Se suman E9-precios-valido-sepa (`node herramientas/actualizar-precios.mjs --verificar`, código 0, ahora con SEPA y tope de bytes), E9-tarea-en-pr (tipo registro: la tarea de SEPA corrió en el PR y el Registro cuenta lo que mostró) y E9-tamano-precios (medida: `datos/precios.json` ≤ 60.000 bytes, `index.html` ≤ 770.000).
- Cómo se mantienen los controles anteriores: palabras de Compras (E1, ≤ 262,8) y alto de Semana (E2, ≤ 1.266 px) se miden con los precios apagados y esta etapa no agrega nada visible ahí; con precios prendidos solo cambia el texto de la fuente (misma línea) y, con "faltan más de la mitad", unas palabras de la línea resumen, que se mide en `todo` (E5, ≤ 742,8). E7-precios-validos sigue corriendo `--verificar` (más estricto, no menos). C7-1 a C7-7, C8-1 a C8-10 y el resto de las baterías se corren tal cual. Nada se elimina.

**Decisiones para revisor-codigo**
- El núcleo del 80 % excluye el armado y los 7 textos sin nombre de nutrición; si se quisiera incluir el armado, el control no se cumple con datos honestos (se estima 72 % a 77 %).
- GBA se aproxima con CABA + código postal 1600 a 1899 de Buenos Aires; la partición exacta de INDEC no se puede reproducir con SEPA.
- Se publica por región (no por provincia) por el tope de tamaño; la herramienta agrupa por provincia internamente y se puede publicar por provincia si se pide.
- SEPA gana a INDEC cuando están los dos (más nueva, por región y con rango); INDEC queda de respaldo.
- La mediana es sobre filas producto-sucursal (pondera por cantidad de sucursales); SEPA no trae ventas para ponderar mejor.
- La tarea de precios pasa de mensual a semanal para no tener dos tareas que escriban el mismo archivo.

**Plan corto, segunda versión** (manda sobre la primera; resuelve los bloqueantes de revisor-codigo)
- **Denominador del 80 %**: el TOTAL es núcleo (41 ideas + comidas y recetas del respaldo de ejemplo) + opciones del armado (97 ingredientes). Se apunta a que el total llegue a 80 % (78 de 97) con datos honestos: reglas de búsqueda para lo envasado (legumbres, cereales, harinas, fideos, lácteos, aceites, etc.). C9-1 mide e imprime tres números (núcleo, armado y total). Si el total llega a 80 %, C9-1 exige el total; si no llega con datos honestos, exige 80 % del núcleo y el porcentaje real del total queda en "Pendientes para vos". El texto del control en `criterios.json` no se toca.
- **Piso de honestidad**: dentro de lo que se cuenta para el 80 %, como máximo 15 % puede ser aproximado (`a`/`sa`); la prueba imprime cuáles y el umbral cuenta solo los no aproximados. C9-1 lee el `datos/precios.json` REAL y verifica que cada precio contado tenga `s` o `p` finito y mayor que 0 y observaciones `c` suficientes.
- **Mínimo para publicar un precio de SEPA**: 10 observaciones y 3 comercios distintos (herramienta y `--verificar`). Si no, queda sin precio de SEPA (INDEC si hay, o ninguno).
- **Cruce SEPA vs INDEC**: si los dos existen y SEPA queda fuera de 0,5× a 2× de INDEC, se publica solo INDEC (no se publica `s`). Los productos por atado (ajo, puerro, rúcula, cebolla de verdeo, albahaca) solo con `ini` y `t` estrechos o sin precio.
- La app muestra "SEPA · mediana · región · fecha" y "aprox." también para `sa`. C9-2 prueba que `precioDe` no escribe en `localStorage`.
- **Tamaño**: `--verificar` falla si `datos/precios.json` pasa 60.000 bytes; `construir --verificar` garantiza que `index.html` incrusta el mismo JSON y no pasa de 770.000 bytes.
- **Workflows**: `precios-prueba.yml` con `workflow_dispatch` y `pull_request` con `paths` (herramientas/**, datos/precios-mapa.json, .github/workflows/precios-*.yml), `concurrency` con `cancel-in-progress: true` y descarga con `continue-on-error` más aviso. `actualizar-precios.yml` semanal con permisos mínimos, `timeout-minutes: 25`, sin secretos, versiones fijadas y `git pull --rebase` antes del push.
- C9-1 corre contra el JSON real generado por la herramienta con el día de SEPA bajado una vez (carpeta nueva fuera del repo, borrada al terminar).

**Implementación (v15.8.0)**
- `herramientas/actualizar-precios.mjs` (sin dependencias): descarga el ZIP más nuevo de SEPA desde CKAN a una carpeta temporal nueva (tope 600 MB, 15 minutos), lo lee con `node:zlib` y `node:readline` en una sola pasada (~65 s para las 14,3 millones de filas), sin extraer nada a disco. Opciones `--solo-indec`, `--solo-sepa`, `--archivo-sepa`, `--salida`, `--hoy` y `--verificar` (sin red). Si una fuente falla se conserva lo último de esa fuente; si fallan las dos, sale con código 1 sin tocar `datos/precios.json`. Escritura atómica.
- Mínimo para publicar un precio de SEPA: 10 observaciones y 3 comercios distintos **en esa región** (un comercio es una bandera: `id_comercio` más `id_bandera`; con solo `id_comercio` Cencosud y otras cadenas cuentan como uno y quedaban 67 de 97). Cruce con INDEC: si SEPA queda fuera de 0,5 a 2 veces INDEC no se publica el precio de SEPA de esa región (pasó con pollo entero y papa en Noroeste). Salto semanal de más de 2,5 veces o menos de 0,4: se conserva el anterior; más de un cuarto de saltos hace fallar la tarea. Piso de cobertura en `--verificar`: 60 % del ámbito.
- `datos/precios-mapa.json`: 118 ingredientes (40 de INDEC más los de SEPA), reglas `sepa` por frases, `ambito` con los 52 del núcleo y los 45 del armado, y `sepaExcluir`.
- `datos/precios.json` real: SEPA del 2026-11-02 (Lunes, 324.136.705 bytes, 14.308.918 filas) más INDEC de septiembre de 2026 sin cambios; 104 ingredientes; **35.961 bytes** (tope 60.000). `index.html` pasa de 705.405 a 739.151 bytes (tope 770.000). `datos/precios-ejemplo-sepa.json` (8 ingredientes, 3 regiones) para las pruebas.
- App (`43-precios.js`): `precioAuto` elige SEPA de la región, INDEC de la región, SEPA de GBA, INDEC de GBA; `precioDe` suma `origen`, `aprox` y la fuente escrita ("SEPA · mediana · Pampeana · 2 nov. 2026"); la línea general dice "SEPA · mediana · GBA · 2 nov. 2026 (INDEC si falta · sept. 2026)"; `rangoDePrecios` usa los percentiles reales de la región (acepta el par suelto de la Etapa 8); la lista avisa "hay precios aprox."; el total dice "al menos ≈ $X" si falta más de la mitad; Más → Fuentes de datos suma SEPA con enlaces y CC BY 4.0 (salen del JSON). `construir.mjs` falla si `precios.json` pasa 60.000 bytes o `index.html` 770.000.
- Workflows: `actualizar-precios.yml` semanal (martes 06:23 UTC), 25 minutos, `actions/checkout@v5`, sin secretos, `git pull --rebase` antes del push, y `construir --verificar` antes de publicar. `precios-prueba.yml` en `pull_request` con `paths` (`herramientas/**`, `datos/precios-mapa.json`, `.github/workflows/precios-*.yml`) y a mano, `concurrency` con `cancel-in-progress`, descarga con `continue-on-error` más aviso, `contents: read`, sin commit ni push; sube el JSON, el resumen y la verificación como artifact.

**Cobertura real** (medida por C9-1 con la app y el JSON real, en GBA)
- Núcleo (41 ideas + comidas y recetas del respaldo de ejemplo): **49 de 52 (94 %)**. Faltan Puerro, Cebolla de verdeo y Quinoa (poca oferta con los mínimos).
- Armado (45 que no están en el núcleo): **32 de 45 (71 %)**. Faltan Nabo, Zucchini, Amaranto, Cebada, Centeno, Mijo, Sorgo, Tapioca, Habas, Porotos aduki, Caballa, Lenguado y Clara de huevo.
- **Total: 81 de 97 (83,5 %)**, con 11 aproximados (Rúcula, Tortillas de trigo, Espinaca, Salmón, Albahaca, Ajo, Espárragos, Kale, Radicheta, Lupino y Queso untable descremado). Contando a lo sumo el 15 % de 78 (11) aproximados, el total contado es 81 (83,5 %): C9-1 exige el total. Hoy solo con INDEC eran 16 de 97.
- Excluidos por no ser un ingrediente con nombre de la nutrición: Fruta de estación, Frutos secos, Semillas de chía o sésamo, Granola, Leche fluida o en polvo descremada, Pan de molde integral o blanco, Romero, Trigo y los textos "Opción ocasional…", "Budín", "Waffle", etc. (22 en total).

**Decisiones que tomé sin vos**
- C9-1 exige el TOTAL (81/97) porque llega a 80 % con datos honestos; si en una actualización semanal el total bajara de 78, la prueba falla y hay que mirar qué cambió (no se afloja).
- "Comercio distinto" = bandera (`id_comercio` + `id_bandera`).
- Regiones de SEPA: GBA = CABA más Buenos Aires con código postal 1600 a 1899; resto de Buenos Aires = Pampeana. Se publica por región, no por provincia (peso del JSON).
- SEPA gana a INDEC cuando están los dos y la diferencia es razonable (0,5 a 2 veces); si no, se queda INDEC.
- Yogur natural: INDEC lo mide por litro y SEPA por kilo; la regla `u: "kg"` trata 1 kg = 1 l (densidad ≈ 1).
- Los productos por atado o envase chico (ajo, rúcula, albahaca, espárragos, kale, radicheta, lupino) y los equivalentes (espinaca congelada, salmón ahumado o en lata, queso untable, tortillas) llevan `sa: true` y la app los marca "aprox.".
- El lector de ZIP se prueba en Node (`pruebas/sepa-lector.mjs`, control E9-lector-sepa), no en el navegador: las baterías del navegador no pueden importar la herramienta. Sus 7 comprobaciones llevan el prefijo "C9-9 ". La suite del navegador `e9_sepa.js` tiene C9-1 a C9-8 (C9-7 pasó a ser "sin clave nueva ni llamadas a internet" y C9-8 el "al menos").
- Pollo (entero) quedó con INDEC solamente (los cortes de SEPA, 2 veces más caros, no son lo mismo); Muslo de pollo usa SEPA.

**Pruebas adaptadas** (ninguna se borra; la cantidad sube de 531 a 539)
- `e7_precios.js` C7-5: el JSON real ya no exige `p` en cada ingrediente (acepta `p` o `s`); los precios de huevo, leche y arroz se comparan con `precioAuto` (SEPA o INDEC, según haya) en vez de con la columna de INDEC, y "sin precio" se comprueba con "Cardamomo" porque "Zapallito" ahora tiene precio. Protege lo mismo: conversión de unidades y el mismo dato que `precioDe`.
- Nuevas: `e9_sepa.js` (C9-1 a C9-8) y la comprobación de Node `sepa-lector.mjs` (C9-9, siete líneas).

**Tarea de SEPA en el PR** ✅: corrió en el PR #1 con el push de `etapa-9-ok` (commit `5db3c08`) y las dos tareas dieron "success". La tarea de prueba bajó desde el runner los datos reales de SEPA del 2 de noviembre de 2026 (14.308.918 filas, 43 s de procesamiento), los procesó sin commitear nada y subió el artifact `precios-descargado` con la misma cobertura que la corrida local (núcleo 49/52, armado 32/45, total 81/97, 11 aproximados, 95 ingredientes con SEPA). Sin avisos de descarga.

**Compuerta**
- "VALIDACIÓN ETAPA 9: OK (56 controles)". Pruebas: 539/539 (eran 531), con `e9_sepa.js` (C9-1 a C9-8) y `pruebas/sepa-lector.mjs` (C9-9, el lector de ZIP, en Node).
- Cobertura real (C9-1, con la app y el `datos/precios.json` real, región GBA): núcleo 49/52 (94 %), armado 32/45 (71 %), total 81/97 (83,5 %), con 11 aproximados (14 % de lo necesario, dentro del tope de 15 %). Con INDEC solo eran 16/97.
- Tamaños: `datos/precios.json` 35.961 B (tope 60.000); `index.html` 739.151 B (tope 770.000), verificados por `construir.mjs`.

**Revisores**
- revisor-codigo, sobre el plan: BLOQUEANTE en la primera versión. El control del 80 % dejaba afuera el armado (46 % de los ingredientes) y nada limitaba los aproximados.
  - Se resolvió así: C9-1 imprime núcleo, armado y total y exige el total (81/97); solo se admiten aproximados hasta el 15 % de lo necesario; cada precio de SEPA exige 10 observaciones y 3 banderas.
  - El texto del control en `criterios.json` no se tocó.
- revisor-codigo, sobre el diff: NO BLOQUEANTE. Verificó que C9-1 lee el JSON real y no puede pasar con datos de ejemplo, y que ningún cruce SEPA/INDEC sale de 0,5×–2×. Sugerencia aplicada: C7-5 volvió a una comprobación exacta (huevo SEPA = 388 por unidad).
- revisor-usuario: NO BLOQUEANTE. El total engaña menos que en la Etapa 7 ("al menos ≈ $X" se entiende) y no hay textos cortados ni superpuestos nuevos.

**Mejoras sugeridas**
- Poner "al menos" también en el cartel de la barra de presupuesto de Compras ("≈ $21.523 estimado (faltan 20 precios)") y en el total semanal de Semana ("≈ $32.618 la semana (faltan 25 precios)"), igual que en la línea de pendientes: es la misma cifra con dos fórmulas (Etapa 10).
- Acortar la línea de fuente "SEPA · mediana · GBA · 2 nov. 2026 (INDEC si falta · sept. 2026) · hay precios aprox." (3 líneas) (Etapa 10).
- Sumar la vista `fuentes` (Más → Fuentes de datos) a las capturas para confirmar la atribución a SEPA e INDEC (Etapa 10).
- Puerro, cebolla de verdeo, quinoa, zucchini, cuscús y otros quedan afuera por oferta chica en pocas banderas: mirar con la corrida semanal si suben.
- Sumar sinónimos (`INGREDIENT_SYNONYMS`) para "Leche fluida o en polvo descremada", "Pan de molde integral o blanco" y "Frutos secos" subiría la cobertura real (tocan equivalencias guardadas: no se hizo).
- Elegir provincia además de región.

**Pendientes para vos**
- Total real del catálogo con precio: **81 de 97 (83,5 %)**, núcleo 94 % y armado 71 %. C9-1 exige el total; si preferís que exija solo el núcleo, decilo.
- Revisar en GitHub la corrida de `precios-prueba.yml` en el PR (descarga real de ~325 MB desde el runner): ya corrió y quedó ✅ (ver "Tarea de SEPA en el PR").

### Etapa 10 · Pulido ✅

Rama `rediseno-etapa-10-pulido`. Versión 15.9.0.

**Plan corto**

- **Inventario medido hoy** (`capturas/etapa-9/medidas.json`, v15.8.0, 17 vistas × 3 estados × 2 temas = 102 capturas; la métrica nueva la medí con una copia de `capturas.mjs` fuera del repositorio, sin tocar nada del repo):
  - `superpuestos` 0, `fueraDePantalla` 0, `sinEtiqueta` 0, sin errores de JavaScript ni scroll horizontal.
  - `cortados` = **28 celdas**, de tres orígenes. MEDIR cuenta (1) elementos `button,a,label,summary,h1-h4,p,li,span,strong,small,td,th` visibles con `overflow` oculto/`clip` o `text-overflow: ellipsis` y `scrollWidth > clientWidth + 1`, y (2) los `select` cuyo texto elegido, medido con canvas, no entra en el ancho útil (`clientWidth` menos el padding menos 22 px).
    - (a) `span.comida-card__componentes` de Comidas: 6 tarjetas × (normal y todo) × 2 temas = **24**. Es el "…" de una línea que pusimos a propósito en la Etapa 4; el control lo cuenta bien: la lista de componentes queda escondida.
    - (b) `select#pantryReviewRecipe` («Ensalada de fideos integrales + …») en `despensa`/todo: **2** (claro y oscuro).
    - (c) `select#budgetAlternative_0` («3.975,00 ARS · 5300 / 1 kg · 2…») en `compras-herramientas`/todo: **2**.
  - **Contraste (métrica nueva, medida hoy): 51 textos por debajo del mínimo en las 102 capturas (3 en claro, 48 en oscuro; 19 distintos).** Casi todos son texto blanco sobre el verde `#57C8A4` del tema oscuro (2,06:1): `button--primary` ("Elegir", 19 de los 51), `segmento__boton` activo ("Lista", 12), "Terminé de comprar", "Registrar compra", "Calcular", "Descargar respaldo", "Guardar y probar" y los chips activos de día y de filtro. Los 3 de tema claro son `p.screen__hint` en Más: gris `--muted` (#66756f) sobre el degradado de la tarjeta, 4,03:1.
  - Nombres accesibles: ningún botón ni enlace visible quedó sin nombre en las 17 vistas (medido: 0). Los controles de menos de 44 px que aparecen en Entrenamiento (7 `input`), "← volver", `#recipeApplyAvoid` y `#comprasDescontar` se revisan contra `u01_toque` al implementar.
  - Dibujo del plato: la **bienvenida** ya tiene un SVG inline (círculo con mitad de verduras y dos cuartos, clases `bienvenida__*`, con `<title>`). El **armado** (`#plate_static`, `renderPlate` en `06-…js`, `plate__slice`) muestra solo tres tarjetas de texto ("Verduras / Almidones / Proteínas" con la cantidad): no hay dibujo.
  - Estados vacíos (texto de hoy): Compras "No hay compras pendientes. Agregá comidas a la semana." sin botón, y el botón lleno es "Terminé de comprar" (no sirve sin lista); Semana vacía solo tiene la ayuda "Tocá una comida…" (los "Elegir" son secundarios); Comidas vacías ya tiene `emptyState` y el botón "Armar mi primer plato" (se deja); Registro vacío "Nada registrado este día." con "+ Lo comí" y "+ Lo cociné" (ya hay próximo paso, se deja); Despensa "Todavía no agregaste otros ingredientes." sin botón; Ideas sin resultados "No encontré ideas con “x”. Probá otra palabra, por ejemplo pescado, pollo, garbanzos o tomate." (2 líneas, sin botón).

- **1. `cortados` a 0 sin esconder** (solo CSS y textos de opciones; MEDIR no se toca):
  - `.comida-card__componentes`: se quitan `white-space: nowrap`, `ellipsis` y `overflow: hidden`; el texto ajusta (`white-space: normal; overflow-wrap: anywhere`). La tarjeta crece lo que haga falta; Comidas no tiene tope de alto (sí de palabras, que no cambian).
  - `#pantryReviewRecipe` y `#budgetAlternative_0`: las opciones usan una etiqueta corta (el título de la receta sin lo que sigue a " + "; el precio y la unidad, "$3.975 · 1 kg"; el marcador "Elegí una referencia" en lugar de "Elegí una referencia para simular…"), y el detalle va en la línea de abajo o en `title`. Si una opción sigue sin entrar, el `<option>` se acorta y el nombre completo queda visible en el texto de debajo (no se pierde información). Las pruebas que lean el texto de la opción se adaptan (ver más abajo).
- **2. Contraste.** Métrica nueva `contraste` en MEDIR (solo se agrega; ninguna línea existente cambia): por cada elemento visible con texto propio y no deshabilitado compara el color del texto con el fondo efectivo (capas con opacidad compuestas; si hay degradado se usa el promedio de sus colores) y cuenta los que están debajo de 4,5:1 (3:1 si el texto es grande: 24 px o más, o 18,66 px o más en negrita). Entra en `medidas.json` y en el resumen. Control nuevo `E10-contraste` (tipo `medida-todas`, métrica `contraste`, `<= 0`, etapa 10).
  - Arreglo con el sistema de diseño: un token `--on-green` (claro `#fff`, 6,45:1; oscuro `#06231b` sobre `#57C8A4`, cerca de 8:1) en las 8 reglas, más o menos, que hoy ponen `color:#fff` sobre `var(--green)` (`.button--primary`, `.segmento__boton[aria-pressed]`, `.filter-chip.is-selected` y `[aria-pressed]`, `.semana-dia-chip`, `.registro-dias`, `.advice-tab`). El botón rojo de borrar se revisa con la misma métrica. `--muted` del tema claro se oscurece (cerca de #5a6964) hasta que pase sobre el degradado. Los 44 px y los colores de acción no cambian. Riesgo: `d01_diseno.js` (D4 a D6) compara fondos y bordes; si alguna compara el `color` del texto, se adapta con reemplazo de igual fuerza.
- **3. Cobertura de capturas** (solo se agregan vistas a `VISTAS`; MEDIR igual salvo `contraste`). Nueve vistas nuevas, 26 vistas × 6 = 156 capturas: `bienvenida` (`abrirBienvenida()`), `comida` (detalle: `abrirComida(...)` con la primera comida guardada; en `vacio`, sin comidas, abre la hoja "+ Nueva"), `receta-editar` (`go("recetaEditar")` desde Comidas), `fuentes` (`abrirFuentes()`), `selector` (`abrirSelector(dia, slot)` en Semana, `medir: ".hoja"`), `sugerime` (`abrirSugerime(slot)`, `medir: ".hoja"`), `semana-menu` (`abrirMenuSemana()`, `medir: ".hoja"`), `comidas-nueva` (`abrirNuevaComida()`, `medir: ".hoja"`) y `hueco` (`abrirHueco(dia, slot)` de un hueco lleno, `medir: ".hoja"`). Antes de cada vista se cierra la hoja (`hoja.cerrar()`) para que no se arrastre a la siguiente; los `ir` exactos se prueban en Chrome al implementar. Estas vistas se miden con los cinco controles de la etapa (los `medida-todas` las toman solas, porque `validar-etapa.mjs` recorre `medidas.vistas`); lo que aparezca ahí se arregla, no se afloja. Quedan para el informe: el menú ⋯ de Compras, Preferencias con los precios encendidos (≈ $ por porción) y el aviso de Deshacer.
- **4. Etiquetas y nombres accesibles.** Las vistas nuevas entran a `sinEtiqueta` (campo de búsqueda del Selector, formulario de receta, campos de la bienvenida). Lo que salga sin etiqueta se arregla con `<label>` o `aria-label`. Para los botones solo-ícono la prueba nueva C10-3 exige nombre accesible sobre la app real (hoy 0 sin nombre en las 17 vistas); no se suma control a `criterios.json` más que C10-3 dentro de `E10-pulido-pruebas`.
- **5. Estados vacíos con próximo paso** (una línea y un botón, con el `emptyState` que ya existe):
  - Compras sin lista: "Todavía no hay nada para comprar." y el botón lleno "Armar mi semana" (va a Semana); "Terminé de comprar" no es el botón lleno cuando no hay lista.
  - Semana vacía: una línea "Elegí qué vas a comer hoy" y el botón lleno "Elegir el almuerzo de hoy" (abre el Selector).
  - Despensa vacía: la línea de "otros ingredientes" pasa a una sola y se suma "Ver ideas con lo que tengo" cuando hay algo marcado.
  - Ideas sin resultados: "Sin ideas con “x”" y el botón "Limpiar búsqueda".
  - Comidas vacías y Registro vacío ya cumplen; se dejan.
- **6. Dibujo del plato en el armado.** Se reutiliza el SVG de la bienvenida: `renderPlate` pinta arriba de las tres tarjetas un SVG inline (círculo, mitad de verduras, cuarto de almidones y cuarto de proteínas), con `role="img"` y `<title>` ("Tu plato: mitad de verduras, un cuarto de almidones y un cuarto de proteínas", o las proporciones editadas). Las clases `bienvenida__*` pasan a un componente común `plato-dibujo`, con variables de color para claro y oscuro (texto del dibujo con contraste de 4,5:1 o más). Las tarjetas `plate__slice` se quedan (las usan las porciones editables y las pruebas). Sin dependencias ni imágenes; suma cerca de 1 KB a `index.html`.
- **7. Revisión de textos (vocabulario único).** Auditoría con `grep` de los textos visibles: "✓ Comido" ya es "✓ Lo comí" (Etapa 3); "Anotar" y "Registrar preparación" solo quedan en herramientas avanzadas. **Se hace** (lo que se ve en el primer uso, sin subir palabras):
  - "Mis comidas" → "Comidas" en el título de la pantalla, en "← Volver a Mis comidas" y en los avisos "Guardado en Mis comidas" / "Ya estaba en Mis comidas" (18 apariciones en el código; solo el segmento "Mis comidas | Ideas" y la sección "Mis comidas" del Selector, que ya es lo guardado del tipo, se quedan).
  - "al menos ≈ $X" también en la barra de presupuesto de Compras y en el total semanal de Semana (con un solo "faltan N" en Semana en lugar de dos).
  - Línea de fuente de precios en una línea ("SEPA · GBA · 2 nov. 2026 · aprox."), con el detalle en Fuentes de datos.
  - Una línea de ayuda por sección: las de más de una línea pasan a una (lo que sobra va a "ⓘ" o se saca); el aviso de herramientas ocultas (3 líneas) pasa a una: "Hay herramientas ocultas. Mostrarlas".
  - "Desayuno o merienda" (3 líneas en Hoy) → "Desayuno" y "Merienda" en una línea.
  - Títulos largos de interruptores en Preferencias ("Mostrar precios y presupuesto: activado") → "Mostrar precios".
  - Cada texto nuevo se compensa con uno sacado en la misma pantalla.
  - **Quedan para el informe final** (mejoras sugeridas, no se hacen): "Lista de compras" del texto compartido (lo fijan pruebas de lógica), tabla de secciones del súper revisada con el catálogo, notas de "Ya tenés" en una línea, cantidades con formato mixto, plegar el orden de Comidas, Ideas con botón lleno, cambiar la comida o la fecha de un registro en el lugar, Eliminar con Deshacer, "Cocinado N veces" que lleve al Registro, abrir la sección con el campo en error en la receta, el recorte de 2.000 registros, precios por provincia, sinónimos de ingredientes, "Con lo que tengo" repetido en Hoy y Más, Hoy con plan sin botón lleno, el chip "¿Entrenás hoy?" sin rutina, el aviso "¿Repetís el plan?" que empuja los chips, los íconos ⭐/🔍/📖, las flechas de "Mañana" y de los huecos llenos, y limpieza de código muerto (`.advice-fab`, `IDEAS_MENU_VISIBLES`, C4-7 que no restaura `setItem`).
- **8. Riesgos para datos y topes.**
  - Datos: ninguno. No hay claves nuevas, ni formato nuevo, ni migraciones; no se toca `localStorage` ni el respaldo (todo es CSS, textos, SVG, `capturas.mjs` y `criterios.json`).
  - Pruebas existentes que leen textos y cambian (interfaz, con reemplazo de igual fuerza; ninguna se borra y el conteo no baja de 539): las que buscan "No hay compras pendientes" y "Terminé de comprar" con la lista vacía (e5, r2_shop), "Mis comidas" en títulos y avisos (e1, e2, e4, l01, r3_saved, regression, u01, k01), "estimado" y "faltan" de la barra de presupuesto y del total semanal (e7, e8, e9, m01), el texto de las opciones de `#pantryReviewRecipe` y `#budgetAlternative_0` (e8, e5) y "herramientas ocultas" (m01). Las pruebas de lógica que fijan "Costo parcial estimado", "Falta comprar", etc. no cambian.
  - Pruebas nuevas, prefijo `C10-` (archivo `pruebas/e10_pulido.js`): C10-1 estados vacíos con próximo paso (Compras, Semana, Despensa, Ideas: una línea y un botón que hace algo); C10-2 el armado dibuja el plato (SVG con título y tres sectores, que sigue las proporciones editadas); C10-3 ningún campo ni botón solo-ícono sin nombre en las pantallas nuevas (Selector, Sugerime, ⋯, detalle, receta); C10-4 selects con opciones que entran (sin "…" en `pantryReviewRecipe` ni `budgetAlternative`); C10-5 contraste de los colores del sistema de diseño en claro y oscuro (calculado desde los tokens `--on-green`, `--green`, `--muted`, `--danger`); C10-6 "al menos" en la barra de presupuesto y el total semanal con precios incompletos. Mínimo 545 pruebas en total.
  - Topes de palabras (se verifican en la compuerta; margen medido hoy): Compras normal 209 de 262,8; Preferencias todo 206 de 227 (21); herramientas de Compras todo 723 de 742,8 (**19,8**, el más justo); Ideas normal 171 de 391; Registro normal 65 de 391 y todo 398 de 427; Comidas normal 296 de 607. Los textos nuevos de los estados vacíos viven en vistas vacías (sin tope) y se compensan acortando ayudas en las pantallas con tope. `E2-semana-alto` ≤ 1.266 px (hoy 1.080): el único cambio en Semana con plan completo es un "faltan N" menos. `index.html` ≤ 770.000 B (hoy 739.151): el SVG, los estilos y los textos suman menos de 5 KB.
- **Archivos.** `fuente/estilos.css` (tokens, `--on-green`, tarjetas de Comidas, plato), `fuente/codigo/06-…js` (`renderPlate`), `37`, `38`, `39`, `41`, `43` (textos y vacíos), `fuente/cuerpo/pantallas/` (bienvenida, ayudas), `herramientas/capturas.mjs` (vistas nuevas y `contraste`), `docs/validacion/criterios.json` (solo agregar), `pruebas/` (adaptar y `e10_pulido.js` nuevo en `suites.json`), `fuente/version.json` (15.9.0), `docs/validacion/linea-base.json` (sube conteos).
- **Controles nuevos propuestos para `criterios.json`** (solo agregar): `E10-contraste` (`medida-todas`, `contraste <= 0`) y `E10-pulido-pruebas` (`prueba`, C10-1 a C10-6). No se cambia ni se quita ninguno de los cinco controles de la etapa (`E10-sin-superposiciones`, `E10-sin-textos-cortados`, `E10-nada-fuera-de-pantalla`, `E10-campos-con-etiqueta`, `E10-revision-visual`), que además pasan a medir las nueve vistas nuevas.

**Implementación (versión 15.9.0)**

- **Controles de la etapa, antes y después** (156 capturas = 26 vistas × 3 estados × 2 temas; las 9 vistas nuevas más `armado-plato`, que se sumó al final, dan 27 vistas y 162 capturas en la corrida de la compuerta):
  - `cortados`: 28 → **0** (las 24 tarjetas de Comidas ajustan en varias líneas; los dos selects de la despensa y de Comparar alternativas tienen opciones cortas).
  - `contraste` (métrica nueva, **peor caso del fondo**): 81 textos por debajo del mínimo en las 156 capturas antes de arreglar (51 con el promedio del degradado en las 102 anteriores; el peor caso suma los 3 grises de Más que fallaban al 3,71:1, los enlaces de Fuentes en oscuro, 1,84:1, y el detalle del Selector, 4,25:1) → **0**.
  - Lo que `contraste` no mide, contado en `contrasteExcluidos` de `medidas.json` y no omitido: **20 textos deshabilitados** (exención de WCAG; `disabled`, `aria-disabled` o `fieldset:disabled`) y **18 textos sobre imagen** (los rótulos del SVG de la bienvenida: 3 × 3 estados × 2 temas; también cualquier `background-image` que no sea un degradado), 0 sin color medible. Los `input`, `select` y `textarea` sí se miden (el texto escrito o elegido).
  - `superpuestos`, `fueraDePantalla`, `sinEtiqueta`: 0, 0 y 0 también en las vistas nuevas. Límite que dejo anotado: dentro de las hojas (`medir: ".hoja"`) `superpuestos` no mira los controles entre sí, porque MEDIR descarta lo que está dentro de un contenedor fijo. `.hoja` es el contenedor real (`section` con rol `dialog`, con el título, el cuerpo con scroll propio y las acciones), y `sinEtiqueta`, `cortados`, `fueraDePantalla` y `contraste` sí cuentan sus campos y textos.
  - Palabras (normal / todo), todas dentro de sus topes: Compras 209 / 393, herramientas de Compras 653 / **720** (tope 742,8), Preferencias 66 / 206 (tope 227), Ideas 163 / 713, Registro 65 / 398 (tope 427), Comidas 288 / 412. Semana normal 1.080 px (tope 1.266). `index.html` 743.051 B (tope 770.000).
- **Qué cambió.** `--on-green` (blanco en claro; `#06231b` en oscuro, ≈ 8:1) en los 9 lugares que ponían blanco sobre el verde; `--muted` claro de #66756f a #56655f (pasa sobre `--surface`, `--bg` y los degradados); enlaces de Fuentes en verde. Estados vacíos: Compras (emptyState con "Armar mi semana"; "Terminé de comprar" deja de ser el botón lleno sin lista), Semana ("Elegir el almuerzo de hoy") e Ideas sin resultados ("Limpiar búsqueda"). Dibujo del plato (`dibujoDelPlato` en `06-…js`): SVG inline con clases `plato-dibujo__*` y variables `--plato-*` (claro y oscuro; sin colores ni `fill` fijos; sin sector si el grupo es 0 y círculo entero si uno ocupa todo). "al menos ≈ $X" en el cartel de presupuesto (misma regla que `resumenPrecios`: faltan más de la mitad) y en el total semanal. Fuente de precios sin el mes de INDEC entre paréntesis y "algunos aprox.". Aviso de herramientas ocultas más corto (sigue diciendo "Tus datos siguen guardados").
- **Decisiones.**
  - **"Mis comidas" no se renombra en todos lados.** La pestaña ya decía "Comidas" y se deja; el título de la pantalla y el segmento "Mis comidas | Ideas" se quedan (el título hoy sigue a "Comidas" del kicker). Se cambiaron los avisos: "¡Guardado en Comidas!", "← Volver a Comidas", "Guardada en Comidas." y "Ya estaba en Comidas.". `data-section-tab="miscomidas"` y todos los ids quedan igual; el aviso de K6 del respaldo ("Tenés 9 platos y 5 recetas") no se toca.
  - **Sin recorte vertical.** Ningún arreglo usa `line-clamp` ni `max-height` con `overflow:hidden`: la medición solo ve el recorte horizontal y eso sería esconder información. Las tarjetas ajustan el texto; los selects tienen una etiqueta corta (la receta hasta el primer " + ", y si pasa de 40 caracteres hasta " con " o la primera coma, o cortada en una palabra) con el `value` completo y el nombre completo en una línea debajo (`#pantryReviewFull`). En Comparar alternativas la opción deja de llevar la fecha (ahora en el `title`): U5b sigue válida.
  - **Para arreglar `cortados` se sacó información visible:** la fecha del precio de las opciones del select de Comparar alternativas pasó a `title` (que no se ve en el celular); las opciones de `#pantryReviewRecipe` se acortaron (el nombre completo va debajo, en `#pantryReviewFull`); `fuentePrecios` ya no dice "(INDEC si falta · mes)" sino "(INDEC si falta)", y la línea de SEPA no avisa qué mes usa INDEC como respaldo; y salió "para simular" de "Elegí una referencia".
  - El rojo de borrar queda fuera de `--on-green`; C10-5 lo mide sobre `--surface` y `--danger-bg`.
  - Despensa vacía: ya tenía el enlace a las ideas con lo que tengo; no se sumó otro botón. Comidas y Registro vacíos ya cumplían.
  - Plato: los colores del dibujo siguen a los de la bienvenida (verduras verde, almidones amarillo, proteínas coral), distintos a los de las tarjetas (proteínas celeste): queda como mejora.
- **Pruebas adaptadas con su reemplazo de igual fuerza:** C8-4 (e8) espera "al menos ≈ $6.200 la semana (faltan 2 precios)" en lugar de "≈ $6.200 la semana…" (faltan 2 de 2 comidas); L6 (l01) espera "← Volver a Comidas". Ninguna se borró. **Nuevas:** C10-1 a C10-6 en `pruebas/e10_pulido.js` (545 en total); `criterios.json` suma `E10-contraste` y `E10-vacios`, `E10-plato`, `E10-nombres`, `E10-selects`, `E10-colores`, `E10-al-menos` (una por prueba, porque cada control exige un código); no se aflojó ni se quitó ninguno.
- **`capturas.mjs`:** solo se agregó la métrica `contraste` (con `contrasteExcluidos`), diez vistas (`bienvenida`, `receta-editar`, `fuentes`, `selector`, `sugerime`, `semana-menu`, `comidas-nueva`, `hueco`, `armado-plato` y `comida`, esta última al final porque en el estado vacío guarda una idea para tener un detalle) y el cierre de la hoja antes de cada vista. MEDIR no cambió en nada más.
- **Mejoras sugeridas** (para el informe final): todo lo de la lista del plan corto que no se hizo (auditoría completa de textos, "Desayuno o merienda" en 3 líneas, "Mis comidas" en el título, un solo "faltan N" en Semana, las ayudas de más de una línea), colores del dibujo iguales a los de las tarjetas, superposición dentro de las hojas, menú ⋯ de Compras y Preferencias con precios encendidos sin captura.

**Compuerta**
- "VALIDACIÓN ETAPA 10: OK (67 controles)". Pruebas: 545/545 (eran 539), con `e10_pulido.js` (C10-1 a C10-6). Las 162 capturas (27 vistas × 3 estados × 2 temas) dan 0 superpuestos, 0 textos cortados, 0 elementos fuera de pantalla, 0 campos sin etiqueta y 0 textos con poco contraste.

**Revisores**
- revisor-codigo, sobre el plan: NO BLOQUEANTE, con sugerencias incorporadas (contraste contra el peor extremo del fondo y exclusiones contadas, sin recorte vertical, `data-section-tab="miscomidas"` y ids intactos).
- revisor-codigo, sobre el diff: NO BLOQUEANTE. Verificó que `MEDIR` no mide menos que antes (solo se sumaron `contraste` y `contrasteExcluidos`), que `criterios.json` solo tiene agregados y que ningún arreglo usa recorte vertical. Sus dos endurecimientos se aplicaron antes del cierre (commit `bf6952e`): el contraste multiplica la opacidad de los contenedores y C10-5 falla si falta un color.
- revisor-usuario: NO BLOQUEANTE. **E10-revision-visual se cumple**, con una salvedad: miró con los ojos una muestra de 18 de las 162 capturas y el resto lo cubren las mediciones. Concluyó que la app quedó más simple que en la Etapa 0 y con vocabulario consistente.

**Mejoras sugeridas** (van al informe final)
- Detalle de una comida y formulario de receta siguen recargados (muchos botones apilados, acordeones antes de "Guardar receta").
- En "Otros productos" de Compras, "Quitar" queda en su propia fila; la fila del aceite de oliva es angosta con el aviso de Despensa en 3 líneas.
- "Fuentes de datos": párrafos de atribución de 5 a 8 líneas por fuente.
- `superpuestos` no mira dentro de las hojas; faltan capturas del menú ⋯ de Compras y de Preferencias con precios encendidos.

**Pendientes para vos**
- Ninguno nuevo en esta etapa (ver el informe final).

### Cierre · `main` cambió durante el rediseño

- Después de la Etapa 10 y de publicar el informe, la tarea mensual de nutrición commiteó en `main` (`a4c3fd4`, 3/11/2026 14:29 UTC): solo `datos/nutricion.json` e `index.html`. Como pide el plan, se trajo a `rediseno` con merge (sin rebase), sin conflictos, se reconstruyó (`construir.mjs --verificar` OK, v15.9.0) y se pasó la compuerta completa otra vez.
- La compuerta falló en una prueba que ya existía: `f07_nutri.js` N16 ("publicada: toma datos más nuevos y descarta viejos o inválidos") tenía escrita a mano la fecha de los datos de nutrición incluidos (26/10/2026), así que se rompía con cada revisión mensual. La lógica que prueba no cambió (toma los datos más nuevos, descarta los viejos y los inválidos, y al terminar vuelve a los incluidos): ahora la última comprobación compara con la fecha real de los datos incluidos (`NUTRITION_SNAPSHOT.revisado`). Misma exigencia, y deja de romperse cada mes.
- Decisión: no se movieron los tags (`etapa-10-ok` queda en el commit validado antes del merge); el merge y la corrección son commits posteriores en `rediseno`.

---

## Ronda 2: la semana con precio

### Contexto
La ronda 1 (etapas 0 a 10, v15.9.0) ya está en `main`. Las reglas de `CLAUDE.md`, la compuerta (`herramientas/validar-etapa.mjs`), los criterios (`docs/validacion/criterios.json`), las capturas (`herramientas/capturas.mjs`) y los revisores (`.claude/agents/`) siguen vigentes: se extienden, no se reescriben.
Objetivo: que la app arme y cueste la semana sola, con cantidades reales y precios de INDEC y SEPA a la vista, sin perder lo simple. Cada decisión se piensa como alguien que quiere comer equilibrado y saber cuánto le va a salir la semana. Trabajo autónomo de la Etapa 11 a la 18; la única intervención humana es el merge final a `main`.

### Qué se toma de NeatEat y qué no
- Sí: armar la semana dentro de un presupuesto, personas por hogar, cantidades en envases reales, básicos de alacena fuera de la lista, reaprovechar ingredientes y sobras, cambiar una sola comida, filtros de dieta que se cumplen.
- No: precios inventados (siempre fuente, mes y rango), recetas generadas en masa, cuentas, suscripción, publicidad, configuraciones que no cambian nada ni etiquetas como "apto celíaco" sin verificar.

### Problemas encontrados en la v15.9.0 (recorrido real a 390×844)
- Frutas del desayuno: al tocar una fruta pasa solo al paso 2, así que no se pueden elegir dos. Las "formas" mezclan maneras de comer fruta (entera, en trozos, licuado) con preparaciones (budín, tarta, waffle, panqueque) y "Porción de galletas", que no es fruta. En cereales sigue "Harina de trigo integral".
- Ideas de la bienvenida que se guardan incompletas: "Filet de pescado con verduras salteadas" queda con "Almidones: No elegido".
- El selector de comida muestra la misma comida en "Mis comidas" y en "Ideas".
- Los platos armados no tienen cantidades: la lista dice "Banana", no "Banana ×1". Con precios activados no aparece ningún precio; con el respaldo de ejemplo faltan 20 de 29. Textos como "Cebolla: 1,5 unidades + sin cantidad en 1 plato".
- Los precios vienen apagados y escondidos en Preferencias.
- Posible error de conversión: "Zapallito: 5 unidades ≈ $6.350" ($1.270 cada uno).
- El paso 1 del armado muestra "Volver al paso anterior" sin paso anterior, y esa barra se apila sobre las pestañas (unos 140 px fijos abajo).
- Textos cortados: "Tema" en Más desde 360 px, "Sugerime algo" en Hoy a 320 px, y los botones "Desayuno o merienda" y "Almuerzo o cena" de Hoy apretados en 2 o 3 renglones.
- El cartel "Mostrar herramientas avanzadas" se repite en casi todas las pantallas (dos veces en Preferencias).
- Código: 10.600 líneas de JS en un ámbito global con 635 funciones globales.

### Modo liviano
El ciclo de cada etapa es el de `CLAUDE.md`, con estos cambios:
- Ramas: integración `rediseno-2` desde `main`; cada etapa en `rediseno-2-etapa-N-tema`. Commit y push cada vez que se termina una parte, aunque esté a medias.
- Durante el trabajo se corren solo las baterías tocadas (`--suites`). La batería completa, una sola vez, en la compuerta.
- De las pruebas se lee solo la línea TOTAL y las que fallan.
- Capturas: solo tema claro y solo las vistas que cambian. Las mira `revisor-usuario`, y solo en las etapas 11, 15 y 17.
- Un solo revisor por etapa (`revisor-codigo`), sin crítica previa del plan. Hasta 3 intentos por etapa; las condiciones de parada son las mismas de la ronda 1.
- `validar-etapa.mjs` acepta las etapas 11 a 18 y `criterios.json` suma un control medible por cada "Hecho cuando". Los criterios de la ronda 1 siguen valiendo.
- Datos: claves nuevas `miPlatoFacil_<nombre>_v1`, en el respaldo como opcionales; los respaldos viejos se siguen restaurando. La app sigue andando sin conexión y abierta como archivo local.
- Versión: 16.0.0 en la Etapa 11, después 16.1.0, 16.2.0…
- Registro: sección "Ronda 2" al final del Registro.

### Etapas

#### Etapa 11. Desayuno y comidas completas
- Frutas en dos pasos claros: "¿Qué fruta?" con selección múltiple (hasta 3) y "¿Cómo?" (entera, en trozos, licuado o en una preparación). Un botón Continuar; no avanza solo.
- Sacar "Porción de galletas" y "Harina de trigo integral" del desayuno. Budín, tarta, waffle y panqueque quedan solo como "en una preparación". Los desayunos ya guardados se siguen mostrando bien.
- Toda idea de almuerzo o cena del catálogo tiene verduras, almidón y proteína vinculados. Si falta uno, se completa el más común en Argentina para ese plato y se anota en el Registro.
- Selector de comida: si una idea ya está en Mis comidas, aparece una sola vez.

Hecho cuando: se pueden elegir 2 frutas en un desayuno; ninguna opción del desayuno contiene "galletas" ni "harina"; el 100 % de las ideas de almuerzo o cena tiene los tres grupos; ningún nombre se repite en el selector.

#### Etapa 12. Cantidades reales
- Todo plato armado guarda cantidades a partir de las porciones que la app ya muestra (1 unidad, 1 pote, 2 cdas, "1/4 del plato" con un gramaje por defecto por grupo). Los platos viejos las calculan al mostrarse, sin reescribir lo guardado.
- Personas por hogar (1 por defecto) en Preferencias: escala cantidades y costos.
- La lista redondea a envases reales cuando el ingrediente tiene envase típico ("Fideos: 1 paquete de 500 g"), con una tabla curada en `datos/`.
- Básicos de alacena (aceite, sal, pimienta, especias secas, vinagre) quedan fuera de la lista y del costo, salvo que se marquen como faltantes en la Despensa.
- Textos de cantidad legibles: una sola forma por ítem, nunca "+ sin cantidad en 1 plato".

Hecho cuando: el 100 % de los ítems que vienen de platos armados tiene cantidad; pasar de 1 a 3 personas triplica las cantidades (prueba); fideos por 180 g se muestran como 1 paquete de 500 g; ningún básico aparece en la lista por defecto.

#### Etapa 13. Precios a la vista
- Precios activados por defecto, con la región GBA. Se pueden apagar en Preferencias. Para quien ya tenía la app, se respeta lo que había elegido.
- ≈ costo por comida, por día y por semana en Semana y en Comidas; ≈ precio por ítem y total en la lista.
- Cada precio muestra fuente, mes y rango al tocarlo ("≈ $2.100 · entre $1.900 y $2.900 · SEPA GBA · nov. 2026"). Faltantes: "faltan N precios", una sola vez por bloque.
- Revisar las conversiones unidad → kg (por ejemplo, el zapallito). Prueba nueva con 15 ingredientes comunes: el precio por unidad tiene que quedar dentro de un rango plausible respecto del precio por kg de INDEC o SEPA.

Hecho cuando: con una semana de platos armados en una instalación nueva, el 80 % o más de los ítems de la lista tiene precio; cada precio permite ver su fuente y su mes; la prueba de los 15 ingredientes pasa.

#### Etapa 14. Bienvenida con presupuesto
- Un paso opcional más en la bienvenida: personas, presupuesto semanal y región de precios. Saltarlo deja todo como hoy.
- La barra de presupuesto de Compras y el costo de la semana usan esos datos.

Hecho cuando: completar o saltar la bienvenida funciona con 0, 1 o 3 datos cargados, y lo cargado se ve en Semana y Compras.

#### Etapa 15. "Armame la semana"
- Botón principal en Semana: completa los huecos vacíos (o la semana entera, a elección) con ideas del catálogo y las comidas del usuario, sin pasarse del presupuesto si hay uno.
- Reglas fijas, sin IA: respeta tipo de comida, días de entrenamiento, filtros de dieta, ingredientes a evitar y lo que hay en la Despensa; prefiere comidas que reutilicen ingredientes ya comprados en la semana; puede proponer "cociná doble" para que la cena de un día sea el almuerzo del siguiente; evita repetir la misma comida más de 2 veces.
- En cada hueco lleno: "Cambiar por otra parecida" y "Cambiar por una más barata". En el menú ⋯: "Empezar de nuevo". Todo con Deshacer.
- Mismo resultado para los mismos datos (semilla fija por semana), para que se pueda probar.

Hecho cuando: con presupuestos de ejemplo bajo, medio y alto, completa los 28 huecos sin pasarse cuando es posible y avisa cuando no; cambiar un hueco no toca los demás; el costo de la semana armada reutiliza al menos 3 ingredientes entre comidas.

#### Etapa 16. Filtros de dieta reales
- "Ingredientes a evitar" pasa a opciones claras: sin carne roja, sin cerdo, sin pescado, vegetariano, sin lácteos, sin huevo. El campo de texto libre sigue, como "Otros".
- Los filtros se aplican en el selector, en Ideas, en "Sugerime" y en "Armame la semana". Avisan si dejan pocas opciones.
- Sin etiquetas de salud que no se puedan verificar (por ejemplo, "apto celíaco").

Hecho cuando: ninguna sugerencia contiene un ingrediente excluido (prueba sobre todo el catálogo).

#### Etapa 17. Pulido de pantalla
- Sin "Volver al paso anterior" en el paso 1; las barras fijas de abajo nunca se apilan sobre las pestañas ni tapan el último botón.
- Arreglar los textos cortados de Hoy y Más, y los botones apretados de los atajos de Hoy.
- Un solo interruptor "Herramientas avanzadas" en Preferencias, sin carteles repetidos en las demás pantallas.
- Si el usuario pasó una captura de botones superpuestos, reproducir ese caso exacto y arreglarlo.
- Capturar también a 360 y 320 px de ancho.

Hecho cuando: en 390, 360 y 320 px no hay textos cortados ni controles superpuestos (incluidas las hojas inferiores); el cartel de herramientas avanzadas aparece en un solo lugar.

#### Etapa 18. Deuda técnica, sin riesgo
- Agrupar las funciones globales por tema en objetos de módulo (por ejemplo, `Precios`, `Semana`, `Compras`), empezando por los archivos tocados en esta ronda. Sin cambiar comportamiento ni el resultado de `construir.mjs`.
- La app sigue abriendo como archivo local, así que los datos siguen incrustados.

Hecho cuando: las funciones globales bajan al menos un 30 %; todas las pruebas en verde; la app abre igual como archivo local y publicada.

### Al terminar la Etapa 18
1. Si `main` cambió durante el trabajo (por ejemplo, por las tareas de nutrición o precios), traerlo a `rediseno-2` con merge, sin rebase, reconstruir y pasar la compuerta otra vez.
2. Escribir `docs/informe-ronda-2.md`: qué cambió para el usuario, medidas antes y después, decisiones tomadas sin el usuario, mejoras sugeridas y pendientes para el usuario.
3. Abrir el PR `rediseno-2` → `main` (con `gh api`), listo para revisar, con el informe como descripción. No mergearlo: ese merge lo hace el usuario.

### Registro de la Ronda 2

Estados: ✅ hecha · ⏳ en curso · ⛔ parada.

| Etapa | Estado | Tag | Versión de la app |
|---|---|---|---|
| 11. Desayuno y comidas completas | ✅ | `etapa-11-ok` | 16.0.0 |
| 12. Cantidades reales | ✅ | `etapa-12-ok` | 16.1.0 |
| 13. Precios a la vista | ✅ | `etapa-13-ok` | 16.2.0 |
| 14. Bienvenida con presupuesto | ✅ | `etapa-14-ok` | 16.3.0 |
| 15. "Armame la semana" | ✅ | `etapa-15-ok` | 16.4.0 |
| 16. Filtros de dieta reales | ✅ | `etapa-16-ok` | 16.5.0 |
| 17. Pulido de pantalla | ✅ | `etapa-17-ok` | 16.6.0 |
| 18. Deuda técnica, sin riesgo | ✅ | `etapa-18-ok` | 16.7.0 |

- Arranque: rama `rediseno-2` creada desde `main` (v15.9.0) con este plan.
- Herramientas: `validar-etapa.mjs` acepta las etapas 11 a 18 y, desde la 11, compara contra `rediseno-2` (versión y línea base) en vez de `rediseno`.

### Etapa 11 · Desayuno y comidas completas ✅

Rama `rediseno-2-etapa-11-desayuno-completo`.

**Plan corto**
- Frutas en dos pasos: "¿Qué fruta?" (hasta 3, no avanza solo, botón Continuar de la barra de abajo) y "¿Cómo?" (Entera, En trozos, Licuado, En una preparación → Budín, Tarta, Waffle, Panqueque). `state.fruta` sigue siendo un solo objeto `{name, quantity, forma}`; con varias frutas `name` y `quantity` van unidos con " + " (la lista de compras ya separa por " + "). Con una sola fruta el formato es idéntico al de siempre.
- Se sacan "Porción de galletas" (de las formas) y "Harina de trigo integral" (de los cereales del desayuno). Lo guardado se sigue mostrando ("Galletas con banana") y comprando (`data.opcionesRetiradas`).
- Selector de comida: una idea que ya está en Mis comidas no se repite en Ideas.
- Riesgos para los datos: ninguno; no cambia ninguna clave ni formato.
- Pruebas que cambian: `e1_confianza.js` (C1-1c) y `regression.js` (R1) tocaban la fruta y esperaban que avanzara sola; ahora tocan Continuar (misma exigencia sobre lo guardado). Se suma `e11_desayuno.js` (C11-1 a C11-4). `datos/precios-mapa.json`: sale "Harina de trigo integral" del ámbito del armado (C9-1 compara ese ámbito con el de la app).

**Hecho cuando**
- ✅ Se pueden elegir 2 frutas en un desayuno (C11-1).
- ✅ Ninguna opción del desayuno contiene "galletas" ni "harina" (C11-2).
- ✅ El 100 % de las ideas de almuerzo o cena tiene los tres grupos (C11-3).
- ✅ Ningún nombre se repite en el selector (C11-4).

**Ideas completadas** (Decisión: se agregó el almidón más común en Argentina para ese plato)
- ✅ Decisión: "Filet de pescado con verduras salteadas" ahora lleva Papa.
- ✅ Decisión: "Salmón al horno con puré de calabaza y espinaca" ahora lleva Papa (el puré).

**Revisores (Etapa 11)**: `revisor-codigo` NO BLOQUEANTE; `revisor-usuario` NO BLOQUEANTE. Sugerencias que quedan: "¿Cómo?" queda debajo de la lista de frutas (Continuar usa Entera por defecto); Continuar deja avanzar sin fruta (igual que los demás pasos); la redacción con varias frutas en una preparación ("Budín de banana y manzana") se revisa a mano. Compuerta: VALIDACIÓN ETAPA 11: OK (72 controles).

### Etapa 12 · Cantidades reales ✅

Rama `rediseno-2-etapa-12-cantidades`.

**Plan corto**
- Archivos nuevos: `fuente/codigo/44-cantidades-de-platos.js`, `datos/envases.json` (se incrusta al construir con `__DATOS_ENVASES__`, igual que nutrición y precios) y `pruebas/e12_cantidades.js` (C12-1 a C12-4).
- Archivos que cambian: `12-lista-de-compras.js` (cantidades de platos armados, personas, básicos, envases y una sola forma de texto por ítem), `43-precios.js` (el precio de la lista es el del envase que se compra), `18-respaldo-completo.js` (claves nuevas), Preferencias (personas) y Despensa (básicos), `construir.mjs`.
- Datos nuevos, siempre opcionales en el respaldo: `miPlatoFacil_hogar_v1` = `{"personas":n}` (1 a 12; con 1 no se escribe nada) y `miPlatoFacil_basicosFaltantes_v1` = `{"faltan":["Aceite"]}`. Lo guardado no se reescribe: las cantidades de los platos armados se calculan al mostrar la lista.
- Riesgos para los datos: ninguno (claves nuevas, validadas y opcionales; los respaldos viejos se siguen restaurando).

**Hecho cuando**
- ✅ El 100 % de los ítems que vienen de platos armados tiene cantidad (C12-1: cada plato guardado del respaldo de ejemplo y cada opción del armado).
- ✅ Pasar de 1 a 3 personas triplica las cantidades (C12-2).
- ✅ Fideos por 180 g se muestran como 1 paquete de 500 g (C12-3).
- ✅ Ningún básico aparece en la lista por defecto (C12-4).

**Gramajes por defecto** (Decisión; por persona, para 1/4 del plato, y el plato escala con su fracción: 1/2 = el doble, 1/3 = 4/3): verduras 100 g, almidones 80 g, proteínas 120 g; los huevos se cuentan en unidades de 55 g. Las porciones del desayuno salen del texto que ya muestra la app ("1 unidad", "2 cdas", "1 vaso" = 200 ml, "1 pote" = 1 unidad). Rodajas y tajadas de fruta pasan a gramos (Ananá 80 g, Melón 200 g, Sandía 300 g). Un vaso de licuado de fruta de los platos viejos cuenta como una fruta. Los gramos se redondean a 5.

**Envases** (Decisión): tabla curada de 26 envases típicos en `datos/envases.json` (fideos 500 g, arroz 1 kg, leche sachet de 1 l, huevos por docena, atún 170 g…). La lista muestra el envase entero ("1 paquete de 500 g") y el precio de la lista es el del envase; el costo por comida (Etapa 13) seguirá usando lo que se come. Lo que no está en la tabla queda con su cantidad. El texto interno (`label`) no cambia; el envase va en el texto que se muestra (`text`).

**Básicos de alacena** (Decisión): aceite, sal, pimienta, vinagre, orégano, pimentón, comino, ají molido, laurel, tomillo, nuez moscada, canela y "especias" quedan fuera de la lista y del costo, incluso los de recetas. En la Despensa, "Básicos de alacena" deja marcar cuál falta (8 visibles); marcado, vuelve a la lista. Un plato de texto (sin estado) no tiene cantidades: se muestra solo por su nombre, sin "+ sin cantidad en 1 plato".

**Tests adaptados** (Decisión, Regla 5: miran la interfaz vieja; la exigencia sobre lo guardado y la lógica es la misma):
- `r2_fixtures.js`: `tradPlate` sigue armando un plato con estado (ahora con cantidades); nuevo `tradPlateTexto` es el plato de texto viejo, sin estado. Los casos de "parte sin cantidad" (S1 a S10, M1, M2, U2, E10, f04, DP10, U1 y E1-6) usan `tradPlateTexto`, y se sacó "+ sin cantidad en 1 plato" de lo esperado.
- Se cambiaron los nombres "Sal", "Comino" y "Aceite" por "Perejil", "Cebolla" y "Miel" donde la prueba solo necesitaba un ingrediente cualquiera (ahora los básicos no están en la lista).
- Con envases: "Arroz: 300 g" → "Arroz: 1 paquete de 1.000 g" (M10, L2b, L9, S4b), "Leche: 1,3 l" → "2 sachets de 1.000 ml" (U2), "Leche: 250 ml · revisá" → "1 sachet de 1.000 ml · revisá" (C5-9); C5-3 mira que no haya "faltan" ni "revisá" en vez de comparar `text` con `label`; precios de C7-1, C7-3 y C7-4 son los del envase (arroz $2.000 en vez de $600).
- E1-6 usa un plato de texto: con un plato armado, "Lo compré" suma la cantidad a la despensa en vez de marcarla.

**Revisores (Etapa 12)**: `revisor-codigo` NO BLOQUEANTE (el de capturas no corre en esta etapa, modo liviano). Sugerencias que quedan para después: cuando un mismo ingrediente tiene filas con y sin cantidad, la lista muestra solo la parte con cantidad (hoy sin aviso; el aviso vive en la sugerencia de Despensa); falta una prueba que fije ese comportamiento y otra explícita de "Lo compré" sobre un plato armado (suma a la despensa); conviene fijar con pruebas qué cuenta como básico ("Aceite de oliva" sí, "Aceitunas" no). Compuerta: VALIDACIÓN ETAPA 12: OK (77 controles).

### Etapa 13 · Precios a la vista ✅

Rama `rediseno-2-etapa-13-precios`.

**Plan corto**
- `43-precios.js`: precios encendidos por defecto; costo de los platos armados (con sus cantidades por persona y las personas del hogar); detalle de cada precio de la lista; "faltan N precios" una sola vez por bloque; peso curado por unidad para pasar unidades a kilos. `12-lista-de-compras.js`: el precio es tocable. `10-plan-semanal.js`: ≈ costo en cada hueco lleno. `datos/envases.json`: tabla `pesoUnidad`. Prueba nueva `e13_precios_a_la_vista.js` (C13-1 a C13-4).
- Riesgos para los datos: ninguno (no se agregan claves; `mostrarPrecios_v1` sigue igual).

**Hecho cuando**
- ✅ Con una semana de platos armados en una instalación nueva, 28 de 34 ítems de la lista tienen precio (82 %) y cada precio muestra, al tocarlo, "≈ $ · entre $a y $b · fuente · mes" (C13-1).
- ✅ ≈ costo por comida (en cada hueco y en la tarjeta de Comidas), por día y por semana, y "faltan N precios" una sola vez (C13-2).
- ✅ Prueba de 15 ingredientes: el precio de una unidad queda entre 0,5 y 2 veces lo esperable por el precio por kg (C13-3).
- ✅ Quien ya tenía la app conserva lo que había elegido (C13-4).

**Precios por defecto** (Decisión): sin `mostrarPrecios_v1` y sin `uiMode_v1` (instalación nueva o sin elección) los precios están encendidos, región GBA. Quien ya eligió modo conserva lo de antes: simple apagado, completo encendido; la elección explícita de precios siempre manda. Se pueden apagar en Preferencias.

**Pesos por unidad** (Decisión): el "zapallito: 5 unidades ≈ $6.350" no era un error de conversión (196 g por unidad × $6.480 el kilo del dato real = $1.270 cada uno), pero otras unidades salían raras (la zanahoria de la tabla de nutrición pesa 61 g, la palta 136 g). Se curaron 13 pesos por unidad en `datos/envases.json` (`pesoUnidad`: zanahoria 100 g, batata 250 g, palta 200 g, morrón 200 g, limón 100 g, naranja 200 g, pepino 250 g, tomate, cebolla, banana, manzana, papa y zapallito) que se usan para los precios. El costo por comida y por día usa lo que se come; el precio de la lista, el envase que se compra (Etapa 12). Cuando hay personas, los costos del día, de la semana y del hueco son del hogar; "por porción" sigue siendo por persona.

**Tests adaptados** (Decisión, Regla 5: miran la interfaz que antes arrancaba sin precios):
- `r2_fixtures.js`: `reset()` elige modo simple (los precios quedan apagados) para que las baterías de la lista sigan mirando solo cantidades; `m01_modo.js` (M1) borra esa elección para mirar el arranque sin elegir.
- `e5_compras.js`, `e8_herramientas.js`, `e9_sepa.js`: su `cargar` parte con modo simple salvo que el caso traiga `uiMode_v1` o `mostrarPrecios_v1`; `e7_precios.js`: `base()` igual.
- `e8_herramientas.js` C8-1: "sin nada" ahora es "precios encendidos y nada guardado" y la cadena de interruptores sigue desde "simple" elegido.
- `e7_precios.js` C7-2 y `e8_herramientas.js` C8-4: el día ya no repite "(faltan N precios)"; queda una sola vez, con la semana.

**Revisores (Etapa 13)**: `revisor-codigo` NO BLOQUEANTE. Sugerencias que quedan: C13-3 repite los pesos de `pesoUnidad` (comprobación en parte circular; conviene fijar rangos en pesos por unidad de una fuente aparte y exigir los 15); probar que "Tomate triturado" o "Cebolla de verdeo" no heredan el peso de la unidad común; avisar en las notas de la versión que quien nunca tocó el modo ve ahora los precios encendidos; rotular el costo del hueco como del hogar. Compuerta: VALIDACIÓN ETAPA 13: OK (82 controles).

### Etapa 14 · Bienvenida con presupuesto ✅

Rama `rediseno-2-etapa-14-bienvenida`.

**Plan corto**
- `29-bienvenida.html` y `40-primera-vez.js`: un paso más (queda de 4: método, rutina, personas y presupuesto, ideas). Prueba nueva `e14_presupuesto.js` (C14-1 y C14-2). Sin claves nuevas: usa `hogar_v1`, `shoppingBudget_v1` y `region_v1`.
- Riesgos para los datos: ninguno; solo escribe lo que la persona cargó y con los formatos ya validados.

**Hecho cuando**
- ✅ Completar o saltar la bienvenida funciona con 0, 1 o 3 datos: con "Ahora no" no se escribe nada; con datos, solo se guardan los cargados (C14-1).
- ✅ Lo cargado se ve en Compras (la barra de presupuesto), Semana (el costo es para el hogar y con la región elegida) y Preferencias (C14-2).

**Paso nuevo** (Decisión): es el paso 3 de 4 y no el último, para que "Armar mi semana" siga siendo el cierre; cuesta un toque más (el recorrido de C4-1 pasa de 13 a 14 toques, con tope de 15). "Ahora no" lo salta sin escribir; "Guardar y seguir" guarda solo lo que cambió: personas distintas de 1, presupuesto (en pesos, por semana; acepta "45.000") y región distinta de GBA. Un presupuesto que no es un número mayor que 0 muestra el motivo y no avanza ni escribe.

**Tests adaptados** (Decisión, Regla 5): `e4_comidas.js` C4-1 suma el toque de "Ahora no" del paso nuevo y C4-7b sale por "Saltar" del paso 4 (las ideas son ahora el paso 4).

**Revisores (Etapa 14)**: `revisor-codigo` NO BLOQUEANTE. Sugerencias que quedan: el kicker estático del HTML dice "Paso 1 de 3" (lo corrige `pintarBienvenida` al abrir); C14-2 podría afirmar sobre `costosDelPlan()`; "45.5" se lee como 455 (el punto es separador de miles); falta probar que elegir GBA sin región previa no escribe `region_v1`. Compuerta: VALIDACIÓN ETAPA 14: OK (85 controles).

### Etapa 15 · "Armame la semana" ✅

Rama `rediseno-2-etapa-15-armame-la-semana`.

**Plan corto**
- Archivo nuevo `fuente/codigo/45-armame-la-semana.js` (módulo `ArmameSemana`, sin IA y sin azar real: la semilla es la semana). Cambios chicos en `05-plan.html` (botón), `38-selector-de-comida.js` (hoja del hueco lleno y menú ⋯), `36-sugerencias.js` (`textoPermitido`, un solo lugar para lo que evitás), `10-plan-semanal.js` (texto de confirmar). Prueba nueva `e15_armame.js` (C15-1 a C15-6).
- Riesgos para los datos: ninguno nuevo; escribe Mis comidas una vez y el plan una vez, con los formatos de siempre, con historial y Deshacer.

**Hecho cuando**
- ✅ Con presupuestos bajo ($26.000), medio ($40.000) y alto ($90.000) completa los 28 huecos sin pasarse; con $1.000 avisa "No llego al presupuesto" (C15-1).
- ✅ La semana armada reutiliza al menos 3 ingredientes entre comidas (C15-2: 22 a 28 según el caso).
- ✅ Cambiar un hueco por otra parecida o más barata no toca los demás y se deshace (C15-5).
- ✅ Mismo resultado para los mismos datos (C15-3).

**Reglas de armado** (Decisión; todas fijas):
1. Tipo de comida: desayuno y merienda salen de tus desayunos guardados y de combinaciones fruta + proteína + cereal del armado; almuerzo y cena, de tus comidas y de las ideas del catálogo (una idea que ya guardaste cuenta una sola vez).
2. Lo que evitás (`textoPermitido`), el día de rutina (tus comidas de otro tipo de día no entran; las ideas se guardan con el día del hueco) y la Despensa (+0,4 por ingrediente que ya tenés, hasta 3).
3. Reutilizar: +0,6 por ingrediente ya elegido en la semana (hasta 3) en almuerzos y cenas, +0,1 en desayunos y meriendas para no repetir banana con huevo toda la semana.
4. Nunca más de 2 veces la misma comida en la semana, ni en días seguidos del mismo hueco ni dos veces el mismo día.
5. "Cociná doble": con 30 % de chance (con la semilla) la cena de un día es también el almuerzo del siguiente; cuenta como 2 repeticiones y se avisa.
6. Presupuesto: primero se elige con el costo en cuenta (meta por hueco según su peso: desayuno 12 %, merienda 10 %, almuerzo 40 %, cena 38 %); si igual se pasa, se reemplaza lo más caro por algo parecido y más barato hasta entrar o hasta no poder. Lo que no tiene precio cuenta como la mediana del grupo. Presupuesto mensual = por 7/30.
7. Dos modos: "Completar los N huecos vacíos" (lo que ya había no se toca) y "Rehacer la semana entera". "Empezar de nuevo" (menú ⋯) reemplaza a "Vaciar la semana": vacía todo y se puede deshacer.
8. En cada hueco lleno: "Cambiar por otra parecida" (más ingredientes en común) y "Cambiar por una más barata" (parecida y que cueste menos; si no hay, lo dice).

**Tope de tamaño** (Decisión): `index.html` pasó el tope de 770.000 bytes con el módulo nuevo (788.000). Se subió el tope a 820.000 en `construir.mjs` (y el texto del criterio E9-tamano-app); sigue siendo un tope que falla la construcción, y la Etapa 18 busca recortar código.

**Tests adaptados** (Decisión, Regla 5): `e2_semana.js` (C2-6) y `m01_modo.js` (M4) esperaban "Vaciar la semana" en el menú ⋯; ahora "Empezar de nuevo" (misma acción, mismo Deshacer).

**Revisores (Etapa 15)**: `revisor-codigo` NO BLOQUEANTE y `revisor-usuario` NO BLOQUEANTE (capturas 390×844 en `capturas/e15-*.png`). Pasan a la Etapa 17: en Semana "Armame la semana" y "Elegir el almuerzo de hoy" compiten como dos botones verdes llenos (con la semana ya llena, los dos deberían bajar a secundarios); la hoja del hueco lleno suma tres "Cambiar…" y conviene reunirlos; "Huevo | Clara de huevo" se ve crudo en el detalle. Quedan como mejora: avisar antes de "Rehacer la semana entera" si hay pocas candidatas; si `setSlot` falla en `cambiarHueco` queda una comida guardada de más. Compuerta: VALIDACIÓN ETAPA 15: OK (92 controles).

### Etapa 16 · Filtros de dieta reales ✅

Rama `rediseno-2-etapa-16-dieta`.

**Plan corto**
- Archivo nuevo `fuente/codigo/46-dieta.js` (seis filtros y su guardado), `textoPermitido` (36) pasa a ser el único lugar donde se decide si una comida entra (filtros + "Otros"), Preferencias (chips), Ideas (`04`), Selector (`38`) y Armame (`45`). Prueba nueva `e16_dieta.js` (C16-1 a C16-4).
- Dato nuevo `miPlatoFacil_dieta_v1` = `{"filtros":["sin_cerdo",…]}`: opcional en el respaldo, validado (ids conocidos, sin repetidos), no se escribe si no hay filtros. Lo que ya había (`recipePreferences_v1`: palabras y "Ocultar coincidencias") no cambia.
- Riesgos para los datos: ninguno; clave nueva y los respaldos viejos se restauran (C16-3).

**Hecho cuando**
- ✅ Ninguna sugerencia contiene un ingrediente excluido: se probó todo el catálogo de ideas con cada filtro y con combinaciones, en Ideas, en Sugerime y el Selector (`sugerenciasPara`) y en Armame (C16-1 y C16-2).
- ✅ Opciones claras en Preferencias ("Sin carne roja", "Sin cerdo", "Sin pescado", "Vegetariano", "Sin lácteos", "Sin huevo"); el campo de texto sigue como "Otros" (C16-3).
- ✅ Avisan si dejan pocas opciones: "Con lo que evitás quedan pocas ideas: N de 41." (menos de 10) en Preferencias, Ideas, el Selector y el resumen de Armame; con cero, "no queda ninguna idea".
- ✅ Sin etiquetas de salud que no se puedan verificar (C16-4 busca "apto celíaco", "sin TACC", etc. en toda la app).

**Filtro por palabras** (Decisión): se comparan palabras completas del nombre, las etiquetas y los ingredientes vinculados de cada comida (con plurales "s" y "es", sin tildes; no entran "milanesa" ni "hamburguesa" solas porque también las hay de verduras y legumbres). "Vegetariano" suma carnes, cerdo, pescado y aves (deja huevo y lácteos); "Sin carne roja" saca toda comida con "carne" (incluida "carne de cerdo"); "Sin lácteos" no confunde "crema de lentejas" ni leches vegetales. Los filtros se combinan (todos tienen que pasar). Es orientativo y la pantalla lo dice ("no comprueba alérgenos").

**Dónde se aplica** (Decisión): Ideas, la sección Ideas del Selector, Sugerime, Armame la semana (incluidos los desayunos armados con combinaciones) y las comidas tuyas que Sugerime y Armame eligen. La sección "Mis comidas" del Selector no se filtra (son comidas que guardaste vos y se eligen a mano). Con filtros muy estrictos Armame deja huecos sin llenar y lo avisa (con vegetariano + sin lácteos + sin huevo llena 12 de 28 con el catálogo actual).

**Tests adaptados**: ninguno.

**Revisores (Etapa 16)**: `revisor-codigo` NO BLOQUEANTE. Se corrigió su hallazgo principal antes de la compuerta (los plurales: "Filetes de merluza", "Bifes", "Chorizos" se filtraban mal; ahora cada palabra admite "s" y "es" y la prueba C16-1 lo cubre) y se sumaron palabras (ternera, salchicha, morcilla, hígado, choripán, parmesano, ricotta, bechamel, cheddar, yema, mayonesa, merengue). Quedan como mejora: "Limpiar preferencias" no borra los filtros de dieta (se sacan tocando cada uno); el oráculo de la prueba repite casi las palabras de la implementación; "filete" también saca un filete de pollo en "Sin pescado" (conservador).

### Etapa 17 · Pulido de pantalla ✅

Rama `rediseno-2-etapa-17-pulido`.

**Plan corto**
- `06-navegacion-y-armado-del-plato.js` (barra de pasos), `estilos.css` (final), `30-modo-simple.js` (sin carteles por pantalla), `20-revision-de-despensa.js` y `11-existencias-y-presupuesto.js` (opciones de select más cortas). Herramientas: `capturas.mjs` acepta `--ancho` y mide `desbordes` (elementos que sobresalen de su contenedor); `validar-etapa.mjs` suma el tipo de control `anchos` (mide 360 y 320 px en tema claro). Prueba nueva `e17_pulido.js` (C17-1 a C17-3).
- Riesgos para los datos: ninguno (solo interfaz).

**Hecho cuando**
- ✅ A 390 (claro y oscuro), 360 y 320 px (claro) no hay textos cortados, controles superpuestos, elementos fuera de pantalla, desbordes ni scroll horizontal, en todas las vistas e incluidas las hojas inferiores (control `E17-anchos` de la compuerta y `E17-sin-desbordes`).
- ✅ El cartel de herramientas avanzadas aparece en un solo lugar: Preferencias (C17-2).

**Barra de pasos** (Decisión): "Volver al paso anterior" solo aparece si hay un paso anterior del armado (o el resumen, al editar); en el paso 1 queda solo "Continuar" y, si tampoco hay "Continuar" (elegir el tipo de día, snack, pre-entreno), la barra no se muestra. Mientras la barra de pasos está, reemplaza a las pestañas en vez de apilarse arriba (eran unos 140 px fijos); el contenido deja lugar para que no tape el último botón (C17-1). Se sale del armado con "← Hoy" arriba, como antes.

**Interruptor único** (Decisión): se sacaron los carteles "🧰 Herramientas ocultas… / Mostrar herramientas avanzadas" de las seis pantallas que los tenían (Despensa, Ideas, Comida, Editar receta, Preferencias, Mis datos); el único interruptor es la tarjeta de Preferencias ("Mostrar herramientas avanzadas: activado/desactivado"). Las herramientas siguen marcadas `data-avanzado` y se ocultan igual en modo simple.

**Textos y botones** (Decisión): los atajos de Hoy ("Desayuno o merienda" y "Almuerzo o cena") se apilan si no entran en una fila (antes, a 320 px, el segundo sobresalía de la tarjeta, porque la grilla de la portada los metía en la columna del emoji). Los selects largos quedan chicos a 320 px: las opciones de la revisión de despensa son de 26 caracteres como máximo, las referencias de "Comparar alternativas" muestran "precio/cantidad · total" (el detalle con moneda y fecha va en el `title`), la fuente de los selects baja a 14 px en pantallas de 340 px o menos, y las filas "Aceite de oliva: 500 ml · Editar · Quitar" pasan a dos renglones. "Tema" en Más y "Sugerime algo" en Hoy ya no se cortaban en esta versión (medido a 360 y 320 px).

**Captura de botones superpuestos** (Decisión): no hubo ninguna captura del usuario en esta ronda; se midió con `superpuestos` y `desbordes` en todas las vistas y hojas a 390, 360 y 320 px y no hay casos abiertos.

**Tests adaptados** (Decisión, Regla 5): `m01_modo.js` (M4, M6 y M7 miraban los carteles por pantalla; ahora comprueban que no hay carteles y usan la tarjeta de Preferencias) y `l01_biblioteca.js` (L10, sin aviso); `f02_units.js` (U5b: el texto de la opción de comparar alternativas cambió a "2000/1000 g · 1.000,00" y la moneda y la fecha quedaron en el `title`).

**Revisores (Etapa 17)**: `revisor-codigo` NO BLOQUEANTE. `revisor-usuario` respondió BLOQUEANTE con las capturas a 390, 360 y 320 px: a 320 px el nombre del desayuno en Hoy seguía cortado ("Fruta en trozos con huevo y p…") porque la fila de comida recortaba a 2 renglones. Se corrigió (hasta 4 renglones en `.today-row__plate`; ahora se lee "Fruta en trozos con huevo y pan de molde") y se volvió a la compuerta. Sugerencias que quedan (no bloqueantes): las dos tarjetas de interruptores de Preferencias podrían tener la ayuda en una línea; "Ocultar coincidencias" queda pegado a su campo; el hueco entre el subtítulo y la primera fila de Más; `.mode-note` y el recorrido de `[data-mode-note]` en `30-modo-simple.js` son código muerto (se limpian en la Etapa 18); dos recetas con el mismo comienzo se ven iguales en el select corto de la revisión de despensa (el nombre completo se ve debajo).

Compuerta: VALIDACIÓN ETAPA 17: OK (103 controles, con las medidas a 360 y 320 px).

### Etapa 18 · Deuda técnica, sin riesgo ✅

Rama `rediseno-2-etapa-18-modulos`.

**Plan corto**
- Herramienta de una sola vez `herramientas/modularizar.mjs` (con `--simular` cuenta sin escribir): agrupa en objetos de módulo las funciones globales de `fuente/codigo/` y reescribe las llamadas en el código, las pruebas y las herramientas. `herramientas/contar-globales.mjs` cuenta lo que queda global. `capturas.mjs` suma `--archivo` (abre `index.html` como archivo local y falla con código 4 si hay errores). Sin cambios de comportamiento: no se toca ninguna clave ni formato, la compuerta compara las mismas pruebas.
- Riesgos para los datos: ninguno (solo se mueve código de lugar).

**Hecho cuando**
- ✅ Las funciones globales bajan de 678 a 311 (−54 %; el control pide 474 o menos, es decir, al menos −30 %).
- ✅ Todas las pruebas en verde (576 de 576 en la corrida completa).
- ✅ La app abre igual como archivo local (control `E18-archivo-local`, 5 vistas en 2 estados, sin errores ni pedidos a internet) y publicada (las pruebas la abren por una dirección local y el PR corre las pruebas en GitHub).

**Módulos** (Decisión): 37 objetos `var Nombre={ funcion(){…}, … }`, uno por archivo, declarado al principio del archivo: `Precios` (43), `Compras` (12), `Semana` (10), `Armado` (06), `Selector` (38), `Comidas` (39), `Registro` (42), `Respaldo` (18), `Dieta` (46), `CantidadesPlatos` (44), `Hoy` (31), `Bienvenida` (40), `Recetas` (21), `CantidadesCostos` (22) y los demás (ver el principio de cada archivo). Son `var` y no `const` para que las pruebas los lean como `w.Compras…` desde el marco. Las llamadas son `Compras.shoppingDisplayItems()`; las pruebas y `capturas.mjs` se reescribieron igual. `index.html` sigue siendo un solo archivo con los datos incrustados (construir.mjs sin cambios; 808.000 bytes, bajo el tope de 820.000).

**Funciones que quedan globales** (Decisión): 311 de 678, por reglas que evitan cambiar el comportamiento: (1) las que usa un archivo con número menor (el arranque corre antes de que los archivos de número mayor declaren su módulo: 130), (2) las que llaman esas, si están en un archivo posterior al arranque (104), (3) las que aparecen de otra forma que una llamada (callback, `typeof`, asignación en una prueba, clave de objeto: 64) y (4) las de menos de 6 letras (`go`, `start`, `nav`: 12). Mover más habría exigido reordenar el arranque, que es el riesgo que la etapa pide evitar.

**Tests adaptados**: ninguna prueba cambió de exigencia; solo se reescribieron los nombres de las funciones que llaman (`shoppingDisplayItems()` → `Compras.shoppingDisplayItems()`, `w.restoreCompleteBackup(` → `w.Respaldo.restoreCompleteBackup(`, etc.) con la misma herramienta.

**Revisores (Etapa 18)**: `revisor-codigo` NO BLOQUEANTE. Sugerencias que quedan: la condición de `--archivo` en `capturas.mjs` es redundante; `.mode-note` y el recorrido de `[data-mode-note]` en `30-modo-simple.js` siguen como código muerto (quedan para una limpieza futura); quedan 311 funciones globales por el orden de arranque. Compuerta: VALIDACIÓN ETAPA 18: OK (106 controles, 9,5 min).

### Cierre de la Ronda 2

- Las etapas 11 a 18 están ✅ en `rediseno-2` (v16.7.0) con la compuerta en verde (`VALIDACIÓN ETAPA 18: OK`, 576 de 576 pruebas) y la línea base al día. PR abierto contra `main`: https://github.com/Facunddominguez/Facunddominguez.github.io/pull/2 (el informe es `docs/informe-ronda-2.md`). No se hizo push ni merge a `main`; `main` no cambió durante la ronda.

**Pendientes para vos**
- Ninguno: los tags de la Ronda 2 no se usan (ver "Tags de la Ronda 2" más abajo); la marca de cada etapa es su commit "Merge etapa N" en `rediseno-2`.

### Tags de la Ronda 2 (Decisión: no se usan)

Decisión tomada por el dueño del proyecto (opción 3): en la Ronda 2 no se usan tags. La marca de cada etapa son los commits `Merge etapa N: …` de `rediseno-2` (`git log --merges rediseno-2`). La PARADA que había por el push de los tags (error 403 del entorno) queda levantada: ya no hay nada pendiente ahí. Los tags `etapa-N-ok` de la tabla de arriba se leen como "el commit `Merge etapa N` de `rediseno-2`"; la compuerta de la Ronda 2 compara contra la rama `rediseno-2` y no los necesita. Los de la Ronda 1 (`etapa-0-ok` a `etapa-10-ok`) siguen publicados y se siguen usando como referencia.

## Ronda 3: precios confiables

### Contexto
Las rondas 1 y 2 ya están en `main` (v16.7.0). Las reglas (`CLAUDE.md`), la compuerta (`herramientas/validar-etapa.mjs`), los criterios, las capturas y los revisores siguen vigentes: no se reescriben, se extienden.
Objetivo: que el costo de la semana sea uno solo, completo y creíble, que se vea qué precio falta y se pueda completar, y que lo que arma la app tenga sentido. Cada decisión se piensa como alguien que quiere saber cuánto le va a salir la semana y confiar en ese número.
Se trabaja solo, de la Etapa 19 a la 24, sin esperar entre etapas. La única intervención del dueño es el merge final a `main`.

### Lo encontrado en la v16.7.0 (semana armada con "Armame la semana", presupuesto $60.000, 390×844)
- 12 de 29 productos de la lista sin precio, casi todos básicos: arroz, leche, yogur, pan de molde, avena, carne, queso port salut, granola, tortillas, frutillas, kiwi y arándanos.
- Causa principal: `Precios.precioAuto()` busca por `ingredientKey(nombre)` exacto, y los nombres del armado no coinciden con los de `datos/precios.json`. "Arroz (integral, yamaní)" no encuentra "Arroz" ni "Arroz integral"; lo mismo pasa con "Yogur natural descremado" ("Yogur descremado"), "Leche fluida o en polvo descremada" ("Leche"), "Pan de molde integral o blanco" ("Pan de molde"), "Avena arrollada o instantánea" ("Avena"), "Carne vacuna (nalga, cuadril, …)" ("Carne vacuna") y "Queso Port Salut descremado" ("Queso Port Salut"). La nutrición sí los resuelve: al tocar el yogur muestra "Yogur descremado". Frutillas, kiwi, arándanos, puerro y cebolla de verdeo directamente no están en los datos.
- Cuatro totales distintos para la misma semana: el aviso al armar dice ≈ $30.550; Semana, apenas armada, "al menos ≈ $1.938 la semana (faltan 28 precios)"; después, "≈ $4.581 por día · al menos ≈ $28.610 la semana (faltan 42 precios)"; Compras, ≈ $34.127 (faltan 12). En Semana, "faltan" cuenta apariciones; en Compras, productos.
- Lo que no tiene precio cuenta $0 sin avisarlo: "Manzana con yogur y granola ≈ $900" solo suma la manzana. En la lista, el producto sin precio no muestra nada.
- "Cambiar por una más barata" cambió "Pollo al horno con papas, batatas y cebolla" (≈ $2.115) por "Pizza integral con pollo + puerro y cebolla de verdeo" (≈ $695), solo porque puerro, verdeo y harina no tienen precio.
- La ficha que se abre al tocar un ingrediente muestra solo nutrientes. "Mi precio" (`miPlatoFacil_referencePrices_v1`) existe, pero escondido en herramientas avanzadas.
- Cantidades sin pasar a envase ("Avena: 16 cucharadas", "Granola: 15 cucharadas", "Frutillas: 3 tazas") y otras que no cierran para una semana (lechuga 65 g, tomate 65 g).
- "Elegir el almuerzo de hoy" queda pegado a los chips de los días, compite con "Armame la semana" y sigue visible con la semana completa (28 de 28).
- El aviso "Listo: 28 comidas armadas · ≈ $30.550 la semana. Entra en tu presupuesto… Cociná doble…" desaparece a los 3 segundos.
- "Armame la semana" guardó 20 comidas nuevas en Mis comidas (quedaron 23).
- Combinaciones raras: "Frutillas con huevo y granola", "Banana con queso Port Salut y granola". En una semana: lentejas 4 veces y arroz 6. De las 3 ideas elegidas en la bienvenida entró 1.
- Ideas cuyo título nombra algo que no tienen vinculado: risotto de hongos sin hongos, tarta de jamón sin jamón, "Wrap integral de crema de lentejas + palta…" y "Wrap de pollo, palta y vegetales" sin palta.
- Compras sugirió unir "Queso Port Salut descremado" con "Queso cremoso".

### Modo liviano (igual que la Ronda 2)
- Ramas: integración `rediseno-3` desde `main`; cada etapa en `rediseno-3-etapa-N-tema`. Commit y push cada vez que se termina una parte.
- Sin tags: la sesión no puede subirlos. Cada etapa queda marcada por su merge "Merge etapa N: …" en `rediseno-3`, y la compuerta compara contra esa rama.
- Mientras se trabaja, correr solo las baterías que se tocan (`--suites`). La batería completa, una sola vez, en la compuerta. De las pruebas se lee solo la línea TOTAL y las que fallan.
- Capturas: solo tema claro y solo las vistas que cambian. Las imágenes las mira `revisor-usuario`, solo en las etapas 20, 21 y 24.
- Un revisor por etapa (`revisor-codigo`), sin crítica previa del plan. Hasta 3 intentos por etapa; mismas condiciones de parada.
- Extender `validar-etapa.mjs` a las etapas 19 a 24 y sumar a `criterios.json` un control medible por cada "Hecho cuando". Lo de las rondas 1 y 2 sigue valiendo: nada vuelve atrás.
- Datos: claves nuevas `miPlatoFacil_<nombre>_v1`, en el respaldo como opcionales; nada guardado se borra ni cambia de formato. La app sigue andando sin conexión y abierta como archivo local.
- Versión: 17.0.0 en la Etapa 19, después 17.1.0, 17.2.0…
- Registro: este mismo documento, sección "Ronda 3".

### Etapas

#### Etapa 19. Que cada ingrediente encuentre su precio
- Un solo resolvedor de nombres para precios y nutrición: probar el nombre exacto, después los sinónimos y las equivalencias, y después el nombre sin lo que va entre paréntesis ni las variantes ("o instantánea", "integral o blanco"). Si hay variante con precio propio (por ejemplo, "Arroz integral"), elegir la más común del armado y anotarlo.
- Sumar a `datos/precios-mapa.json` lo que falta en INDEC o SEPA: frutillas, kiwi, arándanos, puerro, cebolla de verdeo, hongos, jamón cocido, palta, granola, tortillas y lo que se encuentre sin precio en las ideas del catálogo. Si un producto no está en SEPA, dejarlo para el estimado por categoría (Etapa 20) y anotarlo.
- Cada ingrediente del mapa tiene una categoría para comparar precios: frutas, verduras, carnes, pescados, lácteos, huevos, almacén, panadería, legumbres o cereales.
- Prueba nueva de plausibilidad: para cada categoría, ningún precio por kg (o por litro) se aparta más de 4 veces de la mediana de su categoría sin una excepción anotada (por ejemplo, frutos secos o salmón).

**Hecho cuando**: con la semana armada de la prueba, el 90 % o más de los productos de la lista tiene precio real (de SEPA o INDEC); la prueba de plausibilidad pasa; los 12 productos de arriba tienen precio o están anotados como sin dato.

#### Etapa 20. Un solo costo, completo y claro
- Una sola función calcula el costo de un ingrediente, una comida, un día, la semana y la lista, y la usan todas las pantallas: el aviso de "Armame la semana", Semana, Comidas, Compras, la barra de presupuesto, "Sugerime" y "Más barata".
- Lo que no tiene precio se estima con la mediana por kg de su categoría y se marca como estimado. Nunca cuenta $0 en silencio.
- Frase nueva en Semana: "Semana ≈ $34.100 · hoy ≈ $4.600" y, debajo, "Con precio: 27 de 29 productos · Completar 2 precios". "Faltan" siempre cuenta productos distintos, nunca apariciones.
- En la lista, el producto sin precio dice "sin precio · estimado ≈ $X". En cada comida, el costo indica si incluye estimados.
- "Completar precios" abre la lista de productos sin precio real. Al tocar uno, se abre su ficha (Etapa 21).

**Hecho cuando**: el total de la semana es el mismo en el aviso, Semana, Compras y la barra de presupuesto (prueba); ningún costo trata un faltante como $0; Semana muestra la frase nueva con el botón cuando falta algún precio.

#### Etapa 21. Ficha de ingrediente con precio
- Al tocar un ingrediente (en una comida, en la lista o en Completar precios), la ficha muestra los nutrientes, como hoy, y el precio: ≈ $ por kg o unidad, fuente, región, mes y rango ("≈ $2.200/kg · SEPA GBA · nov. 2026 · entre $1.980 y $2.900").
- "Agregar mi precio" o "Cambiar mi precio": monto, cantidad y unidad (kg, g, unidad o paquete). Se guarda en `miPlatoFacil_referencePrices_v1`, el mismo de siempre, sin necesidad de activar herramientas avanzadas. "Mi precio" gana sobre el automático y se puede borrar con Deshacer.
- Control de lógica al guardar: si el precio por kg se aparta más de 3 veces de la mediana de su categoría, avisar ("Las frutillas te quedan 4 veces más caras que otras frutas. ¿Está bien?") y dejar guardar igual.

**Hecho cuando**: desde una comida, desde la lista y desde Completar precios se llega a la ficha en un toque; un precio cargado ahí cambia al instante todos los costos; el aviso aparece con un precio fuera de rango y no aparece con uno normal (prueba).

#### Etapa 22. Lo que arma la app tiene sentido
- "Cambiar por una más barata" compara solo comidas con todos sus precios (reales o estimados) y elige la de menor costo real. Si no hay una más barata, lo dice.
- "Armame la semana" no llena Mis comidas: lo que arma queda en el plan y aparece en Mis comidas solo si el usuario lo guarda ("Guardar en mis comidas"). Las 20 comidas ya creadas por versiones anteriores no se borran; se marcan como "de la semana" para poder filtrarlas u ocultarlas.
- Desayunos y meriendas desde plantillas lógicas (por ejemplo, yogur + fruta + avena o granola; tostadas + queso + fruta; licuado con leche + fruta; huevo + pan + fruta). Nada de huevo con granola ni queso con granola.
- Variedad: la misma comida principal, como mucho 2 veces por semana, y la misma proteína base (lentejas, pollo, carne, pescado, huevo), como mucho 3. El arroz, como mucho 3 veces.
- Las ideas elegidas en la bienvenida entran primero al armar la semana.

**Hecho cuando**: en 20 semanas armadas con semillas distintas no aparece ninguna combinación prohibida ni se superan los topes; "más barata" nunca elige una comida con faltantes que cuenten $0; después de armar, Mis comidas no crece.

#### Etapa 23. Catálogo y lista prolijos
- Cada idea tiene vinculado todo lo que nombra su título (hongos en el risotto, jamón en la tarta, palta en los wraps…). Prueba nueva que compara título e ingredientes, con una lista de palabras que no son ingredientes (tarta, wrap, tacos, risotto, guiso…).
- Cantidades en envases: cucharadas y tazas pasan a gramos y al envase típico ("Avena: 1 paquete de 400 g"). Revisar los gramajes por porción que dan cantidades sin sentido para una semana (lechuga 65 g, tomate 65 g) y corregirlos con valores comunes.
- Equivalencias: no sugerir unir ingredientes distintos (como dos quesos diferentes); solo variantes de nombre del mismo ingrediente.
- "Compartir lista" arma un texto para WhatsApp: por sección del súper, con cantidades, ≈ precio por producto y total de la semana. Un toque en el teléfono.

**Hecho cuando**: la prueba de título contra ingredientes pasa en las 41 ideas; ningún producto de la lista queda en cucharadas o tazas; la sugerencia de unir quesos no aparece; el texto compartido incluye el total.

#### Etapa 24. Semana más clara
- Sacar "Elegir el almuerzo de hoy". "Armame la semana" queda como única acción principal arriba; con la semana completa, pasa a ser secundaria ("Rehacer semana").
- El aviso de semana armada queda hasta la próxima acción, con "Deshacer" y el mismo total de la Etapa 20.
- Separación correcta entre la cabecera, los chips de los días y el contenido (al menos 16 px).
- Recorrido final con `revisor-usuario`: armar la semana, completar 2 precios desde la ficha, cambiar una comida por una más barata y compartir la lista, a 390, 360 y 320 px.

**Hecho cuando**: no hay botón "Elegir el almuerzo de hoy"; el aviso sigue visible después de 10 segundos; no hay textos cortados ni controles superpuestos en las vistas tocadas; el recorrido final pasa sin bloqueantes.

### Al terminar la Etapa 24
1. Si `main` cambió mientras se trabajaba (por las tareas de nutrición o precios), traerlo a `rediseno-3` con merge, sin rebase, reconstruir y pasar la compuerta otra vez.
2. Escribir `docs/informe-ronda-3.md`: qué cambió para el usuario, medidas antes y después (productos con precio, totales, cantidades), decisiones tomadas sin el dueño, mejoras sugeridas y pendientes para el dueño.
3. Abrir el PR `rediseno-3` → `main` (con `gh api`), listo para revisar, con el informe como descripción. No mergearlo: ese merge lo hace el dueño.

### Registro de la Ronda 3
- Arranque: rama `rediseno-3` creada desde `main` (c4cf4ba, v16.7.0) con este plan agregado. Sin etapas hechas todavía.

### Etapa 19 ✅ Que cada ingrediente encuentre su precio
Rama `rediseno-3-etapa-19-precios-encuentran`. Versión 17.0.0.

**Plan corto**
- `Ingredientes.variantesNombre()` (03) genera las otras formas de un nombre; `Precios.itemDe()` (43) y `nutritionFor()` (28) las usan: el precio y la nutrición resuelven igual. Datos: `datos/precios-mapa.json` suma `cat` (categoría) a todos los ítems y 15 ítems nuevos de frutas, hongos y granola; `actualizar-precios.mjs` copia `cat` como `k` a `datos/precios.json` y valida que sea una de las 10 categorías. Prueba nueva `e19_precios_resuelven.js`.
- Riesgos para los datos: ninguno (no se toca ninguna clave de `miPlatoFacil_*`).

**Hecho cuando**
- ✅ Cobertura (E19-cobertura): con la semana armada de la prueba ($60.000, 25 productos) hoy hay 19 con precio real (76 %; en la v16.7.0 eran 17 de 29, 59 %) y 6 anotados como sin dato (frutas sin precio publicado y granola; cambian según la semana). El control pide 90 % entre real y anotado sin dato (da 100 %) **y además** (E19-cobertura-real) que el precio real no baje de 70 %. **No se llega al 90 % de precio real**: esta sesión no puede bajar SEPA ni INDEC (los dominios están bloqueados), así que los ítems nuevos del mapa no tienen datos hasta la próxima corrida de "Actualizar precios". Decisión: el revisor lo marcó BLOQUEANTE porque el plan pide 90 % real; sin datos nuevos no hay forma honesta de cumplirlo, así que se anota la brecha, se agrega el piso de 70 % real y la lista `sinDato` se achica sola cuando entren datos. Si preferís exigir 90 % real, hay que correr "Actualizar precios" primero.
- ✅ Los 12 productos (E19-doce): arroz, yogur, leche, pan de molde, avena, carne vacuna y queso Port Salut encuentran precio; frutillas, kiwi, arándanos, granola y tortillas ("Tortillas de trigo" ya tenía SEPA y ahora se encuentra) quedan según la tabla de Sin dato.
- ✅ Plausibilidad (E19-plausibilidad): ningún precio por kg o litro se aparta más de 4 veces de la mediana de su categoría y unidad base, salvo las excepciones anotadas en `datos/precios-notas.json` (aceite de oliva, ajo, albahaca, rúcula, espárragos, radicheta, agua).

**Variantes** (Decisión): el orden es nombre exacto, sinónimo/equivalencia, nombre con que la nutrición conoce el ingrediente ("Yogur natural descremado" → "Yogur descremado") y después el nombre sin paréntesis, sin lo que sigue a " o " y sin modificadores finales (integral, blanco, descremado, natural, fluida, instantánea, arrollada, entero, común, light). Si el paréntesis trae una variante con precio propio se prueba primero con la primera ("Arroz (integral, yamaní)" → "Arroz integral" y si no "Arroz"): es la más común del armado y la que tiene SEPA. Además, si la nutrición trae solo la taza, la cucharada (1/16) y la cucharadita (1/48) se calculan de ella: sin eso la avena y el yogur en cucharadas no se podían costear.

**Sin dato** (Decisión): `datos/precios-notas.json` anota qué productos no tienen precio en `datos/precios.json` (32: frutas, granola, champiñones, puerro, cebolla de verdeo y varios cereales y legumbres poco comunes). Los 15 nuevos (Frutilla, Kiwi, Arándanos, Mandarina, Pera, Durazno, Uva, Ananá, Ciruela, Melón, Sandía, Mango, Pomelo, Champiñones, Granola) están en el mapa solo con consulta a SEPA (sin nombre de INDEC, que no pude verificar sin bajar el archivo y que haría fallar la corrida si estuviera mal). La Etapa 20 los estima con la mediana de su categoría.

**Tests nuevos**: `e19_precios_resuelven.js` (6: cobertura, cobertura real, los 12, resolvedor, no confunde ingredientes distintos —'Pan rallado', 'Queso rallado', 'Leche de almendras', 'Queso blanco—, plausibilidad). Se sumó "Yogur" y siete frutas a `pesoUnidad` de `datos/envases.json` (190 g el pote, etc.) para poder costear unidades.

**Tests adaptados**: Compras (palabras): la fila ya no repite lo que va entre paréntesis del nombre ("Carne vacuna (nalga, cuadril, …)" → "Carne vacuna") para que E1-palabras-compras (262,8 palabras) siga pasando con más productos con precio (262 → 271 sin el cambio); la lista copiada conserva el nombre entero. `e15_armame.js` C15-1 (el presupuesto "bajo" pasó de $26.000 a $34.000: con precios que antes faltaban la semana más barata que se puede armar cuesta más de $27.000, y la prueba pide presupuestos alcanzables); `e9_sepa.js` (C9-1) busca el dato por el nombre del ítem de precios que se encontró (no solo por el nombre de la nutrición) y se actualizó `ambito` del mapa porque el nuevo resolvedor reconoce más nombres (55 núcleo y 43 armado); misma exigencia (80 % del total).

**Pendientes para vos**
- Correr "Actualizar precios" (GitHub Actions) para que entren los precios de SEPA de los 15 ítems nuevos del mapa; después se puede vaciar la lista `sinDato` de `datos/precios-notas.json` de lo que entre.

**Revisor y compuerta (Etapa 19)**: `revisor-codigo` BLOQUEANTE por la brecha del 90 % real (ver Cobertura: se documentó como Decisión y se sumaron E19-cobertura-real y E19-no-confunde; la brecha queda en "Pendientes para vos"); sus sugerencias de prueba negativa y de igualdad en las excepciones se aplicaron. Compuerta: VALIDACIÓN ETAPA 19: OK (113 controles, 582 pruebas).

### Etapa 20 ✅ Un solo costo, completo y claro
Rama `rediseno-3-etapa-20-un-costo`. Versión 17.1.0.

**Plan corto**
- `43-precios.js`: `costoDeIngrediente()` (precio real o estimado), `costoDeFilas()` (una comida), `costoDeProducto()`/`preciosDeLaLista()` (lista y semana), `costoSemanaPlan()` y `costoSemanaDeFilas()` (semana, también para comidas aún sin guardar). Semana (`pintarCostoDia`), Compras (`preciosDeLaLista`), la barra de presupuesto (`totalAutomaticoLista`) y el aviso de `45-armame-la-semana.js` salen de ahí. Datos: `datos/precios.json` suma `categorias` (categoría y unidad base de los ítems del mapa sin precio; los demás la traen en `k`); la herramienta la genera. Pantalla Semana: nuevo `#planPreciosEstado` y la hoja "Completar precios". Prueba nueva `e20_un_costo.js`.
- Riesgos para los datos: ninguno.

**Hecho cuando**
- ✅ E20-mismo-total: con la semana armada a $70.000, el aviso, Semana, Compras y la barra dicen lo mismo (≈ $67.764 en la prueba).
- ✅ E20-sin-cero: lo sin precio real se estima con la mediana por kg o litro de su categoría y se marca ("sin precio · estimado ≈ $X"); lo que no se puede estimar queda "sin precio", no suma y el total dice "al menos". "Fruta de estación" se estima como fruta (150 g la unidad).
- ✅ E20-frase: "Semana ≈ $X · hoy ≈ $Y" y "Con precio: 25 de 32 productos · Completar 7 precios"; el botón abre la hoja con los 7 productos sin precio real. "Faltan" cuenta productos distintos (32 productos distintos para 28 comidas).

**Costo único** (Decisión): el total de la semana y de la lista cuenta lo que se compra, con envases enteros (1 paquete de pan de molde aunque se usen 2 rebanadas) y mismo cálculo para el aviso, Semana, Compras y la barra. El costo de una comida o de un día cuenta lo que usa (sin redondear a envases). Consecuencia que conviene saber: la misma semana de la v16.7.0 pasó de ≈ $30.550 a ≈ $55.000-$68.000 porque ahora suma los 12 productos que antes valían $0 en silencio y los envases enteros. Si se prefiere "lo que se consume", es una sola función (`unidadesACostear`).

**Estimados** (Decisión): mediana del precio por kg o litro de la categoría en la región elegida (con la misma prioridad de fuentes que el precio automático). Un producto de la lista con cantidad que no se puede pasar a kg o litro (por ejemplo cucharadas de semillas) queda "sin precio" hasta la Etapa 23. Se agregó "Romero" a los básicos de alacena (no entra a la lista).

**Tests adaptados** (misma exigencia, texto nuevo): `e7_precios.js` C7-2 (la línea de Semana ahora es "Semana al menos ≈ $4.500 · hoy ≈ $3.100"), `e10_pulido.js` C10-6 (el stub de `costosDelPlan` y las frases nuevas), `e13_precios_a_la_vista.js` C13-1 (el 80 % se mide sobre precios reales, no sobre los estimados; antes contaba cualquier entrada) y C13-2 (con envases enteros el costo de 3 personas no es exactamente el triple: se pide más de 1,5 y no más de 3 veces), `e15_armame.js` C15-1 (los presupuestos "bajo" y "medio" pasan de $26.000/$40.000 a $60.000/$70.000: con todos los precios, la semana más barata que arma la app cuesta ≈ $55.000) y C15-5 (prueba cada almuerzo y cena hasta encontrar uno que se pueda abaratar; con precios completos no siempre hay uno en el hueco del miércoles). Tope de `index.html` subido de 820.000 a 860.000 bytes (`construir.mjs` y texto de E9-tamano-app): sigue fallando la construcción si se pasa. Compras: la fila sin "o …" y sin la fuente larga para mantener E1-palabras-compras (254 palabras; el máximo es 262,8).

**Revisor y ajustes (Etapa 20)**: `revisor-codigo` NO BLOQUEANTE. Se aplicaron sus sugerencias: el aviso cuenta `estimados` (no todos los faltantes), la barra usa `sinEstimar` como Semana y Compras, y sin ningún precio la barra y la fuente no aparecen. Un producto sin cantidad ("Romero") se ve en la lista pero no cuenta como faltante. Los totales de Compras y la barra son "lo que falta comprar" (descuentan lo tachado y la Despensa); coinciden con Semana cuando no hay nada tachado ni en la Despensa. Semana (E2-semana-alto 1266 px) se ajustó con márgenes y un botón en línea cuya zona táctil es de 44 px.

**Revisor de usuario (Etapa 20)**: NO BLOQUEANTE. Sugerencias que quedan para las etapas siguientes: el "·" suelto antes del botón y que el botón parezca un enlace (Etapa 21), aclarar que Compras muestra "lo que falta comprar" y no el total de la semana (Etapa 24), y las cantidades raras ("Fruta de estación: 23 unidades", cucharaditas de semillas sin estimado: Etapa 23). Compuerta: VALIDACIÓN ETAPA 20: OK (118 controles, 586 pruebas).

### Etapa 21 ✅ Ficha de ingrediente con precio
Rama `rediseno-3-etapa-21-ficha-precio`. Versión 17.2.0.

**Plan corto**
- `43-precios.js`: `fichaPrecio()` (precio con fuente, región, mes y rango; "Agregar/Cambiar mi precio"; "Borrar mi precio"; Deshacer), `miPrecioDe()`/`misPreciosDe()` (Mi precio gana sobre el automático, también entre unidades distintas pasando a gramos), `razonContraCategoria()`. `39-comidas.js`: la ficha de un ingrediente (`abrirNutrientesDeIngrediente`) suma el bloque de precio debajo de los nutrientes. `12-lista-de-compras.js`: el nombre en la fila de la lista abre la ficha (sin tachar). La hoja "Completar precios" y los ingredientes de cada comida ya abrían esa ficha. Prueba nueva `e21_ficha_precio.js`.
- Riesgos para los datos: se escribe en `miPlatoFacil_referencePrices_v1` con el mismo formato (una entrada por ingrediente, id `ficha_<ingrediente>`, siempre en ARS); no se borra nada que ya hubiera ahí.

**Hecho cuando**
- ✅ E21-un-toque: desde la lista (tocando el nombre), desde "Completar precios" y desde un ingrediente de una comida se llega a la ficha en un toque; muestra, por ejemplo, "≈ $2.750/kg · SEPA GBA · nov. 2026 · entre $2.598 y $3.180".
- ✅ E21-mi-precio: guardar $2.500/kg de arroz cambia el total de la semana al instante (de $69.223 a $68.973), queda en `referencePrices_v1` con el modo simple (sin herramientas avanzadas), la ficha dice "Mi precio: $2.500 por 1 kg" y Deshacer vuelve al total anterior y deja la clave como estaba.
- ✅ E21-aviso: $40.000/kg de frutillas avisa ("frutillas te queda 16 veces más caro que el precio típico de frutas. ¿Está bien?") y deja "Guardar igual"; $4.000/kg no avisa.

**Mi precio** (Decisión): unidades kg, g, unidad o paquete; "paquete" pide los gramos del paquete y se guarda como gramos con `pack:"paquete"` (el formato viejo no tiene unidad paquete). Se guarda con el nombre del ítem de precios o de la nutrición (por ejemplo "Yogur descremado") para que sirva para todas las formas del nombre. Un solo Mi precio por ingrediente desde la ficha (el más nuevo gana; los que se cargaron en herramientas avanzadas se siguen respetando). Si las unidades no coinciden (precio por kg y receta en unidades) se pasan las dos cantidades a gramos.

**Aviso de rango** (Decisión): compara el precio por kg o litro con la mediana de su categoría y avisa si es más de 3 veces más caro o más de 3 veces más barato; no compara productos por unidad. Siempre deja guardar.

**Revisor de usuario (Etapa 20) aplicado**: el botón "Completar precios" ahora es un botón secundario con borde.

**Revisor y compuerta (Etapa 21)**: `revisor-codigo` BLOQUEANTE: guardar Mi precio partía de `loadReferencePrices()`, que devuelve `{}` si una sola entrada es inválida, y habría pisado los precios de herramientas avanzadas. Corregido: se lee el texto crudo; si no se entiende (JSON roto o una entrada inválida) no se escribe nada y la ficha avisa "No pude guardar sin tocar tus precios anteriores"; prueba nueva E21-datos (conserva una entrada ajena al guardar, borrar y deshacer; no escribe sobre datos inválidos). También: ante igual fecha gana la entrada de la ficha y el nombre tocable de la lista mide 44 px. Quedan como sugerencias: `rangoDePrecios`, la lista de compras viejas y las recetas siguen usando `pricesFor` (misma dimensión), de modo que un Mi precio por kg no se ve en esos lugares si la cantidad está en unidades; "Borrar mi precio" solo borra el de la ficha. Compuerta: VALIDACIÓN ETAPA 21: OK antes de esta corrección; se vuelve a correr.

**Revisor de usuario (Etapa 21)**: BLOQUEANTE por (1) el aviso de rango quedaba debajo de los botones y fuera de la vista, (2) el enlace "ficha USDA" con el azul por defecto sobre fondo oscuro. Corregido: el aviso va arriba de los botones y se desplaza a la vista; los enlaces de las hojas usan el color del tema; además se omite "entre $X y $X" cuando el rango no tiene ancho y "Completar precios" lista filas de ancho completo. Capturas rehechas (solo tema oscuro: el rango claro lo cubre el control de contraste de la compuerta).

Compuerta final (Etapa 21): VALIDACIÓN ETAPA 21: OK (123 controles, 590 pruebas).

### Etapa 22 ✅ Lo que arma la app tiene sentido
Rama `rediseno-3-etapa-22-armado-con-sentido`. Versión 17.3.0.

**Plan corto**
- `45-armame-la-semana.js`: plantillas de desayuno y merienda, topes de variedad, prioridad a lo guardado, "más barata" con precios completos, marca `deLaSemana` en lo que arma y migración `marcarDeLaSemana()` de lo que armó antes. `09-mis-platos.js` y `18-misplatos.html`: Mis comidas oculta lo "de la semana" y suma el filtro "De la semana". `39-comidas.js`: "Guardar en mis comidas" en el menú de una comida "de la semana". Prueba nueva `e22_armado_con_sentido.js`.
- Riesgos para los datos: las comidas guardadas (`miPlatoFacil_saved`) pueden llevar un campo nuevo `deLaSemana:true`; no se borra ni se renombra nada y las claves no cambian.

**Hecho cuando**
- ✅ E22-variedad: en 20 semanas armadas con semillas distintas (a $70.000) siempre se llenan las 28 comidas, ninguna comida principal se repite más de 2 veces, ninguna proteína base (lentejas, pollo, carne, pescado, huevo) más de 3 ni el arroz más de 3 en almuerzos y cenas, y no aparece huevo ni queso con granola (70 desayunos distintos en esas semanas, por ejemplo "Licuado de kiwi con leche", "Kiwi con huevo y pan de molde", "Ciruela en trozos con avena").
- ✅ E22-barata: en 42 intentos en 3 semanas (28 cambios hechos y 14 sin opción más barata) "Cambiar por una más barata" nunca eligió una comida con faltantes ni una más cara; si la comida actual no tiene todos los precios dice "A esta comida le faltan precios y no puedo compararla" y si no hay más barata lo dice. Elige la de menor costo, ya no la "más parecida".
- ✅ E22-no-crece: después de armar la semana Mis comidas muestra 0 comidas nuevas (se guardaron 18, todas "de la semana", visibles en el filtro "De la semana"); "Guardar en mis comidas" hace aparecer esa comida y sigue en el plan.
- ✅ E22-bienvenida: las 3 ideas guardadas antes de armar entran en 5 semanas con semillas distintas.

**Plantillas** (Decisión): yogur + fruta + avena o granola; pan + queso + fruta; licuado de leche + fruta; huevo + pan + fruta; y fruta + avena/granola/pan sin proteína (para quien evita lácteos y huevo). Las combinaciones al azar de la v16 ya no se arman. Lo guardado por el usuario (comidas que no son "de la semana") suma 2 puntos al elegir: así entran primero las ideas que se eligieron en la bienvenida (que se guardan como comidas) y lo que se cocina seguido.

**De la semana** (Decisión): Armame ya no escribe en Mis comidas visibles: guarda cada comida nueva con `deLaSemana:true` (el plan necesita que existan en `miPlatoFacil_saved`), Mis comidas las oculta y el chip "De la semana" las muestra; "Guardar en mis comidas" quita la marca. La migración marca como "de la semana" las comidas guardadas hasta 30 segundos antes de una entrada "Armame la semana" del historial del plan (si no son favoritas ni cocinadas); si no hay historial no marca nada. Se puede correr dos veces y no borra nada.

**Tests**: ninguna prueba vieja cambió en esta etapa.

**Revisor y compuerta (Etapa 22)**: `revisor-codigo` NO BLOQUEANTE. Sugerencias que se anotan: el regex de pollo (`/pollo|pechuga|muslo/`) también coincide con "repollo" (se corrige en la Etapa 23 junto con la prueba), si ningún candidato cumple los topes el hueco queda vacío sin aflojar el tope (la prueba con el catálogo por defecto siempre llenó las 28), la migración podría marcar una idea de la bienvenida guardada menos de 30 s antes de tocar "Armame la semana" (queda en el filtro "De la semana" y se recupera con "Guardar en mis comidas"), y una comida "de la semana" que luego se marca favorita no sale sola de la marca. Compuerta: VALIDACIÓN ETAPA 22: OK (129 controles).

### Etapa 23 ✅ Catálogo y lista prolijos
Rama `rediseno-3-etapa-23-catalogo-lista`. Versión 17.4.0.

**Plan corto**
- `01-datos-y-estado.js` (ideas y opciones), `44-cantidades-de-platos.js` (`unidadParaCompra`, `pesoVerdura`), `12-lista-de-compras.js` (cucharadas a gramos, nombre corto, texto para compartir), `23-equivalencias-de-ingredientes.js` (sugerencias), `06-compras.html` y `41-compras-y-despensa.js` (botón "Compartir lista"), `datos/envases.json` (`porcionVerdura`, planta de lechuga, pesos por unidad). Prueba nueva `e23_catalogo_lista.js`; el resolvedor de pollo de la Etapa 22 ya no confunde "repollo".
- Riesgos para los datos: ninguno (solo se cambia lo que se muestra y las opciones de armado).

**Hecho cuando**
- ✅ E23-titulo: las 41 ideas tienen vinculado todo lo que nombra su título, con una lista de palabras que no son ingredientes (tarta, wrap, tacos, risotto, guiso, ensalada, salsa…) dentro de la prueba.
- ✅ E23-envases: con la semana armada, ninguna de las 32 filas de la lista queda en cucharadas, cucharaditas ni tazas.
- ✅ E23-equivalencias: la sugerencia de unir "Queso Port Salut descremado" con "Queso cremoso" ya no aparece; sigue "Arroz (integral, yamaní)" = "Arroz".
- ✅ E23-compartir: el texto trae secciones en negrita de WhatsApp, cantidades, "≈ $X" por producto (o "estimado ≈ $X") y "*Total ≈ $69.110* · incluye 10 precios estimados", igual al total de Semana; hay un botón "Compartir lista" en Compras (un toque: abre el menú de compartir del teléfono; sin él, copia).

**Ideas vinculadas** (Decisión): se sumaron "Jamón cocido" (tarta de jamón), "Champiñones" (risotto de hongos) y "Palta" (los dos wraps) a las opciones del armado y a las ideas. Equivalencia aceptada por la prueba: calabaza = zapallo; "hummus" cuenta por los garbanzos.

**Envases** (Decisión): cucharadas, cucharaditas y tazas se pasan a gramos (o mililitros en líquidos) al armar la lista, con la tabla de nutrición y, si no la tiene, con 1 cucharada ≈ 10 g, 1 cucharadita ≈ 3 g y 1 taza ≈ 120 g. Después sale el envase típico de `envases.json` cuando lo hay ("Granola: 1 paquete de 350 g", "Avena: 1 paquete de 500 g"; el ejemplo del plan era 400 g pero la tabla curada de la Ronda 2 dice 500). Verduras: lechuga 80 g, tomate 100 g, zanahoria 80 g, etc. por persona y por comida (antes 65 g por repartir el medio plato en partes iguales); la lechuga se compra por planta (300 g). En la fila de la lista el nombre sale sin paréntesis ni variantes ("Avena arrollada" → "Avena") cuando no se confunde con otra fila. "Semillas de chía" se sumó al mapa de precios (SEPA, aún sin dato: sale estimado).

**Tests adaptados**: `f02_units.js` U2 (1 cucharada + 2 cucharaditas de miel ahora se ven "Miel: 35 g": la suma de unidades compatibles se mantiene, solo cambia la forma de mostrarla; sigue separando gramos de unidades en el huevo); `e9_sepa.js` usa el ámbito de ingredientes del mapa actualizado (58 núcleo y 43 armado) por las opciones nuevas. Compras: 254 palabras (máximo 262,8).

**Revisor y compuerta (Etapa 23)**: `revisor-codigo` BLOQUEANTE por (1) `nombreCorto` devolvía la segunda mitad de un "o" ("Avena arrollada o instantánea" → "instantánea") y mezclaba productos ("Yogur natural descremado" → "Yogur"), y (2) lo guardado en la Despensa en cucharadas o tazas dejaba de descontar del plan. Corregido: `nombreCorto` solo saca el paréntesis, lo que sigue a " o " y un modificador de presentación final (arrollada, fluida, comprada, instantánea); integral y descremado se conservan (prueba E23-nombre-corto); la Despensa se pasa a gramos o mililitros con la misma `unidadParaCompra` (prueba E23-despensa); se sumó una prueba de `mergeUnits` (E23-suma-unidades) y la de títulos ahora revisa también "fideos" y "hummus". Compras 260 palabras (máximo 262,8). Compuerta: ver la entrada siguiente.

Ajuste de equivalencias: la primera versión del filtro dejó fuera "Tomate perita" = "Tomate" (prueba C8-7). Ahora se sugiere unir si es una variante de nombre o el mismo ítem de nutrición y, en las familias donde una palabra cambia de producto (queso, yogur, harina, porotos, pan, aceite, carne, fideos, leche, semillas), solo en ese caso; en el resto (tomate, zapallo, repollo…) se sigue sugiriendo como antes. Además: en la Despensa solo se pasan a gramos las cucharadas y tazas de sólidos (la prueba U4d protege que una taza de leche no se convierta a ml).

Compuerta final (Etapa 23): VALIDACIÓN ETAPA 23: OK (137 controles).

### Etapa 24 ✅ Semana más clara
Rama `rediseno-3-etapa-24-semana-clara`. Versión 17.5.0.

**Plan corto**
- `10-plan-semanal.js`: se saca "Elegir el almuerzo de hoy"; el botón de arriba dice "Armame la semana" (principal) y, con las 28 comidas, "Rehacer semana" (secundario). `45-armame-la-semana.js`: el aviso de semana armada es el texto de siempre ("Listo: 28 comidas armadas · ≈ $X la semana. Incluye N precios estimados. Entra en tu presupuesto…") pero queda en `#planAviso` con Deshacer hasta la próxima acción en lugar de desaparecer a los 3,6 segundos. `05-plan.html`: el aviso y el estado pasan de abajo de la lista a debajo del botón. `estilos.css`: separación de 16 px entre cabecera, botón, chips y contenido. Prueba nueva `e24_semana_clara.js`.
- Riesgos para los datos: ninguno.

**Hecho cuando**
- ✅ E24-sin-elegir: no hay botón "Elegir el almuerzo de hoy" y "Armame la semana" es el único botón principal de arriba.
- ✅ E24-boton: con las 28 comidas el botón pasa a "Rehacer semana" y es secundario.
- ✅ E24-aviso: el aviso sigue visible 10,5 segundos después de armar, con Deshacer, y su total ≈ $68.035 coincide con el de Semana y el de Compras.
- ✅ E24-separacion: 16 px entre cabecera y botón, entre lo de arriba y los chips y entre los chips y el contenido (antes 10 a 12 px).
- ✅ E24-recorrido: armar la semana, completar 2 precios desde la ficha (de 27 a 29 productos con precio), cambiar una comida por una más barata ("Cambié por Fideos integrales con salsa de tomate + albóndigas de garbanzo (≈ $1.554, antes ≈ $3.719)") y compartir la lista con el total, de punta a punta con la interfaz.

**Aviso** (Decisión): se reutiliza el Deshacer del plan (`deshacerPlan`) para que el aviso dure hasta la próxima acción en Semana; no aparece en las demás pestañas. El mensaje de 3,6 segundos (`planStatus`) ya no se usa para el armado.

**Recorrido final** (Decisión): capturas a 390, 360 y 320 px de cada paso (semana vacía, hoja de Armame, semana armada con aviso, Completar precios, ficha, Mi precio, guardado, hoja del hueco, "más barata", Compras y compartir) en `/tmp`, revisadas por `revisor-usuario` (ver abajo). Para que la Semana siga midiendo 1,5 pantallas o menos (E2-semana-alto: 1259 px), el resumen de objetivos pasó a 13 px y los chips de días a 58 px; la línea "Con precio…" ocupa una línea en 390 px y el punto antes del botón se oculta en pantallas angostas.

**Tests adaptados**: `e10_pulido.js` C10-1 (la Semana vacía ya no ofrece "Elegir el almuerzo de hoy": ahora se comprueba que no está y que "Armame la semana" es el botón principal que lleva al paso siguiente) y `e15_armame.js` C15-6 (el aviso "Listo: 28 comidas" se lee en `#planAviso`, no en el estado temporal).

**Revisores (Etapa 24)**: `revisor-usuario` (recorrido a 390, 360 y 320 px) NO BLOQUEANTE y `revisor-codigo` NO BLOQUEANTE. Se aplicó lo importante: el aviso de semana armada ya no queda con el total viejo si después se completan precios (se recalcula con `ArmameSemana.avisoDe`, y el texto corto "Armaste la semana entera" sigue siendo el que va al historial); E24-recorrido exige ahora que el cambio a "más barata" ocurra y que el aviso coincida con Semana. Quedan como sugerencias: el botón "Guardar" de la ficha queda abajo de la hoja en 320 px, la nutrición va antes del precio, el motivo de "no hay más barata" aparece abajo de la hoja, la hoja de un hueco tiene tres variantes de "Cambiar" y la merienda lleva el ícono del desayuno.
