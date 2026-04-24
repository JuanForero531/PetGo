import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./config";

const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 2 * 1024 * 1024;

export const validarImagenPerfil = (file) => {
  if (!file) throw new Error("Debes seleccionar una imagen.");

  if (!TIPOS_PERMITIDOS.includes(file.type)) {
    throw new Error("Formato no permitido. Usa JPG, PNG o WEBP.");
  }

  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("La imagen no puede superar 2MB.");
  }
};

export const subirFotoProveedor = async (uid, file) => {
  if (!uid) throw new Error("ID de proveedor requerido.");
  validarImagenPerfil(file);

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const ruta = `proveedores/${uid}/perfil.${ext}`;
  const storageRef = ref(storage, ruta);

  const withTimeout = (promise, ms = 20000) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("upload-timeout")), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });

  try {
    await withTimeout(uploadBytes(storageRef, file, { contentType: file.type }));
    return withTimeout(getDownloadURL(storageRef));
  } catch (error) {
    const code = String(error?.code || "");
    const mensaje = String(error?.message || "").toLowerCase();

    if (String(error?.message || "") === "upload-timeout") {
      throw new Error("La subida tardó demasiado. Verifica tu conexión y la configuración de Firebase Storage.");
    }

    if (code === "storage/unauthorized") {
      throw new Error("No tienes permisos para subir archivos. Revisa las reglas de Firebase Storage.");
    }

    if (code === "storage/bucket-not-found") {
      throw new Error("No se encontró el bucket de Storage. Verifica VITE_FIREBASE_STORAGE_BUCKET.");
    }

    if (mensaje.includes("cors") || mensaje.includes("network request failed") || code === "storage/unknown") {
      throw new Error("No fue posible subir la imagen. Verifica bucket, reglas y que Firebase Storage esté habilitado en tu proyecto.");
    }

    throw error;
  }
};
