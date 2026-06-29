import { create } from 'zustand';

// This manages the multi-role session state on the client
const useAuthStore = create((set) => ({
  token: localStorage.getItem('token') || null,
  activeRole: localStorage.getItem('activeRole') || null,
  userRoles: JSON.parse(localStorage.getItem('userRoles')) || [],
  
  setAuth: (token, activeRole) => {
    localStorage.setItem('token', token);
    localStorage.setItem('activeRole', activeRole);
    set({ token, activeRole });
  },

  setAvailableRoles: (roles) => {
    localStorage.setItem('userRoles', JSON.stringify(roles));
    set({ userRoles: roles });
  },

  logout: () => {
    localStorage.clear();
    set({ token: null, activeRole: null, userRoles: [] });
  }
}));

export default useAuthStore;