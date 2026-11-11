// Mi Plato Fácil · Hoja inferior (componente compartido), nombre al guardar y detalle de una idea.
// Parte 38: los archivos se unen en orden según su número, que define el orden de arranque.
// La hoja es una sola en toda la app: se abre con un título, un contenido y acciones, y se cierra con "Cerrar",
// tocando afuera o con Escape. Devuelve el foco a lo que la abrió.
// Funciones de este archivo, agrupadas (Etapa 18). El resto de la app las llama como IdeasHoja.nombre().
var IdeasHoja={
// Etapa 28: la idea del catálogo de la que viene una comida guardada (para sus cantidades, sus pasos y su nombre corto), o null.
// Vale si la nota de la comida es la de la idea (idea.text.slice(0, 80)) y los ingredientes del state son los mismos que los de la idea.
// Si la comida se renombró, la idea se busca por ingredientes y solo vale si hay una sola con ese mismo conjunto. Una comida a la que
// se le cambió un ingrediente no es la idea: vuelve al cálculo general. No escribe nada.
ideaDeComida(item){
  const st=item&&item.state;
  if(!st||typeof st!=="object"||item.recipeSourceId||(st.type!=="plato"&&st.type!=="desayuno"))return null;
  const claveDe=nombres=>[...new Set(nombres.map(n=>ingredientKey(n)).filter(Boolean))].sort().join("|");
  const idx=IdeasHoja.indiceDeIdeas(),mios=[];
  if(st.type==="desayuno"){
    // Un desayuno o merienda de una idea: fruta, proteína y cereal (los nombres de su campo "desayuno").
    for(const k of ["fruta","bfprot","bfcarb"])if(st[k]&&st[k].name)mios.push(st[k].name)
  }else for(const k of SUGERENCIA_GRUPOS)for(const o of Array.isArray(st[k])?st[k]:[])if(o&&o.name)mios.push(o.name);
  if(!mios.length)return null;
  const conjunto=claveDe(mios);
  const porNota=item.note?idx.porNota.get(item.note):null;
  if(porNota&&claveDe(IdeasHoja.nombresDeIdea(porNota))===conjunto)return porNota;
  const posibles=(idx.porConjunto.get(conjunto)||[]).filter(i=>(i.tipo==="desayuno")===(st.type==="desayuno"));
  return posibles.length===1?posibles[0]:null
},
// Los ingredientes con que se reconoce una idea: los del plato o, en un desayuno, fruta, proteína y cereal.
nombresDeIdea(idea){
  const d=idea&&idea.desayuno;
  return d?[d.fruta,d.prot,d.cereal].filter(Boolean):ideaIngredientes(idea)
},
indiceDeIdeas(){
  const total=data.menuCatalog.length+(data.desayunoCatalog||[]).length;
  // El índice depende de los alias de ingredientes del usuario (ingredientKey): si cambian, se arma de nuevo.
  let sig="";
  try{sig=localStorage.getItem("miPlatoFacil_ingredientAliases_v1")||""}catch(e){}
  if(!IdeasHoja._indice||IdeasHoja._indice.total!==total||IdeasHoja._indice.sig!==sig){
    const porNota=new Map(),porConjunto=new Map();
    for(const idea of data.menuCatalog.concat(data.desayunoCatalog||[])){
      if(!Array.isArray(idea.cantidades))continue;
      porNota.set(idea.text.slice(0,80),idea);
      const k=[...new Set(IdeasHoja.nombresDeIdea(idea).map(n=>ingredientKey(n)).filter(Boolean))].sort().join("|");
      if(!porConjunto.has(k))porConjunto.set(k,[]);
      porConjunto.get(k).push(idea)
    }
    IdeasHoja._indice={total,sig,porNota,porConjunto}
  }
  return IdeasHoja._indice
},
// Etapa 29: ¿el costo por porción de la idea está en el tercio más barato de las ideas de su tipo (plato o desayuno)? Con los precios
// apagados o sin precio para la idea, no. Se calcula una vez por conjunto de precios.
esEconomica(idea){
  const ds=typeof preciosDataset==="function"?preciosDataset():null;
  if(!ds||typeof preciosActivos!=="function"||!preciosActivos())return false;
  const marca=ds.meta,tipo=idea.desayuno?"desayuno":"plato";
  let propios="";
  try{propios=localStorage.getItem(REFERENCE_PRICES_KEY)||""}catch(e){}
  if(!IdeasHoja._eco||IdeasHoja._eco.marca!==marca||IdeasHoja._eco.region!==regionPrecios()||IdeasHoja._eco.propios!==propios){
    const por=(lista)=>{
      const costos=lista.map(i=>Bienvenida.costoPorPorcionDeIdea(i)).filter(c=>c!==null).sort((a,b)=>a-b);
      return costos.length?costos[Math.max(0,Math.ceil(costos.length/3)-1)]:null
    };
    IdeasHoja._eco={marca,propios,region:regionPrecios(),plato:por(data.menuCatalog.filter(i=>Array.isArray(i.cantidades))),desayuno:por((data.desayunoCatalog||[]).filter(i=>Array.isArray(i.cantidades)))}
  }
  const tope=IdeasHoja._eco[tipo],c=Bienvenida.costoPorPorcionDeIdea(idea);
  return tope!==null&&c!==null&&c<=tope
},
// Nombre que se ve en Semana, Hoy y los selectores: el corto si es una idea sin renombrar; si no, el de siempre.
nombreCorto(item){
  const nombre=mealName(item),idea=IdeasHoja.ideaDeComida(item);
  return idea&&idea.corto&&normalizeSearchText(nombre)===normalizeSearchText(idea.text)?idea.corto:nombre
},
// "300 g", "2 unidades", "½ unidad": la cantidad de una fila de la idea para el hogar.
textoCantidad(q,unit){
  if(unit==="g")return (q>=1000?Number((q/1000).toFixed(2)).toLocaleString("es-AR")+" kg":Math.round(q/5)*5+" g").replace(/^0 g$/,"5 g");
  if(unit==="unidad")return q===0.5?"½ unidad":Number(q.toFixed(2)).toLocaleString("es-AR")+(q===1?" unidad":" unidades");
  return Number(q.toFixed(2)).toLocaleString("es-AR")+" "+unit
},
ideaComoComida(idea,dia){
  // Etapa 29: una idea de desayuno o merienda arma un estado de desayuno con su fruta, su proteína y su cereal.
  if(idea&&idea.desayuno){
    const st=JSON.parse(JSON.stringify(state));
    Object.assign(st,{type:"desayuno",day:"",fruta:null,bfprot:null,bfcarb:null,grasa:null,pre:null,snack:null,verduras:[],almidones:[],proteinas:[],legCarb:[],legProt:[],replaceCarb:false,replaceProt:false,customPortions:null});
    const d=idea.desayuno,cant=n=>{const f=(idea.cantidades||[]).find(c=>ingredientKey(c[0])===ingredientKey(n));return f?IdeasHoja.textoCantidad(f[1],f[2]):"1 porción"};
    if(d.fruta)st.fruta={name:d.fruta,quantity:cant(d.fruta),forma:"Entera"};
    if(d.prot)st.bfprot={name:d.prot,quantity:cant(d.prot)};
    if(d.cereal)st.bfcarb={name:d.cereal,quantity:cant(d.cereal)};
    return st
  }
  const st={
    type:"plato",day:dia||diaDeRutina(new Date())||"Día libre",fruta:null,bfprot:null,bfcarb:null,grasa:null,pre:null,snack:null,verduras:[],almidones:[],proteinas:[],legCarb:[],legProt:[],replaceCarb:false,replaceProt:false,customPortions:null,nombreSugerido:""
  };
  for(const k of SUGERENCIA_GRUPOS)st[k]=((idea.ingredientes||{})[k]||[]).map(name=>({
    name
  }));
  st.replaceCarb=!st.almidones.length&&st.legCarb.length>0;
  st.replaceProt=!st.proteinas.length&&st.legProt.length>0;
  return st
},
ideaComoGuardada(idea,dia){
  const antes=JSON.parse(JSON.stringify(state));
  let snap;
  try{
    Object.assign(state,IdeasHoja.ideaComoComida(idea,dia));
    snap=MisPlatos.currentSnapshot()
  }finally{
    Object.assign(state,antes)
  }
  snap.note=idea.text.slice(0,80);
  return snap
},
guardarIdea(idea,dia){
  const a=MisPlatos.loadSaved(),snap=IdeasHoja.ideaComoGuardada(idea,dia),igual=a.find(x=>(x.sig||x.text)===snap.sig);
  if(igual)return {
    item:igual,nueva:false
  };
  a.unshift(snap);
  if(!MisPlatos.persistSaved(a))throw Error("No se pudo guardar (falta de espacio u otro error).");
  return {
    item:snap,nueva:true
  }
},
agregarIdeaALaSemana(idea,dayKey,slot){
  if(!DAYS.some(d=>d[0]===dayKey)||!["almuerzo","cena"].includes(slot))throw Error("Elegí un día y una comida.");
  const dia=diaDeRutina(fechaDelDiaDelPlan(dayKey))||"Día libre",{
    item
  }=IdeasHoja.guardarIdea(idea,dia),antes=(loadPlan()[dayKey]||{})[slot]||null;
  setSlot(dayKey,slot,item.id);
  const texto="Agregada al "+Semana.planSlotName(slot).toLowerCase()+" del "+Semana.planDayName(dayKey).toLowerCase()+".";
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
},
ideaPorTexto(texto){
  return data.menuCatalog.find(x=>x.text===texto)||(data.desayunoCatalog||[]).find(x=>x.text===texto)||null
},
abrirIdea(idea){
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
    titulo:idea.text,contenido:[lleva,fila],botones:[["Agregar a la semana","button--primary",()=>IdeasHoja.agregarIdeaALaSemana(idea,document.getElementById("hojaIdeaDia").value,document.getElementById("hojaIdeaComida").value)],["Guardar","button--soft",()=>{
      const r=IdeasHoja.guardarIdea(idea);hoja.estado.textContent=r.nueva?"Guardada en Comidas.":"Ya estaba en Comidas."
    }]]
  })
}
};
const hoja=(()=>{
  const fondo=ce("div","hoja-fondo"),caja=ce("section","hoja"),titulo=ce("h2","hoja__titulo"),cuerpo=ce("div","hoja__cuerpo"),acciones=ce("div","hoja__acciones"),estado=ce("p","screen__hint hoja__estado");
  fondo.hidden=true;
  caja.setAttribute("role","dialog");
  caja.setAttribute("aria-modal","true");
  caja.tabIndex=-1;
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
  // foco:false deja el foco en la hoja (no en el primer campo), así no se abre el teclado sin pedirlo.
  function abrir({
    titulo:t,contenido,botones,foco
  }){
    if(fondo.hidden)volver=document.activeElement;
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
    caja.scrollTop=0;
    const primero=foco===false?caja:caja.querySelector("input,select,button");
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
    const guardada=MisPlatos.savePlate(nombre);
    // Armado desde un hueco de la Semana: se asigna ahí (también si ya estaba guardada igual) y se vuelve.
    if(guardada&&armadoDestino&&armadoDestino.tab===activeTab)asignarArmadoAlHueco(guardada)
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
// Guarda la idea en Mis comidas (si ya estaba igual, usa la guardada).
// Agregar a la semana: guarda la idea con el día de la rutina de ese día y la asigna con setSlot (historial y
// porciones como siempre). Si reemplaza algo, se puede deshacer.
// Detalle de una idea: qué lleva, Guardar y Agregar a la semana (día y comida).
document.addEventListener("click",e=>{
  const b=e.target.closest&&e.target.closest("[data-idea-open]");
  if(b)IdeasHoja.abrirIdea(IdeasHoja.ideaPorTexto(b.dataset.ideaOpen))
});
