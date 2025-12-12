import { useState } from 'react';
import { createProduct } from '../services/productService';
import './Formulario.css';

function Formulario({ alCrear }) {
  const [archivo, setArchivo] = useState(null);
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

  const handleFileChange = (e) => {
    setArchivo(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('nombre', datos.nombre);
    formData.append('precio', datos.precio);
    formData.append('stock', datos.stock);
    formData.append('categoria_id', datos.categoria_id);
    
    if (archivo) {
      formData.append('imagen', archivo);
    }

    try {
      await createProduct(formData);
      alert('Producto creado con éxito!');
      
      setDatos({ nombre: '', precio: '', stock: '', categoria_id: '' });
      setArchivo(null); 
      
      const fileInput = document.getElementById('input-file');
      if(fileInput) fileInput.value = "";

      if (alCrear) alCrear();
      
    } catch (error) {
      console.error(error);
      alert('Hubo un error al guardar');
    }
  };

  return (
    <form className="mi-formulario" onSubmit={handleSubmit}>
      <h2>Cargar Producto</h2>
      
      <input 
        type="text" name="nombre" placeholder="Nombre" 
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
        type="number" name="categoria_id" placeholder="ID Cat" 
        value={datos.categoria_id} onChange={handleChange} required 
      />

      <label>Imagen:</label>
      <input 
        id="input-file"
        type="file" 
        name="imagen" 
        onChange={handleFileChange} 
        accept="image/*" 
      />

      <button type="submit">Guardar</button>
    </form>
  );
}

export default Formulario;