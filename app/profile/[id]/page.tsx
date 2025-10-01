"use client";

import { useParams } from "next/navigation";
import React from "react";

const UserIdPage = () => {
  const { id } = useParams();
  return <div>UserIdPage: {id}</div>;
};

export default UserIdPage;
