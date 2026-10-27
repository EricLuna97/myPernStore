const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

// Función auxiliar para buscar foto en Open Food Facts por código de barras
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
    // Si la API pública no responde o da timeout, continuamos limpiamente
    return null;
  }
  return null;
};

// Controlador Principal: Analizar Factura con Gemini Vision
const analizarFactura = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Debes subir una imagen de la factura o lista de precios." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Falta la variable de entorno GEMINI_API_KEY en el servidor." });
  }

  try {
    // 1. Leer el archivo local subido por Multer y convertirlo a Base64
    const imagePath = req.file.path;
    const imageBuffer = fs.readFileSync(imagePath);
    const mimeType = req.file.mimetype || 'image/jpeg';

    const imagePart = {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType: mimeType
      }
    };

    // 2. Inicializar Gemini con salida JSON obligatoria
    const genAI = new GoogleGenerativeAI(apiKey);
    // Usamos el modelo rápido multimodal de última generación
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

    // 3. Enriquecer productos: Buscar foto oficial en Open Food Facts si tienen código de barras
    const productosConImagenes = await Promise.all(
      productosExtraidos.map(async (prod) => {
        let imagenEncontrada = null;
        if (prod.codigo_barras) {
          imagenEncontrada = await buscarFotoPorBarcode(prod.codigo_barras);
        }

        return {
          ...prod,
          precio_costo: parseFloat(prod.precio_costo) || 0,
          stock: parseInt(prod.stock, 10) || 1,
          imagen_url: imagenEncontrada // URL oficial si se encontró, o null
        };
      })
    );

    // 4. Limpieza del archivo temporal local para no saturar disco
    try {
      fs.unlinkSync(imagePath);
    } catch (_) {}

    res.json({
      total_detectados: productosConImagenes.length,
      productos: productosConImagenes
    });

  } catch (error) {
    console.error("💥 Error en analizarFactura:", error);
    // Limpieza de emergencia
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
    }
    res.status(500).json({ error: error.message || "Error procesando la imagen con IA." });
  }
};

module.exports = {
  analizarFactura
};

