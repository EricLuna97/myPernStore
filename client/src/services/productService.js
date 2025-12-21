const API_URL = 'http://localhost:3000'; 

// Función auxiliar para obtener el token
const getToken = () => {
  return localStorage.getItem('token');
};

export const getProducts = async () => {
  // Esta es pública, no necesita token
  const response = await fetch(`${API_URL}/productos`);
  const data = await response.json();
  return data;
};

export const getProductById = async (id) => {
  const response = await fetch(`${API_URL}/productos/${id}`);
  if (!response.ok) throw new Error('Error al obtener producto');
  return await response.json();
};

export const createProduct = async (formData) => {
  const token = getToken();
  const response = await fetch(`${API_URL}/productos`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}` 
    },
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al crear producto');
  }
  return await response.json();
};

export const deleteProduct = async (id) => {
  const token = getToken();
  const response = await fetch(`${API_URL}/productos/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) throw new Error('Error al eliminar');
  return true;
};

export const updateProduct = async (id, formData) => {
  const token = getToken();
  const response = await fetch(`${API_URL}/productos/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData,
  });
  
  if (!response.ok) throw new Error('Error al actualizar');
  return await response.json();
};

// Obtener lista de categorías
export const getCategories = async () => {
  const response = await fetch(`${API_URL}/categorias`); 
  if (!response.ok) throw new Error('Error al obtener categorías');
  return await response.json();
};

// Crear nueva categoría
export const createCategory = async (nombre) => {
  const token = getToken(); // Usamos la función auxiliar aquí también
  const response = await fetch(`${API_URL}/categorias`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ nombre })
  });
  
  if (!response.ok) throw new Error('Error al crear categoría');
  return await response.json();
};