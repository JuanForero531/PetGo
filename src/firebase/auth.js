import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import { auth } from "./config";
import { crearPerfilUsuario, obtenerUsuario } from "./firestore";

const googleProvider = new GoogleAuthProvider();

const normalizarCorreo = (correo) => String(correo || '').trim().toLowerCase();

const traducirErrorAuth = (error) => {
  const codigo = error?.code || '';

  switch (codigo) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Correo o contraseña incorrectos.';
    case 'auth/invalid-email':
      return 'El correo electrónico no es válido.';
    case 'auth/user-disabled':
      return 'Esta cuenta fue desactivada.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos fallidos. Intenta nuevamente más tarde.';
    case 'auth/popup-closed-by-user':
      return 'El inicio con Google fue cancelado.';
    case 'auth/popup-blocked':
      return 'El navegador bloqueó la ventana de Google.';
    case 'auth/cancelled-popup-request':
      return 'La solicitud de autenticación fue cancelada.';
    default:
      return error?.message || 'No se pudo completar la autenticación.';
  }
};

export const registrarUsuario = async (correo, password, datosExtra) => {
  const credencial = await createUserWithEmailAndPassword(auth, normalizarCorreo(correo), password);
  const uid = credencial.user.uid;
  await crearPerfilUsuario(uid, { correo, ...datosExtra });
  return credencial.user;
};

export const loginConCorreo = async (correo, password) => {
  try {
    const credencial = await signInWithEmailAndPassword(auth, normalizarCorreo(correo), password);
    const perfil = await obtenerUsuario(credencial.user.uid);
    return { user: credencial.user, perfil };
  } catch (error) {
    const mensaje = traducirErrorAuth(error);
    throw new Error(mensaje);
  }
};

export const loginConGoogle = async () => {
  try {
    const credencial = await signInWithPopup(auth, googleProvider);
    const uid = credencial.user.uid;
    let perfil = await obtenerUsuario(uid);
    if (!perfil) {
      await crearPerfilUsuario(uid, {
        correo: normalizarCorreo(credencial.user.email),
        nombre: credencial.user.displayName?.split(" ")[0] || "",
        apellido: credencial.user.displayName?.split(" ").slice(1).join(" ") || "",
        telefono: "", rol: "usuario", activo: true,
      });
      perfil = await obtenerUsuario(uid);
    }
    return { user: credencial.user, perfil };
  } catch (error) {
    const mensaje = traducirErrorAuth(error);
    throw new Error(mensaje);
  }
};

export const recuperarContrasena = async (correo) => {
  try {
    await sendPasswordResetEmail(auth, normalizarCorreo(correo));
  } catch (error) {
    const mensaje = traducirErrorAuth(error);
    throw new Error(mensaje);
  }
};

export const cerrarSesion = async () => {
  await signOut(auth);
};

export const obtenerUsuarioActual = () => {
  return auth.currentUser;
};