import { Firestore } from '@google-cloud/firestore';

const TARGET_PROJECT_IDS = [
  'proj-fd981eb9',
  'proj-e4394392',
  'proj-b8299787',
  'proj-e69f8254',
  'proj-e2bdc62b',
  'proj-c46735b8',
  'proj-f9be5f6e',
];

const PRESERVE_PROJECT_IDS = ['proj-default', 'proj-cyberpunk'];

async function main() {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'clearance-scout-2026';
  console.log(`[Delete QA Projects] Connecting to Firestore on project: ${projectId}`);

  const db = new Firestore({ projectId });

  for (const pid of TARGET_PROJECT_IDS) {
    if (PRESERVE_PROJECT_IDS.includes(pid)) {
      console.warn(`[SKIP] Attempted to delete protected project: ${pid}`);
      continue;
    }

    const docRef = db.doc(`projects/${pid}`);
    const snap = await docRef.get();
    if (!snap.exists) {
      console.log(`[NOT FOUND] Project ${pid} does not exist in Firestore.`);
      continue;
    }

    console.log(`[DELETING] Recursively deleting project ${pid} and all subcollections...`);
    await db.recursiveDelete(docRef);
    console.log(`[DELETED] Project ${pid} successfully removed.`);
  }

  console.log('[COMPLETED] All target QA projects removed from production Firestore.');
}

main().catch((err) => {
  console.error('[FAILED] Error deleting QA projects:', err);
  process.exit(1);
});
