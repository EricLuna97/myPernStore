import { useState } from 'react';

export const useProductAI = () => {
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  const startListening = (onSuccess) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Navegador no soportado");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = async (event) => {
      recognition.stop();
      setIsListening(false);

      const transcript = event.results[0][0].transcript;
      await analyzeText(transcript, onSuccess);
    };

    recognition.onerror = (event) => {
      console.error(event.error);
      setIsListening(false);
      setError("Error al escuchar");
    };

    recognition.start();
  };

  const analyzeText = async (text, onSuccess) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('http://localhost:3000/api/ai/analyze-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textPrompt: text }),
      });

      if (!response.ok) throw new Error('Error en IA');

      const data = await response.json();
      onSuccess(data);

    } catch (err) {
      console.error(err);
      setError("Error al procesar");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return { startListening, isListening, isAnalyzing, error };
};

export default useProductAI;