jest.mock('firebase/firestore', () => ({
  updateDoc: jest.fn(),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  addDoc: jest.fn().mockResolvedValue({ id: 'newid' }),
  doc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  serverTimestamp: jest.fn(() => ({ seconds: 123 })),
}));

jest.mock('../src/firebase/config', () => ({ auth: {}, db: {} }));

const { auth } = require('../src/firebase/config');
const firestore = require('../src/firebase/firestore');
const { updateDoc, getDocs, getDoc } = require('firebase/firestore');

describe('firestore branch coverage', () => {
  afterEach(() => jest.clearAllMocks());

  test('obtenerServiciosConProveedor enriches when admin', async () => {
    // setup: auth has currentUser
    auth.currentUser = { uid: 'admin1' };
    // make obtenerUsuario return admin role by mocking getDoc
    getDoc.mockResolvedValueOnce({ exists: () => true, id: 'admin1', data: () => ({ rol: 'admin' }) });
    // mock getDocs sequence: first for servicios, then for usuarios
    getDocs.mockResolvedValueOnce({ docs: [ { id: 's1', data: () => ({ proveedorId: 'p1' }) } ] });
    getDocs.mockResolvedValueOnce({ docs: [ { id: 'p1', data: () => ({ nombre: 'ProveedorX', correo: 'p@x.com' }) } ] });

    const res = await firestore.obtenerServiciosConProveedor();
    expect(res[0].proveedor).toBeDefined();
    expect(res[0].proveedor.nombre).toBe('ProveedorX');
  });

  test('obtenerServiciosConProveedor handles obtenerUsuario error', async () => {
    auth.currentUser = { uid: 'admin2' };
    // make obtenerUsuario throw by mocking getDoc rejection
    getDoc.mockRejectedValueOnce(new Error('boom'));
    // mock servicios getDocs
    getDocs.mockResolvedValueOnce({ docs: [ { id: 's2', data: () => ({ proveedorId: 'p2' }) } ] });

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const res = await firestore.obtenerServiciosConProveedor();
    expect(res[0].proveedor).toBeDefined();
    expect(res[0].proveedor.nombre).toBe('Desconocido');
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  test('actualizarRolUsuario success and updateDoc error path', async () => {
    updateDoc.mockResolvedValueOnce(undefined);
    await expect(firestore.actualizarRolUsuario('u1', 'proveedor')).resolves.toBe(true);

    updateDoc.mockRejectedValueOnce(new Error('fail-update'));
    await expect(firestore.actualizarRolUsuario('u2', 'proveedor')).rejects.toThrow(/No se pudo actualizar el rol/);
  });

  test('responderSolicitudServicio validation branch', async () => {
    await expect(firestore.responderSolicitudServicio({ solicitudId: 's', proveedorId: 'p', estado: 'aceptada' })).resolves.toBeUndefined();
    await expect(firestore.responderSolicitudServicio({ solicitudId: null, proveedorId: 'p', estado: 'aceptada' })).rejects.toThrow('La solicitud es requerida');
    await expect(firestore.responderSolicitudServicio({ solicitudId: 's', proveedorId: null, estado: 'aceptada' })).rejects.toThrow('El proveedor es requerido');
    await expect(firestore.responderSolicitudServicio({ solicitudId: 's', proveedorId: 'p', estado: 'unknown' })).rejects.toThrow('Estado inválido');
  });

  test('obtenerSolicitudesPorCliente sorts using different timestamp shapes', async () => {
    getDocs.mockResolvedValueOnce({ docs: [
      { id: 'a', data: () => ({ createdAt: { seconds: 10 } }) },
      { id: 'b', data: () => ({ createdAt: { toMillis: () => 5000 } }) },
    ] });

    const res = await firestore.obtenerSolicitudesPorCliente('cliente1');
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBe(2);
  });
});
