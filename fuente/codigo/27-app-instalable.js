// Mi Plato Fácil · Modo app instalable y sin conexión (manifiesto y service worker).
// Parte 28: los archivos se unen en orden según su número, que define el orden de arranque.
(function(){
  if(!/^https?:$/.test(location.protocol))return;const where=document.getElementById("deploymentWhere");if(where)where.textContent="Estás usando la versión publicada en "+location.host+location.pathname.replace(/index\.html$/,"")+". Se puede instalar y usar sin conexión.";const add=(rel,href,type)=>{
    const l=document.createElement("link");l.rel=rel;l.href=href;if(type)l.type=type;document.head.append(l)
  };add("manifest","manifest.webmanifest");add("icon","icon-192.png","image/png");add("apple-touch-icon","icon-192.png");if(!("serviceWorker" in navigator))return;const swUrl=new URL("sw.js",location.href).href,ctl=navigator.serviceWorker.controller,hadController=!!ctl&&ctl.scriptURL===swUrl,status=t=>{
    const s=document.getElementById("installAppStatus");if(s)s.textContent=t
  };navigator.serviceWorker.register("sw.js").then(()=>status("Lista para usar sin conexión en este dispositivo. Si tu navegador lo permite, vas a ver el botón Instalar aplicación.")).catch(()=>status("No se pudo activar el modo sin conexión en este navegador."));navigator.serviceWorker.addEventListener("controllerchange",()=>{
    if(!hadController||document.getElementById("appUpdateNotice"))return;const box=ce("p","notice"),b=ce("button","filter-chip","Recargar");box.id="appUpdateNotice";box.setAttribute("role","status");box.style.margin="0 0 12px";box.append(document.createTextNode("Hay una versión nueva de la app. "));b.type="button";b.addEventListener("click",()=>location.reload());box.append(b);const main=document.getElementById("appMain");main.insertBefore(box,main.firstChild)
  })
})();
