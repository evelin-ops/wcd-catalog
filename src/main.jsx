import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Search, ShoppingCart, FileText, Package, Flame} from 'lucide-react';
import './styles.css';

const products=[
{id:'000190',brand:'DEL FRUTAL',name:'Del Frutal Orange PET 500 ml',price:24,promo:'5 cajas + 1 caja gratis'},
{id:'000229',brand:'DE MI PAÍS',name:'Leche de Coco Guanábana',price:25,promo:'Precio de promoción'},
{id:'000713',brand:'RAPTOR',name:'Raptor Lava 473 ml',price:60.14,promo:'Compra 4 cajas y recibe 1 gratis'}
];

function ProductCard({p}){return <article className="card">
<div className="img"><Package size={58}/><span>Imagen desde Supabase</span></div>
<div className="content"><span className="brandname">{p.brand}</span><h3>{p.name}</h3>
<p>ITEM # {p.id}</p><div className="promo">{p.promo}</div>
<div className="price">${p.price.toFixed(2)}</div><button>Agregar al pedido</button></div></article>}

function App(){
const [q,setQ]=useState('');
const filtered=products.filter(p=>`${p.brand} ${p.name} ${p.id}`.toLowerCase().includes(q.toLowerCase()));
return <div>
<header><div className="brand"><img src="/wcd-logo.png"/><div><strong>WCD Marketplace</strong><span>Productos que te conectan con tu tierra</span></div></div>
<nav><a href="#inicio">Inicio</a><a href="#productos">Productos</a><a href="#pdf">Catálogo PDF</a><button className="cart"><ShoppingCart size={18}/> Mi pedido</button></nav></header>
<main>
<section id="inicio" className="hero"><div><span className="eyebrow">PLATAFORMA DIGITAL WCD</span><h1>Encuentra productos y prepara tu pedido fácilmente.</h1><p>Busca por nombre, marca, ITEM # o descripción.</p><a className="primary" href="#productos">Explorar productos</a></div>
<div className="heroCard"><Package size={52}/><strong>WCD Marketplace 2.0</strong><span>GitHub + Cloudflare listos</span></div></section>

<section className="section"><span className="eyebrow"><Flame size={16}/> PROMOCIONES</span><h2>Promociones destacadas</h2>
<div className="grid">{products.map(p=><ProductCard key={p.id} p={p}/>)}</div></section>

<section id="productos" className="section"><span className="eyebrow">CATÁLOGO</span><h2>Todos los productos</h2>
<label className="search"><Search size={20}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar producto, marca o ITEM #..."/></label>
<div className="grid">{filtered.map(p=><ProductCard key={p.id} p={p}/>)}</div></section>

<section id="pdf" className="pdf"><FileText size={40}/><div><h2>Catálogo PDF</h2><p>Se conectará desde Supabase Storage en la siguiente etapa.</p></div></section>
</main><footer>© 2026 World Connect Distribution · WCD Marketplace</footer>
</div>}
createRoot(document.getElementById('root')).render(<App/>);
