import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getProducts, deleteProduct } from '../services/productService';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';

// Piezas de construcción profesionales
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Search, Plus, ShoppingCart, Pencil, Trash2, Barcode } from "lucide-react";

function Home() {
  const navigate = useNavigate(); 
  const { addToCart } = useCart(); 
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const inputBusquedaRef = useRef(null);

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

  // Mantener el foco en el buscador al iniciar (para el lector de códigos de barras)
  useEffect(() => {
    if (inputBusquedaRef.current) {
      inputBusquedaRef.current.focus();
    }
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

  // --- LÓGICA DE INTERCEPTACIÓN DEL LECTOR DE CÓDIGO DE BARRAS (PUNTO 1) ---
  // Los lectores USB envían el código y presionan automáticamente 'Enter'
  const handleKeyDownBusqueda = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const query = busqueda.trim();
      if (!query) return;

      // 1. Buscamos primero coincidencia exacta por código de barras
      let productoEncontrado = productos.find(
        (p) => p.codigo_barras && p.codigo_barras.trim().toLowerCase() === query.toLowerCase()
      );

      // 2. Si no es un código de barras, buscamos si hay coincidencia única por nombre
      if (!productoEncontrado) {
        const coincidencias = productos.filter((p) =>
          p.nombre.toLowerCase().includes(query.toLowerCase())
        );
        if (coincidencias.length === 1) {
          productoEncontrado = coincidencias[0];
        }
      }

      // 3. Procesamos el resultado
      if (productoEncontrado) {
        if (productoEncontrado.stock > 0) {
          addToCart(productoEncontrado);
          toast.success(`⚡ Escaneado: ${productoEncontrado.nombre}`, {
            icon: '🏷️',
            style: { border: '1px solid #00f3ff' }
          });
          setBusqueda(""); // Limpiamos para el próximo escaneo continuo
        } else {
          toast.error(`"${productoEncontrado.nombre}" no tiene stock disponible.`);
        }
      } else {
        toast.error(`No se encontró producto con código "${query}"`);
      }
    }
  };

  const productosFiltrados = productos.filter((producto) => 
    producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (producto.codigo_barras && producto.codigo_barras.toLowerCase().includes(busqueda.toLowerCase()))
  );

  // --- 📊 CÁLCULO DE MÉTRICAS ---
  const totalProductos = productos.length;
  const valorInventario = productos.reduce((total, prod) => {
    return total + (parseFloat(prod.precio_venta) * parseInt(prod.stock));
  }, 0);

  return (
    <div className="container mx-auto py-8 px-4 md:px-8 max-w-7xl">

      {/* --- DASHBOARD HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-card p-6 rounded-xl border border-border border-l-4 border-l-cyan-500 mb-8 gap-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-foreground">PANEL DE VENTAS (POS)</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Sistema de cobro y mostrador comercial
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
      
      {/* --- BUSCADOR Y LECTOR DE CÓDIGO DE BARRAS --- */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
        
        <div className="relative w-full sm:max-w-lg">
          <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-cyan-400" />
          
          <Input 
            ref={inputBusquedaRef}
            type="text" 
            placeholder="Escanear código de barras o buscar producto..." 
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={handleKeyDownBusqueda}
            autoFocus
            className="w-full bg-background pl-11 pr-24 py-2 border-border focus:border-cyan-500 text-sm font-medium" 
          />

          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase font-mono bg-muted/60 text-muted-foreground px-2 py-0.5 rounded border border-border">
            Enter ↵
          </span>
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
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-lg line-clamp-1 text-foreground" title={producto.nombre}>
                    {producto.nombre}
                  </h3>
                </div>

                {producto.codigo_barras && (
                  <span className="text-[11px] font-mono text-muted-foreground block mb-2 bg-muted/40 px-2 py-0.5 rounded w-fit border border-border">
                    🏷️ {producto.codigo_barras}
                  </span>
                )}
                
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
                            Agregar al Pedido
                        </>
                    ) : (
                        'Sin Stock'
                    )}
                </Button>

                <div className="flex gap-2 w-full">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/editar/${producto.id}`)}
                  >
                      <Pencil className="mr-2 h-3.5 w-3.5" />
                      Editar
                  </Button>
                  
                  <Button 
                    variant="destructive" 
                    size="sm"
                    className="flex-1 bg-red-900/40 text-red-500 hover:bg-red-900/60 hover:text-red-400 border border-red-900/50"
                    onClick={() => handleEliminar(producto.id)}
                  >
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Borrar
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
