import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles/legacy.css";
import "./styles/responsive.css";
import "./styles/app.css";
import "./styles/mobile.css";

createRoot(document.getElementById("root")).render(<App />);
