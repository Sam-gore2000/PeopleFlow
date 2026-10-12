// Employees cannot touch admin-only resources and only ever see their own rows.
// They may add/edit rows of self-service resources, but never approve or delete.
export const employeePolicy = {
  canAccess: (config) => !config.adminOnly,
  canWrite: (config) => !config.adminOnly && Boolean(config.selfService),
  canApprove: () => false,
  canDelete: () => false,
  scope(config, user, filter) {
    if (config.employeeField) filter[config.employeeField] = user.empid;
    return filter;
  },
  // Fields forced onto rows an employee creates or edits, so they cannot file on someone else's behalf.
  ownerFields: (config, user) => (config.employeeField ? { [config.employeeField]: user.empid } : {})
};
