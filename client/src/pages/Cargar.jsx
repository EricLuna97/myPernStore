import { Link, useNavigate, useLocation } from 'react-router-dom';
import Formulario from '../components/Formulario';
import CategoriaForm from '../components/categoriaForm';

function Cargar() {
  const navigate = useNavigate();
  const location = useLocation();
  const productoAEditar = location.state?.productoEditar; 

  const alTerminar = () => {
    // Redirigir al usuario al inicio ('/')
    navigate('/');
  };

  return (
    <div className="app-container">
      <h1>Panel de Administración ⚙️</h1>
      
      <Link to="/">
        <button style={{ marginBottom: '20px' }}>⬅️ Volver a la Tienda</button>
      </Link>

      <CategoriaForm />

      <hr style={{ margin: '30px 0', border: '0', borderTop: '1px solid #ccc' }} />

      <Formulario alCrear={alTerminar}
      productoExistente={productoAEditar} />
    </div>
  );
}

export default Cargar;