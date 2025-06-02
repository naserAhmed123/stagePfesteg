if (typeof global === 'undefined') {
  window.global = window;
}

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import "./index.css";
import "swiper/swiper-bundle.css";
import "simplebar-react/dist/simplebar.min.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { AuthProvider } from "./layout/AuthContext.tsx";

createRoot(document.getElementById("root")!).render(
  <Router basename="/stagePfesteg">
    <AuthProvider>
      <StrictMode>
        <ThemeProvider>
          <AppWrapper>
            <App />
          </AppWrapper>
        </ThemeProvider>
      </StrictMode>
    </AuthProvider>
  </Router>
);