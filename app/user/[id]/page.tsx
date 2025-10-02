"use client";

import { useAuth } from "@/context/auth/AuthProvider";
import useGetUserById from "@/hooks/user/useGetUserById";
import { useParams } from "next/navigation";
import React from "react";

const UserIdPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { data } = useGetUserById(id as string);

  return (
    <div className="flex flex-col">
      <div className="flex">
        <img className="rounded-full size-28" src={data?.imageUrl} alt="" />
        <div className="flex flex-col py-4 pl-4">
          <div className="text-3xl">KiwiousKiwi</div>
          <div className="text-lg text-gray-500">@{data?.handle}</div>
        </div>
      </div>
      Videos
    </div>
  );
};

export default UserIdPage;
