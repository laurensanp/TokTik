import { FC, ReactNode } from "react";

interface NiggaLayoutProps {
  children: ReactNode;
}

const NiggaLayout: FC<NiggaLayoutProps> = ({ children }) => {
  return <div className="w-full flex">{children}</div>;
};

export default NiggaLayout;
