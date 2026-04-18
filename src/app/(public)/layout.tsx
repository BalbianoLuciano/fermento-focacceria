import { CartBar } from "@/components/public/CartBar";
import { Footer } from "@/components/shared/Footer";
import { Header } from "@/components/shared/Header";
import { SmoothScroll } from "@/components/shared/SmoothScroll";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SmoothScroll />
      <Header />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
      <CartBar />
    </>
  );
}
