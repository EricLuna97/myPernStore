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
    maxWidth: '500px',        /* 1. Limitamos el ancho (para que no ocupe toda la pantalla) */
    margin: '0 auto 20px auto', /* 2. Centramos la caja horizontalmente */
    padding: '20px',
    background: '#06b6d4',
    borderRadius: '8px',
    border: '1px solid #dee2e6',
    display: 'flex',          /* 3. Flexbox para organizar el contenido interno */
    flexDirection: 'column',  /* Elementos en columna (título arriba, inputs abajo) */
    alignItems: 'center',     /* Centramos el título y los inputs dentro de la caja */
    gap: '10px'               /* Espacio entre el título y los campos */
  },
  btn: {
    padding: '8px 15px',
    background: '#0c2caeff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold'
  }
};

export default CategoriaForm;