import { timingSafeEqual } from 'node:crypto';
import { createStore, StoreError } from './store.mjs';
export function migaApi({development=false,dataDir}={}){
 const store=createStore({dataDir});const buckets=new Map();
 function authorized(req){const secret=process.env.MIGA_ADMIN_TOKEN;if(!secret){const ip=String(req.socket.remoteAddress||'');return development&&(ip==='127.0.0.1'||ip==='::1'||ip==='::ffff:127.0.0.1');}const given=String(req.headers.authorization||'').replace(/^Bearer /,'');return secret.length>=20&&given.length===secret.length&&timingSafeEqual(Buffer.from(given),Buffer.from(secret));}
 return async(req,res,next)=>{
  const url=new URL(req.url,'http://localhost');if(!url.pathname.startsWith('/api/'))return next();
  res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  const send=(status,body)=>{res.statusCode=status;res.end(JSON.stringify(body));};
  try{
   if(req.headers.origin){const origin=new URL(req.headers.origin);if(origin.host!==req.headers.host)throw new StoreError('Origen no permitido.',403);}
   const ip=req.socket.remoteAddress||'local',time=Date.now(),key=ip+':'+url.pathname;
   if(buckets.size>5000)for(const[k,v]of buckets)if(time-v.start>60000)buckets.delete(k);
   const bucket=buckets.get(key)||{start:time,count:0};if(time-bucket.start>60000){bucket.start=time;bucket.count=0;}bucket.count++;buckets.set(key,bucket);
   if(bucket.count>(req.method==='POST'?20:120))throw new StoreError('Esperá un momento antes de intentar de nuevo.',429);
   let body={};if(['POST','PATCH'].includes(req.method)){
    let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>32000)throw new StoreError('El pedido es demasiado grande.',413);}
    try{body=JSON.parse(raw);}catch{throw new StoreError('Datos inválidos.');}
   }
   if(req.method==='GET'&&url.pathname==='/api/catalog')return send(200,{...store.catalog(),demo:!store.getSettings().whatsapp});
   if(req.method==='POST'&&url.pathname==='/api/orders')return send(201,store.createOrder(body));
   if(req.method==='POST'&&url.pathname==='/api/rewards'){if(!/^\d{10,15}$/.test(String(body.phone).replace(/\D/g,'')))throw new StoreError('Teléfono inválido.');return send(200,store.rewards(body.phone));}
   if(url.pathname.startsWith('/api/admin')){
    if(!authorized(req))throw new StoreError('Ingresá la clave de administración.',401);
    if(req.method==='GET'&&url.pathname==='/api/admin')return send(200,store.admin());
    if(req.method==='PATCH'&&url.pathname==='/api/admin/settings')return send(200,store.updateSettings(body));
    const product=url.pathname.match(/^\/api\/admin\/products\/([\w-]+)$/);if(req.method==='PATCH'&&product)return send(200,store.updateProduct(product[1],body));
    const order=url.pathname.match(/^\/api\/admin\/orders\/([\w-]+)$/);if(req.method==='PATCH'&&order)return send(200,store.updateStatus(order[1],body.status));
   }
   send(404,{error:'No encontramos esa ruta.'});
  }catch(error){const status=error instanceof StoreError?error.status:500;if(status===500)console.error(error);send(status,{error:status===500?'No pudimos guardar tu pedido. Intentá de nuevo.':error.message});}
 };
}
