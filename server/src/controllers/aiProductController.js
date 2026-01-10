import dotenv from 'dotenv';
dotenv.config();

export const analyzeProduct = async (req, res) => {
  try {
    const API_KEY = process.env.GEMINI_API_KEY;
    
    if (!API_KEY) {
      return res.status(500).json({ error: "Falta la API Key en el servidor" });
    }

    const MODEL_NAME = "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;

    const { textPrompt } = req.body;

    // EL SYSTEM PROMPT
    const systemInstruction = `
      Actúa como un asistente de inventario experto para un sistema POS.
      Tu tarea es extraer datos estructurados de productos a partir de lenguaje natural.
      
      Reglas:
      1. Analiza el texto del usuario.
      2. Extrae: nombre, precio (número), stock (número), descripción y categoría.
      3. Si falta algún dato, intenta inferirlo o pon null/0.
      4. IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON válido. Nada de markdown, nada de "Aquí tienes". Solo JSON.
      
      Formato de salida esperado:
      {
        "name": "string",
        "price": number,
        "stock": number,
        "description": "string",
        "category": "string"
      }
    `;

    // Construimos el cuerpo para la API REST
    const requestBody = {
      contents: [{
        parts: [
          { text: systemInstruction }, 
          { text: `Texto del usuario: "${textPrompt}"` } 
        ]
      }],
      generationConfig: {
        response_mime_type: "application/json" 
      }
    };

    console.log(`🤖 Consultando a ${MODEL_NAME}...`);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Error de Google:", JSON.stringify(data, null, 2));
      throw new Error(data.error?.message || "Error en la API de IA");
    }

    // Extraemos el texto de la respuesta
    const textResponse = data.candidates[0].content.parts[0].text;
    
    // Parseamos a JSON para asegurarnos de enviarle un objeto limpio al Frontend
    const jsonResponse = JSON.parse(textResponse);

    console.log("✅ Producto detectado:", jsonResponse.name);
    return res.json(jsonResponse);

  } catch (error) {
    console.error("💥 Error en el controlador de IA:", error.message);
    return res.status(500).json({ error: "Error procesando la solicitud con IA" });
  }
};