import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import Overlay from "./overlay";
import Scene from "./scene";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Scene />
    <Overlay />
  </React.StrictMode>
);
