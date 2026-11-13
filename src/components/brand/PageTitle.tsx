import { KineticLine } from "@/components/brand/KineticLine";
import { useSplashStore } from "@/store/splash";
import { cn } from "@/lib/utils";

/**
 * Every storefront page opens on the same gesture as the home page: its title
 * arrives glyph by glyph (KineticLine), after the splash curtain or the page
 * curtain has lifted. The h1 is real text for search engines and readers.
 */
export function PageTitle({
  text,
  className,
  delay = 0.55,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const splashOpen = useSplashStore((state) => state.open);
  return (
    <h1
      className={cn(
        "font-display text-[3.4rem] leading-[0.95] font-medium tracking-[-0.035em] sm:text-7xl lg:text-8xl",
        className,
      )}
    >
      <KineticLine text={text} play={!splashOpen} delay={delay} stagger={0.035} />
    </h1>
  );
}
