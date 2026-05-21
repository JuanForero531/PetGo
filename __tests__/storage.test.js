jest.mock('../src/firebase/config', () => ({ storage: {} }));

jest.mock('firebase/storage', () => ({
  ref: jest.fn((s, path) => ({ path })),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}));

const { validarImagenPerfil, subirFotoProveedor } = require('../src/firebase/storage');
const { uploadBytes, getDownloadURL } = require('firebase/storage');

describe('storage utils', () => {
  describe('validarImagenPerfil', () => {
    test('throws when no file', () => {
      expect(() => validarImagenPerfil(null)).toThrow('Debes seleccionar una imagen.');
    });

    test('throws on invalid type', () => {
      const file = { type: 'application/pdf', size: 1024 };
      expect(() => validarImagenPerfil(file)).toThrow('Formato no permitido. Usa JPG, PNG o WEBP.');
    });

    test('throws on too large', () => {
      const file = { type: 'image/png', size: 3 * 1024 * 1024 };
      expect(() => validarImagenPerfil(file)).toThrow('La imagen no puede superar 2MB.');
    });

    test('accepts valid image', () => {
      const file = { type: 'image/jpeg', size: 1000 };
      expect(() => validarImagenPerfil(file)).not.toThrow();
    });
  });

  describe('subirFotoProveedor', () => {
    const file = { type: 'image/png', size: 1000, name: 'foto.png' };

    beforeEach(() => jest.clearAllMocks());

    test('uploads and returns url on success', async () => {
      uploadBytes.mockResolvedValueOnce({});
      getDownloadURL.mockResolvedValueOnce('https://storage/download.png');

      const url = await subirFotoProveedor('uid1', file);
      expect(url).toBe('https://storage/download.png');
      expect(uploadBytes).toHaveBeenCalled();
      expect(getDownloadURL).toHaveBeenCalled();
    });

    test('throws on missing uid', async () => {
      await expect(subirFotoProveedor('', file)).rejects.toThrow('ID de proveedor requerido.');
    });

    test('maps upload-timeout to friendly message', async () => {
      uploadBytes.mockRejectedValueOnce(new Error('upload-timeout'));
      await expect(subirFotoProveedor('uid1', file)).rejects.toThrow('La subida tardó demasiado.');
    });

    test('maps unauthorized code to friendly message', async () => {
      uploadBytes.mockRejectedValueOnce({ code: 'storage/unauthorized', message: 'nope' });
      await expect(subirFotoProveedor('uid1', file)).rejects.toThrow('No tienes permisos');
    });

    test('maps bucket-not-found to friendly message', async () => {
      uploadBytes.mockRejectedValueOnce({ code: 'storage/bucket-not-found' });
      await expect(subirFotoProveedor('uid1', file)).rejects.toThrow('No se encontró el bucket');
    });

    test('maps network/CORS errors to friendly message', async () => {
      uploadBytes.mockRejectedValueOnce({ message: 'Network request failed' });
      await expect(subirFotoProveedor('uid1', file)).rejects.toThrow('No fue posible subir la imagen');
    });
  });
});
