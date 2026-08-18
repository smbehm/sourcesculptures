import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ensureBaseTrailingSlash } from "./ensureBaseTrailingSlash";
import "./index.css";

ensureBaseTrailingSlash();

createRoot(document.getElementById("root")!).render(<App />);
