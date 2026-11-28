// Mi Plato Fácil · Frutas y verduras de estación (Ronda 6, Etapa 54; completada en la v20.11). Los datos vienen de
// datos/estacion.json (fuente: Gobierno de la Ciudad de Buenos Aires, citada en el archivo), incrustado al construir.
// - "Fruta de estación" muestra ejemplos del mes: "Fruta de estación (durazno, damasco o frutilla)". El precio no cambia.
// - En la lista y al elegir una comida, lo de estación lleva la marca "de estación".
// - Armame usa lo de estación como desempate (un poco de puntaje, menos que el azar) y lo dice en "Ver detalle".
// Lo de "todo el año" (cebolla, papa…) no se marca: siempre está. No guarda nada.
// Parte 53: los archivos se unen en orden según su número, que define el orden de arranque.
var ESTACION_DATOS=__DATOS_ESTACION__;
var Estacion={
NOMBRES:{verano:"verano",otono:"otoño",invierno:"invierno",primavera:"primavera"},
normal(t){
  return String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").trim()
},
// La estación de una fecha (por omisión, hoy): "primavera" en noviembre.
temporada(fecha){
  const mes=(fecha instanceof Date?fecha:new Date()).getMonth()+1;
  for(const [t,meses] of Object.entries(ESTACION_DATOS.meses))if(meses.includes(mes))return t;
  return null
},
// Lo de estación hoy: un Map de la palabra sin tildes (y sus sinónimos) al nombre como lo escribe la fuente.
mapa(fecha){
  const t=Estacion.temporada(fecha),m=new Map();
  if(!t)return m;
  const sin=ESTACION_DATOS.sinonimos||{};
  for(const n of [...ESTACION_DATOS.temporadas[t].frutas,...ESTACION_DATOS.temporadas[t].verduras]){
    const k=Estacion.normal(n);
    m.set(k,n);
    for(const s of sin[k]||[])m.set(Estacion.normal(s),n)
  }
  return m
},
// Un ingrediente es de estación si su primera palabra (en singular) lo es: "Tomate cherry" sí, "Salsa de tomate" no.
deEstacion(nombre,fecha){
  const w=Estacion.normal(nombre).split(/[^a-zñ]+/).filter(Boolean)[0];
  if(!w)return null;
  const m=Estacion.mapa(fecha);
  for(const c of [w,w.replace(/es$/,""),w.replace(/s$/,"")])if(m.has(c))return m.get(c);
  return null
},
es(nombre,fecha){
  return !!Estacion.deEstacion(nombre,fecha)
},
// De una lista de ingredientes, lo de estación (sin repetir).
deLista(nombres,fecha){
  return [...new Set((nombres||[]).map(n=>Estacion.deEstacion(n,fecha)).filter(Boolean))]
},
// "durazno, damasco o frutilla": las tres primeras frutas de la estación, como las ordena la fuente.
ejemplosFruta(fecha){
  const t=Estacion.temporada(fecha);
  if(!t)return "";
  const f=ESTACION_DATOS.temporadas[t].frutas.slice(0,3);
  return f.length>1?f.slice(0,-1).join(", ")+" o "+f.at(-1):f.join("")
},
// Agrega los ejemplos del mes a "Fruta de estación" dentro de un texto (una vez): "Fruta de estación (durazno, damasco o frutilla): 7 unidades".
conEjemplos(texto,fecha){
  const s=String(texto==null?"":texto),ej=Estacion.ejemplosFruta(fecha);
  if(!ej||/fruta de estación \(/i.test(s))return s;
  return s.replace(/fruta de estación/i,m=>m+" ("+ej+")")
},
// La marca "de estación" (para filas de la lista y del selector de comidas).
marca(clase){
  const s=ce("span",clase||"marca-estacion","de estación");
  s.dataset.deEstacion="1";
  return s
}
};
