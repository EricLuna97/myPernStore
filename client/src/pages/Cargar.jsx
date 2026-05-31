import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import { createProduct, updateProduct, createCategory, getCategories, getProductById } from '../services/productService';
import AIAssistant from '../components/AIAssistant';
import './Cargar.css'; 

function Cargar() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const isEditing = !!id; 

  const [listaCategorias, setListaCategorias] = useState([]);
  const [newCat, setNewCat] = useState('');

  const [formData, setFormData] = useState({
    nombre: '', descripcion: '', precio: '', stock: '', 
    categoria: '', imagen: null
  });

  useEffect(() => {
    cargarCategorias();
    if (isEditing) {
      cargarDatosProducto();
    }
  }, [id]);

  const cargarCategorias = async () => {
    try {
      const data = await getCategories();
      setListaCategorias(data);
    } catch (error) {
      console.error(error);
    }
  };

  const cargarDatosProducto = async () => {
    try {
      const producto = await getProductById(id);
      setFormData({
        nombre: producto.nombre,
        descripcion: producto.descripcion || '',
        precio: producto.precio,
        stock: producto.stock,
        categoria: producto.categoria || '',
        imagen: null 
      });
    } catch (error) {
      console.error(error);
      toast.error("Error cargando producto");
    }
  };

  const handleAIResult = useCallback((productData) => {
    let categoriaEncontrada = '';
    
    if (productData.category && listaCategorias.length > 0) {
      const match = listaCategorias.find(cat => 
        cat.nombre.toLowerCase().includes(productData.category.toLowerCase()) ||
        productData.category.toLowerCase().includes(cat.nombre.toLowerCase())
      );
      if (match) categoriaEncontrada = match.nombre;
    }

    setFormData(prev => ({
      ...prev,
      nombre: productData.name || prev.nombre,
      precio: productData.price || prev.precio,
      stock: productData.stock || prev.stock,
      descripcion: productData.description || prev.descripcion,
      categoria: categoriaEncontrada || prev.categoria
    }));

    setTimeout(() => {
      toast.success('¡Datos autocompletados con IA! ✨');
    }, 100);

  }, [listaCategorias]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, imagen: e.target.files[0] });
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    if (!formData.categoria) return toast.error("¡Debes seleccionar una categoría!");

    const data = new FormData();
    data.append('nombre', formData.nombre);
    data.append('descripcion', formData.descripcion);
    data.append('precio', formData.precio);
    data.append('stock', formData.stock);
    data.append('categoria', formData.categoria);
    if (formData.imagen) data.append('imagen', formData.imagen);

    try {
      if (isEditing) {
        await updateProduct(id, data);
        toast.success('¡Producto actualizado! 🔄');
        navigate('/'); 
      } else {
        await createProduct(data);
        toast.success('¡Producto guardado! 💾');
        setFormData({ nombre: '', descripcion: '', precio: '', stock: '', categoria: '', imagen: null });
        document.getElementById('fileInput').value = "";
      }
    } catch (error) {
      console.error(error);
      toast.error('Error al guardar');
    }
  };

  const handleSubmitCategory = async (e) => {
    e.preventDefault();
    try {
      await createCategory(newCat);
      toast.success(`Categoría "${newCat}" creada`);
      setNewCat(''); 
      cargarCategorias(); 
    } catch (error) {
      console.error(error);
      toast.error('Error al crear categoría');
    }
  };

  return (
    <div className="cargar-container">
      <div className="admin-grid">
        
        <div className="form-wrapper">
          <h1>{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</h1>
          
          {!isEditing && (
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(37, 99, 235, 0.1)', borderRadius: '8px', border: '1px solid #2563eb' }}>
               <label style={{display: 'block', marginBottom: '0.5rem', color: '#2563eb', fontWeight: 'bold'}}>
                 ✨ Carga Rápida (Beta IA)
               </label>
               <AIAssistant onProductDetected={handleAIResult} />
            </div>
          )}

          <form onSubmit={handleSubmitProduct}>
            <div className="form-group">
              <label>Nombre del Producto</label>
              <input 
                type="text" name="nombre" className="form-input"
                value={formData.nombre} onChange={handleChange} required 
              />
            </div>

            <div className="form-group">
              <label>Descripción</label>
              <textarea 
                name="descripcion" className="form-textarea"
                value={formData.descripcion} onChange={handleChange} 
              />
            </div>

            <div className="form-group">
              <label>Precio ($)</label>
              <input 
                type="number" name="precio" className="form-input"
                value={formData.precio} onChange={handleChange} required 
              />
            </div>

            <div className="form-group">
              <label>Stock</label>
              <input 
                type="number" name="stock" className="form-input"
                value={formData.stock} onChange={handleChange} required 
              />
            </div>
            
            <div className="form-group">
              <label>Categoría</label>
              <select 
                name="categoria" className="form-input select-cyber"
                value={formData.categoria} onChange={handleChange} required
              >
                <option value="">-- Selecciona una opción --</option>
                {listaCategorias.map((cat) => (
                  <option key={cat.id} value={cat.nombre}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Imagen {isEditing && "(Déjalo vacío para mantener la actual)"}</label>
              <input 
                id="fileInput" type="file" name="imagen" className="file-input"
                onChange={handleFileChange} 
              />
            </div>

            <button type="submit" className="submit-btn">
              {isEditing ? 'Actualizar Producto 🔄' : 'Guardar Producto 💾'}
            </button>
          </form>
        </div>

        <div className="form-wrapper category-wrapper">
          <h1>Nueva Categoría</h1>
          <form onSubmit={handleSubmitCategory}>
            <div className="form-group">
              <input 
                type="text" className="form-input"
                value={newCat} onChange={(e) => setNewCat(e.target.value)}
                placeholder="Ej: Cyberware" required
              />
            </div>
            <button type="submit" className="submit-btn btn-secondary">
              Crear Categoría +
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

export default Cargar;