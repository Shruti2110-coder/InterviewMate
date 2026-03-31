import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import React from "react";

function Protected({ children }) {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <main>
        <h1>Loading......</h1>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default Protected;