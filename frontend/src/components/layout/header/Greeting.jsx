import { ROLES } from "../../../constants/app.js";

function greetingFor(hour) {
  if (hour >= 16) return "Good Evening";
  if (hour >= 12) return "Good Afternoon";
  return "Good Morning";
}

export function Greeting({ user, now }) {
  const name = user.role === ROLES.ADMIN ? "Admin" : user.name || user.username;
  return (
    <div className="welcome">
      <p id="greetingText">{greetingFor(now.getHours())}, {name}</p>
      <p id="liveDate">{now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
    </div>
  );
}
