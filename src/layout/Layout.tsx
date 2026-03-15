import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Outlet } from "react-router";

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden font-default">
      <Header className="relative z-20 shrink-0" />
      <main className="relative flex-1">
        <Outlet />
      </main>
      <Footer className="relative z-20 shrink-0" />
    </div>
  )
}
