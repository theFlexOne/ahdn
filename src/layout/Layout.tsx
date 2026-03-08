// import Footer from "@/components/Footer";
// import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Outlet } from "react-router";

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col overflow-hidden font-default">
      <Header className="shrink-0" />
      <main className="relative min-h-0 flex-1 bg-[hsl(0,0%,0%)]">
        <Outlet />
      </main>
      <Footer className="shrink-0" />
    </div>
  )
}
