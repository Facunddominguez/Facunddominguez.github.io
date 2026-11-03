// Mi Plato Fácil · Precios automáticos (Etapa 7): promedio de INDEC por región, sin conexión.
// Parte 44: los archivos se unen en orden según su número, que define el orden de arranque.
// Los datos los baja una tarea de GitHub Actions y se incrustan al construir. init() corre durante la carga de 14, antes
// que este archivo: acá solo hay function, var y manejadores (nada de const/let que usen los archivos anteriores), y al
// final se repinta lo que ya se había dibujado sin precios.
// La región se guarda como {"region":"Pampeana"} (el respaldo pide un objeto por clave).
// Los precios se ven con el interruptor "Mostrar precios y presupuesto" (el mismo del modo simple, uiMode_v1): apagado
// no aparece ningún "≈ $". "Mi precio" (referencePrices_v1) gana sobre el promedio de INDEC.
var PRECIOS_SNAPSHOT=__DATOS_PRECIOS__;
var REGION_PRECIOS_KEY="miPlatoFacil_region_v1";
var REGIONES_PRECIOS=["GBA","Pampeana","Noreste","Noroeste","Cuyo","Patagonia"];
function validRegionPrecios(v){
  return!!v&&typeof v==="object"&&!Array.isArray(v)&&Object.keys(v).length===1&&typeof v.region==="string"&&["GBA","Pampeana","Noreste","Noroeste","Cuyo","Patagonia"].includes(v.region)
}
function validPreciosData(d){
  return!!d&&typeof d==="object"&&d.version===1&&/^\d{4}-\d{2}$/.test(d.mes||"")&&!!d.fuente&&typeof d.fuente==="object"&&Array.isArray(d.items)&&d.items.length>0&&d.items.length<=500&&d.items.every(i=>!!i&&typeof i.n==="string"&&["kg","l","unidad"].includes(i.b)&&!!i.p&&typeof i.p==="object"&&Number.isFinite(i.p.GBA)&&i.p.GBA>0)
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
function preciosActivos(){
  const g=mostrarPreciosGuardado();
  return g===null?!isSimpleMode():g
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
function fuentePrecios(region){
  const d=preciosDataset();
  return d?"Promedio INDEC · "+(region||regionPrecios())+" · "+mesCortoPrecios(d.meta.mes):""
}
var PRECIOS_CAZUELA=null;
// Cantidad en la unidad base del precio (kg, l o unidad), o null si no se puede pasar.
function cantidadBasePrecio(it,nombre,q,unit){
  if(typeof q!=="number"||!(q>0))return null;
  const nut=nutritionFor(nombre),dens=it.d||1;
  if(it.b==="l"){
    const ml={ml:q,l:q*1000,taza:q*236.588,cucharada:q*14.787,cucharadita:q*4.929}[unit];
    if(ml!==undefined)return ml/1000;
    const g=unit==="g"?q:unit==="kg"?q*1000:null;
    return g===null?null:g/dens/1000
  }
  if(it.b==="unidad"){
    if(unit==="unidad")return q;
    const g=unit==="g"?q:unit==="kg"?q*1000:null,u=nut&&nut.u&&nut.u.unidad;
    return g!==null&&u&&u[0]>0?g/u[0]:null
  }
  const g=nutritionGrams(nut,q,unit);
  return g===null?null:g/1000
}
// Precio de INDEC de un ingrediente en una región: {precio por unidad base, región usada} o null.
function precioIndec(nombre){
  const d=preciosDataset();
  if(!d)return null;
  const it=d.byKey.get(ingredientKey(String(nombre||"")));
  if(!it)return null;
  const r=regionPrecios(),usada=Number.isFinite(it.p[r])&&it.p[r]>0?r:"GBA";
  return {
    it,precio:it.p[usada],region:usada
  }
}
// Cuánto cuesta una cantidad: Mi precio (referencePrices_v1, en pesos) y si no el promedio de INDEC.
function precioDe(nombre,q,unit){
  if(typeof q!=="number"||!(q>0)||!nombre)return null;
  try{
    const propios=pricesFor(Object.values(loadReferencePrices()),nombre,unit).filter(p=>p.currency==="ARS"&&Number.isFinite(p.price)&&p.price>=0&&Number.isFinite(p.amount)&&p.amount>0).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
    if(propios.length)return {
      costo:q*propios[0].price/propios[0].amount,propio:true,fuente:"Mi precio",aprox:false
    }
  }catch(e){
  }
  const p=precioIndec(nombre);
  if(!p)return null;
  const base=cantidadBasePrecio({
    b:p.it.b,d:p.it.d
  },nombre,q,unit);
  if(base===null)return null;
  return {
    costo:base*p.precio,propio:false,fuente:fuentePrecios(p.region),aprox:!!p.it.a,region:p.region
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
    const propios=pricesFor(Object.values(loadReferencePrices()),nombre,unidad).filter(p=>p.currency==="ARS"&&Number.isFinite(p.price)&&p.price>=0&&Number.isFinite(p.amount)&&p.amount>0);
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
    const p=precioIndec(nombre),base=p&&cantidadBasePrecio({
      b:p.it.b,d:p.it.d
    },nombre,1,unidad);
    if(p&&base){
      out.auto=base*p.precio;
      if(Array.isArray(p.it.r)&&p.it.r.length===2&&p.it.r.every(x=>Number.isFinite(x)&&x>0)){
        out.autoBajo=base*p.it.r[0];
        out.autoAlto=base*p.it.r[1]
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
// Costo de las filas de una receta (rows: {name, quantity, unit}) multiplicado por factor.
function costoDeFilas(rows,factor){
  let costo=0,faltan=0;
  for(const row of rows||[]){
    if(!row.name||!String(row.name).trim())continue;
    const r=row.quantity===null||row.quantity===undefined?null:precioDe(String(row.name).trim(),row.quantity*factor,row.unit);
    if(r)costo+=r.costo;else faltan++
  }
  return {
    costo,faltan
  }
}
// Lo que se guarda de la sesión se lee una sola vez por turno: pintar 300 tarjetas no vuelve a leer el almacenamiento.
function contextoCostos(){
  if(!PRECIOS_CAZUELA){
    PRECIOS_CAZUELA={
      details:loadRecipeDetails(),amounts:loadRecipeAmounts(),saved:loadSaved()
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
  return a&&Array.isArray(a.rows)&&a.rows.length?a:null
}
// ≈ costo por porción de una comida: {porPorcion, faltan} o null (sin cantidades o sin ningún precio).
function costoPorPorcion(origen,id){
  if(!preciosActivos()||!preciosDataset())return null;
  try{
    const a=cantidadesDeComida(origen,id);
    if(!a)return null;
    const {
      costo,faltan
    }=costoDeFilas(a.rows,1);
    return costo>0?{
      porPorcion:costo/(a.yield>0?a.yield:1),faltan
    }:null
  }catch(e){
    return null
  }
}
function textoCostoComida(c){
  return c?formatoPesos(c.porPorcion)+" por porción"+(c.faltan?" ("+faltanTexto(c.faltan)+")":""):""
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
// Línea del día en Semana: ≈ costo de las comidas con cantidades de ese día y de toda la semana (misma línea).
function costosDelPlan(){
  const dia=diaPlanElegido(),r={
    dia:0,diaFaltan:0,semana:0,semanaFaltan:0
  };
  for(const e of planEntriesFlat()){
    const a=cantidadesDeComida("plato",e.item.id);
    let costo=0,faltan=0;
    if(!a)faltan=1;
    else{
      const c=costoDeFilas(a.rows,portionFactor(e.portions,a));
      costo=c.costo;
      faltan=c.faltan
    }
    r.semana+=costo;
    r.semanaFaltan+=faltan;
    if(e.day===dia){
      r.dia+=costo;
      r.diaFaltan+=faltan
    }
  }
  return r
}
function pintarCostoDia(){
  const p=document.getElementById("planDiaCosto");
  if(!p)return;
  let t="";
  try{
    if(preciosActivos()&&preciosDataset()){
      const c=costosDelPlan();
      if(c.semana>0){
        t=(c.dia>0?formatoPesos(c.dia)+" por día"+(c.diaFaltan?" ("+faltanTexto(c.diaFaltan)+")":"")+" · ":"")+formatoPesos(c.semana)+" la semana"+(c.semanaFaltan?" ("+faltanTexto(c.semanaFaltan)+")":"")
      }
    }
  }catch(e){
    t=""
  }
  p.textContent=t;
  p.hidden=!t
}
// Lista de compras: precio por ítem (sobre lo que falta comprar) y total. Devuelve null si no hay precios que mostrar.
function preciosDeLaLista(items){
  if(!preciosActivos()||!preciosDataset())return null;
  const porClave=new Map();
  let total=0,faltan=0,pendientes=0;
  for(const x of items){
    if(x.group!=="pendiente")continue;
    pendientes++;
    const faltaMapa=x.suggestion&&x.suggestion.kind==="partial"&&x.suggestion.missing&&comprasDescontar()?x.suggestion.missing:x.units;
    let costo=0,ok=!!faltaMapa&&faltaMapa.size>0;
    if(ok)for(const [u,q] of faltaMapa){
      const r=precioDe(x.name,q,u);
      if(!r){
        ok=false;
        break
      }
      costo+=r.costo
    }
    if(ok){
      total+=costo;
      porClave.set(x.key,formatoPesos(costo))
    }else faltan++
  }
  return {
    porClave,total,faltan,pendientes
  }
}
function totalAutomaticoLista(){
  const p=preciosDeLaLista(shoppingDisplayItems());
  return p&&p.porClave.size?p:null
}
// Textos de la lista: resumen con el total, fuente y aviso para quien no activó los precios.
function pintarPreciosCompras(p){
  const f=document.getElementById("comprasPrecioFuente"),a=document.getElementById("comprasPreciosAviso");
  if(a)a.hidden=preciosActivos();
  aplicarPrecios();
  if(f){
    f.textContent=p&&p.porClave.size?fuentePrecios():"";
    f.hidden=!f.textContent
  }
}
function resumenPrecios(p){
  return p&&p.porClave.size?" · "+formatoPesos(p.total)+(p.faltan?" ("+faltanTexto(p.faltan)+")":""):""
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
  if(s)s.value=regionPrecios()
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
  box.append(ce("strong",null,"Precios: "+(f.nombre||"INDEC")),ce("br"),document.createTextNode((f.atribucion||"")+" Último mes: "+mesCortoPrecios(d.meta.mes)+". "),enlace(f.informe,"Informe"),document.createTextNode(" · "),enlace(f.url,"Archivo"),ce("br"),document.createTextNode(f.nota||""))
}
(()=>{
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
