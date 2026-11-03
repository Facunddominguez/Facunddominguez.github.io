// Mi Plato Fácil · Precios automáticos (Etapa 7): promedio de INDEC por región, sin conexión.
// Parte 44: los archivos se unen en orden según su número, que define el orden de arranque.
// Los datos los baja una tarea de GitHub Actions y se incrustan al construir. init() corre durante la carga de 14, antes
// que este archivo: acá solo hay function, var y manejadores (nada de const/let que usen los archivos anteriores), y al
// final se repinta lo que ya se había dibujado sin precios.
// Los precios se ven con el interruptor "Mostrar precios y presupuesto" (el mismo del modo simple, uiMode_v1): apagado
// no aparece ningún "≈ $". "Mi precio" (referencePrices_v1) gana sobre el promedio de INDEC.
var PRECIOS_SNAPSHOT=__DATOS_PRECIOS__;
var REGION_PRECIOS_KEY="miPlatoFacil_region_v1";
var REGIONES_PRECIOS=["GBA","Pampeana","Noreste","Noroeste","Cuyo","Patagonia"];
function validRegionPrecios(v){
  return typeof v==="string"&&["GBA","Pampeana","Noreste","Noroeste","Cuyo","Patagonia"].includes(v)
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
    return validRegionPrecios(v)?v:"GBA"
  }catch(e){
    return "GBA"
  }
}
function guardarRegionPrecios(r){
  if(!validRegionPrecios(r))throw new Error("Región inválida.");
  localStorage.setItem(REGION_PRECIOS_KEY,JSON.stringify(r))
}
function preciosActivos(){
  return!isSimpleMode()
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
// Línea del día en Semana: ≈ costo de las comidas con cantidades de ese día.
function pintarCostoDia(){
  const p=document.getElementById("planDiaCosto");
  if(!p)return;
  let t="";
  try{
    if(preciosActivos()&&preciosDataset()){
      const c=contextoCostos(),dia=diaPlanElegido();
      let costo=0,faltan=0;
      for(const e of planEntriesFlat()){
        if(e.day!==dia)continue;
        const a=cantidadesDeComida("plato",e.item.id);
        if(!a){
          faltan++;
          continue
        }
        const r=costoDeFilas(a.rows,portionFactor(e.portions,a));
        costo+=r.costo;
        faltan+=r.faltan
      }
      if(costo>0)t=formatoPesos(costo)+" por día"+(faltan?" ("+faltanTexto(faltan)+")":"")
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
    f.setAttribute("data-avanzado","compras");
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
