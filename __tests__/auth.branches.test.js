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
const { signInWithEmailAndPassword, signInWithPopup, createUserWithEmailAndPassword, sendPasswordResetEmail } = require('firebase/auth');
const { crearPerfilUsuario, obtenerUsuario } = require('../src/firebase/firestore');

describe('auth branches', () => {
  afterEach(() => jest.clearAllMocks());

  test('loginConCorreo translates auth errors', async () => {
    signInWithEmailAndPassword.mockRejectedValueOnce({ code: 'auth/wrong-password' });
    await expect(authModule.loginConCorreo('a@b.com', 'pw')).rejects.toThrow('Correo o contraseña incorrectos.');

    signInWithEmailAndPassword.mockRejectedValueOnce({ code: 'auth/invalid-email' });
    await expect(authModule.loginConCorreo('a@b.com', 'pw')).rejects.toThrow('El correo electrónico no es válido.');
  });

  test('loginConGoogle returns existing perfil', async () => {
    const user = { uid: 'u1', email: 'u@u.com', displayName: 'Juan Perez' };
    signInWithPopup.mockResolvedValueOnce({ user });
    obtenerUsuario.mockResolvedValueOnce({ id: 'u1', nombre: 'Juan' });

    const res = await authModule.loginConGoogle();
    expect(res.user).toBe(user);
    expect(res.perfil).toBeDefined();
  });

  test('loginConGoogle creates perfil when missing', async () => {
    const user = { uid: 'u2', email: 'u2@u.com', displayName: 'Ana Maria' };
    signInWithPopup.mockResolvedValueOnce({ user });
    // first call returns null, second returns created profile
    obtenerUsuario.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'u2', nombre: 'Ana' });

    await expect(authModule.loginConGoogle()).resolves.toHaveProperty('perfil');
    expect(crearPerfilUsuario).toHaveBeenCalled();
  });

  test('recuperarContrasena translates error', async () => {
    sendPasswordResetEmail.mockRejectedValueOnce({ code: 'auth/invalid-email' });
    await expect(authModule.recuperarContrasena('x')).rejects.toThrow('El correo electrónico no es válido.');
  });

  test('registrarUsuario calls crearPerfilUsuario and returns user', async () => {
    createUserWithEmailAndPassword.mockResolvedValueOnce({ user: { uid: 'created' } });
    const user = await authModule.registrarUsuario('a@b.com', 'pw', { nombre: 'X' });
    expect(user.uid).toBe('created');
    expect(crearPerfilUsuario).toHaveBeenCalledWith('created', expect.objectContaining({ correo: 'a@b.com' }));
  });
});
