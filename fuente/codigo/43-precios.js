// Mi Plato Fácil · Precios automáticos (Etapa 7): promedio de INDEC por región, sin conexión.
// Parte 44: los archivos se unen en orden según su número, que define el orden de arranque.
// Los datos los baja una tarea de GitHub Actions y se incrustan al construir. init() corre durante la carga de 14, antes
// que este archivo: acá solo hay function, var y manejadores (nada de const/let que usen los archivos anteriores), y al
// final se repinta lo que ya se había dibujado sin precios.
// La región se guarda como {"region":"Pampeana"} (el respaldo pide un objeto por clave).
// Los precios se ven con el interruptor "Mostrar precios y presupuesto" (el mismo del modo simple, uiMode_v1): apagado
// no aparece ningún "≈ $". "Mi precio" (referencePrices_v1) gana sobre el promedio de INDEC.
// Funciones de este archivo, agrupadas (Etapa 18). El resto de la app las llama como Precios.nombre().
var Precios={
// Etapa 19: el ítem de precios de un ingrediente. Para cada forma del nombre (el nombre, y después sus variantes) prueba el
// nombre exacto o su sinónimo y los nombres con que la nutrición lo conoce ("Yogur natural descremado" es "Yogur descremado").
itemDe(nombre,d){
  d=d||preciosDataset();
  if(!d)return null;
  const clave=String(nombre||"");
  if(!d.res)d.res=new Map();
  if(d.res.has(clave))return d.res.get(clave);
  const nut=nutritionDataset().byKey;
  let hallado=null;
  for(const n of [clave].concat(Ingredientes.variantesNombre(clave))){
    hallado=d.byKey.get(ingredientKey(n))||null;
    if(!hallado){
      const x=nut.get(ingredientKey(n));
      if(x)for(const nm of [x.n].concat(x.s||[])){
        hallado=d.byKey.get(ingredientKey(nm))||null;
        if(hallado)break
      }
    }
    if(hallado)break
  }
  d.res.set(clave,hallado);
  return hallado
},
precioIndec(nombre){
  const d=preciosDataset();
  if(!d)return null;
  const it=Precios.itemDe(nombre,d);
  if(!it)return null;
  const r=regionPrecios(),usada=valorRegionPrecio(it.p,r)!==null?r:"GBA";
  return valorRegionPrecio(it.p,usada)===null?null:{
    it,precio:it.p[usada],region:usada
  }
}
};
var PRECIOS_SNAPSHOT=__DATOS_PRECIOS__;
var REGION_PRECIOS_KEY="miPlatoFacil_region_v1";
var REGIONES_PRECIOS=["GBA","Pampeana","Noreste","Noroeste","Cuyo","Patagonia"];
function validRegionPrecios(v){
  return!!v&&typeof v==="object"&&!Array.isArray(v)&&Object.keys(v).length===1&&typeof v.region==="string"&&["GBA","Pampeana","Noreste","Noroeste","Cuyo","Patagonia"].includes(v.region)
}
// Precio finito y positivo de un objeto {región: precio}, o null.
function valorRegionPrecio(o,r){
  return!!o&&typeof o==="object"&&Number.isFinite(o[r])&&o[r]>0&&o[r]<1e7?o[r]:null
}
function validPreciosData(d){
  return!!d&&typeof d==="object"&&d.version===1&&/^\d{4}-\d{2}$/.test(d.mes||"")&&!!d.fuente&&typeof d.fuente==="object"&&Array.isArray(d.items)&&d.items.length>0&&d.items.length<=500&&d.items.every(i=>!!i&&typeof i.n==="string"&&["kg","l","unidad"].includes(i.b)&&(valorRegionPrecio(i.p,"GBA")!==null||valorRegionPrecio(i.s,"GBA")!==null))
}
function preciosDataset(){
  let sig="";
  try{
    sig=localStorage.getItem("miPlatoFacil_ingredientAliases_v1")||""
  }catch(e){
  }
  const src=preciosDataset.data||PRECIOS_SNAPSHOT,c=preciosDataset.cache;
  if(!validPreciosData(src))return null;
  if(c&&c.sig===sig&&c.meta===src)return c;
  const byKey=new Map();
  for(const it of src.items){
    const k=ingredientKey(it.n);
    if(k&&!byKey.has(k))byKey.set(k,it)
  }
  preciosDataset.cache={
    sig,meta:src,byKey
  };
  return preciosDataset.cache
}
function regionPrecios(){
  try{
    const v=JSON.parse(localStorage.getItem(REGION_PRECIOS_KEY)||"null");
    return validRegionPrecios(v)?v.region:"GBA"
  }catch(e){
    return "GBA"
  }
}
function guardarRegionPrecios(r){
  const o={
    region:r
  };
  if(!validRegionPrecios(o))throw new Error("Región inválida.");
  localStorage.setItem(REGION_PRECIOS_KEY,JSON.stringify(o))
}
// Etapa 30: dónde se compran las frutas y verduras (verdulería o supermercado) y qué precios propios se revisaron.
var DONDE_COMPRO_KEY="miPlatoFacil_dondeCompro_v1",PRECIOS_REVISADOS_KEY="miPlatoFacil_preciosRevisados_v1";
function validDondeCompro(v){
  return!!v&&typeof v==="object"&&!Array.isArray(v)&&Object.keys(v).length===2&&v.version===1&&(v.verduras==="verduleria"||v.verduras==="super")
}
// "verduleria" (por defecto) o "super".
function dondeCompro(){
  try{
    const v=JSON.parse(localStorage.getItem(DONDE_COMPRO_KEY)||"null");
    return validDondeCompro(v)?v.verduras:"verduleria"
  }catch(e){
    return "verduleria"
  }
}
function guardarDondeCompro(valor){
  const o={
    version:1,verduras:valor
  };
  if(!validDondeCompro(o))throw new Error("Elegí verdulería o supermercado.");
  localStorage.setItem(DONDE_COMPRO_KEY,JSON.stringify(o))
}
function validPreciosRevisados(v){
  return!!v&&typeof v==="object"&&!Array.isArray(v)&&Object.keys(v).length===2&&v.version===1&&!!v.revisados&&typeof v.revisados==="object"&&!Array.isArray(v.revisados)&&Object.keys(v.revisados).length<=500&&Object.entries(v.revisados).every(([k,d])=>typeof k==="string"&&k.length>0&&k.length<=120&&typeof d==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(d))
}
function preciosRevisados(){
  try{
    const v=JSON.parse(localStorage.getItem(PRECIOS_REVISADOS_KEY)||"null");
    return validPreciosRevisados(v)?v.revisados:{}
  }catch(e){
    return {}
  }
}
var MOSTRAR_PRECIOS_KEY="miPlatoFacil_mostrarPrecios_v1";
function validMostrarPrecios(v){
  return!!v&&typeof v==="object"&&!Array.isArray(v)&&Object.keys(v).length===1&&typeof v.mostrar==="boolean"
}
// true, false o null (sin valor guardado o inválido).
function mostrarPreciosGuardado(){
  try{
    const v=JSON.parse(localStorage.getItem(MOSTRAR_PRECIOS_KEY)||"null");
    return validMostrarPrecios(v)?v.mostrar:null
  }catch(e){
    return null
  }
}
// Desde la v16 vienen encendidos. Quien ya había elegido un modo (uiMode_v1) conserva lo que tenía: simple apagado, completo encendido.
function preciosActivos(){
  const g=mostrarPreciosGuardado();
  if(g!==null)return g;
  let elegido=null;
  try{
    elegido=localStorage.getItem(UI_MODE_KEY)
  }catch(e){
  }
  return elegido===null?true:!Interfaz.isSimpleMode()
}
function guardarMostrarPrecios(valor){
  const o={
    mostrar:!!valor
  };
  localStorage.setItem(MOSTRAR_PRECIOS_KEY,JSON.stringify(o))
}
// Antes de cambiar el modo simple/completo se fija el valor que tenían los precios: activar las herramientas avanzadas
// no los enciende (ni apagarlas los apaga). Si ya hay un valor guardado no escribe nada.
function fijarPreciosAntesDelModo(){
  if(mostrarPreciosGuardado()!==null)return;
  try{
    guardarMostrarPrecios(preciosActivos())
  }catch(e){
  }
}
// Barra de presupuesto, fila de Preferencias y tarjeta del interruptor: según los precios.
function aplicarPrecios(){
  const on=preciosActivos();
  for(const id of ["comprasPresupuesto","prefPresupuesto"]){
    const e=document.getElementById(id);
    if(e)e.hidden=!on
  }
  // La región solo sirve con los precios prendidos.
  const reg=document.getElementById("preferenciasRegion");
  if(reg)reg.hidden=!on;
  const t=document.getElementById("preciosToggle");
  if(t){
    t.querySelector(".tool-button__label").textContent="Mostrar precios y presupuesto: "+(on?"activado":"desactivado");
    t.querySelector(".tool-button__desc").textContent=on?"Se ven los ≈ $ y el presupuesto":"Activalo para ver los ≈ $ y el presupuesto";
    t.setAttribute("aria-label","Mostrar precios y presupuesto: "+(on?"activado":"desactivado")+". Tocar para cambiar")
  }
}
function mesCortoPrecios(mes){
  const m=/^(\d{4})-(\d{2})$/.exec(mes||"");
  return m?["ene.","feb.","mar.","abr.","may.","jun.","jul.","ago.","sept.","oct.","nov.","dic."][Number(m[2])-1]+" "+m[1]:""
}
function fechaCortaPrecios(f){
  const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(f||"");
  return m?Number(m[3])+" "+["ene.","feb.","mar.","abr.","may.","jun.","jul.","ago.","sept.","oct.","nov.","dic."][Number(m[2])-1]+" "+m[1]:""
}
function datosSepaPrecios(d){
  const s=d&&d.meta.sepa;
  return s&&typeof s==="object"&&/^\d{4}-\d{2}-\d{2}$/.test(s.fecha||"")?s:null
}
// Fuente escrita. Sin datos de SEPA es la de siempre; con ellos, la línea general dice las dos.
function fuentePrecios(region,cual){
  const d=preciosDataset();
  if(!d)return "";
  const reg=region||regionPrecios(),sepa=datosSepaPrecios(d),indec="Promedio INDEC · "+reg+" · "+mesCortoPrecios(d.meta.mes);
  if(cual==="indec"||!sepa)return indec;
  const s="SEPA · mediana · "+reg+" · "+fechaCortaPrecios(sepa.fecha);
  return cual==="sepa"?s:s+" (INDEC si falta)"
}
var PRECIOS_CAZUELA=null;
// Cantidad en la unidad base del precio (kg, l o unidad), o null si no se puede pasar.
function cantidadBasePrecio(it,nombre,q,unit){
  if(typeof q!=="number"||!(q>0))return null;
  const nut=nutritionFor(nombre),dens=it.d||1,pu=pesoUnidadCurado(nombre);
  // Las unidades se pasan a kilos con el peso curado de una unidad común (data/envases.json), no con uno raro de la nutrición.
  if(pu&&it.b==="kg"&&unit==="unidad")return q*pu/1000;
  if(it.b==="l"){
    const ml={ml:q,l:q*1000,taza:q*236.588,cucharada:q*14.787,cucharadita:q*4.929}[unit];
    if(ml!==undefined)return ml/1000;
    const g=unit==="g"?q:unit==="kg"?q*1000:null;
    return g===null?null:g/dens/1000
  }
  if(it.b==="unidad"){
    if(unit==="unidad")return q;
    const g=unit==="g"?q:unit==="kg"?q*1000:null,u=pu?[pu]:nut&&nut.u&&nut.u.unidad;
    return g!==null&&u&&u[0]>0?g/u[0]:null
  }
  const g=nutritionGrams(nut,q,unit);
  return g===null?null:g/1000
}
// Percentiles 25 y 75 de SEPA en una región: el par suelto (formato de la Etapa 8) o un objeto por región.
function rangoSepaPrecios(it,reg){
  const r=Array.isArray(it.r)?it.r:it.r&&typeof it.r==="object"?it.r[reg]:null;
  return Array.isArray(r)&&r.length===2&&r.every(x=>Number.isFinite(x)&&x>0)&&r[0]<=r[1]?r:null
}
// Precio automático de un ingrediente: SEPA de la región, INDEC de la región, SEPA de GBA, INDEC de GBA.
// Devuelve {it, precio por unidad base, region usada, fuente: "sepa"|"indec", rango: [p25, p75]|null, aprox} o null.
function precioAuto(nombre){
  const d=preciosDataset();
  if(!d)return null;
  const it=Precios.itemDe(nombre,d);
  if(!it)return null;
  const r=regionPrecios();
  // Etapa 30: con "Verdulería" (por defecto), las frutas y verduras con precio de INDEC usan INDEC antes que SEPA (el supermercado es más caro).
  const verduleria=(it.k==="frutas"||it.k==="verduras")&&dondeCompro()==="verduleria";
  for(const [f,reg] of (verduleria?[["indec",r],["sepa",r],["indec","GBA"],["sepa","GBA"]]:[["sepa",r],["indec",r],["sepa","GBA"],["indec","GBA"]])){
    const v=valorRegionPrecio(f==="sepa"?it.s:it.p,reg);
    if(v!==null)return {
      it,precio:v,region:reg,fuente:f,rango:f==="sepa"?rangoSepaPrecios(it,reg):null,aprox:f==="sepa"?!!it.sa:!!it.a
    }
  }
  return null
}
// Etapa 30: los dos precios de una fruta o verdura que tiene INDEC y SEPA: [{donde:"verdulería"|"súper", precio, texto}] o null.
function preciosDeVerdura(nombre){
  const d=preciosDataset();
  if(!d)return null;
  const it=Precios.itemDe(nombre,d);
  if(!it||!(it.k==="frutas"||it.k==="verduras")||!it.p||!it.s)return null;
  const r=regionPrecios(),ub=it.b==="l"?"l":it.b==="unidad"?"unidad":"kg",sepa=datosSepaPrecios(d);
  const indec=[r,"GBA"].map(g=>[g,valorRegionPrecio(it.p,g)]).find(x=>x[1]!==null),ss=[r,"GBA"].map(g=>[g,valorRegionPrecio(it.s,g)]).find(x=>x[1]!==null);
  if(!indec||!ss)return null;
  return [
    {donde:"verdulería",precio:indec[1],texto:"En verdulería ≈ "+pesosCortos(indec[1])+"/"+ub+" · INDEC "+indec[0]+" · "+mesCortoPrecios(d.meta.mes)},
    {donde:"súper",precio:ss[1],texto:"En súper ≈ "+pesosCortos(ss[1])+"/"+ub+" · SEPA "+ss[0]+(sepa?" · "+fechaCortaPrecios(sepa.fecha):"")}
  ]
}
// Precio de INDEC solo (se conserva para quien lo use): {precio por unidad base, región usada} o null.
// ---- Etapa 21: Mi precio ----
// Gramos de una cantidad de un ingrediente (null si no se puede pasar a peso).
function gramosDe(nombre,q,unit){
  if(unit==="g")return q;
  if(unit==="kg")return q*1000;
  const pu=pesoUnidadCurado(nombre);
  if(pu&&unit==="unidad")return q*pu;
  return nutritionGrams(nutritionFor(nombre),q,unit)
}
// Nombres con que se busca Mi precio de un ingrediente: el que se ve y el del ítem de precios o de nutrición.
function nombresDePrecio(nombre){
  const out=[String(nombre||"")],it=Precios.itemDe(nombre),nut=nutritionFor(nombre);
  for(const x of [it&&it.n,nut&&nut.n])if(x&&!out.includes(x))out.push(x);
  return out
}
function misPreciosDe(nombre){
  const todos=Object.values(loadReferencePrices()).filter(p=>p.currency==="ARS"&&Number.isFinite(p.price)&&p.price>0&&Number.isFinite(p.amount)&&p.amount>0);
  const nombres=nombresDePrecio(nombre);
  return todos.filter(p=>nombres.some(n=>Ingredientes.sameIngredient(p.name,n))).sort((a,b)=>String(b.date).localeCompare(String(a.date))||(String(b.id).startsWith("ficha_")?1:0)-(String(a.id).startsWith("ficha_")?1:0))
}
// Costo con Mi precio (el más nuevo): en la misma unidad o, si no, pasando las dos cantidades a gramos.
function miPrecioDe(nombre,q,unit){
  const lista=misPreciosDe(nombre);
  if(!lista.length)return null;
  const mismo=lista.filter(p=>Ingredientes.sameDimension(p.unit,unit));
  if(mismo.length){
    const p=mismo[0],amount=p.unit===unit?p.amount:convertQuantity(p.amount,p.unit,unit);
    return {costo:q*p.price/amount,propio:true,fuente:"Mi precio",aprox:false}
  }
  const gq=gramosDe(nombre,q,unit);
  for(const p of lista){
    const gp=gramosDe(nombre,p.amount,p.unit);
    if(gq!==null&&gp)return {costo:gq*p.price/gp,propio:true,fuente:"Mi precio",aprox:false}
  }
  return null
}
// Cuánto cuesta una cantidad: Mi precio (referencePrices_v1, en pesos) y si no el promedio de INDEC.
function precioDe(nombre,q,unit){
  if(typeof q!=="number"||!(q>0)||!nombre)return null;
  try{
    const mio=miPrecioDe(nombre,q,unit);
    if(mio)return mio
  }catch(e){
  }
  // Solo lee: no guarda nada (C9-2).
  const p=precioAuto(nombre);
  if(!p)return null;
  const base=cantidadBasePrecio({
    b:p.it.b,d:p.it.d
  },nombre,q,unit);
  if(base===null)return null;
  return {
    costo:base*p.precio,propio:false,fuente:fuentePrecios(p.region,p.fuente),origen:p.fuente,aprox:p.aprox,region:p.region,rangoCosto:p.rango?[base*p.rango[0],base*p.rango[1]]:null
  }
}
// Rango de precios de un ingrediente por unidad (para Comparar alternativas): lo más barato y lo típico (mediana) de Mi
// precio, el promedio automático de la región y cuánto se aparta Mi precio (el más nuevo) del automático.
// Si el dato automático trae percentiles (r:[p25,p75], Etapa 9) se usan como rango del automático.
function rangoDePrecios(nombre,unidad){
  const out={
    n:0,masBarato:null,tipico:null,mio:null,auto:null,autoBajo:null,autoAlto:null,difPct:null
  };
  try{
    const propios=Ingredientes.pricesFor(Object.values(loadReferencePrices()),nombre,unidad).filter(p=>p.currency==="ARS"&&Number.isFinite(p.price)&&p.price>=0&&Number.isFinite(p.amount)&&p.amount>0);
    const vals=propios.map(p=>p.price/p.amount).sort((a,b)=>a-b);
    out.n=vals.length;
    if(vals.length){
      out.masBarato=vals[0];
      const m=vals.length>>1;
      out.tipico=vals.length%2?vals[m]:(vals[m-1]+vals[m])/2;
      const nuevo=[...propios].sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0];
      out.mio=nuevo.price/nuevo.amount
    }
  }catch(e){
  }
  if(preciosActivos()){
    const p=precioAuto(nombre),base=p&&cantidadBasePrecio({
      b:p.it.b,d:p.it.d
    },nombre,1,unidad);
    if(p&&base){
      out.auto=base*p.precio;
      if(p.rango){
        out.autoBajo=base*p.rango[0];
        out.autoAlto=base*p.rango[1]
      }
      if(out.mio!==null&&out.auto>0)out.difPct=Math.round((out.mio/out.auto-1)*100)
    }
  }
  return out
}
// Una línea corta con el rango (o "" si no hay nada que mostrar).
function textoRangoPrecios(nombre,unidad){
  // Los precios por gramo o mililitro se muestran por kilo o litro.
  const r=rangoDePrecios(nombre,unidad),k=unidad==="g"||unidad==="ml"?1000:1,u=unidad==="g"?"kg":unidad==="ml"?"l":unidad,$=n=>"$"+Math.round(n*k).toLocaleString("es-AR"),partes=[];
  if(r.n>1)partes.push("más barato "+$(r.masBarato),"típico "+$(r.tipico));
  else if(r.mio!==null)partes.push("Mi precio "+$(r.mio));
  if(r.autoBajo!==null)partes.push("promedio "+$(r.autoBajo)+" a "+$(r.autoAlto));
  else if(r.auto!==null)partes.push("promedio ≈ "+$(r.auto));
  if(r.difPct!==null)partes.push("Mi precio "+(r.difPct>0?"+":r.difPct<0?"−":"")+Math.abs(r.difPct)+" %");
  return partes.length?"Por "+u+": "+partes.join(" · "):""
}
function formatoPesos(n){
  return "≈ $"+Math.round(n).toLocaleString("es-AR")
}
function faltanTexto(n){
  return "faltan "+n+" precio"+(n===1?"":"s")
}
// ---- Etapa 20: un solo cálculo de costos ----
// Todo costo (ingrediente, comida, día, semana, lista) sale de costoDeIngrediente(): precio real (Mi precio, SEPA o INDEC) y, si
// no hay, un estimado con la mediana por kg o litro de la categoría del ingrediente. Un faltante nunca cuenta $0 en silencio.
// Categoría y unidad base de un ingrediente con o sin precio ({k, b}) o null.
function categoriaDePrecio(nombre){
  const d=preciosDataset();
  if(!d)return null;
  if(!d.catByKey){
    d.catByKey=new Map();
    for(const it of d.meta.items){
      const k=ingredientKey(it.n);
      if(k&&it.k&&!d.catByKey.has(k))d.catByKey.set(k,{k:it.k,b:it.b})
    }
    for(const [n,v] of Object.entries(d.meta.categorias||{})){
      const k=ingredientKey(n);
      if(k&&!d.catByKey.has(k)&&Array.isArray(v))d.catByKey.set(k,{k:v[0],b:v[1]})
    }
  }
  const nut=nutritionDataset().byKey,clave=String(nombre||"");
  for(const n of [clave].concat(Ingredientes.variantesNombre(clave))){
    let c=d.catByKey.get(ingredientKey(n));
    if(c)return c;
    const x=nut.get(ingredientKey(n));
    if(x)for(const nm of [x.n].concat(x.s||[])){
      c=d.catByKey.get(ingredientKey(nm));
      if(c)return c
    }
  }
  return null
}
// Mediana del precio por kg o litro de una categoría en la región (con la misma prioridad de fuentes que precioAuto).
function medianaDeCategoria(k,b){
  const d=preciosDataset();
  if(!d)return null;
  if(!d.medianas)d.medianas=new Map();
  const r=regionPrecios(),id=k+"/"+b+"/"+r;
  if(d.medianas.has(id))return d.medianas.get(id);
  const vals=[];
  for(const it of d.meta.items){
    if(it.k!==k||it.b!==b)continue;
    for(const [f,reg] of [["sepa",r],["indec",r],["sepa","GBA"],["indec","GBA"]]){
      const v=valorRegionPrecio(f==="sepa"?it.s:it.p,reg);
      if(v!==null){
        vals.push(v);
        break
      }
    }
  }
  vals.sort((x,y)=>x-y);
  const m=vals.length?(vals.length%2?vals[vals.length>>1]:(vals[vals.length/2-1]+vals[vals.length/2])/2):null;
  d.medianas.set(id,m);
  return m
}
// Ingredientes genéricos de la lista que no son un producto del mapa: se estiman con la categoría y un peso por unidad.
var ESTIMADO_GENERICO={"fruta de estacion":{k:"frutas",b:"kg",unidadKg:0.15}};
function estimadoDePrecio(nombre,q,unit){
  if(typeof q!=="number"||!(q>0)||!nombre||!preciosDataset())return null;
  let cat=categoriaDePrecio(nombre);
  const g=ESTIMADO_GENERICO[normalizeSearchText(String(nombre)).trim()];
  if(!cat&&g)cat={k:g.k,b:g.b};
  if(!cat)return null;
  const med=medianaDeCategoria(cat.k,cat.b);
  if(med===null)return null;
  let base=cantidadBasePrecio({b:cat.b,d:1},nombre,q,unit);
  if(base===null&&g&&unit==="unidad")base=q*g.unidadKg;
  return base===null?null:{costo:base*med,categoria:cat.k}
}
// Costo de una cantidad de un ingrediente: {costo, estimado, ...} o null si ni siquiera se puede estimar.
function costoDeIngrediente(nombre,q,unit){
  const r=precioDe(nombre,q,unit);
  if(r)return {costo:r.costo,estimado:false,propio:r.propio,fuente:r.fuente,aprox:r.aprox,rangoCosto:r.rangoCosto};
  const e=estimadoDePrecio(nombre,q,unit);
  return e?{costo:e.costo,estimado:true,categoria:e.categoria}:null
}
// Costo de las filas de una receta (rows: {name, quantity, unit}) multiplicado por factor.
// faltan: productos distintos sin precio real (estimados + sin estimar); sinPrecio: los que ni se pudieron estimar (no suman).
function costoDeFilas(rows,factor){
  let costo=0;
  const estimados=new Set(),sin=new Set();
  for(const row of rows||[]){
    if(!row.name||!String(row.name).trim()||fueraDeLaLista(row.name))continue;
    const nombre=String(row.name).trim(),key=ingredientKey(nombre);
    const r=row.quantity===null||row.quantity===undefined?null:costoDeIngrediente(nombre,row.quantity*factor,row.unit);
    if(r){
      costo+=r.costo;
      if(r.estimado)estimados.add(key)
    }else sin.add(key)
  }
  return {
    costo,faltan:estimados.size+sin.size,estimados:estimados.size,sinPrecio:sin.size
  }
}
// Lo que se guarda de la sesión se lee una sola vez por turno: pintar 300 tarjetas no vuelve a leer el almacenamiento.
function contextoCostos(){
  if(!PRECIOS_CAZUELA){
    PRECIOS_CAZUELA={
      details:loadRecipeDetails(),amounts:loadRecipeAmounts(),saved:MisPlatos.loadSaved()
    };
    setTimeout(()=>{
      PRECIOS_CAZUELA=null
    },0)
  }
  return PRECIOS_CAZUELA
}
function cantidadesDeComida(origen,id){
  const c=contextoCostos();
  let recetaId=id;
  if(origen!=="receta"){
    const it=c.saved.find(x=>x.id===id);
    recetaId=it&&it.recipeSourceId
  }
  const det=recetaId&&c.details[recetaId],a=det&&det.amountsTitle&&c.amounts[det.amountsTitle];
  if(a&&Array.isArray(a.rows)&&a.rows.length)return a;
  // Plato armado: las cantidades salen de sus porciones, por persona (cantidadesDePlatoArmado, 44-cantidades-de-platos.js).
  if(origen!=="receta"){
    const it=c.saved.find(x=>x.id===id),cant=it&&!it.recipeSourceId?cantidadesDePlatoArmado(it):[];
    if(cant.length)return {yield:1,rows:cant.map(x=>({name:x.name,quantity:x.q,unit:x.unit}))}
  }
  return null
}
// ≈ costo por porción de una comida: {porPorcion, faltan} o null (sin cantidades o sin ningún precio).
function costoPorPorcion(origen,id){
  if(!preciosActivos()||!preciosDataset())return null;
  try{
    const a=cantidadesDeComida(origen,id);
    if(!a)return null;
    const {
      costo,faltan,estimados,sinPrecio
    }=costoDeFilas(a.rows,1);
    return costo>0?{
      porPorcion:costo/(a.yield>0?a.yield:1),faltan,estimados,sinPrecio
    }:null
  }catch(e){
    return null
  }
}
function textoCostoComida(c){
  return c?formatoPesos(c.porPorcion)+" por porción"+(c.sinPrecio?" ("+faltanTexto(c.sinPrecio)+")":"")+(c.estimados?" · incluye estimados":""):""
}
function etiquetaCostoComida(c){
  return textoCostoComida(costoPorPorcion(c.origen,c.id))
}
// Línea del detalle de la comida (pantalla comida).
function pintarCostoComida(){
  const p=document.getElementById("comidaCosto");
  if(!p)return;
  const t=comidaActual?textoCostoComida(costoPorPorcion(comidaActual.origen,comidaActual.id)):"";
  p.textContent=t?t+" · "+fuentePrecios():"";
  p.hidden=!t
}
// Costos de la semana y del día elegido (los dos juntos, para la línea de Semana).
function costosDelPlan(){
  const c=costoSemanaPlan();
  return c?{semana:c.total,dia:costoDelDiaPlan(),faltan:c.faltan,pendientes:c.pendientes,conPrecio:c.conPrecio,sinEstimar:c.sinEstimar,productos:c.productos}:null
}
// Costo de lo que cuesta hoy (el día elegido en Semana): suma de sus comidas, por lo que se usa (sin redondear a envases).
function costoDelDiaPlan(){
  const dia=Semana.diaPlanElegido();
  let costo=0;
  for(const e of Semana.planEntriesFlat()){
    if(e.day!==dia)continue;
    const a=cantidadesDeComida("plato",e.item.id);
    if(a)costo+=costoDeFilas(a.rows,Semana.portionFactor(e.portions,a)*personasHogar()).costo
  }
  return costo
}
// ≈ costo de una comida del plan para todo el hogar, o "" si no hay precios o cantidades. Con estimados lo dice.
function costoDeLaComida(item,porciones){
  if(!preciosActivos()||!preciosDataset()||!item)return "";
  const a=cantidadesDeComida("plato",item.id);
  if(!a)return "";
  const c=costoDeFilas(a.rows,Semana.portionFactor(porciones===undefined?null:porciones,a)*personasHogar());
  return c.costo>0?formatoPesos(c.costo)+(c.estimados?" · estimado":""):""
}
// Semana: "Semana ≈ $34.100 · hoy ≈ $4.600" y, debajo, "Con precio: 27 de 29 productos · Completar 2 precios".
function pintarCostoDia(){
  const p=document.getElementById("planDiaCosto"),q=document.getElementById("planPreciosEstado");
  if(!p)return;
  let t="",u=null;
  try{
    if(preciosActivos()&&preciosDataset()){
      const c=costosDelPlan();
      if(c&&c.pendientes>0){
        const hoy=c.dia;
        t=(c.sinEstimar?"Semana al menos ":"Semana ")+formatoPesos(c.semana)+(hoy>0?" · hoy "+formatoPesos(hoy):"");
        u=c
      }
    }
  }catch(e){
    t="";
    u=null
  }
  p.textContent=t;
  p.hidden=!t;
  if(q){
    q.replaceChildren();
    if(u){
      q.append(document.createTextNode("Con precio: "+u.conPrecio+" de "+u.pendientes+" productos"));
      if(u.faltan){
        // El punto separa el texto del botón; en pantallas angostas el botón baja de línea y el punto se oculta.
        const sep=ce("span","precios-sep"," · ");
        q.append(sep)
      }
      if(u.faltan){
        const b=ce("button","button button--soft precios-aviso--inline","Completar "+u.faltan+" precio"+(u.faltan===1?"":"s"));
        b.type="button";
        b.dataset.completarPrecios="";
        q.append(b)
      }
      // Etapa 30: tus precios viejos o por debajo de lo que se ve en la zona.
      let rev=[];
      try{rev=preciosParaRevisar()}catch(e){}
      if(rev.length){
        q.append(ce("span","precios-sep"," · "));
        const r=ce("button","button button--soft precios-aviso--inline","Revisar "+rev.length+" precio"+(rev.length===1?"":"s")+" tuyo"+(rev.length===1?"":"s"));
        r.type="button";
        r.dataset.revisarPrecios="";
        q.append(r)
      }
    }
    q.hidden=!u
  }
}
// ---- Etapa 21: ficha de ingrediente con precio ----
var FICHA_UNIDADES=[["kg","kg"],["g","g"],["unidad","unidad"],["paquete","paquete"]];
function pesosCortos(n){
  return "$"+Math.round(n).toLocaleString("es-AR")
}
// Línea de precio de la ficha: "≈ $2.200/kg · SEPA GBA · nov. 2026 · entre $1.980 y $2.900".
function textoPrecioFicha(nombre){
  const mio=misPreciosDe(nombre)[0];
  if(mio)return "Mi precio: "+pesosCortos(mio.price)+" por "+(mio.pack==="paquete"?"paquete de "+cantidadLegible(mio.amount,mio.unit):cantidadLegible(mio.amount,mio.unit));
  const p=precioAuto(nombre),d=preciosDataset();
  if(p&&d){
    const ub=p.it.b==="l"?"l":p.it.b==="unidad"?"unidad":"kg",sepa=datosSepaPrecios(d);
    const fuente=p.fuente==="sepa"?"SEPA "+p.region+(sepa?" · "+mesCortoPrecios(sepa.fecha.slice(0,7)):""):"INDEC "+p.region+" · "+mesCortoPrecios(d.meta.mes);
    return "≈ "+pesosCortos(p.precio)+"/"+ub+" · "+fuente+(p.rango&&Math.round(p.rango[0])!==Math.round(p.rango[1])?" · entre "+pesosCortos(p.rango[0])+" y "+pesosCortos(p.rango[1]):"")+(p.aprox?" · aproximado":"")
  }
  const cat=categoriaDePrecio(nombre),med=cat&&medianaDeCategoria(cat.k,cat.b);
  return med?"Sin precio publicado · estimado ≈ "+pesosCortos(med)+"/"+(cat.b==="l"?"l":cat.b==="unidad"?"unidad":"kg")+" (precio típico de "+cat.k+")":"Sin precio publicado."
}
// Cuánto se aparta Mi precio del precio típico de su categoría: razón (1 = igual) o null si no se puede comparar.
function razonContraCategoria(nombre,price,amount,unit){
  const cat=categoriaDePrecio(nombre);
  if(!cat||cat.b==="unidad")return null;
  const med=medianaDeCategoria(cat.k,cat.b),base=cantidadBasePrecio({b:cat.b,d:1},nombre,amount,unit);
  return med&&base?{razon:(price/base)/med,categoria:cat.k}:null
}
// Guarda (o borra, con precio null) Mi precio de un ingrediente en referencePrices_v1 y devuelve el texto anterior para Deshacer.
function guardarMiPrecio(nombre,precio,cantidad,unidad){
  const antes=localStorage.getItem(REFERENCE_PRICES_KEY);
  // Si lo guardado no se entiende (JSON roto o alguna entrada inválida) no se escribe nada: se perderían los precios que ya había.
  let todos={};
  if(antes!==null){
    try{
      todos=JSON.parse(antes)
    }catch(e){
      todos=null
    }
    if(!validReferencePrices(todos))throw new Error("No pude guardar sin tocar tus precios anteriores: alguno no es válido. Revisalos en Precios de referencia.")
  }
  const canon=nombresDePrecio(nombre).at(-1),id="ficha_"+ingredientKey(canon).replace(/[^a-z0-9]+/g,"_");
  if(precio===null)delete todos[id];
  else{
    const esPaquete=unidad==="paquete",item={
      id,name:canon,pack:esPaquete?"paquete":"",amount:cantidad,unit:esPaquete?"g":unidad,price:precio,currency:"ARS",date:Rutina.localTrainingDate(new Date())
    };
    if(!validReferencePrices({[id]:item}))throw new Error("Revisá el monto y la cantidad.");
    todos[id]=item
  }
  localStorage.setItem(REFERENCE_PRICES_KEY,JSON.stringify(todos));
  return antes
}
// Unidad con la que se suele comprar: por unidad lo que se vende así o pesa más de 300 g (ananá, melón, pomelo), si no por kg.
function unidadSugeridaFicha(nombre){
  try{
    const p=precioAuto(nombre);
    if(p&&p.it&&p.it.b==="unidad")return "unidad";
    if(p&&p.it&&p.it.b==="l")return "kg";
    const pu=typeof pesoUnidadCurado==="function"?pesoUnidadCurado(nombre):null;
    if(pu&&pu>=300)return "unidad"
  }catch(e){
  }
  return "kg"
}
// ---- Etapa 30: tu precio al día ----
function fechaHoyPrecios(){
  return Rutina.localTrainingDate(new Date())
}
function diasDesdePrecios(fecha){
  const a=Date.parse(fecha+"T12:00:00"),b=Date.parse(fechaHoyPrecios()+"T12:00:00");
  return Number.isFinite(a)&&Number.isFinite(b)?Math.round((b-a)/864e5):null
}
// Un Mi precio está "para revisar" si pasaron más de 60 días, o 30 o más y el precio automático del mismo ingrediente es un 20 % o más alto.
// La fecha es la más nueva entre la de la entrada y la de "Sigue igual" (preciosRevisados_v1). Devuelve {id, nombre, entrada, dias, auto} o null.
function precioParaRevisar(entrada){
  if(!entrada||entrada.currency!=="ARS"||!(entrada.price>0)||!(entrada.amount>0))return null;
  const revisado=preciosRevisados()[entrada.id],fecha=revisado&&String(revisado)>String(entrada.date)?revisado:entrada.date,dias=diasDesdePrecios(fecha);
  if(dias===null)return null;
  let auto=null,suyo=null;
  try{
    const a=precioAuto(entrada.name);
    if(a){
      const base=cantidadBasePrecio(a.it,entrada.name,entrada.amount,entrada.unit);
      if(base)auto={precio:a.precio,unidad:a.it.b==="l"?"l":a.it.b==="unidad"?"unidad":"kg",suyo:entrada.price/base}
    }
  }catch(e){
    auto=null
  }
  const caro=!!auto&&auto.precio>=auto.suyo*1.2;
  return dias>60||(dias>=30&&caro)?{id:entrada.id,nombre:entrada.name,entrada,dias,auto}:null
}
function preciosParaRevisar(){
  if(!preciosActivos())return [];
  return Object.values(loadReferencePrices()).map(precioParaRevisar).filter(Boolean).sort((x,y)=>y.dias-x.dias)
}
// "Sigue igual": guarda la fecha de hoy para esa entrada en preciosRevisados_v1 (no toca referencePrices_v1).
function marcarPrecioRevisado(id){
  const actual=preciosRevisados(),o={
    version:1,revisados:{...actual,[id]:fechaHoyPrecios()}
  };
  if(!validPreciosRevisados(o))throw new Error("No se pudo guardar.");
  localStorage.setItem(PRECIOS_REVISADOS_KEY,JSON.stringify(o))
}
function fechaCortaEntrada(f){
  const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(f));
  return m?Number(m[3])+" "+["ene.","feb.","mar.","abr.","may.","jun.","jul.","ago.","sept.","oct.","nov.","dic."][Number(m[2])-1]:""
}
function abrirRevisarPrecios(){
  const lista=preciosParaRevisar(),caja=ce("div","completar-precios");
  caja.append(ce("p","screen__hint",lista.length?"Estos precios tuyos son viejos o quedaron por debajo de lo que se ve en la zona. ¿Siguen igual?":"Tus precios están al día."));
  for(const x of lista){
    const fila=ce("div","revisar-precio"),en=x.auto?" · en la zona ≈ "+pesosCortos(x.auto.precio)+"/"+x.auto.unidad:"";
    fila.append(ce("p","revisar-precio__texto",x.nombre+" · tu precio "+pesosCortos(x.entrada.price)+"/"+cantidadLegible(x.entrada.amount,x.entrada.unit)+" ("+fechaCortaEntrada(x.entrada.date)+")"+en));
    const acc=ce("div","revisar-precio__acciones"),igual=ce("button","button button--soft","Sigue igual"),act=ce("button","button button--primary","Actualizar");
    igual.type=act.type="button";
    igual.dataset.precioIgual=x.id;
    act.dataset.precioActualizar=x.nombre;
    acc.append(igual,act);
    fila.append(acc);
    caja.append(fila)
  }
  hoja.abrir({
    titulo:"Revisar tus precios",contenido:[caja],botones:[],foco:false
  })
}
document.addEventListener("click",e=>{
  const t=e.target.closest&&e.target.closest("[data-revisar-precios],[data-precio-igual],[data-precio-actualizar]");
  if(!t)return;
  if(t.dataset.revisarPrecios!==undefined)abrirRevisarPrecios();
  else if(t.dataset.precioIgual!==undefined){
    try{marcarPrecioRevisado(t.dataset.precioIgual)}catch(err){}
    if(hoja.abierta()&&document.querySelector(".completar-precios .revisar-precio"))abrirRevisarPrecios();
    else if(typeof renderRevisionFicha==="function")renderRevisionFicha();
    try{refrescarPrecios()}catch(err){}
  }else if(t.dataset.precioActualizar!==undefined){
    Comidas.abrirNutrientesDeIngrediente(t.dataset.precioActualizar,true)
  }
});
function fichaPrecio(nombre){
  const cont=ce("div","ficha-precio");
  let deshacer=null,aviso=null;
  const repintar=()=>{
    try{
      refrescarPrecios()
    }catch(e){
    }
    pintar()
  };
  function pintar(){
    cont.replaceChildren();
    const mio=misPreciosDe(nombre)[0];
    // Etapa 30: una fruta o verdura con INDEC y SEPA muestra los dos precios (verdulería y súper).
    const dual=mio?null:preciosDeVerdura(nombre);
    cont.append(ce("h3","ficha-precio__titulo","Precio"));
    if(dual)for(const x of dual)cont.append(ce("p","ficha-precio__linea",x.texto));
    else cont.append(ce("p","ficha-precio__linea",textoPrecioFicha(nombre)));
    if(mio){
      const auto=precioAuto(nombre);
      if(auto)cont.append(ce("p","screen__hint","Promedio de la zona: ≈ "+pesosCortos(auto.precio)+"/"+(auto.it.b==="l"?"l":auto.it.b==="unidad"?"unidad":"kg")));
      const rev=precioParaRevisar(mio);
      if(rev){
        const caja=ce("div","ficha-precio__revision"),igual=ce("button","button button--soft","Sigue igual"),act=ce("button","button button--primary","Actualizar");
        igual.type=act.type="button";
        caja.append(ce("p","screen__hint","Tu precio es de hace "+rev.dias+" días."),igual,act);
        igual.addEventListener("click",()=>{
          try{marcarPrecioRevisado(rev.id)}catch(err){}
          try{refrescarPrecios()}catch(err){}
          pintar()
        });
        act.addEventListener("click",()=>{
          const m=document.getElementById("fichaPrecioMonto");
          if(m){m.focus();m.select&&m.select()}
        });
        cont.append(caja)
      }
    }
    // v17.6: el formulario se ve siempre (antes había que tocar "Agregar mi precio" para abrirlo).
    const form=ce("div","ficha-precio__form"),monto=ce("input"),cant=ce("input"),uni=ce("select"),estado=ce("p","screen__hint");
    estado.setAttribute("aria-live","polite");
    monto.type="text";monto.inputMode="decimal";monto.id="fichaPrecioMonto";
    cant.type="text";cant.inputMode="decimal";cant.id="fichaPrecioCantidad";cant.value="1";
    uni.id="fichaPrecioUnidad";
    for(const [v,t] of FICHA_UNIDADES)uni.append(new Option(t,v));
    uni.value=unidadSugeridaFicha(nombre);
    const campo=(texto,el)=>{
      const f=ce("div","portion-field"),l=ce("label",null,texto);
      l.htmlFor=el.id;
      f.append(l,el);
      return f
    };
    const lCant=ce("label",null,"Cantidad");
    lCant.htmlFor=cant.id;
    const fCant=ce("div","portion-field");
    fCant.append(lCant,cant);
    uni.addEventListener("change",()=>{
      lCant.textContent=uni.value==="paquete"?"Gramos del paquete":"Cantidad";
      if(uni.value==="paquete"&&cant.value==="1")cant.value=""
    });
    const guardar=ce("button","button button--primary","Guardar mi precio");
    guardar.type="button";
    const numero=t=>{
      const n=Number(String(t).trim().replace(/\./g,"").replace(",","."));
      return Number.isFinite(n)&&n>0?n:null
    };
    const confirmar=(precio,cantidad,unidad)=>{
      try{
        deshacer=guardarMiPrecio(nombre,precio,cantidad,unidad)
      }catch(err){
        aviso=err.message;
        deshacer=undefined;
        pintar();
        return
      }
      aviso=precio===null?"Se borró tu precio.":"Guardado.";
      repintar()
    };
    guardar.addEventListener("click",()=>{
      const precio=numero(monto.value),cantidad=numero(cant.value);
      if(precio===null||cantidad===null||precio>1000000){
        estado.textContent="Escribí el monto y la cantidad con números mayores que cero.";
        return
      }
      const unidad=uni.value,uBase=unidad==="paquete"?"g":unidad,r=razonContraCategoria(nombre,precio,cantidad,uBase);
      if(r&&(r.razon>3||r.razon<1/3)){
        const veces=Math.round(r.razon>1?r.razon:1/r.razon);
        estado.replaceChildren(document.createTextNode("Con ese monto, "+nombre.toLowerCase()+" te queda "+veces+(veces===1?" vez":" veces")+(r.razon>1?" más caro":" más barato")+" que el precio típico de "+r.categoria+". ¿Está bien? "));
        const igual=ce("button","button button--primary","Guardar igual");
        igual.type="button";
        igual.dataset.fichaPrecioIgual="";
        igual.addEventListener("click",()=>confirmar(precio,cantidad,unidad));
        estado.append(igual);
        estado.scrollIntoView({block:"nearest"});
        return
      }
      confirmar(precio,cantidad,unidad)
    });
    form.append(ce("p","ficha-precio__subtitulo",mio?"Cambiar tu precio":"¿Lo pagaste distinto? Cargá tu precio"),campo("Monto ($)",monto),fCant,campo("Unidad",uni),estado,ce("div","hoja__acciones"));
    form.querySelector(".hoja__acciones").append(guardar);
    cont.append(form);
    if(mio){
      const borrar=ce("button","button button--danger","Borrar mi precio");
      borrar.type="button";
      borrar.dataset.fichaPrecioBorrar="";
      borrar.addEventListener("click",()=>confirmar(null));
      cont.append(borrar)
    }
    if(aviso){
      const p=ce("p","screen__hint",aviso+" ");
      p.setAttribute("role","status");
      if(deshacer!==undefined){
        const d=ce("button","button button--soft","Deshacer"),previo=deshacer;
        d.type="button";
        d.dataset.fichaPrecioDeshacer="";
        d.addEventListener("click",()=>{
          if(previo===null)localStorage.removeItem(REFERENCE_PRICES_KEY);
          else localStorage.setItem(REFERENCE_PRICES_KEY,previo);
          aviso="Listo, volvió lo anterior.";
          deshacer=undefined;
          repintar()
        });
        p.append(d)
      }
      cont.append(p)
    }
  }
  pintar();
  return cont
}
// Productos de la lista sin precio real (para "Completar precios"): [{key,name,estimado:número|null,costo}].
function productosSinPrecioReal(){
  const c=costoSemanaPlan();
  return c?c.productos.filter(x=>x.tipo!=="real"):[]
}
function abrirCompletarPrecios(){
  const lista=productosSinPrecioReal(),caja=ce("div","completar-precios");
  caja.append(ce("p","screen__hint",lista.length?"Tocá un producto para ver su ficha y poner tu precio.":"Todos los productos tienen precio."));
  for(const x of lista){
    const b=ce("button","tool-button completar-precios__fila");
    b.type="button";
    b.dataset.nutrienteIngrediente=x.name;
    b.dataset.completarPreciosFila=x.key;
    b.append(ce("span","tool-button__label",x.name),ce("span","tool-button__desc",x.tipo==="estimado"?"estimado ≈ $"+Math.round(x.costo).toLocaleString("es-AR"):"sin precio"));
    caja.append(b)
  }
  hoja.abrir({
    titulo:"Completar precios",contenido:[caja],botones:[],foco:false
  })
}
document.addEventListener("click",e=>{
  if(e.target.closest&&e.target.closest("[data-completar-precios]"))abrirCompletarPrecios()
});
// Lista de compras: precio por ítem (sobre lo que falta comprar) y total. Devuelve null si no hay precios que mostrar.
// Qué cantidades se costean de un producto de la lista: "lista" es lo que falta comprar (con envases y descontando la
// despensa); "semana" es todo lo que usa la semana, también con envases.
function unidadesACostear(x,modo){
  if(modo==="semana"){
    const e=x.units&&x.units.size?envasar(x.name,x.units):null;
    return e?e.units:x.units
  }
  return x.compraUnits||(x.suggestion&&x.suggestion.kind==="partial"&&x.suggestion.missing&&comprasDescontar()?x.suggestion.missing:x.units)
}
// Costo de un producto de la lista: {tipo:"real"|"estimado"|"sin", costo, aprox, bajo, alto, conRango, fuente}.
function costoDeProducto(x,modo){
  const unidades=unidadesACostear(x,modo);
  const r={tipo:"sin",costo:0,aprox:false,bajo:0,alto:0,conRango:true,fuente:""};
  if(!unidades||!unidades.size)return r;
  let estimado=false;
  for(const [u,q] of unidades){
    const c=costoDeIngrediente(x.name,q,u);
    if(!c)return {tipo:"sin",costo:0,aprox:false,bajo:0,alto:0,conRango:false,fuente:""};
    r.costo+=c.costo;
    if(c.estimado)estimado=true;
    else if(c.rangoCosto){r.bajo+=c.rangoCosto[0];r.alto+=c.rangoCosto[1]}
    else r.conRango=false;
    r.fuente=r.fuente||c.fuente||"";
    if(c.aprox)r.aprox=true
  }
  r.tipo=estimado?"estimado":"real";
  if(estimado)r.conRango=false;
  return r
}
// Costo de una lista de productos. modo "lista": solo los pendientes (lo que falta comprar); "semana": todos, con todo lo que usa la semana.
// total suma precios reales y estimados; faltan cuenta productos distintos sin precio real; sinEstimar, los que no suman nada.
function preciosDeLaLista(items,modo){
  if(!preciosActivos()||!preciosDataset())return null;
  modo=modo||"lista";
  const porClave=new Map(),porDetalle=new Map(),productos=[];
  let total=0,faltan=0,pendientes=0,aprox=0,estimados=0,sinEstimar=0;
  for(const x of items){
    if(modo==="lista"&&x.group!=="pendiente")continue;
    // Sin cantidad ("Romero", a gusto) no hay nada que costear: se ve en la lista pero no cuenta como faltante.
    const uds=unidadesACostear(x,modo);
    if(!uds||!uds.size)continue;
    pendientes++;
    const c=costoDeProducto(x,modo);
    productos.push({key:x.key,name:x.name,tipo:c.tipo,costo:c.costo});
    if(c.tipo==="real"){
      total+=c.costo;
      if(c.aprox)aprox++;
      porClave.set(x.key,formatoPesos(c.costo));
      porDetalle.set(x.key,detallePrecio(c.costo,c.conRango?[c.bajo,c.alto]:null,c.fuente))
    }else{
      faltan++;
      if(c.tipo==="estimado"){
        estimados++;
        total+=c.costo;
        porClave.set(x.key,"sin precio · estimado "+formatoPesos(c.costo));
        porDetalle.set(x.key,"Estimado con el precio típico de su categoría. Tocá el nombre para poner tu precio.")
      }else{
        sinEstimar++;
        porClave.set(x.key,"sin precio");
        porDetalle.set(x.key,"No hay un precio para estimar. Tocá el nombre para poner el tuyo.")
      }
    }
  }
  return {
    porClave,porDetalle,total,faltan,pendientes,aprox,estimados,sinEstimar,conPrecio:pendientes-faltan,productos
  }
}
// Lo mismo para comidas todavía sin guardar: grupos = [{rows, factor}] (Armame la semana).
function costoSemanaDeFilas(grupos){
  const mapa=new Map();
  for(const g of grupos)for(const row of g.rows||[]){
    if(!row.name||!String(row.name).trim()||fueraDeLaLista(row.name))continue;
    const key=ingredientKey(row.name);
    let e=mapa.get(key);
    if(!e)mapa.set(key,e={key,name:String(row.name).trim(),units:new Map(),group:"pendiente"});
    if(row.quantity!==null&&row.quantity!==undefined)e.units.set(row.unit,(e.units.get(row.unit)||0)+row.quantity*g.factor)
  }
  return preciosDeLaLista([...mapa.values()],"semana")
}
// Costo de toda la semana (todos los productos de la lista del plan, con envases): el mismo número en el aviso de "Armame la
// semana", en Semana, en Compras (sin nada comprado ni en la despensa) y en la barra de presupuesto.
function costoSemanaPlan(){
  return preciosDeLaLista(shoppingDisplayItems(),"semana")
}
// Lo que se ve al tocar un precio: "≈ $2.100 · entre $1.900 y $2.900 · SEPA · mediana · GBA · 3/11" (fuente, mes y rango).
function detallePrecio(costo,rango,fuente){
  const pesos=n=>"$"+Math.round(n).toLocaleString("es-AR");
  return formatoPesos(costo)+(rango?" · entre "+pesos(rango[0])+" y "+pesos(rango[1]):"")+(fuente?" · "+fuente:"")
}
function totalAutomaticoLista(){
  const p=preciosDeLaLista(shoppingDisplayItems());
  return p&&p.conPrecio+p.estimados>0?p:null
}
// Textos de la lista: resumen con el total, fuente y aviso para quien no activó los precios.
function pintarPreciosCompras(p){
  const f=document.getElementById("comprasPrecioFuente"),a=document.getElementById("comprasPreciosAviso");
  if(a)a.hidden=preciosActivos();
  aplicarPrecios();
  if(f){
    f.textContent=p&&p.conPrecio>0?fuentePrecios(undefined,"sepa").replace(" · mediana",""):"";
    f.hidden=!f.textContent
  }
}
function resumenPrecios(p){
  // Si faltan más de la mitad, el total es solo una parte de la compra.
  return p&&p.porClave.size?" · "+((p.sinEstimar!==undefined?p.sinEstimar>0:p.faltan*2>p.pendientes)?"al menos ":"")+formatoPesos(p.total)+(p.faltan?" ("+faltanTexto(p.faltan)+")":""):""
}
function refrescarPrecios(){
  for(const fn of [renderCompras,renderPlan,renderSaved,pintarCostoComida,renderRegionPrecios,renderPresupuestoCompras]){
    try{
      fn()
    }catch(e){
    }
  }
}
// Preferencias → región de los precios.
function renderRegionPrecios(){
  const s=document.getElementById("preciosRegion");
  if(s)s.value=regionPrecios();
  const dc=document.getElementById("dondeCompro");
  if(dc)dc.value=dondeCompro()
}
function atribucionPrecios(){
  const box=document.getElementById("preciosFuenteInfo"),d=preciosDataset();
  if(!box)return;
  box.replaceChildren();
  if(!d)return;
  const f=d.meta.fuente||{},enlace=(url,texto)=>{
    const a=ce("a",null,texto);
    if(/^https:\/\//.test(url||"")){
      a.href=url;
      a.target="_blank";
      a.rel="noopener noreferrer"
    }
    return a
  };
  box.append(ce("strong",null,"Precios: "+(f.nombre||"INDEC")),ce("br"),document.createTextNode((f.atribucion||"")+" Último mes: "+mesCortoPrecios(d.meta.mes)+". "),enlace(f.informe,"Informe"),document.createTextNode(" · "),enlace(f.url,"Archivo"),ce("br"),document.createTextNode(f.nota||""));
  const s=datosSepaPrecios(d);
  if(s){
    box.append(ce("br"),ce("br"),ce("strong",null,"Precios de supermercados: "+(s.nombre||"SEPA")),ce("br"),document.createTextNode((s.atribucion||"")+" Archivo del "+fechaCortaPrecios(s.fecha)+". "),enlace(s.dataset,"Datos"),document.createTextNode(" · "),enlace(s.licenciaUrl,"Licencia "+(s.licencia||"CC BY 4.0")),ce("br"),document.createTextNode(s.nota||""))
  }
}
(()=>{
  const dc=document.getElementById("dondeCompro");
  if(dc){
    dc.value=dondeCompro();
    dc.addEventListener("change",()=>{
      try{
        guardarDondeCompro(dc.value)
      }catch(e){
        const st=document.getElementById("dondeComproEstado");
        if(st)st.textContent="No se pudo guardar."
      }
      refrescarPrecios()
    })
  }
  const sel=document.getElementById("preciosRegion");
  if(sel){
    sel.addEventListener("change",()=>{
      try{
        guardarRegionPrecios(sel.value)
      }catch(e){
        const st=document.getElementById("preciosRegionEstado");
        if(st)st.textContent="No se pudo guardar la región."
      }
      refrescarPrecios()
    })
  }
  const lista=document.getElementById("comprasHint");
  if(lista&&!document.getElementById("comprasPrecioFuente")){
    const f=ce("p","screen__hint");
    f.id="comprasPrecioFuente";
    f.hidden=true;
    const a=ce("button","precios-aviso","Precios estimados: activalos en Preferencias");
    a.type="button";
    a.id="comprasPreciosAviso";
    a.dataset.preciosAviso="";
    lista.after(f,a)
  }
  document.addEventListener("click",e=>{
    if(e.target.closest&&e.target.closest("[data-precios-aviso]"))go("preferencias")
  });
  atribucionPrecios();
  refrescarPrecios()
})();
