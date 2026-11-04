# Mi Plato Fácil · Ronda 2: la semana con precio (v15.9.0 → v16.7.0)

Ocho etapas (11 a 18), cada una en su rama `rediseno-2-etapa-N-…`, validada con `herramientas/validar-etapa.mjs` y revisada, y mergeada a `rediseno-2` con `--no-ff`. Este PR trae todo a `main`. Hay un solo cambio de datos de usuario: claves nuevas, opcionales en el respaldo (ver más abajo).

## Qué cambió para quien usa la app

- **Desayuno completo (11).** Se pueden elegir hasta 3 frutas, en dos pasos ("¿Qué fruta?" y "¿Cómo?": entera, en trozos, licuado o en una preparación). Ya no aparecen "Porción de galletas" ni "Harina de trigo integral" en el desayuno (lo guardado se sigue mostrando). Todas las ideas de almuerzo o cena traen verdura, almidón y proteína (el pescado ahora lleva papa). El selector no repite una idea que ya está en Mis comidas.
- **Cantidades reales (12).** Todo plato armado tiene cantidades, calculadas de las porciones que la app ya mostraba. Personas por hogar en Preferencias (escala la lista y los costos). La lista se redondea a envases reales ("Fideos: 1 paquete de 500 g", huevos por docena, leche en sachet). Aceite, sal y especias no van a la lista, salvo que los marques como faltantes en la Despensa. Se terminó el "+ sin cantidad en 1 plato".
- **Precios a la vista (13).** Vienen encendidos (región GBA) en instalaciones nuevas; quien ya había elegido algo lo conserva. ≈ costo en cada comida de la Semana, por día y por semana, en Comidas y en la lista. Al tocar un precio se ve "≈ $2.100 · entre $1.900 y $2.900 · fuente · mes". "faltan N precios" aparece una vez por bloque. Se corrigieron pesos por unidad raros (zanahoria, palta…); el "zapallito $6.350" no era un error: 196 g × $6.480 el kilo del dato real.
- **Bienvenida con presupuesto (14).** Un paso opcional más: personas, presupuesto semanal y región. Saltarlo no escribe nada.
- **"Armame la semana" (15).** Botón principal en Semana: completa los huecos vacíos o rehace la semana, sin IA, con las mismas reglas siempre (tipo de comida, rutina, lo que evitás, Despensa, reutilizar ingredientes, "cociná doble", máximo 2 repeticiones) y sin pasarse del presupuesto si se puede (si no, avisa). En cada hueco: "Cambiar por otra parecida" y "Cambiar por una más barata". "Empezar de nuevo" en el menú ⋯. Todo con Deshacer.
- **Filtros de dieta reales (16).** Sin carne roja, sin cerdo, sin pescado, vegetariano, sin lácteos y sin huevo; el campo de texto sigue como "Otros". Se aplican en Ideas, Selector, Sugerime y Armame y avisan si dejan pocas ideas. Sin etiquetas de salud que no se puedan verificar.
- **Pulido (17).** Sin "Volver al paso anterior" en el paso 1; la barra de pasos reemplaza a las pestañas en vez de apilarse; sin textos cortados ni botones superpuestos a 390, 360 y 320 px; un solo interruptor de herramientas avanzadas (en Preferencias).
- **Código (18).** Las funciones se agruparon en módulos (`Compras.…`, `Precios.…`) sin cambiar el comportamiento.

## Medidas, antes y después

| | v15.9.0 (`main`) | v16.7.0 (este PR) |
|---|---|---|
| Pruebas automáticas | 545 en 41 baterías | 576 en 48 baterías |
| Controles de la compuerta | 72 en la Etapa 11 | 106 en la Etapa 18 |
| Funciones globales | 635 | 311 (−51 %; el control pedía −30 %) |
| `index.html` | 743.087 bytes | 808.033 bytes (tope 820.000) |
| Líneas de JavaScript | 10.623 | 11.566 |
| Lista de una semana de platos armados en instalación nueva | sin precios, sin cantidades | 28 de 34 ítems con precio (82 %), todos con cantidad |
| Armame la semana, 28 huecos | — | completa los 28, ≈ 30 ms, mismo resultado para los mismos datos |
| Anchos medidos sin textos cortados ni superposiciones | 390 | 390 (claro y oscuro), 360 y 320 |

## Decisiones que tomé sin vos (están en el Registro, cada una con su etapa)

1. **Precios encendidos por defecto** solo si no hay `uiMode_v1` ni `mostrarPrecios_v1`; quien eligió modo simple los conserva apagados.
2. **Gramajes por defecto** por persona y por 1/4 de plato: verduras 100 g, almidones 80 g, proteínas 120 g; huevo 55 g; rodajas y tajadas de fruta en gramos.
3. **Envases**: tabla curada de 26 (`datos/envases.json`); el precio de la lista es el del envase que se compra, el costo por comida es lo que se come.
4. **Básicos de alacena** (aceite, sal, pimienta, vinagre, orégano, pimentón, comino, ají molido, laurel, tomillo, nuez moscada, canela): fuera de la lista y del costo salvo marcados como faltantes.
5. **Reglas de Armame la semana** (pesos de reutilización, "cociná doble" con 30 % de chance con semilla, presupuesto mensual × 7/30, metas por hueco) y que "Empezar de nuevo" reemplaza a "Vaciar la semana".
6. **Filtros por palabras** completas (con plural), conservadores ("sin carne roja" saca todo lo que diga "carne"); "Mis comidas" del Selector no se filtra.
7. **Tope de tamaño de `index.html`**: de 770.000 a 820.000 bytes (Etapa 15); el módulo nuevo y los `Módulo.` lo hicieron crecer.
8. **Módulos**: quedan globales las funciones que usa el arranque antes de que su archivo declare el módulo (311 de 678); los módulos son `var` para que las pruebas los lean desde el marco.
9. **Paso nuevo en la bienvenida** como paso 3 de 4 (cuesta un toque más; el recorrido de la semana nueva pasó de 13 a 14 toques, con tope 15).
10. Pruebas adaptadas (Regla 5), todas explicadas por etapa en el Registro: los `tradPlate` del banco de pruebas de la lista pasaron a platos de texto donde la prueba mira "parte sin cantidad"; las pruebas de la lista, con precios y envases, esperan los valores nuevos; `reset()` parte en modo simple para no mezclar precios con cantidades.
11. No hubo ninguna captura tuya de botones superpuestos en esta ronda; se midió en todas las vistas y hojas.

## Datos nuevos (todos opcionales en el respaldo; los respaldos viejos se siguen restaurando)

- `miPlatoFacil_hogar_v1` `{"personas":n}`
- `miPlatoFacil_basicosFaltantes_v1` `{"faltan":["Aceite"]}`
- `miPlatoFacil_dieta_v1` `{"filtros":["sin_cerdo",…]}`

No se renombró ni borró ninguna clave `miPlatoFacil_*` y ninguna prueba de datos se aflojó.

## Mejoras sugeridas (de los revisores, no bloqueantes)

- Semana: con la semana llena, "Armame la semana" y "Elegir el almuerzo de hoy" son dos botones verdes llenos; bajar uno a secundario. La hoja del hueco lleno tiene 6 botones (reunir los tres "Cambiar…").
- Armame: avisar antes de "Rehacer la semana entera" si hay pocas comidas candidatas; si `setSlot` falla en un cambio de hueco queda una comida guardada de más.
- Precios: la prueba de 15 ingredientes repite los pesos de la tabla (circular; usar pesos o rangos de otra fuente); contar también "Tomate triturado" y "Cebolla de verdeo" para que no hereden el peso de la unidad común; rotular el costo del hueco como "para el hogar".
- Filtros: "Limpiar preferencias" no borra los filtros de dieta; el oráculo de la prueba repite palabras de la implementación.
- Bienvenida: el kicker estático del HTML dice "Paso 1 de 3" (se corrige al abrir).
- Preferencias: las dos tarjetas de interruptores podrían tener la ayuda en una línea; el hueco bajo el subtítulo de Más.
- Código: `.mode-note` y el recorrido de `[data-mode-note]` son código muerto; quedan 311 funciones globales por el orden de arranque (reordenarlo permitiría mover más).
- Lista de compras: una receta con filas con y sin cantidad para el mismo ingrediente muestra solo la parte con cantidad.

## Pendientes para vos

1. **Revisar y mergear este PR a `main`** (yo no lo mergeé; no hice push ni merge a `main`). `main` no cambió mientras trabajé (la tarea de nutrición o precios no commiteó nada nuevo), así que no hizo falta traerlo a `rediseno-2`.
2. **Tags**: decidiste no usar tags en la Ronda 2. La marca de cada etapa es su commit "Merge etapa N: …" en `rediseno-2` (`git log --merges rediseno-2`). No queda nada pendiente ahí.
3. Mirar la app en tu teléfono real (390, 360 y 320 px de ancho): las capturas las vieron solo los revisores automáticos.
4. Pasar un ojo a los números por defecto (gramajes, envases, pesos por unidad, básicos) y a las palabras de los filtros: son curados a mano y se corrigen en `datos/envases.json` y `fuente/codigo/46-dieta.js`.
5. `rediseno-2` tiene el PR abierto contra `main`; las pruebas de GitHub corren con cada push (`.github/workflows/pruebas.yml`).
