import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css'; 
import toast from 'react-hot-toast';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        toast.success("¡Acceso Autorizado! 🔓");
        navigate('/'); 
      } else {
        toast.error(data.error || "Acceso Denegado ⛔");
      }
    } catch (error) {
      toast.error("Error de conexión con el servidor");
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <h2>🔐 Acceso</h2>
        
        <label>Email de Agente:</label>
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required 
          placeholder="admin@tienda.com"
        />

        <label>Clave de Seguridad:</label>
        <input 
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required 
          placeholder="••••••••"
        />

        <button type="submit">Ingresar</button>
      </form>
    </div>
  );
}

export default Login;