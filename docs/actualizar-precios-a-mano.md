# Actualizar los precios desde tu computadora

Desde el 17/11/2026 el portal de SEPA (`datos.produccion.gob.ar`) responde "403" a los servidores de GitHub, así que la tarea de los martes ya no puede bajar los precios de supermercado (ver P-02 en `docs/ronda-6-lista.md`). Desde una computadora común el portal sí responde. Esto lleva unos 5 minutos por semana.

## La primera vez (una sola vez)

1. Instalá **Node.js** (la versión "LTS") desde https://nodejs.org y **Git** desde https://git-scm.com. Aceptá las opciones que vienen marcadas.
2. Abrí una terminal (en Windows: "Símbolo del sistema" o "PowerShell"; en Mac: "Terminal") y bajá el proyecto:

   ```
   git clone -c core.longpaths=true https://github.com/Facunddominguez/facunddominguez.github.io.git
   ```

   Queda una carpeta `facunddominguez.github.io` en la carpeta donde estabas (por lo general, la de tu usuario).

## Cada semana (mejor un martes o miércoles)

En la terminal, uno por uno:

```
cd facunddominguez.github.io
git switch main
git pull
node herramientas/actualizar-precios.mjs
```

El último comando tarda de 1 a 5 minutos (baja un archivo grande de SEPA y el de INDEC). Tiene que terminar con una línea que empieza con **"SEPA 2026-…"** y sin errores. Si dice "Precios inválidos" o un error, no sigas: mandame lo que dice.

Después:

```
node herramientas/construir.mjs
git switch -c precios-semana
git add datos/precios.json index.html sw.js
git commit -m "Precios de SEPA e INDEC actualizados a mano"
git push -u origin precios-semana
```

La primera vez que hagas `git push`, se abre una ventana para entrar a GitHub con tu cuenta.

Por último, entrá a https://github.com/Facunddominguez/facunddominguez.github.io. Arriba aparece un aviso amarillo **"precios-semana had recent pushes"**: tocá **"Compare & pull request"**, después **"Create pull request"**. Esperá a que las pruebas den verde y tocá **"Merge pull request"**. La app se publica sola en unos minutos.

La semana siguiente, antes de empezar, borrá la rama vieja: `git switch main`, después `git pull` y `git branch -D precios-semana`. Después seguí con los pasos de "Cada semana".

## Cómo saber que funcionó

En la app, en Compras, la línea de la fuente pasa a decir la fecha nueva ("SEPA · GBA · 25 nov. 2026") y desaparece el aviso "Los precios pueden estar desactualizados".

## Si el archivo de SEPA no baja

Si el comando falla al bajar SEPA, podés bajar el ZIP del día a mano desde https://datos.produccion.gob.ar/dataset/sepa-precios. Después corré `node herramientas/actualizar-precios.mjs --archivo-sepa RUTA-DEL-ZIP`, cambiando `RUTA-DEL-ZIP` por la ruta del archivo que bajaste, y seguí igual.
