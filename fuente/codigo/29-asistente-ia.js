// Mi Plato Fácil · Asistente de IA: con tu app de IA o con Gemini directo.
// Parte 30: los archivos se unen en orden según su número, que define el orden de arranque.
function loadAiSettings(){
  try{
    const o=JSON.parse(localStorage.getItem("miPlatoFacil_aiSettings_v1")||"{}");
    if(!o||typeof o!=="object"||Array.isArray(o))return {
      key:"",model:""
    };
    return {
      key:typeof o.key==="string"&&/^[A-Za-z0-9_\-]{20,200}$/.test(o.key)?o.key:"",model:typeof o.model==="string"&&/^[a-z0-9][a-z0-9.\-]{2,79}$/.test(o.model)?o.model:""
    }
  }catch(e){
    return {
      key:"",model:""
    }
  }
}
function saveAiSettings(s){
  localStorage.setItem("miPlatoFacil_aiSettings_v1",JSON.stringify({
    key:s.key,model:s.model
  }))
}
function aiCleanText(v,max){
  return typeof v==="string"?v.replace(/[\u0000-\u001f\u007f]+/g," ").replace(/\s+/g," ").trim().slice(0,max):""
}
function aiParseJson(text){
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
function aiAvailableIngredients(){
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
}
function aiPrompt(kind){
  if(kind==="recipe"){
    const t=document.getElementById("aiRecipeText").value.trim();
    if(t.length<20)throw Error("Pegá primero el texto de la receta (al menos un par de renglones).");
    return "Sos un asistente de cocina. Convertí la receta que está entre <<< y >>> en un JSON con exactamente este formato y respondé solo con el JSON, sin texto adicional:\n{\"titulo\":\"…\",\"porciones\":4,\"minutos\":30,\"etiquetas\":[\"…\"],\"ingredientes\":[{\"nombre\":\"…\",\"cantidad\":200,\"unidad\":\"g\"}],\"pasos\":[\"…\"]}\n"+AI_FORMAT_RULES+" \"porciones\": cuántas porciones rinde según el texto, o null si no lo dice. \"minutos\": tiempo total aproximado, o null.\n<<<\n"+t.slice(0,8000)+"\n>>>"
  }
  const have=aiAvailableIngredients();
  if(!have.length)throw Error("Primero marcá ingredientes en tu despensa o cargá existencias, así la IA sabe qué tenés.");
  const extra=document.getElementById("aiIdeasExtra").value.trim().slice(0,200),avoidBox=document.getElementById("recipeAvoidWords"),avoid=avoidBox?avoidBox.value.trim().slice(0,300):"";
  return "Sos un asistente de cocina casera y saludable. Proponé 3 comidas distintas y simples usando principalmente estos ingredientes que tengo: "+have.join(", ")+".\nSeguí el método del plato: la mitad del plato verduras, un cuarto almidones o cereales y un cuarto proteínas. Podés sumar básicos de alacena (aceite, sal, especias, ajo, cebolla) si hace falta."+(extra?"\nTené en cuenta: "+extra+".":"")+(avoid?"\nEvitá: "+avoid+".":"")+"\nRespondé solo con un JSON con exactamente este formato, sin texto adicional:\n{\"ideas\":[{\"titulo\":\"…\",\"porque\":\"frase corta\",\"porciones\":2,\"minutos\":30,\"etiquetas\":[\"…\"],\"ingredientes\":[{\"nombre\":\"…\",\"cantidad\":200,\"unidad\":\"g\"}],\"pasos\":[\"…\"]}]}\n"+AI_FORMAT_RULES
}
function geminiError(status,msg){
  if(status===400&&/api key/i.test(msg))return "La clave de Gemini no es válida.";
  if(status===401||status===403)return "La clave no tiene permiso para usar Gemini (revisala en Google AI Studio).";
  if(status===404)return "El modelo de Gemini ya no está disponible. Volvé a guardar la clave para elegir otro.";
  if(status===429)return "Se alcanzó el límite gratuito de Gemini por ahora. Probá más tarde o usá tu app de IA.";
  if(status>=500)return "Gemini no está respondiendo ahora. Probá más tarde.";
  return "Gemini respondió con un error ("+status+")."
}
async function geminiFetch(url,opts){
  const ctrl=new AbortController(),t=setTimeout(()=>ctrl.abort(),45000);
  let r;
  try{
    r=await fetch(url,Object.assign({
    },opts,{
      signal:ctrl.signal
    }))
  }catch(e){
    throw Error(e&&e.name==="AbortError"?"Gemini tardó demasiado en responder.":"No se pudo conectar con Gemini. Revisá tu conexión.")
  }finally{
    clearTimeout(t)
  }
  const j=await r.json().catch(()=>null);
  if(!r.ok)throw Error(geminiError(r.status,j&&j.error&&j.error.message||""));
  return j
}
function geminiPickModel(list){
  const ok=(Array.isArray(list)?list:[]).filter(m=>m&&Array.isArray(m.supportedGenerationMethods)&&m.supportedGenerationMethods.includes("generateContent")).map(m=>String(m.name||"").replace(/^models\//,""));
  if(ok.includes("gemini-flash-latest"))return "gemini-flash-latest";
  const flash=ok.filter(n=>/^gemini-\d+(\.\d+)?-flash$/.test(n)).sort((a,b)=>parseFloat(b.slice(7))-parseFloat(a.slice(7)));
  return flash[0]||ok.find(n=>/flash/.test(n)&&!/(image|tts|audio|live|exp|preview|thinking|embedding)/.test(n))||null
}
async function geminiChooseModel(key){
  const j=await geminiFetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200",{
    headers:{
      "x-goog-api-key":key
    }
  }),m=geminiPickModel(j&&j.models);
  if(!m)throw Error("La clave funciona, pero no se encontró un modelo Gemini Flash disponible.");
  return m
}
async function geminiGenerate(prompt){
  const s=loadAiSettings();
  if(!s.key)throw Error("Configurá tu clave de Gemini en Más → Asistente de IA.");
  const j=await geminiFetch("https://generativelanguage.googleapis.com/v1beta/models/"+encodeURIComponent(s.model||"gemini-flash-latest")+":generateContent",{
    method:"POST",headers:{
      "Content-Type":"application/json","x-goog-api-key":s.key
    },body:JSON.stringify({
      contents:[{
        role:"user",parts:[{
          text:prompt
        }]
      }],generationConfig:{
        responseMimeType:"application/json",temperature:0.4
      }
    })
  }),c=j&&Array.isArray(j.candidates)&&j.candidates[0],text=c&&c.content&&Array.isArray(c.content.parts)?c.content.parts.map(p=>typeof p.text==="string"?p.text:"").join(""):"";
  if(!text)throw Error("Gemini no devolvió una respuesta. Probá de nuevo o usá tu app de IA.");
  return text
}
function recipeEditorHasContent(){
  return !!(recipeDetailsEditing||["recipeDetailsTitle","recipeDetailsSteps","recipeDetailsNotes","recipeTags","recipeMinutes","recipeSubstitutions"].some(id=>document.getElementById(id).value.trim())||[...document.querySelectorAll("#recipeIngredientRows [data-amount-name]")].some(i=>i.value.trim()))
}
function fillRecipeEditorFromAi(r){
  if(recipeEditorHasContent()&&!window.confirm("Esto reemplaza lo que está en el editor por la propuesta de la IA (tus recetas guardadas no cambian). ¿Continuar?"))return false;
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
}
function renderAiIdeas(ideas){
  const box=document.getElementById("aiIdeasResults");
  box.replaceChildren();
  ideas.forEach(r=>{
    const card=ce("article","ai-idea"),meta=[r.minutos?r.minutos+" min":"",r.porciones?r.porciones+" porciones":""].filter(Boolean).join(" · "),use=ce("button","button button--soft","Usar como receta");use.type="button";use.addEventListener("click",()=>fillRecipeEditorFromAi(r));card.append(ce("h4",null,r.titulo));if(r.porque)card.append(ce("p",null,r.porque));if(meta)card.append(ce("p","screen__hint",meta));if(r.ingredientes.length)card.append(ce("p","screen__hint","Ingredientes: "+r.ingredientes.map(x=>x.nombre).join(", ")));card.append(use);box.append(card)
  })
}
function handleAiAnswer(kind,text){
  const o=aiParseJson(text);
  if(kind==="recipe"){
    const r=aiRecipeFromJson(Array.isArray(o)?o[0]:o.receta&&typeof o.receta==="object"?o.receta:o);
    if(!r)throw Error("La respuesta no tiene una receta válida (falta el título o los ingredientes).");
    return fillRecipeEditorFromAi(r)?"Borrador cargado en el editor: revisalo y guardalo si está bien.":"No se cambió nada."
  }
  const ideas=(Array.isArray(o)?o:Array.isArray(o.ideas)?o.ideas:[]).map(aiRecipeFromJson).filter(Boolean).slice(0,5);
  if(!ideas.length)throw Error("La respuesta no trae ideas válidas.");
  renderAiIdeas(ideas);
  return ideas.length+" idea"+(ideas.length===1?"":"s")+" lista"+(ideas.length===1?"":"s")+": elegí una para verla como receta."
}
async function aiCopy(prompt,box){
  try{
    if(navigator.clipboard&&window.isSecureContext){
      await navigator.clipboard.writeText(prompt);
      return true
    }
  }catch(e){
  }
  const ta=box.querySelector("[data-ai-prompt]");
  ta.value=prompt;
  ta.closest("details").open=true;
  ta.focus();
  ta.select();
  try{
    return document.execCommand("copy")
  }catch(e){
    return false
  }
}
function renderAiRunner(box){
  const kind=box.dataset.ai,s=loadAiSettings(),actions=ce("div","summary-actions"),mk=(cls,txt,attr)=>{
    const b=ce("button","button "+cls,txt);
    b.type="button";
    b.setAttribute(attr,"");
    return b
  };
  box.replaceChildren();
  if(s.key)actions.append(mk("button--primary","✨ Pedir a Gemini","data-ai-gemini"));
  actions.append(mk("button--soft","Copiar pedido para tu IA","data-ai-copy"));
  if(navigator.share)actions.append(mk("button--soft","Compartir pedido","data-ai-share"));
  box.append(actions);
  if(!s.key)box.append(ce("p","screen__hint","Copiá el pedido, pegalo en tu app de IA (ChatGPT, Gemini u otra) y después pegá acá la respuesta. Para que la app consulte sola, configurá Gemini en Más → Asistente de IA."));
  const det=ce("details"),pr=ce("textarea");
  pr.readOnly=true;
  pr.rows=5;
  pr.setAttribute("data-ai-prompt","");
  pr.setAttribute("aria-label","Pedido para la IA");
  det.append(ce("summary",null,"Ver el pedido"),pr);
  const id="aiAnswer_"+kind,lab=ce("label",null,"Respuesta de tu app de IA"),ans=ce("textarea"),st=ce("p","screen__hint");
  lab.htmlFor=id;
  ans.id=id;
  ans.rows=4;
  ans.maxLength=100000;
  ans.placeholder="Pegá acá la respuesta completa";
  st.setAttribute("aria-live","polite");
  st.setAttribute("data-ai-status","");
  box.append(det,lab,ans,mk("button--soft","Usar respuesta","data-ai-use"),st)
}
function renderAllAiRunners(){
  document.querySelectorAll(".ai-runner").forEach(renderAiRunner)
}
function renderAiSettings(){
  const s=loadAiSettings(),inp=document.getElementById("aiKeyInput");
  inp.placeholder=s.key?"Clave guardada (termina en "+s.key.slice(-4)+"). Pegá otra para cambiarla":"Pegá la clave";
  document.getElementById("aiKeyDelete").hidden=!s.key
}
document.addEventListener("click",async e=>{
  const btn=e.target.closest&&e.target.closest(".ai-runner button");if(!btn)return;const box=btn.closest(".ai-runner"),kind=box.dataset.ai,status=box.querySelector("[data-ai-status]");try{
    if(btn.hasAttribute("data-ai-use")){
      status.textContent=handleAiAnswer(kind,box.querySelector("#aiAnswer_"+kind).value);return
    }const prompt=aiPrompt(kind);box.querySelector("[data-ai-prompt]").value=prompt;if(btn.hasAttribute("data-ai-copy")){
      status.textContent=await aiCopy(prompt,box)?"Pedido copiado. Pegalo en tu app de IA y después pegá acá la respuesta.":"Seleccioná el pedido de arriba y copialo a mano.";return
    }if(btn.hasAttribute("data-ai-share")){
      try{
        await navigator.share({
          title:"Pedido para tu IA",text:prompt
        })
      }catch(err){
        if(err&&err.name==="AbortError")return;throw Error("No se pudo compartir. Usá Copiar pedido.")
      }status.textContent="Cuando tengas la respuesta, pegala acá abajo.";return
    }if(btn.hasAttribute("data-ai-gemini")){
      btn.disabled=true;status.textContent="Consultando a Gemini…";try{
        const answer=await geminiGenerate(prompt);status.textContent=handleAiAnswer(kind,answer)
      }finally{
        btn.disabled=false
      }
    }
  }catch(err){
    status.textContent=err.message
  }
});
document.getElementById("aiKeySave").addEventListener("click",async()=>{
  const st=document.getElementById("aiKeyStatus"),inp=document.getElementById("aiKeyInput"),key=inp.value.trim();if(!/^[A-Za-z0-9_\-]{20,200}$/.test(key)){
    st.textContent="La clave no parece válida: copiala completa desde Google AI Studio.";return
  }st.textContent="Probando la conexión con Gemini…";try{
    const model=await geminiChooseModel(key);saveAiSettings({
      key,model
    });inp.value="";renderAiSettings();renderAllAiRunners();st.textContent="Listo: la conexión con Gemini funciona (modelo "+model+"). La clave quedó guardada solo en este dispositivo."
  }catch(err){
    st.textContent=err.message+" No se guardó la clave."
  }
});
document.getElementById("aiKeyDelete").addEventListener("click",()=>{
  try{
    localStorage.removeItem("miPlatoFacil_aiSettings_v1")
  }catch(e){
  }renderAiSettings();renderAllAiRunners();document.getElementById("aiKeyStatus").textContent="Clave borrada de este dispositivo."
});
document.getElementById("aiIdeasPanel").addEventListener("toggle",e=>{
  if(!e.target.open)return;const have=aiAvailableIngredients();document.getElementById("aiIdeasHave").textContent=have.length?"Vas a usar: "+have.join(", ")+".":"Todavía no marcaste ingredientes en tu despensa ni cargaste existencias."
});
renderAllAiRunners();
renderAiSettings();
// Tarjeta en Más → Ajustes: lleva directo a la configuración del asistente (está en la pantalla de Respaldo).
{
  const b=ce("button","tool-button");
  b.type="button";
  b.id="aiSettingsOpen";
  b.append(ce("span","tool-button__emoji","✨"),ce("span","tool-button__label","Asistente de IA"),ce("span","tool-button__desc","Con tu app de IA o con Gemini"));
  b.addEventListener("click",()=>{
    go("backupScreen");
    const panel=document.getElementById("aiSettingsPanel");
    panel.open=true;
    setTimeout(()=>panel.scrollIntoView({
      block:"start",behavior:"smooth"
    }),60)
  });
  const settings=document.getElementById("sectionSettings");
  (settings.querySelector(".tools-grid")||settings).append(b)
}
