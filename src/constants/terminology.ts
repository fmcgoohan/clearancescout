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
    LEGAL_COUNSEL: 'Routed to Legal Counsel for trademark research, rights review, or clearance evaluation.',
    ART_DEPT: 'Routed to Art Dept for graphic replacement or prop clearance modification.',
    LOCATIONS: 'Routed to Locations Dept for location release or venue permit verification.',
    CLEARANCE_TEAM: 'Routed to Clearance Team for general evidence collection.',
  } as Record<string, string>,

  // 7. UX Redesign Operator Domain Labels
  CLEARANCE_ITEMS_LABEL: 'Clearance Items',
  CLEARANCE_ITEMS_HEADER: 'Clearance Items ("Clear Once, Recognize Everywhere")',
  RESEARCH_ACTION_LABEL: 'Research',
  RESEARCH_EVIDENCE_LABEL: 'Verify Evidence',
  SCREENPLAY_INTAKE_LABEL: 'Screenplay Intake & Clearance',
  RECOMMENDED_ACTION_LABEL: 'Recommended Next Action',
};

