# Informe de la Ronda 5 (v19.10.0)

La Ronda 5 aplicó la lista cerrada de 79 pedidos de Facunddominguez sobre la v18.8.0 en las Etapas 33 a 44, una rama por etapa (`rediseno-5-etapa-N-tema`) y cada una mergeada en `rediseno-5` solo con la compuerta en verde. Este informe es la descripción del PR `rediseno-5` → `main`. El detalle de cada etapa está en el Registro de la Ronda 5 de `docs/plan-rediseno.md` y el control ítem por ítem, en `docs/ronda-5-lista.md`.

## Resultado
- **79 ítems en ✅ y 0 en ⚠️.** Todos tienen su control `R5-<ID>` en `docs/validacion/criterios.json`, una prueba que mira el resultado en pantalla y su captura del después.
- **Versión 19.10.0.** Batería de **783 pruebas en verde**, con la tipografía de este entorno y también con DejaVu (la del runner de GitHub); línea base 667 → 783 pruebas y 38 → 40 claves. La compuerta (`validar-etapa.mjs N`) dio OK en cada etapa.
- **Datos:** no se renombró ni se borró ninguna clave `miPlatoFacil_*`. Las dos claves nuevas entran al respaldo como opcionales y los respaldos viejos se siguen restaurando: `miPlatoFacil_gastoSemanal_v1` (gasto semanal corregido, R-09) y `miPlatoFacil_comprasVueltas_v1` (productos devueltos de "Ya tenés" a la lista, K-04). Lo de las funciones eliminadas (Historial de cambios, Todas las preparaciones, los Deshacer, movimientos de despensa, etc.) sigue guardado, en el respaldo y se restaura igual; solo se dejó de mostrar.
- **`main`:** no se tocó. Tenía un commit nuevo de precios (SEPA e INDEC) que se trajo a `rediseno-5` con un merge, sin conflictos.
- Qué se verificó y qué no: las pruebas y las capturas corrieron en Chrome sin ventana de este entorno (390, 360 y 320 px, claro y oscuro). No se probó en un teléfono real ni con una clave real de Gemini.

## Etapas
| Etapa | Tema | Ítems |
|---|---|---|
| 33 | Reglas, lista de control y base (19.0.0) | maquinaria de la ronda |
| 34 | Semana (19.1.0) | S-11 a S-13, S-15 a S-19 |
| 35 | Semanas anteriores y mes (19.2.0) | S-01 a S-06, S-14 |
| 36 | Completar precios (19.3.0) | S-07 a S-10 |
| 37 | Elegir o cambiar una comida (19.4.0) | C-01 a C-04 |
| 38 | Hoy (19.5.0) | H-01 a H-05 |
| 39 | Registro y "Lo comí" (19.6.0) | R-01 a R-10 |
| 40 | Comidas e IA (19.7.0) | M-01 a M-10, A-01 |
| 41 | Compras y Despensa (19.8.0) | K-01 a K-17 |
| 42 | Más (19.9.0) | X-01 a X-10, G-01 |
| 43 | Bienvenida (19.10.0) | O-01, O-02 |
| 44 | Cierre | recorrido final, resumen, informe y PR |

## Los 79 ítems
| ID | Etapa | Estado | Prueba | Captura después (390 px) |
|---|---|---|---|---|
| S-11 | 34 | ✅ | `R5-S-11` | semana-compartir-despues.png |
| S-12 | 34 | ✅ | `R5-S-12` | semana-compartir-despues.png |
| S-13 | 34 | ✅ | `R5-S-13` | semana-menu-despues.png |
| S-15 | 34 | ✅ | `R5-S-15` | semana-despues.png, semana-despues-oscuro.png, semana-planes-despues.png |
| S-16 | 34 | ✅ | `R5-S-16` | semana-menu-despues.png |
| S-17 | 34 | ✅ | `R5-S-17` | semana-despues.png, semana-despues-oscuro.png |
| S-18 | 34 | ✅ | `R5-S-18` | semana-menu-despues.png |
| S-19 | 34 | ✅ | `R5-S-19` | semana-selector-despues.png |
| S-01 | 35 | ✅ | `R5-S-01` | semanas-despues.png |
| S-02 | 35 | ✅ | `R5-S-02` | semanas-despues.png |
| S-03 | 35 | ✅ | `R5-S-03` | semanas-despues.png |
| S-04 | 35 | ✅ | `R5-S-04` | semanas-despues.png |
| S-05 | 35 | ✅ | `R5-S-05` | semanas-hoja-despues.png |
| S-06 | 35 | ✅ | `R5-S-06` | semanas-despues.png |
| S-14 | 35 | ✅ | `R5-S-14` | semana-menu-despues.png, semanas-despues.png |
| S-07 | 36 | ✅ | `R5-S-07` | completar-precios-despues.png |
| S-08 | 36 | ✅ | `R5-S-08` | completar-precios-despues.png |
| S-09 | 36 | ✅ | `R5-S-09` | completar-precios-guardado-despues.png |
| S-10 | 36 | ✅ | `R5-S-10` | completar-precios-despues.png |
| C-01 | 37 | ✅ | `R5-C-01` | cambiar-armar-nueva-despues.png |
| C-02 | 37 | ✅ | `R5-C-02` | sugerime-desayuno-despues.png |
| C-03 | 37 | ✅ | `R5-C-03` | comida-receta-despues.png |
| C-04 | 37 | ✅ | `R5-C-04` | selector-dieta-despues.png |
| H-01 | 38 | ✅ | `R5-H-01` | hoy-lo-comi-despues.png |
| H-02 | 38 | ✅ | `R5-H-02` | hoy-despues.png, hoy-despues-oscuro.png |
| H-03 | 38 | ✅ | `R5-H-03` | hoy-sugerime-despues.png |
| H-04 | 38 | ✅ | `R5-H-04` | hoy-sugerime-despues.png |
| H-05 | 38 | ✅ | `R5-H-05` | hoy-despues.png, hoy-despues-oscuro.png |
| R-01 | 39 | ✅ | `R5-R-01` | comida-lo-comi-despues.png |
| R-02 | 39 | ✅ | `R5-R-02` | registro-despues.png, registro-despues-oscuro.png |
| R-03 | 39 | ✅ | `R5-R-03` | registro-despues.png, registro-despues-oscuro.png |
| R-04 | 39 | ✅ | `R5-R-04` | registro-despues.png, registro-despues-oscuro.png |
| R-05 | 39 | ✅ | `R5-R-05` | registro-despues.png, registro-despues-oscuro.png |
| R-06 | 39 | ✅ | `R5-R-06` | registro-despues.png, registro-despues-oscuro.png |
| R-07 | 39 | ✅ | `R5-R-07` | registro-graficos-despues.png, registro-graficos-despues-oscuro.png |
| R-08 | 39 | ✅ | `R5-R-08` | registro-graficos-despues.png, registro-graficos-despues-oscuro.png |
| R-09 | 39 | ✅ | `R5-R-09` | registro-graficos-despues.png, registro-graficos-despues-oscuro.png |
| R-10 | 39 | ✅ | `R5-R-10` | registro-graficos-despues.png, registro-graficos-despues-oscuro.png |
| M-01 | 40 | ✅ | `R5-M-01` | receta-nueva-despues.png |
| M-02 | 40 | ✅ | `R5-M-02` | ideas-despues.png, ideas-despues-oscuro.png |
| M-03 | 40 | ✅ | `R5-M-03` | ideas-despues.png, ideas-despues-oscuro.png |
| M-04 | 40 | ✅ | `R5-M-04` | ideas-busqueda-despues.png, ideas-busqueda-despues-oscuro.png |
| M-05 | 40 | ✅ | `R5-M-05` | ideas-busqueda-despues.png, ideas-busqueda-despues-oscuro.png |
| M-06 | 40 | ✅ | `R5-M-06` | ideas-busqueda-despues.png, ideas-busqueda-despues-oscuro.png |
| M-07 | 40 | ✅ | `R5-M-07` | ideas-busqueda-despues.png, ideas-busqueda-despues-oscuro.png |
| M-08 | 40 | ✅ | `R5-M-08` | ideas-busqueda-despues.png, ideas-busqueda-despues-oscuro.png |
| M-09 | 40 | ✅ | `R5-M-09` | ideas-ia-despues.png |
| M-10 | 40 | ✅ | `R5-M-10` | ideas-despues.png, ideas-despues-oscuro.png |
| A-01 | 40 | ✅ | `R5-A-01` | ideas-ia-despues.png, receta-nueva-despues.png |
| K-01 | 41 | ✅ | `R5-K-01` | compras-comprado-despues.png |
| K-02 | 41 | ✅ | `R5-K-02` | compras-despues.png, despensa-despues.png |
| K-03 | 41 | ✅ | `R5-K-03` | compras-despues.png |
| K-04 | 41 | ✅ | `R5-K-04` | compras-despues.png |
| K-05 | 41 | ✅ | `R5-K-05` | compras-realizadas-despues.png |
| K-06 | 41 | ✅ | `R5-K-06` | compras-realizadas-despues.png, compras-realizadas-despues-oscuro.png |
| K-07 | 41 | ✅ | `R5-K-07` | compras-realizadas-despues.png, compras-realizadas-despues-oscuro.png |
| K-08 | 41 | ✅ | `R5-K-08` | compras-realizadas-despues.png, compras-realizadas-despues-oscuro.png |
| K-09 | 41 | ✅ | `R5-K-09` | compras-realizadas-despues.png, compras-realizadas-despues-oscuro.png |
| K-10 | 41 | ✅ | `R5-K-10` | compras-menu-despues.png |
| K-11 | 41 | ✅ | `R5-K-11` | compras-menu-despues.png |
| K-12 | 41 | ✅ | `R5-K-12` | compras-menu-despues.png, despensa-despues.png |
| K-13 | 41 | ✅ | `R5-K-13` | compras-menu-despues.png |
| K-14 | 41 | ✅ | `R5-K-14` | compras-precios-despues.png, compras-costo-receta-despues.png |
| K-15 | 41 | ✅ | `R5-K-15` | compras-precios-despues.png |
| K-16 | 41 | ✅ | `R5-K-16` | despensa-despues.png |
| K-17 | 41 | ✅ | `R5-K-17` | despensa-despues.png |
| X-01 | 42 | ✅ | `R5-X-01` | preferencias-despues.png, preferencias-despues-oscuro.png |
| X-02 | 42 | ✅ | `R5-X-02` | presupuesto-despues.png |
| X-03 | 42 | ✅ | `R5-X-03` | presupuesto-despues.png |
| X-04 | 42 | ✅ | `R5-X-04` | preferencias-despues.png, preferencias-despues-oscuro.png |
| X-05 | 42 | ✅ | `R5-X-05` | preferencias-despues.png, preferencias-despues-oscuro.png |
| X-06 | 42 | ✅ | `R5-X-06` | preferencias-despues.png, preferencias-despues-oscuro.png |
| X-07 | 42 | ✅ | `R5-X-07` | preferencias-despues.png, preferencias-despues-oscuro.png |
| X-08 | 42 | ✅ | `R5-X-08` | asistente-ia-despues.png |
| X-09 | 42 | ✅ | `R5-X-09` | fuentes-despues.png |
| X-10 | 42 | ✅ | `R5-X-10` | como-funciona-despues.png |
| G-01 | 42 | ✅ | `R5-G-01` | respaldo-despues.png, calendario-despues.png, asistente-ia-despues.png |
| O-01 | 43 | ✅ | `R5-O-01` | bienvenida-despues.png, bienvenida-despues-oscuro.png |
| O-02 | 43 | ✅ | `R5-O-02` | bienvenida-evitar-despues.png, bienvenida-evitar-despues-oscuro.png |

Las capturas del antes y del después están en `docs/capturas-ronda-5/` (una por escena: dos ítems que se ven en la misma pantalla comparten archivo; las de tema oscuro llevan `-oscuro`). Los recorridos a 360 y 320 px se hicieron con el mismo script (`node herramientas/capturas.mjs --r5 despues --ancho 360`) y no se subieron al repositorio para no engordarlo.

## Decisiones tomadas sin Facunddominguez
Las que cambian algo que se ve o se guarda, por etapa (el texto completo y el motivo están en el Registro):
- **Etapas 34 a 36 (Semana):** "Mis planes" en Semana con Deshacer; los chips de los días sin la barra "4/4" (8 px entre chips); "Semanas anteriores y mes" arranca en la última semana con copia; "Completar precios" recorre producto por producto y "Guardar precios" guarda todos y dice cuántos. El error S-10 (frutos secos y fruta de estación seguían sin precio) se reprodujo primero con una prueba y se arregló sugiriendo la unidad en que la semana usa el producto.
- **Etapa 37:** C-01 (la comida armada no queda en el hueco) **no se pudo reproducir** en Semana ni en Hoy: se dejó una prueba que exige el resultado pedido en los cuatro caminos.
- **Etapa 38 (Hoy):** seis botones del mismo formato en tres grupos (propuesta con captura); se quitaron los dos Deshacer de debajo de las comidas.
- **Etapa 39 (Registro):** los contadores de "Veces que comiste" suman lo viejo de "Lo cociné"; el gasto semanal de R-09 sale de Compras realizadas en la moneda del presupuesto, con un presupuesto mensual se toma ×7/30. Sugerencia de gráfico extra (no implementada): evolución de "Con verduras" contra su objetivo en las últimas 8 semanas.
- **Etapa 40 (Comidas e IA):** todos los desplegables de Ideas y del editor pasan a botones que muestran u ocultan un bloque; la búsqueda incluye también desayunos y meriendas (si no, "hasta 15 min" quedaba vacío); el método de preparación se deduce de los pasos (sin dato nuevo); el interruptor de la despensa puntúa también las ideas.
- **Etapa 41 (Compras y Despensa):** "Ya tenés" a la vista chocaba con dos controles de rondas anteriores (`E1-palabras-compras` ≤ 262,8 palabras y `R4-26-alto` ≤ 3.300 px): para no aflojarlos, cada fila muestra solo el nombre y "Volver" (la cantidad y el motivo quedan en el `title`), "Agregar producto" va en dos columnas y Editar/Quitar van en la fila del producto; quedó en 261 palabras y 3.275 px. K-12: lo útil de "Porciones, existencias y costos" ya estaba en Despensa (el multiplicador queda fijo en 1); K-13 sacó también "Descontar lo que ya tengo" (dependía de lo eliminado).
- **Etapa 42 (Más):** X-03: "Comparar alternativas" suma el promedio de la región como otro precio para probar y muestra el "Precio usado"; X-07: "Limpiar preferencias" no hacía nada visible con los filtros de dieta, ahora los limpia, avisa y ofrece Deshacer; X-08 **no se pudo reproducir** con respuestas simuladas: se limpia lo que se pega, el botón dice "Probando…" y el resultado aparece a la vista; G-01: los desplegables que quedaban pasaron a la vista (el historial de cada ingrediente muestra los 3 últimos movimientos).
- **Etapa 43 (Bienvenida):** presentación de tres tarjetas con ilustraciones propias (se pasan con "Siguiente" o con el dedo; se puede saltear) y "Ingredientes a evitar" **dentro del paso 3**, para mantener los 4 pasos.

## Pruebas que ya fallaban por el día en que se corrían (arregladas solo en las pruebas)
Corridas un lunes (23/11) fallaban `C3-5h`, `E25-adopcion` (también en `main`) y `R5-C-01`; con DejaVu, `R4-27-arriba`. Dependían del día o de la semilla de la fecha de "Armame la semana". Se arreglaron fijando la semana o el hueco, sin cambiar lo que exigen.

## Pendientes para vos
1. **Probar "Guardar y probar" con tu clave real de Gemini** (X-08).
2. **En "Ya tenés" (K-03/K-04):** decidir si querés ver la cantidad y el motivo en cada fila; exige subir los topes `E1-palabras-compras` y `R4-26-alto` de `criterios.json`.
3. **En "Comparar alternativas" (X-03):** decidir si la elección debe guardarse como el precio que usa el presupuesto (hoy es un escenario de la sesión; guardarla pide una clave nueva).
4. Revisar en un teléfono real la presentación de la Bienvenida y los gráficos del Registro.
5. Sugerencias menores de los revisores que quedaron anotadas en el Registro (por ejemplo: "Ya tenés" y "Ya en tu despensa" con nombres parecidos, "1 ingredientes" en el presupuesto, el campo Moneda de Compras realizadas).

## Cómo revisar
`node herramientas/construir.mjs --verificar`, `node herramientas/probar.mjs` (783 pruebas) y `node herramientas/validar-etapa.mjs 44`. Las pruebas de GitHub corren en cada push a una rama con PR abierto.
