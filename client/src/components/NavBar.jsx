import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { LogOut, Vault } from "lucide-react";
import { Button } from "@/components/ui/button";
import ModalControlCaja from './ModalControlCaja';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems } = useCart(); 
  const [mostrarModalCaja, setMostrarModalCaja] = useState(false);

  // Ocultamos la barra en el login
  if (location.pathname === '/login') {
    return null;
  }

  const isAuth = !!localStorage.getItem('token');

  const handleLogout = () => {
    if (window.confirm("¿Estás seguro de que quieres cerrar sesión? ")) {
      localStorage.removeItem('token');
      toast.success("¡Hasta la próxima! ");
      navigate('/login');
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
          
          {/* LOGO */}
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold tracking-tight text-foreground transition-opacity hover:opacity-80">
              <span className="text-cyan-500">{"< "}</span>
              PERNSTORE
              <span className="text-cyan-500">{" />"}</span>
            </Link>
          </div>
          
          {/* ENLACES CENTRALES */}
          <ul className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <li>
              <Link to="/" className="transition-colors hover:text-cyan-400">Catálogo</Link>
            </li>
            
            <li>
              <Link to="/carrito" className="relative transition-colors hover:text-cyan-400">
                Pedido
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-4 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-bold text-gray-900 shadow-md">
                    {totalItems}
                  </span>
                )}
              </Link>
            </li>

            <li>
              <Link to="/historial" className="transition-colors hover:text-cyan-400">Ventas</Link>
            </li>

            <li>
              <Link to="/cargar" className="transition-colors hover:text-cyan-400">Administrar</Link>
            </li>

            <li>
              <Link to="/carga-masiva" className="transition-colors text-cyan-400 font-semibold hover:text-cyan-300 flex items-center gap-1.5">
                <span>Carga con IA</span>
              </Link>
            </li>
          </ul>

          {/* ACCIONES DE USUARIO */}
          <div className="flex items-center gap-3">
            {isAuth && (
              <>
                <Button 
                  onClick={() => setMostrarModalCaja(true)}
                  variant="outline"
                  size="sm"
                  className="border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 flex items-center gap-1.5 font-medium"
                >
                  <Vault className="h-4 w-4" />
                  <span className="hidden sm:inline">Caja y Turnos</span>
                </Button>

                <Button 
                  onClick={handleLogout} 
                  variant="destructive"
                  size="sm"
                  className="bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors"
                >
                  <LogOut className="mr-1.5 h-4 w-4" />
                  Salir 
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Modal de Control de Caja y Arqueo (Punto 2) */}
      <ModalControlCaja 
        isOpen={mostrarModalCaja} 
        onClose={() => setMostrarModalCaja(false)} 
      />
    </>
  );
}

export default Navbar;
