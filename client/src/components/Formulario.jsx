import { useState } from 'react';
import { createProduct } from '../services/productService';
import './Formulario.css';

function Formulario({ alCrear }) {
  const [datos, setDatos] = useState({
    nombre: '',
    precio: '',
    stock: '',
    categoria_id: ''
  });

  const handleChange = (e) => {
    setDatos({
      ...datos,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await createProduct(datos);
      alert('Producto creado con éxito!');
      
      setDatos({ nombre: '', precio: '', stock: '', categoria_id: '' });
      
      if (alCrear) alCrear();
      
    } catch (error) {
      alert('Hubo un error al guardar');
    }
  };

  return (
    <form className="mi-formulario" onSubmit={handleSubmit}>
      <h2>Agregar Nuevo Producto</h2>
      
      <input 
        type="text" name="nombre" placeholder="Nombre del producto" 
        value={datos.nombre} onChange={handleChange} required 
      />
      
      <input 
        type="number" name="precio" placeholder="Precio" 
        value={datos.precio} onChange={handleChange} required 
      />
      
      <input 
        type="number" name="stock" placeholder="Stock" 
        value={datos.stock} onChange={handleChange} required 
      />
      
      <input 
        type="number" name="categoria_id" placeholder="ID Categoría (1, 2 o 3)" 
        value={datos.categoria_id} onChange={handleChange} required 
      />

      <button type="submit">Guardar Producto</button>
    </form>
  );
}

export default Formulario;