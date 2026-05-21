import {
  doc, setDoc, getDoc, collection, addDoc,
  updateDoc, getDocs, query, where, serverTimestamp, limit,
} from "firebase/firestore";
import { auth, db } from "./config";

const normalizarRol = (rol) => String(rol || "usuario").trim().toLowerCase();

const normalizarPerfil = (data = {}) => ({
  ...data,
  rol: normalizarRol(data.rol),
  esPremium: Boolean(data.esPremium),
  premiumDesde: data.premiumDesde || null,
  premiumHasta: data.premiumHasta || null,
  premiumActualizadoEn: data.premiumActualizadoEn || null,
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
    esPremium: false,
    premiumDesde: null,
    premiumHasta: null,
    premiumActualizadoEn: null,
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
  const totalProveedoresPremium = usuarios.filter((usuario) => usuario.rol === "proveedor" && usuario.esPremium).length;
  const totalAdmins = usuarios.filter((usuario) => usuario.rol === "admin").length;
  const totalUsuariosPremium = usuarios.filter((usuario) => usuario.esPremium).length;

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
    totalProveedoresPremium,
    totalAdmins,
    totalUsuariosPremium,
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
      rol: normalizarRol(nuevoRol),
      esPremium: false,
      premiumDesde: null,
      premiumHasta: null,
      premiumActualizadoEn: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error actualizando rol:", error);
    throw new Error(`No se pudo actualizar el rol: ${error.message}`);
  }
};

export const actualizarPremiumUsuario = async (uid, esPremium) => {
  try {
    if (!uid) throw new Error("ID de usuario requerido");

    const userDoc = doc(db, "usuarios", uid);
    await updateDoc(userDoc, {
      esPremium: Boolean(esPremium),
      premiumDesde: esPremium ? serverTimestamp() : null,
      premiumHasta: esPremium ? null : serverTimestamp(),
      premiumActualizadoEn: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error("Error actualizando premium:", error);
    throw new Error(`No se pudo actualizar el estado premium: ${error.message}`);
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
    usuario.nombreNegocio?.toLowerCase().includes(terminoNormalizado) ||
    usuario.nombre_negocio?.toLowerCase().includes(terminoNormalizado)
  );
};

export const crearServicio = async (proveedorId, datos) => {
  const proveedor = await obtenerUsuario(proveedorId);
  const ref = await addDoc(collection(db, "servicios"), {
    proveedorId,
    nombreNegocio: datos.nombreNegocio || "",
    tipo: datos.tipo || "",
    descripcion: datos.descripcion || "",
    precio: datos.precio || 0,
    direccion: datos.direccion || "",
    proveedorSnapshot: {
      nombre: proveedor?.nombre || "",
      apellido: proveedor?.apellido || "",
      correo: proveedor?.correo || "",
      telefono: proveedor?.telefono || "",
      nombreNegocio: proveedor?.nombreNegocio || datos.nombreNegocio || "",
      tipoServicio: proveedor?.tipoServicio || datos.tipo || "",
      esPremium: Boolean(proveedor?.esPremium),
    },
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

const normalizarFechaTimestamp = (value) => {
  if (!value) return 0;
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (typeof value?.seconds === 'number') return value.seconds * 1000;
  return 0;
};

export const crearSolicitudServicio = async ({ servicio, clienteId, mensaje = '', canalContacto = '', clienteSnapshot = null }) => {
  if (!servicio?.id) throw new Error('El servicio es requerido');
  if (!servicio?.proveedorId) throw new Error('El servicio no tiene proveedor asignado');
  if (!clienteId) throw new Error('El cliente es requerido');

  const ref = await addDoc(collection(db, 'solicitudes_servicio'), {
    servicioId: servicio.id,
    proveedorId: servicio.proveedorId,
    clienteId,
    estado: 'pendiente',
    mensaje: mensaje || '',
    canalContacto: canalContacto || '',
    servicioSnapshot: {
      nombreNegocio: servicio.nombreNegocio || '',
      tipo: servicio.tipo || '',
      descripcion: servicio.descripcion || '',
      precio: Number(servicio.precio || 0),
      direccion: servicio.direccion || '',
    },
    proveedorSnapshot: {
      nombre: servicio.proveedor?.nombre || '',
      apellido: servicio.proveedor?.apellido || '',
      correo: servicio.proveedor?.correo || '',
      telefono: servicio.proveedor?.telefono || '',
      nombreNegocio: servicio.proveedor?.nombreNegocio || servicio.nombreNegocio || '',
      esPremium: Boolean(servicio.proveedor?.esPremium),
    },
    clienteSnapshot: {
      nombre: clienteSnapshot?.nombre || '',
      apellido: clienteSnapshot?.apellido || '',
      correo: clienteSnapshot?.correo || '',
      telefono: clienteSnapshot?.telefono || '',
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return ref.id;
};

export const obtenerSolicitudesPorCliente = async (clienteId) => {
  const q = query(collection(db, 'solicitudes_servicio'), where('clienteId', '==', clienteId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => normalizarFechaTimestamp(b.createdAt) - normalizarFechaTimestamp(a.createdAt));
};

export const obtenerSolicitudesPorProveedor = async (proveedorId) => {
  const q = query(collection(db, 'solicitudes_servicio'), where('proveedorId', '==', proveedorId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => normalizarFechaTimestamp(b.createdAt) - normalizarFechaTimestamp(a.createdAt));
};

export const responderSolicitudServicio = async ({ solicitudId, proveedorId, estado }) => {
  if (!solicitudId) throw new Error('La solicitud es requerida');
  if (!proveedorId) throw new Error('El proveedor es requerido');
  if (!['aceptada', 'rechazada'].includes(estado)) throw new Error('Estado inválido');

  await updateDoc(doc(db, 'solicitudes_servicio', solicitudId), {
    estado,
    respondedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const marcarSolicitudComoCompletada = async ({ solicitudId, clienteId }) => {
  if (!solicitudId) throw new Error('La solicitud es requerida');
  if (!clienteId) throw new Error('El cliente es requerido');

  await updateDoc(doc(db, 'solicitudes_servicio', solicitudId), {
    estado: 'completada',
    completedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const crearResenaServicio = async ({ solicitudId, servicioId, proveedorId, clienteId, rating, review }) => {
  if (!solicitudId) throw new Error('La solicitud es requerida');
  if (!servicioId) throw new Error('El servicio es requerido');
  if (!proveedorId) throw new Error('El proveedor es requerido');
  if (!clienteId) throw new Error('El cliente es requerido');

  const puntaje = Number(rating);
  if (!Number.isFinite(puntaje) || puntaje < 1 || puntaje > 5) {
    throw new Error('La calificación debe estar entre 1 y 5');
  }

  const texto = String(review || '').trim();
  if (texto.length < 10) {
    throw new Error('La reseña debe tener al menos 10 caracteres');
  }

  const ref = await addDoc(collection(db, 'resenas_servicio'), {
    solicitudId,
    servicioId,
    proveedorId,
    clienteId,
    rating: puntaje,
    review: texto,
    createdAt: serverTimestamp(),
  });

  return ref.id;
};

export const obtenerResenasDelServicio = async (servicioId) => {
  if (!servicioId) return [];

  const q = query(collection(db, 'resenas_servicio'), where('servicioId', '==', servicioId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => normalizarFechaTimestamp(b.createdAt) - normalizarFechaTimestamp(a.createdAt));
};

export const obtenerResumenResenasDelServicio = async (servicioId) => {
  const resenas = await obtenerResenasDelServicio(servicioId);
  const total = resenas.length;
  const promedio = total ? resenas.reduce((suma, resena) => suma + Number(resena.rating || 0), 0) / total : 0;

  return {
    total,
    promedio,
    resenas,
  };
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

  let usuariosMap = null;

  try {
    const usuarioActual = auth.currentUser;
    if (usuarioActual) {
      const perfilActual = await obtenerUsuario(usuarioActual.uid);
      if (perfilActual?.rol === 'admin') {
        const usuarios = await obtenerTodosLosUsuarios();
        usuariosMap = usuarios.reduce((mapa, usuario) => {
          mapa[usuario.id] = usuario;
          return mapa;
        }, {});
      }
    }
  } catch (error) {
    console.warn('No fue posible enriquecer los servicios con perfiles de proveedor:', error);
  }

  return servicios.map(servicio => ({
    ...servicio,
    proveedor: usuariosMap?.[servicio.proveedorId] || servicio.proveedor || { nombre: 'Desconocido', correo: 'N/A' },
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