import {useEffect,useRef,useState} from 'react';
import {X,ArrowRight} from 'lucide-react';
import {useStore} from '../lib/store';
import {Photo,Quantity} from './ui';
import {money} from '../../shared/catalog.mjs';
export default function QuickAdd(){const{quick,setQuick,add,items}=useStore();const [qty,setQty]=useState(1);const dialog=useRef<HTMLDialogElement>(null),lastFocus=useRef<HTMLElement|null>(null);
 useEffect(()=>{if(quick){setQty(1);lastFocus.current=document.activeElement as HTMLElement;dialog.current?.showModal();document.body.style.overflow='hidden';}else{dialog.current?.close();document.body.style.overflow='';lastFocus.current?.focus();}return()=>{document.body.style.overflow='';};},[quick]);
 const available=quick?Math.max(0,quick.stock-items.filter(i=>i.product.id===quick.id).reduce((s,i)=>s+i.qty,0)):0;
 return <dialog ref={dialog} className="quick-dialog" aria-labelledby="quick-title" onCancel={()=>setQuick(null)} onClick={e=>{if(e.target===e.currentTarget)setQuick(null);}}>{quick&&<div className="quick-content"><div className="sheet-handle"/><div className="quick-photo"><Photo id={quick.image} alt={quick.title} eager/><button className="icon-button" aria-label="Cerrar" onClick={()=>setQuick(null)}><X size={20}/></button></div><div className="quick-info"><p className="eyebrow">UN PEQUEÑO ANTOJO</p><h2 id="quick-title">{quick.title}</h2><p>{quick.description}</p><strong className="quick-price">{money(quick.price)}</strong><Quantity value={qty} onChange={setQty} max={Math.min(30,available)} label={quick.title}/><button className="button" disabled={!available} onClick={()=>{if(add(quick,qty))setQuick(null);}}>Agregar {qty} · {money(quick.price*qty)}<ArrowRight size={18}/></button><small className="allergens">{quick.allergens}</small></div></div>}</dialog>;
}
