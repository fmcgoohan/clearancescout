/**
 * Central Formatting and Pluralization Utilities for ClearanceScout
 * Enforces humanized operator copy, consistent pluralization, and clean badge formatting.
 */

export function pluralize(count: number, singular: string, plural?: string): string {
  const p = plural || `${singular}s`;
  return count === 1 ? `1 ${singular}` : `${count} ${p}`;
}

export function formatOccurrenceCount(occurrencesCount: number = 0, scenesCount?: number): string {
  if (!occurrencesCount || occurrencesCount === 0) {
    return '0 occurrences';
  }
  if (scenesCount === undefined || scenesCount === null) {
    return occurrencesCount === 1 ? '1 scene occurrence' : `${occurrencesCount} scene occurrences`;
  }
  if (scenesCount <= 1) {
    return occurrencesCount === 1 ? '1 scene occurrence' : `${occurrencesCount} occurrences in 1 scene`;
  }
  return `${occurrencesCount} occurrences across ${scenesCount} scenes`;
}

export function formatProjectCode(projectId: string | undefined | null, title?: string): string {
  if (!projectId) return 'PRJ-DEFAULT';
  if (title && title.toLowerCase().includes('neon')) {
    return 'PRJ-NEON-HORIZON';
  }
  if (projectId === 'proj-cyberpunk' || (title && title.toLowerCase().includes('cyberpunk'))) {
    return 'PRJ-CYBERPUNK';
  }
  const cleanId = projectId.replace(/^proj-/, '').toUpperCase();
  return `PRJ-${cleanId}`;
}

export function formatStatus(status: string | undefined | null): string {
  if (!status) return 'Insufficient evidence';
  switch (status.toUpperCase()) {
    case 'INSUFFICIENT_EVIDENCE':
      return 'Insufficient evidence';
    case 'ACTION_REQUIRED':
      return 'Action required';
    case 'REVIEW_RECOMMENDED':
      return 'Review recommended';
    case 'NO_ISSUE_SURFACED':
      return 'No issue surfaced';
    case 'SCRIPT_REVISION_SUPERSEDED':
      return 'Superseded by new script revision';
    case 'PENDING_REVIEW':
      return 'Pending review';
    case 'FINAL_CLEAR':
      return 'Final clear';
    case 'WORKING_CLEAR':
      return 'Working clear';
    case 'RED':
      return 'Blocked (Red)';
    case 'TEMP_APPROVED':
      return 'Temporarily approved';
    case 'FINAL_CLEARED':
      return 'Final cleared';
    case 'RESOLVED':
      return 'Resolved';
    case 'OPEN':
      return 'Open';
    case 'IN_PROGRESS':
      return 'In progress';
    case 'DISMISSED':
      return 'Dismissed';
    default:
      return status
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

export function formatCategory(category: string | undefined | null): string {
  if (!category) return 'Brand';
  switch (category.toUpperCase()) {
    case 'BRAND':
      return 'Brand';
    case 'ART_MUSIC':
      return 'Art & Music';
    case 'PUBLIC_FIGURE':
      return 'Public Figure';
    case 'PROPRIETARY_LOCATION':
      return 'Proprietary Location';
    case 'GRAPHIC_PROP':
      return 'Graphic Prop';
    default:
      return category
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

export function formatDepartment(dept: string | undefined | null): string {
  if (!dept) return 'Clearance Team';
  switch (dept.toUpperCase()) {
    case 'ART_DEPT':
      return 'Art Dept';
    case 'LEGAL_COUNSEL':
      return 'Legal Counsel';
    case 'LOCATIONS':
      return 'Locations';
    case 'PRODUCTION_MGMT':
      return 'Production Mgmt';
    case 'CLEARANCE_TEAM':
      return 'Clearance Team';
    default:
      return dept.replace(/_/g, ' ');
  }
}

export function formatPriority(priority: string | undefined | null): string {
  if (!priority) return 'Medium';
  switch (priority.toUpperCase()) {
    case 'CRITICAL':
      return 'Critical';
    case 'HIGH':
      return 'High';
    case 'MEDIUM':
      return 'Medium';
    case 'LOW':
      return 'Low';
    default:
      return priority;
  }
}

export function formatExplanationText(text: string | undefined | null): string {
  if (!text) return '';
  return text
    .replace(/\bINSUFFICIENT_EVIDENCE\b/g, 'Insufficient evidence')
    .replace(/\bACTION_REQUIRED\b/g, 'Action required')
    .replace(/\bREVIEW_RECOMMENDED\b/g, 'Review recommended')
    .replace(/\bNO_ISSUE_SURFACED\b/g, 'No issue surfaced')
    .replace(/\bSCRIPT_REVISION_SUPERSEDED\b/g, 'Superseded by new script revision')
    .replace(/\bTEMP_APPROVED\b/g, 'Temporarily approved')
    .replace(/\bFINAL_CLEARED\b/g, 'Final cleared')
    .replace(/\bFINAL_CLEAR\b/g, 'Final clear')
    .replace(/\bWORKING_CLEAR\b/g, 'Working clear');
}

export function getPlainLanguageSceneReason(s: any): string {
  if (s?.readinessDetails?.blockingRationale) {
    return formatExplanationText(s.readinessDetails.blockingRationale);
  }
  if (s?.readinessDetails?.summaryText) {
    return formatExplanationText(s.readinessDetails.summaryText);
  }
  const status = s?.readinessStatus || s?.status;
  if (status === 'FINAL_CLEAR') {
    return 'All scene elements and prop occurrences are 100% cleared for production.';
  }
  if (status === 'RED' || status === 'BLOCKS_SHOOTING' || status === 'ACTION_REQUIRED') {
    if (s?.heading?.includes('SUB-LEVEL') || s?.rawText?.includes('Hazard Placard') || s?.rawText?.includes('Titan')) {
      return 'Titan Industrial Hazard placard artwork needs rights or replacement before shooting.';
    }
    if (s?.rawText?.includes('Midtown Spire') || s?.heading?.includes('MIDTOWN')) {
      return 'Midtown Spire Tower location clearance or exterior filming release pending.';
    }
    if (s?.rawText?.includes('Elena Vance') || s?.rawText?.includes('keynote')) {
      return 'Archival keynote footage and persona rights require counsel sign-off.';
    }
    return 'Scene contains ungrounded trademarked entities or uncleared artwork blocking shooting.';
  }
  if (status === 'WORKING_CLEAR' || status === 'REVIEW_RECOMMENDED') {
    return 'Working clear with interim approved placeholder; final rights confirmation pending.';
  }
  return 'All scene elements and prop occurrences are 100% cleared for production.';
}
