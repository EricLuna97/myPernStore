import { useState } from 'react';
import { createCategory } from '../services/categoryService';

function CategoriaForm() {
  const [nombre, setNombre] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre) return;

    try {
      const nuevaCat = await createCategory(nombre);
      alert(`Categoría "${nuevaCat.nombre}" creada con ID: ${nuevaCat.id}`);
      setNombre(''); // Limpiar campo
    } catch (error) {
      alert('Error al crear categoría');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h3>Nueva Categoría</h3>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          placeholder="Nombre (ej: Zapatillas)"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          style={{ padding: '8px' }}
        />
        <button type="submit" style={styles.btn}>Guardar</button>
      </div>
    </form>
  );
}

const styles = {
  form: {
    padding: '20px',
    background: '#f8f9fa',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #dee2e6'
  },
  btn: {
    padding: '8px 15px',
    background: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  }
};

export default CategoriaForm;