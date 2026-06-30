import { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import LoginPage from "./components/LoginPage.jsx";
import { supabase } from "./supabase.js";

// Offline/local dev runs without Supabase auth, same as the original setup.
const LOCAL_MODE =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

function Root() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    if (LOCAL_MODE) return; // no Supabase offline
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Offline: skip the login screen and run with a stand-in local user.
  if (LOCAL_MODE) return <App session={{ user: { email: "local" } }} />;

  if (session === undefined) return null; // still loading
  return session ? <App session={session} /> : <LoginPage />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
