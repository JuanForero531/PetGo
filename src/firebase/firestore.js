import {
  doc, setDoc, getDoc, collection, addDoc,
  updateDoc, getDocs, query, where, serverTimestamp, limit,
} from "firebase/firestore";
import { db } from "./config";

const normalizarRol = (rol) => String(rol || "usuario").trim().toLowerCase();

const normalizarPerfil = (data = {}) => ({
  ...data,
  rol: normalizarRol(data.rol),
});

export const crearPerfilUsuario = async (uid, datos) => {
  await setDoc(doc(db, "usuarios", uid), {
    nombre: datos.nombre || "",
    apellido: datos.apellido || "",
    correo: datos.correo || "",
    telefono: datos.telefono || "",
    rol: normalizarRol(datos.rol),
    nombreNegocio: datos.nombreNegocio || "",
    tipoServicio: datos.tipoServicio || "",
    direccion: datos.direccion || "",
    fotoPerfil: datos.fotoPerfil || "",
    activo: true,
    fechaRegistro: serverTimestamp(),
  });
};

export const actualizarFotoPerfilProveedor = async (uid, fotoPerfil) => {
  try {
    if (!uid) throw new Error("ID de usuario requerido");
    const userDoc = doc(db, "usuarios", uid);
    await updateDoc(userDoc, { fotoPerfil: fotoPerfil || "" });
    return true;
  } catch (error) {
    console.error("Error actualizando foto de perfil:", error);
    throw new Error(`No se pudo actualizar la foto: ${error.message}`);
  }
};

export const actualizarPerfilProveedor = async (uid, datos = {}) => {
  try {
    if (!uid) throw new Error("ID de usuario requerido");

    await updateDoc(doc(db, "usuarios", uid), {
      nombre: datos.nombre || "",
      apellido: datos.apellido || "",
      correo: datos.correo || "",
      telefono: datos.telefono || "",
      nombreNegocio: datos.nombreNegocio || "",
      tipoServicio: datos.tipoServicio || "",
      direccion: datos.direccion || "",
    });

    return true;
  } catch (error) {
    console.error("Error actualizando perfil de proveedor:", error);
    throw new Error(`No se pudo actualizar el perfil: ${error.message}`);
  }
};

export const obtenerUsuario = async (uid) => {
  const snap = await getDoc(doc(db, "usuarios", uid));
  return snap.exists() ? normalizarPerfil({ id: snap.id, ...snap.data() }) : null;
};

export const obtenerTodosLosUsuarios = async () => {
  const snap = await getDocs(collection(db, "usuarios"));
  return snap.docs.map((d) => normalizarPerfil({ id: d.id, ...d.data() }));
};

export const obtenerMetricasAdmin = async () => {
  const [usuariosSnap, serviciosSnap] = await Promise.all([
    getDocs(collection(db, "usuarios")),
    getDocs(collection(db, "servicios")),
  ]);

  const usuarios = usuariosSnap.docs.map((docSnap) => normalizarPerfil({ id: docSnap.id, ...docSnap.data() }));
  const servicios = serviciosSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));

  const totalUsuarios = usuarios.length;
  const usuariosActivos = usuarios.filter((usuario) => usuario.activo !== false).length;
  const usuariosInactivos = totalUsuarios - usuariosActivos;
  const totalProveedores = usuarios.filter((usuario) => usuario.rol === "proveedor").length;
  const totalAdmins = usuarios.filter((usuario) => usuario.rol === "admin").length;

  const totalServicios = servicios.length;
  const serviciosActivos = servicios.filter((servicio) => servicio.activo !== false).length;
  const serviciosInactivos = totalServicios - serviciosActivos;

  const serviciosPorTipo = servicios.reduce((acumulado, servicio) => {
    const tipo = servicio.tipo || "Sin tipo";
    acumulado[tipo] = (acumulado[tipo] || 0) + 1;
    return acumulado;
  }, {});

  const tiposMasUsados = Object.entries(serviciosPorTipo)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([tipo, cantidad]) => ({ tipo, cantidad }));

  return {
    totalUsuarios,
    usuariosActivos,
    usuariosInactivos,
    totalProveedores,
    totalAdmins,
    totalServicios,
    serviciosActivos,
    serviciosInactivos,
    tiposMasUsados,
  };
};

export const desactivarUsuario = async (uid) => {
  try {
    if (!uid) throw new Error("ID de usuario requerido");
    const userDoc = doc(db, "usuarios", uid);
    await updateDoc(userDoc, { activo: false });
    return true;
  } catch (error) {
    console.error("Error desactivando usuario:", error);
    throw new Error(`No se pudo desactivar el usuario: ${error.message}`);
  }
};

export const activarUsuario = async (uid) => {
  try {
    if (!uid) throw new Error("ID de usuario requerido");
    const userDoc = doc(db, "usuarios", uid);
    await updateDoc(userDoc, { activo: true });
    return true;
  } catch (error) {
    console.error("Error activando usuario:", error);
    throw new Error(`No se pudo activar el usuario: ${error.message}`);
  }
};

export const actualizarRolUsuario = async (uid, nuevoRol) => {
  try {
    if (!uid) throw new Error("ID de usuario requerido");
    if (!nuevoRol) throw new Error("Rol requerido");
    const userDoc = doc(db, "usuarios", uid);
    await updateDoc(userDoc, { 
      rol: normalizarRol(nuevoRol)
    });
    return true;
  } catch (error) {
    console.error("Error actualizando rol:", error);
    throw new Error(`No se pudo actualizar el rol: ${error.message}`);
  }
};

export const obtenerUsuariosPaginados = async (limite = 20, ultimoDoc = null) => {
  let q;
  if (ultimoDoc) {
    q = query(
      collection(db, "usuarios"),
      query(collection(db, "usuarios")),
      limit(limite + 1)
    );
  } else {
    q = query(collection(db, "usuarios"), limit(limite + 1));
  }
  const snap = await getDocs(q);
  const usuarios = snap.docs.map((d) => normalizarPerfil({ id: d.id, ...d.data() }));
  return usuarios;
};

export const buscarUsuarios = async (termino) => {
  const usuarios = await obtenerTodosLosUsuarios();
  const terminoNormalizado = termino.toLowerCase().trim();
  return usuarios.filter((usuario) => 
    usuario.nombre?.toLowerCase().includes(terminoNormalizado) ||
    usuario.apellido?.toLowerCase().includes(terminoNormalizado) ||
    usuario.correo?.toLowerCase().includes(terminoNormalizado) ||
    usuario.nombre_negocio?.toLowerCase().includes(terminoNormalizado)
  );
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

export const obtenerTodosLosServicios = async () => {
  const snap = await getDocs(collection(db, "servicios"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const obtenerServiciosConProveedor = async () => {
  const servicios = await obtenerTodosLosServicios();
  const usuarios = await obtenerTodosLosUsuarios();
  
  const usuariosMap = usuarios.reduce((mapa, usuario) => {
    mapa[usuario.id] = usuario;
    return mapa;
  }, {});

  return servicios.map(servicio => ({
    ...servicio,
    proveedor: usuariosMap[servicio.proveedorId] || { nombre: 'Desconocido', correo: 'N/A' },
  }));
};

export const activarServicio = async (servicioId) => {
  try {
    if (!servicioId) throw new Error("ID de servicio requerido");
    const serviceDoc = doc(db, "servicios", servicioId);
    await updateDoc(serviceDoc, { activo: true });
    return true;
  } catch (error) {
    console.error("Error activando servicio:", error);
    throw new Error(`No se pudo activar el servicio: ${error.message}`);
  }
};