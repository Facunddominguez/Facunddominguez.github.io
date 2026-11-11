# Informe de la Ronda 4: la semana que se puede cocinar y pagar

Rama `rediseno-4` → `main`. Versiones 18.0.0 a 18.7.0 (etapas 25 a 32). Todas las etapas cerraron con "VALIDACIÓN ETAPA N: OK" y entraron a `rediseno-4` con su merge. Este PR queda abierto y sin mergear: el merge lo hacés vos.

## Qué cambia para quien usa la app

- **Lista para el súper (26).** Cada fila de Compras se toca entera para tacharla; la casilla mide 24 px, la fila 48 y el "ⓘ" (ficha del producto) 44×44. La lista y el texto que se comparte usan los mismos nombres cortos. El queso se cuenta en gramos (no en "4 unidades") y las tortillas en paquetes de 8. Ya no se sugiere unir "Cebolla de verdeo" con "Cebolla".
- **Semana más corta y con tus objetivos (27).** El aviso de la semana armada pasó de un párrafo a una línea: "Te pasás $N de tu presupuesto de $M. Lo que más pesa: …" o "Entra en tu presupuesto", con Deshacer al lado y "Ver detalle" cerrado. El armado cumple los objetivos de hábitos (por ejemplo, "pescado: 2") antes de mirar el costo y avisa si no llegó. Los nombres de las comidas ya no empiezan con emoji.
- **Ideas con cantidades y preparación (28 y 29).** El catálogo pasó de 41 a **100 ideas** (70 platos y 30 desayunos y meriendas), cada una con cantidades por persona, de 2 a 5 pasos y minutos. El detalle de una comida muestra "Qué lleva · para N personas" (por ejemplo, "Pollo · 150 g" para 1 y 300 g para 2) y "Cómo se hace". Una semana armada cubre mejor la energía y la lista de compras sale de las cantidades de las ideas. "Económica" marca el tercio más barato de cada tipo. Los desayunos tienen su propia sección de ideas en el selector.
- **Precios al día y de tu barrio (30).** Preferencias pregunta dónde comprás frutas y verduras (verdulería por defecto o supermercado) y la app usa el precio de esa fuente; la ficha de la papa muestra los dos. "Revisar N precios tuyos" avisa cuando un precio propio tiene más de 60 días, o más de 30 y se aparta un 20 % del de la zona; "Sigue igual" lo confirma sin tocar tus precios.
- **Hoy con costo y la semana para compartir (31).** Hoy dice "Hoy ≈ $… · Plato completo…" o "Te falta: …". El menú ⋯ de Semana ofrece "Compartir la semana" como texto o como imagen (1080×1350).
- **Respaldo sin olvidos (32).** Hoy y Mis datos avisan "Hace N días que no guardás una copia de tus datos" a partir de los 30 días (con "Más tarde" por 7 días). "Guardar copia" comparte o descarga un `.json` que se comprueba antes. La app pide almacenamiento persistente. "Recordarme armar la semana" baja un `.ics` semanal con un enlace `?ir=semana-proxima` que abre "Semana que viene".

## Medidas, antes y después

| Medida | Antes (v17.6.0, inicio de la ronda) | Después (v18.7.0) |
|---|---|---|
| Pruebas en la línea base | 607 | 667 |
| Controles en `docs/validacion/criterios.json` | 129 | 200 |
| Energía por día de una semana armada para 1 persona | ≈ 1.340 kcal de media | **1.916 kcal** de media (mínimo 1.557, máximo 2.309; ningún día baja de 1.400) en 10 semillas |
| Piso de presupuesto: semana más barata, 1 persona / 2 personas (precios congelados) | ≈ $57.100 / ≈ $92.900, pero con porciones chicas | **$62.027 / $103.605** con porciones de adulto (con las 41 ideas de adulto de la Etapa 28 eran ≈ $72.700 para 1 persona) |
| Alto de Compras a 390 px (estado normal) | 3.626 px | **3.120 px** (a 320 px: 3.871 → 3.341) |
| Primer hueco de Semana a 390 px (caso común) | 573 px | **497 px** (a 320 px: 590 → 512) |
| Ideas | 41 | **100** |
| `index.html` | 858.548 bytes (227.410 con gzip) | 961.542 bytes (251.830 con gzip); tope 1.100.000 y 300.000 |
| `datos/ideas.json` | no existía | 76.500 bytes (tope 150.000) |

Con la verdulería como fuente por defecto, la misma semana de prueba ($90.000 de presupuesto) cuesta $80.950; con "Supermercado", $88.419 (8,4 % menos; papa $2.201 contra $3.999 el kilo, tomate $4.039 contra $6.590).

Las pruebas ya no leen el `datos/precios.json` del día: corren con `pruebas/fixtures/precios-congelados.json`. Se comprobó que las 14 baterías de precios dan 72/72 con el mismo resultado aunque se borren 10 ítems o se multipliquen todos los precios por 1,3.

## Datos y compatibilidad

- No se renombró ni borró ninguna clave `miPlatoFacil_*` ni se cambió un formato.
- Tres claves nuevas, las tres opcionales en el respaldo y con validador: `miPlatoFacil_dondeCompro_v1`, `miPlatoFacil_preciosRevisados_v1` y `miPlatoFacil_respaldoAviso_v1`. El respaldo de ejemplo de la v14.9.94 se sigue restaurando completo.
- Archivos de datos nuevos que se incrustan al construir: `datos/ideas.json` y `datos/envases.json` (porciones de almidón, peso de la rebanada de queso y de la tortilla). Sin dependencias nuevas ni llamadas a internet. No se tocó `.github/workflows/`, `datos/precios.json` ni nada de configuración.

## Decisiones tomadas sin el dueño

Están detalladas en el Registro de la Ronda 4 de `docs/plan-rediseno.md`. Las que más pesan:

1. **Precios de prueba congelados** (25): `probar.mjs` y `capturas.mjs` construyen la app con un archivo de precios fijo; antes, tres pruebas se ponían rojas según el día. E20 y E24 arman su propio caso con la misma exigencia.
2. **Control de plausibilidad en `actualizar-precios.mjs`** (25): descarta un precio de SEPA que se aparta más de 4 veces de la mediana de su categoría (con al menos 5 ingredientes con precio); `--verificar` mira solo GBA.
3. **Porciones de adulto** (28): las ideas usan los rangos de adulto del plan, así que el piso del presupuesto sube respecto de las porciones chicas; se recalcularon los presupuestos de `e15` y `e24` (la misma exigencia).
4. **Tortillas de maíz** (28): las ideas "de maíz" llevan "Tortillas de trigo" en las cantidades porque "Tortillas de maíz" no tiene precio ni se puede estimar.
5. **Costo de las ideas** (29): se ajustaron cantidades (no títulos) para tener 24 platos de $2.500 o menos y 11 desayunos de $1.300 o menos por porción; Berenjena pasó al ámbito "núcleo" de `precios-mapa.json`, único cambio de datos fuera de `ideas.json`.
6. **Verdulería por defecto** (30): INDEC de la región, INDEC de GBA, SEPA de la región y SEPA de GBA, solo para frutas y verduras.
7. **Aviso de respaldo** (32): se cuenta en días calendario locales; `primerUso` se escribe la primera vez que se mira Hoy con datos, así que quien ya tenía datos recibe el aviso 30 días después de actualizar. La fecha de la copia solo se guarda si el respaldo es válido.
8. **Pruebas adaptadas** (misma exigencia, explicadas en el Registro): `e8_herramientas` C8-3, `e13`, `e15`, `e20`, `e21`, `e23`, `e24`, `e2_semana` C2-8c, `r3_saved` y `f03_plan` P9c. Las relajaciones de la Etapa 27 se revirtieron cuando la revisión de la Etapa 29 mostró que ocultaban ideas sin precio.

## Mejoras sugeridas (de los revisores)

- Semana: el aviso dice qué pasó pero no qué hacer (por ejemplo, cambiar una comida por una más barata); "14/10" no se explica solo.
- Compras: cantidades sueltas como "Ajo: 1,5 unidades"; "Quitar" en "Otros productos" baja a su propia línea; el recuadro de presupuesto con borde rojo se lee como alarma; la fila tachada no se atenúa.
- Precios: marcar en la ficha cuál de los dos precios usa la app; "Actualizar" y "Guardar mi precio" compiten como botones llenos; "Revisar N precios tuyos" se parte en 3 líneas junto a "Completar" a 390 px.
- Hoy: "Plato completo" se lee como lo planificado y no como lo comido; "Te falta" puede sonar a reproche.
- Ideas: pasos que nombran queso rallado, lechuga o mayonesa sin cantidad; un desayuno propio sin nota con el mismo trío que una idea hereda su nombre corto.
- Respaldo: `validRespaldoAviso` usa `toISOString()` y en husos UTC+13 o UTC+14 rechazaría fechas válidas (no afecta a Argentina).
- Preferencias está cargada; el botón "⋯" del detalle de una comida no dice qué esconde; "Registro" está fuera del vocabulario.

## Pendientes para vos

- **Yogur natural**: `datos/precios-mapa.json` busca "Yogur natural" con filtro de SEPA `u: "kg"` pero la app lo muestra por litro (≈ 3 % de diferencia), y el natural cuesta casi el doble que el descremado sin explicación clara. Con una corrida real de "Actualizar precios" se puede ver cuál de los dos productos es el raro. No se tocó el mapa.
- **Próxima corrida de precios**: con los datos de hoy descartará unos 10 precios de SEPA de otras regiones (Azúcar Cuyo es un falso positivo por barato y conviene anotarlo como excepción en `datos/precios-notas.json`).
- **Merge del PR** `rediseno-4` → `main` y revisión de las pruebas de GitHub Actions del PR (no se tocó `.github/workflows/`).

## Compuerta

Última salida de `node herramientas/validar-etapa.mjs 32 --actualizar-linea-base`:

```
· Línea base actualizada: 667 pruebas, 38 claves (antes 660 y 37)
VALIDACIÓN ETAPA 32: OK (207 controles, 13.7 min)
```

`main` no cambió durante la ronda (ya está incluido en `rediseno-4`), así que no hizo falta traerlo ni repetir la compuerta. Las etapas 25 a 31 cerraron con: 618, 624, 630, 638, 650, 656 y 660 pruebas.
