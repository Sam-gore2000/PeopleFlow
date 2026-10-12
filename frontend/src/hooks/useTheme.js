import { useEffect, useState } from "react";

export function useTheme() {
  const [lightMode, setLightMode] = useState(localStorage.getItem("theme") === "light");

  useEffect(() => {
    document.body.classList.toggle("light-mode", lightMode);
    localStorage.setItem("theme", lightMode ? "light" : "dark");
  }, [lightMode]);

  return [lightMode, setLightMode];
}
