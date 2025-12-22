import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import './Navbar.css';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems } = useCart(); 

  if (location.pathname === '/login') {
    return null;
  }

  const isAuth = !!localStorage.getItem('token');

  const handleLogout = () => {
    if (window.confirm("¿Estás seguro de que quieres cerrar sesión? 🔒")) {
      localStorage.removeItem('token');
      toast.success("¡Hasta la próxima! 👋");
      navigate('/login');
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/">PERNSTORE</Link>
      </div>
      
      <ul className="navbar-links">
        
        {/* 1. CATÁLOGO */}
        <li><Link to="/">Catálogo</Link></li>
        
        {/* 2. PEDIDO (Con el contador) */}
        <li>
          <Link to="/carrito" style={{ position: 'relative' }}>
            Pedido
            {totalItems > 0 && (
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-12px',
                background: '#ff0055',
                color: 'white',
                borderRadius: '50%',
                padding: '2px 6px',
                fontSize: '0.7rem',
                fontWeight: 'bold'
              }}>
                {totalItems}
              </span>
            )}
          </Link>
        </li>

        {/* 3. VENTAS (Lleva al historial) */}
        <li><Link to="/historial">Ventas</Link></li>

        {/* 4. ADMINISTRAR (Lleva a cargar/editar) */}
        <li><Link to="/cargar">Administrar</Link></li>

        {isAuth && (
          <li>
            <button onClick={handleLogout} className="logout-btn">
              Salir 🔒
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;