import { Navigate } from "react-router-dom";

// Chatbot feature removed — redirecting to dashboard
const Chatbot = () => <Navigate to="/dashboard" replace />;

export default Chatbot;