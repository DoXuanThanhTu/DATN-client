"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function NavbarWrapper() {
  const pathname = usePathname();

  const isChatPage = pathname?.startsWith("/chat");

  if (isChatPage) return null;

  return <Navbar />;
}
