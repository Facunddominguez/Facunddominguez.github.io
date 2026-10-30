// Mi Plato Fácil · Ideas de menú, colaciones y consejos favoritos.
// Parte 5: los archivos se unen en orden según su número, que define el orden de arranque.
function menuRecordMatches(record,query){
  const q=normalizeSearchText(query);
  if(!q)return false;
  const text=normalizeSearchText(record.text);
  const tags=(record.tags||[]).map(normalizeSearchText);
  return text.includes(q)||tags.some(t=>t.includes(q)||q.includes(t))
}
const MENU_EXTRA_CLASSIFICATION={
  "carne":["Tarta de jamón cocido, queso y huevo","Guiso de lentejas con calabaza, zanahoria y carne magra","Bife a la plancha con ensalada mixta y papas al horno","Pastel de papa con ensalada verde"],"vegetariano":["Fideos integrales con salsa de tomate + albóndigas de garbanzo","Milanesas de zapallito con ensalada de hojas verdes y zanahoria","Tacos de maíz con garbanzos especiados + repollo morado + salsa de yogur","Tacos de porotos colorados con verduras salteadas","Tortilla de maíz rellena de revuelto de huevo y arvejas + cebolla de verdeo","Wrap integral de crema de lentejas + palta + verduras crudas","Ensalada tibia de garbanzos, espinaca y huevo","Hamburguesa casera de lentejas con ensalada y batata al horno","Cazuela de porotos negros con calabaza y choclo","Omelette de espinaca y queso con pan integral","Tarta de acelga y huevo con ensalada de tomate","Ñoquis de papa con salsa de tomate y queso","Lentejas guisadas con arroz y verduras","Revuelto de zapallitos con huevo y arroz"]
};
function menuMatches(record,filter){
  if(filter==="carne"||filter==="vegetariano")return MENU_EXTRA_CLASSIFICATION[filter].includes(record.text);
  const tags=(record.tags||[]).map(normalizeSearchText),s=normalizeSearchText(record.text);
  if(filter==="todos")return true;
  if(filter==="legumbres")return tags.includes("legumbres")||/garbanzo|lenteja|poroto|hummus|arvejas/.test(s);
  if(filter==="pescado")return tags.includes("pescado")||/pescado|atun|merluza|salmon|sardina|caballa|filet/.test(s);
  if(filter==="pollo")return tags.includes("pollo")||s.includes("pollo");
  if(filter==="rapido")return tags.includes("rapido")||/ensalada|tacos|wrap|sandwich|tortilla/.test(s);
  return true
}
function snackMatches(item,filter){
  const s=normalizeSearchText(item[0]);
  if(filter==="todos")return true;
  if(filter==="dulces")return /fruta|licuado|panqueque|barrita|yogur|budin/.test(s);
  if(filter==="salados")return /hummus|aceitunas|frutos secos/.test(s);
  if(filter==="rapidos")return /fruta|frutos secos|yogur|aceitunas|barrita/.test(s);
  return true
}
function filteredMenuRecords(){
  return data.menuCatalog.filter(x=>menuMatches(x,currentMenuFilter))
}
function filteredMenu(){
  return filteredMenuRecords().map(x=>x.text)
}
function filteredSnacks(){
  return data.snacks.filter(x=>snackMatches(x,currentSnackFilter))
}
function renderMenuIdeas(){
  adviceFavFilter("menu");
  const items=adviceFavItems("menu",filteredMenuRecords());
  // v15.3: se ven 8 ideas y "Ver todas (N)"; con Solo favoritas se ven todas las que coinciden.
  const todas=(typeof ideasMenuTodas!=="undefined"&&ideasMenuTodas===true)||adviceFavOnly.menu||items.length<=8;
  renderMenuList(el.menuIdeas,todas?items:items.slice(0,8),false);
  if(items.length>8&&!adviceFavOnly.menu){
    const li=ce("li","ideas-ver-todas"),b=ce("button","button button--soft",todas?"Ver menos":"Ver todas ("+items.length+")");
    b.type="button";
    b.dataset.ideasVerTodas="";
    li.append(b);
    el.menuIdeas.append(li)
  }
  if(!items.length&&adviceFavOnly.menu){
    const li=ce("li");
    li.append(emptyState("☆","Sin favoritos para este filtro","Guardá ideas con la estrella o desactivá Solo favoritos para ver el menú."));
    el.menuIdeas.replaceChildren(li)
  }
}
function renderSnackIdeas(){
  adviceFavFilter("snack");
  const items=adviceFavItems("snack",filteredSnacks());
  snackList(el.adviceSnacks,items);
  if(!items.length&&adviceFavOnly.snack){
    const li=ce("li");
    li.append(emptyState("☆","Sin favoritos para este filtro","Guardá snacks con la estrella o desactivá Solo favoritos para verlos todos."));
    el.adviceSnacks.replaceChildren(li)
  }
}
const ADVICE_FAV_KEY="miPlatoFacil_adviceFavorites";
let adviceFavOnly={
  menu:false,snack:false
};
function adviceFavKey(kind,text){
  return JSON.stringify([kind,text])
}
function loadAdviceFavs(){
  try{
    const a=JSON.parse(localStorage.getItem(ADVICE_FAV_KEY)||"[]");
    return Array.isArray(a)?a.filter(x=>typeof x==="string"):[]
  }catch(e){
    return []
  }
}
function adviceFavButton(kind,text){
  const b=ce("button","filter-chip");
  b.type="button";
  b.dataset.adviceFav=adviceFavKey(kind,text);
  const on=loadAdviceFavs().includes(b.dataset.adviceFav);
  b.textContent=on?"★ Favorito":"☆ Guardar idea";
  b.setAttribute("aria-pressed",String(on));
  b.setAttribute("aria-label",(on?"Quitar de favoritos: ":"Guardar en favoritos: ")+text);
  b.style.marginTop="8px";
  return b
}
function toggleAdviceFav(key){
  const a=loadAdviceFavs(),i=a.indexOf(key);
  if(i<0)a.push(key);
  else a.splice(i,1);
  try{
    localStorage.setItem(ADVICE_FAV_KEY,JSON.stringify(a))
  }catch(e){
    window.alert("No se pudo guardar el favorito en este dispositivo.");
    return
  }
  renderMenuIdeas();
  renderSnackIdeas();
  renderMenuSearch()
}
function adviceFavFilter(kind){
  const id=kind==="menu"?"menuFilters":"snackFilters",row=document.getElementById(id);
  if(!row)return;
  let b=row.querySelector("[data-advice-fav-only]");
  if(!b){
    b=ce("button","filter-chip");
    b.type="button";
    b.dataset.adviceFavOnly=kind;
    row.append(b)
  }
  b.textContent="★ Solo favoritos";
  b.classList.toggle("is-selected",adviceFavOnly[kind]);
  b.setAttribute("aria-pressed",String(adviceFavOnly[kind]))
}
function adviceFavItems(kind,items){
  if(!adviceFavOnly[kind])return items;
  const favs=loadAdviceFavs();
  return items.filter(x=>favs.includes(adviceFavKey(kind,kind==="menu"?x.text:snackLabel(x))))
}
