import { useEffect, useState } from "react";
import { useEmployeeDirectory } from "../../hooks/useEmployeeDirectory.js";
import { findById, findByName } from "./employeeFields.js";

// Admin: type an Employee ID or a name (with suggestions) to choose an employee.
// onPick(employee) is called once the text matches exactly one employee.
export function EmployeePicker({ onPick, placeholder = "Employee ID or name", id = "employee-picker-options" }) {
  const directory = useEmployeeDirectory(true);
  const [text, setText] = useState("");
  const [picked, setPicked] = useState(null);

  function match(value) {
    setText(value);
    const employee = findById(directory, value) || findByName(directory, value).employee;
    if (employee && employee.empid !== picked) {
      setPicked(employee.empid);
      setText(`${employee.empid} - ${employee.fname}`);
      onPick(employee);
    }
  }

  // Text typed before the list finished loading is matched once it arrives.
  useEffect(() => { if (directory.length && text && !picked) match(text); }, [directory]);

  return (
    <div className="emp-picker">
      <input
        className="form-control"
        list={id}
        placeholder={placeholder}
        value={text}
        onChange={(event) => match(event.target.value)}
        onFocus={(event) => event.target.select()}
        onKeyDown={(event) => event.key === "Enter" && match(event.currentTarget.value)}
        aria-label="Employee"
      />
      <datalist id={id}>
        {directory.map((employee) => <option key={employee.empid} value={employee.empid} label={employee.fname} />)}
      </datalist>
    </div>
  );
}
