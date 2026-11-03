// Mi Plato Fácil · Sugerencias: "Sugerir al azar" y "Plato del día" eligen comidas reales.
// Parte 37: los archivos se unen en orden según su número, que define el orden de arranque.
// Almuerzo y cena salen del catálogo de ideas (con sus ingredientes vinculados) y de tus comidas guardadas: nunca
// se combinan ingredientes sueltos. Se descarta lo que tiene algo que preferís evitar, con rutina se respeta el tipo
// de día y se da más chance a lo que usa tu despensa. Desayuno y merienda combinan las opciones del armado.
const SUGERENCIA_GRUPOS=["verduras","almidones","proteinas","legCarb","legProt"];
// Palabras a evitar de "Preferencias de recetas", solo si están activadas.
function preferenciasEvitar(){
  try{
    const p=JSON.parse(localStorage.getItem("miPlatoFacil_recipePreferences_v1")||"{}")||{};
    if(p.enabled!==true||typeof p.words!=="string")return [];
    return [...new Set(p.words.split(",").map(x=>normalizeSearchText(x)).filter(x=>x.length>=2))].slice(0,30)
  }catch(e){
    return []
  }
}
function ideaIngredientes(idea){
  const i=idea&&idea.ingredientes;
  return i?SUGERENCIA_GRUPOS.flatMap(k=>Array.isArray(i[k])?i[k]:[]):[]
}
function estadoConGrupos(st){
  return !!st&&typeof st==="object"&&SUGERENCIA_GRUPOS.some(k=>Array.isArray(st[k])&&st[k].some(o=>o&&typeof o.name==="string"&&o.name))
}
// Candidatas de almuerzo o cena: {tipo:"idea", idea} o {tipo:"mia", item}, cada una con su peso.
// dia: "Día de entrenamiento" o "Día libre" si la rutina lo sabe (tus comidas del otro tipo de día no salen).
function sugerenciasPara(comida,dia){
  const evitar=preferenciasEvitar(),tengo=pantryMarkedMatcher(),stock=Object.values(loadStockQuantities()).filter(s=>s.quantity>0).map(s=>ingredientKey(s.name));
  const enDespensa=n=>tengo.has(n)||stock.includes(ingredientKey(n));
  const evitada=texto=>{
    const t=normalizeSearchText(texto);return evitar.some(w=>t.includes(w))
  };
  const out=[];
  if(comida!=="almuerzo"&&comida!=="cena"&&comida!=="plato")return out;
  for(const idea of data.menuCatalog){
    const ings=ideaIngredientes(idea);
    if(!ings.length||evitada(idea.text+" "+(idea.tags||[]).join(" ")+" "+ings.join(" ")))continue;
    out.push({
      tipo:"idea",idea,peso:1+ings.filter(enDespensa).length
    })
  }
  for(const item of loadSaved()){
    if(!item||item.type!=="plato"||item.recipeSourceId||!estadoConGrupos(item.state))continue;
    if(dia&&typeof item.state.day==="string"&&item.state.day&&item.state.day!==dia)continue;
    let ings=[];
    try{
      ings=extractIngredients(item)
    }catch(e){
    }
    if(evitada(mealName(item)+" "+ings.join(" ")))continue;
    out.push({
      tipo:"mia",item,peso:1+ings.filter(enDespensa).length
    })
  }
  return out
}
// Elige una candidata con un azar (Math.random o uno con semilla); más chances para las que usan tu despensa.
function elegirSugerencia(comida,azar,dia){
  const c=sugerenciasPara(comida,dia===undefined?diaDeRutina(new Date()):dia),total=c.reduce((t,x)=>t+x.peso,0);
  if(!total)return null;
  let r=(azar||Math.random)()*total;
  for(const x of c){
    r-=x.peso;
    if(r<0)return x
  }
  return c[c.length-1]
}
// Carga la sugerencia en el armado para verla en el resumen (se puede cambiar o guardar con su nombre).
function cargarSugerencia(s,dia){
  resetForRandom("plato");
  const st=s.tipo==="idea"?{
    ...s.idea.ingredientes
  }:s.item.state;
  for(const k of SUGERENCIA_GRUPOS)state[k]=(Array.isArray(st[k])?st[k]:[]).filter(o=>typeof o==="string"||o&&typeof o.name==="string").map(o=>({
    name:typeof o==="string"?o:o.name
  }));
  state.day=dia||(s.tipo==="mia"&&(s.item.state.day==="Día de entrenamiento"||s.item.state.day==="Día libre")?s.item.state.day:"Día libre");
  state.nombreSugerido=s.tipo==="idea"?s.idea.text:mealName(s.item);
  setReplace("carb",!state.almidones.length&&state.legCarb.length>0);
  setReplace("prot",!state.proteinas.length&&state.legProt.length>0);
  syncMultiSelection();
  updatePlate()
}
function avisoSinSugerencias(){
  return preferenciasEvitar().length?"No hay ideas que no tengan lo que evitás. Revisá tus preferencias de recetas.":"No hay ideas para sugerir."
}
