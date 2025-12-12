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
            body: formData,
        });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};