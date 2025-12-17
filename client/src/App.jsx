import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Cargar from './pages/Cargar';
import './App.css';
import Login from './pages/Login';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cargar" element={<Cargar />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;