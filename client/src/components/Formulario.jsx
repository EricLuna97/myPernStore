import { useState, useEffect } from 'react';
import { createProduct, updateProduct } from '../services/productService';
import { getCategories } from '../services/categoryService';
import './Formulario.css';

function Formulario({ alCrear, productoExistente }) {
  const [archivo, setArchivo] = useState(null);
  const [listaCategorias, setListaCategorias] = useState([]);
  
  const [datos, setDatos] = useState({
    nombre: '',
    precio: '',
    stock: '',
    categoria_id: '' 
  });

  useEffect(() => {
    const cargarTodo = async () => {
      const cats = await getCategories();
      setListaCategorias(cats);

      if (productoExistente) {
        setDatos({
          nombre: productoExistente.nombre,
          precio: productoExistente.precio,
          stock: productoExistente.stock,
          categoria_id: productoExistente.categoria_id || '' 
        });
      }
    };
    cargarTodo();
  }, [productoExistente]);

  const handleChange = (e) => {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setArchivo(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!datos.categoria_id) {
      alert("Por favor selecciona una categoría");
      return;
    }

    const formData = new FormData();
    formData.append('nombre', datos.nombre);
    formData.append('precio', datos.precio);
    formData.append('stock', datos.stock);
    formData.append('categoria_id', datos.categoria_id);
    if (archivo) formData.append('imagen', archivo);

    try {
      if (productoExistente) {
        await updateProduct(productoExistente.id, formData);
        alert('Producto actualizado correctamente ✅');
      } else {
        await createProduct(formData);
        alert('Producto creado correctamente ✅');
      }
      
      if (alCrear) alCrear(); 
      
    } catch (error) {
      console.error(error);
      alert('Hubo un error al guardar');
    }
  };

  return (
    <form className="mi-formulario" onSubmit={handleSubmit}>
      <h2>
        {productoExistente ? `Editar: ${productoExistente.nombre}` : 'Nuevo Producto'}
      </h2>
      
      <label>Nombre del Producto:</label>
      <input 
        type="text" 
        name="nombre" 
        value={datos.nombre} 
        onChange={handleChange} 
        required 
      />
      
      <label>Precio ($):</label>
      <input 
        type="number" 
        name="precio" 
        value={datos.precio} 
        onChange={handleChange} 
        required 
      />
      
      <label>Stock Disponible:</label>
      <input 
        type="number" 
        name="stock" 
        value={datos.stock} 
        onChange={handleChange} 
        required 
      />
      
      <label>Categoría:</label>
      <select 
        name="categoria_id" 
        value={datos.categoria_id} 
        onChange={handleChange} 
        required
      >
        <option value="">-- Selecciona --</option>
        {listaCategorias.map((cat) => (
          <option key={cat.id} value={cat.id}>{cat.nombre}</option>
        ))}
      </select>

      <label>
        Imagen: 
        {productoExistente && <span style={{fontSize:'0.8rem', marginLeft:'10px'}}>(Deja vacío para mantener la actual)</span>}
      </label>
      <input type="file" onChange={handleFileChange} accept="image/*" />

      <button type="submit">
        {productoExistente ? '💾 Guardar Cambios' : '➕ Crear Producto'}
      </button>
    </form>
  );
}

export default Formulario;