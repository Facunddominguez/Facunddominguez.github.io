// Mi Plato Fácil · Registro (v15.5): un solo lugar para ver y corregir lo registrado, día por día.
// Parte 43: los archivos se unen en orden según su número, que define el orden de arranque.
// Junta "Lo comí" (miPlatoFacil_consumption_v1) y "Lo cociné" (miPlatoFacil_cookingHistory_v1) sin cambiar su formato,
// y muestra aparte el contador "cooked" de cada plato, que no tiene fecha. Nada se combina ni se borra solo.
// init() corre antes de este archivo: todo lo que se llama al pintar es una declaración function y el estado va en var.
var registroFecha=null;
var registroUndo=null;
var REGISTRO_COMIDAS=["desayuno","almuerzo","merienda","cena","otra"];
function registroHoy(){
  return localTrainingDate(new Date())
}
function registroClaves(){
  return [CONSUMPTION_KEY,COOKING_HISTORY_KEY,SKEY]
}
function registroFoto(){
  return Object.fromEntries(registroClaves().map(k=>[k,localStorage.getItem(k)]))
}
// Aviso con Deshacer: vuelve las tres claves a como estaban (o las borra si no existían), si nada cambió después.
function registroAviso(el,texto,antes){
  if(!el)return;
  registroUndo={
    antes,despues:registroFoto(),el
  };
  const b=ce("button","filter-chip","Deshacer");
  b.type="button";
  b.dataset.registroDeshacer="";
  el.replaceChildren(document.createTextNode(texto+" "),b)
}
function deshacerRegistro(){
  const u=registroUndo;
  if(!u)return;
  registroUndo=null;
  if(JSON.stringify(registroFoto())!==JSON.stringify(u.despues)){
    u.el.textContent="No se puede deshacer: los datos cambiaron después.";
    return
  }
  try{
    for(const [k,v] of Object.entries(u.antes)){
      if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)
    }
  }catch(e){
    u.el.textContent="No se pudo deshacer.";
    return
  }
  registroRepintar();
  u.el.textContent="Listo, se deshizo."
}
// Después de cambiar un registro, se actualiza todo lo que lo muestra.
function registroRepintar(){
  for(const f of [()=>renderToday(),()=>renderPlan(),()=>renderSaved(),()=>{
    if(document.getElementById("consumptionPanel").open)renderConsumption()
  },()=>{
    if(document.getElementById("cookingHistoryPanel").open)renderCookingHistory()
  },()=>refrescarDetalleComida(),()=>{
    if(stack.at(-1)==="registro")renderRegistro()
  }]){
    try{
      f()
    }catch(e){
    }
  }
}
// Quita un solo registro por su id. No toca la despensa ni el contador.
// Lo comí: si lo guardado no se puede leer, no se encuentra el id y no se escribe nada.
// Lo cociné: se filtra el arreglo crudo, así los registros que no se muestran quedan como estaban.
function quitarRegistro(tipo,id){
  const antes=registroFoto();
  if(tipo==="comi"){
    const a=loadConsumption();
    if(!a.some(x=>x.id===id))throw Error("Ese registro ya no está.");
    saveConsumption(a.filter(x=>x.id!==id))
  }else{
    let a=null;
    try{
      a=JSON.parse(localStorage.getItem(COOKING_HISTORY_KEY)||"[]")
    }catch(e){
    }
    if(!Array.isArray(a)||!a.some(x=>x&&x.id===id))throw Error("Ese registro ya no está.");
    try{
      localStorage.setItem(COOKING_HISTORY_KEY,JSON.stringify(a.filter(x=>!(x&&x.id===id))))
    }catch(e){
      throw Error("No se pudo guardar el cambio.")
    }
  }
  return antes
}
function registroNombreComida(m){
  const t=String(m||"").trim();
  return t?t.charAt(0).toUpperCase()+t.slice(1):"Otra"
}
function registroOrden(m){
  const i=REGISTRO_COMIDAS.indexOf(normalizeSearchText(String(m||"")).trim());
  return i<0?REGISTRO_COMIDAS.length:i
}
// Los registros de un día, en orden de comida. Solo lee.
function registrosDelDia(fecha){
  // Lo comí guarda el título viejo del plato (savedItemTitle): al mostrarlo se usa el nombre de hoy, si el plato sigue.
  const filas=[],porId=new Map(loadSaved().map(p=>[p.id,p]));
  for(const x of loadConsumption())if(x.date===fecha)filas.push({
    tipo:"comi",id:x.id,meal:x.meal,title:x.sourceId&&porId.has(x.sourceId)?mealName(porId.get(x.sourceId)):x.title,planned:x.planned,sourceId:x.sourceId
  });
  for(const x of loadCookingHistory())if(x.date===fecha)filas.push({
    tipo:"cocine",id:x.id,meal:x.meal,title:x.title,lines:x.lines,sourceId:x.sourceId||null
  });
  return filas.map((f,i)=>({
    f,i
  })).sort((a,b)=>registroOrden(a.f.meal)-registroOrden(b.f.meal)||a.i-b.i).map(x=>x.f)
}
// Los últimos 14 días que tienen algo, del más nuevo al más viejo, con su cantidad.
function registroDiasConDatos(){
  const n=new Map();
  for(const x of loadConsumption())n.set(x.date,(n.get(x.date)||0)+1);
  for(const x of loadCookingHistory())n.set(x.date,(n.get(x.date)||0)+1);
  return [...n.entries()].sort((a,b)=>b[0].localeCompare(a[0])).slice(0,14)
}
function registroEtiquetaDia(f){
  const d=new Date(f+"T12:00:00"),ayer=new Date();
  ayer.setDate(ayer.getDate()-1);
  const t=d.toLocaleDateString("es-AR",{
    weekday:"long",day:"numeric",month:"long"
  });
  if(f===registroHoy())return "Hoy · "+t;
  if(f===localTrainingDate(ayer))return "Ayer · "+t;
  return t.charAt(0).toUpperCase()+t.slice(1)
}
function registroFila(r){
  const fila=ce("div","registro-fila");
  fila.dataset.registroTipo=r.tipo;
  fila.dataset.registroId=r.id;
  const texto=(r.tipo==="comi"?"🍽️ Lo comí · ":"🍳 Lo cociné · ")+registroNombreComida(r.meal)+" · "+r.title+(r.tipo==="comi"&&r.planned?" (del plan)":"");
  fila.append(ce("span","registro-fila__texto",texto));
  const b=ce("button","button button--danger registro-fila__quitar","Quitar");
  b.type="button";
  b.dataset.registroQuitar=r.tipo+"|"+r.id;
  b.setAttribute("aria-label","Quitar: "+texto);
  fila.append(b);
  return fila
}
function renderRegistroContadores(){
  const box=document.getElementById("registroContadoresLista");
  if(!box)return;
  const hist=loadCookingHistory(),platos=loadSaved().filter(p=>(p.cooked||0)>0);
  box.replaceChildren(...platos.map(p=>{
    const conFecha=hist.filter(h=>h.sourceId===p.id).length,fila=ce("div","registro-fila");
    fila.dataset.registroContador=p.id;
    fila.append(ce("span","registro-fila__texto",mealName(p)+" · "+p.cooked+" ve"+(p.cooked===1?"z":"ces")+" ("+conFecha+" con fecha)"));
    const b=ce("button","button button--soft registro-fila__quitar","−1");
    b.type="button";
    b.dataset.registroRestar=p.id;
    b.setAttribute("aria-label","Restar una vez a "+mealName(p));
    fila.append(b);
    return fila
  }));
  if(!platos.length)box.append(ce("p","screen__hint","Todavía no hay contadores."))
}
function renderRegistro(){
  const hoy=registroHoy();
  if(!registroFecha||registroFecha>hoy)registroFecha=hoy;
  const sec=document.getElementById("registro");
  if(!sec)return;
  try{
    sec.querySelector(".screen__kicker").textContent=TABS[activeTab].label
  }catch(e){
  }
  document.getElementById("registroFecha").textContent=registroEtiquetaDia(registroFecha);
  const sig=sec.querySelector('[data-registro-dia="1"]');
  sig.disabled=registroFecha>=hoy;
  const filas=registrosDelDia(registroFecha),lista=document.getElementById("registroLista");
  lista.replaceChildren(...filas.map(registroFila));
  if(!filas.length)lista.append(ce("p","screen__hint registro-vacio","Nada registrado este día."));
  const dias=document.getElementById("registroDias");
  dias.replaceChildren(...registroDiasConDatos().map(([f,n])=>{
    const b=ce("button","filter-chip",typedAppDateLabel(f).slice(0,5)+" · "+n);
    b.type="button";
    b.dataset.registroIr=f;
    b.setAttribute("aria-pressed",String(f===registroFecha));
    b.setAttribute("aria-label",registroEtiquetaDia(f)+": "+n+" registro"+(n===1?"":"s"));
    return b
  }));
  renderRegistroContadores()
}
// La única entrada: Más, Hoy, Semana ⋯ y el detalle de una comida.
function abrirRegistro(op){
  op=op||{
  };
  const hoy=registroHoy();
  registroFecha=op.fecha&&validTrainingDate(op.fecha)&&op.fecha<=hoy?op.fecha:hoy;
  try{
    if(hoja.abierta())hoja.cerrar()
  }catch(e){
  }
  if(op.abrir==="comi"){
    const p=document.getElementById("consumptionPanel");
    if(!p.open)p.open=true;else renderConsumption()
  }
  go("registro")
}
// El último día con un registro de esa comida (y, en las recetas, de sus copias del plan).
function registroUltimaFecha(ids){
  const set=new Set(ids);
  let f="";
  for(const x of loadConsumption())if(x.sourceId&&set.has(x.sourceId)&&x.date>f)f=x.date;
  for(const x of loadCookingHistory())if(x.sourceId&&set.has(x.sourceId)&&x.date>f)f=x.date;
  return f
}
function pintarEnlaceRegistro(){
  const box=document.getElementById("comidaRegistro");
  if(!box)return;
  box.replaceChildren();
  if(typeof comidaActual==="undefined"||!comidaActual)return;
  const saved=loadSaved(),ids=[comidaActual.id];
  if(comidaActual.origen==="receta")saved.forEach(p=>{
    if(p.recipeSourceId===comidaActual.id)ids.push(p.id)
  });
  else{
    const it=saved.find(p=>p.id===comidaActual.id);
    if(it&&it.recipeSourceId)ids.push(it.recipeSourceId)
  }
  const f=registroUltimaFecha(ids),b=ce("button","button button--soft","📒 Ver en el registro"+(f?" (último: "+typedAppDateLabel(f).slice(0,5)+")":""));
  b.type="button";
  b.dataset.openRegistro="";
  if(f)b.dataset.registroFecha=f;
  box.append(b)
}
function anotarDesdeRegistro(tipo){
  const fecha=typedAppDateLabel(registroFecha||registroHoy());
  if(tipo==="comi"){
    const p=document.getElementById("consumptionPanel");
    document.getElementById("consumptionDate").value=fecha;
    consumptionWeek=mondayOf(registroFecha||registroHoy());
    if(!p.open)p.open=true;else renderConsumption();
    p.scrollIntoView({
      block:"start"
    });
    document.getElementById("consumptionPlate").focus()
  }else{
    const p=document.getElementById("cookingHistoryPanel");
    document.getElementById("cookingHistoryDate").value=fecha;
    if(!p.open)p.open=true;else renderCookingHistory();
    p.scrollIntoView({
      block:"start"
    });
    document.getElementById("cookingHistoryPlate").focus()
  }
}
function restarContador(id){
  const a=loadSaved(),it=a.find(x=>x.id===id),st=document.getElementById("registroEstado");
  if(!it||!((it.cooked||0)>0))return;
  const antes=registroFoto();
  it.cooked=it.cooked-1;
  if(!persistSaved(a)){
    st.textContent="No se pudo guardar el cambio.";
    return
  }
  registroRepintar();
  registroAviso(st,"Restaste una vez a "+mealName(it)+".",antes)
}
document.addEventListener("click",e=>{
  const b=e.target.closest&&e.target.closest("button");
  if(!b)return;
  const d=b.dataset;
  if(d.openRegistro!==undefined)return abrirRegistro({
    fecha:d.registroFecha
  });
  if(d.registroDeshacer!==undefined)return deshacerRegistro();
  if(stack.at(-1)!=="registro")return;
  const st=document.getElementById("registroEstado");
  if(d.registroDia){
    const f=new Date((registroFecha||registroHoy())+"T12:00:00");
    f.setDate(f.getDate()+Number(d.registroDia));
    const nueva=localTrainingDate(f);
    if(nueva<=registroHoy())registroFecha=nueva;
    renderRegistro();
    return
  }
  if(d.registroIr){
    registroFecha=d.registroIr;
    renderRegistro();
    return
  }
  if(d.registroAnotar)return anotarDesdeRegistro(d.registroAnotar);
  if(d.registroRestar)return restarContador(d.registroRestar);
  if(d.registroQuitar){
    const [tipo,id]=d.registroQuitar.split("|"),fila=b.closest(".registro-fila"),texto=fila?fila.querySelector(".registro-fila__texto").textContent:"";
    try{
      const antes=quitarRegistro(tipo,id);
      registroRepintar();
      registroAviso(st,"Quitaste: "+texto+"."+(tipo==="cocine"?" La despensa no cambia.":""),antes)
    }catch(err){
      st.textContent=err.message
    }
  }
});
