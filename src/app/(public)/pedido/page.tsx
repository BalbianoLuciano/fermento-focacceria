import { PedidoFlow } from "@/components/public/PedidoFlow";

export const metadata = {
  title: "Armar pedido",
  description:
    "Sumá focaccias al pedido, completá tus datos y coordinamos por WhatsApp.",
};

export default function PedidoPage() {
  return (
    <section className="mx-auto w-full max-w-5xl px-5 pb-24 pt-10 md:px-8 md:pt-16">
      <header className="mb-10 flex flex-col items-center gap-3 text-center md:mb-14">
        <span className="inline-flex items-center rounded-full border border-border bg-card/80 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-brown-500 backdrop-blur">
          Armar pedido
        </span>
        <h1 className="font-display text-4xl text-brown-900 md:text-5xl">
          Revisá y confirmá
        </h1>
        <p className="max-w-lg text-base text-brown-500">
          Ajustá cantidades, dejanos tus datos y te abrimos WhatsApp con el
          pedido pre-cargado para Anna.
        </p>
      </header>

      <PedidoFlow />
    </section>
  );
}
