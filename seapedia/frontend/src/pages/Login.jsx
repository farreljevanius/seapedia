import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [availableRoles, setAvailableRoles] = useState([]);
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { setAuth, setAvailableRoles: setStoreRoles } = useAuthStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);

      setUserId(data.userId);
      setAvailableRoles(data.availableRoles);
      setStoreRoles(data.availableRoles);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRoleSelection = async (role) => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, selectedRole: role })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);

      // Save token and navigate strictly to their dashboard
      setAuth(data.token, data.activeRole);
      navigate(`/${role.toLowerCase()}/dashboard`);
    } catch (err) {
      setError(err.message);
    }
  };

  if (availableRoles.length > 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h2 className="text-2xl font-bold mb-4 text-center">Select Your Active Role</h2>
          <div className="space-y-3">
            {availableRoles.map(role => (
              <button 
                key={role} 
                onClick={() => handleRoleSelection(role)}
                className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
              >
                Log in as {role}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">SEAPEDIA Login</h2>
        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
        
        <input 
          type="text" placeholder="Username" required
          className="w-full mb-4 p-2 border rounded"
          value={username} onChange={e => setUsername(e.target.value)}
        />
        <input 
          type="password" placeholder="Password" required
          className="w-full mb-6 p-2 border rounded"
          value={password} onChange={e => setPassword(e.target.value)}
        />
        
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded font-bold hover:bg-blue-700">
          Sign In
        </button>
      </form>
    </div>
  );
}