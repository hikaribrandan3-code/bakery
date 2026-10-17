import {useEffect,useState,lazy,Suspense} from 'react';
import {Routes,Route,useLocation,Link} from 'react-router-dom';
import {Wheat} from 'lucide-react';
import {StoreProvider} from './lib/store';
import {Header,Dock,Footer,Brand,ActionLink} from './components/ui';
import QuickAdd from './components/QuickAdd';
import {Home,Catalog,Categories,ProductDetail,BoxBuilder,Contact} from './pages';
import {Cart,Fulfillment,CustomerDetails,Confirmation} from './checkout';
const Admin=lazy(()=>import('./admin'));
export default function App(){return <StoreProvider><Shell/></StoreProvider>;}
function Shell(){const location=useLocation(),admin=location.pathname.startsWith('/admin'),home=location.pathname==='/',[splash,setSplash]=useState(()=>{try{return !sessionStorage.getItem('miga-visited')&&!admin;}catch{return false;}});
 useEffect(()=>{if(!splash)return;const timer=setTimeout(()=>{setSplash(false);try{sessionStorage.setItem('miga-visited','1');}catch{}},1100);return()=>clearTimeout(timer);},[splash]);
 useEffect(()=>{window.scrollTo(0,0);document.title=admin?'MIGA · El estudio del horno':'MIGA · Panadería & Pastelería';},[location.pathname,admin]);
 if(splash)return <div className="splash" role="status"><Wheat size={37} strokeWidth={1.1}/><Brand/><p>Las cosas buenas llevan su tiempo.</p><div className="loading-line"><i/></div></div>;
 return <div className={'app '+(home?'home-shell ':'')+(admin?'admin-mode':'')}><a href="#main" className="skip-link">Ir al contenido</a>{!admin&&!home&&<Header/>}{!admin&&home&&<div className="home-desktop-header"><Header/></div>}<main id="main" key={location.pathname} className="main"><Suspense fallback={<div className="route-loading"><Wheat size={30}/><p>Preparando algo rico…</p></div>}><Routes><Route path="/" element={<Home/>}/><Route path="/productos" element={<Catalog/>}/><Route path="/catalogo" element={<Catalog/>}/><Route path="/categorias" element={<Categories/>}/><Route path="/producto/:id" element={<ProductDetail/>}/><Route path="/box" element={<BoxBuilder/>}/><Route path="/carrito" element={<Cart/>}/><Route path="/entrega" element={<Fulfillment/>}/><Route path="/datos" element={<CustomerDetails/>}/><Route path="/confirmacion" element={<Confirmation/>}/><Route path="/contacto" element={<Contact/>}/><Route path="/admin/*" element={<Admin/>}/><Route path="*" element={<div className="page not-found"><Wheat size={35}/><h1>Por acá no salió del horno.</h1><p>Pero tenemos algo rico para vos.</p><ActionLink to="/">Volver a MIGA</ActionLink></div>}/></Routes></Suspense></main>{!admin&&<><Footer/><Dock/><QuickAdd/></>}{admin&&<div className="admin-credit"><a href="https://hikari-brandan.vercel.app/" target="_blank" rel="noreferrer">Hikari Studio ↗</a></div>}</div>;
}
