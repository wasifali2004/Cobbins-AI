import { AuthBackground } from "@/components/auth-background";
import { DitheredLogo } from "@/components/ui/dithered-logo";

export function AuthHeroPane() {
  return (
    <aside className="auth-dither-stage" aria-label="Interactive Cobbins logo">
      <AuthBackground />
      <DitheredLogo
        imageSrc="/black-logo.svg"
        className="auth-dithered-logo"
        gridSize={280}
        scale={1.3}
        dotScale={0.92}
        invert
        cornerRadius={0.22}
        gamma={1.1}
        blur={2}
        diffusionStrength={1}
      />
    </aside>
  );
}

export default AuthHeroPane;
