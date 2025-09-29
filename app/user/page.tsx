"use client";

import useCreateNewUser from "@/hooks/user/useCreateNewUser";
import useGetAllUsers from "@/hooks/user/useGetAllUsers";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { getIpAddress } from "@/utils/getIpAddress";

export default function UserPage() {
  const { mutateAsync: createNigger } = useCreateNewUser();
  const { data } = useGetAllUsers();

  const queryClient = useQueryClient();

  const handleCreateNigger = async () => {
    const imageUrls = [
      "https://cdn.discordapp.com/attachments/978003347783159880/1420852867572564040/IMG_1304.jpg?ex=68d6e7d9&is=68d59659&hm=868a28500fc03350de4de3aed68352ded6bc998184e0f231086aa70b665ab804&",
      "https://cdn.discordapp.com/attachments/978003347783159880/1420840275902992524/Screenshot_20250823_160327_TikTok.jpg?ex=68d6dc1f&is=68d58a9f&hm=7cfcd6cd0817ed608bd12a4d5fc764ce34f25d52eb992dbfc4813552511d37ea&",
      "https://cdn.discordapp.com/attachments/978003347783159880/1420839977889169508/7xfcF3t.png?ex=68d6dbd8&is=68d58a58&hm=36b73cb9169cf0eb89c52c93b5597fd82e9e7764212a937b098b7c1f7990656d&",
      "https://media.discordapp.net/attachments/728253381285773329/1063817291847962705/togif.gif?ex=68d69a0f&is=68d5488f&hm=f81762143a486c7af5464676ccba39502d77a1f759628b2b7dc8a0d579eb6dd7&",
      "https://cdn.discordapp.com/attachments/978003347783159880/1420785504600981595/IMG_0580.png?ex=68d6a91d&is=68d5579d&hm=8cec890a014b80d0b5f6b07dd43d585b443e801eff279a73d8bd056744e508c7&",
      "https://cdn.discordapp.com/attachments/978003347783159880/1351251214058131456/Gl8KlPRWcAAbSc8.jpeg?ex=68d62982&is=68d4d802&hm=be83aea93de7672f246322c7685095b8d3969ef362bc0c9a9300e1b13de6d16c&",
      "https://cdn.discordapp.com/attachments/979283646571749396/1089924777273200793/IMG_0841.png?ex=68d6a88c&is=68d5570c&hm=bc3ae9e0513e2f6f9ec293fa788981983a9e05fdb82519f778b1f90e0454a708&",
      "https://cdn.discordapp.com/attachments/979283646571749396/1089924777273200793/IMG_0841.png?ex=68d6a88c&is=68d5570c&hm=bc3ae9e0513e2f6f9ec293fa788981983a9e05fdb82519f778b1f90e0454a708&",
      "https://cdn.discordapp.com/attachments/979283646571749396/1089924777273200793/IMG_0841.png?ex=68d6a88c&is=68d5570c&hm=bc3ae9e0513e2f6f9ec293fa788981983a9e05fdb82519f778b1f90e0454a708&",
    ];

    const randomImageUrl =
      imageUrls[Math.floor(Math.random() * imageUrls.length)];
    const ip = await getIpAddress();

    await createNigger({
      displayName: "Laurens",
      handle: "real_laurens_official",
      imageUrl: randomImageUrl,
      ip,
      watchedVideos: [],
    });
  };

  const handleDeleteAllNiggers = async () => {
    await axios.delete(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user`);
    await queryClient.invalidateQueries({ queryKey: ["GET_ALL_USERS"] });
  };

  return (
    <>
      <div className="p-8 text-center">
        <h1 className="text-3xl font-bold mb-4">User Profile</h1>
        <p>
          Welcome to your user dashboard. Here you can manage your account and
          view your videos.
        </p>
      </div>
      <div className="flex flex-col gap-4 items-center">
        <button
          onClick={handleCreateNigger}
          className="bg-blue-400 rounded-lg px-6 py-2 text-lg cursor-pointer"
        >
          Create New User
        </button>
        <button
          onClick={handleDeleteAllNiggers}
          className="flex justify-center items-center bg-red-400 rounded-lg p-4 text-lg cursor-pointer"
        >
          Delete All Users
        </button>
        <div className="flex flex-wrap mt-12 gap">
          {data?.data?.map((user: User, index: number) => (
            <div key={`${user.handle}-${index}`} className="flex gap-2">
              <img
                src={user.imageUrl}
                alt=""
                className="size-14 rounded-full"
              />
              <div className="flex flex-col">
                <div>{user.displayName}</div>
                <div className="text-gray-500">@{user.handle}</div>
                <div className="text-xs text-gray-400">
                  IP: {user.ip || "Loading..."}
                </div>
                <div className="text-xs text-gray-400">
                  ID: {user.id}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
