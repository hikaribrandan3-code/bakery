import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { products, categories, boxFlavors, defaultSettings, schedule, normalizePhone, orderMessage } from '../shared/catalog.mjs';
export class StoreError extends Error {constructor(message,status=400){super(message);this.status=status;}}
export function createStore({dataDir=process.env.MIGA_DATA_DIR||'.data',now=()=>new Date()}={}){
 mkdirSync(resolve(dataDir),{recursive:true}); const db=new DatabaseSync(resolve(dataDir,'miga.sqlite'));
 db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
 CREATE TABLE IF NOT EXISTS products(id TEXT PRIMARY KEY,data TEXT NOT NULL,stock INTEGER NOT NULL CHECK(stock>=0));
 CREATE TABLE IF NOT EXISTS settings(id INTEGER PRIMARY KEY CHECK(id=1),data TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS customers(phone TEXT PRIMARY KEY,name TEXT NOT NULL,points INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY,request_key TEXT UNIQUE NOT NULL,phone TEXT NOT NULL REFERENCES customers(phone),data TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',created_at TEXT NOT NULL);
 CREATE INDEX IF NOT EXISTS orders_phone ON orders(phone);
 CREATE TABLE IF NOT EXISTS rewards(order_id TEXT PRIMARY KEY REFERENCES orders(id),phone TEXT NOT NULL REFERENCES customers(phone),points INTEGER NOT NULL);`);
 for(const p of products)db.prepare('INSERT OR IGNORE INTO products VALUES(?,?,?)').run(p.id,JSON.stringify(p),p.stock);
 db.prepare('INSERT OR IGNORE INTO settings VALUES(1,?)').run(JSON.stringify(defaultSettings));
 const getProducts=()=>db.prepare('SELECT data,stock FROM products').all().map(r=>({...JSON.parse(r.data),stock:r.stock}));
 const getSettings=()=>({...JSON.parse(db.prepare('SELECT data FROM settings WHERE id=1').get().data),...(process.env.MIGA_WHATSAPP?{whatsapp:process.env.MIGA_WHATSAPP.replace(/\D/g,'')}:{})});
 const getOrder=r=>({...JSON.parse(r.data),status:r.status});
 const fail=(condition,message,status)=>{if(!condition)throw new StoreError(message,status);};
 function createOrder(input){
  fail(input&&typeof input==='object','Pedido inválido.');
  fail(typeof input.requestKey==='string'&&/^[\w-]{8,80}$/.test(input.requestKey),'Identificador de pedido inválido.');
  const previous=db.prepare('SELECT * FROM orders WHERE request_key=?').get(input.requestKey);
  if(previous){const saved=getOrder(previous);fail(saved.phone===normalizePhone(input.phone),'No pudimos recuperar este pedido.',409);return saved;}
  const name=String(input.name||'').trim(),phone=normalizePhone(input.phone);
  fail(name.length>=2&&name.length<=80,'Completá tu nombre (2 a 80 caracteres).');
  fail(/^\d{10,15}$/.test(phone),'Ingresá un WhatsApp válido con código de país.');
  fail(['pickup','delivery'].includes(input.method),'Elegí cómo querés recibirlo.');
  const address=input.method==='delivery'?String(input.address||'').trim():'';
  fail(input.method!=='delivery'||address.length>=8&&address.length<=240,'Completá calle, número y barrio para el delivery.');
  fail(typeof input.notes==='string'&&input.notes.length<=500,'La nota debe tener hasta 500 caracteres.');
  const settings=getSettings(), available=schedule(settings,now());
  fail(available.some(d=>d.date===input.date&&d.slots.includes(input.time)),'Ese horario ya no está disponible. Elegí otro.');
  fail(Array.isArray(input.items)&&input.items.length>0&&input.items.length<=30,'Tu pedido debe tener entre 1 y 30 productos.');
  const catalog=getProducts(),requested=new Map();
  const items=input.items.map(line=>{
   const p=catalog.find(p=>p.id===line.id);fail(p,'Este producto ya no está disponible.');
   fail(Number.isInteger(line.qty)&&line.qty>=1&&line.qty<=30,'Cantidad inválida.');
   requested.set(p.id,(requested.get(p.id)||0)+line.qty);
   const raw=line.selection||{},selection={};let price=p.price,detail='';
   if(p.kind==='cake'){
    const option=p.options.find(o=>o.id===raw.size);fail(option,'Elegí el tamaño de tu torta.');
    const message=String(raw.message||'').trim();fail(message.length<=50,'El mensaje de la torta debe tener hasta 50 caracteres.');
    selection.size=option.id;selection.message=message;selection.candles=raw.candles===true;
    price=option.price+(selection.candles?1200:0);detail=`${option.label}${message?' · “'+message+'”':''}${selection.candles?' · Velitas':''}`;
   } else if(p.kind==='box'){
    const flavors=raw.flavors;fail(flavors&&typeof flavors==='object'&&!Array.isArray(flavors),'Elegí los sabores de tu box.');
    const entries=Object.entries(flavors);fail(entries.length>0&&entries.every(([id,q])=>boxFlavors.some(f=>f.id===id)&&Number.isInteger(q)&&q>0&&q<=settings.boxSize),'Sabores inválidos.');
    fail(entries.reduce((s,[,q])=>s+q,0)===settings.boxSize,`Tu box necesita ${settings.boxSize} unidades.`);
    selection.flavors=Object.fromEntries(entries);price=settings.boxPrice;detail=entries.map(([id,q])=>`${q} ${boxFlavors.find(f=>f.id===id).label}`).join(', ');
   }
   return{id:p.id,title:p.title,image:p.image,qty:line.qty,price,detail,selection};
  });
  for(const [id,qty] of requested)fail(catalog.find(p=>p.id===id).stock>=qty,`No quedan suficientes unidades de ${catalog.find(p=>p.id===id).title}. Revisá tu carrito.`,409);
  const subtotal=items.reduce((s,i)=>s+i.qty*i.price,0),deliveryFee=input.method==='delivery'?settings.deliveryFee:0,total=subtotal+deliveryFee;
  const points=Math.floor(subtotal/settings.pointsPerPeso),id=randomUUID(),createdAt=now().toISOString();
  db.exec('BEGIN IMMEDIATE');
  try{
   db.prepare('INSERT INTO customers(phone,name,points,created_at) VALUES(?,?,0,?) ON CONFLICT(phone) DO UPDATE SET name=excluded.name').run(phone,name,createdAt);
   db.prepare('UPDATE customers SET points=points+? WHERE phone=?').run(points,phone);
   const pointsBalance=db.prepare('SELECT points FROM customers WHERE phone=?').get(phone).points;
   const number='M-'+id.slice(0,6).toUpperCase();
   const order={id,number,name,phone,items,method:input.method,address,date:input.date,time:input.time,notes:input.notes,subtotal,deliveryFee,total,points,pointsBalance,status:'pending',createdAt};
   order.whatsappUrl=/^\d{10,15}$/.test(settings.whatsapp)?`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(orderMessage(order,settings))}`:null;
   db.prepare('INSERT INTO orders VALUES(?,?,?,?,?,?)').run(id,input.requestKey,phone,JSON.stringify(order),'pending',createdAt);
   db.prepare('INSERT INTO rewards VALUES(?,?,?)').run(id,phone,points);
   for(const [productId,qty] of requested){const result=db.prepare('UPDATE products SET stock=stock-? WHERE id=? AND stock>=?').run(qty,productId,qty);fail(result.changes===1,'El stock cambió. Revisá tu carrito.',409);}
   db.exec('COMMIT');return order;
  }catch(e){db.exec('ROLLBACK');throw e;}
 }
 return {db,getProducts,getSettings,createOrder,
  catalog:()=>({products:getProducts(),categories,boxFlavors,settings:getSettings(),schedule:schedule(getSettings(),now())}),
  rewards:(phone)=>({points:db.prepare('SELECT points FROM customers WHERE phone=?').get(normalizePhone(phone))?.points||0}),
  admin:()=>({orders:db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 200').all().map(getOrder),customers:db.prepare('SELECT * FROM customers ORDER BY created_at DESC LIMIT 200').all(),products:getProducts(),settings:getSettings()}),
  updateProduct:(id,patch)=>{
   const product=getProducts().find(p=>p.id===id);fail(product,'Producto no encontrado.',404);
   fail(Number.isInteger(patch.stock)&&patch.stock>=0&&patch.stock<=10000,'Stock inválido.');fail(Number.isInteger(patch.price)&&patch.price>=100&&patch.price<=1000000,'Precio inválido.');
   fail(typeof patch.title==='string'&&patch.title.trim().length>=2&&patch.title.length<=100,'Nombre inválido.');
   const updated={...product,title:patch.title.trim(),price:patch.price,stock:patch.stock};
   db.prepare('UPDATE products SET data=?,stock=? WHERE id=?').run(JSON.stringify(updated),patch.stock,id);return updated;
  },
  updateSettings:(patch)=>{
   const previous=getSettings(),settings={...previous};
   for(const field of ['whatsapp','address','hours','instagram','deliveryArea']){if(field in patch){fail(typeof patch[field]==='string'&&patch[field].length<=240,'Configuración inválida.');settings[field]=patch[field];}}
   settings.whatsapp=settings.whatsapp.replace(/\D/g,'');fail(!settings.whatsapp||/^\d{10,15}$/.test(settings.whatsapp),'El WhatsApp debe incluir código de país.');
   for(const field of ['deliveryFee','pointsPerPeso','boxPrice'])if(field in patch){fail(Number.isInteger(patch[field])&&patch[field]>=(field==='deliveryFee'?0:1)&&patch[field]<=1000000,'Importe inválido.');settings[field]=patch[field];}
   db.prepare('UPDATE settings SET data=? WHERE id=1').run(JSON.stringify(settings));return settings;
  },
  updateStatus:(id,status)=>{
   fail(['pending','confirmed','fulfilled','cancelled'].includes(status),'Estado inválido.');const row=db.prepare('SELECT * FROM orders WHERE id=?').get(id);fail(row,'Pedido no encontrado.',404);
   fail(row.status!=='cancelled'||status==='cancelled','Un pedido cancelado no se puede reabrir.');
   db.exec('BEGIN IMMEDIATE');try{
    if(status==='cancelled'&&row.status!=='cancelled'){
     const order=getOrder(row);for(const line of order.items)db.prepare('UPDATE products SET stock=stock+? WHERE id=?').run(line.qty,line.id);
     db.prepare('UPDATE customers SET points=MAX(0,points-?) WHERE phone=?').run(order.points,row.phone);
    }
    db.prepare('UPDATE orders SET status=? WHERE id=?').run(status,id);db.exec('COMMIT');return{ok:true};
   }catch(e){db.exec('ROLLBACK');throw e;}
  },close:()=>db.close()};
}
