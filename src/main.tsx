import React from "react";
import ReactDOM from "react-dom/client";
import RustmanUI from "./App"; // assuming your main component is RustmanUI

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RustmanUI />
  </React.StrictMode>
);
