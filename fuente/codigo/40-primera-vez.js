// Mi Plato Fácil · Primera vez (v15.3): cuatro pantallas (el método del plato, la rutina opcional, personas y presupuesto opcionales y elegir de 3 a 5
// ideas para arrancar). Es una pantalla más del recorrido ("bienvenida"), no una capa.
// Parte 41: los archivos se unen en orden según su número, que define el orden de arranque.
// Se abre sola al cargar solo si no hay comidas, recetas ni plan y no existe la marca miPlatoFacil_bienvenida_v1.
// La marca ({"vista":true}) se escribe solo al tocar Saltar o "Armar mi semana"; mirar la bienvenida no escribe nada.
// Va en el respaldo como módulo opcional (18-respaldo-completo.js): al restaurar en otro teléfono no vuelve a aparecer.
// Funciones de este archivo, agrupadas (Etapa 18). El resto de la app las llama como Bienvenida.nombre().
var Bienvenida={
bienvenidaVista(){
  try{
    return Respaldo.validBienvenida(JSON.parse(localStorage.getItem(BIENVENIDA_KEY)||"null"))
  }catch(e){
    return false
  }
},
marcarBienvenidaVista(){
  if(Bienvenida.bienvenidaVista())return true;
  try{
    localStorage.setItem(BIENVENIDA_KEY,JSON.stringify({
      vista:true
    }));
    return true
  }catch(e){
    return false
  }
},
esUsuarioNuevo(){
  if(Bienvenida.bienvenidaVista())return false;
  try{
    if(MisPlatos.loadSaved().length)return false;
    if(Object.keys(loadRecipeDetails()).length)return false
  }catch(e){
    return false
  }
  const plan=loadPlan();
  return !DAYS.some(([d])=>SLOTS.some(([s])=>plan[d]&&plan[d][s]))
},
ideasParaArrancar(){
  const evitar=typeof recipeAvoidTerms==="function"?recipeAvoidTerms():[];
  return data.menuCatalog.filter(x=>!evitar.length||!evitar.some(t=>normalizeSearchText(x.text).includes(t))).slice(0,8)
},
pintarBienvenida(){
  document.querySelectorAll("#bienvenida [data-bienvenida-paso]").forEach(p=>{
    p.hidden=Number(p.dataset.bienvenidaPaso)!==bienvenidaPaso
  });
  document.getElementById("bienvenidaPaso").textContent="Paso "+bienvenidaPaso+" de 4";
  document.querySelectorAll("#bienvenidaDias [data-bienvenida-dia]").forEach(b=>{
    const on=bienvenidaDias.has(Number(b.dataset.bienvenidaDia));b.classList.toggle("is-selected",on);b.setAttribute("aria-pressed",String(on))
  });
  const box=document.getElementById("bienvenidaIdeas");
  box.replaceChildren(...Bienvenida.ideasParaArrancar().map(idea=>{
    const b=ce("button","filter-chip",idea.corto||idea.text),on=bienvenidaIdeas.includes(idea.text);
    b.type="button";
    b.dataset.bienvenidaIdea=idea.text;
    b.classList.toggle("is-selected",on);
    b.setAttribute("aria-pressed",String(on));
    return b
  }));
  const n=bienvenidaIdeas.length;
  document.querySelector("#bienvenida [data-bienvenida-armar]").disabled=n<3;
  document.getElementById("bienvenidaIdeasEstado").textContent=n?"Elegiste "+n+" de 5."+(n<3?" Elegí al menos 3.":""):"Con estas ideas te armo la semana enseguida."
},
abrirBienvenida(){
  bienvenidaPaso=1;
  bienvenidaIdeas=[];
  const rutina=Rutina.loadTrainingWeek();
  bienvenidaDias=new Set(rutina?rutina.days:[]);
  if(stack.at(-1)!=="bienvenida")go("bienvenida");
  Bienvenida.pintarBienvenida()
},
terminarBienvenida(destino){
  Bienvenida.marcarBienvenidaVista();
  // La pila de Hoy vuelve a su raíz (home) antes de cambiar de pestaña: si no, Hoy recordaba el paso 4 de la bienvenida (Etapa 25).
  restart();
  if(destino==="semana")openTab("semana")
},
armarSemanaDesdeBienvenida(){
  if(bienvenidaIdeas.length<3)return;
  for(const texto of bienvenidaIdeas){
    const idea=IdeasHoja.ideaPorTexto(texto);
    if(idea)IdeasHoja.guardarIdea(idea)
  }
  Bienvenida.terminarBienvenida("semana");
  // El botón dice "Armar mi semana": la arma de verdad (con las ideas elegidas primero) y deja el aviso con Deshacer.
  try{
    if(typeof ArmameSemana!=="undefined"&&ArmameSemana.huecosVacios()>0){
      const elegidas=new Set(bienvenidaIdeas.map(t=>normalizeSearchText(t)));
      const ids=MisPlatos.loadSaved().filter(x=>!x.deLaSemana&&elegidas.has(normalizeSearchText(mealName(x)))).map(x=>x.id);
      ArmameSemana.correr("vacios",ids)
    }
  }catch(e){
  }
},
guardarHogarDeBienvenida(){
  const st=document.getElementById("bienvenidaHogarEstado"),personas=Number(document.getElementById("bienvenidaPersonas").value),
    raw=document.getElementById("bienvenidaPresupuesto").value.trim(),region=document.getElementById("bienvenidaRegion").value;
  let limite=null;
  if(raw){
    limite=Number(raw.replace(/\./g,"").replace(",","."));
    if(!Number.isFinite(limite)||limite<=0||limite>100000000000){
      st.textContent="El presupuesto tiene que ser un número mayor que 0. Si no querés cargarlo, dejalo vacío.";
      return
    }
  }
  try{
    if(personas>1)guardarPersonasHogar(personas);
    if(limite!==null)localStorage.setItem(SHOP_BUDGET_KEY,JSON.stringify({currency:"ARS",limit:limite,period:"semana"}));
    if(region!=="GBA"||localStorage.getItem(REGION_PRECIOS_KEY)!==null)guardarRegionPrecios(region);
    if(typeof renderHogar==="function")renderHogar();
    if(typeof renderRegionPrecios==="function")renderRegionPrecios();
    bienvenidaPaso=4;
    Bienvenida.pintarBienvenida()
  }catch(e){
    st.textContent="No se pudo guardar. Podés cargarlo después en Preferencias."
  }
},
guardarRutinaDeBienvenida(){
  const st=document.getElementById("bienvenidaRutinaEstado");
  try{
    localStorage.setItem(TRAINING_KEY,JSON.stringify({
      version:1,days:[...bienvenidaDias]
    }));
    Rutina.renderTrainingWeek();
    bienvenidaPaso=3;
    Bienvenida.pintarBienvenida()
  }catch(e){
    st.textContent="No se pudo guardar la rutina. Podés cargarla después en Más → Mi rutina."
  }
}
};
var BIENVENIDA_KEY="miPlatoFacil_bienvenida_v1";
var bienvenidaPaso=1;
var bienvenidaDias=new Set();
var bienvenidaIdeas=[];
// Usuario nuevo: sin comidas ni recetas guardadas, con el plan vacío y sin la marca.
// Las ideas para arrancar: almuerzos y cenas del catálogo, las 8 primeras que respetan lo que evitás.
// "Armar mi semana": guarda las ideas elegidas como comidas (sin duplicar), abre la Semana y la arma con Armame la semana.
// Paso opcional (Etapa 14): personas, presupuesto semanal y región de precios. Solo se guarda lo que se cargó; no cargar nada deja todo como estaba.
document.getElementById("bienvenida").addEventListener("click",e=>{
  const b=e.target.closest("button");
  if(!b)return;
  const d=b.dataset;
  try{
    if(d.bienvenidaSiguiente!==undefined){
      bienvenidaPaso=Math.min(4,bienvenidaPaso+1);Bienvenida.pintarBienvenida()
    }else if(d.bienvenidaSaltar!==undefined)Bienvenida.terminarBienvenida("hoy");
    else if(d.bienvenidaDia!==undefined){
      const n=Number(d.bienvenidaDia);if(bienvenidaDias.has(n))bienvenidaDias.delete(n);else bienvenidaDias.add(n);Bienvenida.pintarBienvenida()
    }else if(d.bienvenidaRutina!==undefined)Bienvenida.guardarRutinaDeBienvenida();
    else if(d.bienvenidaHogar!==undefined)Bienvenida.guardarHogarDeBienvenida();
    else if(d.bienvenidaIdea!==undefined){
      const i=bienvenidaIdeas.indexOf(d.bienvenidaIdea);if(i>=0)bienvenidaIdeas.splice(i,1);else if(bienvenidaIdeas.length<5)bienvenidaIdeas.push(d.bienvenidaIdea);Bienvenida.pintarBienvenida()
    }else if(d.bienvenidaArmar!==undefined)Bienvenida.armarSemanaDesdeBienvenida()
  }catch(err){
    document.getElementById("bienvenidaIdeasEstado").textContent=err.message
  }
});
document.addEventListener("click",e=>{
  if(e.target.closest&&e.target.closest("[data-ver-bienvenida]"))Bienvenida.abrirBienvenida()
});
// Al cargar: solo para un usuario nuevo (corre después de init(), así Hoy ya está pintado debajo).
try{
  if(Bienvenida.esUsuarioNuevo())Bienvenida.abrirBienvenida()
}catch(e){
}
