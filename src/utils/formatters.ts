/**
 * Central Formatting and Pluralization Utilities for ClearanceScout
 * Enforces humanized operator copy, consistent pluralization, and clean badge formatting.
 */

export function pluralize(count: number, singular: string, plural?: string): string {
  const p = plural || `${singular}s`;
  return count === 1 ? `1 ${singular}` : `${count} ${p}`;
}

export function formatStatus(status: string | undefined | null): string {
  if (!status) return 'Insufficient Evidence';
  switch (status.toUpperCase()) {
    case 'INSUFFICIENT_EVIDENCE':
      return 'Insufficient Evidence';
    case 'ACTION_REQUIRED':
      return 'Action Required';
    case 'REVIEW_RECOMMENDED':
      return 'Review Recommended';
    case 'NO_ISSUE_SURFACED':
      return 'Cleared';
    case 'SCRIPT_REVISION_SUPERSEDED':
      return 'Superseded Draft';
    case 'RESOLVED':
      return 'Resolved';
    case 'OPEN':
      return 'Open';
    case 'IN_PROGRESS':
      return 'In Progress';
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
