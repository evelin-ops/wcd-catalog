import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';

async function loadEnvFile(filePath) {
  const text = await fs.readFile(filePath, 'utf8');

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) continue;

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    process.env[key] = value;
  }
}

function normalizeHeader(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

const HEADER_ALIASES = {
  category: [
    'category',
    'categoria',
    'productcategory',
    'categoriaproducto',
    'tipoproducto',
  ],

  activeStatus: [
    'activestatus',
    'active',
    'status',
    'estado',
    'estadoactivo',
    'productoactivo',
    'activo',
  ],

  itemCode: [
    'itemcod',
    'itemcode',
    'codigoitem',
    'codigoproducto',
    'productcode',
    'codigo',
    'sku',
  ],

  description: [
    'description',
    'descripcion',
    'productdescription',
    'descripcionproducto',
    'detalle',
    'productname',
    'nombreproducto',
  ],

  itemNumber: [
    'item',
    'itemnumber',
    'itemno',
    'itemnum',
    'item#',
    'numeroitem',
    'numerodeitem',
    'itemid',
  ],

  orderType: [
    'ordertype',
    'tipodeorden',
    'tipoorden',
    'ordertipo',
    'tipopedido',
  ],

  brand: [
    'brand',
    'marca',
    'productbrand',
    'marcaproducto',
  ],

  price: [
    'price',
    'price$',
    'priceusd',
    'unitprice',
    'sellingprice',
    'saleprice',
    'precio',
    'precio$',
    'precioventa',
    'preciodeventa',
    'precioactual',
  ],

  section: [
    'section',
    'seccion',
    'departamento',
    'grupo',
  ],

  promoActive: [
    'promoactive',
    'promocionactiva',
    'activepromo',
    'promostatus',
    'ofertaactiva',
  ],

  promoText: [
    'promotext',
    'promotiontext',
    'textopromo',
    'textopromocion',
    'promocion',
    'oferta',
  ],

  promoPrice: [
    'promoprice',
    'promotionprice',
    'preciopromo',
    'preciopromocion',
    'preciooferta',
  ],

  promoEnd: [
    'promoend',
    'promotionend',
    'fechafinpromo',
    'fechafinpromocion',
    'vencimientopromo',
    'vigenciahasta',
  ],

  pdfPage: [
    'pdfpage',
    'paginapdf',
    'paginacatalogo',
  ],

  stockStatus: [
    'stockstatus',
    'estadoinventario',
    'disponibilidad',
    'stock',
  ],

  sortOrder: [
    'sortorder',
    'orden',
    'ordenamiento',
    'posicion',
  ],
};

const PRICE_LEVELS = [
  { code: 'A1', aliases: ['a1price', 'pricea1', 'precioa1'] },
  { code: 'B2', aliases: ['b2price', 'priceb2', 'preciob2'] },
  { code: 'C3', aliases: ['c3price', 'pricec3', 'precioc3'] },
  { code: 'D4', aliases: ['d4price', 'priced4', 'preciod4'] },
  { code: 'E5', aliases: ['e5price', 'pricee5', 'precioe5'] },
  { code: 'F6', aliases: ['f6price', 'pricef6', 'preciof6'] },
  { code: 'G7', aliases: ['g7price', 'priceg7', 'preciog7'] },
  { code: 'H8', aliases: ['h8price', 'priceh8', 'precioh8'] },
  { code: 'I9', aliases: ['i9price', 'pricei9', 'precioi9'] },
];

const REQUIRED_FIELDS = [
  'category',
  'activeStatus',
  'itemCode',
  'description',
  'itemNumber',
  'orderType',
  'brand',
];

function findColumn(headers, aliases) {
  return headers.find((header) =>
    aliases.includes(normalizeHeader(header))
  );
}

function buildColumnMap(headers) {
  const map = {};

  for (const [field, aliases] of Object.entries(
    HEADER_ALIASES
  )) {
    map[field] = findColumn(headers, aliases);
  }

  return map;
}

function buildPriceLevelColumnMap(headers) {
  return Object.fromEntries(
    PRICE_LEVELS.map(({ code, aliases }) => [
      code,
      findColumn(headers, aliases),
    ])
  );
}

function parseBoolean(value, defaultValue = false) {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase();

  if (!normalized) return defaultValue;

  return [
    'true',
    'yes',
    'y',
    'si',
    'sí',
    '1',
    'active',
    'activo',
    'activa',
  ].includes(normalized);
}

function parsePrice(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const original = String(value).trim();

  const emptyPriceValues = [
    '',
    '-',
    '$-',
    '$ -',
    'n/a',
    'na',
    'null',
    'sin precio',
    'no disponible',
  ];

  if (
    emptyPriceValues.includes(original.toLowerCase())
  ) {
    return null;
  }

  const cleaned = original
    .replace(/[$,\s]/g, '')
    .trim();

  const number = Number(cleaned);

  return Number.isFinite(number) ? number : null;
}

function isEmptyPriceValue(value) {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase();

  return [
    '',
    '-',
    '$-',
    '$ -',
    'n/a',
    'na',
    'null',
    'sin precio',
    'no disponible',
  ].includes(normalized);
}


function normalizeItemNumber(value) {
  const digits = String(value ?? '')
    .trim()
    .replace(/\D/g, '');

  if (!digits) return '';

  return digits.padStart(6, '0');
}

function parseDate(value) {
  if (!value) return null;

  if (value instanceof Date && !Number.isNaN(value)) {
    return value.toISOString().slice(0, 10);
  }

  const text = String(value).trim();

  const directDate = new Date(text);

  if (!Number.isNaN(directDate.getTime())) {
    return directDate.toISOString().slice(0, 10);
  }

  return null;
}

function chunk(array, size) {
  const groups = [];

  for (let index = 0; index < array.length; index += size) {
    groups.push(array.slice(index, index + size));
  }

  return groups;
}

async function main() {
  const projectRoot = process.cwd();

  await loadEnvFile(
    path.join(projectRoot, '.env.admin')
  );

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey =
    process.env.SUPABASE_SECRET_KEY;
  const excelFile = process.env.EXCEL_FILE;
  const dryRun =
    String(process.env.DRY_RUN).toLowerCase() !== 'false';

  if (
    !supabaseUrl ||
    !supabaseSecretKey ||
    !excelFile
  ) {
    throw new Error(
      'Faltan SUPABASE_URL, SUPABASE_SECRET_KEY o EXCEL_FILE en .env.admin'
    );
  }

  console.log(
    dryRun
      ? '\nMODO PRUEBA: no se modificará Supabase.\n'
      : '\nMODO PUBLICACIÓN: se actualizará Supabase.\n'
  );

  const excelBuffer = await fs.readFile(excelFile);
  const workbook = XLSX.read(excelBuffer, {
  type: 'buffer',
  cellDates: true, 
});

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  const rows = XLSX.utils.sheet_to_json(worksheet, {
    defval: '',
    raw: false,
  });

  if (!rows.length) {
    throw new Error('El Excel no contiene filas.');
  }

  const headers = Object.keys(rows[0]);
  const columnMap = buildColumnMap(headers);
  const priceLevelColumnMap = buildPriceLevelColumnMap(headers);

  const missingFields = REQUIRED_FIELDS.filter(
    (field) => !columnMap[field]
  );

  const missingPriceLevels = PRICE_LEVELS
    .map(({ code }) => code)
    .filter((code) => !priceLevelColumnMap[code]);

  if (missingPriceLevels.length > 0) {
    console.error('\nFaltan columnas de niveles de precio:');
    console.error(missingPriceLevels.join(', '));
    throw new Error(
      'Importación cancelada. El Excel debe incluir A1 Price hasta I9 Price.'
    );
  }

  if (missingFields.length > 0) {
    console.error(
      '\nFaltan columnas obligatorias:'
    );

    for (const field of missingFields) {
      console.error(`- ${field}`);
    }

    console.log('\nEncabezados encontrados:');
    console.log(headers.join(' | '));

    throw new Error(
      'Importación cancelada. No se modificó Supabase.'
    );
  }

  const supabase = createClient(
    supabaseUrl,
    supabaseSecretKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  const products = [];
  const productPrices = [];
  const duplicateItems = new Set();
  const invalidPrices = [];
  const seenItems = new Set();

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const excelRow = index + 2;

    const itemNumber = normalizeItemNumber(
      row[columnMap.itemNumber]
    );

    if (!itemNumber) continue;

    if (seenItems.has(itemNumber)) {
      duplicateItems.add(itemNumber);
      continue;
    }

    seenItems.add(itemNumber);

    const levelPrices = {};

    for (const { code } of PRICE_LEVELS) {
      const column = priceLevelColumnMap[code];
      const rawValue = row[column];
      const parsedValue = parsePrice(rawValue);

      if (!isEmptyPriceValue(rawValue) && parsedValue === null) {
        invalidPrices.push({
          row: excelRow,
          itemNumber,
          level: code,
          value: rawValue,
        });
      }

      levelPrices[code] = parsedValue;

      if (parsedValue !== null) {
        productPrices.push({
          item_number: itemNumber,
          price_level: code,
          price: parsedValue,
          updated_at: new Date().toISOString(),
        });
      }
    }

    // Compatibilidad temporal con la versión 2.1:
    // la columna products.price conserva I9 hasta que toda la interfaz
    // consuma exclusivamente product_prices.
    const price = levelPrices.I9;

    const promoActive = columnMap.promoActive
      ? parseBoolean(
          row[columnMap.promoActive],
          false
        )
      : false;

    const imageName =
      `${itemNumber.padStart(7, '0')}.png`;

    const { data: publicUrlData } =
      supabase.storage
        .from('product-images')
        .getPublicUrl(imageName);

    products.push({
      item_number: itemNumber,
      item_code:
        String(row[columnMap.itemCode] ?? '').trim() ||
        null,
      description:
        String(
          row[columnMap.description] ?? ''
        ).trim() || null,
      brand:
        String(row[columnMap.brand] ?? '').trim() ||
        null,
      category:
        String(
          row[columnMap.category] ?? ''
        ).trim() || null,
      section: columnMap.section
        ? String(row[columnMap.section] ?? '').trim() ||
          null
        : null,
      order_type:
        String(
          row[columnMap.orderType] ?? ''
        ).trim() || null,

      price,

      active: parseBoolean(
        row[columnMap.activeStatus],
        true
      ),

      promo_active: promoActive,
      promo_text:
        promoActive && columnMap.promoText
          ? String(
              row[columnMap.promoText] ?? ''
            ).trim() || null
          : null,
      promo_price:
        promoActive && columnMap.promoPrice
          ? parsePrice(
              row[columnMap.promoPrice]
            )
          : null,
      promo_end:
        promoActive && columnMap.promoEnd
          ? parseDate(
              row[columnMap.promoEnd]
            )
          : null,

      image_name: imageName,
      image_url: publicUrlData.publicUrl,

      pdf_page: columnMap.pdfPage
        ? parsePrice(row[columnMap.pdfPage])
        : null,

      stock_status: columnMap.stockStatus
        ? String(
            row[columnMap.stockStatus] ?? ''
          ).trim() || 'Disponible'
        : 'Disponible',

      sort_order: columnMap.sortOrder
        ? parsePrice(row[columnMap.sortOrder]) || 0
        : index,

      updated_at: new Date().toISOString(),
    });
  }

  const activeCount = products.filter(
    (product) => product.active
  ).length;

  const promotionCount = products.filter(
    (product) => product.promo_active
  ).length;

  console.log(`Hoja: ${firstSheetName}`);
  console.log(`Filas leídas: ${rows.length}`);
  console.log(
    `Productos válidos: ${products.length}`
  );
  console.log(`Productos activos: ${activeCount}`);
  console.log(
    `Promociones activas: ${promotionCount}`
  );
  console.log(
    `ITEM duplicados: ${duplicateItems.size}`
  );
  console.log(
    `Registros de precios: ${productPrices.length}`
  );
  console.log(
    `Precios inválidos: ${invalidPrices.length}`
  );

  if (duplicateItems.size > 0) {
    console.log('\nITEM duplicados:');
    console.log([...duplicateItems].join(', '));
  }

  if (invalidPrices.length > 0) {
    console.log('\nEjemplos de precios inválidos:');

    console.table(invalidPrices.slice(0, 10));
  }

  if (!products.length) {
    throw new Error(
      'No se encontraron productos válidos.'
    );
  }

  if (duplicateItems.size > 0) {
    throw new Error(
      'Hay ITEM duplicados. Corrige el Excel antes de publicar.'
    );
  }

  if (dryRun) {
    console.log(
      '\nValidación terminada. No se modificó Supabase.'
    );

    console.log(
      'Cuando todo esté correcto, cambia DRY_RUN=false.'
    );

    return;
  }

  console.log('\nGuardando productos...');

  for (const productGroup of chunk(products, 100)) {
    const { error } = await supabase
      .from('products')
      .upsert(productGroup, {
        onConflict: 'item_number',
      });

    if (error) throw error;
  }

  console.log('Guardando niveles de precio...');

  for (const priceGroup of chunk(productPrices, 500)) {
    const { error } = await supabase
      .from('product_prices')
      .upsert(priceGroup, {
        onConflict: 'item_number,price_level',
      });

    if (error) throw error;
  }

  const { data: existingPrices, error: existingPricesError } =
    await supabase
      .from('product_prices')
      .select('id,item_number,price_level');

  if (existingPricesError) throw existingPricesError;

  const incomingPriceKeys = new Set(
    productPrices.map(
      (entry) => `${entry.item_number}|${entry.price_level}`
    )
  );

  const priceIdsToDelete = (existingPrices || [])
    .filter(
      (entry) =>
        !incomingPriceKeys.has(
          `${entry.item_number}|${entry.price_level}`
        )
    )
    .map((entry) => entry.id);

  for (const idGroup of chunk(priceIdsToDelete, 500)) {
    const { error } = await supabase
      .from('product_prices')
      .delete()
      .in('id', idGroup);

    if (error) throw error;
  }

  const { data: existingProducts, error: selectError } =
    await supabase
      .from('products')
      .select('id,item_number');

  if (selectError) throw selectError;

  const incomingItems = new Set(
    products.map((product) => product.item_number)
  );

  const idsToDelete = (existingProducts || [])
    .filter(
      (product) =>
        !incomingItems.has(product.item_number)
    )
    .map((product) => product.id);

  for (const idGroup of chunk(idsToDelete, 100)) {
    const { error } = await supabase
      .from('products')
      .delete()
      .in('id', idGroup);

    if (error) throw error;
  }

  console.log('\nImportación terminada:');
  console.log(`Productos guardados: ${products.length}`);
  console.log(`Precios guardados: ${productPrices.length}`);
  console.log(`Eliminados: ${idsToDelete.length}`);
  console.log(`Activos: ${activeCount}`);
  console.log(`Promociones: ${promotionCount}`);
  console.log('Errores: 0');
}

main().catch((error) => {
  console.error('\nERROR:', error.message);
  process.exitCode = 1;
});
