// Backfill script: populate `proveedorSnapshot` in `servicios` documents when missing.
// Usage:
// 1) Place your Firebase service account JSON next to this script as `service-account.json`.
// 2) Install deps: `npm install firebase-admin`.
// 3) Dry run: `node scripts/backfillProveedorSnapshot.js --dry-run`.
// 4) Run: `node scripts/backfillProveedorSnapshot.js`.

const admin = require('firebase-admin');
const path = require('path');

const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'service-account.json');
let serviceAccount;
try {
  serviceAccount = require(SERVICE_ACCOUNT_PATH);
} catch (err) {
  console.error('Missing service account JSON at', SERVICE_ACCOUNT_PATH);
  console.error('Download a service account JSON from Firebase Console > Project Settings > Service Accounts');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const DRY_RUN = process.argv.includes('--dry-run');

async function backfill() {
  console.log('Starting backfill. Dry run:', DRY_RUN);
  const serviciosRef = db.collection('servicios');

  // Query servicios where proveedorSnapshot is missing or null
  const snapshot = await serviciosRef.where('proveedorSnapshot', '==', null).get();
  // Note: If older docs omit the field entirely, the above won't match. We'll fetch all and filter client-side.
  const allSnapshot = await serviciosRef.get();

  const toProcess = [];
  allSnapshot.forEach(doc => {
    const data = doc.data();
    if (!data.proveedorSnapshot) {
      toProcess.push({ id: doc.id, data });
    }
  });

  console.log('Found', toProcess.length, 'servicios missing proveedorSnapshot');
  if (toProcess.length === 0) return;

  const BATCH_SIZE = 450; // safe margin under 500
  for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
    const batchItems = toProcess.slice(i, i + BATCH_SIZE);
    const batch = db.batch();

    for (const item of batchItems) {
      const svcRef = serviciosRef.doc(item.id);
      const proveedorId = item.data.proveedorId || item.data.proveedor || (item.data.proveedor && item.data.proveedor.uid) || null;
      if (!proveedorId) {
        console.warn('Skipping servicio', item.id, 'no proveedorId found');
        continue;
      }

      // Read provider user doc
      const userDoc = await db.collection('usuarios').doc(proveedorId).get();
      if (!userDoc.exists) {
        console.warn('Provider user not found for', proveedorId, 'skipping', item.id);
        continue;
      }

      const userData = userDoc.data();
      const snapshot = {
        uid: proveedorId,
        nombre: userData.nombre || userData.displayName || null,
        email: userData.email || null,
        telefono: userData.telefono || null,
        direccion: userData.direccion || null,
        photoURL: userData.photoURL || null,
        rol: userData.rol || null
      };

      if (DRY_RUN) {
        console.log('[DRY RUN] would set proveedorSnapshot for servicio', item.id, '=>', snapshot);
      } else {
        batch.update(svcRef, { proveedorSnapshot: snapshot });
      }
    }

    if (!DRY_RUN) {
      await batch.commit();
      console.log('Committed batch for items', i, 'to', i + batchItems.length - 1);
    }
  }

  console.log('Backfill finished. Dry run:', DRY_RUN);
}

backfill().catch(err => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
