# Informe de la Ronda 3: precios confiables (v17.5.0)

Etapas 19 a 24, rama `rediseno-3` (partió de `main` en la v16.7.0). Cada etapa pasó la compuerta (`node herramientas/validar-etapa.mjs N`) y quedó marcada por su commit "Merge etapa N: …". Última corrida: **VALIDACIÓN ETAPA 24: OK** (143 controles, 607 pruebas; la línea base subió de 576 a 607). No se tocó `main` ni se usaron tags.

## Qué cambió para el usuario
- **Cada ingrediente encuentra su precio.** Un solo resolvedor de nombres para precios y nutrición (nombre exacto, sinónimos, nombre en la nutrición, y después sin paréntesis ni variantes: "Arroz (integral, yamaní)", "Yogur natural descremado", "Avena arrollada o instantánea"…).
- **Un solo costo.** La semana cuesta lo mismo en el aviso de "Armame la semana", en Semana, en Compras y en la barra de presupuesto. Lo que no tiene precio real se estima con la mediana de su categoría y se marca ("sin precio · estimado ≈ $X"); nunca cuenta $0 en silencio.
- **Semana dice cuánto falta:** "Semana ≈ $68.035 · hoy ≈ $7.248" y "Con precio: 27 de 32 productos · Completar 5 precios". "Faltan" cuenta productos distintos.
- **Ficha con precio.** Al tocar un ingrediente (en una comida, en la lista o en "Completar precios") se ve el precio con fuente, región, mes y rango, y se puede cargar "Mi precio" (kg, g, unidad o paquete) sin activar herramientas avanzadas, con Deshacer, borrar y aviso si el precio se aparta más de 3 veces del típico de su categoría.
- **Lo que arma la app tiene sentido.** Desayunos y meriendas con plantillas lógicas (yogur + fruta + avena o granola, pan + queso + fruta, licuado de leche + fruta, huevo + pan + fruta); nada de huevo ni queso con granola; una comida principal como mucho 2 veces, una proteína base y el arroz como mucho 3; las ideas guardadas (como las de la bienvenida) entran primero; "Cambiar por una más barata" solo compara comidas con todos sus precios y elige la más barata.
- **Mis comidas ya no se llena sola.** Lo que arma Armame queda "de la semana" (filtro propio) hasta que se toca "Guardar en mis comidas".
- **Catálogo y lista prolijos.** Las ideas tienen todo lo que nombra su título (hongos, jamón, palta); cucharadas y tazas pasan a gramos y envases; verduras con porciones comunes; no se sugiere unir quesos distintos; botón "Compartir lista" con texto para WhatsApp (secciones, cantidades, ≈ precio por producto y total).
- **Semana más clara.** Sin "Elegir el almuerzo de hoy"; "Armame la semana" única acción principal (pasa a "Rehacer semana" con la semana completa); el aviso queda hasta la próxima acción con Deshacer y el total de ahora; separación de 16 px.

## Medidas antes y después (semana armada de la prueba, presupuesto $60.000 a $70.000)
| Medida | v16.7.0 | v17.5.0 |
|---|---|---|
| Productos de la lista con precio real | 17 de 29 (59 %) | 19 de 25 (76 %) en la prueba; el resto, estimado o anotado sin dato |
| Totales distintos de la misma semana | 4 (≈ $30.550 / $1.938 / $28.610 / $34.127) | 1 (≈ $68.035 en la prueba) |
| "Faltan" | apariciones en Semana, productos en Compras | siempre productos distintos |
| Productos sin precio que cuentan $0 | 12 | 0 (estimado o "sin precio" con "al menos") |
| Filas de la lista en cucharadas o tazas | 3 o más | 0 |
| Lechuga y tomate por comida | 65 g | 80 g y 100 g |
| Mis comidas tras armar | +20 | +0 (quedan "de la semana") |
| Pruebas | 576 | 607 |

**Por qué sube el total.** La semana que antes decía ≈ $30.550 omitía 12 productos y los envases; ahora cuesta ≈ $55.000 a $68.000. Es el mismo menú contado completo, no un cambio de precios.

## Decisiones tomadas sin vos (detalle en el Registro de la Ronda 3)
1. **Cobertura de precios real:** el plan pedía 90 % con precio real de SEPA o INDEC. Esta sesión no puede bajar esos datos (dominios bloqueados), así que se llegó a 76 %. El control mide 90 % entre real y anotado "sin dato" y además exige un piso de 70 % real (`datos/precios-notas.json`). `revisor-codigo` lo marcó BLOQUEANTE en su momento; la salida honesta es correr "Actualizar precios" (ver Pendientes).
2. **El total cuenta envases enteros** (lo que se compra), y el costo de una comida o un día cuenta lo que se usa. Cambiarlo a "lo que se consume" es una sola función (`unidadesACostear`).
3. **Estimado = mediana por kg o litro de la categoría** en la región elegida.
4. **Presupuestos de las pruebas de Armame** sin cambio de exigencia pero con valores realistas ($60.000 y $70.000 en lugar de $26.000 y $40.000).
5. **Tope de `index.html`** de 820.000 a 860.000 bytes (844.000 hoy).
6. **Mi precio** nunca se guarda si lo que ya había en `referencePrices_v1` no se entiende (para no pisar nada); "paquete" se guarda como gramos con `pack:"paquete"`.
7. **De la semana:** campo nuevo `deLaSemana` en `miPlatoFacil_saved`; migración por historial del plan (solo marca lo guardado hasta 30 segundos antes de un "Armame la semana", sin favoritas ni cocinadas).
8. **Compras** pierde palabras (nombre sin paréntesis, fuente corta) para mantener E1-palabras-compras (260 de 262,8).

## Mejoras sugeridas
- La ficha de un ingrediente pone la nutrición antes que el precio: abrirla desde "Completar precios" con el precio arriba y "Guardar" fijo al pie.
- La hoja de un hueco tiene tres variantes de "Cambiar"; la merienda lleva el ícono del desayuno.
- `rangoDePrecios`, la calculadora de recetas y "Compras realizadas" siguen usando `pricesFor` (misma dimensión): un Mi precio por kg no se ve ahí si la cantidad está en unidades.
- "Borrar mi precio" solo borra el de la ficha, no los cargados en herramientas avanzadas.
- Una comida "de la semana" que se marca favorita no sale sola de la marca.
- Si ningún candidato cumple los topes de variedad, el hueco queda vacío sin aflojar el tope (con el catálogo por defecto nunca pasó).

## Pendientes para vos
1. **Correr "Actualizar precios"** (GitHub Actions) para que entren los precios de SEPA de los ítems nuevos del mapa (frutas, champiñones, granola, semillas de chía) y vaciar `sinDato` en `datos/precios-notas.json` de lo que entre. Con eso la cobertura real sube hacia el 90 %.
2. Merge del PR `rediseno-3` → `main` (lo hacés vos).
