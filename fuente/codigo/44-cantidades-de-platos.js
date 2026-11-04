// Mi Plato Fácil · Cantidades de los platos armados, personas por hogar, envases reales y básicos de alacena (Etapa 12).
// Parte 45: los archivos se unen en orden según su número, que define el orden de arranque.
// Solo function y var (el arranque corre antes que este archivo). Nada de esto escribe lo guardado: las cantidades de los
// platos armados se calculan al mostrarse, a partir de las porciones que la app ya muestra ("1 unidad", "2 cdas", "1/4 del plato").
// Datos nuevos: miPlatoFacil_hogar_v1 {"personas":n} y miPlatoFacil_basicosFaltantes_v1 {"faltan":["Aceite"]} (ambos opcionales en el respaldo).
// Funciones de este archivo, agrupadas (Etapa 18). El resto de la app las llama como CantidadesPlatos.nombre().
var CantidadesPlatos={
cambiarPersonasHogar(valor){
  const ok=guardarPersonasHogar(valor),st=document.getElementById("hogarPersonasEstado");
  if(!ok&&st)st.textContent="No se pudo guardar.";
  renderHogar();
  try{renderCompras()}catch(e){}
  if(typeof refrescarPrecios==="function")try{refrescarPrecios()}catch(e){}
}
};
var ENVASES_DATOS=__DATOS_ENVASES__;
var HOGAR_KEY="miPlatoFacil_hogar_v1";
var BASICOS_FALTANTES_KEY="miPlatoFacil_basicosFaltantes_v1";
function validHogar(o){
  return !!o&&typeof o==="object"&&!Array.isArray(o)&&Object.keys(o).length===1&&Number.isInteger(o.personas)&&o.personas>=1&&o.personas<=12
}
function validBasicosFaltantes(o){
  return !!o&&typeof o==="object"&&!Array.isArray(o)&&Object.keys(o).length===1&&Array.isArray(o.faltan)&&o.faltan.length<=50&&o.faltan.every(x=>typeof x==="string"&&x.length>0&&x.length<=60)
}
function personasHogar(){
  try{
    const raw=localStorage.getItem(HOGAR_KEY);
    if(raw===null)return 1;
    const o=JSON.parse(raw);
    return validHogar(o)?o.personas:1
  }catch(e){
    return 1
  }
}
function guardarPersonasHogar(n){
  const v=Math.round(Number(n));
  if(!(v>=1&&v<=12))return false;
  try{
    if(v===1&&localStorage.getItem(HOGAR_KEY)===null)return true;
    localStorage.setItem(HOGAR_KEY,JSON.stringify({personas:v}));
    return true
  }catch(e){
    return false
  }
}
function datosEnvases(){
  return typeof ENVASES_DATOS!=="undefined"&&ENVASES_DATOS?ENVASES_DATOS:{gramosPorCuarto:{verduras:100,almidones:80,proteinas:120},basicos:[],pesoPorcion:{},envases:[]}
}
// ¿El nombre empieza con (o es) el de la tabla? Se compara sin tildes ni mayúsculas, por palabras completas.
function palabrasSinPlural(texto){
  return normalizeSearchText(String(texto||"")).replace(/[^a-z0-9ñ]+/g," ").trim().split(" ").map(w=>w.length>3?w.replace(/s$/,""):w).join(" ")
}
function nombreEmpiezaCon(nombre,base){
  return (" "+palabrasSinPlural(nombre)+" ").startsWith(" "+palabrasSinPlural(base)+" ")
}
function esBasicoDeAlacena(nombre){
  return datosEnvases().basicos.some(b=>nombreEmpiezaCon(nombre,b))
}
function basicosFaltantes(){
  try{
    const raw=localStorage.getItem(BASICOS_FALTANTES_KEY);
    if(raw===null)return [];
    const o=JSON.parse(raw);
    return validBasicosFaltantes(o)?o.faltan:[]
  }catch(e){
    return []
  }
}
function guardarBasicoFaltante(nombre,falta){
  const lista=basicosFaltantes().filter(x=>normalizeSearchText(x)!==normalizeSearchText(nombre));
  if(falta)lista.push(nombre);
  try{
    if(lista.length)localStorage.setItem(BASICOS_FALTANTES_KEY,JSON.stringify({faltan:lista}));
    else localStorage.removeItem(BASICOS_FALTANTES_KEY);
    return true
  }catch(e){
    return false
  }
}
// Un básico queda fuera de la lista y del costo, salvo que esté marcado como faltante en la Despensa.
function fueraDeLaLista(nombre){
  return esBasicoDeAlacena(nombre)&&!basicosFaltantes().some(x=>nombreEmpiezaCon(nombre,x))
}
// Texto de porción de la app → {q, unit}: "2 unidades grandes o 4 pequeñas" → 2 unidad; "1/4 taza o 1 puñado" → 0,25 taza.
function leerPorcion(texto){
  const primera=String(texto||"").split(/\s+o\s+|\s*\|\s*/)[0].trim().toLowerCase();
  const m=/^(\d+(?:[.,]\d+)?|\d+\/\d+)\s*(.*)$/.exec(primera);
  if(!m)return null;
  let q;
  if(m[1].includes("/")){const [a,b]=m[1].split("/").map(Number);q=a/b}else q=Number(m[1].replace(",","."));
  const w=m[2];
  let unit=null;
  if(/^unidad/.test(w))unit="unidad";
  else if(/^cdas?\b|^cucharadas?/.test(w))unit="cucharada";
  else if(/^cditas?\b|^cucharaditas?/.test(w))unit="cucharadita";
  else if(/^taza/.test(w))unit="taza";
  else if(/^vaso/.test(w)){q*=200;unit="ml"}
  else if(/^(rodaja|tajada|rebanada|pote|porci[oó]n|pu[nñ]ado)/.test(w))unit=/^(rodaja|tajada)/.test(w)?w.split(/\s/)[0].replace(/s$/,""):"unidad";
  if(!unit||!(q>0)||!Number.isFinite(q))return null;
  return {q,unit}
}
// Pasa rodajas y tajadas a gramos con la tabla curada (Ananá, Melón, Sandía); el resto queda como está.
function cantidadNormal(nombre,q,unit){
  const t=datosEnvases().pesoPorcion;
  if(unit==="rodaja"||unit==="tajada"){
    for(const [n,u] of Object.entries(t))if(u[unit]&&nombreEmpiezaCon(nombre,n))return {q:q*u[unit],unit:"g"};
    return {q,unit:"unidad"}
  }
  return {q,unit}
}
function fraccionDelPlato(texto){
  const m=/^(\d+)\s*\/\s*(\d+)$/.exec(String(texto||"").trim());
  return m&&Number(m[2])>0?Number(m[1])/Number(m[2]):null
}
// Cantidades de un plato guardado, por persona: [{name,q,unit}]. Sin "state" (platos de texto) devuelve []. No escribe nada.
function cantidadesDePlatoArmado(item){
  const st=item&&item.state;
  if(!st||typeof st!=="object")return [];
  const out=[],sumar=(nombre,q,unit)=>{
    if(!nombre||!(q>0))return;
    let c=cantidadNormal(nombre,q,unit);
    // Un vaso de licuado de fruta ("Fruta de estación") se cuenta como una fruta, no como 200 ml.
    if(c.unit==="ml"&&nombre===data.frutaGenerica)c={q:Math.max(1,Math.round(c.q/200)),unit:"unidad"};
    if(c.unit==="g")c={q:Math.max(5,Math.round(c.q/5)*5),unit:"g"};
    out.push({name:nombre,q:c.q,unit:c.unit})
  };
  const nombresDe=o=>o&&o.name&&o.name!=="No elegido"&&o.name!=="No sumo grasa"?comprables(o.name):[];
  if(st.type==="desayuno"||st.type==="snack"||st.type==="pre"||(!st.type&&(st.fruta||st.bfprot||st.bfcarb||st.grasa||st.snack||st.pre))){
    for(const k of ["fruta","bfprot","bfcarb","grasa","snack","pre"]){
      const o=st[k],nombres=nombresDe(o);
      if(!nombres.length)continue;
      if(k==="fruta"&&o.quantity&&String(o.quantity).includes(" + ")&&!esFormaDeFruta(o.name)){
        const q=String(o.quantity).split(" + ");
        nombres.forEach((n,i)=>{const p=leerPorcion(q[i]);if(p)sumar(n,p.q,p.unit)});
        continue
      }
      const p=leerPorcion(o.quantity);
      if(p)nombres.forEach(n=>sumar(n,p.q/nombres.length,p.unit));
      else nombres.forEach(n=>sumar(n,1,"unidad"))
    }
  }
  const plato=["verduras","almidones","proteinas","legCarb","legProt"].some(k=>Array.isArray(st[k])&&st[k].length);
  if(plato){
    const base=st.day==="Día de entrenamiento"?{vegetables:"1/3",carbs:"1/3",protein:"1/3"}:{vegetables:"1/2",carbs:"1/4",protein:"1/4"};
    const por=st.customPortions&&typeof st.customPortions==="object"?{...base,...st.customPortions}:base,g=datosEnvases().gramosPorCuarto;
    const grupos=[["verduras",["verduras"],por.vegetables,g.verduras],["almidones",["almidones","legCarb"],por.carbs,g.almidones],["proteinas",["proteinas","legProt"],por.protein,g.proteinas]];
    for(const [,claves,fr,gramos] of grupos){
      const nombres=claves.flatMap(k=>(Array.isArray(st[k])?st[k]:[]).flatMap(nombresDe));
      if(!nombres.length)continue;
      const f=fraccionDelPlato(fr)||0.25,total=f/0.25*gramos;
      nombres.forEach(n=>{
        const gr=total/nombres.length,pu=datosEnvases().pesoPorcion.Huevo;
        if(nombreEmpiezaCon(n,"Huevo")&&pu&&pu.unidad)sumar(n,Math.max(1,Math.round(gr/pu.unidad)),"unidad");
        else sumar(n,gr,"g")
      })
    }
  }
  return out
}
// Peso (g) de una unidad común del ingrediente, de la tabla curada; null si no está.
function pesoUnidadCurado(nombre){
  const t=datosEnvases().pesoUnidad;
  if(!t)return null;
  for(const [n,g] of Object.entries(t))if(nombreEmpiezaCon(nombre,n))return g;
  return null
}
// Envase real de un ingrediente, si la tabla curada lo tiene.
function envaseDe(nombre){
  return datosEnvases().envases.find(e=>nombreEmpiezaCon(nombre,e.n))||null
}
function textoNumeroEnvase(n){
  return Number(n.toFixed(2)).toLocaleString("es-AR",{maximumFractionDigits:2})
}
// Redondea lo que falta comprar a envases enteros. units: Map unidad→cantidad. Devuelve
// {texto, units (lo que se compra, para el precio), envases} o null si no se puede (sin envase típico o sin unidad compatible).
function envasar(nombre,units){
  const e=envaseDe(nombre);
  if(!e||!units||!units.size)return null;
  let base=0,hay=false;
  for(const [u,q] of units){
    const i=Ingredientes.unitInfo(u);
    if(e.u==="g"&&i.dim==="masa"){base+=q*i.factor;hay=true}
    else if(e.u==="ml"&&i.dim==="volumen"){base+=q*i.factor;hay=true}
    else if(e.u==="unidad"&&i.dim==="unidad"){base+=q;hay=true}
    else if(e.u==="g"){
      // Cucharadas, tazas o unidades de algo que se vende por peso: se pasan a gramos con la tabla de nutrición.
      const gr=typeof nutritionFor==="function"?nutritionGrams(nutritionFor(nombre),q,u):null;
      if(gr===null)return null;
      base+=gr;hay=true
    }else return null
  }
  if(!hay||!(base>0))return null;
  const n=Math.max(1,Math.ceil(base/e.tam-1e-9)),total=n*e.tam;
  let texto;
  const plural=n===1?e.envase:(/[aeiout]$/.test(e.envase)?e.envase+"s":e.envase+"es");
  if(e.corto)texto=n+" "+plural;
  else texto=n+" "+plural+" de "+textoNumeroEnvase(e.tam)+" "+(e.ut||(e.u==="g"?"g":e.u==="ml"?"ml":"unidades"));
  return {texto,units:new Map([[e.u==="g"?"g":e.u,total]]),envases:n}
}
// Personas por hogar (Preferencias) y básicos de alacena (Despensa).
function renderHogar(){
  const sel=document.getElementById("hogarPersonas");
  if(sel)sel.value=String(personasHogar())
}
var BASICOS_VISIBLES=["Aceite","Sal","Pimienta","Vinagre","Orégano","Pimentón","Comino","Ají molido"];
function renderBasicos(){
  const box=document.getElementById("basicosChips");
  if(!box)return;
  const faltan=basicosFaltantes().map(x=>normalizeSearchText(x));
  box.replaceChildren(...BASICOS_VISIBLES.map(n=>{
    const on=faltan.includes(normalizeSearchText(n)),b=ce("button","filter-chip"+(on?" is-selected":""),n+(on?" · me falta":""));
    b.type="button";b.dataset.basicoFalta=n;b.setAttribute("aria-pressed",String(on));
    b.setAttribute("aria-label",n+(on?": me falta, tocá para sacarlo de la lista":": lo tengo, tocá si te falta"));
    return b
  }))
}
function alternarBasicoFaltante(nombre){
  const falta=!basicosFaltantes().some(x=>normalizeSearchText(x)===normalizeSearchText(nombre));
  guardarBasicoFaltante(nombre,falta);
  renderBasicos();
  try{renderCompras()}catch(e){}
}
(function(){
  const sel=document.getElementById("hogarPersonas");
  if(sel)sel.addEventListener("change",()=>CantidadesPlatos.cambiarPersonasHogar(sel.value));
  renderHogar();
  renderBasicos()
})();
