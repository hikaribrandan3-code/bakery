export const categories = [
 {id:'facturas',label:'Facturas',description:'Capas de felicidad, recién horneadas.',image:'hero'},
 {id:'alfajores',label:'Alfajores',description:'Dulce de leche. Y mucho amor.',image:'alfajor'},
 {id:'cookies',label:'Cookies',description:'Crocantes afuera. Increíbles adentro.',image:'cookie'},
 {id:'tortas',label:'Tortas',description:'Para los momentos que se celebran.',image:'cake'},
 {id:'boxes',label:'Boxes',description:'Un poquito de todo lo que te gusta.',image:'box'}
];
export const products = [
 {id:'croissant-pistacho',title:'Croissant de Pistacho',short:'Crema de pistacho',category:'facturas',price:4500,image:'hero',stock:18,badge:'EL FAVORITO',description:'Masa madre, 72 horas de paciencia y manteca de verdad. Relleno de crema de pistacho, con pistachos tostados por encima.',allergens:'Contiene gluten, lácteos, huevo y frutos secos.',kind:'simple'},
 {id:'cookie-chocolate',title:'Cookie Chocolate Chunk',short:'Chocolate semi amargo',category:'cookies',price:3200,image:'cookie',stock:25,badge:'RECIÉN SALIDAS',description:'Bordes dorados, centro suave y generosos trozos de chocolate. Nuestra receta para una tarde un poco más linda.',allergens:'Contiene gluten, lácteos, huevo y soja.',kind:'simple'},
 {id:'alfajor-clasico',title:'Alfajor Clásico',short:'Dulce de leche artesanal',category:'alfajores',price:2800,image:'alfajor',stock:30,badge:null,description:'Tapitas suaves, dulce de leche repostero y una receta que no necesita nada más.',allergens:'Contiene gluten, lácteos y huevo.',kind:'simple'},
 {id:'cinnamon-roll',title:'Cinnamon Roll',short:'Canela & glaseado de vainilla',category:'facturas',price:4200,image:'roll',stock:5,badge:'ÚLTIMOS 5',description:'Un abrazo en forma de roll. Masa esponjosa, canela aromática y glaseado casero de vainilla.',allergens:'Contiene gluten, lácteos y huevo.',kind:'simple'},
 {id:'torta-chocolate',title:'Torta de Chocolate',short:'Para compartir y celebrar',category:'tortas',price:32000,image:'cake',stock:8,badge:'A TU MEDIDA',description:'Bizcochuelo húmedo de chocolate, corazón de dulce de leche y cobertura de ganache. Terminada a mano, para hacer especial cualquier día.',allergens:'Contiene gluten, lácteos, huevo y soja. Se elabora en un espacio que manipula frutos secos.',kind:'cake',options:[{id:'6',label:'6 personas',price:24000},{id:'10',label:'10 personas',price:32000},{id:'16',label:'16 personas',price:45000}]},
 {id:'box-artesanal',title:'Tu Box MIGA',short:'12 favoritos, elegidos por vos',category:'boxes',price:24000,image:'box',stock:12,badge:'ARMALA VOS',description:'Para regalar, compartir o quedártela. Combiná doce de nuestros pequeños favoritos y hacemos el resto.',allergens:'Contiene gluten, lácteos, huevo y frutos secos.',kind:'box'},
 {id:'alfajor-chocolate',title:'Alfajor de Chocolate',short:'Baño de chocolate semi amargo',category:'alfajores',price:3000,image:'alfajor',stock:16,badge:null,description:'Nuestro clásico con un baño de chocolate intenso. Un pequeño ritual de felicidad.',allergens:'Contiene gluten, lácteos, huevo y soja.',kind:'simple'},
 {id:'cookie-pistacho',title:'Cookie de Pistacho',short:'Chocolate blanco & pistacho',category:'cookies',price:3800,image:'cookie',stock:0,badge:'VUELVE MAÑANA',description:'Cookie de manteca con pistachos y trozos de chocolate blanco.',allergens:'Contiene gluten, lácteos, huevo y frutos secos.',kind:'simple'}
];
export const boxFlavors = [
 {id:'clasico',label:'Clásico',category:'alfajores',image:'alfajor'},
 {id:'chocolate',label:'Chocolate',category:'alfajores',image:'alfajor',tone:'chocolate'},
 {id:'pistacho',label:'Pistacho',category:'alfajores',image:'alfajor',tone:'pistacho'},
 {id:'coco',label:'Coco',category:'alfajores',image:'alfajor',tone:'coco'},
 {id:'blanco',label:'Chocolate blanco',category:'alfajores',image:'alfajor',tone:'coco'},
 {id:'frutos-rojos',label:'Frutos rojos',category:'alfajores',image:'alfajor',tone:'berry'},
 {id:'cookie-mini',label:'Choco Chunk',category:'cookies',image:'cookie'},
 {id:'cookie-vainilla',label:'Vainilla',category:'cookies',image:'cookie',tone:'coco'},
 {id:'roll-mini',label:'Mini Roll',category:'facturas',image:'roll'},
 {id:'croissant-mini',label:'Mini Croissant',category:'facturas',image:'hero'}
];
export const defaultSettings = {name:'MIGA',tagline:'Panadería & Pastelería',neighborhood:'Nueva Córdoba',address:'Av. Hipólito Yrigoyen 123, Córdoba',hours:'Todos los días · 08:00 a 20:00',whatsapp:'',instagram:'',deliveryFee:1800,deliveryArea:'Nueva Córdoba y Güemes',pointsPerPeso:1000,boxSize:12,boxPrice:24000,openHour:8,closeHour:20,timezone:'America/Argentina/Cordoba'};
export const money = value => '$' + Math.round(value).toLocaleString('es-AR');
export function localDay(date=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:defaultSettings.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(date)}
export function schedule(settings=defaultSettings,now=new Date()){
 const today=localDay(now), clock=new Intl.DateTimeFormat('en-GB',{timeZone:settings.timezone,hour:'2-digit',minute:'2-digit',hour12:false}).format(now).split(':').map(Number);
 const minutes=clock[0]*60+clock[1]+45, days=[];
 for(let n=0;n<4;n++){
  const date=new Date(today+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+n);const key=date.toISOString().slice(0,10),slots=[];
  for(let minute=settings.openHour*60;minute<=settings.closeHour*60-30;minute+=30)if(n>0||minute>=minutes)slots.push(`${String(Math.floor(minute/60)).padStart(2,'0')}:${String(minute%60).padStart(2,'0')}`);
  if(slots.length)days.push({date:key,label:n===0?'Hoy':n===1?'Mañana':new Intl.DateTimeFormat('es-AR',{weekday:'short',timeZone:'UTC'}).format(date),detail:new Intl.DateTimeFormat('es-AR',{day:'numeric',month:'short',timeZone:'UTC'}).format(date),slots});
 }
 return days.slice(0,3);
}
export function normalizePhone(value){const digits=String(value||'').replace(/\D/g,'');return digits.length===10?'549'+digits:digits.startsWith('54')&&digits.length===12?'549'+digits.slice(2):digits;}
export function orderMessage(order,settings=defaultSettings){return `Hola ${settings.name} 👋\nQuiero realizar este pedido:\n\n${order.items.map(i=>`${i.qty}× ${i.title}${i.detail?' ('+i.detail+')':''} — ${money(i.qty*i.price)}`).join('\n')}\n\n${order.method==='pickup'?'Retiro en local':'Delivery · '+order.address}\n${order.date} — ${order.time}\n\nNombre: ${order.name}\nTeléfono: +${order.phone}${order.notes?'\nNota: '+order.notes:''}\n\nSubtotal: ${money(order.subtotal)}${order.deliveryFee?'\nDelivery: '+money(order.deliveryFee):''}\nTotal: ${money(order.total)}\nPedido ${order.number}\n\nPedido generado desde MIGA.`;}
