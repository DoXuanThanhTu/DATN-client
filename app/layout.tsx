import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "leaflet/dist/leaflet.css";
import Providers from "@/providers/query";
import ActivityTracker from "@/components/ActivityTracker";
import NavbarWrapper from "@/components/NavbarWrapper";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";
import Preloader from "@/components/Preloader";
import MaterialUIProviders from "@/components/Providers";
import Footer from "@/components/Footer";
const roboto = Roboto({
  weight: ["300", "400", "500", "700", "900"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-roboto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Chợ Tốt Clone - Nền tảng rao vặt",
  description: "Mua bán nhanh chóng, tiện lợi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${roboto.variable} h-full antialiased`}>
      <body className={`${roboto.className} min-h-full flex flex-col`}>
        <MaterialUIProviders>
          <Providers>
            <ActivityTracker />
            <Preloader />
            <NavbarWrapper />

            <main className="flex-1">{children}</main>
            <ToastContainer
              position="top-right"
              autoClose={2000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="colored"
            />
          </Providers>
        </MaterialUIProviders>
      </body>
    </html>
  );
}
