jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn().mockResolvedValue({ exists: () => false, id: 'x', data: () => ({}) }),
  collection: jest.fn(),
  addDoc: jest.fn().mockResolvedValue({ id: 'new' }),
  updateDoc: jest.fn(),
  getDocs: jest.fn().mockResolvedValue({ docs: [] }),
  query: jest.fn(),
  where: jest.fn(),
  serverTimestamp: () => 123456,
  limit: jest.fn(),
}));

jest.mock('../src/firebase/config', () => ({ auth: {}, db: {} }));

const firestore = require('../src/firebase/firestore');

describe('firestore validations and simple flows', () => {
  test('actualizarFotoPerfilProveedor throws without uid', async () => {
    await expect(firestore.actualizarFotoPerfilProveedor()).rejects.toThrow('ID de usuario requerido');
  });

  test('actualizarPerfilProveedor throws without uid', async () => {
    await expect(firestore.actualizarPerfilProveedor()).rejects.toThrow('ID de usuario requerido');
  });

  test('desactivarUsuario throws without uid', async () => {
    await expect(firestore.desactivarUsuario()).rejects.toThrow('ID de usuario requerido');
  });

  test('activarUsuario throws without uid', async () => {
    await expect(firestore.activarUsuario()).rejects.toThrow('ID de usuario requerido');
  });

  test('actualizarRolUsuario validates inputs', async () => {
    await expect(firestore.actualizarRolUsuario()).rejects.toThrow('ID de usuario requerido');
    await expect(firestore.actualizarRolUsuario('uid')).rejects.toThrow('Rol requerido');
  });

  test('actualizarPremiumUsuario validates uid', async () => {
    await expect(firestore.actualizarPremiumUsuario()).rejects.toThrow('ID de usuario requerido');
  });

  test('crearSolicitudServicio validations', async () => {
    await expect(firestore.crearSolicitudServicio({})).rejects.toThrow('El servicio es requerido');
    await expect(firestore.crearSolicitudServicio({ servicio: { id: 's1' } })).rejects.toThrow('El servicio no tiene proveedor asignado');
    await expect(firestore.crearSolicitudServicio({ servicio: { id: 's1', proveedorId: 'p1' } })).rejects.toThrow('El cliente es requerido');
  });

  test('responderSolicitudServicio validations', async () => {
    await expect(firestore.responderSolicitudServicio({})).rejects.toThrow('La solicitud es requerida');
    await expect(firestore.responderSolicitudServicio({ solicitudId: 's' })).rejects.toThrow('El proveedor es requerido');
    await expect(firestore.responderSolicitudServicio({ solicitudId: 's', proveedorId: 'p' , estado: 'otro'})).rejects.toThrow('Estado inválido');
  });

  test('marcarSolicitudComoCompletada validations', async () => {
    await expect(firestore.marcarSolicitudComoCompletada({})).rejects.toThrow('La solicitud es requerida');
    await expect(firestore.marcarSolicitudComoCompletada({ solicitudId: 's' })).rejects.toThrow('El cliente es requerido');
  });

  test('crearResenaServicio validations', async () => {
    await expect(firestore.crearResenaServicio({})).rejects.toThrow('La solicitud es requerida');
    await expect(firestore.crearResenaServicio({ solicitudId: 's', servicioId: 'sv' })).rejects.toThrow('El proveedor es requerido');
    await expect(firestore.crearResenaServicio({ solicitudId: 's', servicioId: 'sv', proveedorId: 'p' })).rejects.toThrow('El cliente es requerido');
    await expect(firestore.crearResenaServicio({ solicitudId: 's', servicioId: 'sv', proveedorId: 'p', clienteId: 'c', rating: 10, review: 'This is long enough' })).rejects.toThrow('La calificación debe estar entre 1 y 5');
    await expect(firestore.crearResenaServicio({ solicitudId: 's', servicioId: 'sv', proveedorId: 'p', clienteId: 'c', rating: 5, review: 'short' })).rejects.toThrow('La reseña debe tener al menos 10 caracteres');
  });

  test('obtenerResenasDelServicio returns empty for falsy id', async () => {
    const res = await firestore.obtenerResenasDelServicio(null);
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBe(0);
  });

  test('obtenerResumenResenasDelServicio computes average', async () => {
    // configure mocked getDocs to return two review docs
    const { getDocs } = require('firebase/firestore');
    getDocs.mockResolvedValueOnce({ docs: [
      { id: 'r1', data: () => ({ rating: 5, createdAt: { seconds: 100 } }) },
      { id: 'r2', data: () => ({ rating: 3, createdAt: { seconds: 90 } }) },
    ] });

    const resumen = await firestore.obtenerResumenResenasDelServicio('sv');
    expect(resumen.total).toBe(2);
    expect(resumen.promedio).toBeCloseTo(4);
  });
});
