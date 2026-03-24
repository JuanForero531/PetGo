import {
  doc, setDoc, getDoc, collection, addDoc,
  updateDoc, getDocs, query, where, serverTimestamp,
} from "firebase/firestore";
import { db } from "./config";

export const crearPerfilUsuario = async (uid, datos) => {
  await setDoc(doc(db, "usuarios", uid), {
    nombre: datos.nombre || "",
    apellido: datos.apellido || "",
    correo: datos.correo || "",
    telefono: datos.telefono || "",
    rol: datos.rol || "usuario",
    nombreNegocio: datos.nombreNegocio || "",
    tipoServicio: datos.tipoServicio || "",
    direccion: datos.direccion || "",
    activo: true,
    fechaRegistro: serverTimestamp(),
  });
};

export const obtenerUsuario = async (uid) => {
  const snap = await getDoc(doc(db, "usuarios", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const obtenerTodosLosUsuarios = async () => {
  const snap = await getDocs(collection(db, "usuarios"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const desactivarUsuario = async (uid) => {
  await updateDoc(doc(db, "usuarios", uid), { activo: false });
};

export const crearServicio = async (proveedorId, datos) => {
  const ref = await addDoc(collection(db, "servicios"), {
    proveedorId,
    nombreNegocio: datos.nombreNegocio || "",
    tipo: datos.tipo || "",
    descripcion: datos.descripcion || "",
    precio: datos.precio || 0,
    direccion: datos.direccion || "",
    activo: true,
    fechaCreacion: serverTimestamp(),
  });
  return ref.id;
};

export const obtenerServicios = async () => {
  const q = query(collection(db, "servicios"), where("activo", "==", true));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const obtenerServiciosDelProveedor = async (proveedorId) => {
  const q = query(
    collection(db, "servicios"),
    where("proveedorId", "==", proveedorId),
    where("activo", "==", true)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const obtenerServicio = async (servicioId) => {
  const snap = await getDoc(doc(db, "servicios", servicioId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const editarServicio = async (servicioId, datos) => {
  await updateDoc(doc(db, "servicios", servicioId), {
    nombreNegocio: datos.nombreNegocio,
    tipo: datos.tipo,
    descripcion: datos.descripcion,
    precio: datos.precio,
    direccion: datos.direccion,
  });
};

export const eliminarServicio = async (servicioId) => {
  await updateDoc(doc(db, "servicios", servicioId), { activo: false });
};