"use client";

import React from "react";

const AuthPage = () => {
  const handleClick = () => {
    window.location.href = "http://localhost:8080/oauth2/authorization/discord";
  };

  return <button onClick={handleClick}>AuthPage</button>;
};

export default AuthPage;
