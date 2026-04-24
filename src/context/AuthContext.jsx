import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import { obtenerUsuario } from '../firebase/firestore';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 8000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);

      if (!firebaseUser) {
        setUser(null);
        setPerfil(null);
        setLoading(false);
        clearTimeout(timeoutId);
        return;
      }

      setUser(firebaseUser);
      try {
        const perfilUsuario = await obtenerUsuario(firebaseUser.uid);
        setPerfil(perfilUsuario);
      } catch {
        setPerfil(null);
      } finally {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    }, () => {
      setUser(null);
      setPerfil(null);
      setLoading(false);
      clearTimeout(timeoutId);
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  const refreshPerfil = async () => {
    if (!user?.uid) return null;
    const perfilUsuario = await obtenerUsuario(user.uid);
    setPerfil(perfilUsuario);
    return perfilUsuario;
  };

  const value = useMemo(() => ({ user, perfil, loading, refreshPerfil }), [user, perfil, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
