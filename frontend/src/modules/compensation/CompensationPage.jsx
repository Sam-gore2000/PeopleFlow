import { useState } from "react";
import { useViewHistory } from "../../app/history.js";
import { ResourcePage } from "../../components/resource/ResourcePage.jsx";
import { ROLES } from "../../constants/app.js";
import { BankDetailsView } from "./BankDetailsView.jsx";
import { compensationConfig } from "./compensation.config.js";

// "Compensation Details" (admin) / "Bank Details" (employees, managers).
// View opens the bank details; admins also see the salary structure.
export function CompensationPage({ user }) {
  const [viewing, setViewing] = useState(null);
  const isAdmin = user.role === ROLES.ADMIN;
  const closeView = useViewHistory(Boolean(viewing), () => setViewing(null));

  if (viewing) {
    return (
      <BankDetailsView
        record={viewing}
        showSalary={isAdmin}
        title={isAdmin ? "Compensation Details" : "Bank Details"}
        onBack={closeView}
      />
    );
  }

  return <ResourcePage config={compensationConfig} user={user} onView={setViewing} viewLabel={isAdmin ? "View Details" : "View Bank Details"} viewIcon="bi-eye" />;
}
