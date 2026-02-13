import axios from "axios";

const API_Base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Ensure cookies are sent with requests
axios.defaults.withCredentials = true;

export const CartService = {
    getCart: async () => {
        const response = await axios.get(`${API_Base}/api/cart/`);
        return response.data;
    },

    addToCart: async (productId: number | string, quantity: number = 1) => {
        const response = await axios.post(`${API_Base}/api/cart/`, {
            product_id: productId,
            quantity,
        });
        return response.data;
    },

    removeFromCart: async (productId: number | string) => {
        const response = await axios.delete(`${API_Base}/api/cart/`, {
            data: { product_id: productId },
        });
        return response.data;
    },

    updateQuantity: async (productId: number | string, quantity: number) => {
        const response = await axios.patch(`${API_Base}/api/cart/`, {
            product_id: productId,
            quantity,
        });
        return response.data;
    }
};
