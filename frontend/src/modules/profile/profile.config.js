// What employees and managers can edit on their own profile (the server enforces the same list).
// Name, Employee ID, position, department, joining date and reporting manager are changed by HR
// in Admin -> Employee Details.
export const PROFILE_FIELDS = [
  { name: "about", label: "About", type: "textarea" },
  { name: "phno", label: "Phone" },
  { name: "email", label: "Email", type: "email" },
  { name: "bdate", label: "Birth Date", type: "date" },
  { name: "add", label: "Address", type: "textarea" },
  { name: "padd", label: "Permanent Address", type: "textarea" },
  { name: "edu", label: "Education" },
  { name: "skills", label: "Skills" },
  { name: "twitter", label: "Twitter / X profile link" },
  { name: "facebook", label: "Facebook profile link" },
  { name: "instagram", label: "Instagram profile link" },
  { name: "linkedin", label: "LinkedIn profile link" }
];

export const ADMIN_PROFILE_FIELDS = [{ name: "email", label: "Email", type: "email" }];

export const PASSWORD_FIELDS = [
  { name: "currentPassword", label: "Current Password", type: "password" },
  { name: "newPassword", label: "New Password", type: "password" },
  { name: "renewPassword", label: "Re-enter New Password", type: "password" }
];

export const EMPTY_PASSWORDS = { currentPassword: "", newPassword: "", renewPassword: "" };

// Overview tab layout, as on the old HRM profile page.
export const OVERVIEW_SECTIONS = [
  {
    title: "Personal Information",
    items: [
      { key: "fname", label: "Full Name", icon: "bi-person" },
      { key: "empid", label: "Employee ID", icon: "bi-person-vcard" },
      { key: "bdate", label: "Birth Date", icon: "bi-calendar3", format: "date" },
      { key: "add", label: "Address", icon: "bi-geo-alt" }
    ]
  },
  {
    title: "Work Information",
    items: [
      { key: "department", label: "Department", icon: "bi-diagram-3" },
      { key: "position", label: "Position", icon: "bi-briefcase" },
      { key: "jdate", label: "Joining Date", icon: "bi-calendar-check", format: "date" },
      { key: "report_manager", label: "Report Manager", icon: "bi-person-up", fallbackKey: "report_manager_id" }
    ]
  },
  {
    title: "Contact Information",
    items: [
      { key: "email", label: "Email", icon: "bi-envelope" },
      { key: "phno", label: "Phone", icon: "bi-telephone" }
    ]
  },
  {
    title: "Education & Skills",
    items: [
      { key: "edu", label: "Education", icon: "bi-mortarboard" },
      { key: "skills", label: "Skills", icon: "bi-stars" }
    ]
  }
];

export const ADMIN_OVERVIEW_SECTIONS = [
  {
    title: "Account",
    items: [
      { key: "username", label: "Username", icon: "bi-person" },
      { key: "position", label: "Role", icon: "bi-shield-lock" },
      { key: "email", label: "Email", icon: "bi-envelope" }
    ]
  }
];

export const SOCIAL_LINKS = [
  { key: "twitter", label: "Twitter / X", icon: "bi-twitter-x" },
  { key: "facebook", label: "Facebook", icon: "bi-facebook" },
  { key: "instagram", label: "Instagram", icon: "bi-instagram" },
  { key: "linkedin", label: "LinkedIn", icon: "bi-linkedin" }
];
