# Mi Plato Fácil

App web progresiva (PWA) de un solo archivo, sin frameworks ni dependencias. Textos en español rioplatense, con voseo.

El plan del rediseño y el Registro están en docs/plan-rediseno.md.

## Comandos

- Construir: `node herramientas/construir.mjs` (genera `index.html` y `sw.js`; nunca se editan a mano).
- Verificar que estén al día: `node herramientas/construir.mjs --verificar`.
- Pruebas: `node herramientas/probar.mjs` (Chrome sin ventana; `--suites a.js,b.js` para correr algunas, `--json <archivo>` para el detalle, `--navegador <ruta>` si no encuentra Chrome).
- Capturas y medidas a 390×844: `node herramientas/capturas.mjs [--salida capturas/x] [--vistas hoy,semana] [--estados vacio,normal,todo] [--temas claro,oscuro]` (quedan en `capturas/`, ignorada por git).
- Validar una etapa: `node herramientas/validar-etapa.mjs N` → tiene que terminar en "VALIDACIÓN ETAPA N: OK". Con `--actualizar-linea-base` sube los conteos de la línea base (nunca los baja).

## Dónde está cada cosa

- `fuente/` es lo único que se edita: HTML por pantalla en `fuente/cuerpo/pantallas/`, código en `fuente/codigo/NN-*.js` (se une en orden numérico), estilos en `fuente/estilos.css`, versión en `fuente/version.json`.
- Datos del usuario: solo en `localStorage`, claves `miPlatoFacil_*`. Respaldo y restauración en `fuente/codigo/18-respaldo-completo.js`.
- `pruebas/`: baterías listadas en `pruebas/suites.json`; respaldo de ejemplo en `pruebas/fixtures/respaldo-v14.9.94.json` (no se modifica).
- `datos/`: archivos que generan las tareas de GitHub Actions y `construir.mjs` incrusta (nutrición; precios desde la Etapa 7).
- `docs/validacion/`: `criterios.json` (un control por cada "Hecho cuando") y `linea-base.json` (pruebas, claves y medidas de la v14.9.94).

## Reglas (resumen; el texto completo está en el plan)

1. Nunca trabajar, hacer push ni merge en `main`. Cada etapa va en su rama y entra a `rediseno` solo con la compuerta en verde. Sin force push, `reset --hard` ni reescribir historia.
2. Datos: no renombrar ni borrar claves `miPlatoFacil_*` ni cambiar su formato de forma incompatible. Lo nuevo va en claves `miPlatoFacil_<nombre>_v1`; una migración lee lo viejo, escribe lo nuevo, se puede correr dos veces y no borra lo viejo. Todo dato nuevo entra al respaldo (como opcional) y los respaldos viejos se siguen restaurando.
3. Ninguna función avanzada se elimina: se integra.
4. Al cerrar cada etapa: construir, todas las pruebas en verde y subir `fuente/version.json` (15.0.0 en la Etapa 1, después 15.1.0, 15.2.0…).
5. Pruebas: si una prueba protege datos o lógica, el código nuevo la cumple; si solo mira la interfaz vieja, se adapta en el mismo commit y se explica en el Registro. Nunca se borra una sin reemplazo ni baja la cantidad.
6. Sin dependencias nuevas ni llamadas a internet en la app (salvo la IA que ya existe). Los datos externos se bajan en GitHub Actions y se incrustan al construir.
7. Sistema de diseño (final de `fuente/estilos.css` y `pruebas/d01_diseno.js`): verde para acciones, rojo para borrar, objetivos de 44 px, tema claro y oscuro.
8. Reproducir antes de arreglar. Lo que el plan no decide: la opción más simple para el usuario y más fácil de revertir, anotada en el Registro.

## Ciclo de cada etapa (modo autónomo)

1. `git switch -c rediseno-etapa-N-tema rediseno` (no `rediseno/…`: git no deja tener a la vez la rama `rediseno` y ramas debajo de ese nombre).
2. Plan corto en el Registro: archivos, riesgos para los datos y pruebas que cambian. `revisor-codigo` lo critica antes de tocar código.
3. Implementación con commits chicos.
4. `node herramientas/validar-etapa.mjs N` hasta "VALIDACIÓN ETAPA N: OK".
5. `revisor-codigo` (diff contra `rediseno`) y `revisor-usuario` (capturas antes y después) responden BLOQUEANTE o NO BLOQUEANTE. Lo bloqueante se corrige y se vuelve al paso 4; lo demás va al Registro.
6. `git merge --no-ff` en `rediseno`, tag `etapa-N-ok`, push de `rediseno` y del tag; línea base, Registro y PR borrador al día.
7. Si fallan las pruebas del PR en GitHub, la etapa siguiente empieza arreglando eso. Después se sigue sin esperar.

## Condiciones de parada

- Tres intentos completos fallidos en una etapa: la rama queda con push y sin merge, y el Registro dice "⛔ PARADA" con el diagnóstico y 2 o 3 opciones.
- Parar sin hacer el cambio si hiciera falta borrar datos de usuarios, cambiar su formato sin una migración segura, o tocar `main`, permisos, configuración de GitHub, secretos o cuentas.
- Lo externo que falte va a "Pendientes para vos" en el Registro y se sigue.

## Vocabulario

Comida (todo lo guardado), Receta (comida con preparación), Semana, Lista, Despensa, Lo comí, Lo cociné.

## Notas del entorno

- En Windows: clonar con `git clone -c core.longpaths=true`. `.gitattributes` fuerza saltos de línea LF; sin eso, `--verificar` falla en un clon de Windows.
- El PR `rediseno` → `main` se maneja con `gh api` (REST). Las pruebas de GitHub corren en cada push a una rama con PR abierto (`.github/workflows/pruebas.yml`); publicar solo corre en `main`.
