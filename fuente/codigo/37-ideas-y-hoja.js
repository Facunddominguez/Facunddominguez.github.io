// Mi Plato Fácil · Hoja inferior (componente compartido), nombre al guardar y detalle de una idea.
// Parte 38: los archivos se unen en orden según su número, que define el orden de arranque.
// La hoja es una sola en toda la app: se abre con un título, un contenido y acciones, y se cierra con "Cerrar",
// tocando afuera o con Escape. Devuelve el foco a lo que la abrió.
const hoja=(()=>{
  const fondo=ce("div","hoja-fondo"),caja=ce("section","hoja"),titulo=ce("h2","hoja__titulo"),cuerpo=ce("div","hoja__cuerpo"),acciones=ce("div","hoja__acciones"),estado=ce("p","screen__hint hoja__estado");
  fondo.hidden=true;
  caja.setAttribute("role","dialog");
  caja.setAttribute("aria-modal","true");
  titulo.id="hojaTitulo";
  caja.setAttribute("aria-labelledby","hojaTitulo");
  estado.setAttribute("aria-live","polite");
  caja.append(titulo,cuerpo,acciones,estado);
  fondo.append(caja);
  document.body.append(fondo);
  let volver=null;
  function cerrar(){
    if(fondo.hidden)return;
    fondo.hidden=true;
    document.body.classList.remove("con-hoja");
    if(volver&&volver.focus&&document.contains(volver))volver.focus({
      preventScroll:true
    });
    volver=null
  }
  function abrir({
    titulo:t,contenido,botones
  }){
    volver=document.activeElement;
    titulo.textContent=t;
    estado.replaceChildren();
    cuerpo.replaceChildren(...(contenido||[]));
    const cerrarBoton=ce("button","button button--soft","Cerrar");
    cerrarBoton.type="button";
    cerrarBoton.dataset.hojaCerrar="";
    cerrarBoton.addEventListener("click",cerrar);
    acciones.replaceChildren(...(botones||[]).map(([texto,clase,accion])=>{
      const b=ce("button","button "+(clase||"button--soft"),texto);
      b.type="button";
      b.addEventListener("click",()=>{
        try{
          accion(b)
        }catch(err){
          estado.textContent=err.message
        }
      });
      return b
    }),cerrarBoton);
    fondo.hidden=false;
    document.body.classList.add("con-hoja");
    const primero=caja.querySelector("input,select,button");
    if(primero)primero.focus({
      preventScroll:true
    })
  }
  fondo.addEventListener("click",e=>{
    if(e.target===fondo)cerrar()
  });
  document.addEventListener("keydown",e=>{
    if(e.key==="Escape"&&!fondo.hidden)cerrar()
  });
  return {
    abrir,cerrar,abierta:()=>!fondo.hidden,elemento:caja,estado
  }
})();
// Guardar con nombre: la hoja sugiere uno ("Merluza con papa y tomate", o el de la idea) que se puede cambiar.
function abrirGuardarConNombre(){
  if(!state.type){
    shareStatus("Primero armá un plato.");
    return
  }
  const sugerido=(state.nombreSugerido||nombreDesdeEstado(state,state.type)||"Mi comida").slice(0,80),campo=ce("input"),etiqueta=ce("label",null,"Nombre"),caja=ce("div","portion-field");
  campo.type="text";
  campo.id="hojaNombre";
  campo.maxLength=80;
  campo.value=sugerido;
  campo.autocomplete="off";
  etiqueta.htmlFor="hojaNombre";
  caja.append(etiqueta,campo);
  const guardar=()=>{
    const nombre=campo.value.trim()||sugerido;
    hoja.cerrar();
    savePlate(nombre)
  };
  campo.addEventListener("keydown",e=>{
    if(e.key==="Enter"){
      e.preventDefault();guardar()
    }
  });
  hoja.abrir({
    titulo:"Guardar comida",contenido:[caja],botones:[["Guardar","button--primary",guardar]]
  });
  campo.select()
}
// Una idea del catálogo como comida armada (mismo formato que un plato: state, lines y nombre en note).
function ideaComoComida(idea,dia){
  const st={
    type:"plato",day:dia||diaDeRutina(new Date())||"Día libre",fruta:null,bfprot:null,bfcarb:null,grasa:null,pre:null,snack:null,verduras:[],almidones:[],proteinas:[],legCarb:[],legProt:[],replaceCarb:false,replaceProt:false,customPortions:null,nombreSugerido:""
  };
  for(const k of SUGERENCIA_GRUPOS)st[k]=((idea.ingredientes||{})[k]||[]).map(name=>({
    name
  }));
  st.replaceCarb=!st.almidones.length&&st.legCarb.length>0;
  st.replaceProt=!st.proteinas.length&&st.legProt.length>0;
  return st
}
function ideaComoGuardada(idea,dia){
  const antes=JSON.parse(JSON.stringify(state));
  let snap;
  try{
    Object.assign(state,ideaComoComida(idea,dia));
    snap=currentSnapshot()
  }finally{
    Object.assign(state,antes)
  }
  snap.note=idea.text.slice(0,80);
  return snap
}
// Guarda la idea en Mis comidas (si ya estaba igual, usa la guardada).
function guardarIdea(idea,dia){
  const a=loadSaved(),snap=ideaComoGuardada(idea,dia),igual=a.find(x=>(x.sig||x.text)===snap.sig);
  if(igual)return {
    item:igual,nueva:false
  };
  a.unshift(snap);
  if(!persistSaved(a))throw Error("No se pudo guardar (falta de espacio u otro error).");
  return {
    item:snap,nueva:true
  }
}
// Agregar a la semana: guarda la idea con el día de la rutina de ese día y la asigna con setSlot (historial y
// porciones como siempre). Si reemplaza algo, se puede deshacer.
function agregarIdeaALaSemana(idea,dayKey,slot){
  if(!DAYS.some(d=>d[0]===dayKey)||!["almuerzo","cena"].includes(slot))throw Error("Elegí un día y una comida.");
  const dia=diaDeRutina(fechaDelDiaDelPlan(dayKey))||"Día libre",{
    item
  }=guardarIdea(idea,dia),antes=(loadPlan()[dayKey]||{})[slot]||null;
  setSlot(dayKey,slot,item.id);
  const texto="Agregada al "+planSlotName(slot).toLowerCase()+" del "+planDayName(dayKey).toLowerCase()+".";
  hoja.estado.replaceChildren(document.createTextNode(texto));
  if(antes&&antes!==item.id){
    const b=ce("button","filter-chip","Deshacer");
    b.type="button";
    b.addEventListener("click",()=>{
      setSlot(dayKey,slot,antes);hoja.estado.textContent="Listo, se deshizo."
    });
    hoja.estado.append(" ",b)
  }
  if(typeof renderToday==="function")renderToday()
}
function ideaPorTexto(texto){
  return data.menuCatalog.find(x=>x.text===texto)||null
}
// Detalle de una idea: qué lleva, Guardar y Agregar a la semana (día y comida).
function abrirIdea(idea){
  if(!idea)return;
  const ings=[...new Set(ideaIngredientes(idea).map(nombreCorto))],lleva=ce("p",null,ings.length?"Lleva: "+juntarY(ings.map((x,i)=>i?minuscula(x):x))+".":"Sin ingredientes vinculados.");
  const campo=(id,texto,opciones,valor)=>{
    const c=ce("div","portion-field"),l=ce("label",null,texto),s=ce("select");
    s.id=id;
    l.htmlFor=id;
    for(const [v,t] of opciones){
      const o=ce("option",null,t);o.value=v;s.append(o)
    }
    s.value=valor;
    c.append(l,s);
    return c
  };
  const hoyKey=DAYS[(new Date().getDay()+6)%7][0],dia=campo("hojaIdeaDia","Día",DAYS,hoyKey),comida=campo("hojaIdeaComida","Comida",SLOTS.filter(s=>s[0]==="almuerzo"||s[0]==="cena").map(([v,t])=>[v,t.replace(/^\S+\s/,"")]),"almuerzo"),fila=ce("div","pantry-item-qty");
  fila.append(dia,comida);
  hoja.abrir({
    titulo:idea.text,contenido:[lleva,fila],botones:[["Agregar a la semana","button--primary",()=>agregarIdeaALaSemana(idea,document.getElementById("hojaIdeaDia").value,document.getElementById("hojaIdeaComida").value)],["Guardar","button--soft",()=>{
      const r=guardarIdea(idea);hoja.estado.textContent=r.nueva?"Guardada en Mis comidas.":"Ya estaba en Mis comidas."
    }]]
  })
}
document.addEventListener("click",e=>{
  const b=e.target.closest&&e.target.closest("[data-idea-open]");
  if(b)abrirIdea(ideaPorTexto(b.dataset.ideaOpen))
});
