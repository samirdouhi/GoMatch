import { ReactNode } from "react";
import CommercantShell from "../components/commercant/CommercantShell";

type Props = { children: ReactNode };

export default function CommercantLayout({ children }: Props) {
  return <CommercantShell>{children}</CommercantShell>;
}
