import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import { createProduct, updateProduct, getProductById } from '../services/productService';
import { getCategories, createCategory } from '../services/categoryService';
import AIAssistant from '../components/AIAssistant';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

function Cargar() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const isEditing = !!id; 

  const [listaCategorias, setListaCategorias] = useState([]);
  const [newCat, setNewCat] = useState('');

  const [formData, setFormData] = useState({
    nombre: '', 
    descripcion: '', 
    precio_costo: '', 
    precio_venta: '', 
    stock: '',
    categoria_id: '', 
    imagen: null
  });

  const fetchCategories = useCallback(async () => {
    try {
      const data = await getCategories();
      setListaCategorias(data);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar categorias");
    }
  }, []); 

  useEffect(() => {
    const initFetch = async () => {
      await fetchCategories();
    };
    initFetch();
  }, [fetchCategories]);

  useEffect(() => {
    const existingScript = document.getElementById('cloudinary-widget-script');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'cloudinary-widget-script';
      script.src = 'https://upload-widget.cloudinary.com/global/all.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    const cargarDatosProducto = async () => {
      try {
        const producto = await getProductById(id);
        setFormData({
          nombre: producto.nombre || '',
          descripcion: producto.descripcion || '',
          precio_costo: producto.precio_costo || '',
          precio_venta: producto.precio_venta || '',
          stock: producto.stock || '',
          categoria_id: producto.categoria_id || '',
          imagen: producto.imagen_url || null
        });
      } catch (error) {
        console.error(error);
        toast.error("Error al cargar el producto");
        navigate('/'); 
      }
    };

    if (isEditing) {
      cargarDatosProducto();
    } else {
      Promise.resolve().then(() => {
        setFormData({
          nombre: '', descripcion: '', precio_costo: '', precio_venta: '', stock: '',
          categoria_id: '', imagen: null
        });
      });
    }
  }, [id, isEditing, navigate]); 

  const handleAIResult = useCallback((productData) => {
    let categoriaEncontradaId = '';
    
    if (productData.category && listaCategorias.length > 0) {
      const match = listaCategorias.find(cat => 
        cat.nombre.toLowerCase().includes(productData.category.toLowerCase()) ||
        productData.category.toLowerCase().includes(cat.nombre.toLowerCase())
      );
      if (match) categoriaEncontradaId = match.id;
    }

    setFormData(prev => ({
      ...prev,
      nombre: productData.name || prev.nombre,
      precio_venta: productData.price || prev.precio_venta,
      stock: productData.stock || prev.stock,
      descripcion: productData.description || prev.descripcion,
      categoria_id: categoriaEncontradaId || prev.categoria_id
    }));

    setTimeout(() => {
      toast.success('Datos autocompletados con IA');
    }, 100);
  }, [listaCategorias]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCloudinaryUpload = (e) => {
    e.preventDefault();
    if (window.cloudinary) {
      window.cloudinary.createUploadWidget(
        {
          cloudName: 'yqdjvd5v',
          uploadPreset: 'pernstore_productos',
          sources: ['local', 'camera', 'url'],
          multiple: false,
          clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
          maxImageFileSize: 2000000
        },
        (error, result) => {
          if (!error && result && result.event === "success") {
            setFormData(prev => ({ ...prev, imagen: result.info.secure_url }));
            toast.success('Imagen subida correctamente');
          }
        }
      ).open();
    }
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    if (!formData.categoria_id) {
      return toast.error("Debes seleccionar una categoria");
    }

    const data = new FormData();
    data.append('nombre', formData.nombre);
    data.append('descripcion', formData.descripcion);
    data.append('precio_costo', formData.precio_costo);
    data.append('precio_venta', formData.precio_venta);
    data.append('stock', formData.stock);
    data.append('categoria_id', formData.categoria_id);
    if (formData.imagen) data.append('imagen', formData.imagen);

    try {
      if (isEditing) {
        await updateProduct(id, data);
        toast.success('Producto actualizado exitosamente');
        navigate('/'); 
      } else {
        await createProduct(data);
        toast.success('Producto guardado exitosamente');
        setFormData({ nombre: '', descripcion: '', precio_costo: '', precio_venta: '', stock: '', categoria_id: '', imagen: null });
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al guardar el producto');
    }
  };

  const handleSubmitCategory = async (e) => {
    e.preventDefault();
    try {
      await createCategory(newCat);
      toast.success(`Categoria ${newCat} creada`);
      setNewCat(''); 
      fetchCategories(); 
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al crear la categoria');
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <Card className="lg:col-span-2 p-6 bg-card border-border shadow-sm">
          <h1 className="text-2xl font-bold text-foreground mb-6">
            {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
          </h1>
          
          {!isEditing && (
            <div className="mb-6 p-4 bg-cyan-950/20 rounded-lg border border-cyan-900/50">
               <label className="block mb-2 text-cyan-500 font-bold text-sm">
                 Carga Rapida Asistida (IA)
               </label>
               <AIAssistant onProductDetected={handleAIResult} />
            </div>
          )}

          <form onSubmit={handleSubmitProduct} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Nombre del Producto</label>
              <Input 
                type="text" name="nombre" 
                value={formData.nombre} onChange={handleChange} required 
                className="bg-background"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Descripcion</label>
              <textarea 
                name="descripcion" 
                value={formData.descripcion} onChange={handleChange} 
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Costo ($)</label>
                <Input 
                  type="number" name="precio_costo" 
                  value={formData.precio_costo} onChange={handleChange} required 
                  className="bg-background"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Venta ($)</label>
                <Input 
                  type="number" name="precio_venta" 
                  value={formData.precio_venta} onChange={handleChange} required 
                  className="bg-background"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Stock</label>
                <Input 
                  type="number" name="stock" 
                  value={formData.stock} onChange={handleChange} required 
                  className="bg-background"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Categoria</label>
              <select 
                name="categoria_id" 
                value={formData.categoria_id} onChange={handleChange} required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Selecciona una opcion</option>
                {listaCategorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2">
              <label className="text-sm font-medium text-foreground mb-2 block">Imagen del Producto</label>
              <div className="flex items-center gap-4">
                <Button type="button" variant="outline" onClick={handleCloudinaryUpload} className="w-full md:w-auto">
                  Subir Foto
                </Button>
                {formData.imagen && (
                  <span className="text-sm text-cyan-500 font-medium truncate max-w-xs">
                    Archivo listo para guardar
                  </span>
                )}
              </div>
            </div>

            <div className="pt-4">
              <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold">
                {isEditing ? 'Actualizar Producto' : 'Guardar Producto'}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="p-6 bg-card border-border shadow-sm h-fit">
          <h2 className="text-xl font-bold text-foreground mb-6">Nueva Categoria</h2>
          <form onSubmit={handleSubmitCategory} className="space-y-4">
            <div>
              <Input 
                type="text" 
                value={newCat} onChange={(e) => setNewCat(e.target.value)}
                placeholder="Ej: Accesorios" required
                className="bg-background"
              />
            </div>
            <Button type="submit" variant="secondary" className="w-full font-bold">
              Crear Categoria
            </Button>
          </form>
        </Card>

      </div>
    </div>
  );
}

export default Cargar;