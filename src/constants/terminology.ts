/**
 * Centralized Operator Terminology Dictionary & Semantic Mappings for ClearanceScout
 * 
 * Invariants:
 * 1. Same concept = same label across Header, Registry, Action Center, Dashboard, Timeline, and Binder.
 * 2. Distinct model objects retain distinct, grounded labels:
 *    - Canonical Entity Clearance State: 'Cleared', 'Review Recommended', 'Action Required', 'Insufficient evidence'
 *    - Operational Tasks: 'Department Tasks' (or 'Entity Tasks')
 *    - Scene Breakdown: 'Blocking Occurrences' (occurrence-level blockers in specific scenes)
 * 3. The 7 / 7 / 8 relationship:
 *    "An entity may appear in more than one scene, so blocking occurrences can exceed the number of entities requiring clearance."
 */

export const TERMINOLOGY = {
  // 1. Entity Clearance Statuses (Canonical Level)
  STATUS_CLEARED: 'Cleared',
  STATUS_REVIEW_RECOMMENDED: 'Review Recommended',
  STATUS_ACTION_REQUIRED: 'Action Required',
  STATUS_INSUFFICIENT_EVIDENCE: 'Insufficient evidence',

  // 2. Operational Tasks (Work Queue Level)
  TASKS_LABEL: 'Department Tasks',
  TASKS_TOOLTIP: 'Action items assigned to production departments. Initial ungrounded items enter the Legal Counsel research queue; classified items route to Art Dept or Locations.',

  // 3. Scene Breakdown (Scene Occurrence Level)
  BLOCKING_OCCURRENCES_LABEL: 'Blocking Occurrences',
  BLOCKING_OCCURRENCES_SUBTITLE: 'Unresolved Scene Occurrences',
  BLOCKING_OCCURRENCES_TOOLTIP: 'Total entity appearances in specific scenes that currently block shooting readiness.',

  // 4. Multi-Occurrence Relationship Copy
  COUNT_RELATIONSHIP_EXPLANATION:
    'An entity may appear multiple times within one or more scenes, so blocking occurrences can exceed entity tasks.',

  // 5. Why A Scene Blocks Shooting Copy
  WHY_SCENE_BLOCKS_SHOOTING:
    'Why this blocks shooting: Clearance evidence is incomplete for one or more items appearing in this scene. Research, rights, a placeholder, or counsel approval is required before the scene can be treated as shoot-ready.',

  // 6. Department Routing Explanations
  DEPARTMENT_ROUTING_REASONS: {
    LEGAL_COUNSEL: 'Assigned to Legal Counsel for trademark investigation, rights licensing, or counsel review.',
    ART_DEPT: 'Assigned to Art Department for prop graphic fictionalization or period replacement.',
    LOCATIONS: 'Assigned to Locations Department for filming permits and site owner clearance.',
    PRODUCTION_MGMT: 'Assigned to Production Management for scene scheduling and cross-department clearance.',
  } as Record<string, string>,
} as const;
