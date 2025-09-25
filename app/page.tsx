"use client";

import { useRouter } from "next/navigation";

import SplitText from "../components/SplitText";
import Magnet from "../components/FollowCursor";
import GradientBlinds from "../components/GradientBlinds";

export default function Home() {
  const router = useRouter();

  function handleClick() {
    router.push("/user");
    console.log("Navigated to /user");
  }

  return (
    <div className="size-full flex justify-center items-center">
      <div>
        <Magnet padding={50} disabled={false} magnetStrength={1}>
          <div style={{ position: "relative", width: "100%", height: "600px" }}>
            <GradientBlinds
              gradientColors={["#FF9FFC", "#5227FF"]}
              angle={0}
              noise={0.3}
              blindCount={12}
              blindMinWidth={50}
              spotlightRadius={0.5}
              spotlightSoftness={1}
              spotlightOpacity={1}
              mouseDampening={0.15}
              distortAmount={0}
              shineDirection="left"
              mixBlendMode="lighten"
            />
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "100%",
                zIndex: 10,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <SplitText
                text="Welcome to the T-Nigger Page"
                className="text-2xl font-semibold text-center text-black"
                delay={100}
                duration={0.6}
                ease="power3.out"
                splitType="chars"
                from={{ opacity: 0, y: 40 }}
                to={{ opacity: 1, y: 0 }}
                threshold={0.1}
                rootMargin="-100px"
                textAlign="center"
                onLetterAnimationComplete={handleClick}
              />
            </div>
          </div>
        </Magnet>
      </div>
    </div>
  );
}
