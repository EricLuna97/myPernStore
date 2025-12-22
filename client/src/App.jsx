import { Routes, Route } from 'react-router-dom';
import Navbar from './components/NavBar';
import Home from './pages/Home';
import Cargar from './pages/Cargar';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from 'react-hot-toast';
import Carrito from './pages/Carrito';
import './App.css';
import Ventas from './pages/Ventas';

function App() {
  return (
    <>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          style: {
            background: '#1a1a1a', // Fondo oscuro
            color: '#fff',         // Texto blanco
            border: '1px solid #00f3ff', // Borde Neón Cyan
            padding: '16px',
            fontSize: '1rem',
          },
          success: {
            iconTheme: {
              primary: '#00f3ff',
              secondary: '#000',
            },
          },
          error: {
            style: {
              border: '1px solid #ff0055', // Borde Neón Rojo para errores
            },
            iconTheme: {
              primary: '#ff0055',
              secondary: '#fff',
            },
          },
        }}
      />

      <Navbar />

      <div className='main-content'>
        <Routes>
          <Route path="/historial" element={<ProtectedRoute><Ventas /></ProtectedRoute>}/>
          <Route path="/carrito" element={<ProtectedRoute><Carrito /></ProtectedRoute>}/>
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/cargar" element={<ProtectedRoute><Cargar /></ProtectedRoute>} />
          <Route path="/editar/:id" element={<ProtectedRoute><Cargar /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </>
  );
}

export default App;