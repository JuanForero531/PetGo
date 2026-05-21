jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn().mockResolvedValue({ id: 'newid' }),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn().mockResolvedValue({ docs: [
    { id: 'r1', data: () => ({ servicioId: 's1', rating: 5, review: 'Excelente servicio', createdAt: { seconds: 20 } }) },
    { id: 'r2', data: () => ({ servicioId: 's1', rating: 3, review: 'Bien', createdAt: { seconds: 10 } }) },
  ] }),
  serverTimestamp: () => 123456,
  updateDoc: jest.fn(),
  doc: jest.fn(),
}));

jest.mock('../src/firebase/config', () => ({ db: {}, auth: {} }));

const firestore = require('../src/firebase/firestore');
const { addDoc, getDocs, updateDoc } = require('firebase/firestore');

describe('firestore extra flows', () => {
  test('crearSolicitudServicio returns id when valid', async () => {
    const servicio = { id: 's1', proveedorId: 'p1', nombreNegocio: 'Neg', tipo: 'T', descripcion: 'D', precio: 10, direccion: 'C', proveedor: { nombre: 'P' } };
    const id = await firestore.crearSolicitudServicio({ servicio, clienteId: 'c1', mensaje: 'Hola', canalContacto: 'email' });
    expect(id).toBe('newid');
    expect(addDoc).toHaveBeenCalled();
  });

  test('crearResenaServicio valid path returns id and obtenerResenas computes summary', async () => {
    const id = await firestore.crearResenaServicio({ solicitudId: 'req1', servicioId: 's1', proveedorId: 'p1', clienteId: 'c1', rating: 4, review: 'Muy buen trabajo, recomendado' });
    expect(id).toBe('newid');

    const resenas = await firestore.obtenerResenasDelServicio('s1');
    expect(resenas).toHaveLength(2);
    expect(resenas[0].id).toBe('r1');

    const resumen = await firestore.obtenerResumenResenasDelServicio('s1');
    expect(resumen.total).toBe(2);
    expect(resumen.promedio).toBeCloseTo((5 + 3) / 2);
  });

  test('activarServicio calls updateDoc and returns true', async () => {
    const res = await firestore.activarServicio('svc1');
    expect(res).toBe(true);
    expect(updateDoc).toHaveBeenCalled();
  });

  test('obtenerSolicitudesPorCliente sorts by createdAt with different timestamp shapes', async () => {
    // prepare getDocs to return two docs with different timestamp shapes
    getDocs.mockResolvedValueOnce({ docs: [
      { id: 's1', data: () => ({ clienteId: 'c1', createdAt: { toMillis: () => 2000 } }) },
      { id: 's2', data: () => ({ clienteId: 'c1', createdAt: { seconds: 1 } }) },
    ] });

    const lista = await firestore.obtenerSolicitudesPorCliente('c1');
    expect(lista.length).toBe(2);
    expect(lista[0].id).toBe('s1');
  });

  test('crearResenaServicio validation rejects invalid ratings and short reviews', async () => {
    await expect(firestore.crearResenaServicio({ solicitudId: 'a', servicioId: 's', proveedorId: 'p', clienteId: 'c', rating: 6, review: 'Comentario valido' }))
      .rejects.toThrow('La calificación debe estar entre 1 y 5');

    await expect(firestore.crearResenaServicio({ solicitudId: 'a', servicioId: 's', proveedorId: 'p', clienteId: 'c', rating: 4, review: 'peque' }))
      .rejects.toThrow('La reseña debe tener al menos 10 caracteres');
  });

  test('validations in solicitudes and responderSolicitudServicio throw on missing fields', async () => {
    await expect(firestore.crearSolicitudServicio({ servicio: null, clienteId: 'c' })).rejects.toThrow('El servicio es requerido');
    await expect(firestore.crearSolicitudServicio({ servicio: { id: 's1' }, clienteId: null })).rejects.toThrow('El servicio no tiene proveedor asignado');
    // missing cliente when proveedorId present
    await expect(firestore.crearSolicitudServicio({ servicio: { id: 's1', proveedorId: 'p1' }, clienteId: null })).rejects.toThrow('El cliente es requerido');

    await expect(firestore.responderSolicitudServicio({ solicitudId: null, proveedorId: 'p', estado: 'aceptada' }))
      .rejects.toThrow('La solicitud es requerida');
    await expect(firestore.responderSolicitudServicio({ solicitudId: 's', proveedorId: null, estado: 'aceptada' }))
      .rejects.toThrow('El proveedor es requerido');
    await expect(firestore.responderSolicitudServicio({ solicitudId: 's', proveedorId: 'p', estado: 'invalid' }))
      .rejects.toThrow('Estado inválido');
  });
});
