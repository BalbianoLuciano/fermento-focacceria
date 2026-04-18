import { CartBar } from "@/components/public/CartBar";
import { Footer } from "@/components/shared/Footer";
import { Header } from "@/components/shared/Header";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
      <CartBar />
    </>
  );
}
