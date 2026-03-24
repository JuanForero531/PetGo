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

export const registrarUsuario = async (correo, password, datosExtra) => {
  const credencial = await createUserWithEmailAndPassword(auth, correo, password);
  const uid = credencial.user.uid;
  await crearPerfilUsuario(uid, { correo, ...datosExtra });
  return credencial.user;
};

export const loginConCorreo = async (correo, password) => {
  const credencial = await signInWithEmailAndPassword(auth, correo, password);
  const perfil = await obtenerUsuario(credencial.user.uid);
  return { user: credencial.user, perfil };
};

export const loginConGoogle = async () => {
  const credencial = await signInWithPopup(auth, googleProvider);
  const uid = credencial.user.uid;
  let perfil = await obtenerUsuario(uid);
  if (!perfil) {
    await crearPerfilUsuario(uid, {
      correo: credencial.user.email,
      nombre: credencial.user.displayName?.split(" ")[0] || "",
      apellido: credencial.user.displayName?.split(" ").slice(1).join(" ") || "",
      telefono: "", rol: "usuario", activo: true,
    });
    perfil = await obtenerUsuario(uid);
  }
  return { user: credencial.user, perfil };
};

export const recuperarContrasena = async (correo) => {
  await sendPasswordResetEmail(auth, correo);
};

export const cerrarSesion = async () => {
  await signOut(auth);
};

export const obtenerUsuarioActual = () => {
  return auth.currentUser;
};