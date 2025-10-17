import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'moderator' | 'viewer';
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  adminUser: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        // Fetch admin details from Firestore
        try {
          const adminDoc = await getDoc(doc(db, 'admins', firebaseUser.uid));
          if (adminDoc.exists()) {
            const adminData = adminDoc.data();
            setAdminUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: adminData.name || 'Admin',
              role: adminData.role || 'viewer',
              permissions: adminData.permissions || ['view_alerts']
            });
          } else {
            // If not in admins collection, check if it's a super admin
            // For now, we'll assume any authenticated user is an admin
            setAdminUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: 'Admin User',
              role: 'viewer',
              permissions: ['view_alerts', 'view_users']
            });
          }
        } catch (error) {
          console.error('Error fetching admin data:', error);
          setAdminUser(null);
        }
      } else {
        setUser(null);
        setAdminUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(error.message || 'Logout failed');
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!adminUser) return false;
    return adminUser.permissions.includes(permission);
  };

  return (
    <AuthContext.Provider value={{
      user,
      adminUser,
      loading,
      login,
      logout,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
};

