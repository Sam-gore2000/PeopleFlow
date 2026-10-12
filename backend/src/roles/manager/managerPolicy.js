// Managers see their team's rows plus their own where a resource records the reporting manager
// (leaves, attendance, attendance requests); elsewhere they can pass ?mine=true to see only their own.
// They may add/edit self-service rows and approve approvable ones, but never delete.
export const managerPolicy = {
  canAccess: (config) => !config.adminOnly,
  canWrite: (config) => !config.adminOnly && Boolean(config.selfService),
  canApprove: (config) => !config.adminOnly && Boolean(config.approvable),
  canDelete: () => false,
  scope(config, user, filter, { mine, approving } = {}) {
    if (config.managerField) {
      if (mine && config.employeeField) filter[config.employeeField] = user.empid;
      else filter.$or = [{ [config.managerField]: user.empid }, ...(config.employeeField ? [{ [config.employeeField]: user.empid }] : [])];
    } else if (config.employeeField && mine) filter[config.employeeField] = user.empid;
    // A manager never approves their own request.
    if (approving && config.employeeField) filter[config.employeeField] = { $ne: user.empid };
    return filter;
  },
  // Rows a manager creates (their own leave, query...) are filed under their own Employee ID.
  ownerFields: (config, user) => (config.employeeField ? { [config.employeeField]: user.empid } : {})
};
