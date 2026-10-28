const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// =========================================================================
// 1. HELPERS: BÚSQUEDA DE IMÁGENES Y LIMPIEZA DE DATOS
// =========================================================================

// Búsqueda de foto en Open Food Facts por código de barras
const buscarFotoPorBarcode = async (barcode) => {
  if (!barcode || String(barcode).trim().length < 8) return null;
  
  try {
    const cleanCode = String(barcode).trim();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500); // 2.5s máximo para no demorar

    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${cleanCode}.json`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'myPernStore - POS System - Version 1.0' }
    });
    
    clearTimeout(timeout);
    
    if (!res.ok) return null;
    const data = await res.json();
    
    if (data.status === 1 && data.product) {
      return (
        data.product.image_front_url || 
        data.product.image_url || 
        data.product.image_small_url || 
        null
      );
    }
  } catch (err) {
    // Si la API pública no responde o da timeout, continuamos limpiamente sin foto
    return null;
  }
  return null;
};

// Limpieza robusta de números (soporta formato con coma decimal o punto de miles ej: "1.250,50" o "1250.50")
function limpiarNumero(val) {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  
  let str = String(val).trim().replace(/[^0-9.,-]/g, '');
  if (!str) return 0;
  
  if (str.includes(',') && str.includes('.')) {
    if (str.indexOf('.') < str.indexOf(',')) {
      // Formato argentino/español: 1.500,50 -> 1500.50
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // Formato anglosajón: 1,500.50 -> 1500.50
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    // Solo coma decimal: 1500,50 -> 1500.50
    str = str.replace(',', '.');
  }
  
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

// Búsqueda inteligente de valores en fila según lista de nombres posibles de columnas
function encontrarValorEnFila(row, aliases) {
  const keys = Object.keys(row);
  
  // 1. Coincidencia exacta insensible a mayúsculas
  for (const alias of aliases) {
    const keyMatch = keys.find(k => k.trim().toLowerCase() === alias.toLowerCase());
    if (keyMatch && row[keyMatch] !== undefined && String(row[keyMatch]).trim() !== '') {
      return row[keyMatch];
    }
  }
  
  // 2. Coincidencia parcial (por ejemplo "código de barras" contiene "codigo")
  for (const alias of aliases) {
    const keyMatch = keys.find(k => k.trim().toLowerCase().includes(alias.toLowerCase()));
    if (keyMatch && row[keyMatch] !== undefined && String(row[keyMatch]).trim() !== '') {
      return row[keyMatch];
    }
  }
  
  return null;
}

// Enriquecer lista de productos con fotos oficiales de Open Food Facts en bloques
async function enriquecerProductosConFotos(productos) {
  const resultado = [...productos];
  const itemsConBarcode = resultado.filter(p => p.codigo_barras && String(p.codigo_barras).length >= 8);
  
  // Procesamos en bloques paralelos de 5 para no saturar la red ni demorar
  const CHUNK_SIZE = 5;
  for (let i = 0; i < itemsConBarcode.length; i += CHUNK_SIZE) {
    const chunk = itemsConBarcode.slice(i, i + CHUNK_SIZE);
    await Promise.all(
      chunk.map(async (prod) => {
        prod.imagen_url = await buscarFotoPorBarcode(prod.codigo_barras);
      })
    );
  }
  
  return resultado;
}

// =========================================================================
// 2. PROCESADOR DE ARCHIVOS TABULARES (EXCEL .XLSX, .XLS Y CSV)
// =========================================================================
const procesarArchivoTabular = async (req, res) => {
  const filePath = req.file.path;
  
  try {
    console.log(`📊 Procesando archivo tabular: ${req.file.originalname}`);
    const workbook = XLSX.readFile(filePath, { cellDates: true });
    
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return res.status(422).json({ error: "El archivo no contiene hojas de datos legibles." });
    }
    
    const primeraHoja = workbook.Sheets[workbook.SheetNames[0]];
    const filas = XLSX.utils.sheet_to_json(primeraHoja, { defval: "" });
    
    if (!filas || filas.length === 0) {
      return res.status(422).json({ 
        error: "No se encontraron filas con datos en la planilla. Asegúrate de incluir los encabezados en la primera fila." 
      });
    }

    // Aliases para detección automática de columnas
    const aliasNombre = ['nombre', 'producto', 'articulo', 'item', 'descripcion', 'detalle', 'name', 'title', 'prod', 'mercaderia'];
    const aliasBarcode = ['codigo_barras', 'codigo', 'cod_barra', 'cod_barras', 'barcode', 'ean', 'ean13', 'ean_13', 'upc', 'sku', 'code'];
    const aliasDesc = ['descripcion', 'detalle', 'observaciones', 'description', 'info'];
    const aliasCosto = ['precio_costo', 'costo', 'precio_compra', 'compra', 'pcosto', 'p_costo', 'costo_unitario', 'cost', 'cost_price'];
    const aliasVenta = ['precio_venta', 'venta', 'pventa', 'p_venta', 'pvp', 'precio_publico', 'precio', 'price', 'sale_price'];
    const aliasStock = ['stock', 'cantidad', 'cant', 'unidades', 'existencia', 'qty', 'quantity', 'unid', 'cant_ingreso'];
    const aliasCat = ['categoria', 'rubro', 'seccion', 'familia', 'category', 'departamento', 'tipo'];

    const productosExtraidos = [];

    for (let i = 0; i < filas.length; i++) {
      const fila = filas[i];
      
      const nombreRaw = encontrarValorEnFila(fila, aliasNombre);
      // Si la fila está vacía o no tiene nombre reconocible, la omitimos
      if (!nombreRaw || String(nombreRaw).trim() === '') continue;

      let codigo_barras = encontrarValorEnFila(fila, aliasBarcode);
      if (codigo_barras !== null && codigo_barras !== undefined) {
        codigo_barras = String(codigo_barras).trim().replace(/[^0-9a-zA-Z_-]/g, '');
        if (codigo_barras === '') codigo_barras = null;
      }

      const descripcion = encontrarValorEnFila(fila, aliasDesc) || '';
      
      let costo = limpiarNumero(encontrarValorEnFila(fila, aliasCosto));
      let venta = limpiarNumero(encontrarValorEnFila(fila, aliasVenta));
      
      // Si no hay costo pero sí precio de venta, o viceversa
      if (costo === 0 && venta > 0) {
        costo = venta;
      }
      
      let stock = Math.round(limpiarNumero(encontrarValorEnFila(fila, aliasStock)));
      if (stock <= 0) stock = 1;

      const categoria = encontrarValorEnFila(fila, aliasCat) || '';

      productosExtraidos.push({
        nombre: String(nombreRaw).trim(),
        codigo_barras: codigo_barras || null,
        descripcion: String(descripcion).trim(),
        precio_costo: costo,
        precio_venta: venta > 0 ? venta : null,
        stock: stock,
        categoria: String(categoria).trim(),
        imagen_url: null
      });
    }

    if (productosExtraidos.length === 0) {
      return res.status(422).json({ 
        error: "No se pudieron extraer productos. Verifica que la primera fila contenga títulos de columnas como: Nombre, Código, Costo, Stock, Categoría." 
      });
    }

    console.log(`✅ Planilla leída: ${productosExtraidos.length} productos detectados. Buscando fotos oficiales...`);

    // Enriquecer con Open Food Facts si hay códigos de barras
    const productosFinales = await enriquecerProductosConFotos(productosExtraidos);

    // Limpieza de archivo temporal
    try { fs.unlinkSync(filePath); } catch (_) {}

    return res.json({
      tipo_origen: "tabular",
      formato: path.extname(req.file.originalname).toLowerCase(),
      total_detectados: productosFinales.length,
      productos: productosFinales
    });

  } catch (error) {
    console.error("💥 Error al procesar archivo tabular:", error);
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (_) {}
    return res.status(500).json({ error: error.message || "Error al leer el archivo Excel/CSV." });
  }
};

// =========================================================================
// 3. PROCESADOR DE FACTURAS E IMÁGENES CON GEMINI VISION
// =========================================================================
const procesarImagenConGemini = async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Falta la variable de entorno GEMINI_API_KEY en el servidor para analizar imágenes." });
  }

  const imagePath = req.file.path;

  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const mimeType = req.file.mimetype || 'image/jpeg';

    const imagePart = {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType: mimeType
      }
    };

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const prompt = `
      Eres un auditor de inventario experto en sistemas POS y facturación comercial.
      Analiza detenidamente la imagen adjunta (que puede ser una factura de proveedor, remito de entrega, lista de precios impresa o tabla de productos).

      Tu objetivo es extraer cada uno de los productos que aparecen en el documento.

      Para cada producto, extrae con la mayor precisión posible:
      - nombre: Nombre comercial claro del producto (ej: "Galletitas Oreo 118g", "Coca Cola 2.25L").
      - codigo_barras: Código numérico de barras (EAN-13, SKU o código de artículo si figura en la columna correspondiente; si no hay, pon null).
      - descripcion: Breve descripción o detalle del producto si aparece.
      - precio_costo: Precio unitario de costo o compra (número decimal sin signos de moneda).
      - stock: Cantidad de unidades compradas o que ingresan (número entero; si no especifica, pon 1).
      - categoria: Nombre de categoría sugerida (ej: "Almacén", "Bebidas", "Limpieza", "Golosinas", "Lácteos", etc.).

      REGLA ESTRICTA:
      Responde ÚNICAMENTE un array JSON válido con los productos detectados. Nada de texto introductorio, nada de markdown ni explicaciones.
      Ejemplo de formato:
      [
        {
          "nombre": "Yerba Playadito 1kg",
          "codigo_barras": "779123456789",
          "descripcion": "Yerba mate con palo",
          "precio_costo": 3200.50,
          "stock": 20,
          "categoria": "Almacén"
        }
      ]
    `;

    console.log("🤖 Enviando imagen de factura a Gemini Vision...");
    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();
    
    let productosExtraidos = [];
    try {
      productosExtraidos = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Error al parsear respuesta JSON de Gemini:", responseText);
      return res.status(500).json({ error: "La IA no devolvió un formato JSON válido." });
    }

    if (!Array.isArray(productosExtraidos) || productosExtraidos.length === 0) {
      return res.status(422).json({ error: "No se pudieron identificar productos en la imagen. Intenta con una foto más clara o nítida." });
    }

    console.log(`✅ Gemini detectó ${productosExtraidos.length} productos. Buscando fotos oficiales...`);

    const normalizados = productosExtraidos.map(p => ({
      ...p,
      precio_costo: parseFloat(p.precio_costo) || 0,
      stock: parseInt(p.stock, 10) || 1,
      imagen_url: null
    }));

    const productosFinales = await enriquecerProductosConFotos(normalizados);

    try { fs.unlinkSync(imagePath); } catch (_) {}

    return res.json({
      tipo_origen: "ia_vision",
      total_detectados: productosFinales.length,
      productos: productosFinales
    });

  } catch (error) {
    console.error("💥 Error en Gemini Vision:", error);
    try { if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath); } catch (_) {}
    return res.status(500).json({ error: error.message || "Error procesando la imagen con IA." });
  }
};

// =========================================================================
// 4. CONTROLADOR ENRUTADOR PRINCIPAL
// =========================================================================
const analizarFactura = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Debes subir un archivo (foto de factura, archivo Excel .xlsx o .csv)." });
  }

  const originalName = req.file.originalname || '';
  const ext = path.extname(originalName).toLowerCase();
  const mimetype = (req.file.mimetype || '').toLowerCase();

  const esArchivoTabular = 
    ['.xlsx', '.xls', '.csv'].includes(ext) ||
    mimetype.includes('spreadsheet') ||
    mimetype.includes('excel') ||
    mimetype.includes('csv');

  if (esArchivoTabular) {
    return procesarArchivoTabular(req, res);
  } else {
    return procesarImagenConGemini(req, res);
  }
};

module.exports = {
  analizarFactura
};
