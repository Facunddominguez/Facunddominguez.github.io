// Mi Plato Fácil · Comida real: la fruta del desayuno, lo que se compra y el nombre de cada comida.
// Parte 36: los archivos se unen en orden según su número, que define el orden de arranque.
// Lo guardado no se reescribe: los platos viejos se muestran y se compran con los nombres nuevos.
// Solo funciones: los datos están en 01-datos-y-estado.js (data.frutas, data.comprables…), porque algunas de estas
// funciones se usan durante el arranque, antes de que corra este archivo.
function esFormaDeFruta(nombre){
  const n=normalizeSearchText(nombre);
  return data.frutaFormas.concat(data.frutaFormasViejas).some(f=>{
    const g=normalizeSearchText(f);return n===g||n.startsWith(g+" (")
  })
}
// Texto de la fruta elegida: "Banana", "Banana en trozos", "Licuado de banana". Los platos viejos: "Fruta en trozos".
function frutaTexto(o){
  if(!o||!o.name)return "No elegido";
  const viejo=esFormaDeFruta(o.name),fruta=viejo?"Fruta":o.name,forma=viejo?o.name.replace(/\s*\(.*$/,""):(o.forma||"Entera"),f=normalizeSearchText(forma),min=fruta.toLowerCase();
  if(f.startsWith("entera"))return fruta+(viejo?" entera":"");
  if(f.startsWith("en trozos"))return fruta+" en trozos";
  if(f.startsWith("licuado"))return "Licuado de "+min;
  if(f.startsWith("porcion de galletas"))return "Galletas con "+min;
  return forma+" de "+min
}
// Opciones del armado que llevan cantidad: en los platos guardados solo como texto aparecen como "Opción (cantidad)".
function opcionesConCantidad(){
  return new Set([...data.fruit,...data.frutas,...data.bfprot,...data.bfcarb,...data.bffat,...data.snacks].map(x=>x[0]))
}
// Alimentos que se compran para una opción guardada. Nunca devuelve formas ("En trozos") ni opciones dobles ("A | B").
function comprables(nombre){
  let n=String(nombre||"").trim();
  if(!n||n==="No elegido"||n==="No sumo grasa")return [];
  const m=/^(.+?) \(([^()]*)\)$/.exec(n);
  if(m&&opcionesConCantidad().has(m[1]))n=m[1];
  if(Object.prototype.hasOwnProperty.call(data.comprables,n))return data.comprables[n].slice();
  if(esFormaDeFruta(n))return [data.frutaGenerica];
  if(n.indexOf(OCC)===0){
    const p=n.slice(OCC.length).split(",")[0].trim();
    return p?[p.charAt(0).toUpperCase()+p.slice(1)]:[]
  }
  if(n.indexOf(" + ")>0)return n.split(" + ").flatMap(p=>comprables(p.charAt(0).toUpperCase()+p.slice(1)));
  if(n.indexOf(" | ")>0)return [n.split(" | ")[0].trim()];
  return [n]
}
// Nombres que se muestran: los platos viejos se corrigen al mostrarlos.
// Cómo se muestra una opción del armado guardada con su nombre viejo ("Huevo | Clara de huevo" → "Huevos").
function opcionVisible(n){
  return n==="Huevo | Clara de huevo"?"Huevos":String(n||"")
}
function cantidadVisible(q){
  return q==="1 unidad | 2 unidades"?"1 huevo o 2 claras":String(q||"").split(" | ").join(" o ")
}
function textoCorregido(s){
  return String(s||"").split("Huevo | Clara de huevo (1 unidad | 2 unidades)").join("Huevos (1 huevo o 2 claras)").replace(/(([^()|]*) | ([^()|]*))/g,"($1 o $2)").split("Huevo | Clara de huevo").join("Huevos (o 2 claras)").split("Enteras con cáscara o peladas").join("Fruta entera").replace(/^Fruta: (Budín|En trozos|Licuado|Panqueque|Porción de galletas|Tarta|Waffle)\b/,(x,f)=>"Fruta: "+frutaTexto({
    name:f
  }))
}
// Nombre corto de una opción: "Pollo (pechuga, muslo, pata-muslo)" → "Pollo"; "Fideos y pastas (…)" → "Fideos".
function nombreCorto(nombre){
  let n=String(nombre||"").trim();
  if(n.indexOf(OCC)===0){
    n=n.slice(OCC.length).split(",")[0].trim();
    n=n.charAt(0).toUpperCase()+n.slice(1)
  }
  n=n.split(" | ")[0].replace(/\s*\(.*\)\s*$/,"").replace(/^Fideos y pastas.*/,"Fideos").replace(/^Huevo entero de gallina$/,"Huevo").replace(/:.*$/,"");
  return n.replace(/ comprada o casera$| arrollada o instantánea$| fluida o en polvo descremada$| integral o blanco$| natural descremado$/,"").trim()
}
function juntarY(a){
  const b=a.filter(Boolean);
  return b.length<2?b.join(""):b.slice(0,-1).join(", ")+" y "+b[b.length-1]
}
function mayuscula(s){
  return s?s.charAt(0).toUpperCase()+s.slice(1):s
}
function minuscula(s){
  return s&&!/^[A-ZÁÉÍÓÚÑ]{2}/.test(s)?s.charAt(0).toLowerCase()+s.slice(1):s
}
// Nombre de una comida a partir de lo que tiene: "Merluza con papa y tomate", "Banana en trozos con yogur y avena".
function nombreDesdeEstado(st,tipo){
  if(!st||typeof st!=="object")return "";
  const t=tipo||st.type;
  if(t==="desayuno"){
    const fruta=st.fruta&&st.fruta.name?frutaTexto(st.fruta):"",otros=[st.bfprot,st.bfcarb].filter(o=>o&&o.name).map(o=>minuscula(nombreCorto(o.name)));
    if(fruta)return mayuscula(fruta)+(otros.length?" con "+juntarY(otros):"");
    return otros.length?mayuscula(juntarY(otros)):""
  }
  if(t==="plato"){
    const lista=k=>(Array.isArray(st[k])?st[k]:[]).filter(o=>o&&typeof o.name==="string"&&o.name).map(o=>nombreCorto(o.name));
    const prot=lista("proteinas").concat(lista("legProt")),carb=lista("almidones").concat(lista("legCarb")),ver=lista("verduras");
    const principal=prot[0]||carb[0]||ver[0];
    if(!principal)return "";
    const resto=[...(prot[0]?carb.slice(0,1):carb.slice(1,2)),...(ver.length>1?["verduras"]:ver.slice(0,1).filter(v=>v!==principal))].map(minuscula);
    return mayuscula(principal)+(resto.length?" con "+juntarY(resto):"")
  }
  if(t==="snack")return st.snack&&st.snack.name?"Snack: "+minuscula(st.snack.name):"";
  if(t==="pre")return st.pre&&st.pre.name?"Pre-entreno: "+minuscula(st.pre.name):"";
  return ""
}
// Nombre visible de una comida guardada: el que le pusiste, el de la receta o uno automático (sin reescribir nada).
function mealName(it){
  if(!it||typeof it!=="object")return "Comida";
  if(typeof it.note==="string"&&it.note.trim())return it.note.trim();
  const receta=savedRecipeTitle(it);
  if(receta)return receta;
  if(it.recipeSourceId&&it.title)return String(it.title);
  let auto="";
  try{
    auto=nombreDesdeEstado(it.state,it.type);
    if(!auto&&!it.state){
      const ings=[...new Set(extractIngredients(it).map(nombreCorto))].slice(0,3);
      if(ings.length)auto=mayuscula(juntarY(ings.map((x,i)=>i?minuscula(x):x)))
    }
  }catch(e){
  }
  return auto||textoCorregido(it.title||"Comida")
}
// Etiquetas sin repetir para los selectores: si dos comidas se llaman igual se agrega el día ("· día libre") y, si
// siguen iguales, un número. El nombre se acorta antes de agregar lo que las diferencia.
function mealLabels(items){
  const corto=s=>s.length>40?s.slice(0,39).trim()+"…":s;
  const base=new Map(items.map(it=>[it,corto(mealName(it))])),out=new Map(),cuenta=new Map();
  for(const it of items){
    let l=base.get(it);
    const iguales=items.filter(x=>normalizeSearchText(base.get(x))===normalizeSearchText(l)),dia=it.state&&typeof it.state.day==="string"?it.state.day:"";
    if(iguales.length>1&&dia&&new Set(iguales.map(x=>x.state&&x.state.day)).size>1)l+=" · "+dia.toLowerCase();
    const k=normalizeSearchText(l),n=(cuenta.get(k)||0)+1;
    cuenta.set(k,n);
    out.set(it.id,n>1?l+" ("+n+")":l)
  }
  return out
}
// Fecha del día del plan en la semana actual (lunes a domingo), para saber si ese día se entrena.
function fechaDelDiaDelPlan(dayKey){
  const i=DAYS.findIndex(d=>d[0]===dayKey),hoy=new Date(),d=new Date(hoy.getFullYear(),hoy.getMonth(),hoy.getDate(),12);
  if(i<0)return hoy;
  d.setDate(d.getDate()-((d.getDay()+6)%7)+i);
  return d
}
// "Día de entrenamiento" o "Día libre" según la rutina, o "" si no hay rutina para esa fecha.
function diaDeRutina(fecha){
  let t=null;
  try{
    t=trainingDayForDate(fecha||new Date())
  }catch(e){
  }
  return t===null?"":t?"Día de entrenamiento":"Día libre"
}
