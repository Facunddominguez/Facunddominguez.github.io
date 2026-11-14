# Ronda 5: lista de control de los 79 pedidos

Estado: ⬜ pendiente · ✅ hecho (prueba en verde y captura del después) · ⚠️ no hecho (con motivo y 2 opciones, abajo).
Cada ítem tiene un control `R5-<ID>` en `docs/validacion/criterios.json`. Las capturas van en `docs/capturas-ronda-5/` (`<ID>-antes.png` y `<ID>-despues.png`; los de modo oscuro, también `-oscuro`). El plan y las reglas de la ronda están en la sección "Ronda 5" de `docs/plan-rediseno.md`.

| ID | Pedido | Etapa | Prueba | Captura antes | Captura después | Estado |
|---|---|---|---|---|---|---|
| S-11 | "Compartir la semana" y "Descargar" se unifican en "Compartir la semana", con 3 opciones: Como texto, Como imagen y Descargar HTML. | 34 | R5-S-11 | — | — | ⬜ |
| S-12 | Descargar HTML baja la semana que se está viendo (esta o la que viene). | 34 | R5-S-12 | — | — | ⬜ |
| S-13 | En el menú ⋯, "Compartir la semana" va anteúltimo y "Empezar de nuevo", último. | 34 | R5-S-13 | — | — | ⬜ |
| S-15 | Desde la Semana principal se puede elegir un plan guardado y aplicarlo a la semana que se ve (con Deshacer en el aviso de Semana). | 34 | R5-S-15 | — | — | ⬜ |
| S-16 | Se elimina el botón y la sección "Historial de cambios" (los datos guardados quedan). | 34 | R5-S-16 | — | — | ⬜ |
| S-17 | Los chips de los días no se ven apretados: mejor espaciado, y si hace falta se quita la barra verde con "4/4". Mínimo 8 px entre chips y nada encimado a 320 px. | 34 | R5-S-17 | — | — | ⬜ |
| S-18 | Se eliminan "Buscar en mis recetas" y "Consultar mis recetas mientras planifico". | 34 | R5-S-18 | — | — | ⬜ |
| S-19 | Al elegir o cambiar una comida, "Mis recetas" es una sección más, junto a Recientes, Mis comidas e Ideas. | 34 | R5-S-19 | — | — | ⬜ |
| S-01 | Botones en lugar de listas desplegables, como en el resto de la app. | 35 | R5-S-01 | — | — | ⬜ |
| S-02 | Al entrar a "Semanas anteriores y mes" el contenido se ve enseguida: sin el botón "Ver mis semanas en el mes" y sin ese título. | 35 | R5-S-02 | — | — | ⬜ |
| S-03 | Sin contenido repetido: queda el calendario; debajo, "Semana anterior", "Semana siguiente" y "Guardar una copia del plan en esta semana", y el indicador del lunes. | 35 | R5-S-03 | — | — | ⬜ |
| S-04 | Debajo, la lista de comidas igual a la de la Semana principal (tarjetas por día), no botones que abren desplegables. | 35 | R5-S-04 | — | — | ⬜ |
| S-05 | Al tocar una comida ahí, la misma hoja que en Semana: Ver ingredientes o Ver receta, Cambiar, Cambiar por otra parecida, Cambiar por una más barata, Quitar y Cerrar. Los cambios se guardan en esa semana con fecha. | 35 | R5-S-05 | — | — | ⬜ |
| S-06 | Se elimina el botón "Cambiar comidas de una semana guardada". | 35 | R5-S-06 | — | — | ⬜ |
| S-14 | "Planes guardados" se usa desde acá: guardar el plan de la semana vista y aplicar uno guardado. Sale del menú ⋯ como botón propio y queda dentro de esta sección. | 35 | R5-S-14 | — | — | ⬜ |
| S-07 | "Completar N precios" abre directo el primer producto con su formulario de precio, sin una lista intermedia para tocar el producto. | 36 | R5-S-07 | — | — | ⬜ |
| S-08 | Botones "Anterior" y "Siguiente" para pasar de producto, con "2 de 5" a la vista. | 36 | R5-S-08 | — | — | ⬜ |
| S-09 | "Guardar precios" guarda de una vez todos los que completaste y dice cuántos guardó. | 36 | R5-S-09 | — | — | ⬜ |
| S-10 | Error: los frutos secos siguen apareciendo en "Completar precios" después de cargarles el precio. Reproducilo y arreglalo para todos los productos con el mismo problema. | 36 | R5-S-10 | — | — | ⬜ |
| C-01 | Error: al cambiar una comida y armar una nueva con "+ Armar nueva", la comida armada no queda en el hueco. Que quede. | 37 | R5-C-01 | — | — | ⬜ |
| C-02 | "Sugerirme" funciona igual en desayuno y merienda que en almuerzo y cena: sugiere una idea (no te pide armar una comida; para eso está "+ Armar nueva"). | 37 | R5-C-02 | — | — | ⬜ |
| C-03 | Al ver una comida que tiene receta, botón "Editar receta"; si no tiene, "Añadir receta". | 37 | R5-C-03 | — | — | ⬜ |
| C-04 | Con una dieta elegida (por ejemplo, vegetariano), al cambiar una comida no aparecen ideas que no la cumplen; tus comidas guardadas que no la cumplen se ven apagadas, con el motivo. | 37 | R5-C-04 | — | — | ⬜ |
| H-01 | Se elimina el botón Deshacer que aparece debajo de las 4 comidas del día. | 38 | R5-H-01 | — | — | ⬜ |
| H-02 | "Ver tu registro de hoy" sin la flecha y con el mismo formato que "Desayuno o merienda" y "Almuerzo o cena". | 38 | R5-H-02 | — | — | ⬜ |
| H-03 | En "Sugerirme algo" se elimina el botón interno "Al azar" (hace lo mismo). | 38 | R5-H-03 | — | — | ⬜ |
| H-04 | "Sugerirme algo" sugiere directo un plato con 3 opciones (Usar esta, Otra, Ver y cambiar), igual en desayuno y merienda que en almuerzo y cena. | 38 | R5-H-04 | — | — | ⬜ |
| H-05 | Debajo del plan del día, se redistribuyen Ver tu registro de hoy, Mañana, Desayuno o merienda, Almuerzo o cena, Sugerirme algo y Con lo que tengo: un mismo formato de botón, agrupados por para qué sirven y en un orden claro. Proponé la distribución en el Registro con captura. | 38 | R5-H-05 | — | — | ⬜ |
| R-01 | En toda la app, "Lo cociné" pasa a "Lo comí" (botones, hojas, textos y avisos). Los registros viejos de cocinado se muestran como "Lo comí". | 39 | R5-R-01 | — | — | ⬜ |
| R-02 | En Registro se eliminan los botones "+ Lo comí" y "+ Lo cociné". | 39 | R5-R-02 | — | — | ⬜ |
| R-03 | Se ve directo, sin desplegables, el contenido de "Anotar otra comida y ver la semana" y "Veces que comiste cada comida" (antes "cocinaste"; suma lo viejo de los dos registros). | 39 | R5-R-03 | — | — | ⬜ |
| R-04 | Se elimina "Todas las preparaciones" con todo su contenido. | 39 | R5-R-04 | — | — | ⬜ |
| R-05 | Se elimina el botón Deshacer del Registro. | 39 | R5-R-05 | — | — | ⬜ |
| R-06 | Se mantiene pasar de una semana a otra (‹ ›). | 39 | R5-R-06 | — | — | ⬜ |
| R-07 | Gráfico de barras de la semana: comidas registradas, del plan y fuera del plan. | 39 | R5-R-07 | — | — | ⬜ |
| R-08 | Gráfico de barras de la semana: con verduras, con legumbres, con pescado y con fruta. Sin registros, el gráfico dice "Sin registros esta semana". | 39 | R5-R-08 | — | — | ⬜ |
| R-09 | Gráfico de las últimas 4 semanas: presupuesto contra gasto real. El gasto sale de Compras realizadas y se puede corregir por semana (clave nueva `miPlatoFacil_gastoSemanal_v1`, opcional en el respaldo). | 39 | R5-R-09 | — | — | ⬜ |
| R-10 | Los gráficos se dibujan sin librerías, se leen en claro y en oscuro, y cada barra dice su número. Si proponés un gráfico más, va al Registro como sugerencia, no se implementa. | 39 | R5-R-10 | — | — | ⬜ |
| M-01 | Crear una receta nueva, reestructurado: pasos en orden, lo obligatorio marcado como obligatorio, lo opcional como opcional y sin desplegables. | 40 | R5-M-01 | — | — | ⬜ |
| M-02 | "Con lo que tengo" en Ideas es un botón más grande (botón principal de ancho completo). | 40 | R5-M-02 | — | — | ⬜ |
| M-03 | "Buscar con filtros" deja de ser desplegable: pasa a ser un botón, "Buscar por tiempo y método" o un nombre parecido, que abre la búsqueda. | 40 | R5-M-03 | — | — | ⬜ |
| M-04 | En esa búsqueda se eliminan: los botones "Recetas" y "Crear receta"; el texto "Explorá ideas y recetas guardadas…" con su campo; "Ver solo mis recetas"; "Limpiar búsqueda"; "Ordenar resultados" y "Resultados por página". | 40 | R5-M-04 | — | — | ⬜ |
| M-05 | Error: el filtro de tiempo da 0 resultados. Que filtre de verdad (por ejemplo, "hasta 20 min" muestra todas las ideas de 20 minutos o menos). | 40 | R5-M-05 | — | — | ⬜ |
| M-06 | La lista de resultados muestra al menos 6 ideas en pantalla a 390×844 (tarjetas compactas) y se puede recorrer completa. | 40 | R5-M-06 | — | — | ⬜ |
| M-07 | Filtros nuevos: método de preparación (horno, sartén, olla, sin cocción…) y precio por porción (hasta $1.500, hasta $2.500, más). | 40 | R5-M-07 | — | — | ⬜ |
| M-08 | La búsqueda se fusiona con "Recomendaciones según mi despensa": un interruptor "Priorizar lo que tengo en la despensa". Se eliminan los textos largos de esa sección ("Ordena recetas guardadas…", "El modo combinado…", "Las preferencias existentes…", "Recomendaciones desactivadas" y los selectores de prioridad). | 40 | R5-M-08 | — | — | ⬜ |
| M-09 | "Pedir ideas a la IA" es un botón, no un desplegable, y aparece solo con clave de Gemini. | 40 | R5-M-09 | — | — | ⬜ |
| M-10 | Espaciado de la sección Ideas: al menos 12 px entre bloques y nada encimado a 320 px. | 40 | R5-M-10 | — | — | ⬜ |
| A-01 | Sin clave de Gemini guardada no aparece ningún botón ni sección de IA en ninguna pantalla (incluido crear receta), salvo Más → Asistente de IA. "Con tu app de IA" se elimina. | 40 | R5-A-01 | — | — | ⬜ |
| K-01 | Se elimina el botón Deshacer de Compras. | 41 | R5-K-01 | — | — | ⬜ |
| K-02 | "Agregar producto" (y los formularios parecidos de Compras y Despensa) es un recuadro con los campos a la vista, con al menos 8 px entre el botón y el rótulo "Producto". | 41 | R5-K-02 | — | — | ⬜ |
| K-03 | "Ya tenés" no es un desplegable: se ve directo. | 41 | R5-K-03 | — | — | ⬜ |
| K-04 | Se puede sacar un producto de "Ya tenés" para que vuelva a la lista (con un botón en cada fila). | 41 | R5-K-04 | — | — | ⬜ |
| K-05 | En ⋯, "Compras realizadas" abre su contenido directo, sin otro desplegable. | 41 | R5-K-05 | — | — | ⬜ |
| K-06 | Se eliminan los botones "Compartir", "Copiar lista" y "Ver la semana" del pie de todas las subsecciones del menú ⋯ de Compras. | 41 | R5-K-06 | — | — | ⬜ |
| K-07 | En Compras realizadas, cada producto muestra claro cantidad, unidad y precio, en una fila prolija; en tema oscuro el selector de unidad no tiene fondo blanco. | 41 | R5-K-07 | — | — | ⬜ |
| K-08 | Compras realizadas muestra el total de la suma de los precios cargados, para compararlo con el ticket. | 41 | R5-K-08 | — | — | ⬜ |
| K-09 | "Actualizar Mis precios" y "Sumar a la despensa" van en renglones separados. | 41 | R5-K-09 | — | — | ⬜ |
| K-10 | Se elimina "Presupuesto" del menú ⋯ (ya está en la lista). | 41 | R5-K-10 | — | — | ⬜ |
| K-11 | Se elimina "Compartir o copiar lista" del menú ⋯. | 41 | R5-K-11 | — | — | ⬜ |
| K-12 | "Porciones, existencias y costos" sale del menú ⋯. Lo útil que no esté ya en la pestaña Despensa (cargar existencias con cantidad) pasa a Despensa sin desplegables; anotá en el Registro qué pasó y qué ya existía. | 41 | R5-K-12 | — | — | ⬜ |
| K-13 | Se elimina "Calcular para otras recetas". | 41 | R5-K-13 | — | — | ⬜ |
| K-14 | "Mis precios" y "Costo de una receta" abren su contenido directo, sin desplegables. | 41 | R5-K-14 | — | — | ⬜ |
| K-15 | "Mis precios" avisa qué ingredientes no tienen precio (los de la semana primero) y deja elegir uno de una lista o escribir uno propio. | 41 | R5-K-15 | — | — | ⬜ |
| K-16 | En Despensa se eliminan el botón Deshacer y "Todos los movimientos" (los datos quedan). | 41 | R5-K-16 | — | — | ⬜ |
| K-17 | "Revisar qué tengo y qué falta" es un botón, no un desplegable. | 41 | R5-K-17 | — | — | ⬜ |
| X-01 | En Preferencias, "Objetivos semanales" es un botón con el mismo estilo que el de Presupuesto, no un desplegable. | 42 | R5-X-01 | — | — | ⬜ |
| X-02 | Al editar el presupuesto el contenido se ve directo, sin el desplegable "Presupuesto". La única excepción adentro es "Comparar alternativas de precio". | 42 | R5-X-02 | — | — | ⬜ |
| X-03 | Error: en Comparar alternativas de precio, "Probá otro precio guardado" no cambia nada. Que cambie el precio usado y el total. | 42 | R5-X-03 | — | — | ⬜ |
| X-04 | "Otros, separados por coma" pasa a "Otros" con un ⓘ al lado que, al tocarlo, explica "Escribí ingredientes separados por coma". | 42 | R5-X-04 | — | — | ⬜ |
| X-05 | Espaciado en Ingredientes a evitar: al menos 8 px entre el título y su campo, y al menos 12 px entre "Ocultar diferencias", "Guardar preferencias" y "Limpiar preferencias". | 42 | R5-X-05 | — | — | ⬜ |
| X-06 | "Ingredientes equivalentes" es una caja con título y contenido a la vista, como Ingredientes a evitar, sin desplegable, y con el texto espaciado. | 42 | R5-X-06 | — | — | ⬜ |
| X-07 | Error: "Limpiar preferencias" no funciona. Que limpie (con Deshacer o confirmación en la página). | 42 | R5-X-07 | — | — | ⬜ |
| X-08 | Error: en Asistente de IA, al pegar la clave y tocar "Guardar y probar" no pasa nada. Que guarde, pruebe y diga si funcionó o por qué no. | 42 | R5-X-08 | — | — | ⬜ |
| X-09 | En Fuentes de datos, "Consultar nutrientes" sigue siendo desplegable, con al menos 8 px entre el rótulo "Ingrediente" y su campo. | 42 | R5-X-09 | — | — | ⬜ |
| X-10 | En Cómo funciona, "Publicación e instalación" sigue siendo desplegable y se elimina el texto "Medio plato de verduras, un cuarto de almidones y un cuarto de proteínas." | 42 | R5-X-10 | — | — | ⬜ |
| G-01 | Control global: en ninguna pantalla ni hoja hay listas desplegables, salvo las cuatro excepciones. | 42 | R5-G-01 | — | — | ⬜ |
| O-01 | Antes de los 4 pasos, una presentación breve y atractiva de la app: qué hace y lo mejor que tiene (armar la semana en un toque, la lista con precios reales, recetas con pasos, Lo comí), mostrada de forma creativa (por ejemplo, 3 tarjetas que se pasan con ilustraciones hechas en la app). Se puede saltear. | 43 | R5-O-01 | — | — | ⬜ |
| O-02 | Los 4 pasos se mantienen y se suma "Ingredientes a evitar" (con la dieta), dentro de un paso existente o en uno propio y opcional. | 43 | R5-O-02 | — | — | ⬜ |

## Ítems en ⚠️ (no hechos)
Ninguno todavía.

## Resumen (Etapa 44)
Se completa al cerrar la ronda: cuántos ítems quedaron en ✅, cuántos en ⚠️ y por qué.
