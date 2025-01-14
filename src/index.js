import React from "react";
import ReactDOM from "react-dom/client"; // ReactDOM.createRoot için
import App from "./App";
import "./index.css";
import { Buffer } from "buffer";
import process from "process";
window.Buffer = Buffer;
window.process = process;

// ReactDOM.createRoot kullanımı
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
