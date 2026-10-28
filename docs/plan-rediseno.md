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
| 0. Red de seguridad | ⏳ | — | 14.9.94 |
| 1. Confianza | — | — | — |
| 2. Selector de comida y nueva Semana | — | — | — |
| 3. Hoy | — | — | — |
| 4. Comidas y nueva estructura | — | — | — |
| 5. Compras y Despensa | — | — | — |
| 6. Un solo registro | — | — | — |
| 7. Precios automáticos de INDEC | — | — | — |
| 8. Resto de las herramientas avanzadas | — | — | — |
| 9. Precios de SEPA | — | — | — |
| 10. Pulido | — | — | — |

### Etapa 0 · Red de seguridad ⏳

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
- (se completa al cerrar la etapa: capturas y medidas de referencia de la v14.9.94)

**Decisiones que tomé sin vos**
- Las ramas de etapa se llaman `rediseno-etapa-N-tema`: git no permite que existan a la vez `rediseno` y `rediseno/etapa-N-tema`, porque `rediseno` ya es una rama y no puede ser también una carpeta de ramas.
- `.gitattributes` con `* text=auto eol=lf`: los archivos se bajan con saltos de línea LF también en Windows. Sin esto, un clon en Windows los convierte y `construir.mjs --verificar` falla aunque no haya cambios.
- Las capturas usan un reloj fijo, lunes 26/10/2026 a las 12:00 (Argentina), y los datos del respaldo de ejemplo, para que las medidas sean comparables entre etapas.
- Los enlaces de atribución de los precios (Etapa 7) van en `datos/precios.json`, no en `fuente/`: así la app no suma dominios externos y la compuerta no se afloja.

**Mejoras sugeridas**
- (al cerrar la etapa)

**Pendientes para vos**
- (al cerrar la etapa)
