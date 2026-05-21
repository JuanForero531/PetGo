jest.mock('../src/firebase/config', () => ({
  auth: {},
  db: {}
}));

describe('firestore helpers presence', () => {
  test('helpers expose expected functions', () => {
    // require after mocking config so module initialization doesn't hit import.meta
    // eslint-disable-next-line global-require
    const firestoreHelpers = require('../src/firebase/firestore');
    expect(typeof firestoreHelpers.crearSolicitudServicio).toBe('function');
    expect(typeof firestoreHelpers.obtenerSolicitudesPorCliente).toBe('function');
    expect(typeof firestoreHelpers.responderSolicitudServicio).toBe('function');
  });
});
