import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Outlet } from "react-router";

export default function Layout() {
  return (
    <div className="relative min-h-screen overflow-hidden font-default">
      <div
        className="inset-0 fixed -z-10 bg-[url('/images/AHDN-flag2.webp')] bg-cover bg-center bg-no-repeat grayscale-25"
      ></div>
      <div className="relative grid grid-rows-[auto_1fr_auto] min-h-screen">
        <Header />
        <Outlet />
        <Footer />
      </div>
    </div>
  )
}
