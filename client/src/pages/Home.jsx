import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getProducts, deleteProduct } from '../services/productService';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';

// Importamos tus nuevas piezas de construcción profesionales
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Search, Plus, ShoppingCart, Pencil, Trash2 } from "lucide-react";

function Home() {
  const navigate = useNavigate(); 
  const { addToCart } = useCart(); 
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    const fetchInicial = async () => {
      try {
        const data = await getProducts();
        setProductos(data);
      } catch (error) {
        console.error("Error al cargar inventario:", error);
      }
    };
    fetchInicial();
  }, []);

  const handleEliminar = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este producto?")) {
      try {
        await deleteProduct(id);
        toast.success("Producto eliminado del sistema ");
        setProductos((productosActuales) => 
          productosActuales.filter((producto) => producto.id !== id)
        );
      } catch {
        toast.error("No se pudo eliminar el producto");
      }
    }
  };

const handleAgregarAlPedido = (producto) => {
  addToCart(producto);
  toast.success(`${producto.nombre} agregado al pedido 🛒`);
};

  const productosFiltrados = productos.filter((producto) => 
    producto.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  // --- 📊 CÁLCULO DE MÉTRICAS (Intacto) ---
  const totalProductos = productos.length;
  const valorInventario = productos.reduce((total, prod) => {
    return total + (parseFloat(prod.precio_venta) * parseInt(prod.stock));
  }, 0);

  return (
    // Reemplazamos el app-container por un contenedor responsivo de Tailwind
    <div className="container mx-auto py-8 px-4 md:px-8 max-w-7xl">

      {/* --- DASHBOARD HEADER MODERNO --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-card p-6 rounded-xl border border-border border-l-4 border-l-cyan-500 mb-8 gap-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-foreground">PANEL DE VENTAS </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Sistema de gestión interna
          </p>
        </div>

        {/* --- TARJETAS DE MÉTRICAS --- */}
        <div className="flex gap-4 w-full md:w-auto">
            <div className="bg-background px-4 py-3 rounded-lg border border-border text-center flex-1 md:min-w-[140px]">
                <span className="block text-[10px] text-muted-foreground uppercase tracking-wider mb-1 font-semibold">Items en Catálogo</span>
                <span className="text-2xl font-bold text-foreground">{totalProductos}</span>
            </div>
            <div className="bg-background px-4 py-3 rounded-lg border border-border text-center flex-1 md:min-w-[140px]">
                <span className="block text-[10px] text-muted-foreground uppercase tracking-wider mb-1 font-semibold">Valor del Stock</span>
                <span className="text-2xl font-bold text-cyan-500">
                    ${valorInventario.toLocaleString()}
                </span>
            </div>
        </div>
      </div>
      
      {/* --- BUSCADOR Y BOTÓN ACCIÓN --- */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
  
  {/* Contenedor relativo para el buscador */}
  <div className="relative w-full sm:max-w-md">
    {/* El ícono flotando a la izquierda */}
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    
    <Input 
      type="text" 
      placeholder="Buscar en inventario..." 
      value={busqueda}
      onChange={(e) => setBusqueda(e.target.value)}
      // pl-10 es la clave: empuja el texto hacia la derecha para no pisar el ícono
      className="w-full bg-background pl-10" 
    />
  </div>

        <Link to="/cargar" className="w-full sm:w-auto">
            <Button>
              <Plus className="mr-2 h-4" />
                Ingresar Stock
            </Button>
        </Link>
      </div>

      {/* --- GRID DE PRODUCTOS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {productosFiltrados.map((producto) => (
          
          <Card key={producto.id} className="overflow-hidden flex flex-col justify-between border-border/50 hover:border-cyan-500/50 transition-colors bg-card">
            
            {/* Contenedor de la Imagen */}
<div className="aspect-square bg-white relative flex items-center justify-center overflow-hidden p-4 rounded-t-xl">
  {producto.imagen_url && !producto.imagen_url.includes("null") && !producto.imagen_url.includes("undefined") ? (
    <img 
      src={producto.imagen_url} 
      alt={producto.nombre} 
      // LA CLAVE: object-contain en lugar de object-cover
      className="w-full h-full object-contain transition-transform hover:scale-105 duration-300"
      onError={(e) => {
        e.target.onerror = null;
        e.target.style.display = 'none';
      }}
    />
  ) : (
    <div className="text-gray-400 text-sm font-medium flex flex-col items-center gap-2">
      <span>📷</span>
      <span>Sin Foto</span>
    </div>
  )}
</div>

            {/* Contenido (Textos) */}
            <CardContent className="p-4 flex-grow">
                <h3 className="font-semibold text-lg line-clamp-1 mb-2 text-foreground" title={producto.nombre}>
                  {producto.nombre}
                </h3>
                
                <div className="flex justify-between items-center text-sm text-muted-foreground mb-4">
                    <span>Stock: <strong className="text-foreground">{producto.stock}</strong></span>
                </div>

                <p className="text-2xl font-bold text-cyan-500">
                  ${parseFloat(producto.precio_venta).toLocaleString()}
                </p>
            </CardContent>
            
            {/* Pie de Tarjeta (Botones) */}
<CardFooter className="p-4 pt-0 flex flex-col gap-3">
    
    <Button 
        className="w-full font-bold transition-all" 
        variant={producto.stock > 0 ? "default" : "secondary"}
        onClick={() => handleAgregarAlPedido(producto)}
        disabled={producto.stock <= 0} 
    >
        {producto.stock > 0 ? (
            <>
                <ShoppingCart className="mr-2 h-4 w-4" />
                {/*Agregar al Pedido*/}
            </>
        ) : (
            'Sin Stock'
        )}
    </Button>

    <div className="flex gap-2 w-full">
      <Button 
        variant="outline" 
        className="flex-1"
        onClick={() => navigate(`/editar/${producto.id}`)}
      >
          <Pencil className="mr-2 h-4 w-4" />
          {/*Editar*/}
      </Button>
      
      <Button 
        variant="destructive" 
        className="flex-1 bg-red-900/40 text-red-500 hover:bg-red-900/60 hover:text-red-400 border border-red-900/50"
        onClick={() => handleEliminar(producto.id)}
      >
          <Trash2 className="mr-2 h-4 w-4" />
          {/*Borrar*/}
      </Button>
    </div>
    
</CardFooter>

          </Card>
        ))}
      </div>
      
    </div>
  );
}

export default Home;