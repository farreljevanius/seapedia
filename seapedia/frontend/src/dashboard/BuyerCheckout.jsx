import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

export default function BuyerCheckout() {
  const [cartItems, setCartItems] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [deliveryMethod, setDeliveryMethod] = useState('REGULAR');
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState({ code: null, amount: 0 });
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { token } = useAuthStore();
  const navigate = useNavigate();

  const PPN_RATE = 0.12;

  useEffect(() => {
    fetchCheckoutData();
  }, []);

  const fetchCheckoutData = async () => {
    try {
      // Fetch Cart
      const cartRes = await fetch('http://localhost:5000/api/buyer/cart', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const cartData = await cartRes.json();
      setCartItems(cartData.items || []);

      // Fetch User Wallet Balance
      const profileRes = await fetch('http://localhost:5000/api/buyer/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const profileData = await profileRes.json();
      setWalletBalance(profileData.wallet || 0);
    } catch (err) {
      setError('Failed to load checkout data');
    }
  };

  // Financial Calculations based on rules
  const subtotal = cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  
  let deliveryFee = 0;
  if (deliveryMethod === 'INSTANT') deliveryFee = 50000;
  if (deliveryMethod === 'NEXT_DAY') deliveryFee = 25000;
  if (deliveryMethod === 'REGULAR') deliveryFee = 10000;

  const taxableAmount = subtotal - appliedDiscount.amount;
  const taxAmount = taxableAmount > 0 ? taxableAmount * PPN_RATE : 0;
  const finalTotal = taxableAmount + taxAmount + deliveryFee;

  const handleApplyDiscount = async () => {
    // In a real app, verify with backend. Simulating frontend validation for speed.
    if (discountCode === 'PROMO20') {
      setAppliedDiscount({ code: 'PROMO20', amount: subtotal * 0.20 });
      setError('');
    } else {
      setError('Invalid or expired discount code');
      setAppliedDiscount({ code: null, amount: 0 });
    }
  };

  const handleProcessPayment = async () => {
    if (walletBalance < finalTotal) {
      setError('Insufficient wallet balance. Please top up.');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch('http://localhost:5000/api/buyer/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ deliveryMethod, discountCode: appliedDiscount.code })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Redirect to success / order history
      navigate('/buyer/orders', { state: { message: 'Order placed successfully!' } });
    } catch (err) {
      setError(err.message);
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 flex flex-col lg:flex-row gap-8">
      {/* Left Column: Details */}
      <div className="flex-grow space-y-6">
        <h1 className="text-3xl font-bold">Checkout</h1>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-sm">
            {error}
          </div>
        )}

        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">Delivery Method</h2>
          <div className="space-y-3">
            {['INSTANT', 'NEXT_DAY', 'REGULAR'].map((method) => (
              <label key={method} className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-gray-50 rounded">
                <input 
                  type="radio" 
                  name="delivery" 
                  value={method}
                  checked={deliveryMethod === method}
                  onChange={(e) => setDeliveryMethod(e.target.value)}
                  className="h-4 w-4 text-blue-600"
                />
                <span className="font-medium">{method.replace('_', ' ')}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">Apply Discount</h2>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Enter Voucher or Promo (Try PROMO20)" 
              className="flex-grow p-2 border rounded uppercase"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
            />
            <button 
              onClick={handleApplyDiscount}
              className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900"
            >
              Apply
            </button>
          </div>
          {appliedDiscount.amount > 0 && (
            <p className="text-green-600 text-sm mt-2 font-bold">
              Discount applied! You save Rp {appliedDiscount.amount.toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* Right Column: Financial Summary */}
      <div className="w-full lg:w-1/3 space-y-6">
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">Order Summary</h2>
          
          <div className="space-y-3 mb-6 text-gray-700">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>Rp {subtotal.toLocaleString()}</span>
            </div>
            {appliedDiscount.amount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>- Rp {appliedDiscount.amount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span>Rp {deliveryFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>PPN (12%)</span>
              <span>Rp {taxAmount.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center border-t pt-4 mb-6">
            <span className="text-lg font-bold">Total Payment</span>
            <span className="text-2xl font-bold text-blue-700">
              Rp {finalTotal.toLocaleString()}
            </span>
          </div>

          <div className="bg-gray-50 p-4 rounded mb-6 border">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-semibold text-gray-600">SEAPAY Wallet</span>
              <span className={`font-bold ${walletBalance < finalTotal ? 'text-red-600' : 'text-green-600'}`}>
                Rp {walletBalance.toLocaleString()}
              </span>
            </div>
            {walletBalance < finalTotal && (
              <p className="text-xs text-red-500 mt-1">Please top up your wallet to proceed.</p>
            )}
          </div>

          <button 
            onClick={handleProcessPayment}
            disabled={isProcessing || walletBalance < finalTotal}
            className={`w-full py-3 rounded font-bold text-white transition-colors ${
              isProcessing || walletBalance < finalTotal 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700 shadow-md'
            }`}
          >
            {isProcessing ? 'Processing...' : 'Pay & Order'}
          </button>
        </div>
      </div>
    </div>
  );
}