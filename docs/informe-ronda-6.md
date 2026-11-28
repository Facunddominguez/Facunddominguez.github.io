# Informe de la Ronda 6 (Etapas 45 a 55)

Versión final: **20.10.0**. Rama `rediseno-6` → `main`. Esta página es la descripción del PR y se genera desde `docs/ronda-6-lista.md`.

## Resultado

- **51 ítems**: **46 ✅** (cada uno con su prueba en verde y su captura del después) y **5 ⚠️** (no hechos, con el motivo y 2 opciones en `docs/ronda-6-lista.md`, sección "Ítems en ⚠️").
- Cada etapa cerró con `node herramientas/validar-etapa.mjs N` en "OK", la batería completa con la tipografía del navegador y también con DejaVu (la del runner de GitHub), y la revisión de `revisor-usuario` (y de `revisor-codigo` en las Etapas 45, 46, 48, 49, 50, 51 y 52). Lo bloqueante se corrigió antes de integrar.
- Ninguna clave `miPlatoFacil_*` existente cambió de formato ni se borró. Claves nuevas (todas opcionales en el respaldo, y un respaldo viejo sin ellas se restaura igual): `comprasPeriodo_v1`, `semanaAjustes_v1`, `gustos_v1`, `armameReglas_v1`, `hoyAvisos_v1` y `comensales_v1`. `miPlatoFacil_hogar_v1` sigue aceptando solo `personas`; sin configurar nada nuevo, cantidades, lista y costos dan lo mismo que en la v19.10.5.
- Sin dependencias nuevas ni llamadas a internet en la app, salvo Gemini (la foto del ticket solo se envía con la clave del usuario).
- No se hizo push ni merge a `main`. Este PR queda **sin mergear**, listo para revisar.

## Los ítems

| ID | Pedido | Etapa | Estado | Prueba | Capturas (después) |
|---|---|---|---|---|---|
| P-01 | Error: la tarea "Actualizar precios (SEPA e INDEC)" falló el 10/11 con "SEPA: ZIP64 no soportado". Reproducilo con un ZIP64 de prueba y q… | 45 | ✅ | R6-P-01 | p-01-despues.txt |
| P-02 | Error: el 17/11 y el 24/11 la tarea recibió "HTTP 403 al pedir el paquete de SEPA". Reproducilo, probá reintentos con espera y cabeceras … | 45 | ⚠️ | — | — |
| P-03 | Si SEPA no da precios nuevos y los guardados tienen más de 10 días, la tarea termina en falla (para que GitHub mande el aviso) en vez de … | 45 | ✅ | R6-P-03 | p-03-despues.txt |
| P-04 | En la app, junto a la fuente de precios (lista, presupuesto y ficha de precio), la antigüedad en palabras: "Precios de hace 22 días", con… | 45 | ✅ | R6-P-04 | lista-precios-despues.png, lista-precios-despues-oscuro.png, presupuesto-precios-despues.png |
| P-05 | Desde los 14 días, un aviso visible en la lista: "Los precios pueden estar desactualizados. Tus precios (Mi precio) se usan primero." Con… | 45 | ✅ | R6-P-05 | lista-precios-despues.png, lista-precios-despues-oscuro.png |
| L-01 | Arriba de la lista, "Comprar para" con tres botones: Esta semana, La semana que viene y Las dos. La lista, el total y la barra de presupu… | 46 | ✅ | R6-L-01 | compras-periodo-despues.png, compras-periodo-despues-oscuro.png, compras-proxima-despues.png |
| L-02 | "Esta semana" cuenta las comidas de hoy al domingo, no las de días que ya pasaron. | 46 | ✅ | R6-L-02 | compras-periodo-despues.png, compras-periodo-despues-oscuro.png |
| L-03 | Del viernes al domingo, si la semana que viene tiene al menos una comida, la lista abre en "La semana que viene"; los otros días, en "Est… | 46 | ✅ | R6-L-03 | compras-periodo-despues.png, compras-periodo-despues-oscuro.png, compras-viernes-despues.png |
| L-04 | Lo tachado se guarda en la semana de cada comida: tachar algo de la semana que viene no cambia esta semana, y lo ya tachado sigue igual. … | 46 | ✅ | R6-L-04 | compras-proxima-despues.png, compras-dos-tachado-despues.png |
| L-05 | Compartir la lista dice el período ("Lista para la semana del 30/11 al 6/12") y lleva solo los productos de ese período. | 46 | ✅ | R6-L-05 | compras-compartir-despues.png |
| L-06 | "Agregar producto" pasa debajo de la lista. | 46 | ✅ | R6-L-06 | compras-periodo-despues.png, compras-periodo-despues-oscuro.png |
| C-01 | En la ficha de una receta, los ingredientes y los pasos van primero; Ver en el registro, Compartir y ⋯ van después de los pasos. | 47 | ✅ | R6-C-01 | ficha-comida-despues.png, ficha-comida-despues-oscuro.png, ficha-receta-despues.png |
| C-02 | Si la comida ya está en la semana que se ve, en lugar de "Agregar a la semana" como botón principal se lee "En la semana: martes, cena", … | 47 | ✅ | R6-C-02 | ficha-comida-despues.png, ficha-comida-despues-oscuro.png, ficha-receta-despues.png |
| C-03 | Botón principal "Cocinar" en toda receta con pasos. Abre una pantalla completa: primero los ingredientes con las cantidades de la ficha y… | 47 | ✅ | R6-C-03 | ficha-comida-despues.png, ficha-comida-despues-oscuro.png, cocina-ingredientes-despues.png |
| C-04 | Si un paso dice un tiempo ("10 minutos", "1 hora", "media hora", "5 a 7 min"), aparece un temporizador con ese tiempo (en un rango, el me… | 47 | ✅ | R6-C-04 | cocina-paso-despues.png, cocina-paso-despues-oscuro.png |
| C-05 | Mientras el modo cocina está abierto, la pantalla no se apaga (Screen Wake Lock); al salir se libera. Donde el navegador no lo permite, n… | 47 | ✅ | R6-C-05 | cocina-ingredientes-despues.png, cocina-ingredientes-despues-oscuro.png |
| C-06 | El último paso termina con "Lo comí", que hace lo mismo que Lo comí desde la ficha (registro y descuento de la Despensa), y "Salir". | 47 | ✅ | R6-C-06 | cocina-final-despues.png |
| C-07 | El modo cocina se usa con una mano a 320 px: botones de al menos 44 px abajo de la pantalla, nada encimado, en claro y en oscuro. | 47 | ✅ | R6-C-07 | cocina-paso-despues.png, cocina-paso-despues-320.png, cocina-paso-despues-oscuro.png |
| F-01 | En la hoja de una comida (Semana y Semanas anteriores y mes), "Pasar a otro día": elegís día y comida; si el destino tenía algo, se inter… | 48 | ✅ | R6-F-01 | semana-hoja-lleno-despues.png, semana-pasar-despues.png |
| F-02 | "Comemos afuera": el hueco queda marcado "Afuera", no suma a la lista ni al presupuesto y Armame no lo llena. Se puede anotar cuánto se g… | 48 | ✅ | R6-F-02 | semana-hoja-lleno-despues.png, semana-afuera-despues.png, semana-afuera-despues-oscuro.png |
| F-03 | "Que sobre para mañana" en almuerzo y cena: pone la misma comida en el almuerzo del día siguiente con la marca "Sobra de la cena del lune… | 48 | ✅ | R6-F-03 | semana-hoja-lleno-despues.png, semana-sobra-despues.png, semana-sobra-despues-oscuro.png |
| F-04 | El plan guardado no cambia de formato: "Afuera" y "Sobra de" viven en la clave nueva, entran al respaldo y se restauran, y un respaldo vi… | 48 | ✅ | R6-F-04 | semana-afuera-despues.png, semana-afuera-despues-oscuro.png, respaldo-semana-despues.png |
| A-01 | Después de "Lo comí" (en Hoy, Registro y modo cocina), una pregunta opcional de un toque: "¿Te gustó?" Sí / No, que se puede cerrar sin r… | 49 | ✅ | R6-A-01 | hoy-gusto-despues.png, hoy-gusto-despues-oscuro.png |
| A-02 | Armame prefiere tus favoritas, las comidas con "Sí" y las que más comiste. Prueba con fecha fija: con una favorita y la semana vacía, la … | 49 | ✅ | R6-A-02 | semana-armada-detalle-despues.png |
| A-03 | Armame no elige una comida con dos o más "No" y ningún "Sí" después; al cambiar una comida, esas aparecen al final con la nota "No te gus… | 49 | ✅ | R6-A-03 | selector-no-gusto-despues.png |
| A-04 | Armame no repite almuerzos ni cenas de la semana anterior, salvo favoritas o si no alcanzan las opciones, y en ese caso lo dice en Ver de… | 49 | ✅ | R6-A-04 | semana-armada-detalle-despues.png |
| A-05 | "Días con poco tiempo" en Preferencias: por defecto, cenas de lunes a viernes hasta 30 minutos, editable por día y comida. Armame pone en… | 49 | ✅ | R6-A-05 | preferencias-poco-tiempo-despues.png, preferencias-poco-tiempo-despues-oscuro.png |
| A-06 | Ver detalle del aviso de la semana armada dice por qué eligió (favoritas, lo que te gustó, poco tiempo). | 49 | ✅ | R6-A-06 | semana-armada-detalle-despues.png |
| H-01 | En Hoy, tarjeta "Para mañana" cuando las comidas de mañana necesitan algo la noche anterior: legumbres secas ("Poné en remojo los porotos… | 50 | ✅ | R6-H-01 | hoy-para-manana-despues.png, hoy-para-manana-despues-oscuro.png |
| H-02 | Si mañana no hay nada que preparar antes, la tarjeta no aparece. | 50 | ✅ | R6-H-02 | hoy-sin-aviso-despues.png |
| H-03 | "Para comprar hoy: X e Y" cuando ingredientes de las comidas de hoy no están en la Despensa ni tachados en la lista, con el botón "Ver en… | 50 | ✅ | R6-H-03 | hoy-para-manana-despues.png, hoy-para-manana-despues-oscuro.png |
| H-04 | Las palabras que disparan cada aviso están en un archivo de datos, y la prueba usa 3 recetas reales del catálogo (una con legumbres secas… | 50 | ✅ | R6-H-04 | hoy-para-manana-despues.png, hoy-para-manana-despues-oscuro.png |
| Q-01 | Donde hoy se elige la cantidad de personas: adultos y chicos; un chico cuenta media porción por defecto (editable de 0,25 a 1). | 51 | ✅ | R6-Q-01 | preferencias-comensales-despues.png, preferencias-comensales-despues-oscuro.png, comensales-hoja-despues.png |
| Q-02 | Una grilla simple de cuántos comen en casa en cada comida de cada día, con el atajo "Almuerzos de lunes a viernes: N". Un hueco con 0 se … | 51 | ✅ | R6-Q-02 | comensales-hoja-despues.png, comensales-hoja-despues-oscuro.png, hoy-nadie-come-despues.png |
| Q-03 | Las cantidades de la ficha, la lista, el costo de la semana y el presupuesto usan las porciones de cada hueco. Prueba: 2 adultos y 1 chic… | 51 | ✅ | R6-Q-03 | lista-comensales-despues.png, lista-comensales-despues-oscuro.png |
| Q-04 | Sin configurar nada, todo da lo mismo que en la v19.10.5, y miPlatoFacil_hogar_v1 sigue igual y se usa cuando la clave nueva no existe. | 51 | ✅ | R6-Q-04 | lista-sin-configurar-despues.png, lista-sin-configurar-despues-oscuro.png |
| Q-05 | En la Bienvenida, el paso del hogar pregunta adultos y chicos (opcional). | 51 | ✅ | R6-Q-05 | bienvenida-hogar-despues.png |
| T-01 | Con clave de Gemini, en Compras realizadas: "Cargar ticket (foto)". Sin clave no aparece. | 52 | ✅ | R6-T-01 | ticket-boton-despues.png, ticket-boton-despues-oscuro.png, ticket-sin-clave-despues.png |
| T-02 | Sacás o elegís una foto; se achica en el teléfono antes de enviarla (lado mayor de 1600 px, JPEG) y va a Gemini con el mismo manejo de er… | 52 | ✅ | R6-T-02 | ticket-revision-despues.png, ticket-revision-despues-oscuro.png |
| T-03 | La respuesta se muestra para revisar: producto, cantidad, unidad, precio y con qué ingrediente de la app se relaciona (editable o "No rel… | 52 | ✅ | R6-T-03 | ticket-revision-despues.png, ticket-revision-despues-oscuro.png |
| T-04 | "Guardar" crea una Compra realizada con esos productos y el total, actualiza Mi precio de los relacionados y suma a la Despensa lo relaci… | 52 | ✅ | R6-T-04 | ticket-revision-despues.png, ticket-revision-despues-oscuro.png, ticket-guardar-despues.png |
| T-05 | Mensajes claros si la foto no se lee, si no vinieron productos o si no hay conexión. Nada se guarda sin confirmar. | 52 | ✅ | R6-T-05 | ticket-error-despues.png |
| T-06 | Las pruebas usan respuestas de Gemini simuladas, sin internet: un ticket normal, uno con productos que la app no conoce y una respuesta m… | 52 | ✅ | R6-T-06 | ticket-revision-despues.png, ticket-revision-despues-oscuro.png |
| O-01 | Fechas bien escritas en toda la app: el mes en minúscula y "de", "del" y "al" en minúscula ("noviembre de 2026", "Semana del 23 al 29 de … | 53 | ✅ | R6-O-01 | calendario-mes-despues.png, calendario-mes-despues-oscuro.png |
| O-02 | Al elegir o cambiar una comida, ninguna comida aparece dos veces: Recientes va primero y Mis comidas muestra el resto. | 53 | ✅ | R6-O-02 | selector-recientes-despues.png |
| O-03 | Una sola acción principal (botón verde lleno) a la vista al abrir cada pestaña: Hoy, Semana, Comidas, Compras y Más. Lo demás queda secun… | 53 | ✅ | R6-O-03 | principal-hoy-despues.png, principal-hoy-despues-oscuro.png, principal-semana-despues.png |
| O-04 | Anotá en el Registro cuántos botones tiene cada pantalla antes y después. No se elimina ninguna función: solo se ordena. | 53 | ✅ | R6-O-04 | principal-hoy-despues.png, principal-hoy-despues-oscuro.png |
| E-01 | datos/estacion.json con las frutas y verduras de estación de Argentina por mes, armado desde una fuente pública que el archivo cita (nomb… | 54 | ⚠️ | — | — |
| E-02 | "Fruta de estación" muestra ejemplos del mes en la ficha, la lista y Hoy ("Fruta de estación: durazno, ciruela o sandía"); su precio se c… | 54 | ⚠️ | — | — |
| E-03 | En la lista y al elegir una comida, las frutas y verduras de estación llevan la marca "de estación". | 54 | ⚠️ | — | — |
| E-04 | Entre opciones parecidas, Armame prefiere las que usan frutas y verduras de estación (como desempate, no como regla fija) y lo dice en Ve… | 54 | ⚠️ | — | — |

## Decisiones que tomé (lo que el plan no decidía)

- **Precios (45):** el 403 de SEPA es un bloqueo por origen a los servidores de GitHub; no se inventó otra fuente (P-02 ⚠️). La antigüedad de los precios se cuenta contra la fecha del teléfono.
- **Lista por período (46):** "Esta semana" cuenta de hoy al domingo; del viernes al domingo, con la semana que viene armada, abre en "La semana que viene". Lo tachado se guarda por semana y las marcas de otra semana nunca se reescriben.
- **Modo cocina (47):** una sola pantalla por paso, temporizadores y Screen Wake Lock del navegador; "Lo comí" del último paso hace lo mismo que el de la ficha.
- **Semana flexible (48):** "Afuera" y "Sobra de…" viven en una clave nueva (el plan guardado no cambia de formato).
- **Armame (49):** favoritas +4, "Sí" neto de −3 a 3 por 1,5, lo comido hasta 4 por 0,5; dos "No" seguidos sin un "Sí" sacan la comida; no repite la semana pasada (salvo favoritas o si no alcanza) y por omisión las cenas de lunes a viernes miran hasta 30 minutos (editable).
- **Hoy (50):** las palabras de los avisos están en `datos/avisos-hoy.json`; una legumbre con receta avisa solo si la preparación habla de remojar.
- **Comensales (51):** adultos y chicos (un chico = media porción por omisión), grilla por comida en una hoja (28 selectores no entran en Preferencias por su tope de palabras); `hogar_v1` no se toca.
- **Ticket (52):** los tres tildes (compra, Mis precios, Despensa) arrancan puestos; la relación automática solo si todas las palabras del ingrediente están en el producto.
- **Orden (53):** una sola acción principal por pestaña (Hoy: "Lo comí" de la primera comida por anotar; Semana: "Armame la semana"; Comidas: "+ Nueva"; Compras: "Terminé de comprar", ahora arriba de la lista; Más: "Registro"). La cantidad de botones por pantalla no cambió.
- **Herramienta:** `construir.mjs` ya no pone en `index.html` los comentarios de línea completa del código (≈ 104 KB): sin eso las Etapas 52 y siguientes no entraban en los topes de tamaño, que no se tocaron.

## Pendientes para vos

- **P-02 (SEPA, HTTP 403 desde GitHub):** correr `node herramientas/actualizar-precios.mjs` desde tu computadora una vez por semana (o un runner autoalojado), o pedir a la Secretaría de Comercio que deje pasar a GitHub Actions. Detalle y opciones en `docs/ronda-6-lista.md`.
- **E-01 a E-04 (frutas y verduras de estación):** no se pudo armar `datos/estacion.json` porque desde este entorno ningún sitio con el calendario oficial responde (`buenosaires.gob.ar`, `argentina.gob.ar` y notas de prensa quedaron fuera de la red permitida) y inventarlo no corresponde. Hace falta habilitar el dominio o pasar la fuente; con el archivo, E-02 a E-04 se hacen sin tocar nada más. Opciones en `docs/ronda-6-lista.md`.
- El botón "📅 Mañana" de Hoy muestra, un domingo, el lunes de la semana que ya pasó (código de antes de la ronda); "Para mañana" ya mira la semana que viene.
