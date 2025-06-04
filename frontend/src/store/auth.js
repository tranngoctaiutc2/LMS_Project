import { create } from "zustand";
import { mountStoreDevtool } from "simple-zustand-devtools";

const useAuthStore = create((set, get) => ({
  allUserData: null,
  loading: true, // Start with true để show loading khi app khởi động

  // Computed values as getters (functions)
  user: () => {
    const userData = get().allUserData;
    return userData ? {
      user_id: userData.user_id || null,
      username: userData.username || null,
      email: userData.email || null,
      full_name: userData.full_name || null,
    } : null;
  },

  // Actions
  setUser: (user) => {
    set({
      allUserData: user,
      loading: false, // Set loading false when user is set
    });
  },

  setLoading: (loading) => set({ loading }),

  // Helper methods
  isLoggedIn: () => get().allUserData !== null,
  
  getUserId: () => get().allUserData?.user_id || null,
  
  getUsername: () => get().allUserData?.username || null,
  
  getEmail: () => get().allUserData?.email || null,

  // Clear user data (for logout)
  clearUser: () => {
    set({
      allUserData: null,
      loading: false,
    });
  },

  // Initialize user (for app startup)
  initializeAuth: () => {
    set({ loading: true });
  },
}));

if (import.meta.env.DEV) {
  mountStoreDevtool("AuthStore", useAuthStore);
}

export { useAuthStore };