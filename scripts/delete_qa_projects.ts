import { Firestore } from '@google-cloud/firestore';

const TARGET_PROJECT_IDS = [
  'proj-99499543',
  'proj-48f7d39b',
  'proj-620bafbb',
  'proj-e50d899a',
  'proj-65411430',
  'proj-c53f275a',
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
