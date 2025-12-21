import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/NavBar';
import Home from './pages/Home';
import Cargar from './pages/Cargar';
import './App.css';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
   
   <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cargar" 
        element={
        <ProtectedRoute>
          <Cargar />
          </ProtectedRoute>
        }
      />
        <Route path="/login" element={<Login />} />
        <Route 
  path="/editar/:id" 
  element={
    <ProtectedRoute>
      <Cargar />
    </ProtectedRoute>
  } 
/>
      </Routes>
    </BrowserRouter>
  );  
}

export default App;