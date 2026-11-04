// Mi Plato Fácil · Modo simple: oculta las herramientas avanzadas sin borrar ni cambiar datos.
// Parte 31: los archivos se unen en orden según su número, que define el orden de arranque.
// Las herramientas ocultas siguen funcionando con lo que ya guardaste (por ejemplo, las existencias
// siguen generando sugerencias en Compras): solo dejan de verse hasta que se elige el modo completo.
// Semana (desde la v15.1) no oculta nada: sus herramientas están en su menú ⋯ en los dos modos.
// Funciones de este archivo, agrupadas (Etapa 18). El resto de la app las llama como ModoSimple.nombre().
const ModoSimple={
setUiMode(mode){
  const next=mode==="completo"?"completo":"simple";
  if(typeof fijarPreciosAntesDelModo==="function")fijarPreciosAntesDelModo();
  try{
    localStorage.setItem(UI_MODE_KEY,next);
    uiModeMemory=null
  }catch(e){
    uiModeMemory=next
  }
  applyUiMode();
  if(next==="simple")ModoSimple.resetHiddenSessionControls();
  ModoSimple.renderUiModeControls();
  if(typeof refrescarPrecios==="function")refrescarPrecios()
},
resetHiddenSessionControls(){
  let changed=false;
  const set=(id,prop,value)=>{
    const e=document.getElementById(id);
    if(e&&e[prop]!==value){
      e[prop]=value;
      changed=true
    }
  };
  set("recipeRecommendMode","value","normal");
  set("recipeRecommendPantry","checked",false);
  set("recipeRecommendCosts","checked",false);
  set("recipeCatalogSort","value","name");
  set("recipeCatalogPageSize","value","20");
  if(changed){
    recipeCatalogPage=0;
    try{
      renderRecipeCatalog()
    }catch(e){
    }
  }
},
renderUiModeControls(){
  const simple=Interfaz.isSimpleMode();
  document.querySelectorAll("[data-mode-note]").forEach(note=>{
    const group=ADVANCED_TOOLS[note.dataset.modeNote];
    note.querySelector("p").textContent=simple?"🧰 Herramientas ocultas: "+group.list+". Tus datos siguen guardados.":"🧰 Estás viendo todas las herramientas, también las avanzadas.";
    note.querySelector("button").textContent=simple?"Mostrar herramientas avanzadas":"Ocultar herramientas avanzadas"
  });
  const card=document.getElementById("uiModeToggle");
  if(card){
    const estado=simple?"desactivado":"activado";
    card.querySelector(".tool-button__label").textContent="Mostrar herramientas avanzadas: "+estado;
    card.querySelector(".tool-button__desc").textContent=simple?"Activalo para ver calculadoras, recomendaciones y equivalencias":"Se ven las calculadoras, recomendaciones y equivalencias";
    card.setAttribute("aria-label","Mostrar herramientas avanzadas: "+estado+". Tocar para cambiar")
  }
}
};
const ADVANCED_TOOLS={
  // Desde la v15.4 las herramientas de Compras están en su menú ⋯ en los dos modos. Desde la v15.7 la barra de
  // presupuesto y los precios no dependen del modo: los maneja "Mostrar precios y presupuesto" (43-precios.js).
  // Desde la v15.3 cada herramienta vive en la pantalla de su tema; la lista de elementos es la misma de antes.
  ingredientes:{
    list:"revisar una idea con tu despensa",
    items:()=>[document.getElementById("pantryReviewPanel")]
  },
  ideas:{
    list:"recomendaciones por despensa o costo y el orden de las recetas",
    items:()=>[
      document.getElementById("recipeRecommendPantry").closest("details"),
      document.getElementById("recipeCatalogSort").closest(".portion-field"),
      document.getElementById("recipeCatalogPageSize").closest(".portion-field")
    ]
  },
  comida:{
    list:"descontar de la despensa al cocinar",
    items:()=>[document.getElementById("recipeReadCooked")]
  },
  recetaEditar:{
    list:"cantidades vinculadas y mis cantidades por receta",
    items:()=>[
      document.getElementById("recipeDetailsAmounts").closest(".portion-field"),
      document.getElementById("recipeAmountsPanel")
    ]
  },
  preferencias:{
    list:"ingredientes equivalentes",
    items:()=>[document.getElementById("ingredientAliasPanel")]
  },
  backupScreen:{
    list:"exportar o importar platos y vaciar la lista",
    items:()=>{
      const tools=document.getElementById("savedTools"),divider=tools&&tools.previousElementSibling;
      return [divider&&divider.classList.contains("divider")?divider:null,tools]
    }
  },
  misplatos:{
    list:"las copias de recetas que usa el plan",
    items:()=>[]
  }
};
// Controles de la sesión que quedan ocultos: vuelven a su valor inicial para que no cambien
// en silencio lo que se ve (por ejemplo, el orden de las recetas). No guardan datos.
(()=>{
  for(const [key,group] of Object.entries(ADVANCED_TOOLS)){
    group.items().filter(Boolean).forEach(e=>e.setAttribute("data-avanzado",key));
    // Desde la v16.6 no hay carteles "Mostrar herramientas avanzadas" en cada pantalla: el único interruptor está en Preferencias.
  }
  const card=ce("button","tool-button");
  card.type="button";
  card.id="uiModeToggle";
  card.dataset.uiModeToggle="";
  card.append(ce("span","tool-button__emoji","🧰"),ce("span","tool-button__label"),ce("span","tool-button__desc"));
  // Desde la v15.3 la tarjeta está en Más → Preferencias; desde la v15.7 junto a la de los precios.
  const precios=ce("button","tool-button");
  precios.type="button";
  precios.id="preciosToggle";
  precios.dataset.preciosToggle="";
  precios.append(ce("span","tool-button__emoji","💲"),ce("span","tool-button__label"),ce("span","tool-button__desc"));
  document.getElementById("preferenciasModo").append(precios,card);
  document.addEventListener("click",e=>{
    if(e.target.closest("[data-precios-toggle]")){
      try{
        guardarMostrarPrecios(!preciosActivos())
      }catch(err){
      }
      if(typeof refrescarPrecios==="function")refrescarPrecios();
      return
    }
    if(e.target.closest("[data-ui-mode-toggle]"))ModoSimple.setUiMode(Interfaz.isSimpleMode()?"completo":"simple")
  });
  ModoSimple.renderUiModeControls()
})();
