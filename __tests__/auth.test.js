jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('../src/firebase/config', () => ({ auth: {} }));

jest.mock('../src/firebase/firestore', () => ({
  crearPerfilUsuario: jest.fn(),
  obtenerUsuario: jest.fn(),
}));

const authModule = require('../src/firebase/auth');
const firebaseAuth = require('firebase/auth');
const firestore = require('../src/firebase/firestore');

describe('auth helpers', () => {
  beforeEach(() => jest.clearAllMocks());

  test('registrarUsuario calls createUser and crearPerfilUsuario', async () => {
    firebaseAuth.createUserWithEmailAndPassword.mockResolvedValueOnce({ user: { uid: 'u1' } });
    firestore.crearPerfilUsuario.mockResolvedValueOnce(true);

    const user = await authModule.registrarUsuario('a@b.com', 'pass', { nombre: 'X' });
    expect(firebaseAuth.createUserWithEmailAndPassword).toHaveBeenCalled();
    expect(firestore.crearPerfilUsuario).toHaveBeenCalledWith('u1', expect.objectContaining({ correo: 'a@b.com' }));
    expect(user.uid).toBe('u1');
  });

  test('loginConCorreo throws translated message on auth error', async () => {
    const err = { code: 'auth/wrong-password' };
    firebaseAuth.signInWithEmailAndPassword.mockRejectedValueOnce(err);

    await expect(authModule.loginConCorreo('x@x.com', 'p')).rejects.toThrow('Correo o contraseña incorrectos.');
  });

  test('loginConGoogle creates profile when missing', async () => {
    firebaseAuth.signInWithPopup.mockResolvedValueOnce({ user: { uid: 'u2', email: 'g@p.com', displayName: 'G P' } });
    firestore.obtenerUsuario.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'u2', nombre: 'G' });

    const res = await authModule.loginConGoogle();
    expect(firebaseAuth.signInWithPopup).toHaveBeenCalled();
    expect(firestore.crearPerfilUsuario).toHaveBeenCalled();
    expect(res.perfil).toBeDefined();
  });

  test('recuperarContrasena calls sendPasswordResetEmail', async () => {
    firebaseAuth.sendPasswordResetEmail.mockResolvedValueOnce(true);
    await expect(authModule.recuperarContrasena('user@x.com')).resolves.toBeUndefined();
    expect(firebaseAuth.sendPasswordResetEmail).toHaveBeenCalled();
  });

  test('cerrarSesion calls signOut', async () => {
    firebaseAuth.signOut.mockResolvedValueOnce(true);
    await authModule.cerrarSesion();
    expect(firebaseAuth.signOut).toHaveBeenCalled();
  });
});
