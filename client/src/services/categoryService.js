import { API_BASE_URL } from '../config/api';

const API_URL = API_BASE_URL;

export const createCategory = async (nombre) => {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch(`${API_URL}/categorias`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ nombre }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al crear la categoría');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

export const getCategories = async () => {
  try {
    const response = await fetch(`${API_URL}/categorias`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};
