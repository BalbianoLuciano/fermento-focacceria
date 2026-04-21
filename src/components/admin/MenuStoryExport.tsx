"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { subscribeProducts } from "@/lib/firebase/products";
import type { Product } from "@/lib/types";

const STORY_W = 1080;
const STORY_H = 1920;

const COLORS = {
  cream: "#faf7f2",
  creamSec: "#f5efe6",
  brown100: "#e8ddd0",
  brown300: "#a0826d",
  brown500: "#6b4423",
  brown700: "#3d2817",
  brown900: "#2c1810",
  gold: "#c9a678",
  white: "#ffffff",
};

const priceFormatter = new Intl.NumberFormat("es-AR");
const fmt = (v: number) => `$${priceFormatter.format(v)}`;

async function toDataUrl(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
}

export function MenuStoryExport() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [imgMap, setImgMap] = useState<Record<string, string>>({});
  const [logoData, setLogoData] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const unsub = subscribeProducts((all) => setProducts(all), {
      activeOnly: true,
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    toDataUrl("/logo.svg").then(setLogoData);
  }, []);

  useEffect(() => {
    const urls = products.map((p) => p.imageUrl).filter(Boolean);
    if (urls.length === 0) return;
    Promise.all(urls.map(async (u) => [u, await toDataUrl(u)] as const)).then(
      (pairs) => setImgMap(Object.fromEntries(pairs)),
    );
  }, [products]);

  const handleExport = useCallback(async () => {
    if (!canvasRef.current || products.length === 0) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(canvasRef.current, {
        width: STORY_W,
        height: STORY_H,
        pixelRatio: 1,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `fermento-menu-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Imagen del menú descargada");
    } catch (error) {
      console.error("[menu-export] failed", error);
      toast.error("No pudimos generar la imagen");
    } finally {
      setExporting(false);
    }
  }, [products]);

  if (products.length === 0) return null;

  const cardH = Math.min(
    340,
    Math.floor((STORY_H - 380 - 100) / products.length),
  );
  const imgSize = Math.min(cardH - 32, 280);

  return (
    <>
      <Button
        onClick={handleExport}
        disabled={exporting}
        variant="outline"
        className="rounded-full"
      >
        {exporting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {exporting ? "Generando..." : "Exportar menú Stories"}
      </Button>

      {/* Off-screen render target at exact Stories resolution */}
      <div
        style={{
          position: "fixed",
          left: "-9999px",
          top: 0,
          width: STORY_W,
          height: STORY_H,
          overflow: "hidden",
          pointerEvents: "none",
          zIndex: -1,
        }}
        aria-hidden="true"
      >
        <div
          ref={canvasRef}
          style={{
            width: STORY_W,
            height: STORY_H,
            background: `linear-gradient(180deg, ${COLORS.cream} 0%, ${COLORS.creamSec} 100%)`,
            display: "flex",
            flexDirection: "column",
            fontFamily: "var(--font-body), Outfit, sans-serif",
            color: COLORS.brown900,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
              paddingTop: 64,
              paddingBottom: 32,
            }}
          >
            {logoData && (
              <img
                src={logoData}
                alt=""
                width={120}
                height={120}
                style={{ objectFit: "contain" }}
              />
            )}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                borderRadius: 9999,
                border: `1px solid ${COLORS.brown100}`,
                background: `${COLORS.white}cc`,
                padding: "8px 20px",
                fontSize: 14,
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: COLORS.brown500,
              }}
            >
              Nuestros sabores
            </span>
            <span
              style={{
                fontFamily: "var(--font-display), 'Berkshire Swash', cursive",
                fontSize: 54,
                color: COLORS.brown900,
                textAlign: "center",
                lineHeight: 1.1,
              }}
            >
              Lo justo y necesario
            </span>
            <span
              style={{
                fontSize: 18,
                color: COLORS.brown500,
                textAlign: "center",
                maxWidth: 700,
                lineHeight: 1.4,
              }}
            >
              Masa madre, fermentación lenta, horneada a pedido
            </span>
          </div>

          {/* Product cards */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              padding: "0 40px",
            }}
          >
            {products.map((p) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  alignItems: "stretch",
                  background: COLORS.white,
                  borderRadius: 28,
                  border: `1px solid ${COLORS.brown100}`,
                  overflow: "hidden",
                  height: cardH,
                }}
              >
                {/* Product image */}
                <div
                  style={{
                    width: imgSize,
                    minWidth: imgSize,
                    background: COLORS.creamSec,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {imgMap[p.imageUrl] ? (
                    <img
                      src={imgMap[p.imageUrl]}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily:
                          "var(--font-display), 'Berkshire Swash', cursive",
                        fontSize: 64,
                        color: `${COLORS.brown300}80`,
                      }}
                    >
                      {p.name.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Product info */}
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: 12,
                    padding: "20px 28px",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span
                      style={{
                        fontFamily:
                          "var(--font-display), 'Berkshire Swash', cursive",
                        fontSize: 42,
                        lineHeight: 1.1,
                        color: COLORS.brown900,
                      }}
                    >
                      {p.name}
                    </span>
                    <span
                      style={{
                        fontSize: 20,
                        color: COLORS.brown500,
                        lineHeight: 1.3,
                      }}
                    >
                      {p.description}
                    </span>
                  </div>

                  {/* Sizes & prices */}
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {p.sizes.map((s) => (
                      <div
                        key={s.name}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          borderRadius: 12,
                          border: `1px solid ${COLORS.brown100}`,
                          padding: "8px 16px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 500,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            color: COLORS.brown500,
                          }}
                        >
                          {s.name}
                        </span>
                        <span
                          style={{
                            fontFamily:
                              "var(--font-display), 'Berkshire Swash', cursive",
                            fontSize: 26,
                            lineHeight: 1,
                            color: COLORS.brown900,
                          }}
                        >
                          {fmt(s.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              padding: "24px 40px 48px",
            }}
          >
            <span
              style={{
                fontSize: 18,
                fontWeight: 500,
                color: COLORS.brown700,
              }}
            >
              Pedí desde la página
            </span>
            <span
              style={{
                fontFamily: "var(--font-display), 'Berkshire Swash', cursive",
                fontSize: 20,
                color: COLORS.gold,
              }}
            >
              fermento-focacceria.vercel.app
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
