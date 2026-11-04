// Mi Plato Fácil · Ideas de menú, colaciones y consejos favoritos.
// Parte 5: los archivos se unen en orden según su número, que define el orden de arranque.
// Funciones de este archivo, agrupadas (Etapa 18). El resto de la app las llama como Ideas.nombre().
var Ideas={
menuRecordMatches(record,query){
  const q=normalizeSearchText(query);
  if(!q)return false;
  const text=normalizeSearchText(record.text);
  const tags=(record.tags||[]).map(normalizeSearchText);
  return text.includes(q)||tags.some(t=>t.includes(q)||q.includes(t))
},
menuMatches(record,filter){
  if(filter==="carne"||filter==="vegetariano")return MENU_EXTRA_CLASSIFICATION[filter].includes(record.text);
  const tags=(record.tags||[]).map(normalizeSearchText),s=normalizeSearchText(record.text);
  if(filter==="todos")return true;
  if(filter==="legumbres")return tags.includes("legumbres")||/garbanzo|lenteja|poroto|hummus|arvejas/.test(s);
  if(filter==="pescado")return tags.includes("pescado")||/pescado|atun|merluza|salmon|sardina|caballa|filet/.test(s);
  if(filter==="pollo")return tags.includes("pollo")||s.includes("pollo");
  if(filter==="rapido")return tags.includes("rapido")||/ensalada|tacos|wrap|sandwich|tortilla/.test(s);
  return true
},
snackMatches(item,filter){
  const s=normalizeSearchText(item[0]);
  if(filter==="todos")return true;
  if(filter==="dulces")return /fruta|licuado|panqueque|barrita|yogur|budin/.test(s);
  if(filter==="salados")return /hummus|aceitunas|frutos secos/.test(s);
  if(filter==="rapidos")return /fruta|frutos secos|yogur|aceitunas|barrita/.test(s);
  return true
},
filteredMenuRecords(){
  // Desde la v16 las ideas respetan los filtros de dieta y lo que evitás (dietaPermiteIdea y textoPermitido, 36 y 46).
  return data.menuCatalog.filter(x=>Ideas.menuMatches(x,currentMenuFilter)&&textoPermitido(textoDeIdea(x)))
},
filteredMenu(){
  return Ideas.filteredMenuRecords().map(x=>x.text)
},
filteredSnacks(){
  return data.snacks.filter(x=>Ideas.snackMatches(x,currentSnackFilter))
},
renderMenuIdeas(){
  Ideas.adviceFavFilter("menu");
  const items=Ideas.adviceFavItems("menu",Ideas.filteredMenuRecords());
  // v15.3: se ven 8 ideas y "Ver todas (N)"; con Solo favoritas se ven todas las que coinciden.
  const todas=(typeof ideasMenuTodas!=="undefined"&&ideasMenuTodas===true)||adviceFavOnly.menu||items.length<=8;
  Interfaz.renderMenuList(el.menuIdeas,todas?items:items.slice(0,8),false);
  if(items.length>8&&!adviceFavOnly.menu){
    const li=ce("li","ideas-ver-todas"),b=ce("button","button button--soft",todas?"Ver menos":"Ver todas ("+items.length+")");
    b.type="button";
    b.dataset.ideasVerTodas="";
    li.append(b);
    el.menuIdeas.append(li)
  }
  // Si los filtros de dieta dejan pocas ideas, se avisa (dietaAvisoPocas, 46-dieta.js).
  const pocas=dietaAvisoPocas();
  if(pocas)el.menuIdeas.append(ce("li","screen__hint ideas-aviso",pocas));
  if(!items.length&&adviceFavOnly.menu){
    const li=ce("li");
    li.append(Interfaz.emptyState("☆","Sin favoritos para este filtro","Guardá ideas con la estrella o desactivá Solo favoritos para ver el menú."));
    el.menuIdeas.replaceChildren(li)
  }
},
renderSnackIdeas(){
  Ideas.adviceFavFilter("snack");
  const items=Ideas.adviceFavItems("snack",Ideas.filteredSnacks());
  Interfaz.snackList(el.adviceSnacks,items);
  if(!items.length&&adviceFavOnly.snack){
    const li=ce("li");
    li.append(Interfaz.emptyState("☆","Sin favoritos para este filtro","Guardá snacks con la estrella o desactivá Solo favoritos para verlos todos."));
    el.adviceSnacks.replaceChildren(li)
  }
},
adviceFavKey(kind,text){
  return JSON.stringify([kind,text])
},
loadAdviceFavs(){
  try{
    const a=JSON.parse(localStorage.getItem(ADVICE_FAV_KEY)||"[]");
    return Array.isArray(a)?a.filter(x=>typeof x==="string"):[]
  }catch(e){
    return []
  }
},
toggleAdviceFav(key){
  const a=Ideas.loadAdviceFavs(),i=a.indexOf(key);
  if(i<0)a.push(key);
  else a.splice(i,1);
  try{
    localStorage.setItem(ADVICE_FAV_KEY,JSON.stringify(a))
  }catch(e){
    window.alert("No se pudo guardar el favorito en este dispositivo.");
    return
  }
  Ideas.renderMenuIdeas();
  Ideas.renderSnackIdeas();
  renderMenuSearch()
},
adviceFavFilter(kind){
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
},
adviceFavItems(kind,items){
  if(!adviceFavOnly[kind])return items;
  const favs=Ideas.loadAdviceFavs();
  return items.filter(x=>favs.includes(Ideas.adviceFavKey(kind,kind==="menu"?x.text:Interfaz.snackLabel(x))))
}
};
const MENU_EXTRA_CLASSIFICATION={
  "carne":["Tarta de jamón cocido, queso y huevo","Guiso de lentejas con calabaza, zanahoria y carne magra","Bife a la plancha con ensalada mixta y papas al horno","Pastel de papa con ensalada verde"],"vegetariano":["Fideos integrales con salsa de tomate + albóndigas de garbanzo","Milanesas de zapallito con ensalada de hojas verdes y zanahoria","Tacos de maíz con garbanzos especiados + repollo morado + salsa de yogur","Tacos de porotos colorados con verduras salteadas","Tortilla de maíz rellena de revuelto de huevo y arvejas + cebolla de verdeo","Wrap integral de crema de lentejas + palta + verduras crudas","Ensalada tibia de garbanzos, espinaca y huevo","Hamburguesa casera de lentejas con ensalada y batata al horno","Cazuela de porotos negros con calabaza y choclo","Omelette de espinaca y queso con pan integral","Tarta de acelga y huevo con ensalada de tomate","Ñoquis de papa con salsa de tomate y queso","Lentejas guisadas con arroz y verduras","Revuelto de zapallitos con huevo y arroz"]
};
const ADVICE_FAV_KEY="miPlatoFacil_adviceFavorites";
let adviceFavOnly={
  menu:false,snack:false
};
function adviceFavButton(kind,text){
  const b=ce("button","filter-chip");
  b.type="button";
  b.dataset.adviceFav=Ideas.adviceFavKey(kind,text);
  const on=Ideas.loadAdviceFavs().includes(b.dataset.adviceFav);
  b.textContent=on?"★ Favorito":"☆ Guardar idea";
  b.setAttribute("aria-pressed",String(on));
  b.setAttribute("aria-label",(on?"Quitar de favoritos: ":"Guardar en favoritos: ")+text);
  b.style.marginTop="8px";
  return b
}
