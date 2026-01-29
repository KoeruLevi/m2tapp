import React from "react";
import { Navigate } from "react-router-dom";

const RequireActualModule = ({ children }) => {
  const modulo = localStorage.getItem("modulo") || "actual";
  if (modulo === "historico") return <Navigate to="/dashboard" replace />;
  return children;
};

export default RequireActualModule;