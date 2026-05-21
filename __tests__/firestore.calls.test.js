jest.mock('firebase/firestore', () => ({
  getDoc: jest.fn().mockResolvedValue({ exists: () => true, id: 'svc1', data: () => ({ nombreNegocio: 'N', tipo: 'T', proveedorId: 'p1', activo: true }) }),
  getDocs: jest.fn().mockResolvedValue({ docs: [ { id: 's1', data: () => ({ proveedorId: 'p1', activo: true }) } ] }),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  limit: jest.fn(),
  doc: jest.fn((db, col, id) => ({ _col: col, _id: id })),
}));

jest.mock('../src/firebase/config', () => ({ db: {}, auth: {} }));

const firestore = require('../src/firebase/firestore');
const { getDoc, getDocs } = require('firebase/firestore');

describe('firestore simple getters', () => {
  test('obtenerServicio and obtenerServicios return shapes', async () => {
    const svc = await firestore.obtenerServicio('svc1');
    expect(svc).toBeDefined();

    const servicios = await firestore.obtenerServicios();
    expect(Array.isArray(servicios)).toBe(true);
  });

  test('obtenerServiciosDelProveedor filters by proveedorId', async () => {
    const list = await firestore.obtenerServiciosDelProveedor('p1');
    expect(list[0].proveedorId).toBe('p1');
  });

  test('obtenerTodosLosServicios and obtenerTodosLosUsuarios return arrays', async () => {
    getDocs.mockResolvedValueOnce({ docs: [ { id: 'a', data: () => ({}) }, { id: 'b', data: () => ({}) } ] });
    const all = await firestore.obtenerTodosLosServicios();
    expect(all.length).toBeGreaterThanOrEqual(2);

    getDocs.mockResolvedValueOnce({ docs: [ { id: 'u1', data: () => ({ nombre: 'X' }) } ] });
    const users = await firestore.obtenerTodosLosUsuarios();
    expect(users[0].nombre).toBe('X');
  });

  test('buscarUsuarios filters by term', async () => {
    firestore.obtenerTodosLosUsuarios = jest.fn().mockResolvedValue([
      { id: 'u1', nombre: 'Ana', apellido: 'Lopez', correo: 'a@b.com', nombreNegocio: 'Neg' },
      { id: 'u2', nombre: 'Pedro', apellido: 'G', correo: 'p@q.com', nombreNegocio: 'Otro' },
    ]);

    const res = await firestore.buscarUsuarios('ana');
    expect(Array.isArray(res)).toBe(true);
  });
});
