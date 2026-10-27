// Mi Plato Fácil · Catálogo de ideas, despensa, días, estado y elementos de la pantalla.
// Parte 2 de 30: los archivos se unen en este orden (el número define el orden de arranque).
const data={
  "fruit":[["Budín","1 porción"],["En trozos","2 unidades grandes o 4 unidades pequeñas"],["Enteras con cáscara o peladas","2 unidades grandes o 4 unidades pequeñas"],["Licuado","1 vaso"],["Panqueque","1 porción"],["Porción de galletas","1 porción"],["Tarta","1 porción"],["Waffle","1 porción"]],"bfprot":[["Huevo | Clara de huevo","1 unidad | 2 unidades"],["Leche fluida o en polvo descremada","1 vaso | 2 cdas soperas"],["Queso Port Salut descremado","1 rebanada"],["Yogur natural descremado","1 pote"]],"bfcarb":[["Avena arrollada o instantánea","2 cdas soperas"],["Granola comprada o casera","3 cdas soperas"],["Harina de trigo integral","3 cdas soperas"],["Pan de molde integral o blanco","1 rodaja"]],"bffat":[["Frutos secos: almendras / nueces / cajú","1/4 taza o 1 puñado"],["Palta","1/4 unidad"],["Semillas: sésamo / chía","1 cda sopera"]],"verduras":["Acelga","Ajo","Albahaca","Alcaucil","Apio","Berenjena","Brócoli","Cebolla","Cebolla de verdeo","Chauchas","Coliflor","Escarola","Espárragos","Espinaca","Hinojo","Kale","Lechuga","Morrón amarillo","Morrón rojo","Morrón verde","Nabo","Pepino","Puerro","Rabanito","Radicheta","Remolacha","Repollo blanco","Repollo colorado","Rúcula","Tomate","Zanahoria","Zapallito","Zapallo","Zucchini"],"almidones":["Amaranto","Arroz (integral, yamaní)","Avena","Batata","Cebada","Centeno","Choclo","Cuscús","Fécula de maíz (maicena)","Fécula de mandioca","Fideos y pastas (de trigo, maíz o arroz)","Harina de arroz","Harina de avena","Harina de maíz","Harina de trigo","Mandioca","Mijo","Pan","Pan rallado","Papa","Polenta","Quinoa","Sorgo","Tapioca","Tortillas de trigo o maíz","Trigo"],"legumbres":["Arvejas","Chauchas (judías verdes)","Garbanzos","Habas","Lentejas","Lupino","Maní","Porotos aduki","Porotos alubia (blanco)","Porotos colorados","Porotos manteca","Porotos mung","Porotos negros","Porotos pallar","Soja (poroto de soja)"],"proteinas":["Atún","Caballa","Carne de cerdo (carré)","Carne vacuna (nalga, cuadril, bola de lomo, lomo, roast beef)","Opción ocasional: asado, vacío, bondiola y pechito de cerdo","Opción ocasional: manteca, crema de leche","Opción ocasional: queso mozzarella, queso rallado, queso pategrás, queso reggianito, queso sardo, queso azul","Huevo entero de gallina","Leche (preferentemente descremada, parcialmente descremada)","Lenguado","Merluza","Pollo (pechuga, muslo, pata-muslo)","Queso cremoso","Queso fresco","Queso Port Salut","Queso untable descremado","Salmón","Sardina","Yogur (natural, bebible, griego)"],"snacks":[["Aceitunas","5 - 6 unidades"],["Barrita de cereal",""],["Fruta","ej: manzana, arándano, banana"],["Frutos secos","puñado"],["Hummus",""],["Licuados de frutas",""],["Panqueques de avena",""],["Porción de budín de frutas",""],["Yogur bebible",""]],"preIdeas":["Cuscús","Fécula de maíz / maicena","Fideos o pastas no integrales","Fruta","Licuado","Pan blanco","Papa","Polenta","Tapioca","Tortillas de trigo o maíz"],"preCombos":["Cuscús + fruta","Licuado + pan blanco","Pan blanco + fruta","Papa + fruta","Polenta + fruta","Tortilla + fruta"],"menuCatalog":[{
    "text":"Ensalada de fideos integrales + atún + tomates cherry + aderezo de oliva","tags":["fideos","pastas","atún","atun","pescado","tomate","tomates","ensalada","rápido","rapido","integral","integrales","tomates cherry","cherry","oliva","aderezo"]
  },{
    "text":"Fideos integrales con salsa de tomate + albóndigas de garbanzo","tags":["fideos","pastas","tomate","salsa","garbanzo","garbanzos","legumbres","integral","integrales","salsa de tomate","albóndigas","albondigas","albóndigas de garbanzo"]
  },{
    "text":"Filet de pescado con verduras salteadas","tags":["filet","pescado","verduras","salteado","rápido","rapido","verduras salteadas","salteadas","filet de pescado"]
  },{
    "text":"Milanesas de zapallito con ensalada de hojas verdes y zanahoria","tags":["zapallito","ensalada","hojas verdes","lechuga","rúcula","rucula","zanahoria","verduras","milanesa","milanesas","hojas"]
  },{
    "text":"Pizza integral con pollo + puerro y cebolla de verdeo","tags":["pizza","pollo","puerro","cebolla de verdeo","rápido","rapido","integral","pizza integral","verdeo"]
  },{
    "text":"Sándwich de pan integral + hummus de remolacha + rúcula y queso","tags":["sándwich","sandwich","pan","hummus","remolacha","rúcula","rucula","queso","legumbres","rápido","rapido","integral","pan integral","hummus de remolacha"]
  },{
    "text":"Tacos de maíz con garbanzos especiados + repollo morado + salsa de yogur","tags":["tacos","maíz","maiz","garbanzo","garbanzos","legumbres","repollo","yogur","rápido","rapido","tacos de maíz","tacos de maiz","especiados","repollo morado","salsa de yogur"]
  },{
    "text":"Tacos de porotos colorados con verduras salteadas","tags":["tacos","poroto","porotos","legumbres","verduras","salteado","rápido","rapido","porotos colorados","colorados","verduras salteadas","salteadas"]
  },{
    "text":"Tarta de jamón cocido, queso y huevo","tags":["tarta","jamón","jamon","queso","huevo","jamón cocido","jamon cocido","cocido"]
  },{
    "text":"Tortilla de maíz rellena de revuelto de huevo y arvejas + cebolla de verdeo","tags":["tortilla","maíz","maiz","huevo","arvejas","legumbres","cebolla de verdeo","rápido","rapido","tortilla de maíz","tortilla de maiz","revuelto","revuelto de huevo","verdeo"]
  },{
    "text":"Wrap integral de crema de lentejas + palta + verduras crudas","tags":["wrap","lenteja","lentejas","legumbres","palta","verduras crudas","lechuga","rápido","rapido","integral","wrap integral","crema de lentejas","crudas"]
  },{
    "text":"Bowl de quinoa + pollo grillado + brócoli y zanahoria","tags":["bowl","quinoa","pollo","brócoli","brocoli","zanahoria","verduras","rápido","rapido"]
  },{
    "text":"Salmón al horno con puré de calabaza y espinaca","tags":["salmón","salmon","pescado","calabaza","espinaca","verduras","horno"]
  },{
    "text":"Guiso de lentejas con calabaza, zanahoria y carne magra","tags":["guiso","lenteja","lentejas","legumbres","calabaza","zanahoria","carne","verduras"]
  },{
    "text":"Merluza al vapor con arroz integral y ensalada mixta","tags":["merluza","pescado","arroz","ensalada","verduras","rápido","rapido"]
  },{
    "text":"Ensalada tibia de garbanzos, espinaca y huevo","tags":["ensalada","garbanzo","garbanzos","legumbres","espinaca","huevo","verduras","rápido","rapido"]
  },{
    "text":"Pollo al curry con arroz basmati y arvejas","tags":["pollo","curry","arroz","arvejas","legumbres"]
  },{
    "text":"Hamburguesa casera de lentejas con ensalada y batata al horno","tags":["hamburguesa","lenteja","lentejas","legumbres","ensalada","batata","horno","rápido","rapido"]
  },{
    "text":"Cazuela de porotos negros con calabaza y choclo","tags":["cazuela","poroto","porotos","legumbres","calabaza","choclo","verduras"]
  },{
    "text":"Tarta de atún, cebolla y morrón","tags":["tarta","atún","atun","pescado","cebolla","morrón","morron"]
  },{
    "text":"Fideos integrales con pesto de albahaca y pollo","tags":["fideos","pastas","pesto","albahaca","pollo"]
  },{
    "text":"Sopa de verduras con ñoquis de papa y queso","tags":["sopa","verduras","ñoquis","noquis","papa","queso"]
  },{
    "text":"Milanesa de merluza al horno con puré y ensalada verde","tags":["milanesa","merluza","pescado","puré","pure","ensalada","verduras","horno","rápido","rapido"]
  },{
    "text":"Risotto de hongos con arvejas y queso","tags":["risotto","hongos","arvejas","legumbres","queso"]
  },{
    "text":"Ensalada completa: lechuga, tomate, huevo, atún y papa","tags":["ensalada","lechuga","tomate","huevo","atún","atun","pescado","papa","verduras","rápido","rapido"]
  },{
    "text":"Sándwich caliente de pollo, tomate y rúcula","tags":["sándwich","sandwich","pollo","tomate","rúcula","rucula","rápido","rapido"]
  },{
    "text":"Tacos de pescado con repollo y salsa de yogur","tags":["tacos","pescado","merluza","repollo","yogur","rápido","rapido"]
  },{
    "text":"Wrap de pollo, palta y vegetales","tags":["wrap","pollo","palta","vegetales","verduras","rápido","rapido"]
  },{
    "text":"Omelette de espinaca y queso con pan integral","tags":["omelette","huevo","espinaca","queso","pan","verduras","rápido","rapido"]
  }],"cookingMethods":["Hervido","Horno","Parrilla","Salteado"],"cookingTips":{
    "Hervido":"Útil para papa, arroz, pastas, huevos o verduras. Es práctico cuando querés preparar una base simple.","Horno":"Ideal para preparar varias porciones juntas y dejar comida lista.","Parrilla":"Buena opción para carnes, pollo, verduras o pescado.","Salteado":"Útil para verduras rápidas y combinaciones con pollo, huevo o legumbres."
  }
};
data.menuIdeas=data.menuCatalog.map(x=>x.text);
const PANTRY=[["pollo","🍗 Pollo",["pollo"]],["carne","🥩 Carne",["carne","hamburguesa"]],["pescado","🐟 Pescado / atún",["pescado","atun","merluza","salmon","filet","sardina","caballa"]],["huevo","🥚 Huevos",["huevo","tortilla","omelette","revuelto"]],["queso","🧀 Queso",["queso"]],["yogur","🥛 Yogur",["yogur"]],["lentejas","🟤 Lentejas",["lenteja","lentejas","legumbres"]],["garbanzos","🟡 Garbanzos",["garbanzo","garbanzos","legumbres","hummus"]],["porotos","🫘 Porotos",["poroto","porotos","legumbres"]],["arvejas","🟢 Arvejas",["arvejas","legumbres"]],["arroz","🍚 Arroz",["arroz","risotto"]],["fideos","🍝 Fideos / pasta",["fideos","pastas","noquis"]],["papa","🥔 Papa",["papa","pure"]],["batata","🍠 Batata",["batata"]],["pan","🍞 Pan",["pan","sandwich"]],["maiz","🌽 Maíz / tortilla",["maiz","tortilla","tacos","wrap"]],["quinoa","🌾 Quinoa",["quinoa","bowl"]],["tomate","🍅 Tomate",["tomate"]],["hojas","🥬 Hojas verdes",["lechuga","rucula","ensalada","espinaca"]],["zanahoria","🥕 Zanahoria",["zanahoria"]],["calabaza","🎃 Calabaza / zapallo",["calabaza","zapallo"]],["brocoli","🥦 Brócoli",["brocoli"]],["palta","🥑 Palta",["palta"]],["zapallito","🫑 Zapallito",["zapallito"]]];
const PANKEY="miPlatoFacil_pantry";
const state={
  type:"",day:"",fruta:null,bfprot:null,bfcarb:null,grasa:null,pre:null,snack:null,verduras:[],almidones:[],proteinas:[],legCarb:[],legProt:[],replaceCarb:false,replaceProt:false,customPortions:null
};
let stack=["home"],editReturn=false,portionEditReturn=false,pStart=null,pMoved=false,lastSuggestion={
  menu:-1,snack:-1,pre:-1
},currentMenuFilter="todos",currentSnackFilter="todos",lastRandomType=null,savedQuery="",savedSort="reciente",comprasDone={
},pantrySel=[];
const expandedSaved=new Set();
const DAYS=[["lunes","Lunes"],["martes","Martes"],["miercoles","Miércoles"],["jueves","Jueves"],["viernes","Viernes"],["sabado","Sábado"],["domingo","Domingo"]];
const SLOTS=[["desayuno","🍳 Desayuno"],["merienda","☕ Merienda"],["almuerzo","🥗 Almuerzo"],["cena","🌙 Cena"]];
function slotPool(slot){
  return (slot==="desayuno"||slot==="merienda")?"desayuno":"plato"
}
const el={
  bottom:document.getElementById("bottom"),bottomInner:document.getElementById("bottomInner"),nextBottom:document.getElementById("nextBottom"),homeTop:document.getElementById("homeTop"),summary:document.getElementById("summary"),plateTitle:document.getElementById("plateTitle"),plateViz:document.getElementById("plateViz"),vegHint:document.getElementById("vegHint"),carbHint:document.getElementById("carbHint"),protHint:document.getElementById("protHint"),carbNormal:document.getElementById("carbNormal"),carbLeg:document.getElementById("carbLeg"),protNormal:document.getElementById("protNormal"),protLeg:document.getElementById("protLeg"),boxa:document.getElementById("boxa"),boxLegCarb:document.getElementById("boxLegCarb"),boxp:document.getElementById("boxp"),boxLegProt:document.getElementById("boxLegProt"),preIdeas:document.getElementById("preIdeas"),preIdeaList:document.getElementById("preIdeaList"),preComboList:document.getElementById("preComboList"),adviceFab:document.getElementById("adviceFab"),adviceModal:document.getElementById("adviceModal"),menuIdeas:document.getElementById("menuIdeas"),cookingMethods:document.getElementById("cookingMethods"),adviceSnacks:document.getElementById("adviceSnacks"),advicePreIdeas:document.getElementById("advicePreIdeas"),advicePreCombos:document.getElementById("advicePreCombos"),portionEditor:document.getElementById("portionEditor"),portionError:document.getElementById("portionError"),portionVeg:document.getElementById("portionVeg"),portionCarb:document.getElementById("portionCarb"),portionProt:document.getElementById("portionProt")
};
