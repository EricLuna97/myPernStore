import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Cargar from './pages/Cargar';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta principal: Muestra el Home */}
        <Route path="/" element={<Home />} />
        
        {/* Ruta de carga: Muestra la página Cargar */}
        <Route path="/cargar" element={<Cargar />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;