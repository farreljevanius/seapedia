import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

export default function ProductCatalog() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { token, activeRole } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/products');
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      setProducts(data);
    } catch (err) {
      setError('Failed to load catalog');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async (productId) => {
    if (!token || activeRole !== 'BUYER') {
      alert('You must be logged in as a Buyer to add items to your cart.');
      navigate('/login');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/buyer/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId, quantity: 1 })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      alert('Added to cart safely!');
    } catch (err) {
      alert(`Error: ${err.message}`); // Will display Single-Store rule errors here
    }
  };

  if (isLoading) return <div className="text-center p-12 text-xl font-semibold">Loading marketplace...</div>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900">SEAPEDIA Explore</h1>
        
        {/* Contextual Navigation based on Role */}
        {!token ? (
          <button onClick={() => navigate('/login')} className="text-blue-600 font-bold hover:underline">
            Login / Register
          </button>
        ) : (
          <button onClick={() => navigate(`/${activeRole.toLowerCase()}/dashboard`)} className="bg-gray-800 text-white px-4 py-2 rounded">
            Return to Dashboard
          </button>
        )}
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map(product => (
          <div key={product.id} className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col">
            
            {/* Dummy Image Placeholder */}
            <div className="h-48 bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">Image</span>
            </div>
            
            <div className="p-4 flex-grow flex flex-col">
              <div className="text-xs font-bold text-blue-600 mb-1 uppercase tracking-wide">
                Store: {product.store?.name || 'Unknown Store'}
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2 leading-tight">
                {product.name}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                {product.description}
              </p>
              
              <div className="mt-auto flex justify-between items-end">
                <div>
                  <div className="text-xl font-black text-gray-900">
                    Rp {product.price.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Stock: {product.stock}
                  </div>
                </div>
                
                <button 
                  onClick={() => handleAddToCart(product.id)}
                  disabled={product.stock === 0}
                  className={`px-4 py-2 rounded font-bold text-sm transition-colors ${
                    product.stock === 0 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {product.stock === 0 ? 'Sold Out' : '+ Cart'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}