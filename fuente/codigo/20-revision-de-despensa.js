// Mi Plato Fácil · Revisión de despensa por receta.
// Parte 21: los archivos se unen en orden según su número, que define el orden de arranque.
const PANTRY_REVIEW_COMPONENTS={
  "Ensalada de fideos integrales + atún + tomates cherry + aderezo de oliva":[{
    "label":"Fideos integrales","key":null
  },{
    "label":"Atún","key":null
  },{
    "label":"Tomates cherry","key":null
  },{
    "label":"Aderezo de oliva","key":null
  }],"Fideos integrales con salsa de tomate + albóndigas de garbanzo":[{
    "label":"Fideos integrales","key":null
  },{
    "label":"Salsa de tomate","key":null
  },{
    "label":"Albóndigas de garbanzo","key":null
  }],"Filet de pescado con verduras salteadas":[{
    "label":"Filet de pescado","key":"pescado"
  },{
    "label":"Verduras para saltear","key":null
  }],"Milanesas de zapallito con ensalada de hojas verdes y zanahoria":[{
    "label":"Zapallito","key":"zapallito"
  },{
    "label":"Hojas verdes","key":"hojas"
  },{
    "label":"Zanahoria","key":"zanahoria"
  }],"Pizza integral con pollo + puerro y cebolla de verdeo":[{
    "label":"Pollo","key":"pollo"
  },{
    "label":"Puerro","key":null
  },{
    "label":"Cebolla de verdeo","key":null
  }],"Sándwich de pan integral + hummus de remolacha + rúcula y queso":[{
    "label":"Pan integral","key":null
  },{
    "label":"Hummus de remolacha","key":null
  },{
    "label":"Rúcula","key":null
  },{
    "label":"Queso","key":"queso"
  }],"Tacos de maíz con garbanzos especiados + repollo morado + salsa de yogur":[{
    "label":"Tacos de maíz","key":null
  },{
    "label":"Garbanzos","key":"garbanzos"
  },{
    "label":"Repollo morado","key":null
  },{
    "label":"Salsa de yogur","key":null
  }],"Tacos de porotos colorados con verduras salteadas":[{
    "label":"Tacos","key":null
  },{
    "label":"Porotos colorados","key":null
  },{
    "label":"Verduras para saltear","key":null
  }],"Tarta de jamón cocido, queso y huevo":[{
    "label":"Jamón cocido","key":null
  },{
    "label":"Queso","key":"queso"
  },{
    "label":"Huevo","key":"huevo"
  }],"Tortilla de maíz rellena de revuelto de huevo y arvejas + cebolla de verdeo":[{
    "label":"Tortilla de maíz","key":null
  },{
    "label":"Huevo","key":"huevo"
  },{
    "label":"Arvejas","key":"arvejas"
  },{
    "label":"Cebolla de verdeo","key":null
  }],"Wrap integral de crema de lentejas + palta + verduras crudas":[{
    "label":"Wrap integral","key":null
  },{
    "label":"Crema de lentejas","key":null
  },{
    "label":"Palta","key":"palta"
  },{
    "label":"Verduras crudas","key":null
  }],"Bowl de quinoa + pollo grillado + brócoli y zanahoria":[{
    "label":"Quinoa","key":"quinoa"
  },{
    "label":"Pollo","key":"pollo"
  },{
    "label":"Brócoli","key":"brocoli"
  },{
    "label":"Zanahoria","key":"zanahoria"
  }],"Salmón al horno con puré de calabaza y espinaca":[{
    "label":"Salmón","key":null
  },{
    "label":"Calabaza","key":"calabaza"
  },{
    "label":"Espinaca","key":null
  }],"Guiso de lentejas con calabaza, zanahoria y carne magra":[{
    "label":"Lentejas","key":"lentejas"
  },{
    "label":"Calabaza","key":"calabaza"
  },{
    "label":"Zanahoria","key":"zanahoria"
  },{
    "label":"Carne magra","key":null
  }],"Merluza al vapor con arroz integral y ensalada mixta":[{
    "label":"Merluza","key":null
  },{
    "label":"Arroz integral","key":null
  },{
    "label":"Ensalada mixta","key":null
  }],"Ensalada tibia de garbanzos, espinaca y huevo":[{
    "label":"Garbanzos","key":"garbanzos"
  },{
    "label":"Espinaca","key":null
  },{
    "label":"Huevo","key":"huevo"
  }],"Pollo al curry con arroz basmati y arvejas":[{
    "label":"Pollo","key":"pollo"
  },{
    "label":"Curry","key":null
  },{
    "label":"Arroz basmati","key":null
  },{
    "label":"Arvejas","key":"arvejas"
  }],"Hamburguesa casera de lentejas con ensalada y batata al horno":[{
    "label":"Hamburguesa de lentejas","key":null
  },{
    "label":"Ensalada","key":null
  },{
    "label":"Batata","key":"batata"
  }],"Cazuela de porotos negros con calabaza y choclo":[{
    "label":"Porotos negros","key":null
  },{
    "label":"Calabaza","key":"calabaza"
  },{
    "label":"Choclo","key":null
  }],"Tarta de atún, cebolla y morrón":[{
    "label":"Atún","key":null
  },{
    "label":"Cebolla","key":null
  },{
    "label":"Morrón","key":null
  }],"Fideos integrales con pesto de albahaca y pollo":[{
    "label":"Fideos integrales","key":null
  },{
    "label":"Pesto de albahaca","key":null
  },{
    "label":"Pollo","key":"pollo"
  }],"Sopa de verduras con ñoquis de papa y queso":[{
    "label":"Verduras para sopa","key":null
  },{
    "label":"Ñoquis de papa","key":null
  },{
    "label":"Queso","key":"queso"
  }],"Milanesa de merluza al horno con puré y ensalada verde":[{
    "label":"Milanesa de merluza","key":null
  },{
    "label":"Puré: verificar composición","key":null
  },{
    "label":"Ensalada verde","key":null
  }],"Risotto de hongos con arvejas y queso":[{
    "label":"Hongos","key":null
  },{
    "label":"Arvejas","key":"arvejas"
  },{
    "label":"Queso","key":"queso"
  }],"Ensalada completa: lechuga, tomate, huevo, atún y papa":[{
    "label":"Lechuga","key":null
  },{
    "label":"Tomate","key":"tomate"
  },{
    "label":"Huevo","key":"huevo"
  },{
    "label":"Atún","key":null
  },{
    "label":"Papa","key":"papa"
  }],"Sándwich caliente de pollo, tomate y rúcula":[{
    "label":"Pan para sándwich","key":null
  },{
    "label":"Pollo","key":"pollo"
  },{
    "label":"Tomate","key":"tomate"
  },{
    "label":"Rúcula","key":null
  }],"Tacos de pescado con repollo y salsa de yogur":[{
    "label":"Tacos","key":null
  },{
    "label":"Pescado","key":"pescado"
  },{
    "label":"Repollo","key":null
  },{
    "label":"Salsa de yogur","key":null
  }],"Wrap de pollo, palta y vegetales":[{
    "label":"Wrap","key":null
  },{
    "label":"Pollo","key":"pollo"
  },{
    "label":"Palta","key":"palta"
  },{
    "label":"Vegetales","key":null
  }],"Omelette de espinaca y queso con pan integral":[{
    "label":"Espinaca","key":null
  },{
    "label":"Queso","key":"queso"
  },{
    "label":"Pan integral","key":null
  }]
};
let pantryReviewConfirmed=new Set();
function pantryReviewPartition(title,selected,confirmed){
  const rows=PANTRY_REVIEW_COMPONENTS[title]||[];
  return rows.map((r,i)=>({
    ...r,index:i,available:confirmed?confirmed.has(i):!!r.key&&selected.includes(r.key)
  }))
}
function renderPantryReview(reset){
  const title=document.getElementById("pantryReviewRecipe").value;
  if(reset){
    pantryReviewConfirmed=new Set(pantryReviewPartition(title,pantrySel,null).filter(x=>x.available).map(x=>x.index))
  }
  const rows=pantryReviewPartition(title,pantrySel,pantryReviewConfirmed),box=document.getElementById("pantryReviewItems");
  box.replaceChildren(...rows.map(r=>{
    const label=ce("label","shop-item"),input=ce("input");input.type="checkbox";input.checked=r.available;input.dataset.pantryReviewIndex=String(r.index);label.append(input,ce("span",null,r.label));return label
  }));
  const available=rows.filter(x=>x.available).map(x=>x.label),missing=rows.filter(x=>!x.available).map(x=>x.label);
  document.getElementById("pantryReviewStatus").textContent="Marcados disponibles: "+(available.join(", ")||"ninguno")+". Sin confirmar / por conseguir: "+(missing.join(", ")||"ninguno de los componentes listados")+". Esto no confirma una receta completa ni cantidades suficientes."
}
document.getElementById("pantryReviewRecipe").replaceChildren(...data.menuCatalog.map(rec=>{
  const option=ce("option",null,rec.text);option.value=rec.text;return option
}));
document.getElementById("pantryReviewRecipe").addEventListener("change",()=>renderPantryReview(true));
document.getElementById("pantryReviewPanel").addEventListener("toggle",e=>{
  if(e.target.open)renderPantryReview(true)
});
document.getElementById("pantryReviewReset").addEventListener("click",()=>renderPantryReview(true));
document.getElementById("pantryReviewItems").addEventListener("change",e=>{
  if(e.target.dataset.pantryReviewIndex===undefined)return;const i=Number(e.target.dataset.pantryReviewIndex);if(e.target.checked)pantryReviewConfirmed.add(i);else pantryReviewConfirmed.delete(i);renderPantryReview(false)
});
