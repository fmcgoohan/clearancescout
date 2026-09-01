export async function generateSignedUploadUrl(fileName: string, mimeType: string, projectId: string = 'proj-default') {
  // Safe mock / fallback generator for signed GCS URL
  const bucketName = process.env.GCS_ATTACHMENTS_BUCKET || 'clearance-scout-attachments';
  const objectPath = `${projectId}/${fileName}`;
  const gcsUri = `gs://${bucketName}/${objectPath}`;
  const downloadUrl = `/api/attachments/download/${encodeURIComponent(fileName)}`;

  return {
    gcsUri,
    downloadUrl,
    uploadUrl: `/api/attachments/upload-simulated/${encodeURIComponent(fileName)}`,
    expiresInMinutes: 15,
  };
}
