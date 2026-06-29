import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

export default function BuyerCart() {
  const [cartItems, setCartItems] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/buyer/cart', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCartItems(data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (itemId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/buyer/cart/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchCart();
    } catch (err) {
      setError('Failed to remove item');
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  if (isLoading) return <div className="p-8 text-center">Loading cart...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Your Shopping Cart</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Cart Error:</p>
          <p>{error}</p>
        </div>
      )}

      {cartItems.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">Your cart is empty.</p>
          <button 
            onClick={() => navigate('/catalog')}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Browse Products
          </button>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-grow space-y-4">
            <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 font-semibold mb-4">
              Single-Store Checkout Active: All items below belong to {cartItems[0].product.store.name}
            </div>
            
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center bg-white p-4 rounded shadow">
                <div>
                  <h3 className="font-bold text-lg">{item.product.name}</h3>
                  <p className="text-gray-600">Rp {item.product.price.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="font-bold">Rp {(item.product.price * item.quantity).toLocaleString()}</p>
                  <button 
                    onClick={() => handleRemove(item.id)}
                    className="text-red-500 text-sm hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="w-full md:w-1/3 bg-white p-6 rounded shadow h-fit">
            <h2 className="text-xl font-bold mb-4">Summary</h2>
            <div className="flex justify-between mb-4">
              <span>Subtotal</span>
              <span className="font-bold">Rp {calculateSubtotal().toLocaleString()}</span>
            </div>
            <button 
              onClick={() => navigate('/buyer/checkout')}
              className="w-full bg-green-600 text-white py-3 rounded font-bold hover:bg-green-700"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}