// import Footer from "@/components/Footer";
// import Header from "@/components/Header";
import Footer2 from "@/components/Footer2";
import Header2 from "@/components/Header2";
import { Outlet } from "react-router";

export default function Layout2() {
  return (
    <div className="flex min-h-screen flex-col overflow-hidden font-default">
      <Header2 className="shrink-0" />
      <main className="relative min-h-0 flex-1 bg-[hsl(0,0%,0%)]">
        <Outlet />
      </main>
      <Footer2 className="shrink-0" />
    </div>
  )
}
