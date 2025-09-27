"use client";

import React, {useEffect} from "react";

const AuthPage = () => {
  const handleClick = () => {
    window.location.href = "http://localhost:8080/auth/discord";
  };

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/test`, {credentials: "include"}).then(r => console.log({r}))
    }, []);

  return <button onClick={handleClick}>AuthPage</button>;
};

export default AuthPage;
