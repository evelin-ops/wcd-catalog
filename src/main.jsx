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
  ChevronRight, CheckCircle2, AlertTriangle, Clock3, LogOut,
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

  const wcdWhatsAppNumber =
    import.meta.env.VITE_WCD_WHATSAPP_NUMBER || '';

    const catalogPdfUrl =
    import.meta.env.VITE_CATALOG_PDF_URL || '';

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

    return ['Todos', ...new Set(productCategories)];
  }, [products]);

  const filtered = useMemo(() => {
    const text = query.toLowerCase().trim();

    return products.filter((product) => {
      const matchesCategory =
        cat === 'Todos' || product.cat === cat;

      const searchable = `
        ${product.brand}
        ${product.name}
        ${product.id}
        ${product.code}
        ${product.desc}
      `.toLowerCase();

      return (
        matchesCategory &&
        searchable.includes(text)
      );
    });
  }, [products, query, cat]);

  const displayedProducts = filtered.slice(
    0,
    visibleProducts
  );

  useEffect(() => {
    setVisibleProducts(24);
  }, [query, cat]);

  const promotions = products.filter(
    (product) => product.promoText
  );

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
        <a className="brand" href="#inicio">
          <img src="/wcd-logo.png" alt="WCD" />

          <div>
            <strong>WCD Marketplace</strong>
            <span>
              Productos que te conectan con tu tierra
            </span>
          </div>
        </a>

        <nav>
          <a href="#inicio">Inicio</a>
          <a href="#promos">Promociones</a>
          <a href="#productos">Productos</a>
          
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
        <section id="inicio" className="hero">
          <div>
            <span className="eyebrow">
              WCD MARKETPLACE
            </span>

            <h1>
              Encuentra productos y prepara tu pedido
              en minutos.
            </h1>

            <p>
              Consulta precios, promociones y
              presentaciones desde cualquier dispositivo.
            </p>

            <div className="heroBtns">
              <a href="#productos" className="primary">
                Explorar productos
              </a>

              <a href="#promos" className="secondary">
                Ver promociones
              </a>
            </div>
          </div>

          <div className="heroCard">
            <img src="/wcd-logo.png" alt="WCD" />
            <span>Catálogo digital y pedidos</span>
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

          <a href="#productos">Buscar</a>
        </section>

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

        <section id="promos" className="section">
          <span className="label">
            <Flame size={16} />
            OFERTAS ACTIVAS
          </span>

          <h2>Promociones destacadas</h2>

          <p className="sub">
            Productos recomendados para vender hoy.
          </p>

          {loading ? (
            <p>Cargando promociones...</p>
          ) : promotions.length > 0 ? (
            <div className="grid">
              {promotions.slice(0, 3).map((product) => (
                <Card
                  key={product.id}
                  p={product}
                  onAdd={add}
                />
              ))}
            </div>
          ) : (
            <p className="sub">
              No hay promociones activas actualmente.
            </p>
          )}
        </section>

        <section id="productos" className="section">
          <div className="sectionTop">
            <div>
              <span className="label">
                CATÁLOGO WCD
              </span>

              <h2>Todos los productos</h2>

              <p className="sub">
                {loading
                  ? 'Cargando productos...'
                  : `${filtered.length} productos encontrados.`}
              </p>
            </div>

            <label className="smallSearch">
              <Search size={18} />

              <input
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="Buscar productos..."
              />
            </label>
          </div>

          <div className="tabs">
            {cats.map((category) => (
              <button
                className={
                  cat === category ? 'active' : ''
                }
                onClick={() => setCat(category)}
                key={category}
              >
                {category}
              </button>
            ))}
          </div>

          {!loading && filtered.length > 0 && (
            <>
              <div className="grid">
                {displayedProducts.map((product) => (
                  <Card
                    key={product.id}
                    p={product}
                    onAdd={add}
                  />
                ))}
              </div>

              {displayedProducts.length < filtered.length && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    paddingTop: '30px',
                  }}
                >
                  <button
                    className="primary"
                    onClick={() =>
                      setVisibleProducts(
                        (current) => current + 24
                      )
                    }
                    style={{
                      border: 'none',
                      cursor: 'pointer',
                      padding: '14px 28px',
                      borderRadius: '12px',
                      fontWeight: '700',
                    }}
                  >
                    Ver más productos
                  </button>
                </div>
              )}
            </>
          )}

          {!loading &&
            !databaseError &&
            filtered.length === 0 && (
              <div
                style={{
                  padding: '45px',
                  textAlign: 'center',
                  background: 'white',
                  borderRadius: '18px',
                }}
              >
                <Package size={45} />

                <h3>No hay productos para mostrar</h3>

                <p>
                  La tabla de Supabase todavía está vacía
                  o no coincide con la búsqueda.
                </p>
              </div>
            )}
        </section>

        <section id="pdf" className="pdf">
          <FileText size={42} />

          <div>
            <span className="label">
              CATÁLOGO COMPLETO
            </span>

            <h2>Consulta el catálogo PDF de WCD</h2>

            <p className="sub">
              Se conectará al PDF vigente en Supabase.
            </p>
          </div>

          {catalogPdfUrl ? (
            <a
              href={catalogPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="primary"
              style={{
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '13px 18px',
                borderRadius: '11px',
                fontWeight: '800',
              }}
            >
              Abrir catálogo PDF
            </a>
          ) : (
            <button disabled>PDF no disponible</button>
          )}
        </section>
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
    return rows.filter((row) => {
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
  }, [rows, searchText, brandFilter, categoryFilter, statusFilter]);

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
                <thead><tr><th>Imagen</th><th>Artículo</th><th>Producto</th><th>Marca</th><th>Categoría</th><th>Precio actual</th><th>Promoción</th><th>Estado</th></tr></thead>
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
    </div>
  );
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
        </div> : active === 'Productos' ? <AdminProducts /> : <div className="adminContent"><section className="adminEmptyModule"><div className="adminEmptyIcon">{React.createElement(ADMIN_NAV.find(item => item.label === active)?.icon || Settings, { size: 32 })}</div><span>MÓDULO EN PREPARACIÓN</span><h2>{active}</h2><p>Esta pantalla forma parte del diseño aprobado. La conectaremos con Supabase en la siguiente etapa.</p><button onClick={() => setActive('Dashboard')}>Volver al Dashboard</button></section></div>}
      </main>
    </div>
  );
}


const isAdminRoute = window.location.pathname.startsWith('/admin');

createRoot(
  document.getElementById('root')
).render(isAdminRoute ? <AdminPanel /> : <App />);
