const API_URL = 'http://localhost:3000';
export const getProducts = async () => {
  try {
    const response = await fetch(`${API_URL}/productos`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const createProduct = async (formData) => {
  try {
    const response = await fetch(`${API_URL}/productos`, {
      method: 'POST',
      body: formData, // No lleva headers manuales cuando es FormData
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

export const deleteProduct = async (id) => {
  try {
    await fetch(`${API_URL}/productos/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

export const updateProduct = async (id, formData) => {
  try {
    
    const response = await fetch(`${API_URL}/productos/${id}`, {
      method: 'PUT',
      body: formData, 
    });
    
    if (!response.ok) throw new Error('Error al actualizar');
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

