import { cn } from "@/lib/utils";

export type ScreenVisualVariant = "analytics" | "checkout" | "kanban" | "messages" | "billing" | "settings";

export function ScreenVisual({
  variant,
  className,
}: {
  variant: ScreenVisualVariant;
  className?: string;
}) {
  return (
    <div className={cn("screen-visual", `screen-visual-${variant}`, className)} aria-hidden>
      <div className="screen-mini-sidebar">
        <span className="screen-mini-logo" />
        <i /><i /><i /><i />
      </div>
      <div className="screen-mini-main">
        <div className="screen-mini-topbar"><b /><span /><span /></div>
        {variant === "analytics" && (
          <>
            <div className="screen-stat-row"><i /><i /><i /></div>
            <div className="screen-chart"><span /><span /><span /><span /><span /><span /></div>
          </>
        )}
        {variant === "checkout" && (
          <div className="screen-checkout"><div><i /><i /><i /></div><aside><b /><span /><span /><strong /></aside></div>
        )}
        {variant === "kanban" && (
          <div className="screen-kanban"><div><b /><i /><i /></div><div><b /><i /><i /><i /></div><div><b /><i /></div></div>
        )}
        {variant === "messages" && (
          <div className="screen-messages"><aside><i /><i /><i /><i /></aside><div><span /><span /><span /><b /></div></div>
        )}
        {variant === "billing" && (
          <div className="screen-billing"><strong /><b /><span /><span /><span /></div>
        )}
        {variant === "settings" && (
          <div className="screen-settings"><div><b /><span /><span /></div><aside><i /><i /><i /><i /></aside></div>
        )}
      </div>
    </div>
  );
}
