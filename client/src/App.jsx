import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Cargar from './pages/Cargar';
import './App.css';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cargar" element={<ProtectedRoute><Cargar /></ProtectedRoute>} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;