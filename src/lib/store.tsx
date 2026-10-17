import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import { products as initialProducts,categories,defaultSettings,boxFlavors,schedule } from '../../shared/catalog.mjs';
import type {Product,Settings,CartItem,Selection} from './types';
export async function api<T=any>(path:string,options:RequestInit={}):Promise<T>{const response=await fetch('/api'+path,{...options,headers:{'Content-Type':'application/json',...options.headers}});const data=await response.json();if(!response.ok)throw new Error(data.error||'No pudimos conectar con MIGA.');return data;}
function readSaved<T>(key:string,fallback:T):T{try{return JSON.parse(localStorage.getItem(key)||'null')??fallback;}catch{return fallback;}}
export function saveLocal(key:string,value:unknown){try{localStorage.setItem(key,JSON.stringify(value));}catch{/* The cart remains usable in memory. */}}
export function itemKey(id:string,selection:Selection={}){return id+'::'+JSON.stringify({...selection,flavors:selection.flavors?Object.fromEntries(Object.entries(selection.flavors).sort(([a],[b])=>a.localeCompare(b))):undefined});}
function readCart():CartItem[]{const saved=readSaved<unknown>('miga-cart-v1',[]);return Array.isArray(saved)?saved.filter(i=>i?.product&&initialProducts.some(p=>p.id===i.product.id)&&Number.isInteger(i.qty)&&i.qty>0&&i.qty<=30&&Number.isFinite(i.price)&&i.price>0):[];}
type Context={products:Product[];settings:Settings;days:ReturnType<typeof schedule>;categories:typeof categories;flavors:typeof boxFlavors;loading:boolean;error:string;refresh:()=>Promise<void>;items:CartItem[];add:(p:Product,qty:number,selection?:Selection,price?:number,detail?:string)=>boolean;setQty:(key:string,qty:number)=>void;remove:(key:string)=>void;clear:()=>void;count:number;total:number;quick:Product|null;setQuick:(p:Product|null)=>void;notify:(message:string)=>void};
const Ctx=createContext<Context|null>(null);
export function StoreProvider({children}:{children:ReactNode}){
 const [products,setProducts]=useState(initialProducts),[settings,setSettings]=useState(defaultSettings),[days,setDays]=useState(schedule()),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const [items,setItems]=useState<CartItem[]>(readCart),[quick,setQuick]=useState<Product|null>(null),[message,setMessage]=useState('');
 async function refresh(){try{const data=await api('/catalog');setProducts(data.products);setSettings(data.settings);setDays(data.schedule);setError('');}catch(e){setError('No pudimos actualizar la disponibilidad. Intentá de nuevo.');}finally{setLoading(false);}}
 useEffect(()=>{void refresh();const tick=window.setInterval(()=>void refresh(),60000);return()=>clearInterval(tick);},[]);
 useEffect(()=>saveLocal('miga-cart-v1',items),[items]);
 useEffect(()=>{if(!message)return;const id=setTimeout(()=>setMessage(''),3000);return()=>clearTimeout(id);},[message]);
 function add(p:Product,qty:number,selection:Selection={},price=p.price,detail=''){
  const used=items.filter(i=>i.product.id===p.id).reduce((s,i)=>s+i.qty,0);if(qty+used>p.stock){setMessage(`Quedan ${p.stock} unidades de ${p.title}.`);return false;}
  const key=itemKey(p.id,selection);setItems(current=>{const existing=current.find(i=>i.key===key);return existing?current.map(i=>i.key===key?{...i,qty:i.qty+qty}:i):[...current,{key,product:p,selection,qty,price,detail}];});setMessage('Agregado a tu pedido. ¡Qué buena elección!');return true;
 }
 function setQty(key:string,qty:number){setItems(current=>{const item=current.find(i=>i.key===key);if(!item)return current;const p=products.find(p=>p.id===item.product.id);const others=current.filter(i=>i.product.id===item.product.id&&i.key!==key).reduce((s,i)=>s+i.qty,0);return current.map(i=>i.key===key?{...i,qty:Math.max(0,Math.min(30,(p?.stock??0)-others,qty))}:i).filter(i=>i.qty>0);});}
 return <Ctx.Provider value={{products,settings,days,categories,flavors:boxFlavors,loading,error,refresh,items,add,setQty,remove:key=>setItems(a=>a.filter(i=>i.key!==key)),clear:()=>setItems([]),count:items.reduce((s,i)=>s+i.qty,0),total:items.reduce((s,i)=>s+i.qty*i.price,0),quick,setQuick,notify:setMessage}}>{children}{message&&<div className="toast" role="status">{message}</div>}</Ctx.Provider>;
}
export function useStore(){const value=useContext(Ctx);if(!value)throw new Error('StoreProvider is required');return value;}
export {readSaved};
