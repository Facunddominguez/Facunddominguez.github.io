// Mi Plato Fácil · Filtros de dieta (Etapa 16): sin carne roja, sin cerdo, sin pescado, vegetariano, sin lácteos y sin huevo.
// Parte 47: los archivos se unen en orden según su número, que define el orden de arranque.
// Se guardan en miPlatoFacil_dieta_v1 ({"filtros":["sin_cerdo"]}, opcional en el respaldo) y se aplican siempre (no hay que activarlos).
// El campo de texto libre de "Ingredientes a evitar" sigue como "Otros" (con su propio interruptor, en 21-recetas.js).
// Se comparan palabras completas del nombre, las etiquetas y los ingredientes de cada comida. Es un filtro por palabras: no
// comprueba alérgenos ni garantiza aptitud alimentaria, y la app no pone etiquetas de salud que no se puedan verificar.
// Solo funciones (el arranque ya pinta las Ideas antes de cargar este archivo).
var DIETA_KEY="miPlatoFacil_dieta_v1";
function dietaTabla(){
  const carneRoja=["carne vacuna","vacun[oa]s?","carne","bife","asado","vacio","nalga","cuadril","lomo","roast beef","cordero","peceto","ternera","salchicha","morcilla","higado"],
    cerdo=["cerdo","bondiola","pechito","jamon","panceta","chorizo","choripan","carre","lechon","bacon","tocino","salchicha","morcilla"],
    pescado=["pescado","pescados","merluza","atun","caballa","salmon","sardinas?","trucha","lenguado","filet","filete","corvina","pejerrey","mariscos?","camarones?","langostinos?","calamar(?:es)?","pulpo","anchoas?","surubi","brotola"],
    aves=["pollo","pavo","pato","aves?"];
  return [
    {id:"sin_carne_roja",nombre:"Sin carne roja",palabras:carneRoja},
    {id:"sin_cerdo",nombre:"Sin cerdo",palabras:cerdo},
    {id:"sin_pescado",nombre:"Sin pescado",palabras:pescado},
    {id:"vegetariano",nombre:"Vegetariano",palabras:[...carneRoja,...cerdo,...pescado,...aves]},
    {id:"sin_lacteos",nombre:"Sin lácteos",palabras:["leche(?! de (?:almendras?|coco|soja|avena))","quesos?","yogur(?:es)?","yogurt","yoghurt","crema de leche","manteca","ricota","mozzarella","muzzarella","provolone","reggianito","pategras","sardo","parmesano","ricotta","bechamel","cheddar","port salut","dulce de leche","flan","helado","cremoso","untable","lacteos?"]},
    {id:"sin_huevo",nombre:"Sin huevo",palabras:["huev[oa]s?","clara","yema","mayonesa","merengue","omelette"]}
  ]
}
function validDieta(o){
  const ids=dietaTabla().map(f=>f.id);
  return !!o&&typeof o==="object"&&!Array.isArray(o)&&Object.keys(o).length===1&&Array.isArray(o.filtros)&&o.filtros.length<=ids.length&&o.filtros.every((x,i)=>ids.includes(x)&&o.filtros.indexOf(x)===i)
}
function dietaFiltros(){
  try{
    const raw=localStorage.getItem(DIETA_KEY);
    if(raw===null)return [];
    const o=JSON.parse(raw);
    return validDieta(o)?o.filtros:[]
  }catch(e){
    return []
  }
}
function guardarDietaFiltros(lista){
  const ids=dietaTabla().map(f=>f.id),filtros=ids.filter(id=>lista.includes(id));
  try{
    if(filtros.length)localStorage.setItem(DIETA_KEY,JSON.stringify({filtros}));
    else localStorage.removeItem(DIETA_KEY);
    return true
  }catch(e){
    return false
  }
}
// ¿El texto (nombre, etiquetas e ingredientes) cumple los filtros de dieta que están activos?
function dietaPermite(texto){
  const activos=dietaFiltros();
  if(!activos.length)return true;
  const t=" "+normalizeSearchText(String(texto||"")).replace(/[^a-z0-9ñ]+/g," ").trim()+" ";
  return !dietaTabla().some(f=>activos.includes(f.id)&&f.palabras.some(p=>new RegExp("(?: )(?:"+p+")(?:s|es)?(?: )").test(t)))
}
// Texto de una idea del catálogo para filtrar: nombre, etiquetas e ingredientes vinculados. No usa SUGERENCIA_GRUPOS (36) porque
// las Ideas se pintan durante el arranque, antes de que corran esos archivos.
function textoDeIdea(idea){
  return idea.text+" "+(idea.tags||[]).join(" ")+" "+Object.values(idea.ingredientes||{}).flat().join(" ")
}
function dietaPermiteIdea(idea){
  return dietaPermite(textoDeIdea(idea))
}
// Cuántas ideas del catálogo dejan pasar los filtros y, si son pocas, un aviso ("" si no hay filtros o quedan muchas).
function dietaAvisoPocas(){
  if(!dietaFiltros().length&&!preferenciasEvitar().length)return "";
  const total=data.menuCatalog.length,quedan=data.menuCatalog.filter(i=>textoPermitido(textoDeIdea(i))).length;
  if(quedan>=10)return "";
  return quedan===0?"Con lo que evitás no queda ninguna idea. Probá sacar algún filtro.":"Con lo que evitás quedan pocas ideas: "+quedan+" de "+total+"."
}
function renderDieta(){
  const box=document.getElementById("dietaChips");
  if(!box)return;
  const activos=dietaFiltros();
  box.replaceChildren(...dietaTabla().map(f=>{
    const on=activos.includes(f.id),b=ce("button","filter-chip"+(on?" is-selected":""),f.nombre);
    b.type="button";b.dataset.dietaFiltro=f.id;b.setAttribute("aria-pressed",String(on));
    return b
  }));
  const av=document.getElementById("dietaAviso");
  if(av)av.textContent=dietaAvisoPocas()
}
function alternarDieta(id){
  const activos=dietaFiltros(),nuevos=activos.includes(id)?activos.filter(x=>x!==id):[...activos,id];
  guardarDietaFiltros(nuevos);
  renderDieta();
  try{renderMenuIdeas()}catch(e){}
}
document.addEventListener("click",e=>{
  const b=e.target.closest&&e.target.closest("button");
  if(b&&b.dataset.dietaFiltro)alternarDieta(b.dataset.dietaFiltro)
});
renderDieta();
