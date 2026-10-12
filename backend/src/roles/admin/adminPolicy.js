// Admins can read, write, approve and delete every resource, unscoped.
export const adminPolicy = {
  canAccess: () => true,
  canWrite: () => true,
  canApprove: () => true,
  canDelete: () => true,
  scope: (_config, _user, filter) => filter,
  ownerFields: () => ({})
};
