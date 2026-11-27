// Mi Plato Fácil · Armame aprende de vos (Ronda 6, Etapa 49): "¿Te gustó?" después de Lo comí y las reglas de "Días con poco tiempo".
// miPlatoFacil_gustos_v1 = {"<nombre de la comida sin tildes ni signos>": "snns"}: las últimas respuestas (s = Sí, n = No), la más nueva al final
// (hasta 12 por comida). Dos o más "No" seguidos sin ningún "Sí" después dejan a la comida fuera de lo que arma Armame.
// miPlatoFacil_armameReglas_v1 = {"poco": {"minutos": 30, "huecos": ["lunes|cena", …]}}: los huecos de poco tiempo (por omisión, las cenas de
// lunes a viernes, hasta 30 minutos). Los dos son opcionales en el respaldo.
// Parte 50: los archivos se unen en orden según su número, que define el orden de arranque.
var GUSTOS_KEY="miPlatoFacil_gustos_v1";
var ARMAME_REGLAS_KEY="miPlatoFacil_armameReglas_v1";
var Gustos={
claveDe(nombre){
  return normalizeSearchText(String(nombre||"")).replace(/[^a-z0-9ñ]+/g," ").trim()
},
validGustos(o){
  return !!o&&typeof o==="object"&&!Array.isArray(o)&&Object.keys(o).length<=500&&Object.entries(o).every(([k,v])=>typeof k==="string"&&k.length>0&&k.length<=120&&typeof v==="string"&&/^[sn]{1,12}$/.test(v))
},
cargar(){
  try{
    const o=JSON.parse(localStorage.getItem(GUSTOS_KEY)||"{}");
    if(!Gustos.validGustos(o))return {};
    return Object.fromEntries(Object.entries(o).filter(([k])=>!["__proto__","constructor","prototype"].includes(k)))
  }catch(e){
    return {}
  }
},
responder(nombre,respuesta){
  const k=Gustos.claveDe(nombre);
  if(!k||!/^[sn]$/.test(respuesta))return false;
  const todo=Gustos.cargar(),viejo=todo[k]||"";
  delete todo[k];
  todo[k]=(viejo+respuesta).slice(-12);
  // Máximo 500 comidas: si se pasa, se olvidan las que hace más que no se responden (las primeras de la lista).
  for(const clave of Object.keys(todo).slice(0,Math.max(0,Object.keys(todo).length-500)))delete todo[clave];
  if(!Gustos.validGustos(todo))return false;
  localStorage.setItem(GUSTOS_KEY,JSON.stringify(todo));
  return true
},
// {si, no, seguidosNo}: cuántos Sí y No hay y cuántos No seguidos hay al final (un Sí los borra).
estado(clave,todo){
  const s=(todo||Gustos.cargar())[clave]||"",seg=/n*$/.exec(s)[0].length;
  return {
    si:(s.match(/s/g)||[]).length,no:(s.match(/n/g)||[]).length,seguidosNo:seg
  }
},
// "Dos o más No y ningún Sí después".
disgustada(clave,todo){
  return Gustos.estado(clave,todo).seguidosNo>=2
},
// Puntaje para Armame: lo que dijiste que te gustó suma y lo que no, resta (de -3 a 3).
puntaje(clave,todo){
  const e=Gustos.estado(clave,todo);
  return Math.max(-3,Math.min(3,e.si-e.no))
},
// Cuántas veces comiste cada comida (Registro: Lo comí y preparaciones), por nombre.
vecesComidas(){
  const out=new Map(),sumar=t=>{
    const k=Gustos.claveDe(t);
    if(k)out.set(k,(out.get(k)||0)+1)
  };
  try{for(const x of loadConsumption())sumar(x.title)}catch(e){}
  try{for(const x of loadCookingHistory())sumar(x.title)}catch(e){}
  return out
},
// La pregunta de un toque. Dentro del modo cocina va en su pantalla; si no, abajo, arriba de la barra de pestañas.
preguntar(nombre){
  const k=Gustos.claveDe(nombre);
  if(!k)return;
  Gustos.cerrarPregunta();
  const caja=ce("div","gusto-pregunta"),texto=ce("span","gusto-pregunta__texto","¿Te gustó?"),si=ce("button","button button--soft","Sí"),no=ce("button","button button--soft","No"),cerrar=ce("button","gusto-pregunta__cerrar","✕");
  caja.id="gustoPregunta";
  caja.setAttribute("role","group");
  caja.setAttribute("aria-label","¿Te gustó "+nombre+"?");
  caja.dataset.gustoClave=k;
  si.type=no.type=cerrar.type="button";
  si.dataset.gustoResponder="s";
  no.dataset.gustoResponder="n";
  si.dataset.gustoNombre=no.dataset.gustoNombre=String(nombre).slice(0,120);
  cerrar.dataset.gustoCerrar="";
  cerrar.setAttribute("aria-label","Cerrar sin responder");
  caja.append(texto,si,no,cerrar);
  const cocina=document.getElementById("cocinaCuerpo");
  if(cocina&&document.getElementById("modoCocina")){
    caja.classList.add("gusto-pregunta--cocina");
    cocina.append(caja)
  }else document.body.append(caja);
  Gustos.temporizador=setTimeout(()=>Gustos.cerrarPregunta(),20000)
},
temporizador:null,
cerrarPregunta(){
  clearTimeout(Gustos.temporizador);
  Gustos.temporizador=null;
  const c=document.getElementById("gustoPregunta");
  if(c)c.remove()
}
};
// Las reglas de "Días con poco tiempo" (Preferencias).
var ArmameReglas={
MINUTOS:[15,20,30,45,60],
porOmision(){
  return {
    minutos:30,huecos:["lunes","martes","miercoles","jueves","viernes"].map(d=>d+"|cena")
  }
},
validReglas(o){
  if(!o||typeof o!=="object"||Array.isArray(o)||Object.keys(o).some(k=>k!=="poco"))return false;
  const p=o.poco;
  return !!p&&typeof p==="object"&&!Array.isArray(p)&&Object.keys(p).every(k=>k==="minutos"||k==="huecos")&&Number.isInteger(p.minutos)&&p.minutos>=5&&p.minutos<=240&&Array.isArray(p.huecos)&&p.huecos.length<=28&&p.huecos.every(h=>SemanaAjustes.validHueco(h))&&new Set(p.huecos).size===p.huecos.length
},
// Lo guardado o, sin nada (o con un formato malo), lo de siempre.
leer(){
  try{
    const o=JSON.parse(localStorage.getItem(ARMAME_REGLAS_KEY)||"null");
    return ArmameReglas.validReglas(o)?{
      minutos:o.poco.minutos,huecos:o.poco.huecos.slice()
    }:ArmameReglas.porOmision()
  }catch(e){
    return ArmameReglas.porOmision()
  }
},
guardar(r){
  const o={
    poco:{
      minutos:r.minutos,huecos:[...new Set(r.huecos)].sort((a,b)=>ArmameReglas.orden(a)-ArmameReglas.orden(b))
    }
  };
  if(!ArmameReglas.validReglas(o))throw Error("No se pudo guardar.");
  localStorage.setItem(ARMAME_REGLAS_KEY,JSON.stringify(o))
},
orden(h){
  const [d,s]=h.split("|");
  return DAYS.findIndex(x=>x[0]===d)*10+SLOTS.findIndex(x=>x[0]===s)
},
esPoco(dia,slot){
  return ArmameReglas.leer().huecos.includes(dia+"|"+slot)
},
alternar(dia,slot){
  const r=ArmameReglas.leer(),h=dia+"|"+slot;
  r.huecos=r.huecos.includes(h)?r.huecos.filter(x=>x!==h):r.huecos.concat(h);
  ArmameReglas.guardar(r);
  ArmameReglas.pintar()
},
cambiarMinutos(m){
  const r=ArmameReglas.leer();
  r.minutos=m;
  ArmameReglas.guardar(r);
  ArmameReglas.pintar()
},
pintar(){
  const g=document.getElementById("pocoTiempoGrilla"),sel=document.getElementById("pocoTiempoMinutos");
  if(!g)return;
  const r=ArmameReglas.leer();
  if(sel){
    if(!sel.options.length)for(const m of ArmameReglas.MINUTOS){
      const o=ce("option",null,m+" minutos");
      o.value=String(m);
      sel.append(o)
    }
    sel.value=String(r.minutos)
  }
  g.replaceChildren(...DAYS.map(([d,nombre])=>{
    const fila=ce("div","poco-fila"),et=ce("span","poco-fila__dia",nombre);
    fila.append(et);
    for(const slot of ["almuerzo","cena"]){
      const b=ce("button","filter-chip poco-chip",Semana.planSlotName(slot)),on=r.huecos.includes(d+"|"+slot);
      b.type="button";
      b.dataset.pocoTiempo=d+"|"+slot;
      b.setAttribute("aria-pressed",String(on));
      b.setAttribute("aria-label",Semana.planSlotName(slot)+" del "+nombre.toLowerCase()+": "+(on?"poco tiempo":"sin límite de tiempo"));
      fila.append(b)
    }
    return fila
  }));
  const est=document.getElementById("pocoTiempoEstado");
  if(est)est.textContent=r.huecos.length?"Armame pone ahí recetas de hasta "+r.minutos+" minutos.":"Ningún hueco está marcado: Armame no mira el tiempo."
}
};
document.addEventListener("click",e=>{
  const b=e.target.closest&&e.target.closest("button");
  if(!b||!b.dataset)return;
  const d=b.dataset;
  if(d.gustoResponder){
    const ok=Gustos.responder(d.gustoNombre,d.gustoResponder),c=document.getElementById("gustoPregunta");
    clearTimeout(Gustos.temporizador);
    if(c){
      c.replaceChildren(ce("span","gusto-pregunta__texto",ok?"Anotado, gracias.":"No se pudo anotar."));
      Gustos.temporizador=setTimeout(()=>Gustos.cerrarPregunta(),1800)
    }
    return
  }
  if(d.gustoCerrar!==undefined)return Gustos.cerrarPregunta();
  if(d.pocoTiempo){
    const [dia,slot]=d.pocoTiempo.split("|");
    try{
      ArmameReglas.alternar(dia,slot)
    }catch(err){
      const est=document.getElementById("pocoTiempoEstado");
      if(est)est.textContent=err.message
    }
  }
});
document.addEventListener("change",e=>{
  if(e.target&&e.target.id==="pocoTiempoMinutos"){
    try{
      ArmameReglas.cambiarMinutos(Number(e.target.value))
    }catch(err){
      const est=document.getElementById("pocoTiempoEstado");
      if(est)est.textContent=err.message
    }
  }
});
