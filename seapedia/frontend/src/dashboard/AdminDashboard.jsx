import { useState } from 'react';
import useAuthStore from '../store/useAuthStore';

export default function AdminDashboard() {
  const { token } = useAuthStore();
  const [promoCode, setPromoCode] = useState('');
  const [discountValue, setDiscountValue] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // LEVEL 6: Generate Promos/Vouchers
  const handleGeneratePromo = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/vouchers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: promoCode, value: parseFloat(discountValue) })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      setStatusMessage(`Success: Promo ${data.voucher.code} created!`);
      setPromoCode('');
      setDiscountValue('');
    } catch (err) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // LEVEL 6: Overdue Handling / Time Simulation
  const handleSimulateTime = async () => {
    setIsLoading(true);
    setStatusMessage('Simulating next day... checking SLAs...');
    
    try {
      const res = await fetch('http://localhost:5000/api/admin/simulate-time', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      setStatusMessage(`System Update: ${data.message}`);
    } catch (err) {
      setStatusMessage(`Error simulating time: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Admin Control Center</h1>
      
      {statusMessage && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded shadow-sm font-semibold">
          {statusMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Overdue Operations Panel */}
        <div className="bg-white p-6 rounded-lg shadow border-t-4 border-red-500">
          <h2 className="text-xl font-bold mb-4">Operations & SLA Monitoring</h2>
          <p className="text-gray-600 mb-6">
            Trigger the end-of-day sequence. This will scan all active orders. 
            Orders exceeding their delivery SLA (Instant, Next Day, Regular) will be automatically marked as 
            <span className="font-bold"> DIKEMBALIKAN</span> and funds will be refunded to the buyer's SEAPAY wallet.
          </p>
          <button 
            onClick={handleSimulateTime}
            disabled={isLoading}
            className="w-full bg-red-600 text-white py-3 rounded font-bold hover:bg-red-700 transition-colors disabled:bg-gray-400"
          >
            {isLoading ? 'Processing...' : 'Simulate Next Day & Process Refunds'}
          </button>
        </div>

        {/* Promo Generation Panel */}
        <div className="bg-white p-6 rounded-lg shadow border-t-4 border-green-500">
          <h2 className="text-xl font-bold mb-4">Generate Discount Resources</h2>
          <form onSubmit={handleGeneratePromo} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Promo Code</label>
              <input 
                type="text" 
                required
                className="w-full p-2 border rounded uppercase"
                placeholder="e.g., SEAPEDIA2026"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value (Percentage or Flat)</label>
              <input 
                type="number" 
                required
                min="1"
                className="w-full p-2 border rounded"
                placeholder="e.g., 20"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
              />
            </div>
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700 transition-colors disabled:bg-gray-400"
            >
              Generate Promo
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}