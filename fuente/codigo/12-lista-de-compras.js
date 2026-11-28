// Mi Plato Fácil · Lista de compras derivada del plan y sugerencias.
// Parte 13: los archivos se unen en orden según su número, que define el orden de arranque.
// Funciones de este archivo, agrupadas (Etapa 18). El resto de la app las llama como Compras.nombre().
var Compras={
validShoppingChecksWeek(v){
  const lista=a=>Array.isArray(a)&&a.length<=1000&&a.every(x=>typeof x==="string"&&x.length>0&&x.length<=200);
  return !!v&&typeof v==="object"&&!Array.isArray(v)&&Object.keys(v).every(k=>k==="t"||k==="c")&&lista(v.t)&&lista(v.c)
},
validShoppingChecks(o){
  return !!o&&typeof o==="object"&&!Array.isArray(o)&&Object.keys(o).length<=520&&Object.entries(o).every(([k,v])=>Rutina.validTrainingDate(k)&&Compras.validShoppingChecksWeek(v))
},
loadShoppingChecks(){
  try{
    const o=JSON.parse(localStorage.getItem(SHOPPING_CHECKS_KEY)||"{}");
    if(!o||typeof o!=="object"||Array.isArray(o))return {};
    return Object.fromEntries(Object.entries(o).filter(([k,v])=>!["__proto__","constructor","prototype"].includes(k)&&Rutina.validTrainingDate(k)&&Compras.validShoppingChecksWeek(v)))
  }catch(e){
    return {}
  }
},
shoppingChecksWeek(){
  return mondayOf(Rutina.localTrainingDate(new Date()))
},
// Etapa 46 (R6-L-01 a L-03): "Comprar para" esta semana, la que viene o las dos. Lo que elegís a mano se recuerda hasta el lunes
// siguiente (miPlatoFacil_comprasPeriodo_v1 = {"periodo": "esta"|"proxima"|"dos", "semana": lunes de la semana en que lo elegiste}).
// Del viernes al domingo, si la semana que viene ya tiene comidas, la lista abre en "La semana que viene"; los otros días, en "Esta semana".
validComprasPeriodo(v){
  return !!v&&typeof v==="object"&&!Array.isArray(v)&&Object.keys(v).length===2&&["esta","proxima","dos"].includes(v.periodo)&&Rutina.validTrainingDate(v.semana)
},
periodoElegido(){
  try{
    const v=JSON.parse(localStorage.getItem(COMPRAS_PERIODO_KEY)||"null");
    return Compras.validComprasPeriodo(v)&&v.semana===Semana.semanaActual()?v.periodo:null
  }catch(e){
    return null
  }
},
periodoPorDefecto(){
  const dia=new Date().getDay();
  if((dia===5||dia===6||dia===0)&&Semana.planTieneComidas(Semana.planDeLaSemana("proxima")))return "proxima";
  return "esta"
},
periodoActual(){
  return Compras.periodoElegido()||Compras.periodoPorDefecto()
},
elegirPeriodo(periodo){
  if(!["esta","proxima","dos"].includes(periodo))return;
  try{
    localStorage.setItem(COMPRAS_PERIODO_KEY,JSON.stringify({
      periodo,semana:Semana.semanaActual()
    }))
  }catch(e){
    comprasStatus("No se pudo guardar el período elegido.")
  }
  Compras.syncShoppingWeek();
  renderCompras()
},
// "26/11 al 29/11": de hoy al domingo (esta semana), de lunes a domingo (la que viene) o de hoy al domingo de la que viene (las dos).
pintarPeriodo(){
  const periodo=Compras.periodoActual();
  for(const b of document.querySelectorAll("[data-compras-periodo]"))b.setAttribute("aria-pressed",String(b.dataset.comprasPeriodo===periodo))
},
rangoDelPeriodo(periodo){
  const f=d=>d.getDate()+"/"+(d.getMonth()+1),hoy=new Date(Rutina.localTrainingDate(new Date())+"T12:00:00"),dom=new Date(Semana.semanaActual()+"T12:00:00"),sig=new Date(Semana.lunesSiguiente()+"T12:00:00");
  dom.setDate(dom.getDate()+6);
  const finSig=new Date(sig);
  finSig.setDate(finSig.getDate()+6);
  return periodo==="proxima"?f(sig)+" al "+f(finSig):periodo==="dos"?f(hoy)+" al "+f(finSig):f(hoy)+" al "+f(dom)
},
// Tachados y comprados por semana: cada comida lleva su semana (esta o la que viene). Un producto está tachado (o comprado) si lo está
// en todas las semanas del período en las que aparece; tacharlo (o comprarlo) lo marca en todas.
marcasDeSemana(all,lunes){
  const w=all[lunes];
  return {
    t:new Set(w?w.t:[]),c:new Set(w?w.c:[])
  }
},
syncShoppingWeek(){
  // La firma incluye el plan (de esta semana y de la que viene): si cambia lo armado, los tachados se vuelven a leer del almacenamiento.
  let planes="";
  try{planes=(localStorage.getItem(PKEY)||"")+"|"+(localStorage.getItem(PROX_KEY)||"")}catch(e){}
  // También el día de hoy: "Esta semana" cuenta de hoy al domingo, así que al cambiar el día (con la app abierta de un día para el otro) se recalcula.
  const periodo=Compras.periodoActual(),firma=periodo+"|"+Rutina.localTrainingDate(new Date())+"|"+Compras.shoppingChecksWeek()+"|"+planes;
  if(firma===comprasFirma)return;
  comprasWeek=Compras.shoppingChecksWeek();
  // Si la lista no se puede calcular ahora (por ejemplo, datos de recetas que no se leen), se muestra el error de siempre al pintarla y
  // se vuelve a intentar la próxima vez: la firma solo se guarda cuando salió bien.
  if(Compras.recargarTachados(periodo))comprasFirma=firma
},
recargarTachados(periodo){
  const all=Compras.loadShoppingChecks();
  let items;
  try{
    items=Compras.shoppingPlanItems(periodo)
  }catch(e){
    return false
  }
  comprasDone={
  };
  for(const e of items){
    if([...e.semanas].every(l=>Compras.marcasDeSemana(all,l).t.has(e.key)))comprasDone[e.key]=true
  }
  return true
},
shoppingBoughtSet(items){
  const all=Compras.loadShoppingChecks(),out=new Set();
  for(const e of items||Compras.shoppingPlanItems(Compras.periodoActual())){
    if([...e.semanas].every(l=>Compras.marcasDeSemana(all,l).c.has(e.key)))out.add(e.key)
  }
  return out
},
// Guarda SOLO las marcas que se tocaron, en cada semana del producto (nunca reescribe el estado de toda la lista: lo tachado o comprado
// de otra semana, o de productos que hoy no están en la lista, queda como estaba). cambios: [{semanas, key, t?, c?}] con true (marcar) o
// false (sacar la marca); una marca que no se menciona no se toca.
guardarMarcas(cambios){
  Compras.syncShoppingWeek();
  const all=Compras.loadShoppingChecks(),marcas={
  };
  for(const x of cambios)for(const l of x.semanas){
    const m=marcas[l]||(marcas[l]=Compras.marcasDeSemana(all,l));
    if(x.t===true)m.t.add(x.key);else if(x.t===false)m.t.delete(x.key);
    if(x.c===true)m.c.add(x.key);else if(x.c===false)m.c.delete(x.key)
  }
  for(const [l,m] of Object.entries(marcas)){
    if(m.t.size||m.c.size)all[l]={
      t:[...m.t].sort(),c:[...m.c].sort()
    };
    else delete all[l]
  }
  const keep=Object.keys(all).sort().reverse().slice(0,12),out=Object.fromEntries(keep.sort().map(k=>[k,all[k]]));
  if(!Compras.validShoppingChecks(out))throw Error("No se pudieron guardar los tachados.");
  if(Object.keys(out).length)localStorage.setItem(SHOPPING_CHECKS_KEY,JSON.stringify(out));
  else localStorage.removeItem(SHOPPING_CHECKS_KEY)
},
// Las semanas de un producto de la lista actual (si ya no está, la de esta semana).
semanasDe(key){
  const e=Compras.shoppingPlanItems(Compras.periodoActual()).find(x=>x.key===key);
  return e?[...e.semanas]:[Compras.shoppingChecksWeek()]
},
shoppingQtyText(units){
  return [...units.entries()].map(([unit,q])=>Number(q.toFixed(6)).toLocaleString("es-AR",{
    maximumFractionDigits:6
  })+" "+unit).join(" + ")
},
shoppingPlanItems(periodo){
  let recipes=null,amounts=null,lunesDe=Compras.shoppingChecksWeek();
  const map=new Map(),entry=name=>{
    const key=ingredientKey(name),raw=String(name).trim();
    if(!map.has(key))map.set(key,{
      key,name:raw,units:new Map(),unknown:0,forms:new Set(),semanas:new Set()
    });
    const e=map.get(key);
    e.forms.add(normalizeSearchText(raw));
    e.semanas.add(lunesDe);
    return e
  };
  for(const {
    item,portions,lunes,day,slot
  } of periodo?Semana.entradasDelPeriodo(periodo):Semana.planEntriesFlat()){
    lunesDe=lunes||Compras.shoppingChecksWeek();
    // Etapa 51: las porciones de esa comida (las de siempre si no se cargó quién come en cada una); si nadie come en casa, no suma.
    const personas=porcionesEn(day,slot);
    if(personas===0)continue;
    let amount=null;
    if(item&&item.recipeSourceId){
      if(!recipes){
        recipes=loadRecipeDetails();
        amounts=loadRecipeAmounts()
      }
      const recipe=recipes[item.recipeSourceId];
      amount=recipe&&recipe.amountsTitle&&amounts[recipe.amountsTitle]||null
    }
    if(amount){
      for(const row of amount.rows){
        if(!row.name||!row.name.trim()||fueraDeLaLista(row.name))continue;
        const e=entry(row.name);
        if(row.quantity===null)e.unknown++;
        else{
          const u=unidadParaCompra(row.name,row.quantity*Semana.portionFactor(portions,amount)*personas,row.unit);
          e.units.set(u.unit,(e.units.get(u.unit)||0)+u.q)
        }
      }
    }else{
      // Plato armado: las cantidades salen de sus porciones (cantidadesDePlatoArmado, 44-cantidades-de-platos.js).
      const conCantidad=new Set();
      for(const c of cantidadesDePlatoArmado(item)){
        if(fueraDeLaLista(c.name))continue;
        const e=entry(c.name);
        const u=unidadParaCompra(c.name,c.q*personas,c.unit);
        e.units.set(u.unit,(e.units.get(u.unit)||0)+u.q);
        conCantidad.add(ingredientKey(c.name))
      }
      // Etapa 28: una idea del catálogo trae todas sus cantidades (con otros nombres que los del state): nada queda "sin cantidad".
      let porIdea=null;
      try{porIdea=IdeasHoja.ideaDeComida(item)}catch(e){}
      if(!porIdea)Semana.extractIngredients(item).forEach(name=>{
        if(String(name).trim()&&!fueraDeLaLista(name)&&!conCantidad.has(ingredientKey(name)))entry(name).unknown++
      })
    }
  }
  const order=u=>{
    const i=RECIPE_AMOUNT_UNITS.indexOf(u);
    return i<0?99:i
  };
  return [...map.values()].map(e=>{
    e.units=new Map([...e.units.entries()].sort((a,b)=>order(a[0])-order(b[0])));if(e.forms.size>1)e.name=Ingredientes.ingredientDisplayName(e.key,e.name);return e
  })
},
shoppingItemLabel(e){
  // Una sola forma por ítem: con cantidad, la cantidad; sin ella, el nombre (nunca "+ sin cantidad en 1 plato"). El envase real va en el texto que se muestra (shoppingDisplayItems), no en este texto interno.
  const qty=Compras.shoppingQtyText(Ingredientes.mergeUnits(e.units));
  if(!qty)return e.name+(e.unknown>1?" (×"+e.unknown+")":"");
  return e.name+": "+qty
},
shoppingSuggestion(e,stock,marked){
  // Etapa 23: lo de la Despensa en cucharadas o tazas de algo sólido se pasa a gramos, como el plan (los líquidos no: una taza no se convierte a ml).
  const own=Object.values(stock).filter(s=>ingredientKey(s.name)===e.key).map(s=>{
    const u=unidadParaCompra(s.name,s.quantity,s.unit);
    return u.unit==="g"&&u.unit!==s.unit?{...s,quantity:u.q,unit:u.unit}:s
  });
  if(!own.length)return marked.has(e.name)?{
    kind:"info",text:"Lo marcaste en tu Despensa (sin cantidad registrada)."
  }:null;
  const fmt=n=>Number(n.toFixed(6)).toLocaleString("es-AR",{
    maximumFractionDigits:6
  });
  const planUnits=[...e.units.keys()],need=new Map();
  for(const [unit,q] of e.units){
    const i=Ingredientes.unitInfo(unit);
    need.set(i.dim,(need.get(i.dim)||0)+q*i.factor)
  }
  const have=own.map(s=>fmt(s.quantity)+" "+s.unit+(need.size&&!need.has(Ingredientes.unitInfo(s.unit).dim)?" (en otra unidad, sin convertir)":"")).join(" + ");
  if(!e.units.size)return {
    kind:"info",text:"Despensa: tenés "+have+". El plan no indica cantidad: revisá si alcanza."
  };
  let reduced=false;
  const missing=new Map();
  for(const [dim,base] of need){
    const mine=own.filter(s=>Ingredientes.unitInfo(s.unit).dim===dim);
    let left=base;
    if(mine.length){
      reduced=true;
      left=Math.max(0,base-mine.reduce((t,s)=>t+s.quantity*Ingredientes.unitInfo(s.unit).factor,0))
    }
    if(left>1e-9)for(const [u,q] of Ingredientes.displayMissing(dim,left,planUnits))missing.set(u,(missing.get(u)||0)+q)
  }
  if(!reduced)return {
    kind:"info",text:"Despensa: tenés "+have+". No se descuenta porque la unidad no coincide."
  };
  if(!missing.size)return e.unknown?{
    kind:"info",text:"Despensa: tenés "+have+". Cubre lo que tiene cantidad; revisá si alcanza para lo que no la tiene."
  }:{
    kind:"covered",text:"Despensa: tenés "+have+", alcanza para el plan."
  };
  const buy=Compras.shoppingQtyText(missing);
  return {
    kind:"partial",text:"Despensa: tenés "+have+". Podrías comprar "+buy+(e.unknown?", más lo que no tiene cantidad.":"."),buy,missing
  }
},
validComprasOpciones(o){
  return !!o&&typeof o==="object"&&!Array.isArray(o)&&Object.keys(o).length===1&&typeof o.descontar==="boolean"
},
guardarComprasDescontar(valor){
  localStorage.setItem(COMPRAS_OPCIONES_KEY,JSON.stringify({
    descontar:!!valor
  }))
},
seccionDelSuper(nombre){
  const n=" "+normalizeSearchText(nombre).replace(/[^a-z0-9ñ ]+/g," ")+" ",k=ingredientKey(nombre);
  if(!PALABRAS_SUPER){
    PALABRAS_SUPER=[
      ["Almacén","pan rallado|harina|fecula|maicena|frutos secos|semillas|atun|caballa en lata|arroz|fideo|fideos|pasta|pastas|avena|polenta|quinoa|cuscus|aceite|sal|azucar|cafe|te|yerba|vinagre|granola|mani|lenteja|lentejas|garbanzo|garbanzos|poroto|porotos|arveja|arvejas|soja|comino|oregano|pimienta|pimenton|especias|caldo|tomate triturado|pure de tomate|galletitas|cacao|miel|mermelada|amaranto|mijo|sorgo|cebada|centeno|tapioca|trigo|lupino|habas".split("|")],
      ["Congelados",["congelado","congelada","congelados","congeladas","helado"]],
      ["Limpieza",["detergente","lavandina","jabon","servilleta","servilletas","papel","esponja","limpiador","desinfectante","bolsas","rollo"]],
      ["Lácteos y huevos",["leche","yogur","queso","quesos","manteca","crema","huevo","huevos","ricota","clara"]],
      ["Carnicería y pescadería",["carne","pollo","cerdo","vacuna","asado","vacio","bondiola","pechito","merluza","pescado","salmon","milanesa","milanesas","hamburguesa","pavo","cordero","nalga","cuadril","lomo","picada","jamon","caballa","trucha","mariscos"]],
      ["Panadería",["pan","pancitos","tortillas","facturas","tostadas"]]
    ];
  }
  if(n.includes(" pan rallado "))return "Almacén";
  const enLista=arr=>arr.some(x=>ingredientKey(Array.isArray(x)?x[0]:x)===k);
  if(enLista(data.verduras)||enLista(data.frutas)||/ (fruta|frutas|papa|papas|batata|mandioca|choclo|palta|limon|perejil|albahaca|verdura|verduras) /.test(n))return "Verdulería";
  for(const [sec,palabras] of PALABRAS_SUPER){
    if(palabras.some(p=>n.includes(" "+p+" ")))return sec
  }
  return "Otros"
},
// Etapa 19: en la fila no se repite lo que va entre paréntesis ni después de "o" ("Arroz (integral, yamaní): …" → "Arroz: …", "Avena arrollada o instantánea" → "Avena arrollada"); la lista copiada lo conserva.
nombreCorto(texto){
  // Sin paréntesis, sin lo que sigue a " o " y sin un modificador de presentación final ("Avena arrollada o instantánea" → "Avena").
  const t=String(texto),i=t.indexOf(":"),nom=i>0?t.slice(0,i):t;
  const corto=nom.replace(/\s*\([^)]*\)/g,"").split(/\s+o\s+/i)[0].replace(/\s+(arrollad[oa]|fluid[oa]|comprad[oa]|instant[aá]ne[oa])$/i,"").trim()||nom;
  return corto+(i>0?t.slice(i):"")
},
// El nombre corto solo se usa si no se confunde con otra fila: la pantalla y el texto compartido (comprasText) usan lo mismo (Etapa 26).
marcarNombresCortos(items){
  const cuentaCorto=new Map();
  for(const x of items){const k=ingredientKey(Compras.nombreCorto(x.name));cuentaCorto.set(k,(cuentaCorto.get(k)||0)+1)}
  for(const x of items)x.cortar=cuentaCorto.get(ingredientKey(Compras.nombreCorto(x.name)))===1;
  return items
},
shoppingRow(x,i,checked,detail){
  const row=ce("div","shop-item"+(checked?" is-done":"")),cb=ce("input"),lab=ce("label");
  // Etapa 26: un toque en cualquier parte de la fila tacha o destacha (el nombre y el precio ya no son botones).
  // La ficha (nutrientes, fuente, mes y rango del precio) se abre con el botón "ⓘ" de la derecha, que no tacha.
  // El importe ("≈ $135") va en un bloque que no se parte; el resto del texto puede bajar de línea (a 320 px, "sin precio · estimado" es largo).
  const imp=x.precioTxt?/^(.*?)(≈ \$[\d.]+)$/.exec(x.precioTxt):null;
  lab.append(document.createTextNode((typeof Estacion!=="undefined"?Estacion.conEjemplos(Ingredientes.textoLegible(x.cortar?Compras.nombreCorto(x.text):x.text)):Ingredientes.textoLegible(x.cortar?Compras.nombreCorto(x.text):x.text))+(x.precioTxt?" · "+(imp?imp[1]:x.precioTxt):"")));
  if(imp)lab.append(ce("span","shop-item__precio",imp[2]));
  // v20.11 (R6-E-03): lo de estación lleva la marca "de estación". Va como ::after del texto (CSS), así el texto de la fila
  // (el que se copia, se comparte y miran las pruebas) no cambia.
  if(typeof Estacion!=="undefined"&&Estacion.es(x.name))lab.dataset.deEstacion="1";
  cb.type="checkbox";
  cb.checked=checked;
  cb.dataset.shopKey=x.key;
  cb.id="shopItem_"+i;
  lab.htmlFor=cb.id;
  const info=ce("button","shop-item__ficha","ⓘ");
  info.type="button";
  info.dataset.fichaIngrediente=x.name;
  info.setAttribute("aria-label","Ficha de "+x.name+": nutrientes y precio");
  info.addEventListener("click",ev=>{
    ev.preventDefault();ev.stopPropagation();
    Comidas.abrirNutrientesDeIngrediente(x.name)
  });
  // El texto ya tacha por su label; el espacio libre de la fila (márgenes y huecos) lo hace este toque.
  row.addEventListener("click",ev=>{
    if(ev.target===cb||ev.target.closest("label,button,a"))return;
    cb.click()
  });
  row.append(cb,lab,info);
  if(detail)row.append(ce("span","shop-item__detail",Ingredientes.textoLegible(detail)));
  return row
},
// v19.8 (R5-K-03): los grupos de abajo ("Ya tenés", "Ya en tu despensa") se ven directo, sin desplegable.
shoppingGroup(title,list){
  const box=ce("div","home-group shop-group");
  box.dataset.grupo=title;
  box.append(ce("h3","plan-day__title",title+" ("+list.length+")"));
  return box
},
// v19.8 (R5-K-04): lo que sacás de "Ya tenés" vuelve a la lista de esa semana. Se guarda en miPlatoFacil_comprasVueltas_v1
// ({"2026-11-23": ["clave", …]}, una entrada por semana; se conservan las últimas 12).
validVueltas(o){
  return !!o&&typeof o==="object"&&!Array.isArray(o)&&Object.keys(o).length<=520&&Object.entries(o).every(([k,v])=>Rutina.validTrainingDate(k)&&Array.isArray(v)&&v.length<=1000&&v.every(x=>typeof x==="string"&&x.length>0&&x.length<=200))
},
loadVueltas(){
  try{
    const o=JSON.parse(localStorage.getItem(COMPRAS_VUELTAS_KEY)||"{}");
    return Compras.validVueltas(o)?o:{}
  }catch(e){
    return {}
  }
},
vueltasDeLaSemana(periodo){
  const all=Compras.loadVueltas(),out=new Set();
  for(const l of Semana.semanasDelPeriodo(periodo||"esta"))for(const k of all[l]||[])out.add(k);
  return out
},
devolverALaLista(key){
  const all=Compras.loadVueltas();
  for(const wk of Semana.semanasDelPeriodo(Compras.periodoActual())){
    const set=new Set(all[wk]||[]);
    set.add(key);
    all[wk]=[...set].sort()
  }
  const keep=Object.keys(all).sort().reverse().slice(0,12),out=Object.fromEntries(keep.sort().map(k=>[k,all[k]]));
  if(!Compras.validVueltas(out))throw Error("No se pudo guardar el cambio.");
  localStorage.setItem(COMPRAS_VUELTAS_KEY,JSON.stringify(out))
},
equivalenciaSugerida(items){
  try{
    const names=[...new Set(items.filter(x=>x.group==="pendiente"||x.group==="tenes").map(x=>x.name))];
    const par=ingredientAliasSuggestions(names).find(([a,b])=>names.includes(a)&&names.includes(b)&&!equivalenciasOcultas.has(a+"|"+b));
    if(!par)return null;
    const row=ce("p","screen__hint compras-equiv"),unir=ce("button","filter-chip","Unir"),no=ce("button","filter-chip","Ahora no");
    row.id="comprasEquivalencia";
    row.append("¿“"+par[0]+"” es lo mismo que “"+par[1]+"”? ",unir," ",no);
    unir.type=no.type="button";
    unir.dataset.equivUnir=par[0]+"|"+par[1];
    no.dataset.equivNo=par[0]+"|"+par[1];
    unir.setAttribute("aria-label","Unir "+par[0]+" con "+par[1]);
    return row
  }catch(e){
    return null
  }
},
toggleShop(key,checked){
  Compras.syncShoppingWeek();
  comprasDone[key]=checked;
  try{
    Compras.guardarMarcas([{
      semanas:Compras.semanasDe(key),key,t:checked,c:checked?undefined:false
    }])
  }catch(e){
    comprasStatus(e.message)
  }
  renderCompras()
},
comprasText(){
  const periodo=Compras.periodoActual(),todos=Compras.marcarNombresCortos(shoppingDisplayItems(periodo)),pend=todos.filter(x=>x.group==="pendiente"&&!comprasDone[x.key]),lines=[],extras=manualShoppingText();
  // Etapa 23: para WhatsApp. Por secciones del súper (título en negrita), con cantidades legibles, ≈ precio por producto y el total.
  let precios=null;
  try{
    precios=preciosDeLaLista(todos.map(x=>comprasDone[x.key]&&x.group==="pendiente"?{...x,group:"tachado"}:x))
  }catch(e){
  }
  for(const sec of SECCIONES_SUPER){
    const l=pend.filter(x=>x.seccion===sec);
    if(l.length)lines.push(...(lines.length?[""]:[]),"*"+sec+"*",...l.map(x=>{
      const p=precios&&precios.porClave.get(x.key),est=p&&/^sin precio · estimado/.test(p),real=p&&!est&&p!=="sin precio";
      return "• "+Ingredientes.textoLegible(x.cortar?Compras.nombreCorto(x.text):x.text)+(real?" · "+p:est?" · "+p.replace("sin precio · estimado","estimado"):"")
    }))
  }
  if(!lines.length&&!extras)return "";
  const total=precios&&precios.total>0?NL+NL+"*Total "+formatoPesos(precios.total)+"*"+(precios.sinEstimar?" (al menos)":"")+(precios.estimados?" · incluye "+precios.estimados+(precios.estimados===1?" precio estimado":" precios estimados"):""):"";
  return "🛒 Lista de compras — Mi plato fácil"+NL+"Lista para la semana del "+Compras.rangoDelPeriodo(periodo)+NL+lines.join(NL)+(extras?(lines.length?NL+NL:"")+"Productos extra"+NL+extras:"")+total
},
shareCompras(){
  let t;
  try{
    t=Compras.comprasText()
  }catch(err){
    comprasStatus(err.message);
    return
  }
  if(!t){
    comprasStatus("No hay ingredientes para compartir (¿tachaste todos?).");
    return
  }
  if(navigator.share){
    navigator.share({
      title:"Lista de compras",text:t
    }).then(function(){
      comprasStatus("¡Compartido!")
    }).catch(function(e){
      if(e&&e.name==="AbortError")return;doCopy(t).then(function(ok){
        comprasStatus(ok?"Compartir no está disponible; copiamos la lista.":"No se pudo compartir ni copiar.")
      })
    })
  }else{
    doCopy(t).then(function(ok){
      comprasStatus(ok?"Compartir no está disponible; copiamos la lista.":"No se pudo compartir ni copiar.")
    })
  }
}
};
// v19.8 (R5-K-12): "Porciones, existencias y costos" salió de Compras; el presupuesto compara el plan tal cual está (multiplicador 1).
function shoppingMissingRows(){
  const totals=new Map(),unknown=new Set(),recipes=loadRecipeDetails(),amounts=loadRecipeAmounts(),stock=loadStockQuantities();
  for(const {
    item,portions,day,slot
  } of Semana.entradasDelPeriodo(Compras.periodoActual())){
    if(!item||!item.recipeSourceId)continue;
    // Etapa 51: sin quién-come cargado el multiplicador es 1 como siempre; con él, las porciones de esa comida.
    const multiplier=factorEnHueco(day,slot);
    if(multiplier===0)continue;
    const recipe=recipes[item.recipeSourceId],amount=recipe&&recipe.amountsTitle&&amounts[recipe.amountsTitle];
    if(!amount)continue;
    for(const row of amount.rows){
      if(!row.name||!row.name.trim())continue;
      const key=JSON.stringify([ingredientKey(row.name),Ingredientes.unitInfo(row.unit).dim]);
      if(!totals.has(key))totals.set(key,{
        name:row.name,unit:row.unit,quantity:0,unknown:false
      });
      const t=totals.get(key);
      if(row.quantity===null)t.unknown=true;
      else t.quantity+=convertQuantity(row.quantity,row.unit,t.unit)*multiplier*Semana.portionFactor(portions,amount)
    }
  }
  return [...totals.values()].map(t=>{
    const available=Ingredientes.stockQuantityFor(stock,t.name,t.unit);return {
      ...t,available,missing:Math.max(0,t.quantity-(available===null?0:available))
    }
  }).sort((a,b)=>a.name.localeCompare(b.name,"es"))
}
let comprasShowAll=false;
// Tachados y comprados por semana (desde la v15), en miPlatoFacil_shoppingChecks_v1:
// {"2026-10-26": {"t": [tachados], "c": [comprados con "Lo compré"]}}. La semana empieza el lunes (mondayOf).
// Se escribe solo cuando el usuario actúa (nunca al mostrar) y al escribir se conservan las últimas 12 semanas.
const SHOPPING_CHECKS_KEY="miPlatoFacil_shoppingChecks_v1";
var COMPRAS_VUELTAS_KEY="miPlatoFacil_comprasVueltas_v1";
var COMPRAS_PERIODO_KEY="miPlatoFacil_comprasPeriodo_v1";
var comprasFirma=null;
// Lectura tolerante: lo que no tiene el formato esperado se ignora (semana por semana).
let comprasWeek=null;
// Trae los tachados de la semana actual (al abrir la app o si empezó otra semana: cada lunes arranca sin tachados).
// Al abrir la app solo se leen los tachados de esta semana (la lista todavía no se puede calcular: faltan archivos por cargar); la primera
// vez que se pinta o se toca la lista se recalculan para el período elegido.
comprasWeek=Compras.shoppingChecksWeek();
comprasDone=Object.fromEntries(((Compras.loadShoppingChecks()[comprasWeek]||{t:[]}).t).map(k=>[k,true]));
// Interruptor "Descontar lo que tengo" (desde la v15.4), en miPlatoFacil_comprasOpciones_v1: {"descontar": true|false}.
// Encendido por defecto (el comportamiento de antes). Se escribe solo al tocarlo. Es var por el orden de arranque.
var COMPRAS_OPCIONES_KEY="miPlatoFacil_comprasOpciones_v1";
function comprasDescontar(){
  try{
    const o=JSON.parse(localStorage.getItem(COMPRAS_OPCIONES_KEY)||"null");
    return Compras.validComprasOpciones(o)?o.descontar:true
  }catch(e){
    return true
  }
}
// Secciones del súper (desde la v15.4). Primero las listas del armado; después, palabras sueltas.
var SECCIONES_SUPER=["Verdulería","Carnicería y pescadería","Lácteos y huevos","Panadería","Almacén","Congelados","Limpieza","Otros"];
var PALABRAS_SUPER=null;
// Cada ítem del plan va a un grupo: "pendiente", "tenes" (ya está en la despensa y alcanza, o no hay cantidad para
// comparar) o "comprado" (pasó con "Lo compré" esta semana). Si hay cantidad y no alcanza, sigue pendiente con
// "faltan X". Los tres grupos juntos son siempre la misma lista, con las cantidades del plan.
// Desde la v15.4: si la despensa tiene otra unidad ("la unidad no coincide"), queda pendiente con "revisá"; con el
// interruptor "Descontar lo que tengo" apagado, nada va a "Ya tenés" y no se muestra "faltan".
function shoppingDisplayItems(periodo){
  const stock=loadStockQuantities(),marked=MarcasDespensa.pantryMarkedMatcher(),items=Compras.shoppingPlanItems(periodo),bought=Compras.shoppingBoughtSet(items),vueltas=Compras.vueltasDeLaSemana(periodo),descontar=comprasDescontar();
  return items.map(e=>{
    const label=Compras.shoppingItemLabel(e),suggestion=Compras.shoppingSuggestion(e,stock,marked),partial=!!suggestion&&suggestion.kind==="partial",revisar=!!suggestion&&suggestion.kind==="info"&&/la unidad no coincide/.test(suggestion.text),group=bought.has(e.key)?"comprado":descontar&&suggestion&&!partial&&!revisar&&!vueltas.has(e.key)?"tenes":"pendiente";const faltaEnvase=descontar&&partial&&suggestion.missing?envasar(e.name,suggestion.missing):null,compra=faltaEnvase||envasar(e.name,e.units),visible=compra&&!faltaEnvase?e.name+": "+compra.texto:label;return {
      key:e.key,name:e.name,units:e.units,unknown:e.unknown,label,suggestion,group,seccion:Compras.seccionDelSuper(e.name),compraUnits:compra?compra.units:null,text:descontar&&group==="pendiente"&&partial?(faltaEnvase?e.name+": "+faltaEnvase.texto:label+" · faltan "+suggestion.buy):descontar&&group==="pendiente"&&revisar?visible+" · revisá":visible
    }
  }).sort((a,b)=>a.label.localeCompare(b.label,"es"))
}
// Equivalencias (v15.7): una sola sugerencia en la lista, con los pares que detecta Preferencias → Ingredientes.
// "Ahora no" la oculta solo en esta sesión y no guarda nada.
var equivalenciasOcultas=new Set();
function renderCompras(){
  const cont=document.getElementById("comprasList"),hint=document.getElementById("comprasHint"),summary=document.getElementById("comprasSummary");
  if(!cont)return;
  Compras.syncShoppingWeek();
  Compras.pintarPeriodo();
  const sw=document.getElementById("comprasDescontar");
  if(sw)sw.checked=comprasDescontar();
  try{
    renderPresupuestoCompras()
  }catch(e){
  }
  let items;
  try{
    items=shoppingDisplayItems(Compras.periodoActual())
  }catch(e){
    cont.replaceChildren(ce("p","screen__hint","No se pudo calcular la lista: "+e.message));
    return
  }
  // El nombre corto solo se usa si no se confunde con otra fila ("Arroz" y "Arroz (integral, yamaní)" siguen separados).
  Compras.marcarNombresCortos(items);
  const pend=items.filter(x=>x.group==="pendiente"),tenes=items.filter(x=>x.group==="tenes"),comprados=items.filter(x=>x.group==="comprado"),pending=pend.filter(x=>!comprasDone[x.key]),tachados=pend.length-pending.length+tenes.filter(x=>comprasDone[x.key]).length;
  let precios=null;
  try{
    precios=preciosDeLaLista(items)
  }catch(e){
  }
  summary.textContent=pending.length+" pendientes · "+tachados+" tachados"+resumenPrecios(precios);
  pintarPreciosCompras(precios);
  hint.textContent="Despensa aparte.";
  const nodes=[],equiv=Compras.equivalenciaSugerida(items);
  if(equiv)nodes.push(equiv);
  let i=0;
  for(const sec of SECCIONES_SUPER){
    const lista=pend.filter(x=>x.seccion===sec);
    if(!lista.length)continue;
    const box=ce("div","compras-seccion");
    box.dataset.seccion=sec;
    box.append(ce("h3","compras-seccion__titulo",sec));
    // Lo tachado queda a la vista, al final de su sección.
    if(precios)lista.forEach(x=>{
      x.precioTxt=precios.porClave.get(x.key)||"";
      x.precioDetalle=precios.porDetalle.get(x.key)||""
    });
    for(const x of [...lista.filter(x=>!comprasDone[x.key]),...lista.filter(x=>comprasDone[x.key])])box.append(Compras.shoppingRow(x,i++,!!comprasDone[x.key],x.text.endsWith(" · revisá")&&x.suggestion?"💡 "+x.suggestion.text:""));
    nodes.push(box)
  }
  if(!pending.length){
    if(items.length)nodes.push(ce("p","screen__hint","No queda nada por comprar."));
    else{
      const vacio=Interfaz.emptyState("🛒","Todavía no hay nada para comprar","Con comidas en la semana, la lista se arma sola.",{label:"Armar mi semana",key:"comprasArmar",value:"1"});
      vacio.querySelector("button").className="button button--primary";
      vacio.querySelector("button").addEventListener("click",()=>openTab("semana"));
      nodes.push(vacio)
    }
  }
  const terminar=document.getElementById("comprasBought");
  if(terminar){terminar.classList.toggle("button--primary",!!pending.length);terminar.classList.toggle("button--soft",!pending.length)}
  if(tenes.length){
    const g=Compras.shoppingGroup("Ya tenés",tenes);
    // Una línea por producto: solo el nombre y su botón (por qué ya lo tenés queda en el título de la fila).
    for(const x of tenes){
      const nombre=Ingredientes.textoLegible(Compras.nombreCorto(x.name)),fila=Compras.shoppingRow({...x,text:Compras.nombreCorto(x.name),cortar:false,precioTxt:""},i++,!!comprasDone[x.key],""),volver=ce("button","filter-chip shop-item__volver","↩");
      volver.type="button";
      volver.dataset.volverALista=x.key;
      volver.setAttribute("aria-label","Volver a la lista: "+nombre);
      volver.title="Volver a la lista";
      if(x.suggestion)fila.title=x.suggestion.text;
      fila.insertBefore(volver,fila.querySelector(".shop-item__ficha"));
      g.append(fila)
    }
    nodes.push(g)
  }
  if(comprados.length){
    const g=Compras.shoppingGroup("Ya en tu despensa",comprados);
    for(const x of comprados)g.append(Compras.shoppingRow(x,i++,true));
    nodes.push(g)
  }
  cont.replaceChildren(...nodes)
}
// Tachar o destachar. Destachar algo de "Ya en tu despensa" lo devuelve a Pendientes sin tocar la despensa
// (para revertir la despensa está el Deshacer de "Lo compré").
function comprasStatus(msg){
  const s=document.getElementById("comprasStatus");
  if(s)s.textContent=msg
}
