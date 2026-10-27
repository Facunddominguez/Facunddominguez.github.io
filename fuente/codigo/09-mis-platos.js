// Mi Plato Fácil · Mis platos guardados, importar y exportar.
// Parte 10 de 30: los archivos se unen en este orden (el número define el orden de arranque).
const SKEY="miPlatoFacil_saved";
function loadSaved(){
  try{
    const raw=localStorage.getItem(SKEY);
    const a=raw?JSON.parse(raw):[];
    return Array.isArray(a)?a:[]
  }catch(e){
    return []
  }
}
function persistSaved(a){
  try{
    localStorage.setItem(SKEY,JSON.stringify(a));
    return true
  }catch(e){
    return false
  }
}
function plateSignature(){
  return state.type+"|"+plateLines().join("|")
}
function currentSnapshot(){
  const L=plateLines();
  return {
    id:Date.now()+"_"+Math.random().toString(36).slice(2,7),savedAt:new Date().toISOString(),type:state.type,title:L[0],lines:L.slice(1),sig:plateSignature(),text:plateText(),cooked:0,state:JSON.parse(JSON.stringify(state))
  }
}
let savedStatusTimer=null;
function savedStatus(msg){
  const s=document.getElementById("savedStatus");
  if(!s)return;
  s.textContent=msg;
  clearTimeout(savedStatusTimer);
  savedStatusTimer=setTimeout(()=>{
    s.textContent=""
  },3600)
}
function savePlate(){
  if(!state.type){
    shareStatus("Primero armá un plato.");
    return
  }
  const a=loadSaved();
  const snap=currentSnapshot();
  if(a.some(x=>(x.sig||x.text)===snap.sig)){
    shareStatus("Este plato ya está guardado.");
    return
  }
  a.unshift(snap);
  const ok=persistSaved(a);
  shareStatus(ok?"¡Plato guardado en este dispositivo!":"No se pudo guardar (almacenamiento no disponible).")
}
function deleteSaved(id){
  const a=loadSaved().filter(x=>x.id!==id);
  persistSaved(a);
  renderSaved();
  savedStatus("Plato eliminado.")
}
function toggleFav(id){
  const a=loadSaved();
  const it=a.find(x=>x.id===id);
  if(!it)return;
  it.fav=!it.fav;
  persistSaved(a);
  renderSaved();
  savedStatus(it.fav?"Marcado como favorito.":"Quitado de favoritos.")
}
function renameSaved(id){
  const a=loadSaved();
  const it=a.find(x=>x.id===id);
  if(!it)return;
  const cur=it.note||"";
  const val=window.prompt("Nombre o nota para este plato:",cur);
  if(val===null)return;
  it.note=val.trim();
  persistSaved(a);
  renderSaved();
  savedStatus(it.note?"Nota guardada.":"Nota eliminada.")
}
function cookedPlate(id){
  const a=loadSaved();
  const it=a.find(x=>x.id===id);
  if(!it)return;
  it.cooked=(it.cooked||0)+1;
  persistSaved(a);
  renderSaved();
  savedStatus("¡Registrado! Cocinaste este plato "+it.cooked+" ve"+(it.cooked===1?"z":"ces")+".")
}
function clearAllSaved(){
  const a=loadSaved();
  if(!a.length){
    savedStatus("No hay platos para borrar.");
    return
  }
  if(window.confirm("¿Seguro que querés borrar TODOS los platos guardados? Esta acción no se puede deshacer.")){
    persistSaved([]);
    renderSaved();
    savedStatus("Se borraron todos los platos.")
  }
}
function matchSaved(it,q){
  if(!q)return true;
  const hay=normalizeSearchText(savedItemTitle(it)+" "+(it.title||"")+" "+savedItemLines(it).join(" ")+" "+(it.note||""));
  return hay.includes(q)
}
function fmtWhen(iso){
  const d=new Date(iso);
  if(isNaN(d.getTime()))return "";
  return d.toLocaleDateString("es-AR")+" "+d.toLocaleTimeString("es-AR",{
    hour:"2-digit",minute:"2-digit"
  })
}
function savedCard(item){
  const card=ce("div","summary__line");
  const head=ce("div",null);
  head.append(ce("strong",null,(item.fav?"⭐ ":"")+(item.recipeSourceId?"📖":typeEmoji(item.type))+" "+savedItemTitle(item)));
  if(item.note){
    const nt=ce("div",null,"🏷️ "+item.note);
    nt.style.color="var(--green)";
    nt.style.fontSize="13px";
    nt.style.fontWeight="800";
    nt.style.marginTop="4px";
    head.append(nt)
  }
  const lines=Array.isArray(item.lines)?savedItemLines(item):(item.text?item.text.split(NL).slice(1).map(x=>x.replace(/^•\s*/,"")):[]);
  const ul=ce("ul");
  ul.style.margin="6px 0 0";
  ul.style.paddingLeft="18px";
  ul.style.color="var(--muted)";
  ul.style.fontSize="13px";
  lines.forEach(t=>ul.append(ce("li",null,t)));
  const c=item.cooked||0;
  const meta=ce("div",null,fmtWhen(item.savedAt)+(c>0?" · 👨‍🍳 Cocinado "+c+" ve"+(c===1?"z":"ces"):""));
  meta.style.color="var(--muted)";
  meta.style.fontSize="12px";
  meta.style.marginTop="6px";
  const open=expandedSaved.has(item.id);
  const tog=ce("button","button button--soft saved-toggle",(open?"Opciones ▴":"Opciones ▾"));
  tog.type="button";
  tog.dataset.toggleActions=item.id;
  tog.setAttribute("aria-expanded",String(open));
  const acts=ce("div","summary-actions"+(open?"":" is-hidden"));
  const bCook=ce("button","button button--soft","✓ Cociné");
  bCook.type="button";
  bCook.dataset.cookSaved=item.id;
  const bFav=ce("button","button button--soft",item.fav?"⭐ Favorito":"☆ Favorito");
  bFav.type="button";
  bFav.dataset.favSaved=item.id;
  bFav.setAttribute("aria-pressed",String(!!item.fav));
  const bNote=ce("button","button button--soft","Renombrar");
  bNote.type="button";
  bNote.dataset.renameSaved=item.id;
  const bCopy=ce("button","button button--soft","Copiar");
  bCopy.type="button";
  bCopy.dataset.copySaved=item.id;
  const bDel=ce("button","button button--danger","Eliminar");
  bDel.type="button";
  bDel.dataset.delSaved=item.id;
  acts.append(bCook,bFav,bNote,bCopy,bDel);
  card.append(head,ul,meta,tog,acts);
  return card
}
function toggleSavedActions(id){
  if(expandedSaved.has(id))expandedSaved.delete(id);
  else expandedSaved.add(id);
  renderSaved()
}
function sortSaved(arr){
  const s=arr.slice();
  if(savedSort==="az"){
    s.sort((x,y)=>normalizeSearchText((x.note||x.title||"")).localeCompare(normalizeSearchText((y.note||y.title||""))))
  }else if(savedSort==="tipo"){
    const ord={
      desayuno:0,plato:1,snack:2,pre:3
    };
    s.sort((x,y)=>(ord[x.type]??9)-(ord[y.type]??9))
  }else if(savedSort==="cocinado"){
    s.sort((x,y)=>(y.cooked||0)-(x.cooked||0))
  }
  return s
}
function renderSaved(){
  const list=document.getElementById("savedList"),hint=document.getElementById("savedHint");
  if(!list)return;
  const a=loadSaved();
  const q=normalizeSearchText(savedQuery);
  const filtered=a.filter(it=>matchSaved(it,q));
  const ordered=sortSaved(filtered);
  const sorted=ordered.slice().sort((x,y)=>(y.fav?1:0)-(x.fav?1:0));
  if(hint){
    if(!a.length)hint.textContent="";
    else if(q)hint.textContent="Mostrando "+filtered.length+" de "+a.length+" platos.";
    else{
      const r=a.filter(x=>x.recipeSourceId).length,p=a.length-r;
      hint.textContent="Tenés "+p+" plato"+(p===1?"":"s")+" guardado"+(p===1?"":"s")+(r?" y "+r+" receta"+(r===1?"":"s")+" del plan":"")+" en este dispositivo."
    }
  }
  if(!a.length){
    list.replaceChildren(emptyState("🍽️","Todavía no guardaste platos","Armá una comida y tocá Guardar para tenerla siempre a mano.",{
      label:"Armar mi primer plato",key:"start",value:"plato"
    }))
  }else if(!filtered.length){
    list.replaceChildren(emptyState("🔍","Sin resultados","No hay platos que coincidan con tu búsqueda. Probá con otra palabra.",{
      label:"Limpiar búsqueda",key:"clearSearch"
    }))
  }else{
    const plates=sorted.filter(x=>!x.recipeSourceId),recipes=sorted.filter(x=>x.recipeSourceId),nodes=plates.map(savedCard);
    if(!plates.length)nodes.push(ce("p","screen__hint",q?"Ningún plato propio coincide; mirá las recetas del plan.":"Todavía no guardaste platos propios. Abajo están las recetas que asignaste al plan."));
    if(recipes.length){
      const box=ce("details","home-group saved-recipes");
      box.open=savedRecipesOpen||!!q;
      box.addEventListener("toggle",()=>{
        if(!q)savedRecipesOpen=box.open
      });
      box.append(ce("summary",null,"📖 Recetas asignadas al plan ("+recipes.length+")"),ce("p","screen__hint","Se crean al asignar una receta al plan. La receta se edita en Descubrí → Con lo que tengo."),...recipes.map(savedCard));
      nodes.push(box)
    }
    list.replaceChildren(...nodes)
  }
}
function exportPlates(){
  const a=loadSaved();
  if(!a.length){
    savedStatus("No hay platos para exportar.");
    return
  }
  try{
    const blob=new Blob([JSON.stringify(a,null,2)],{
      type:"application/json"
    });
    const url=URL.createObjectURL(blob);
    const link=document.createElement("a");
    link.href=url;
    link.download="mis-platos.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    savedStatus("Exportado: mis-platos.json")
  }catch(e){
    savedStatus("No se pudo exportar en este navegador.")
  }
}
const IMPORT_PLATE_TYPES=["desayuno","plato","snack","pre"];
function importHasForbiddenKeys(v){
  if(!v||typeof v!=="object")return false;
  return Object.keys(v).some(k=>["__proto__","constructor","prototype"].includes(k)||importHasForbiddenKeys(v[k]))
}
function importedPlateType(it){
  if(IMPORT_PLATE_TYPES.includes(it.type))return it.type;
  if(it.type!==undefined)return null;
  const head=String(typeof it.title==="string"?it.title:(it.text.split(NL)[1]||"")).trim();
  if(head==="Desayuno / Merienda")return "desayuno";
  if(head.indexOf("Almuerzo / Cena")===0)return "plato";
  if(head==="Snack")return "snack";
  if(head==="Pre-entreno")return "pre";
  return null
}
function validImportedState(st){
  if(st===null)return true;
  if(typeof st!=="object"||Array.isArray(st))return false;
  const named=o=>!!o&&typeof o==="object"&&!Array.isArray(o)&&typeof o.name==="string"&&o.name.length<=300;
  return ["verduras","almidones","proteinas","legCarb","legProt"].every(k=>st[k]===undefined||Array.isArray(st[k])&&st[k].length<=200&&st[k].every(named))&&["fruta","bfprot","bfcarb","grasa","snack","pre"].every(k=>st[k]===undefined||st[k]===null||named(st[k]))
}
function normalizeImportedPlate(it,usedIds){
  if(!it||typeof it!=="object"||Array.isArray(it)||importHasForbiddenKeys(it))return null;
  if(typeof it.text!=="string"||!it.text.trim()||it.text.length>20000)return null;
  const type=importedPlateType(it);
  if(!type)return null;
  const lines=it.lines===undefined?it.text.split(NL).slice(2).map(x=>x.replace(/^•\s*/,"")).filter(Boolean):it.lines;
  if(!Array.isArray(lines)||lines.length>200||lines.some(x=>typeof x!=="string"||x.length>2000))return null;
  const optional=(v,max)=>v===undefined||v===null||typeof v==="string"&&v.length<=max;
  if(!optional(it.title,500)||!optional(it.note,1000)||!optional(it.sig,20000)||!optional(it.savedAt,100)||!optional(it.recipeSourceId,200))return null;
  if(it.fav!==undefined&&typeof it.fav!=="boolean")return null;
  if(it.cooked!==undefined&&!(Number.isInteger(it.cooked)&&it.cooked>=0&&it.cooked<=100000))return null;
  if(it.recipeIngredients!==undefined&&!(Array.isArray(it.recipeIngredients)&&it.recipeIngredients.length<=200&&it.recipeIngredients.every(x=>typeof x==="string"&&x.length<=100)))return null;
  if(it.state!==undefined&&!validImportedState(it.state))return null;
  let id=typeof it.id==="string"&&/^[A-Za-z0-9_.:-]{1,120}$/.test(it.id)?it.id:null;
  if(!id||usedIds.has(id)){
    do{
      id=Date.now()+"_"+Math.random().toString(36).slice(2,9)
    }while(usedIds.has(id))
  }
  usedIds.add(id);
  const out=JSON.parse(JSON.stringify(it));
  out.id=id;
  out.type=type;
  out.lines=lines.slice();
  return out
}
function importPlatesFile(file){
  if(file.size>10000000){
    savedStatus("El archivo supera el límite de 10 MB. No se importó nada.");
    return
  }
  const r=new FileReader();
  r.onload=()=>{
    let arr;
    try{
      arr=JSON.parse(r.result)
    }catch(e){
      savedStatus("Archivo inválido. Debe ser un JSON exportado por la app.");
      return
    }
    if(!Array.isArray(arr)||arr.length>5000){
      savedStatus("Archivo inválido. Debe ser un JSON exportado por la app.");
      return
    }
    const cur=loadSaved();
    const seen=new Set(cur.map(x=>x.sig||x.text));
    const usedIds=new Set(cur.map(x=>x&&x.id).filter(x=>typeof x==="string"));
    let added=0,existing=0,invalid=0;
    for(const raw of arr){
      const it=normalizeImportedPlate(raw,usedIds);
      if(!it){
        invalid++;
        continue
      }
      const key=it.sig||it.text;
      if(seen.has(key)){
        existing++;
        continue
      }
      seen.add(key);
      cur.push(it);
      added++
    }
    if(added&&!persistSaved(cur)){
      savedStatus("No se pudo guardar la importación (espacio insuficiente). Tus platos no se modificaron.");
      return
    }
    renderSaved();
    const parts=["Importados "+added+" plato"+(added===1?"":"s")+" nuevo"+(added===1?"":"s")+"."];
    if(existing)parts.push(existing+" ya estaba"+(existing===1?"":"n")+" guardado"+(existing===1?"":"s")+".");
    if(invalid)parts.push(invalid+" omitido"+(invalid===1?"":"s")+" por formato inválido.");
    savedStatus(parts.join(" "))
  };
  r.onerror=()=>savedStatus("No se pudo leer el archivo.");
  r.readAsText(file)
}
