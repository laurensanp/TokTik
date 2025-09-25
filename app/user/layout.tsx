import { FC, ReactNode } from "react";

interface NiggaLayoutProps {
  children: ReactNode;
}

const NiggaLayout: FC<NiggaLayoutProps> = ({ children }) => {
  return <div className="w-full flex justify-center">{children}</div>;
};

export default NiggaLayout;
