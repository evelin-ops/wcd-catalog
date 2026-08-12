import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  FileText,
  Package,
  X,
  Flame,
  Copy,
  MessageCircle,
  Trash2,
  ArrowLeft,
  LayoutDashboard, Boxes, UploadCloud, Images, Tags, BadgePercent,
  SlidersHorizontal, Users, ShieldCheck, Settings, DatabaseBackup, Menu,
  ChevronRight, CheckCircle2, AlertTriangle, Clock3, LogOut, Eye, ArrowUpDown,
  Sparkles, Grid3X3, Save, CalendarDays, Link2,
} from 'lucide-react';
import { supabase } from './supabase';
import './styles.css';

function formatProduct(row) {
  return {
    id: row.item_number,
    brand: row.brand || 'SIN MARCA',
    name:
      row.item_code ||
      row.description ||
      `Producto ${row.item_number}`,
    code: row.item_code || '',
    desc: row.description || '',
    price: Number(row.price || 0),
    promo:
      row.promo_active && row.promo_price !== null
        ? Number(row.promo_price)
        : null,
    promoText: row.promo_active ? row.promo_text : null,
    cat: row.section || row.category || 'Otros',
    image: row.image_url || null,
    createdAt: row.created_at || null,
  };
}

function Card({ p, onAdd }) {
  const [quantity, setQuantity] = useState(1);

  return (
    <article className="card">
      <div className="media">
        {p.promoText && (
          <span className="badge">PROMOCIÓN</span>
        )}

        {p.image ? (
          <img
            src={p.image}
            alt={p.name}
            loading="lazy"
            decoding="async"
            style={{
              width: '100%',
              height: '230px',
              objectFit: 'contain',
              padding: '18px',
            }}
          />
        ) : (
          <div className="ph">
            <Package size={58} />
            <span>Imagen no disponible</span>
          </div>
        )}
      </div>

      <div className="body">
        <span className="brandName">{p.brand}</span>
        <h3>{p.name}</h3>

        <div className="meta">
          ITEM # {p.id}
          <br />
          {p.code}
        </div>

        <p>{p.desc}</p>

        {p.promoText && (
          <div className="promoText">{p.promoText}</div>
        )}

        <div className="prices">
          <div>
            <small>Precio regular</small>
            <strong>${p.price.toFixed(2)}</strong>
          </div>

          {p.promo !== null && (
            <div className="promoPrice">
              <small>Precio promoción</small>
              <strong>${p.promo.toFixed(2)}</strong>
            </div>
          )}
        </div>

        <div className="actions">
          <div className="qty">
            <button
              onClick={() =>
                setQuantity(Math.max(1, quantity - 1))
              }
            >
              <Minus size={16} />
            </button>

            <span>{quantity}</span>

            <button
              onClick={() => setQuantity(quantity + 1)}
            >
              <Plus size={16} />
            </button>
          </div>

          <button
            className="add"
            onClick={() => onAdd(p, quantity)}
          >
            <ShoppingCart size={16} />
            Agregar
          </button>
        </div>
      </div>
    </article>
  );
}

const SELLERS = ['Mara', 'Tulio', 'Viviana', 'Martin', 'Hortencia', 'Janeth'];

const WCD_SECTION_COLORS = ['#ff9500', '#0268df', '#35cf00', '#b11eb8', '#db0087'];
const DEFAULT_HERO_SETTINGS = {
  eyebrow: 'WCD MARKETPLACE',
  title: 'Encuentra productos y prepara tu pedido en minutos.',
  description: 'Consulta precios, promociones y presentaciones desde cualquier dispositivo.',
  primaryText: 'Explorar productos',
  secondaryText: 'Ver promociones',
  primaryUrl: '#productos',
  secondaryUrl: '#promociones',
  cardText: 'Catálogo digital y pedidos',
  cardImage: '/wcd-logo.png',
};

const DEFAULT_NEW_PRODUCTS_SETTINGS = {
  enabled: true,
  title: 'Productos nuevos',
  limit: 12,
  selectedCodes: [],
};

const DEFAULT_FEATURED_PROMOTIONS_SETTINGS = {
  enabled: true,
  title: 'Promociones destacadas',
  limit: 3,
  selectedCodes: [],
};

const DEFAULT_HOME_PROMOTIONS = [
  { id: 1, active: true, title: 'Promociones WCD', description: 'Descubre ofertas especiales seleccionadas para tu negocio.', buttonText: 'Ver promociones', buttonUrl: '#promociones', imageUrl: '/wcd-logo.png', color: '#0268df', startDate: '', endDate: '' },
  { id: 2, active: true, title: 'Productos centroamericanos', description: 'Encuentra marcas y sabores que conectan con nuestra tierra.', buttonText: 'Comprar ahora', buttonUrl: '#productos', imageUrl: '/wcd-logo.png', color: '#ff9500', startDate: '', endDate: '' },
  { id: 3, active: true, title: 'Catálogo para tu tienda', description: 'Prepara tu pedido de manera rápida y sencilla.', buttonText: 'Explorar catálogo', buttonUrl: '#productos', imageUrl: '/wcd-logo.png', color: '#db0087', startDate: '', endDate: '' },
];

function readLocalSettings(key, defaults) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null');
    return saved ? { ...defaults, ...saved } : defaults;
  } catch {
    return defaults;
  }
}
async function getCloudSetting(key, fallback) {
  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();

  if (error) {
    console.error(`Error cargando ${key}:`, error);
    return fallback;
  }

  return data?.value ?? fallback;
}

async function saveCloudSetting(key, value) {
  const { error } = await supabase
    .from('site_settings')
    .upsert(
      {
        key,
        value,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'key',
      }
    );

  if (error) {
    throw error;
  }
}

function getSavedNewProductsSettings() {
  return readLocalSettings('wcd_new_products_settings', DEFAULT_NEW_PRODUCTS_SETTINGS);
}

function getSavedFeaturedPromotionsSettings() {
  return readLocalSettings(
    'wcd_featured_promotions_settings',
    DEFAULT_FEATURED_PROMOTIONS_SETTINGS
  );
}

function getSavedHomePromotions() {
  try {
    const saved = JSON.parse(localStorage.getItem('wcd_home_promotions') || 'null');
    return Array.isArray(saved) && saved.length ? saved : DEFAULT_HOME_PROMOTIONS;
  } catch {
    return DEFAULT_HOME_PROMOTIONS;
  }
}

const CATEGORY_ICONS = {
  Package,
  ShoppingCart,
  Tags,
  Boxes,
  FileText,
  BadgePercent,
  Sparkles,
  Grid3X3,
};
const CATEGORY_ICON_NAMES = Object.keys(CATEGORY_ICONS);

function getSavedCategorySettings() {
  try {
    return JSON.parse(localStorage.getItem('wcd_category_settings') || '{}') || {};
  } catch {
    return {};
  }
}

function getSavedHeroSettings() {
  try {
    return { ...DEFAULT_HERO_SETTINGS, ...JSON.parse(localStorage.getItem('wcd_hero_settings') || '{}') };
  } catch {
    return DEFAULT_HERO_SETTINGS;
  }
}

function App() {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('Todos');
  const [cart, setCart] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [databaseError, setDatabaseError] = useState('');
  const [visibleProducts, setVisibleProducts] = useState(24);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const [orderType, setOrderType] = useState('cliente');
  const [customerName, setCustomerName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [phone, setPhone] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [notes, setNotes] = useState('');
  const [heroSettings, setHeroSettings] = useState(getSavedHeroSettings);
  const [newProductsSettings, setNewProductsSettings] = useState(getSavedNewProductsSettings);
  const [homePromotions] = useState(getSavedHomePromotions);
  const [featuredPromotionsSettings, setFeaturedPromotionsSettings,] = useState(getSavedFeaturedPromotionsSettings);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [categorySettings] = useState(getSavedCategorySettings);
  const [currentView, setCurrentView] = useState(() => {
    if (window.location.hash === '#promociones') return 'promotions';
    if (window.location.hash === '#productos') return 'products';
    return 'home';
  });

  const wcdWhatsAppNumber =
    import.meta.env.VITE_WCD_WHATSAPP_NUMBER || '';

    const catalogPdfUrl =
    import.meta.env.VITE_CATALOG_PDF_URL || '';

  useEffect(() => {
   async function loadSharedHomeSettings() {
    setSettingsLoading(true);

    try {
      const [
        cloudHeroSettings,
        cloudNewProducts,
        cloudFeaturedPromotions,
       ] = await Promise.all([
       getCloudSetting(
         'hero_settings',
         getSavedHeroSettings()
       ),
       getCloudSetting(
         'new_products_settings',
         getSavedNewProductsSettings()
       ),
       getCloudSetting(
         'featured_promotions_settings',
         getSavedFeaturedPromotionsSettings()
       ),
     ]);

      setHeroSettings(cloudHeroSettings);
      setNewProductsSettings(cloudNewProducts);
      setFeaturedPromotionsSettings(cloudFeaturedPromotions);
    } catch (error) {
      console.error(
        'Error cargando configuración del Home:',
        error
      );
    } finally {
      setSettingsLoading(false);
    }
  }

  loadSharedHomeSettings();
}, []);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      setDatabaseError('');

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true })
        .order('item_number', { ascending: true });

      if (error) {
        console.error('Error de Supabase:', error);
        setDatabaseError(error.message);
        setProducts([]);
      } else {
        setProducts((data || []).map(formatProduct));
      }

      setLoading(false);
    }

    loadProducts();
  }, []);

const cats = useMemo(() => {
  const productCategories = products
    .map((product) => product.cat)
    .filter(Boolean);

  const sortedCategories = [...new Set(productCategories)]
    .sort((a, b) =>
      String(a).localeCompare(String(b), 'es', {
        sensitivity: 'base',
      })
    );

  return ['Todos', ...sortedCategories];
}, [products]);

const filtered = useMemo(() => {
  const text = query.toLowerCase().trim();

  return products
    .filter((product) => {
      const matchesCategory =
        cat === 'Todos' || product.cat === cat;

      const searchable = `
        ${product.brand || ''}
        ${product.name || ''}
        ${product.id || ''}
        ${product.code || ''}
        ${product.desc || ''}
      `.toLowerCase();

      return (
        matchesCategory &&
        searchable.includes(text)
      );
    })
    .sort((a, b) =>
      String(a.name || a.desc || '').localeCompare(
        String(b.name || b.desc || ''),
        'es',
        {
          sensitivity: 'base',
        }
      )
    );
}, [products, query, cat]);

const displayedProducts = filtered.slice(
  0,
  visibleProducts
);

useEffect(() => {
  setVisibleProducts(24);
}, [query, cat]);

const promotions = products
  .filter((product) => product.promoText)
  .sort((a, b) =>
    String(a.name || a.desc || '').localeCompare(
      String(b.name || b.desc || ''),
      'es',
      {
        sensitivity: 'base',
      }
    )
  );


  const newProducts = useMemo(() => {
    const selected = (newProductsSettings.selectedCodes || []).map((code) => String(code).trim()).filter(Boolean);
    if (selected.length) {
      const orderMap = new Map(selected.map((code, index) => [code.toLowerCase(), index]));
      return products
        .filter((product) => [product.id, product.code].some((value) => orderMap.has(String(value || '').toLowerCase())))
        .sort((a, b) => {
          const aIndex = Math.min(...[a.id, a.code].map((value) => orderMap.get(String(value || '').toLowerCase()) ?? 9999));
          const bIndex = Math.min(...[b.id, b.code].map((value) => orderMap.get(String(value || '').toLowerCase()) ?? 9999));
          return aIndex - bIndex;
        })
        .slice(0, Math.max(1, Number(newProductsSettings.limit) || 12));
    }
    return [];
  }, [products, newProductsSettings]);

  const featuredPromotions = useMemo(() => {
  const selected = (featuredPromotionsSettings.selectedCodes || [])
    .map((code) => String(code).trim().toLowerCase())
    .filter(Boolean);

  if (!selected.length) {
    return [];
  }

  const orderMap = new Map(
    selected.map((code, index) => [code, index])
  );

  return promotions
    .filter((product) =>
      [product.id, product.code].some((value) =>
        orderMap.has(String(value || '').toLowerCase())
      )
    )
    .sort((a, b) => {
      const aIndex = Math.min(
        ...[a.id, a.code].map(
          (value) =>
            orderMap.get(String(value || '').toLowerCase()) ?? 9999
        )
      );

      const bIndex = Math.min(
        ...[b.id, b.code].map(
          (value) =>
            orderMap.get(String(value || '').toLowerCase()) ?? 9999
        )
      );

      return aIndex - bIndex;
    })
    .slice(
      0,
      Math.max(
        1,
        Number(featuredPromotionsSettings.limit) || 3
      )
    );
  }, [promotions, featuredPromotionsSettings]);

  const activeHomePromotions = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return homePromotions.filter((promo) => promo.active !== false && (!promo.startDate || promo.startDate <= today) && (!promo.endDate || promo.endDate >= today)).slice(0, 3);
  }, [homePromotions]);

  function navigateTo(view, category = 'Todos') {
    setCurrentView(view);
    if (view === 'products') {
      setCat(category);
      window.location.hash = 'productos';
    } else if (view === 'promotions') {
      window.location.hash = 'promociones';
    } else {
      window.location.hash = 'inicio';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function add(product, quantity) {
    setCart((currentCart) => {
      const existing = currentCart.find(
        (item) => item.id === product.id
      );

      if (existing) {
        return currentCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                qty: item.qty + quantity,
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          ...product,
          qty: quantity,
        },
      ];
    });

    setCheckoutOpen(false);
    setOpen(true);
  }

  function changeCartQuantity(id, quantity) {
    if (quantity <= 0) {
      setCart((current) => current.filter((item) => item.id !== id));
      return;
    }

    setCart((current) =>
      current.map((item) =>
        item.id === id ? { ...item, qty: quantity } : item
      )
    );
  }

  function removeCartItem(id) {
    setCart((current) => current.filter((item) => item.id !== id));
  }

  const count = cart.reduce(
    (total, item) => total + item.qty,
    0
  );

  const estimatedTotal = cart.reduce((total, item) => {
    const unitPrice = item.promo !== null ? item.promo : item.price;
    return total + unitPrice * item.qty;
  }, 0);

  function buildOrderMessage() {
    const lines = [
      '*WORLD CONNECT DISTRIBUTION*',
      '*WCD Marketplace — Solicitud de pedido*',
      '',
      `Tipo: ${orderType === 'cliente' ? 'Cliente' : 'Vendedor'}`,
      orderType === 'vendedor' && sellerName ? `Vendedor: ${sellerName}` : null,
      customerName ? `Contacto: ${customerName}` : null,
      storeName ? `Tienda: ${storeName}` : null,
      phone ? `Teléfono: ${phone}` : null,
      '',
      '*PRODUCTOS*',
      ...cart.flatMap((item) => {
        const selectedPrice = 
         item.promo !== null ? item.promo : item.price;
        return [
          `*Cantidad:* ${item.qty}`,
          `${item.name}`,
          `$${selectedPrice.toFixed(2)}`,
          '',
        ];
      }),
      '',
      `*Cantidad total:* ${count}`,
      `*Total estimado:* $${estimatedTotal.toFixed(2)}`,
      notes ? '' : null,
      notes ? '*Notas:*' : null,
      notes || null,
      '',
      '_Pedido sujeto a confirmación de disponibilidad y precio._',
    ];
    return lines.filter((line) => line !== null).join('\n');
  }

  function validateOrder() {
    if (cart.length === 0) {
      alert('Agrega al menos un producto al pedido.');
      return false;
    }
    if (!storeName.trim()) {
      alert('Escribe el nombre de la tienda.');
      return false;
    }
    if (orderType === 'vendedor' && !sellerName) {
      alert('Selecciona el nombre del vendedor.');
      return false;
    }
    return true;
  }

  async function copyOrder() {
    if (!validateOrder()) return;
    try {
      await navigator.clipboard.writeText(buildOrderMessage());
      setCopyStatus('Pedido copiado');
      setTimeout(() => setCopyStatus(''), 2500);
    } catch {
      alert('No se pudo copiar automáticamente.');
    }
  }

  function openWhatsApp() {
    if (!validateOrder()) return;
    const message = encodeURIComponent(buildOrderMessage());

    if (orderType === 'cliente') {
      const cleanNumber = wcdWhatsAppNumber.replace(/\D/g, '');
      if (!cleanNumber) {
        alert('Falta configurar el número general de WCD en .env.local.');
        return;
      }
      window.open(`https://wa.me/${cleanNumber}?text=${message}`, '_blank', 'noopener,noreferrer');
      return;
    }

    window.open(`https://wa.me/?text=${message}`, '_blank', 'noopener,noreferrer');
  }

  return (
    <>
      <header>
        <a className="brand" href="#inicio" onClick={(event) => { event.preventDefault(); navigateTo('home'); }}>
          <img src="/wcd-logo.png" alt="WCD" />

          <div>
            <strong>WCD Marketplace</strong>
            <span>
              Productos que te conectan con tu tierra
            </span>
          </div>
        </a>

        <nav>
          <a href="#inicio" onClick={(event) => { event.preventDefault(); navigateTo('home'); }}>Inicio</a>
          <a href="#promociones" onClick={(event) => { event.preventDefault(); navigateTo('promotions'); }}>Promociones</a>
          <a href="#productos" onClick={(event) => { event.preventDefault(); navigateTo('products'); }}>Productos</a>
          
          <a
            href={catalogPdfUrl || '#pdf'}
            target={catalogPdfUrl ? '_blank' : undefined}
            rel={catalogPdfUrl ? 'noopener noreferrer' : undefined}
          >
            Catálogo PDF
          </a>
        </nav>

        <button
          className="cartBtn"
          onClick={() => setOpen(true)}
        >
          <ShoppingCart size={18} />
          Mi pedido
          {count > 0 && <b>{count}</b>}
        </button>
      </header>

      <main>
        {currentView === 'home' && (
          <>
        <section id="inicio" className="hero">
          <div>
            <span className="eyebrow">
              {heroSettings.eyebrow}
            </span>

            <h1>{heroSettings.title}</h1>

            <p>{heroSettings.description}</p>

            <div className="heroBtns">
              <a href="#productos" className="primary" onClick={(event) => { event.preventDefault(); navigateTo('products'); }}>
                {heroSettings.primaryText}
              </a>

              <a href="#promociones" className="secondary" onClick={(event) => { event.preventDefault(); navigateTo('promotions'); }}>
                {heroSettings.secondaryText}
              </a>
            </div>
          </div>

          <div className="heroCard">
            <img src={heroSettings.cardImage || '/wcd-logo.png'} alt="WCD" onError={(event) => { event.currentTarget.src = '/wcd-logo.png'; }} />
            <span>{heroSettings.cardText}</span>
          </div>
        </section>

        <section className="searchBar">
          <Search size={20} />

          <input
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="Buscar por producto, marca, ITEM # o descripción..."
          />

          <a href="#productos" onClick={(event) => { event.preventDefault(); navigateTo('products'); }}>Buscar</a>
        </section>
          </>
)}

        {databaseError && (
          <section className="section">
            <div
              style={{
                padding: '18px',
                borderRadius: '12px',
                background: '#fff0f3',
                color: '#9c1535',
              }}
            >
              <strong>
                No se pudieron cargar los productos.
              </strong>
              <p>{databaseError}</p>
            </div>
          </section>
        )}

        {currentView === 'home' && (
          <>
            {newProductsSettings.enabled && (
              <section id="productos-nuevos" className="section homeNewProducts">
                <span className="label"><Sparkles size={16} /> SELECCIÓN NUEVA</span>
                <div className="sectionTop">
                  <div>
                    <h2>{newProductsSettings.title || 'Productos nuevos'}</h2>
                    <p className="sub">Productos elegidos desde el Panel Administrativo.</p>
                  </div>
                  <button className="sectionLink linkButton" onClick={() => navigateTo('products')}>Ver todos</button>
                </div>
                {loading || settingsLoading ? <p>Cargando productos nuevos...</p> : newProducts.length ? (
                  <div className="grid">
                    {newProducts.map((product) => <Card key={`new-${product.id}`} p={product} onAdd={add} />)}
                  </div>
                ) : (
                  <p className="sub">Selecciona los productos nuevos desde el Panel Administrativo usando su código o ITEM #.</p>
                )}
              </section>
            )}

            <section id="promos-destacadas" className="section">
              <span className="label"><Flame size={16} /> OFERTAS ACTIVAS</span>
              <div className="sectionTop">
                <div><h2>Promociones destacadas</h2><p className="sub">Una selección de ofertas vigentes para tu negocio.</p></div>
                <button className="sectionLink linkButton" onClick={() => navigateTo('promotions')}>Ver todas</button>
              </div>
              {loading || settingsLoading ? <p>Cargando promociones...</p> : featuredPromotions.length > 0 ? (
                <div className="grid">{featuredPromotions.map((product) => (<Card key={product.id} p={product}onAdd={add} />))}</div>
                ) : (<p className="sub">No hay promociones destacadas seleccionadas.</p>)}
            </section>

            <section id="secciones" className="section categoryShowcase">
              <span className="label"><Grid3X3 size={16} /> SECCIONES DEL CATÁLOGO</span>
              <h2>Compra por categoría</h2>
              <p className="sub">Selecciona una categoría para ver únicamente sus productos.</p>
              <div className="categoryIconGrid">
                {cats.filter((category) => category !== 'Todos').map((category, index) => {
                  const setting = categorySettings[category] || {};
                  const Icon = CATEGORY_ICONS[setting.icon] || CATEGORY_ICONS[CATEGORY_ICON_NAMES[index % CATEGORY_ICON_NAMES.length]];
                  const color = setting.color || WCD_SECTION_COLORS[index % WCD_SECTION_COLORS.length];
                  return <button key={`category-${category}`} onClick={() => navigateTo('products', category)} style={{ '--category-color': color }}><span><Icon size={30} /></span><strong>{category}</strong><small>Ver productos</small></button>;
                })}
              </div>
            </section>
          </>
        )}

        {currentView === 'promotions' && (
          <section id="promociones" className="section allPromotionsSection standaloneView">
            <button className="backHomeButton" onClick={() => navigateTo('home')}><ArrowLeft size={18} /> Volver al inicio</button>
            <span className="label"><BadgePercent size={16} /> TODAS LAS PROMOCIONES</span>
            <h2>Promociones disponibles</h2>
            <p className="sub">Consulta todas las ofertas activas del Marketplace.</p>
            {loading ? <p>Cargando promociones...</p> : promotions.length > 0 ? (
              <div className="grid">{promotions.map((product) => <Card key={`promo-${product.id}`} p={product} onAdd={add} />)}</div>
            ) : <p className="sub">No hay promociones activas actualmente.</p>}
          </section>
        )}

        {currentView === 'products' && (
          <section id="productos" className="section standaloneView">
            <button className="backHomeButton" onClick={() => navigateTo('home')}><ArrowLeft size={18} /> Volver al inicio</button>
            <div className="sectionTop">
              <div><span className="label">CATÁLOGO WCD</span><h2>{cat === 'Todos' ? 'Todos los productos' : cat}</h2><p className="sub">{loading ? 'Cargando productos...' : `${filtered.length} productos encontrados.`}</p></div>
              <label className="smallSearch"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar productos..." /></label>
            </div>
            <div className="tabs">
              {cats.map((category, index) => <button className={cat === category ? 'active' : ''} onClick={() => setCat(category)} key={category} style={{ '--category-color': (categorySettings[category]?.color || WCD_SECTION_COLORS[index % WCD_SECTION_COLORS.length]), '--category-text': '#ffffff' }}>{category}</button>)}
            </div>
            {!loading && filtered.length > 0 && <><div className="grid">{displayedProducts.map((product) => <Card key={product.id} p={product} onAdd={add} />)}</div>{displayedProducts.length < filtered.length && <div className="loadMoreWrap"><button className="primary loadMoreButton" onClick={() => setVisibleProducts((current) => current + 24)}>Ver más productos</button></div>}</>}
            {!loading && filtered.length === 0 && <div className="empty"><Package size={52} /><h3>No encontramos productos</h3><p>Prueba con otra categoría o búsqueda.</p></div>}
          </section>
        )}
      </main>

      <footer>
        <img src="/wcd-logo.png" alt="WCD" />

        <div>
          <strong>World Connect Distribution</strong>
          <span>
            Productos que te conectan con tu tierra
          </span>
        </div>

        <p>© 2026 WCD Marketplace</p>
      </footer>

      <div
        className={open ? 'overlay show' : 'overlay'}
        onClick={() => setOpen(false)}
      />

      <aside className={open ? 'drawer open' : 'drawer'}>
        <div className="drawerHead">
          <div>
            <span>MI PEDIDO</span>
            <h2>{count} Seleccionadas</h2>
          </div>

          <button onClick={() => setOpen(false)}>
            <X />
          </button>
        </div>

        <div className="drawerBody">
          {!checkoutOpen ? (
            <>
              {cart.length === 0 ? (
                <div className="empty">
                  <ShoppingCart size={48} />
                  <h3>Tu pedido está vacío</h3>
                  <p>Agrega productos para comenzar.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div className="cartProduct" key={item.id}>
                    <div className="cartProductInfo">
                      <strong>{item.name}</strong>
                      <span>ITEM # {item.id}</span>
                    </div>
                    <div className="cartProductActions">
                      <button type="button" onClick={() => changeCartQuantity(item.id, item.qty - 1)}><Minus size={15} /></button>
                      <b>{item.qty}</b>
                      <button type="button" onClick={() => changeCartQuantity(item.id, item.qty + 1)}><Plus size={15} /></button>
                      <button type="button" className="removeCartItem" onClick={() => removeCartItem(item.id)}><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))
              )}
            </>
          ) : (
            <div className="orderForm">
              <button type="button" className="backToCart" onClick={() => setCheckoutOpen(false)}><ArrowLeft size={17} />Volver al pedido</button>
              <h3>Datos del pedido</h3>

              <div className="orderTypeOptions">
                <label><input type="radio" name="orderType" value="cliente" checked={orderType === 'cliente'} onChange={() => setOrderType('cliente')} />Cliente</label>
                <label><input type="radio" name="orderType" value="vendedor" checked={orderType === 'vendedor'} onChange={() => setOrderType('vendedor')} />Vendedor</label>
              </div>

              {orderType === 'vendedor' && (
                <label className="formField">
                  <span>Vendedor *</span>
                  <select value={sellerName} onChange={(event) => setSellerName(event.target.value)}>
                    <option value="">Selecciona un vendedor</option>
                    {SELLERS.map((seller) => <option key={seller} value={seller}>{seller}</option>)}
                  </select>
                </label>
              )}

              <label className="formField"><span>Nombre de la tienda *</span><input value={storeName} onChange={(event) => setStoreName(event.target.value)} placeholder="Ej. El Perico Market" /></label>
              <label className="formField"><span>Nombre del contacto</span><input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Nombre del cliente" /></label>
              <label className="formField"><span>Teléfono</span><input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Número de teléfono" /></label>
              <label className="formField"><span>Notas</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Entrega, horario, instrucciones..." rows="4" /></label>

              <div className="orderSummaryBox">
                <div><span>Cantidad total</span><strong>{count}</strong></div>
                <div><span>Total estimado</span><strong>${estimatedTotal.toFixed(2)}</strong></div>
              </div>

              {copyStatus && <div className="copyStatus">{copyStatus}</div>}
            </div>
          )}
        </div>

        <div className="drawerFoot">
          {!checkoutOpen ? (
            <>
              <div className="drawerTotal"><span>Total estimado</span><strong>${estimatedTotal.toFixed(2)}</strong></div>
              <button disabled={cart.length === 0} onClick={() => setCheckoutOpen(true)}>Continuar pedido</button>
            </>
          ) : (
            <div className="whatsappActions">
              {orderType === 'vendedor' && (
                <button type="button" className="copyOrderButton" onClick={copyOrder}><Copy size={18} />Copiar pedido</button>
              )}
              <button type="button" className="whatsappButton" onClick={openWhatsApp}><MessageCircle size={19} />{orderType === 'cliente' ? 'Enviar pedido a WCD' : 'Abrir WhatsApp'}</button>
            </div>
          )}
          <small>El total es estimado y está sujeto a confirmación.</small>
        </div>
      </aside>
    </>
  );
}

const ADMIN_NAV = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Portada', icon: Images },
  { label: 'Productos nuevos', icon: Sparkles },
  { label: 'Promociones destacadas', icon: BadgePercent },
  { label: 'Secciones', icon: Grid3X3 },
  { label: 'Productos', icon: Boxes },
  { label: 'Importar Excel', icon: UploadCloud },
  { label: 'Imágenes de productos', icon: Images },
  { label: 'Marcas', icon: Tags },
  { label: 'Promociones', icon: BadgePercent },
  { label: 'Catálogo PDF', icon: FileText },
  { label: 'Niveles de precio', icon: SlidersHorizontal },
  { label: 'Vendedores', icon: Users },
  { label: 'Administradores', icon: ShieldCheck },
  { label: 'Configuración', icon: Settings },
  { label: 'Respaldos', icon: DatabaseBackup },
];

function AdminProducts() {
  const [rows, setRows] = useState([]);
  const [loadingRows, setLoadingRows] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchText, setSearchText] = useState('');
  const [brandFilter, setBrandFilter] = useState('Todas');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [brokenImages, setBrokenImages] = useState(() => new Set());
  const [page, setPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'item_number', direction: 'asc' });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [copyMessage, setCopyMessage] = useState('');
  const pageSize = 25;

  useEffect(() => {
    async function loadAdminProducts() {
      setLoadingRows(true);
      setErrorMessage('');
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('item_number', { ascending: true });

      if (error) {
        setErrorMessage(error.message);
        setRows([]);
      } else {
        setRows(data || []);
      }
      setLoadingRows(false);
    }
    loadAdminProducts();
  }, []);

  const brands = useMemo(() => ['Todas', ...new Set(rows.map((row) => row.brand).filter(Boolean).sort())], [rows]);
  const categories = useMemo(() => ['Todas', ...new Set(rows.map((row) => row.section || row.category).filter(Boolean).sort())], [rows]);

  const filteredRows = useMemo(() => {
    const needle = searchText.trim().toLowerCase();
    const filtered = rows.filter((row) => {
      const brand = row.brand || '';
      const category = row.section || row.category || '';
      const active = row.active !== false;
      const searchable = `${row.item_number || ''} ${row.item_code || ''} ${row.description || ''} ${brand} ${category}`.toLowerCase();
      const matchesStatus = statusFilter === 'Todos' || (statusFilter === 'Activos' ? active : !active);
      return (!needle || searchable.includes(needle)) &&
        (brandFilter === 'Todas' || brand === brandFilter) &&
        (categoryFilter === 'Todas' || category === categoryFilter) &&
        matchesStatus;
    });

    const getValue = (row) => {
      if (sortConfig.key === 'product') return row.item_code || row.description || '';
      if (sortConfig.key === 'category') return row.section || row.category || '';
      if (sortConfig.key === 'status') return row.active !== false ? 1 : 0;
      if (sortConfig.key === 'price') return Number(row.price || 0);
      return row[sortConfig.key] || '';
    };

    return [...filtered].sort((a, b) => {
      const left = getValue(a);
      const right = getValue(b);
      const comparison = typeof left === 'number' && typeof right === 'number'
        ? left - right
        : String(left).localeCompare(String(right), 'es', { numeric: true, sensitivity: 'base' });
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [rows, searchText, brandFilter, categoryFilter, statusFilter, sortConfig]);

  useEffect(() => setPage(1), [searchText, brandFilter, categoryFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const visibleRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);
  const missingImages = rows.filter((row) => !row.image_url || brokenImages.has(row.id || row.item_number)).length;
  const activeFilterCount = [searchText.trim(), brandFilter !== 'Todas', categoryFilter !== 'Todas', statusFilter !== 'Todos'].filter(Boolean).length;
  const clearFilters = () => {
    setSearchText('');
    setBrandFilter('Todas');
    setCategoryFilter('Todas');
    setStatusFilter('Todos');
  };
  const activeProducts = rows.filter((row) => row.active !== false).length;
  const toggleSort = (key) => setSortConfig((current) => ({ key, direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc' }));
  const copyItemNumber = async (itemNumber) => {
    try {
      await navigator.clipboard.writeText(itemNumber);
      setCopyMessage(`Artículo ${itemNumber} copiado`);
      window.setTimeout(() => setCopyMessage(''), 1800);
    } catch {
      setCopyMessage('No se pudo copiar');
    }
  };

  return (
    <div className="adminContent">
      <section className="productsToolbarCard">
        <div className="productsHeading">
          <div><span className="adminEyebrow">CATÁLOGO</span><h2>Productos</h2><p>Consulta los productos cargados en Supabase y detecta información pendiente.</p></div>
          <button className="adminPrimaryAction compact"><UploadCloud size={18} /> Importar Excel</button>
        </div>
        <div className="productMiniStats">
          <div><strong>{rows.length}</strong><span>Total</span></div>
          <div><strong>{activeProducts}</strong><span>Activos</span></div>
          <div><strong>{missingImages}</strong><span>Sin imagen</span></div>
          <div><strong>{filteredRows.length}</strong><span>Resultados</span></div>
        </div>
        <div className="productsFilters">
          <label className="filterField searchField"><span>Buscar producto</span><div className="adminSearch"><Search size={18} /><input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Código, producto, descripción o marca" /></div></label>
          <label className="filterField"><span>Marca</span><select value={brandFilter} onChange={(event) => setBrandFilter(event.target.value)}>{brands.map((brand) => <option key={brand} value={brand}>{brand === 'Todas' ? 'Todas las marcas' : brand}</option>)}</select></label>
          <label className="filterField"><span>Categoría</span><select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>{categories.map((category) => <option key={category} value={category}>{category === 'Todas' ? 'Todas las categorías' : category}</option>)}</select></label>
          <label className="filterField"><span>Estado</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="Todos">Todos los estados</option><option value="Activos">Activos</option><option value="Inactivos">Inactivos</option></select></label>
        </div>
        <div className="filterActions">
          <span>{activeFilterCount === 0 ? 'Sin filtros activos' : `${activeFilterCount} filtro${activeFilterCount === 1 ? '' : 's'} activo${activeFilterCount === 1 ? '' : 's'}`}</span>
          <button type="button" onClick={clearFilters} disabled={activeFilterCount === 0}>Limpiar filtros</button>
        </div>
      </section>

      <section className="adminTableCard">
        {loadingRows ? <div className="adminTableState">Cargando productos desde Supabase…</div> : errorMessage ? <div className="adminTableState error">No se pudieron cargar los productos: {errorMessage}</div> : (
          <>
            <div className="adminTableWrap">
              <table className="adminProductsTable">
                <thead><tr><th>Imagen</th><th><button className="sortButton" onClick={() => toggleSort('item_number')}>Artículo <ArrowUpDown size={13} /></button></th><th><button className="sortButton" onClick={() => toggleSort('product')}>Producto <ArrowUpDown size={13} /></button></th><th><button className="sortButton" onClick={() => toggleSort('brand')}>Marca <ArrowUpDown size={13} /></button></th><th><button className="sortButton" onClick={() => toggleSort('category')}>Categoría <ArrowUpDown size={13} /></button></th><th><button className="sortButton" onClick={() => toggleSort('price')}>Precio actual <ArrowUpDown size={13} /></button></th><th>Promoción</th><th><button className="sortButton" onClick={() => toggleSort('status')}>Estado <ArrowUpDown size={13} /></button></th><th>Acciones</th></tr></thead>
                <tbody>
                  {visibleRows.map((row) => {
                    const active = row.active !== false;
                    const category = row.section || row.category || 'Sin categoría';
                    return <tr key={row.id || row.item_number}>
                      <td>{row.image_url && !brokenImages.has(row.id || row.item_number) ? <img className="adminProductThumb" src={row.image_url} alt={row.item_code || row.description || row.item_number} onError={() => setBrokenImages((current) => { const next = new Set(current); next.add(row.id || row.item_number); return next; })} /> : <div className="adminProductPlaceholder" title="Imagen faltante o dañada"><Package size={20} /></div>}</td>
                      <td><strong>{row.item_number}</strong></td>
                      <td><div className="productCell"><strong>{row.item_code || row.description || 'Sin nombre'}</strong><span>{row.description || ''}</span></div></td>
                      <td>{row.brand || 'SIN MARCA'}</td>
                      <td><span className="softTag">{category}</span></td>
                      <td><strong>${Number(row.price || 0).toFixed(2)}</strong></td>
                      <td>{row.promo_active ? <span className="promoPill">Activa</span> : <span className="mutedText">No</span>}</td>
                      <td><span className={active ? 'statusPill active' : 'statusPill inactive'}>{active ? 'Activo' : 'Inactivo'}</span></td>
                      <td><div className="rowActions"><button type="button" title="Ver detalles" onClick={() => setSelectedProduct(row)}><Eye size={16} /></button><button type="button" title="Copiar artículo" onClick={() => copyItemNumber(row.item_number)}><Copy size={16} /></button></div></td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
            {visibleRows.length === 0 && <div className="adminTableState">No se encontraron productos con esos filtros.</div>}
            <div className="adminPagination"><span>Mostrando {visibleRows.length} de {filteredRows.length}</span><div><button disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Anterior</button><b>Página {page} de {totalPages}</b><button disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Siguiente</button></div></div>
          </>
        )}
      </section>
      {copyMessage && <div className="adminToast">{copyMessage}</div>}
      {selectedProduct && (
        <div className="productModalOverlay" onClick={() => setSelectedProduct(null)}>
          <section className="productModal" onClick={(event) => event.stopPropagation()}>
            <button className="productModalClose" onClick={() => setSelectedProduct(null)}><X size={20} /></button>
            <div className="productModalMedia">
              {selectedProduct.image_url && !brokenImages.has(selectedProduct.id || selectedProduct.item_number)
                ? <img src={selectedProduct.image_url} alt={selectedProduct.item_code || selectedProduct.description || selectedProduct.item_number} />
                : <div className="productModalPlaceholder"><Package size={48} /><span>Imagen no disponible</span></div>}
            </div>
            <div className="productModalBody">
              <span className="adminEyebrow">DETALLE DEL PRODUCTO</span>
              <h2>{selectedProduct.item_code || selectedProduct.description || 'Sin nombre'}</h2>
              <p>{selectedProduct.description || 'Sin descripción'}</p>
              <div className="productDetailGrid">
                <div><span>Artículo</span><strong>{selectedProduct.item_number}</strong></div>
                <div><span>Marca</span><strong>{selectedProduct.brand || 'SIN MARCA'}</strong></div>
                <div><span>Categoría</span><strong>{selectedProduct.section || selectedProduct.category || 'Sin categoría'}</strong></div>
                <div><span>Precio actual</span><strong>${Number(selectedProduct.price || 0).toFixed(2)}</strong></div>
                <div><span>Promoción</span><strong>{selectedProduct.promo_active ? 'Activa' : 'No'}</strong></div>
                <div><span>Estado</span><strong>{selectedProduct.active !== false ? 'Activo' : 'Inactivo'}</strong></div>
              </div>
              <div className="productModalActions"><button onClick={() => copyItemNumber(selectedProduct.item_number)}><Copy size={17} /> Copiar artículo</button><button className="secondaryModalButton" disabled title="Se habilitará con los permisos administrativos">Editar próximamente</button></div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function AdminHeroSettings() {
  const [draft, setDraft] = useState(getSavedHeroSettings);
  const [savedMessage, setSavedMessage] = useState('');

  function updateField(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function savePreview() {
    try {
      await saveCloudSetting(
      'hero_settings',
      draft
       );

      localStorage.setItem(
      'wcd_hero_settings',
      JSON.stringify(draft)
       );

      setSavedMessage(
      'Portada guardada en Supabase para todos los usuarios.'
       );
     } catch (error) {
       console.error(
        'Error guardando la portada:',
       error
     );

     setSavedMessage(
       `No se pudo guardar: ${error.message}`
     );
   }

    setTimeout(() => setSavedMessage(''), 2500);
 }

  function restoreDefaults() {
    setDraft(DEFAULT_HERO_SETTINGS);
    localStorage.setItem('wcd_hero_settings', JSON.stringify(DEFAULT_HERO_SETTINGS));
    setSavedMessage('Portada restaurada.');
    setTimeout(() => setSavedMessage(''), 2500);
  }

  return <div className="adminContent">
    <section className="adminPanelCard coverSettings">
      <div className="adminPanelHead"><div><span>CONFIGURACIÓN VISUAL</span><h3>Portada del Marketplace</h3></div><Images size={25} /></div>
      <p className="adminModuleIntro">Modifica textos y la imagen de la tarjeta principal. Los cambios se reflejan en esta versión de prueba. En la etapa de publicación final se conectarán a Supabase para que sean globales.</p>
      <div className="coverEditorGrid">
        <div className="coverForm">
          <label><span>Etiqueta superior</span><input value={draft.eyebrow} onChange={(e) => updateField('eyebrow', e.target.value)} /></label>
          <label><span>Título principal</span><textarea rows="3" value={draft.title} onChange={(e) => updateField('title', e.target.value)} /></label>
          <label><span>Descripción</span><textarea rows="3" value={draft.description} onChange={(e) => updateField('description', e.target.value)} /></label>
          <div className="coverTwoFields">
            <label><span>Botón principal</span><input value={draft.primaryText} onChange={(e) => updateField('primaryText', e.target.value)} /></label>
            <label><span>Enlace principal</span><input value={draft.primaryUrl || '#productos'} onChange={(e) => updateField('primaryUrl', e.target.value)} /></label>
            <label><span>Botón secundario</span><input value={draft.secondaryText} onChange={(e) => updateField('secondaryText', e.target.value)} /></label>
            <label><span>Enlace secundario</span><input value={draft.secondaryUrl || '#promociones'} onChange={(e) => updateField('secondaryUrl', e.target.value)} /></label>
          </div>
          <label><span>Texto de la tarjeta</span><input value={draft.cardText} onChange={(e) => updateField('cardText', e.target.value)} /></label>
          <label><span>URL de imagen o logo</span><input value={draft.cardImage} onChange={(e) => updateField('cardImage', e.target.value)} placeholder="/wcd-logo.png o URL pública" /></label>
          <div className="coverActions"><button className="adminPrimaryAction" onClick={savePreview}>Guardar vista previa</button><button className="coverReset" onClick={restoreDefaults}>Restaurar original</button></div>
          {savedMessage && <div className="coverSaved">{savedMessage}</div>}
        </div>
        <div className="coverPreview">
          <span>VISTA PREVIA</span>
          <div className="miniHero">
            <div><small>{draft.eyebrow}</small><h2>{draft.title}</h2><p>{draft.description}</p><div><b>{draft.primaryText}</b><b className="outline">{draft.secondaryText}</b></div></div>
            <article><img src={draft.cardImage || '/wcd-logo.png'} alt="Vista previa" onError={(event) => { event.currentTarget.src = '/wcd-logo.png'; }} /><strong>{draft.cardText}</strong></article>
          </div>
          <a className="previewMarketplaceLink" href="/" target="_blank" rel="noreferrer">Abrir Marketplace para revisar</a>
        </div>
      </div>
    </section>
  </div>;
}


function AdminNewProductsSettings() {
  const [draft, setDraft] = useState(getSavedNewProductsSettings);
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => {async function loadNewProductsAdmin() {
    const [
      productsResult,
      cloudSettings,
    ] = await Promise.all([
      supabase
        .from('products')
        .select(
          'item_number,item_code,description,brand'
        )
        .eq('active', true)
        .order('item_number'),

        getCloudSetting(
        'new_products_settings',
        getSavedNewProductsSettings()
      ),
    ]);

    setRows(productsResult.data || []);
    setDraft(cloudSettings);
  }

  loadNewProductsAdmin();
}, []);
  const selectedCodes = draft.selectedCodes || [];
  const matches = rows.filter((row) => `${row.item_number || ''} ${row.item_code || ''} ${row.description || ''} ${row.brand || ''}`.toLowerCase().includes(search.toLowerCase().trim())).slice(0, 12);
  function toggle(row) {
    const code = String(row.item_number || row.item_code || '').trim();
    const exists = selectedCodes.includes(code);
    setDraft({ ...draft, selectedCodes: exists ? selectedCodes.filter((item) => item !== code) : [...selectedCodes, code] });
  }
async function save() {
  const cleanSettings = {
    ...draft,
    limit: Number(draft.limit) || 12,
  };

  try {
    await saveCloudSetting(
      'new_products_settings',
      cleanSettings
    );

    localStorage.setItem(
      'wcd_new_products_settings',
      JSON.stringify(cleanSettings)
    );

    setDraft(cleanSettings);

    setMessage(
      'Productos Nuevos guardados en Supabase para todos los usuarios.'
    );
  } catch (error) {
    console.error(
      'Error guardando Productos Nuevos:',
      error
    );

    setMessage(
      `No se pudo guardar: ${error.message}`
    );
  }

  setTimeout(() => setMessage(''), 3500);
}
  return <div className="adminContent"><section className="adminPanelCard simpleSettingsCard">
    <div className="adminPanelHead"><div><span>HOME PROFESIONAL</span><h3>Productos Nuevos</h3></div><Sparkles size={25} /></div>
    <p className="adminModuleIntro">Elige manualmente qué productos aparecen como nuevos usando el ITEM #, código, nombre o marca.</p>
    <div className="settingsFormGrid">
      <label className="toggleSetting"><input type="checkbox" checked={draft.enabled} onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} /><span><strong>Mostrar sección</strong><small>Activa o desactiva Productos Nuevos en el Inicio.</small></span></label>
      <label><span>Título de la sección</span><input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label>
      <label><span>Cantidad máxima</span><input type="number" min="1" max="24" value={draft.limit} onChange={(e) => setDraft({ ...draft, limit: e.target.value })} /></label>
    </div>
    <label className="productPickerSearch"><span>Buscar producto por código, ITEM # o nombre</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ejemplo: 1025, Raptor o Glucosoral" /></label>
    <div className="productPickerList">{matches.map((row) => { const code = String(row.item_number || row.item_code || ''); const selected = selectedCodes.includes(code); return <button type="button" key={`${row.item_number}-${row.item_code}`} className={selected ? 'selected' : ''} onClick={() => toggle(row)}><span><strong>{row.item_code || row.description || 'Producto'}</strong><small>ITEM #{row.item_number} · {row.brand || 'Sin marca'}</small></span><b>{selected ? 'Seleccionado' : 'Agregar'}</b></button>; })}</div>
    <div className="selectedProductsSummary"><strong>Seleccionados: {selectedCodes.length}</strong>{selectedCodes.length > 0 && <button type="button" onClick={() => setDraft({ ...draft, selectedCodes: [] })}>Limpiar selección</button>}</div>
    <button className="adminPrimaryAction compact" onClick={save}><Save size={18} /> Guardar selección</button>{message && <div className="coverSaved">{message}</div>}
  </section></div>;
}
function AdminFeaturedPromotionsSettings() {
  const [draft, setDraft] = useState(
    getSavedFeaturedPromotionsSettings
  );
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPromotionsAdmin() {
       setLoading(true);

      try {
       const [
         productsResult,
         cloudSettings,
       ] = await Promise.all([
           supabase
           .from('products')
           .select(
             'item_number,item_code,description,brand,promo_active,promo_text'
           )
          .eq('active', true)
          .eq('promo_active', true)
          .order('item_number'),

          getCloudSetting(
           'featured_promotions_settings',
          getSavedFeaturedPromotionsSettings()
          ),
        ]);

        if (productsResult.error) {
          console.error(
           'Error cargando promociones destacadas:',
          productsResult.error
        );

        setRows([]);
       } else {
         setRows(productsResult.data || []);
       }

       setDraft(cloudSettings);
      } catch (error) {
        console.error(
         'Error cargando configuración de promociones:',
         error
        );

        setRows([]);
      } finally {
         setLoading(false);
      }
    }

     loadPromotionsAdmin();
  }, []);

  const selectedCodes = draft.selectedCodes || [];

  const matches = rows
    .filter((row) => {
      const searchableText = `
        ${row.item_number || ''}
        ${row.item_code || ''}
        ${row.description || ''}
        ${row.brand || ''}
        ${row.promo_text || ''}
      `.toLowerCase();

      return searchableText.includes(
        search.toLowerCase().trim()
      );
    })
    .slice(0, 20);

  function getProductCode(row) {
    return String(
      row.item_number || row.item_code || ''
    ).trim();
  }

  function toggle(row) {
    const code = getProductCode(row);
    if (!code) return;

    const exists = selectedCodes.includes(code);

    setDraft({
      ...draft,
      selectedCodes: exists
        ? selectedCodes.filter((item) => item !== code)
        : [...selectedCodes, code],
    });
  }

  async function save() {
    const cleanSettings = {
    ...draft,
    limit: Number(draft.limit) || 3,
    };

    try {
      await saveCloudSetting(
      'featured_promotions_settings',
      cleanSettings
      );

      localStorage.setItem(
      'wcd_featured_promotions_settings',
      JSON.stringify(cleanSettings)
      );

      setDraft(cleanSettings);

      setMessage(
        'Promociones destacadas guardadas en Supabase para todos los usuarios.'
      );
    } catch (error) {
      console.error(
      'Error guardando Promociones destacadas:',
      error
      );

      setMessage(
      `No se pudo guardar: ${error.message}`
      );
    }

    setTimeout(() => setMessage(''), 3500);
  }

  return (
    <div className="adminContent">
      <section className="adminPanelCard simpleSettingsCard">
        <div className="adminPanelHead">
          <div>
            <span>HOME PROFESIONAL</span>
            <h3>Promociones destacadas</h3>
          </div>

          <BadgePercent size={25} />
        </div>

        <p className="adminModuleIntro">
          Selecciona manualmente las promociones que aparecerán
          en la página de Inicio.
        </p>

        <div className="settingsFormGrid">
          <label className="toggleSetting">
            <input
              type="checkbox"
              checked={draft.enabled}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  enabled: event.target.checked,
                })
              }
            />

            <span>
              <strong>Mostrar sección</strong>
              <small>
                Activa o desactiva Promociones destacadas en
                Inicio.
              </small>
            </span>
          </label>

          <label>
            <span>Título de la sección</span>
            <input
              value={draft.title}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  title: event.target.value,
                })
              }
            />
          </label>

          <label>
            <span>Cantidad máxima</span>
            <input
              type="number"
              min="1"
              max="12"
              value={draft.limit}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  limit: event.target.value,
                })
              }
            />
          </label>
        </div>

        <label className="productPickerSearch">
          <span>
            Buscar promoción por código, ITEM #, producto o
            marca
          </span>

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Ejemplo: Raptor, 1025 o Glucosoral"
          />
        </label>

        {loading ? (
          <p>Cargando promociones activas...</p>
        ) : (
          <div className="productPickerList">
            {matches.map((row) => {
              const code = getProductCode(row);
              const selected = selectedCodes.includes(code);

              return (
                <button
                  type="button"
                  key={`${row.item_number}-${row.item_code}`}
                  className={selected ? 'selected' : ''}
                  onClick={() => toggle(row)}
                >
                  <span>
                    <strong>
                      {row.item_code ||
                        row.description ||
                        'Producto'}
                    </strong>

                    <small>
                      ITEM #{row.item_number} ·{' '}
                      {row.brand || 'Sin marca'}
                    </small>

                    {row.promo_text && (
                      <small>{row.promo_text}</small>
                    )}
                  </span>

                  <b>
                    {selected ? 'Seleccionado' : 'Agregar'}
                  </b>
                </button>
              );
            })}
          </div>
        )}

        {!loading && matches.length === 0 && (
          <p className="adminModuleIntro">
            No se encontraron productos con promoción activa.
          </p>
        )}

        <div className="selectedProductsSummary">
          <strong>
            Seleccionadas: {selectedCodes.length}
          </strong>

          {selectedCodes.length > 0 && (
            <button
              type="button"
              onClick={() =>
                setDraft({
                  ...draft,
                  selectedCodes: [],
                })
              }
            >
              Limpiar selección
            </button>
          )}
        </div>

        <button
          className="adminPrimaryAction compact"
          onClick={save}
        >
          <Save size={18} />
          Guardar selección
        </button>

        {message && (
          <div className="coverSaved">{message}</div>
        )}
      </section>
    </div>
  );
}

function AdminHomePromotions() {
  const [draft, setDraft] = useState(getSavedHomePromotions);
  const [message, setMessage] = useState('');
  function updatePromo(index, field, value) { setDraft((current) => current.map((promo, i) => i === index ? { ...promo, [field]: value } : promo)); }
  function save() { localStorage.setItem('wcd_home_promotions', JSON.stringify(draft)); setMessage('Promociones del Home guardadas.'); setTimeout(() => setMessage(''), 2500); }
  return <div className="adminContent"><section className="adminPanelCard promotionsAdminCard">
    <div className="adminPanelHead"><div><span>HOME PROFESIONAL</span><h3>Promociones principales</h3></div><BadgePercent size={25} /></div>
    <p className="adminModuleIntro">Configura hasta tres tarjetas promocionales con imagen, textos, color, enlace y vigencia.</p>
    <div className="promoAdminGrid">{draft.slice(0,3).map((promo,index)=><article className="promoAdminItem" key={promo.id}>
      <div className="promoAdminTitle"><strong>Promoción {index+1}</strong><label><input type="checkbox" checked={promo.active !== false} onChange={(e)=>updatePromo(index,'active',e.target.checked)} /> Activa</label></div>
      <label><span>Título</span><input value={promo.title} onChange={(e)=>updatePromo(index,'title',e.target.value)} /></label>
      <label><span>Descripción</span><textarea rows="3" value={promo.description} onChange={(e)=>updatePromo(index,'description',e.target.value)} /></label>
      <label><span>Imagen</span><input value={promo.imageUrl} onChange={(e)=>updatePromo(index,'imageUrl',e.target.value)} /></label>
      <div className="coverTwoFields"><label><span>Texto del botón</span><input value={promo.buttonText} onChange={(e)=>updatePromo(index,'buttonText',e.target.value)} /></label><label><span>Enlace</span><input value={promo.buttonUrl} onChange={(e)=>updatePromo(index,'buttonUrl',e.target.value)} /></label></div>
      <div className="coverTwoFields"><label><span>Color</span><input type="color" value={promo.color} onChange={(e)=>updatePromo(index,'color',e.target.value)} /></label><label><span>Inicio</span><input type="date" value={promo.startDate} onChange={(e)=>updatePromo(index,'startDate',e.target.value)} /></label></div>
      <label><span>Finalización</span><input type="date" value={promo.endDate} onChange={(e)=>updatePromo(index,'endDate',e.target.value)} /></label>
    </article>)}</div>
    <button className="adminPrimaryAction compact" onClick={save}><Save size={18} /> Guardar promociones</button>{message && <div className="coverSaved">{message}</div>}
  </section></div>;
}

function AdminSectionsPreview() {
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState(getSavedCategorySettings);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => { (async () => { const { data, error } = await supabase.from('products').select('section,category').eq('active', true); if (error) { setError(error.message); return; } setCategories([...new Set((data || []).map((row) => row.section || row.category).filter(Boolean))]); })(); }, []);
  function update(category, field, value) { setSettings((current) => ({ ...current, [category]: { ...(current[category] || {}), [field]: value } })); }
  function save() { localStorage.setItem('wcd_category_settings', JSON.stringify(settings)); setMessage('Íconos y colores guardados. Actualiza el Marketplace para ver los cambios.'); setTimeout(() => setMessage(''), 3500); }
  return <div className="adminContent"><section className="adminPanelCard simpleSettingsCard">
    <div className="adminPanelHead"><div><span>HOME PROFESIONAL</span><h3>Secciones del catálogo</h3></div><Grid3X3 size={25} /></div>
    <p className="adminModuleIntro">Cambia el ícono SVG y el color de cada categoría. Los nombres siguen generándose desde los productos importados.</p>
    {error ? <div className="coverSaved">No se pudieron cargar: {error}</div> : <div className="categorySettingsList">{categories.map((category, index) => { const current = settings[category] || {}; const iconName = current.icon || CATEGORY_ICON_NAMES[index % CATEGORY_ICON_NAMES.length]; const Icon = CATEGORY_ICONS[iconName]; const color = current.color || WCD_SECTION_COLORS[index % WCD_SECTION_COLORS.length]; return <article key={category}><span className="categorySettingsIcon" style={{ background: color }}><Icon size={27} /></span><strong>{category}</strong><label><span>Ícono SVG</span><select value={iconName} onChange={(e) => update(category, 'icon', e.target.value)}>{CATEGORY_ICON_NAMES.map((name) => <option key={name} value={name}>{name}</option>)}</select></label><label><span>Color</span><input type="color" value={color} onChange={(e) => update(category, 'color', e.target.value)} /></label></article>; })}</div>}
    <button className="adminPrimaryAction compact" onClick={save}><Save size={18} /> Guardar secciones</button>{message && <div className="coverSaved">{message}</div>}
  </section></div>;
}

function AdminPanel() {
  const [active, setActive] = useState('Dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const cards = [
    { label: 'Productos totales', value: '491', detail: '490 activos', icon: Boxes },
    { label: 'Promociones activas', value: '11', detail: 'Vigentes en el catálogo', icon: BadgePercent },
    { label: 'Nivel público', value: 'I9', detail: 'Visible para todos', icon: SlidersHorizontal },
    { label: 'Imágenes pendientes', value: '4', detail: 'Requieren revisión', icon: Images },
  ];
  return (
    <div className="adminShell">
      <aside className={menuOpen ? 'adminSidebar open' : 'adminSidebar'}>
        <div className="adminBrand"><img src="/wcd-logo.png" alt="WCD" /><div><strong>WCD Marketplace</strong><span>Panel Administrativo</span></div><button className="adminCloseMenu" onClick={() => setMenuOpen(false)}><X size={20} /></button></div>
        <nav className="adminNav">{ADMIN_NAV.map(({ label, icon: Icon }) => <button key={label} className={active === label ? 'active' : ''} onClick={() => { setActive(label); setMenuOpen(false); }}><Icon size={19} /><span>{label}</span>{active === label && <ChevronRight size={16} />}</button>)}</nav>
        <div className="adminSidebarFoot"><div className="adminUserAvatar">EV</div><div><strong>Evelin</strong><span>Administradora completa</span></div><button title="Cerrar sesión"><LogOut size={18} /></button></div>
      </aside>
      {menuOpen && <button className="adminMenuOverlay" aria-label="Cerrar menú" onClick={() => setMenuOpen(false)} />}
      <main className="adminMain">
        <header className="adminTopbar"><button className="adminMenuButton" onClick={() => setMenuOpen(true)}><Menu size={22} /></button><div><span>WCD MARKETPLACE ADMIN</span><h1>{active}</h1></div><a href="/" className="adminViewStore">Ver Marketplace</a></header>
        {active === 'Dashboard' ? <div className="adminContent">
          <section className="adminWelcome"><div><span className="adminEyebrow">CENTRO DE CONTROL</span><h2>Hola, Evelin 👋</h2><p>Aquí podrás administrar productos, precios, promociones, archivos y usuarios sin abrir Visual Studio.</p></div><button onClick={() => setActive('Importar Excel')}><UploadCloud size={18} /> Actualizar Marketplace</button></section>
          <section className="adminStats">{cards.map(({ label, value, detail, icon: Icon }) => <article key={label} className="adminStatCard"><div className="adminStatIcon"><Icon size={22} /></div><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>)}</section>
          <section className="adminGridTwo">
            <article className="adminPanelCard"><div className="adminPanelHead"><div><span>ESTADO DEL SISTEMA</span><h3>Resumen de publicación</h3></div><CheckCircle2 size={25} /></div><div className="adminStatusList"><div><CheckCircle2 size={18} /><span>Base de datos Supabase</span><b>Conectada</b></div><div><CheckCircle2 size={18} /><span>Nivel público configurado</span><b>I9</b></div><div><CheckCircle2 size={18} /><span>Catálogo público</span><b>Disponible</b></div><div className="warning"><AlertTriangle size={18} /><span>Imágenes por revisar</span><b>4 pendientes</b></div></div></article>
            <article className="adminPanelCard"><div className="adminPanelHead"><div><span>ACTUALIZACIÓN RÁPIDA</span><h3>Asistente del catálogo</h3></div><UploadCloud size={25} /></div><div className="adminSteps"><div><b>1</b><span><strong>Excel de productos</strong><small>Productos, precios y promociones</small></span></div><div><b>2</b><span><strong>Imágenes y marcas</strong><small>Validación automática por código</small></span></div><div><b>3</b><span><strong>Catálogo PDF</strong><small>Archivo vigente para clientes</small></span></div></div><button className="adminPrimaryAction" onClick={() => setActive('Importar Excel')}>Abrir asistente de actualización</button></article>
          </section>
          <section className="adminPanelCard adminActivity"><div className="adminPanelHead"><div><span>ACTIVIDAD RECIENTE</span><h3>Últimos cambios</h3></div><Clock3 size={24} /></div><div className="adminActivityRow"><span className="activityDot success" /><div><strong>Nivel público configurado en I9</strong><small>Supabase · Hoy</small></div><b>Completado</b></div><div className="adminActivityRow"><span className="activityDot" /><div><strong>Excel validado para 9 niveles de precio</strong><small>491 productos · 4,401 precios</small></div><b>Preparado</b></div><div className="adminActivityRow"><span className="activityDot warning" /><div><strong>Módulo de productos conectado</strong><small>Versión 2.2</small></div><b>En revisión</b></div></section>
          </div>
            : active === 'Productos'
            ? <AdminProducts />
            : active === 'Portada'
            ? <AdminHeroSettings />
            : active === 'Productos nuevos'
            ? <AdminNewProductsSettings />
            : active === 'Promociones destacadas'
            ? <AdminFeaturedPromotionsSettings />
            : active === 'Secciones'
            ? <AdminSectionsPreview />
            : (
              <div className="adminContent">
                <section className="adminEmptyModule">
                  <div className="adminEmptyIcon">
                    {React.createElement(
                      ADMIN_NAV.find(item => item.label === active)?.icon || Settings,
                      { size: 32 }
                    )}
                  </div>

                  <span>MÓDULO EN PREPARACIÓN</span>
                  <h2>{active}</h2>

                  <p>
                    Esta pantalla forma parte del diseño aprobado.
                    La conectaremos con Supabase en la siguiente etapa.
                  </p>

                  <button onClick={() => setActive('Dashboard')}>
                    Volver al Dashboard
                  </button>
                </section>
               </div>
         )}
      </main>
    </div>
  );
}


const isAdminRoute = window.location.pathname.startsWith('/admin');

createRoot(
  document.getElementById('root')
).render(isAdminRoute ? <AdminPanel /> : <App />);
