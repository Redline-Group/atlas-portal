// Regex sources handed to extractAssignment. Phase 1 reads the assignment
// sentence to create the named org; the 2k and 2l edge patterns read the same
// sentence to link it to its executor agent.
export const FACILITATOR_FOR_PREFIX = "(?:The )?(?:(?:Operational|Core) (?:Executor )?)?Facilitator for [^.]+";
export const GOVOPS_FOR_PREFIX = "(?:(?:Operational|Core) )?GovOps for [^.]+";
