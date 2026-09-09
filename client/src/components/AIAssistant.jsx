import { useProductAI } from '../hooks/useProductAI';

const AIAssistant = ({ onProductDetected }) => {
  const { startListening, isListening, isAnalyzing, error } = useProductAI();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      
      <button 
        type="button" 
        // 👇 AQUÍ ESTABA EL ERROR: Debe ser una función flecha que pase 'onProductDetected'
        onClick={() => startListening(onProductDetected)}
        disabled={isListening || isAnalyzing}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          padding: '12px 20px',
          backgroundColor: isListening ? '#ef4444' : '#2563eb', 
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: isListening || isAnalyzing ? 'wait' : 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}
      >
        <span style={{ fontSize: '20px' }}>
            {isListening ? '👂' : isAnalyzing ? '🧠' : '🎤'}
        </span>
        
        {isListening ? 'Escuchando...' : isAnalyzing ? 'Procesando...' : 'Dictar Producto'}
      </button>

      {error && (
        <p style={{ color: '#dc2626', fontSize: '14px', margin: 0 }}>
          ⚠️ {error}
        </p>
      )}
      
      <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
        <i>Prueba decir: "Coca Cola de 2 litros precio 2500 stock 50"</i>
      </p>
    </div>
  );
};

export default AIAssistant;