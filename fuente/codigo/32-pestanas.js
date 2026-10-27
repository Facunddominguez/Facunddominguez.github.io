// Mi Plato Fácil · Barra de pestañas: Hoy, Semana, Compras, Mis comidas y Más.
// Parte 33: los archivos se unen en orden según su número, que define el orden de arranque.
// Cada pestaña recuerda su recorrido (por ejemplo, un plato a medio armar). Tocar la pestaña activa,
// o el botón de arriba, vuelve a su pantalla de inicio. Las pestañas no guardan nada en el dispositivo.
let openTab=()=>{
};
// Vuelve todas las pestañas a su inicio (lo usa restart(), por ejemplo con "Armar otro plato").
// Es var para que restart() pueda consultarla aunque se llame antes de que corra este archivo.
var resetTabs=null;
(()=>{
  const home=document.getElementById("home"),bar=document.getElementById("sectionNav"),theme=document.getElementById("themeToggle");
  let switching=false;
  const memories={
  };
  function measure(){
    const height=bar.getBoundingClientRect().height;
    document.documentElement.style.setProperty("--section-nav-h",height+"px");
    document.documentElement.style.setProperty("--step-nav-h",el.bottom.classList.contains("is-visible")?el.bottom.getBoundingClientRect().height+"px":"0px")
  }
  function homeTexts(){
    if(activeTab==="mas")return ["Más","Ideas, organización y ajustes de la app."];
    return ["Hoy · "+new Date().toLocaleDateString("es-AR",{
      weekday:"long",day:"numeric",month:"long"
    }),todayHint()]
  }
  function paint(){
    // Si se llegó a la portada desde otra pestaña (por ejemplo, con "Armar otro plato"), es Hoy.
    if(stack.at(-1)==="home"&&activeTabRoot()!=="home")activeTab="hoy";
    home.dataset.homeTab=activeTab==="mas"?"mas":"hoy";
    bar.querySelectorAll("button").forEach(b=>{
      if(b.dataset.sectionTab===activeTab)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current")
    });
    const [title,hint]=homeTexts();
    home.querySelector(".screen__kicker").textContent=title;
    home.querySelector(".screen__title").textContent=title;
    home.querySelector(".screen__hint").textContent=hint;
    theme.classList.toggle("is-hidden",!(stack.at(-1)==="home"&&activeTab==="mas"));
    el.homeTop.classList.toggle("is-visible",stack.at(-1)!==activeTabRoot());
    el.homeTop.textContent="← "+TABS[activeTab].label;
    el.homeTop.setAttribute("aria-label","Volver al inicio de "+TABS[activeTab].label);
    if(stack.at(-1)==="home"&&activeTab==="hoy")renderToday();
    measure()
  }
  function remember(){
    memories[activeTab]={
      state:JSON.parse(JSON.stringify(state)),stack:stack.slice(),editReturn,portionEditReturn,lastRandomType
    }
  }
  function showScreen(id){
    document.querySelectorAll(".screen").forEach(s=>{
      const on=s.id===id;s.classList.toggle("is-active",on);if(on)s.removeAttribute("aria-hidden");else s.setAttribute("aria-hidden","true")
    });
    // Las mismas actualizaciones que hace go() al abrir cada pantalla.
    if(id==="resumen")summary();
    if(id==="misplatos")renderSaved();
    if(id==="plan")renderPlan();
    if(id==="compras")renderCompras();
    if(id==="ingredientes")renderPantry();
    nav()
  }
  function switchTab(tab){
    if(!TABS[tab])return;
    remember();
    switching=true;
    if(tab===activeTab)stack=[TABS[tab].root];
    else{
      activeTab=tab;
      const saved=memories[tab];
      stack=saved?saved.stack.slice():[TABS[tab].root];
      if(saved){
        Object.assign(state,JSON.parse(JSON.stringify(saved.state)));
        syncMultiSelection();
        setReplace("carb",state.replaceCarb);
        setReplace("prot",state.replaceProt);
        if(state.type==="plato")updatePlate();
        editReturn=saved.editReturn;
        portionEditReturn=saved.portionEditReturn;
        lastRandomType=saved.lastRandomType
      }
    }
    showScreen(stack.at(-1));
    switching=false;
    paint();
    window.scrollTo({
      top:0,behavior:"smooth"
    })
  }
  openTab=switchTab;
  bar.addEventListener("click",e=>{
    const b=e.target.closest("[data-section-tab]");
    if(b)switchTab(b.dataset.sectionTab)
  });
  const observer=new MutationObserver(records=>{
    if(!switching&&records.some(r=>r.target!==theme))paint()
  });
  observer.observe(document.querySelector("main"),{
    subtree:true,attributes:true,attributeFilter:["class"]
  });
  observer.observe(el.bottom,{
    attributes:true,attributeFilter:["class"]
  });
  if(typeof ResizeObserver!=="undefined"){
    const resize=new ResizeObserver(measure);
    resize.observe(bar);
    resize.observe(el.bottom)
  }
  window.addEventListener("resize",measure);
  document.addEventListener("click",e=>{
    if(e.target.closest("#homeTop")){
      e.preventDefault();
      e.stopImmediatePropagation();
      switchTab(activeTab)
    }
  },true);
  resetTabs=()=>{
    activeTab="hoy";
    Object.keys(memories).forEach(k=>delete memories[k]);
    paint()
  };
  paint()
})();
