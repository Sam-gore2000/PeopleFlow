export const adminAccessConfig = {
  resource: "admins",
  fields: [
    { name: "username", label: "Username", required: true },
    { name: "password", label: "Password", type: "password", requiredOnCreate: true },
    { name: "email", label: "Email", type: "email" }
  ]
};
