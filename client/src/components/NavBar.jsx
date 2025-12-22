import { Link, useNavigate, useLocation } from 'react-router-dom';
import './NavBar.css';
import toast from 'react-hot-toast';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

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
        <Link to="/">PERNSTORE </Link>
      </div>
      
      <ul className="navbar-links">
        <li><Link to="/">Catálogo</Link></li>
        
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