// Mi Plato Fácil · Asistente de IA: solo con una clave de Gemini guardada (sin clave no aparece ningún botón de IA).
// Parte 30: los archivos se unen en orden según su número, que define el orden de arranque.
// Funciones de este archivo, agrupadas (Etapa 18). El resto de la app las llama como AsistenteIA.nombre().
var AsistenteIA={
saveAiSettings(s){
  localStorage.setItem("miPlatoFacil_aiSettings_v1",JSON.stringify({
    key:s.key,model:s.model
  }))
},
aiParseJson(text){
  const t=String(text||"").trim().slice(0,100000);
  if(!t)throw Error("Pegá la respuesta de la IA.");
  const tries=[t],fence=t.match(/`{3}(?:json)?\s*([\s\S]*?)`{3}/i);
  if(fence)tries.push(fence[1]);
  const a=t.indexOf("{"),b=t.lastIndexOf("}");
  if(a>=0&&b>a)tries.push(t.slice(a,b+1));
  for(const s of tries){
    try{
      const o=JSON.parse(s);
      if(o&&typeof o==="object")return o
    }catch(e){
    }
  }
  throw Error("No se encontró una respuesta con el formato pedido. Pedile a tu IA que responda solo con el JSON del pedido.")
},
aiAvailableIngredients(){
  const out=new Map(),add=(name,label)=>{
    const k=ingredientKey(name);
    if(k&&!out.has(k)&&out.size<60)out.set(k,label)
  };
  for(const id of loadPantry()){
    const p=pantryById(id);
    if(p)add(p[1].replace(/^[^\p{L}]+/u,"").trim(),p[1].replace(/^[^\p{L}]+/u,"").trim());
    else if(id.trim())add(id,id.trim())
  }
  for(const s of Object.values(loadStockQuantities()))if(s&&s.quantity>0)add(s.name,s.name+" ("+String(s.quantity).replace(".",",")+" "+s.unit+")");
  return [...out.values()]
},
aiPrompt(kind){
  if(kind==="recipe"){
    const t=document.getElementById("aiRecipeText").value.trim();
    if(t.length<20)throw Error("Pegá primero el texto de la receta (al menos un par de renglones).");
    return "Sos un asistente de cocina. Convertí la receta que está entre <<< y >>> en un JSON con exactamente este formato y respondé solo con el JSON, sin texto adicional:\n{\"titulo\":\"…\",\"porciones\":4,\"minutos\":30,\"etiquetas\":[\"…\"],\"ingredientes\":[{\"nombre\":\"…\",\"cantidad\":200,\"unidad\":\"g\"}],\"pasos\":[\"…\"]}\n"+AI_FORMAT_RULES+" \"porciones\": cuántas porciones rinde según el texto, o null si no lo dice. \"minutos\": tiempo total aproximado, o null.\n<<<\n"+t.slice(0,8000)+"\n>>>"
  }
  const have=AsistenteIA.aiAvailableIngredients();
  if(!have.length)throw Error("Primero marcá ingredientes en tu despensa o cargá existencias, así la IA sabe qué tenés.");
  const extra=document.getElementById("aiIdeasExtra").value.trim().slice(0,200),avoidBox=document.getElementById("recipeAvoidWords"),avoid=avoidBox?avoidBox.value.trim().slice(0,300):"";
  return "Sos un asistente de cocina casera y saludable. Proponé 3 comidas distintas y simples usando principalmente estos ingredientes que tengo: "+have.join(", ")+".\nSeguí el método del plato: la mitad del plato verduras, un cuarto almidones o cereales y un cuarto proteínas. Podés sumar básicos de alacena (aceite, sal, especias, ajo, cebolla) si hace falta."+(extra?"\nTené en cuenta: "+extra+".":"")+(avoid?"\nEvitá: "+avoid+".":"")+"\nRespondé solo con un JSON con exactamente este formato, sin texto adicional:\n{\"ideas\":[{\"titulo\":\"…\",\"porque\":\"frase corta\",\"porciones\":2,\"minutos\":30,\"etiquetas\":[\"…\"],\"ingredientes\":[{\"nombre\":\"…\",\"cantidad\":200,\"unidad\":\"g\"}],\"pasos\":[\"…\"]}]}\n"+AI_FORMAT_RULES
},
geminiError(status,msg){
  if(status===400&&/api key/i.test(msg))return "La clave de Gemini no es válida.";
  if(status===401||status===403)return "La clave no tiene permiso para usar Gemini (revisala en Google AI Studio).";
  if(status===404)return "Ese modelo de Gemini no está disponible para tu clave.";
  if(status===429)return "Se alcanzó el límite gratuito de Gemini por ahora. Probá más tarde.";
  if(status>=500)return "Gemini no está respondiendo ahora (error "+status+"). Probá más tarde.";
  return "Gemini respondió con un error ("+status+")."
},
async geminiFetch(url,opts,espera){
  const ctrl=new AbortController(),t=setTimeout(()=>ctrl.abort(),espera||45000);
  let r;
  try{
    r=await fetch(url,Object.assign({
    },opts,{
      signal:ctrl.signal
    }))
  }catch(e){
    const err=Error(e&&e.name==="AbortError"?"Gemini tardó demasiado en responder.":"No se pudo conectar con Gemini. Revisá tu conexión.");
    if(e&&e.name==="AbortError")err.tiempo=true;
    throw err
  }finally{
    clearTimeout(t)
  }
  const j=await r.json().catch(()=>null);
  if(!r.ok){
    const err=Error(AsistenteIA.geminiError(r.status,j&&j.error&&j.error.message||""));
    err.status=r.status;
    throw err
  }
  return j
},
geminiPickModel(list,excluir){
  const fuera=Array.isArray(excluir)?excluir:[];
  const ok=(Array.isArray(list)?list:[]).filter(m=>m&&Array.isArray(m.supportedGenerationMethods)&&m.supportedGenerationMethods.includes("generateContent")).map(m=>String(m.name||"").replace(/^models\//,"")).filter(n=>!fuera.includes(n));
  if(ok.includes("gemini-flash-latest"))return "gemini-flash-latest";
  const flash=ok.filter(n=>/^gemini-\d+(\.\d+)?-flash$/.test(n)).sort((a,b)=>parseFloat(b.slice(7))-parseFloat(a.slice(7)));
  return flash[0]||ok.find(n=>/flash/.test(n)&&!/(image|tts|audio|live|exp|preview|thinking|embedding)/.test(n))||null
},
async geminiChooseModel(key){
  const j=await AsistenteIA.geminiFetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200",{
    headers:{
      "x-goog-api-key":key
    }
  }),m=AsistenteIA.geminiPickModel(j&&j.models);
  if(!m)throw Error("La clave funciona, pero no se encontró un modelo Gemini Flash disponible.");
  return m
},
// v19.10.3: con la cuenta gratuita, el modelo más nuevo (gemini-flash-latest) a veces está sobrecargado (503), llega al límite
// gratuito (429) o tarda más de la cuenta. Cada modelo tiene su propio límite, así que en esos casos se prueba con otros
// modelos Flash y Flash-Lite de la cuenta (uno por vez, sin repetir pedidos de más) y el que anda queda guardado.
esperaReintento:1500,
esperaRespuesta:90000,
// Etapa 52: "imagen" (opcional) = {mimeType, data (base64)}: la foto de un ticket va junto con el texto.
async geminiPedir(key,model,prompt,json,imagen){
  const config={temperature:0.4},partes=[{
    text:prompt
  }];
  if(imagen)partes.push({
    inlineData:{
      mimeType:imagen.mimeType,data:imagen.data
    }
  });
  if(json)config.responseMimeType="application/json";
  const j=await AsistenteIA.geminiFetch("https://generativelanguage.googleapis.com/v1beta/models/"+encodeURIComponent(model||"gemini-flash-latest")+":generateContent",{
    method:"POST",headers:{
      "Content-Type":"application/json","x-goog-api-key":key
    },body:JSON.stringify({
      contents:[{
        role:"user",parts:partes
      }],generationConfig:config
    })
  },AsistenteIA.esperaRespuesta),c=j&&Array.isArray(j.candidates)&&j.candidates[0],text=c&&c.content&&Array.isArray(c.content.parts)?c.content.parts.map(p=>typeof p.text==="string"&&!p.thought?p.text:"").join(""):"";
  if(!text){
    const err=Error("Gemini no devolvió una respuesta. Probá de nuevo.");
    err.vacia=true;
    throw err
  }
  return text
},
// Otros modelos para probar, en orden: Flash-Lite y Flash con número de versión (del más nuevo al más viejo), sin vistas previas
// ni modelos especiales, y sin los que ya fallaron.
geminiAlternativas(list,excluir){
  const fuera=new Set(excluir||[]),ver=n=>parseFloat((n.match(/^gemini-(\d+(?:\.\d+)?)/)||[])[1])||0;
  const ok=(Array.isArray(list)?list:[]).filter(m=>m&&Array.isArray(m.supportedGenerationMethods)&&m.supportedGenerationMethods.includes("generateContent")).map(m=>String(m.name||"").replace(/^models\//,"")).filter(n=>n&&!fuera.has(n)&&!/(image|tts|audio|live|exp|preview|thinking|embedding|latest)/.test(n));
  const lite=ok.filter(n=>/^gemini-\d+(\.\d+)?-flash-lite$/.test(n)).sort((a,b)=>ver(b)-ver(a));
  const flash=ok.filter(n=>/^gemini-\d+(\.\d+)?-flash$/.test(n)).sort((a,b)=>ver(b)-ver(a));
  return lite.concat(flash)
},
async geminiGenerate(prompt,imagen){
  const s=loadAiSettings();
  if(!s.key)throw Error("Configurá tu clave de Gemini en Más → Asistente de IA.");
  const actual=s.model||"gemini-flash-latest",pausa=ms=>new Promise(r=>setTimeout(r,ms));
  // Vale la pena probar otro modelo si el error es del modelo (sobrecargado, límite, demora o respuesta vacía), no de la clave ni de la conexión.
  // v19.10.4: un 404 (ese modelo no existe o no está habilitado para tu clave) también pasa al siguiente modelo.
  const otroModelo=e=>!!e&&(e.status>=500||e.status===429||e.status===404||e.tiempo===true||e.vacia===true);
  const errores=[];
  try{
    return await AsistenteIA.geminiPedir(s.key,actual,prompt,true,imagen)
  }catch(e){
    if(!otroModelo(e))throw e;
    errores.push(e)
  }
  // Sobrecargado o sin texto: un solo reintento con el mismo modelo, sin pedir JSON estricto.
  if(errores[0].status>=500||errores[0].vacia){
    await pausa(AsistenteIA.esperaReintento);
    try{
      return await AsistenteIA.geminiPedir(s.key,actual,prompt,false,imagen)
    }catch(e){
      if(!otroModelo(e))throw e;
      errores.push(e)
    }
  }
  let alternativas=[];
  try{
    const lista=await AsistenteIA.geminiFetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200",{
      headers:{"x-goog-api-key":s.key}
    },20000);
    alternativas=AsistenteIA.geminiAlternativas(lista&&lista.models,[actual]).slice(0,4);
    // Si el guardado no era el alias y no existe más, el alias "latest" (que Google mantiene apuntando a un Flash vigente) va primero.
    if(errores.some(e=>e.status===404)&&actual!=="gemini-flash-latest"&&(lista&&Array.isArray(lista.models)?lista.models:[]).some(m=>m&&/gemini-flash-latest$/.test(String(m.name||""))))alternativas.unshift("gemini-flash-latest")
  }catch(e){
    errores.push(e)
  }
  for(const otro of alternativas){
    try{
      const text=await AsistenteIA.geminiPedir(s.key,otro,prompt,true,imagen);
      AsistenteIA.saveAiSettings({key:s.key,model:otro});
      return text
    }catch(e){
      if(!otroModelo(e))throw e;
      errores.push(e)
    }
  }
  // Si el modelo guardado no existe más y ninguno anduvo, se vuelve al alias para que el próximo intento arranque de cero.
  if(errores[0]&&errores[0].status===404&&actual!=="gemini-flash-latest")AsistenteIA.saveAiSettings({key:s.key,model:"gemini-flash-latest"});
  if(errores.length&&errores.every(e=>e.status===404))throw Error("No encontré un modelo de Gemini disponible para tu clave. Revisá en Google AI Studio que la clave tenga acceso a la API de Gemini.");
  if(errores.some(e=>e.status===429))throw Error("Se alcanzó el límite gratuito de Gemini en los modelos de tu cuenta. Probá en un rato: el límite por minuto se libera enseguida y el diario se renueva a la medianoche de EE. UU. (5 de la mañana en Argentina).");
  if(errores.some(e=>e.status>=500))throw Error("Gemini está sobrecargado ahora (probé "+(1+alternativas.length)+(alternativas.length?" modelos":" modelo")+"). Probá en unos minutos.");
  throw errores[errores.length-1]||Error("Gemini no está respondiendo ahora. Probá más tarde.")
},
recipeEditorHasContent(){
  return !!(recipeDetailsEditing||["recipeDetailsTitle","recipeDetailsSteps","recipeDetailsNotes","recipeTags","recipeMinutes","recipeSubstitutions"].some(id=>document.getElementById(id).value.trim())||[...document.querySelectorAll("#recipeIngredientRows [data-amount-name]")].some(i=>i.value.trim()))
},
fillRecipeEditorFromAi(r){
  if(AsistenteIA.recipeEditorHasContent()&&!window.confirm("Esto reemplaza lo que está en el editor por la propuesta de la IA (tus recetas guardadas no cambian). ¿Continuar?"))return false;
  resetRecipeDetailsForm();
  document.getElementById("recipeDetailsTitle").value=r.titulo;
  document.getElementById("recipeYield").value=String(r.porciones||1);
  const box=document.getElementById("recipeIngredientRows");
  box.replaceChildren();
  r.ingredientes.slice(0,200).forEach(x=>appendRecipeAmountRow({
    name:x.nombre,quantity:x.cantidad,unit:x.unidad||"g"
  },box));
  document.getElementById("recipeDetailsSteps").value=r.pasos.join("\n");
  document.getElementById("recipeTags").value=r.etiquetas.join(", ");
  document.getElementById("recipeMinutes").value=r.minutos?String(r.minutos):"";
  showRecipeView("editor");
  recipeDetailsStatus("La IA armó un borrador: revisá ingredientes, cantidades"+(r.porciones?"":", porciones")+" y pasos antes de guardar. Todavía no se guardó nada.");
  document.getElementById("recipeDetailsTitle").focus();
  return true
},
renderAiIdeas(ideas){
  const box=document.getElementById("aiIdeasResults");
  box.replaceChildren();
  ideas.forEach(r=>{
    const card=ce("article","ai-idea"),meta=[r.minutos?r.minutos+" min":"",r.porciones?r.porciones+" porciones":""].filter(Boolean).join(" · "),use=ce("button","button button--soft","Usar como receta");use.type="button";use.addEventListener("click",()=>AsistenteIA.fillRecipeEditorFromAi(r));card.append(ce("h4",null,r.titulo));if(r.porque)card.append(ce("p",null,r.porque));if(meta)card.append(ce("p","screen__hint",meta));if(r.ingredientes.length)card.append(ce("p","screen__hint","Ingredientes: "+r.ingredientes.map(x=>x.nombre).join(", ")));card.append(use);box.append(card)
  })
},
handleAiAnswer(kind,text){
  const o=AsistenteIA.aiParseJson(text);
  if(kind==="recipe"){
    // Si Gemini no pone título, se usa el primer renglón del texto pegado.
    const primer=(document.getElementById("aiRecipeText").value||"").split(/\n/).map(x=>x.trim()).find(Boolean)||"",n=aiNormalizarReceta(o,primer.slice(0,80)),r=aiRecipeFromJson(n);
    if(!r)throw Error(n&&n.titulo?"La respuesta de Gemini no trae ingredientes ni pasos. Probá de nuevo o revisá que el texto pegado sea una receta.":"La respuesta no tiene una receta válida (falta el título o los ingredientes).");
    return AsistenteIA.fillRecipeEditorFromAi(r)?"Borrador cargado en el editor: revisalo y guardalo si está bien.":"No se cambió nada."
  }
  const lista=Array.isArray(o)?o:Array.isArray(aiCampo(o,["ideas","recetas","recipes","comidas","platos"]))?aiCampo(o,["ideas","recetas","recipes","comidas","platos"]):[];
  const ideas=lista.map(x=>aiRecipeFromJson(aiNormalizarReceta(x,""))).filter(Boolean).slice(0,5);
  if(!ideas.length)throw Error("La respuesta no trae ideas válidas.");
  AsistenteIA.renderAiIdeas(ideas);
  return ideas.length+" idea"+(ideas.length===1?"":"s")+" lista"+(ideas.length===1?"":"s")+": elegí una para verla como receta."
},
renderAllAiRunners(){
  document.querySelectorAll(".ai-runner").forEach(renderAiRunner);
  AsistenteIA.pintarVisibilidadIA()
},
// Sin clave de Gemini guardada no se ve ningún botón ni sección de IA (A-01); con clave, se ven los que llevan data-solo-con-clave.
pintarVisibilidadIA(){
  const hay=!!loadAiSettings().key;
  document.querySelectorAll("[data-solo-con-clave]").forEach(e=>{
    e.hidden=!hay;
    if(!hay&&e.dataset.abrePanel){
      e.setAttribute("aria-expanded","false");
      const panel=document.getElementById(e.dataset.abrePanel);
      if(panel)panel.hidden=true
    }
  })
},
pintarIdeasConLoQueTengo(){
  const have=AsistenteIA.aiAvailableIngredients();
  document.getElementById("aiIdeasHave").textContent=have.length?"Vas a usar: "+have.join(", ")+".":"Todavía no marcaste ingredientes en tu despensa ni cargaste existencias."
},
renderAiSettings(){
  const s=loadAiSettings(),inp=document.getElementById("aiKeyInput");
  inp.placeholder=s.key?"Clave guardada (termina en "+s.key.slice(-4)+"). Pegá otra para cambiarla":"Pegá la clave";
  document.getElementById("aiKeyDelete").hidden=!s.key
}
};
function loadAiSettings(){
  try{
    const o=JSON.parse(localStorage.getItem("miPlatoFacil_aiSettings_v1")||"{}");
    if(!o||typeof o!=="object"||Array.isArray(o))return {
      key:"",model:""
    };
    return {
      key:typeof o.key==="string"&&/^[A-Za-z0-9_.\-]{20,300}$/.test(o.key)?o.key:"",model:typeof o.model==="string"&&/^[a-z0-9][a-z0-9.\-]{2,79}$/.test(o.model)?o.model:""
    }
  }catch(e){
    return {
      key:"",model:""
    }
  }
}
function aiCleanText(v,max){
  return typeof v==="string"?v.replace(/[\u0000-\u001f\u007f]+/g," ").replace(/\s+/g," ").trim().slice(0,max):""
}
// v19.10.5: Gemini no siempre respeta las claves pedidas. Antes de validar, se pasa la respuesta a la forma pedida:
// claves en inglés o con tilde (title, título, ingredients, steps, preparación…), ingredientes como texto ("200 g de harina"),
// cantidades como texto ("1/2", "200"), unidades escritas de otra forma (gr, gramos, cda…) y pasos como objetos o como un solo texto.
function aiSinTilde(v){
  return String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim()
}
function aiCampo(o,nombres){
  if(!o||typeof o!=="object")return undefined;
  const claves=Object.keys(o);
  for(const n of nombres){
    const k=claves.find(c=>aiSinTilde(c).replace(/[\s_-]+/g,"")===n);
    if(k!==undefined&&o[k]!==null&&o[k]!==undefined&&o[k]!=="")return o[k]
  }
  return undefined
}
function aiNumero(v){
  if(typeof v==="number")return Number.isFinite(v)?v:null;
  const t=String(v==null?"":v).trim().replace(",",".");
  let m=t.match(/^(\d+)\s+(\d+)\/(\d+)/);
  if(m)return Number(m[1])+Number(m[2])/Number(m[3]);
  m=t.match(/^(\d+)\/(\d+)/);
  if(m)return Number(m[1])/Number(m[2]);
  m=t.match(/^\d+(\.\d+)?/);
  return m?Number(m[0]):null
}
function aiUnidad(v){
  const u=aiSinTilde(v).replace(/\.$/,"");
  if(!u)return null;
  const tabla={g:"g",gr:"g",grs:"g",gramo:"g",gramos:"g",kg:"kg",kgs:"kg",kilo:"kg",kilos:"kg",kilogramo:"kg",kilogramos:"kg",ml:"ml",mililitro:"ml",mililitros:"ml",cc:"ml",l:"l",lt:"l",lts:"l",litro:"l",litros:"l",unidad:"unidad",unidades:"unidad",u:"unidad",un:"unidad",una:"unidad",cucharada:"cucharada",cucharadas:"cucharada",cda:"cucharada",cdas:"cucharada",cucharadita:"cucharadita",cucharaditas:"cucharadita",cdita:"cucharadita",cditas:"cucharadita",taza:"taza",tazas:"taza"};
  return tabla[u]||null
}
function aiIngrediente(x){
  if(typeof x==="string"){
    const t=x.replace(/^[-•*\s]+/,"").trim();
    const m=t.match(/^(\d+(?:[.,]\d+)?(?:\s+\d+\/\d+)?|\d+\/\d+)\s*([a-zA-ZáéíóúÁÉÍÓÚ.]+)?\s+(?:de\s+)?(.+)$/);
    if(m){
      const unidad=aiUnidad(m[2]);
      return {nombre:unidad?m[3]:(m[2]?m[2]+" ":"")+m[3],cantidad:aiNumero(m[1]),unidad:unidad||(m[2]?null:"unidad")}
    }
    return {nombre:t,cantidad:null,unidad:null}
  }
  if(!x||typeof x!=="object")return null;
  const nombre=aiCampo(x,["nombre","name","ingrediente","ingredient","item","producto"]);
  const cantidad=aiCampo(x,["cantidad","amount","quantity","qty","cant"]);
  const unidad=aiCampo(x,["unidad","unit","units","medida"]);
  return {nombre:typeof nombre==="string"?nombre:"",cantidad:cantidad==null?null:aiNumero(cantidad),unidad:aiUnidad(unidad)}
}
function aiPaso(x){
  if(typeof x==="string")return x.replace(/^\s*(\d+[.)-]|paso\s*\d+[:.)-]?)\s*/i,"");
  const t=aiCampo(x,["texto","text","descripcion","description","instruccion","instruction","paso","step","detalle"]);
  return typeof t==="string"?t:""
}
function aiNormalizarReceta(o,tituloPorDefecto){
  if(Array.isArray(o))o=o[0];
  if(!o||typeof o!=="object")return null;
  const dentro=aiCampo(o,["receta","recipe","data","resultado"]);
  if(dentro&&typeof dentro==="object"&&!Array.isArray(dentro))o=dentro;
  let titulo=aiCampo(o,["titulo","title","nombre","name","nombrereceta","recipename","plato"]);
  if(typeof titulo!=="string"||!titulo.trim())titulo=tituloPorDefecto||"";
  let ing=aiCampo(o,["ingredientes","ingredients","listaingredientes"]);
  if(typeof ing==="string")ing=ing.split(/\n|;/);
  let pasos=aiCampo(o,["pasos","steps","instrucciones","instructions","preparacion","procedimiento","metodo"]);
  if(typeof pasos==="string")pasos=pasos.split(/\n+|(?=\b\d+[.)]\s)/);
  const minutos=aiNumero(aiCampo(o,["minutos","tiempo","tiempototal","time","totaltime","minutes"]));
  const porciones=aiNumero(aiCampo(o,["porciones","servings","rinde","raciones"]));
  let etiquetas=aiCampo(o,["etiquetas","tags"]);
  if(typeof etiquetas==="string")etiquetas=etiquetas.split(/,/);
  return {
    titulo,porciones,minutos:minutos?Math.round(minutos):null,etiquetas:Array.isArray(etiquetas)?etiquetas:[],
    ingredientes:(Array.isArray(ing)?ing:[]).map(aiIngrediente).filter(Boolean),
    pasos:(Array.isArray(pasos)?pasos:[]).map(aiPaso),
    porque:aiCampo(o,["porque","motivo","why","reason"])
  }
}
function aiRecipeFromJson(o){
  if(!o||typeof o!=="object"||Array.isArray(o))return null;
  const titulo=aiCleanText(o.titulo,100);
  if(!titulo)return null;
  const p=Math.round(Number(o.porciones)),porciones=p>=1&&p<=50?p:null,minutos=Number.isInteger(o.minutos)&&o.minutos>0&&o.minutos<=1440?o.minutos:null,etiquetas=(Array.isArray(o.etiquetas)?o.etiquetas:[]).map(t=>aiCleanText(t,30)).filter(Boolean).slice(0,5),ingredientes=(Array.isArray(o.ingredientes)?o.ingredientes:[]).slice(0,60).map(x=>{
    const nombre=aiCleanText(x&&x.nombre,100);if(!nombre)return null;const unidad=RECIPE_AMOUNT_UNITS.includes(x.unidad)?x.unidad:null;let cantidad=typeof x.cantidad==="number"&&Number.isFinite(x.cantidad)&&x.cantidad>0&&x.cantidad<=100000?Math.round(x.cantidad*1000)/1000:null;if(!unidad)cantidad=null;return {
      nombre,cantidad,unidad
    }
  }).filter(Boolean),pasos=(Array.isArray(o.pasos)?o.pasos:[]).map(t=>aiCleanText(t,500)).filter(Boolean).slice(0,40);
  if(!ingredientes.length&&!pasos.length)return null;
  return {
    titulo,porciones,minutos,etiquetas,ingredientes,pasos,porque:aiCleanText(o.porque,200)
  }
}
var AI_FORMAT_RULES="Reglas: \"unidad\" debe ser una de g, kg, ml, l, unidad, cucharada, cucharadita, taza; si no corresponde ninguna o no se sabe, usá null. \"cantidad\" es un número (1/2 → 0.5) o null si no se sabe. No inventes ingredientes ni cantidades. Usá nombres de ingredientes en español de Argentina (papa, palta, morrón, choclo, zapallo, porotos), en singular cuando se pueda. Un paso por elemento de \"pasos\", en orden. \"etiquetas\": hasta 5 palabras cortas (por ejemplo vegetariana, horno, rápida).";
function renderAiRunner(box){
  const s=loadAiSettings(),actions=ce("div","summary-actions"),st=ce("p","screen__hint");
  box.replaceChildren();
  if(!s.key)return;
  const b=ce("button","button button--primary","✨ Pedir a Gemini");
  b.type="button";
  b.setAttribute("data-ai-gemini","");
  actions.append(b);
  st.setAttribute("aria-live","polite");
  st.setAttribute("data-ai-status","");
  box.append(actions,st)
}
document.addEventListener("click",async e=>{
  const btn=e.target.closest&&e.target.closest(".ai-runner button[data-ai-gemini]");if(!btn)return;const box=btn.closest(".ai-runner"),kind=box.dataset.ai,status=box.querySelector("[data-ai-status]");try{
    const prompt=AsistenteIA.aiPrompt(kind);
    btn.disabled=true;status.textContent="Consultando a Gemini…";try{
      const answer=await AsistenteIA.geminiGenerate(prompt);status.textContent=AsistenteIA.handleAiAnswer(kind,answer)
    }finally{
      btn.disabled=false
    }
  }catch(err){
    status.textContent=err.message
  }
});
// v19.9 (R5-X-08): "Guardar y probar" tiene que contestar siempre. Antes, al pegar la clave con comillas, espacios o saltos de línea (como la
// copia Google AI Studio) la regla la rechazaba con un mensaje al pie que se podía no ver, y mientras probaba no cambiaba nada en el botón.
// Ahora se limpia lo que se pega, el botón dice "Probando…" y el resultado (funcionó o por qué no) aparece arriba del botón, a la vista.
document.getElementById("aiKeySave").addEventListener("click",async e=>{
  const btn=e.currentTarget,st=document.getElementById("aiKeyStatus"),inp=document.getElementById("aiKeyInput");
  const decir=(texto,bien)=>{
    st.textContent=texto;
    st.classList.toggle("is-ok",!!bien);
    st.classList.toggle("is-error",bien===false);
    try{st.scrollIntoView({block:"nearest"})}catch(err){}
  };
  const key=inp.value.replace(/^\s*(?:key\s*[=:]\s*|bearer\s+)/i,"").replace(/[\s"'“”‘’`<>]/g,"");
  if(!key){
    decir("Pegá primero la clave de Gemini en el campo de arriba.",false);
    inp.focus();
    return
  }
  // v19.10.1: Google AI Studio ahora da claves nuevas que empiezan con "AQ." (con punto), además de las viejas "AIza…".
  if(!/^[A-Za-z0-9_.\-]{20,300}$/.test(key)){
    decir("La clave no parece válida: copiala completa desde Google AI Studio (empieza con \"AIza\" o con \"AQ.\" y tiene solo letras, números, puntos, guiones y guiones bajos).",false);
    return
  }
  const textoBoton=btn.textContent;
  btn.disabled=true;
  btn.textContent="Probando…";
  decir("Probando la conexión con Gemini…");
  try{
    const model=await AsistenteIA.geminiChooseModel(key);
    AsistenteIA.saveAiSettings({
      key,model
    });
    inp.value="";
    AsistenteIA.renderAiSettings();
    AsistenteIA.renderAllAiRunners();
    decir("Listo: la conexión con Gemini funciona (modelo "+model+"). La clave quedó guardada solo en este dispositivo.",true)
  }catch(err){
    decir(err.message+" No se guardó la clave.",false)
  }finally{
    btn.disabled=false;
    btn.textContent=textoBoton
  }
});
document.getElementById("aiKeyDelete").addEventListener("click",()=>{
  try{
    localStorage.removeItem("miPlatoFacil_aiSettings_v1")
  }catch(e){
  }AsistenteIA.renderAiSettings();AsistenteIA.renderAllAiRunners();document.getElementById("aiKeyStatus").textContent="Clave borrada de este dispositivo."
});
AsistenteIA.renderAllAiRunners();
AsistenteIA.renderAiSettings();
// Tarjeta en Más (desde la v15.3 está en el HTML): abre la pantalla del asistente.
document.getElementById("aiSettingsOpen").addEventListener("click",()=>go("asistente"));
