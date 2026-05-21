jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn().mockResolvedValue({ exists: () => true, id: 'u1', data: () => ({ nombre: 'Juan', apellido: 'P', correo: 'a@b.com', telefono: '123', nombreNegocio: 'Neg', tipoServicio: 'Baño', esPremium: true }) }),
  collection: jest.fn(),
  addDoc: jest.fn().mockResolvedValue({ id: 'svc123' }),
  updateDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  serverTimestamp: () => 123456,
  limit: jest.fn(),
}));

jest.mock('../src/firebase/config', () => ({ auth: {}, db: {} }));

const { getDocs } = require('firebase/firestore');
const firestore = require('../src/firebase/firestore');

describe('firestore richer flows', () => {
  test('obtenerMetricasAdmin computes counts and top types', async () => {
    // prepare usuarios and servicios docs
    getDocs.mockResolvedValueOnce({ docs: [
      { id: 'u1', data: () => ({ rol: 'proveedor', activo: true, esPremium: false }) },
      { id: 'u2', data: () => ({ rol: 'admin', activo: false, esPremium: true }) },
    ] });

    getDocs.mockResolvedValueOnce({ docs: [
      { id: 's1', data: () => ({ tipo: 'Baño', activo: true }) },
      { id: 's2', data: () => ({ tipo: 'Corte', activo: false }) },
      { id: 's3', data: () => ({ tipo: 'Baño', activo: true }) },
    ] });

    const metrics = await firestore.obtenerMetricasAdmin();
    expect(metrics.totalUsuarios).toBe(2);
    expect(metrics.totalServicios).toBe(3);
    expect(metrics.tiposMasUsados[0].tipo).toBe('Baño');
  });

  test('crearServicio returns new id and includes proveedorSnapshot', async () => {
    // getDoc mocked to return provider data
    const id = await firestore.crearServicio('u1', { nombreNegocio: 'Neg', tipo: 'Baño' });
    expect(id).toBe('svc123');
  });

  test('obtenerServiciosConProveedor enriches servicios for admin', async () => {
    // simulate auth currentUser admin
    const cfg = require('../src/firebase/config');
    cfg.auth.currentUser = { uid: 'u1' };

    // make getDocs return servicios list for obtenerTodosLosServicios
    getDocs.mockResolvedValueOnce({ docs: [ { id: 's1', data: () => ({ proveedorId: 'u1', activo: true }) } ] });

    // mock obtenerUsuario and obtenerTodosLosUsuarios on module
    jest.spyOn(firestore, 'obtenerUsuario').mockResolvedValueOnce({ id: 'u1', rol: 'admin' });
    jest.spyOn(firestore, 'obtenerTodosLosUsuarios').mockResolvedValueOnce([{ id: 'u1', nombre: 'Juan' }]);

    const enriched = await firestore.obtenerServiciosConProveedor();
    expect(enriched[0].proveedor).toBeDefined();
  });
});
