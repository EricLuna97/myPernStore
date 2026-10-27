import { useState, useEffect } from 'react';
import { createProduct, updateProduct } from '../services/productService';
import { getCategories } from '../services/categoryService';
import { Barcode } from 'lucide-react';
import './Formulario.css';

function Formulario({ alCrear, productoExistente }) {
  const [archivo, setArchivo] = useState(null);
  const [listaCategorias, setListaCategorias] = useState([]);
  
  const [datos, setDatos] = useState({
    nombre: '',
    codigo_barras: '',
    descripcion: '',
    precio_costo: '',
    precio_venta: '',
    stock: '',
    categoria_id: '' 
  });

  useEffect(() => {
    const cargarTodo = async () => {
      try {
        const cats = await getCategories();
        setListaCategorias(cats);

        if (productoExistente) {
          setDatos({
            nombre: productoExistente.nombre || '',
            codigo_barras: productoExistente.codigo_barras || '',
            descripcion: productoExistente.descripcion || '',
            precio_costo: productoExistente.precio_costo || '',
            precio_venta: productoExistente.precio_venta || '',
            stock: productoExistente.stock ?? '',
            categoria_id: productoExistente.categoria_id || '' 
          });
        }
      } catch (err) {
        console.error("Error al cargar categorías:", err);
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
    formData.append('codigo_barras', datos.codigo_barras);
    formData.append('descripcion', datos.descripcion);
    formData.append('precio_costo', datos.precio_costo);
    formData.append('precio_venta', datos.precio_venta);
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
      alert('Error: ' + (error.message || 'Hubo un error al guardar'));
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

      <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Barcode style={{ width: '18px', height: '18px' }} />
        Código de Barras (Opcional - Escanea con tu lector):
      </label>
      <input 
        type="text" 
        name="codigo_barras" 
        placeholder="Ej: 7791234567890" 
        value={datos.codigo_barras} 
        onChange={handleChange} 
      />
      
      <label>Precio Costo ($):</label>
      <input 
        type="number" 
        step="0.01"
        name="precio_costo" 
        value={datos.precio_costo} 
        onChange={handleChange} 
        required 
      />

      <label>Precio Venta ($):</label>
      <input 
        type="number" 
        step="0.01"
        name="precio_venta" 
        value={datos.precio_venta} 
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
