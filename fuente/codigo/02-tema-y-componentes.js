// Mi Plato Fácil · Tema claro/oscuro y piezas de interfaz reutilizables.
// Parte 3 de 30: los archivos se unen en este orden (el número define el orden de arranque).
const TKEY="miPlatoFacil_theme";
function prefersDark(){
  try{
    return window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches
  }catch(e){
    return false
  }
}
function autoIsDark(){
  const h=new Date().getHours();
  return h>=19||h<7
}
function getThemeMode(){
  try{
    return localStorage.getItem(TKEY)||"auto"
  }catch(e){
    return "auto"
  }
}
function resolveTheme(mode){
  if(mode==="dark")return "dark";
  if(mode==="light")return "light";
  return (autoIsDark()||prefersDark())?"dark":"light"
}
function applyTheme(){
  const mode=getThemeMode(),eff=resolveTheme(mode);
  document.documentElement.setAttribute("data-theme",eff);
  const btn=document.getElementById("themeToggle");
  if(btn){
    const icon=eff==="dark"?"🌙":"☀️",label=mode==="auto"?"Auto":(mode==="dark"?"Oscuro":"Claro");
    const ico=btn.querySelector(".tool-button__emoji"),lab=btn.querySelector(".tool-button__label");
    if(ico&&lab){ico.textContent=icon;lab.textContent="Tema: "+label}else btn.textContent=icon+" "+label;
    btn.setAttribute("aria-label","Tema: "+label+". Tocar para cambiar")
  }
}
function setThemeMode(m){
  try{
    localStorage.setItem(TKEY,m)
  }catch(e){
  }
  applyTheme()
}
function cycleTheme(){
  const order=["auto","light","dark"],cur=getThemeMode();
  setThemeMode(order[(order.indexOf(cur)+1)%order.length])
}
function ce(t,c,txt){
  const e=document.createElement(t);
  if(c)e.className=c;
  if(txt!==undefined)e.textContent=txt;
  return e
}
function emptyState(emoji,title,text,action){
  const w=ce("div","empty-state");
  w.append(ce("span","empty-state__emoji",emoji),ce("p","empty-state__title",title),ce("p","empty-state__text",text));
  if(action){
    const b=ce("button","button button--soft",action.label);
    b.type="button";
    b.dataset[action.key]=action.value||"";
    b.style.marginTop="14px";
    w.append(b)
  }
  return w
}
function choice({
  label,quantity="",key,next,multi=false
}){
  const b=ce("button","choice");
  b.type="button";
  b.dataset.name=label;
  b.dataset.quantity=quantity;
  if(multi){
    b.dataset.multi=key;
    b.setAttribute("aria-pressed","false")
  }else{
    b.dataset.pick=key;
    b.dataset.next=next
  }
  b.append(ce("span","choice__title",label));
  if(quantity)b.append(ce("span","quantity",quantity));
  return b
}
function renderChoice(id,items,key,next){
  document.getElementById(id).replaceChildren(...items.map(([label,quantity])=>choice({
    label,quantity,key,next
  })))
}
function renderMulti(id,items,key){
  document.getElementById(id).replaceChildren(...items.map(label=>choice({
    label,key,multi:true
  })))
}
const OCC="Opción ocasional: ";
function protBtn(fullName){
  const b=ce("button","choice");
  b.type="button";
  b.dataset.name=fullName;
  b.dataset.multi="proteinas";
  b.setAttribute("aria-pressed","false");
  let disp=fullName.indexOf(OCC)===0?fullName.slice(OCC.length):fullName;
  if(fullName.indexOf(OCC)===0&&disp)disp=disp.charAt(0).toUpperCase()+disp.slice(1);
  b.append(ce("span","choice__title",disp));
  return b
}
function renderProteins(){
  const box=document.getElementById("boxp");
  if(!box)return;
  const main=data.proteinas.filter(x=>x.indexOf("Opción ocasional:")!==0);
  const occ=data.proteinas.filter(x=>x.indexOf("Opción ocasional:")===0);
  const nodes=[];
  nodes.push(ce("p","home-section-label","Proteínas principales"));
  main.forEach(n=>nodes.push(protBtn(n)));
  if(occ.length){
    nodes.push(ce("p","home-section-label","Opción ocasional"));
    occ.forEach(n=>nodes.push(protBtn(n)))
  }
  box.replaceChildren(...nodes)
}
function liList(target,items){
  target.replaceChildren(...items.map(x=>ce("li",null,x)))
}
function snackLabel(x){
  return x[1]?`${x[0]} · ${x[1]}`:x[0]
}
function snackList(target,items){
  target.replaceChildren(...items.map(x=>{
    const li=ce("li",null,snackLabel(x));if(target===el.adviceSnacks)li.append(adviceFavButton("snack",snackLabel(x)));return li
  }))
}
function methodCards(target,items){
  target.replaceChildren(...items.map(x=>ce("li","advice-card-item",`${x}: ${data.cookingTips[x]||""}`)))
}
function renderMenuList(target,items,showTags=false){
  target.replaceChildren(...items.map(item=>{
    const obj=typeof item==="string"?data.menuCatalog.find(x=>x.text===item):item;const li=ce("li",null,obj?obj.text:item);if(target===el.menuIdeas||target.id==="menuSearchList")li.append(adviceFavButton("menu",obj?obj.text:item));if(showTags&&obj&&obj.tags){
      const wrap=ce("div","menu-item-tags");obj.tags.slice(0,5).forEach(t=>wrap.append(ce("span","tag-chip",t)));li.append(wrap)
    }return li
  }))
}
