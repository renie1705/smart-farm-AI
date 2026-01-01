import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    // Check authentication status
    const loggedIn = localStorage.getItem("isLoggedIn") === "true" || !!localStorage.getItem("user");
    setIsLoggedIn(loggedIn);
  }, []);

  // Show nothing while checking auth status to prevent flash
  if (isLoggedIn === null) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
