// Mi Plato Fácil · Primera vez (v15.3): tres pantallas (el método del plato, la rutina opcional y elegir de 3 a 5
// ideas para arrancar). Es una pantalla más del recorrido ("bienvenida"), no una capa.
// Parte 41: los archivos se unen en orden según su número, que define el orden de arranque.
// Se abre sola al cargar solo si no hay comidas, recetas ni plan y no existe la marca miPlatoFacil_bienvenida_v1.
// La marca ({"vista":true}) se escribe solo al tocar Saltar o "Armar mi semana"; mirar la bienvenida no escribe nada.
// Va en el respaldo como módulo opcional (18-respaldo-completo.js): al restaurar en otro teléfono no vuelve a aparecer.
var BIENVENIDA_KEY="miPlatoFacil_bienvenida_v1";
var bienvenidaPaso=1;
var bienvenidaDias=new Set();
var bienvenidaIdeas=[];
function bienvenidaVista(){
  try{
    return validBienvenida(JSON.parse(localStorage.getItem(BIENVENIDA_KEY)||"null"))
  }catch(e){
    return false
  }
}
function marcarBienvenidaVista(){
  if(bienvenidaVista())return true;
  try{
    localStorage.setItem(BIENVENIDA_KEY,JSON.stringify({
      vista:true
    }));
    return true
  }catch(e){
    return false
  }
}
// Usuario nuevo: sin comidas ni recetas guardadas, con el plan vacío y sin la marca.
function esUsuarioNuevo(){
  if(bienvenidaVista())return false;
  try{
    if(loadSaved().length)return false;
    if(Object.keys(loadRecipeDetails()).length)return false
  }catch(e){
    return false
  }
  const plan=loadPlan();
  return !DAYS.some(([d])=>SLOTS.some(([s])=>plan[d]&&plan[d][s]))
}
// Las ideas para arrancar: almuerzos y cenas del catálogo, las 8 primeras que respetan lo que evitás.
function ideasParaArrancar(){
  const evitar=typeof recipeAvoidTerms==="function"?recipeAvoidTerms():[];
  return data.menuCatalog.filter(x=>!evitar.length||!evitar.some(t=>normalizeSearchText(x.text).includes(t))).slice(0,8)
}
function pintarBienvenida(){
  document.querySelectorAll("#bienvenida [data-bienvenida-paso]").forEach(p=>{
    p.hidden=Number(p.dataset.bienvenidaPaso)!==bienvenidaPaso
  });
  document.getElementById("bienvenidaPaso").textContent="Paso "+bienvenidaPaso+" de 3";
  document.querySelectorAll("#bienvenidaDias [data-bienvenida-dia]").forEach(b=>{
    const on=bienvenidaDias.has(Number(b.dataset.bienvenidaDia));b.classList.toggle("is-selected",on);b.setAttribute("aria-pressed",String(on))
  });
  const box=document.getElementById("bienvenidaIdeas");
  box.replaceChildren(...ideasParaArrancar().map(idea=>{
    const b=ce("button","filter-chip",idea.text),on=bienvenidaIdeas.includes(idea.text);
    b.type="button";
    b.dataset.bienvenidaIdea=idea.text;
    b.classList.toggle("is-selected",on);
    b.setAttribute("aria-pressed",String(on));
    return b
  }));
  const n=bienvenidaIdeas.length;
  document.querySelector("#bienvenida [data-bienvenida-armar]").disabled=n<3;
  document.getElementById("bienvenidaIdeasEstado").textContent=n?"Elegiste "+n+" de 5.":"Se guardan en Mis comidas para armar tu semana."
}
function abrirBienvenida(){
  bienvenidaPaso=1;
  bienvenidaIdeas=[];
  const rutina=loadTrainingWeek();
  bienvenidaDias=new Set(rutina?rutina.days:[]);
  if(stack.at(-1)!=="bienvenida")go("bienvenida");
  pintarBienvenida()
}
function terminarBienvenida(destino){
  marcarBienvenidaVista();
  if(destino==="semana")openTab("semana");else restart()
}
// "Armar mi semana": guarda las ideas elegidas como comidas (sin duplicar) y abre la Semana para asignarlas.
function armarSemanaDesdeBienvenida(){
  if(bienvenidaIdeas.length<3)return;
  for(const texto of bienvenidaIdeas){
    const idea=ideaPorTexto(texto);
    if(idea)guardarIdea(idea)
  }
  terminarBienvenida("semana")
}
function guardarRutinaDeBienvenida(){
  const st=document.getElementById("bienvenidaRutinaEstado");
  try{
    localStorage.setItem(TRAINING_KEY,JSON.stringify({
      version:1,days:[...bienvenidaDias]
    }));
    renderTrainingWeek();
    bienvenidaPaso=3;
    pintarBienvenida()
  }catch(e){
    st.textContent="No se pudo guardar la rutina. Podés cargarla después en Más → Mi rutina."
  }
}
document.getElementById("bienvenida").addEventListener("click",e=>{
  const b=e.target.closest("button");
  if(!b)return;
  const d=b.dataset;
  try{
    if(d.bienvenidaSiguiente!==undefined){
      bienvenidaPaso=Math.min(3,bienvenidaPaso+1);pintarBienvenida()
    }else if(d.bienvenidaSaltar!==undefined)terminarBienvenida("hoy");
    else if(d.bienvenidaDia!==undefined){
      const n=Number(d.bienvenidaDia);if(bienvenidaDias.has(n))bienvenidaDias.delete(n);else bienvenidaDias.add(n);pintarBienvenida()
    }else if(d.bienvenidaRutina!==undefined)guardarRutinaDeBienvenida();
    else if(d.bienvenidaIdea!==undefined){
      const i=bienvenidaIdeas.indexOf(d.bienvenidaIdea);if(i>=0)bienvenidaIdeas.splice(i,1);else if(bienvenidaIdeas.length<5)bienvenidaIdeas.push(d.bienvenidaIdea);pintarBienvenida()
    }else if(d.bienvenidaArmar!==undefined)armarSemanaDesdeBienvenida()
  }catch(err){
    document.getElementById("bienvenidaIdeasEstado").textContent=err.message
  }
});
document.addEventListener("click",e=>{
  if(e.target.closest&&e.target.closest("[data-ver-bienvenida]"))abrirBienvenida()
});
// Al cargar: solo para un usuario nuevo (corre después de init(), así Hoy ya está pintado debajo).
try{
  if(esUsuarioNuevo())abrirBienvenida()
}catch(e){
}
