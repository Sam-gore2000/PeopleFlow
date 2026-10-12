// Starter records used by `npm run seed` (MongoDB) and by the in-memory fallback store.
// `key` is the field used to upsert without creating duplicates.
export const seedData = {
  admins: {
    key: "username",
    records: [{ username: "admin", password: "admin123", email: "admin@example.com" }]
  },
  employees: {
    key: "empid",
    records: [
      {
        fname: "Sample Employee",
        empid: "EMP001",
        email: "employee@example.com",
        phno: "9999999999",
        pass: "employee123",
        department: "Operations",
        position: "Employee",
        jdate: "2026-01-05",
        bdate: "1998-01-05",
        status: "Offline"
      },
      {
        fname: "Local Test User",
        empid: "testuser",
        email: "testuser@localhost.test",
        phno: "9999999900",
        pass: "test123",
        department: "QA",
        position: "Employee",
        jdate: "2026-09-22",
        bdate: "1999-09-22",
        report_manager: "Sample Manager",
        report_manager_id: "MGR001",
        status: "Offline"
      },
      {
        fname: "Sample Manager",
        empid: "MGR001",
        email: "manager@example.com",
        phno: "9999999998",
        pass: "manager123",
        department: "Operations",
        position: "Team Manager",
        jdate: "2025-12-01",
        bdate: "1995-09-22",
        status: "Offline"
      }
    ]
  },
  notices: {
    key: "heading",
    records: [{ heading: "Welcome to HRMS", descr: "Latest HR updates will appear here.", created_at: new Date() }]
  }
};
