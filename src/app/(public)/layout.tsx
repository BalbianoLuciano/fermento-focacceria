import { CartBar } from "@/components/public/CartBar";
import { ServiceClosedScreen } from "@/components/public/ServiceClosedScreen";
import { Footer } from "@/components/shared/Footer";
import { Header } from "@/components/shared/Header";
import { SmoothScroll } from "@/components/shared/SmoothScroll";
import { getSettings } from "@/lib/firebase/settings";

export const revalidate = 60;

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();

  if (settings?.serviceOpen === false) {
    return (
      <ServiceClosedScreen
        message={settings.closedMessage}
        whatsappNumber={settings.whatsappNumber}
        instagramHandle={settings.instagramHandle}
      />
    );
  }

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
