"use client";

import React, {useEffect} from "react";

const AuthPage = () => {
  const handleClick = () => {
    window.location.href = "http://localhost:8080/auth/discord";
  };

    useEffect(() => {
        fetch("http://localhost:8080/test", {credentials: "include"}).then(r => console.log({r}))
    }, []);

  return <button onClick={handleClick}>AuthPage</button>;
};

export default AuthPage;
