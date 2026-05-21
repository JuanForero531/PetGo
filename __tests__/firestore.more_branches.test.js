jest.mock('firebase/firestore', () => ({
  updateDoc: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn().mockResolvedValue({ id: 'newid' }),
  doc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  limit: jest.fn(),
  serverTimestamp: jest.fn(() => ({ seconds: 1 })),
}));

jest.mock('../src/firebase/config', () => ({ auth: {}, db: {} }));

const firestore = require('../src/firebase/firestore');
const { updateDoc, getDocs } = require('firebase/firestore');

describe('firestore additional branches', () => {
  afterEach(() => jest.clearAllMocks());

  test('update functions success and failure paths', async () => {
    updateDoc.mockResolvedValueOnce();
    await expect(firestore.actualizarFotoPerfilProveedor('uid', 'url')).resolves.toBe(true);

    updateDoc.mockRejectedValueOnce(new Error('boom'));
    await expect(firestore.actualizarFotoPerfilProveedor('uid', 'url')).rejects.toThrow(/No se pudo actualizar la foto/);

    updateDoc.mockResolvedValueOnce();
    await expect(firestore.actualizarPerfilProveedor('uid', { nombre: 'x' })).resolves.toBe(true);

    updateDoc.mockRejectedValueOnce(new Error('boom2'));
    await expect(firestore.actualizarPerfilProveedor('uid', { nombre: 'x' })).rejects.toThrow(/No se pudo actualizar el perfil/);

    updateDoc.mockResolvedValueOnce();
    await expect(firestore.desactivarUsuario('uid')).resolves.toBe(true);
    updateDoc.mockRejectedValueOnce(new Error('boom3'));
    await expect(firestore.desactivarUsuario('uid')).rejects.toThrow(/No se pudo desactivar/);

    updateDoc.mockResolvedValueOnce();
    await expect(firestore.activarUsuario('uid')).resolves.toBe(true);
    updateDoc.mockRejectedValueOnce(new Error('boom4'));
    await expect(firestore.activarUsuario('uid')).rejects.toThrow(/No se pudo activar/);
  });

  test('actualizarRolUsuario and premium error branches', async () => {
    updateDoc.mockResolvedValueOnce();
    await expect(firestore.actualizarRolUsuario('u', 'proveedor')).resolves.toBe(true);

    await expect(firestore.actualizarRolUsuario(null, 'x')).rejects.toThrow('ID de usuario requerido');
    await expect(firestore.actualizarRolUsuario('u', null)).rejects.toThrow('Rol requerido');

    updateDoc.mockResolvedValueOnce();
    await expect(firestore.actualizarPremiumUsuario('u', true)).resolves.toBe(true);
    updateDoc.mockRejectedValueOnce(new Error('fail'));
    await expect(firestore.actualizarPremiumUsuario('u', false)).rejects.toThrow(/No se pudo actualizar el estado premium/);
  });

  test('obtenerUsuariosPaginados uses both branches', async () => {
    getDocs.mockResolvedValueOnce({ docs: [{ id: 'a', data: () => ({}) }] });
    const res1 = await firestore.obtenerUsuariosPaginados(10, null);
    expect(Array.isArray(res1)).toBe(true);

    // when ultimoDoc provided
    getDocs.mockResolvedValueOnce({ docs: [{ id: 'b', data: () => ({}) }] });
    const res2 = await firestore.obtenerUsuariosPaginados(5, { id: 'last' });
    expect(Array.isArray(res2)).toBe(true);
  });

  test('crearSolicitudServicio validation errors', async () => {
    await expect(firestore.crearSolicitudServicio({ servicio: null, clienteId: 'c' })).rejects.toThrow('El servicio es requerido');
    await expect(firestore.crearSolicitudServicio({ servicio: { id: 's1' }, clienteId: 'c' })).rejects.toThrow('El servicio no tiene proveedor asignado');
    await expect(firestore.crearSolicitudServicio({ servicio: { id: 's1', proveedorId: 'p1' } })).rejects.toThrow('El cliente es requerido');
  });

  test('crearResenaServicio validation branches', async () => {
    await expect(firestore.crearResenaServicio({ solicitudId: 's', servicioId: 'sv', proveedorId: 'p', clienteId: 'c', rating: 10, review: 'long enough' })).rejects.toThrow(/La calificación/);
    await expect(firestore.crearResenaServicio({ solicitudId: 's', servicioId: 'sv', proveedorId: 'p', clienteId: 'c', rating: 5, review: 'short' })).rejects.toThrow(/La reseña/);
  });
});
