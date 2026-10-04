"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  ArrowUpIcon,
  ArrowUpRight,
  Check,
  CircleUserRound,
  Code2,
  CreditCard,
  FileUp,
  Folder,
  FolderHeart,
  GalleryVerticalEnd,
  Home,
  ImageIcon,
  Layers,
  Loader2,
  LogOut,
  Menu,
  MonitorIcon,
  Palette,
  Paperclip,
  Plus,
  Rocket,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  User,
  X,
} from "lucide-react";

import { CobbinsLogo } from "@/components/cobbins-logo";
import { SquareRotatedAsteriskIcon } from "@/components/icons/square-rotated-asterisk-icon";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { OriginButton } from "@/components/ui/origin-button";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, generatePage, getCredits, updateProfile, type GenerateResponse } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { registerPendingGeneration } from "@/lib/pending-generations";

type PageId = "overview" | "library" | "generate" | "collections" | "settings";
export type DashboardView = PageId;

type ScreenRecord = {
  id: string;
  title: string;
  product: string;
  screenType: string;
  category: string;
  thumbnailUrl: string;
};

type CollectionRecord = { id: string; name: string; count: number };

const navigation: Array<{ id: PageId; label: string; icon: typeof Home }> = [
  { id: "overview", label: "Dashboard", icon: Home },
  { id: "library", label: "Screen library", icon: GalleryVerticalEnd },
  { id: "collections", label: "Collections", icon: FolderHeart },
  { id: "settings", label: "Settings", icon: Settings },
];

const categories = ["All", "Uploads"];
const numberFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

const QUICK_ACTIONS: Array<{ label: string; icon: typeof Rocket; prompt: string }> = [
  { label: "Generate Code", icon: Code2, prompt: "A developer-focused landing page for a code generation tool, with a live code preview section and terminal-style visuals." },
  { label: "Launch App", icon: Rocket, prompt: "A product launch landing page with a countdown, an early-access signup form, and social proof." },
  { label: "UI Components", icon: Layers, prompt: "A component library showcase page with buttons, cards, and form inputs in one consistent design system." },
  { label: "Theme Ideas", icon: Palette, prompt: "A landing page that shows off multiple color themes side by side, with a theme switcher." },
  { label: "User Dashboard", icon: CircleUserRound, prompt: "An analytics dashboard with a sidebar, KPI cards, and a revenue chart." },
  { label: "Landing Page", icon: MonitorIcon, prompt: "A modern SaaS landing page with a bold hero section, feature highlights, and a pricing table." },
  { label: "Upload Docs", icon: FileUp, prompt: "A documentation landing page with a search bar, categorized guides, and code snippets." },
  { label: "Image Assets", icon: ImageIcon, prompt: "A visual portfolio landing page showcasing image assets with a masonry grid and lightbox previews." },
];

const POLAR_CHECKOUT_URL = "https://buy.polar.sh/polar_cl_sLXt943AIJjOKkd30ZDnVCriYAU3Pn4zQbqWl0V7Sqn";

const pricingPlans = [
  {
    name: "Starter",
    price: "$10",
    credits: 25,
    description: "Get a feel for Cobbins with a small top-up of generations.",
    features: ["25 generation credits", "Personal screen library", "React and HTML preview"],
    featured: false,
    productId: "2a28eeef-058f-4e13-a834-d0e2c1ddde12",
  },
  {
    name: "Growth",
    price: "$35",
    credits: 110,
    description: "The best per-credit rate for regular, ongoing product work.",
    features: ["110 generation credits", "High-fidelity exports", "Priority generation queue"],
    featured: true,
    productId: "803f0580-701f-4e0f-a5f4-b88ed1c18f6c",
  },
  {
    name: "Scale",
    price: "$90",
    credits: 320,
    description: "The lowest per-credit rate for heavy, continuous generation.",
    features: ["320 generation credits", "Everything in Growth", "Priority support"],
    featured: false,
    productId: "bae98291-e51c-43d5-acbe-d0fe0994050c",
  },
] as const;

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="dash2-page-header">
      <div>
        <p className="dash2-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="dash2-page-description">{description}</p>
      </div>
      {action ? <div className="dash2-page-action">{action}</div> : null}
    </div>
  );
}

function ScreenCard({ screen, compact = false }: { screen: ScreenRecord; compact?: boolean }) {
  return (
    <article className="dash2-card dash2-interactive-card dash2-screen-card" data-compact={compact} tabIndex={0}>
      <div
        aria-label={`${screen.title} screenshot`}
        className="dash2-screen-visual dash2-screen-image"
        role="img"
        style={{ backgroundImage: `url(${JSON.stringify(screen.thumbnailUrl)})` }}
      />
      <div className="dash2-screen-meta">
        <div><strong>{screen.product}</strong><span>{screen.screenType}</span></div>
        <ArrowUpRight aria-hidden />
      </div>
    </article>
  );
}

function readImageFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function LibraryPage({ screens, onAddScreens }: { screens: ScreenRecord[]; onAddScreens: (screens: ScreenRecord[]) => void }) {
  const [libraryQuery, setLibraryQuery] = useState("");
  const [category, setCategory] = useState("All");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filteredScreens = useMemo(() => {
    const term = libraryQuery.trim().toLowerCase();
    return screens.filter((screen) => {
      const matchesCategory = category === "All" || screen.category === category;
      const matchesQuery = !term || `${screen.title} ${screen.product} ${screen.screenType} ${screen.category}`.toLowerCase().includes(term);
      return matchesCategory && matchesQuery;
    });
  }, [category, libraryQuery, screens]);

  async function handleScreenFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    const uploadedScreens = await Promise.all(files.map(async (file) => ({
      id: crypto.randomUUID(),
      title: file.name.replace(/\.[^.]+$/, ""),
      product: file.name,
      screenType: file.type || "Image",
      category: "Uploads",
      thumbnailUrl: await readImageFile(file),
    })));
    onAddScreens(uploadedScreens);
    event.target.value = "";
  }

  return (
    <>
      <PageHeader
        eyebrow="SCREEN LIBRARY"
        title="Find the right pattern."
        description="Search real product screens, then narrow the library by interface category."
        action={<OriginButton size="lg" onClick={() => fileInputRef.current?.click()}><Plus aria-hidden /> Add screen</OriginButton>}
      />
      <input className="sr-only" ref={fileInputRef} accept="image/*" multiple onChange={handleScreenFiles} type="file" />
      <div className="dash2-library-tools">
        <label className="dash2-field dash2-library-search">
          <span className="sr-only">Search the screen library</span><Search aria-hidden />
          <input value={libraryQuery} onChange={(event) => setLibraryQuery(event.target.value)} placeholder="Search products, screens, or patterns" />
        </label>
        <div className="dash2-filter-row" aria-label="Filter screens by category">
          <SlidersHorizontal aria-hidden />
          {categories.map((item) => (
            <button className="dash2-list-control" data-active={category === item} key={item} onClick={() => setCategory(item)} type="button">{item}</button>
          ))}
        </div>
      </div>
      <div className="dash2-results-row"><p>{formatNumber(filteredScreens.length)} screens</p><span>Sorted by relevance</span></div>
      {filteredScreens.length > 0 ? (
        <div className="dash2-library-grid">{filteredScreens.map((screen) => <ScreenCard key={screen.id} screen={screen} />)}</div>
      ) : (
        <div className="dash2-card dash2-empty-state">
          <GalleryVerticalEnd aria-hidden />
          <h2>{screens.length === 0 ? "No screens in your library" : "No matching screens"}</h2>
          <p>{screens.length === 0 ? "Screens you add or retrieve will appear here." : "Try a broader term or choose a different category."}</p>
          {screens.length === 0 ? <button className="dash2-secondary-button" onClick={() => fileInputRef.current?.click()} type="button">Add your first screen</button> : null}
        </div>
      )}
    </>
  );
}

function useAutoResizeTextarea({ minHeight, maxHeight }: { minHeight: number; maxHeight?: number }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`;
      const newHeight = Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight ?? Infinity));
      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight],
  );

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.style.height = `${minHeight}px`;
  }, [minHeight]);

  return { textareaRef, adjustHeight };
}

function GeneratePage({
  accessToken,
  credits,
  onGenerated,
}: {
  accessToken?: string;
  credits: number | null;
  onGenerated: () => void;
}) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const referenceImageInputRef = useRef<HTMLInputElement>(null);
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({ minHeight: 48, maxHeight: 150 });
  const outOfCredits = credits === 0;

  function applyQuickAction(item: (typeof QUICK_ACTIONS)[number]) {
    if (submitting) return;
    setPrompt(item.prompt);
    adjustHeight();
    textareaRef.current?.focus();
  }

  function handleReferenceImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setReferenceImage(file);
  }

  function clearReferenceImage() {
    setReferenceImage(null);
    if (referenceImageInputRef.current) referenceImageInputRef.current.value = "";
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const resolvedPrompt = prompt.trim();
    if (!resolvedPrompt || outOfCredits || submitting) return;

    setSubmitting(true);

    const tempId = crypto.randomUUID();
    const request = generatePage(accessToken, resolvedPrompt, referenceImage ?? undefined).then((result) => {
      window.sessionStorage.setItem(`cobbins-generation-${result.id}`, JSON.stringify(result));
      onGenerated();
      return result;
    });
    registerPendingGeneration(tempId, request);
    router.push(`/generate/${tempId}`);
  }

  return (
    <section className="dash2-hero-generate">
      <div className="dash2-hero-generate-ambient" aria-hidden><i /><i /><i /></div>
      <div className="dash2-hero-generate-glow" aria-hidden />
      <div className="dash2-hero-generate-intro">
        <h1>Cobbins AI</h1>
        <p>Describe the page you want, and Cobbins turns it into real, working code.</p>
      </div>
      <div className="dash2-hero-generate-inputwrap">
        <form className="dash2-hero-generate-box" onSubmit={handleSubmit}>
          <Textarea
            ref={textareaRef}
            value={prompt}
            onChange={(event) => {
              setPrompt(event.target.value);
              adjustHeight();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            disabled={submitting}
            placeholder="What do you want to build?"
            className={cn(
              "w-full resize-none border-none bg-transparent px-4 py-3 text-sm text-foreground",
              "focus-visible:ring-0 focus-visible:ring-offset-0",
              "placeholder:text-muted-foreground min-h-12",
            )}
            style={{ overflow: "hidden" }}
          />
          {submitting ? (
            <p className="dash2-hero-generate-status" role="status">
              <Loader2 aria-hidden className="dash2-spin" />
              Building your page. This usually takes a couple of minutes, so hang tight.
            </p>
          ) : null}
          {referenceImage ? (
            <p className="dash2-hero-generate-attachment">
              <Paperclip aria-hidden />
              <span>{referenceImage.name}</span>
              <button aria-label="Remove reference image" onClick={clearReferenceImage} type="button"><X aria-hidden /></button>
            </p>
          ) : null}
          {outOfCredits ? (
            <p className="dash2-generation-error" role="alert">You're out of credits. Upgrade your plan to keep generating.</p>
          ) : null}
          <div className="flex items-center justify-between p-3">
            <Button
              variant="ghost"
              size="icon"
              type="button"
              disabled={submitting}
              onClick={() => referenceImageInputRef.current?.click()}
              aria-label={referenceImage ? "Change reference image" : "Attach a reference image"}
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <input
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handleReferenceImageChange}
              ref={referenceImageInputRef}
              type="file"
            />
            <Button
              type="submit"
              size="icon"
              disabled={outOfCredits || submitting || !prompt.trim()}
              aria-label={submitting ? "Generating your page" : "Generate interface"}
            >
              {submitting ? <Loader2 aria-hidden className="w-4 h-4 dash2-spin" /> : <ArrowUpIcon aria-hidden className="w-4 h-4" />}
            </Button>
          </div>
        </form>

        <div className="dash2-hero-generate-actions">
          {QUICK_ACTIONS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className="dash2-hero-action-pill"
                disabled={submitting}
                onClick={() => applyQuickAction(item)}
                type="button"
              >
                <Icon aria-hidden className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CollectionsPage({ collections, onCreate }: { collections: CollectionRecord[]; onCreate: (collection: CollectionRecord) => void }) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  function createCollection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const collectionName = name.trim();
    if (!collectionName) return;
    onCreate({ id: crypto.randomUUID(), name: collectionName, count: 0 });
    setName("");
    setCreating(false);
  }

  return (
    <>
      <PageHeader eyebrow="COLLECTIONS" title="Keep useful patterns together." description="Organize saved screens by workflow, product area, or the problem your team is solving." action={<OriginButton size="lg" onClick={() => setCreating(true)}><Plus aria-hidden /> New collection</OriginButton>} />
      {creating ? (
        <form className="dash2-card dash2-inline-create" onSubmit={createCollection}>
          <label className="dash2-field"><span>Collection name</span><input autoFocus onChange={(event) => setName(event.target.value)} placeholder="Name this collection" required value={name} /></label>
          <div><button className="dash2-secondary-button" onClick={() => setCreating(false)} type="button">Cancel</button><OriginButton type="submit">Create collection</OriginButton></div>
        </form>
      ) : null}
      {collections.length > 0 ? <div className="dash2-collection-grid">
        {collections.map((collection) => (
          <article className="dash2-card dash2-interactive-card dash2-collection-card" key={collection.name} tabIndex={0}>
            <div className="dash2-folder-icon"><Folder aria-hidden /></div>
            <div><strong>{collection.name}</strong><span>{formatNumber(collection.count)} screens</span></div>
            <ArrowUpRight aria-hidden />
          </article>
        ))}
      </div> : (
        <div className="dash2-card dash2-empty-state">
          <FolderHeart aria-hidden />
          <h2>No collections yet</h2>
          <p>Collections you create will appear here.</p>
          <button className="dash2-secondary-button" onClick={() => setCreating(true)} type="button">Create your first collection</button>
        </div>
      )}
    </>
  );
}

function SettingsForm() {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [name, setName] = useState(session?.user?.name ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(session?.user?.image ?? null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const email = session?.user?.email ?? "";
  const initials = (name || email).split(/[ @]/).filter(Boolean).map((word) => word[0]).join("").slice(0, 2).toUpperCase();

  useEffect(() => {
    setName(session?.user?.name ?? "");
    setAvatarPreview(session?.user?.image ?? null);
  }, [session?.user?.name, session?.user?.image]);

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setSaving(true);
    setError(null);
    try {
      const result = await updateProfile(accessToken, trimmedName, avatarFile ?? undefined);
      setName(result.name);
      setAvatarPreview(result.image);
      setAvatarFile(null);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save your profile. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="dash2-settings-form" id="dashboard-settings-form" onSubmit={handleSubmit}>
      <section className="dash2-settings-section">
        <div className="dash2-settings-heading"><User aria-hidden /><div><h2>Profile</h2><p>Your personal information and display name.</p></div></div>
        {name || email ? (
          <div className="dash2-profile-row">
            {avatarPreview ? (
              <span className="dash2-avatar-preview" style={{ backgroundImage: `url(${JSON.stringify(avatarPreview)})` }} />
            ) : (
              <span>{initials}</span>
            )}
            <div><strong>{name || email}</strong>{email ? <small>{email}</small> : null}</div>
            <button className="dash2-secondary-button" onClick={() => avatarInputRef.current?.click()} type="button">Change avatar</button>
            <input accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleAvatarChange} ref={avatarInputRef} type="file" />
          </div>
        ) : <div className="dash2-settings-empty"><User aria-hidden /><div><strong>No signed-in profile</strong><span>Sign in to load your profile details.</span></div></div>}
        <label className="dash2-field"><span>Display name</span><input onChange={(event) => setName(event.target.value)} placeholder="Your display name" value={name} /></label>
        <label className="dash2-field"><span>Email address</span><input defaultValue={email} disabled name="email" placeholder="No email available" type="email" /></label>
        {error ? <p className="dash2-generation-error" role="alert">{error}</p> : null}
      </section>
      <section className="dash2-settings-section" id="billing">
        <div className="dash2-settings-heading"><CreditCard aria-hidden /><div><h2>Billing</h2><p>Your plan and payment details.</p></div></div>
        <div className="dash2-settings-empty"><CreditCard aria-hidden /><div><strong>No billing plan connected</strong><span>Plan details will appear here after billing is configured.</span></div></div>
      </section>
      <section className="dash2-settings-section" id="account">
        <div className="dash2-settings-heading"><LogOut aria-hidden /><div><h2>Account</h2><p>Sign out of Cobbins on this device.</p></div></div>
        <button className="dash2-secondary-button" onClick={() => setConfirmingLogout(true)} type="button">Log out</button>
      </section>
      <p className="dash2-settings-saved" aria-live="polite" data-visible={saved}><Check aria-hidden /> Changes saved</p>
      {confirmingLogout ? (
        <div className="dash2-confirm-overlay" role="alertdialog" aria-modal="true" aria-labelledby="logout-confirm-title">
          <div className="dash2-confirm-dialog">
            <h2 id="logout-confirm-title">Log out of Cobbins?</h2>
            <p>You&apos;ll need to sign in again to access your dashboard and generations.</p>
            <div className="dash2-confirm-actions">
              <button className="dash2-secondary-button" onClick={() => setConfirmingLogout(false)} type="button">Cancel</button>
              <button className="dash2-confirm-danger" onClick={() => signOut({ callbackUrl: "/login" })} type="button">Log out</button>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}

function SettingsPage() {
  return (
    <>
      <PageHeader eyebrow="SETTINGS" title="Manage your account." description="Update your profile and billing from one consistent form." action={<OriginButton form="dashboard-settings-form" size="lg" type="submit">Save changes</OriginButton>} />
      <SettingsForm />
    </>
  );
}

function PricingModal({ onClose }: { onClose: () => void }) {
  const [redirectingPlan, setRedirectingPlan] = useState<string | null>(null);

  function handleChoosePlan(plan: (typeof pricingPlans)[number]) {
    setRedirectingPlan(plan.name);
    window.location.href = `${POLAR_CHECKOUT_URL}?product_id=${plan.productId}`;
  }

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="dash2-pricing-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }} role="presentation">
      <section aria-labelledby="pricing-title" aria-modal="true" className="dash2-pricing-dialog" role="dialog">
        <button aria-label="Close pricing" className="dash2-pricing-close" onClick={onClose} type="button"><X aria-hidden /></button>
        <div className="dash2-pricing-intro">
          <p className="dash2-eyebrow">CREDIT PACKS</p>
          <h2 id="pricing-title">Top up and keep building.</h2>
          <p>One-time credit packs, no subscription. Bigger packs cost less per credit.</p>
        </div>
        <div className="dash2-pricing-grid">
          {pricingPlans.map((plan) => (
            <article className="dash2-pricing-card" data-featured={plan.featured ?? false} key={plan.name}>
              {plan.featured ? <span className="dash2-pricing-badge"><Sparkles aria-hidden /> Best value</span> : null}
              <div className="dash2-pricing-card-heading"><h3>{plan.name}</h3><p>{plan.description}</p></div>
              <div className="dash2-pricing-price"><strong>{plan.price}</strong><span>{plan.credits} credits</span></div>
              <ul>{plan.features.map((feature) => <li key={feature}><Check aria-hidden /> {feature}</li>)}</ul>
              <button disabled={redirectingPlan !== null} onClick={() => handleChoosePlan(plan)} type="button">
                {redirectingPlan === plan.name ? "Redirecting…" : `Get ${plan.name}`}
              </button>
            </article>
          ))}
        </div>
        <p className="dash2-pricing-note">Credits never expire. Buy another pack any time you run low.</p>
      </section>
    </div>
  );
}

export function DashboardWorkspace({ initialView = "overview" }: { initialView?: DashboardView }) {
  const { data: session, update: updateSession } = useSession();
  const accessToken = session?.accessToken;
  const [active, setActive] = useState<PageId>(initialView);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [libraryScreens, setLibraryScreens] = useState<ScreenRecord[]>([]);
  const [collections, setCollections] = useState<CollectionRecord[]>([]);
  const [credits, setCredits] = useState<number | null>(null);
  const accountLabel = session?.user?.name ?? session?.user?.email?.split("@")[0] ?? "Account";
  const accountDetail = session?.user?.email ?? "Not signed in";
  const initials = accountLabel.split(/[ @]/).filter(Boolean).map((word) => word[0]).join("").slice(0, 2).toUpperCase();

  const refreshCredits = useCallback(async () => {
    if (!accessToken) return;
    try {
      const result = await getCredits(accessToken);
      setCredits(result.credits);
    } catch {
      // Non-critical: leave the previous value displayed.
    }
  }, [accessToken]);

  useEffect(() => {
    refreshCredits();
  }, [refreshCredits]);

  // Self-heal: a session can end up without a backend access token if the
  // token exchange hiccuped on first sign-in (e.g. the backend was briefly
  // unreachable). Nothing else would ever retry that on its own, so while
  // we're missing a token, periodically ask NextAuth to re-check the
  // session — that re-runs the server-side exchange, and once it succeeds
  // accessToken updates and credits load normally.
  useEffect(() => {
    if (accessToken) return;
    const timer = window.setInterval(() => { void updateSession(); }, 5000);
    return () => window.clearInterval(timer);
  }, [accessToken, updateSession]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const storedScreens = JSON.parse(window.sessionStorage.getItem("cobbins-library-screens") ?? "[]") as ScreenRecord[];
        const storedCollections = JSON.parse(window.sessionStorage.getItem("cobbins-collections") ?? "[]") as CollectionRecord[];
        setLibraryScreens(storedScreens.filter((screen) => screen?.id && screen?.thumbnailUrl));
        setCollections(storedCollections.filter((collection) => collection?.id && collection?.name));
      } catch {
        window.sessionStorage.removeItem("cobbins-library-screens");
        window.sessionStorage.removeItem("cobbins-collections");
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function addScreens(newScreens: ScreenRecord[]) {
    setLibraryScreens((current) => {
      const next = [...newScreens, ...current];
      window.sessionStorage.setItem("cobbins-library-screens", JSON.stringify(next));
      return next;
    });
  }

  function addCollection(collection: CollectionRecord) {
    setCollections((current) => {
      const next = [collection, ...current];
      window.sessionStorage.setItem("cobbins-collections", JSON.stringify(next));
      return next;
    });
  }

  function selectNavigation(id: PageId) {
    setActive(id);
    setMobileOpen(false);
    window.history.replaceState(null, "", id === "overview" ? "/dashboard" : `/dashboard?view=${id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openUpgrade() {
    setMobileOpen(false);
    setPricingOpen(true);
  }

  return (
    <main className="dash2-shell">
      <div className="dash2-topbar-fixed">
        <button className="dash2-upgrade-pill" onClick={openUpgrade} type="button" title="Remaining generation credits">
          <SquareRotatedAsteriskIcon aria-hidden size={16} />
          <span>Upgrade</span>
          <span className="dash2-upgrade-pill-count" data-empty={credits === 0} data-loading={credits === null}>
            {credits === null ? "" : `${formatNumber(credits)} free`}
          </span>
        </button>
        <ThemeToggle />
      </div>
      <button aria-label="Close navigation" className="dash2-backdrop" data-open={mobileOpen} onClick={() => setMobileOpen(false)} type="button" />
      <div className="dash2-hover-scrim" aria-hidden />
      <aside className="dash2-sidebar" data-open={mobileOpen}>
        <div className="dash2-sidebar-head"><CobbinsLogo /><div className="dash2-sidebar-controls"><button className="dash2-mobile-close" onClick={() => setMobileOpen(false)} type="button" aria-label="Close navigation"><X aria-hidden /></button></div></div>
        <nav className="dash2-nav" aria-label="Dashboard navigation">
          {navigation.map((item) => { const Icon = item.icon; const isActive = active === item.id || (item.id === "overview" && active === "generate"); return <button data-active={isActive} key={item.id} onClick={(event) => { selectNavigation(item.id); event.currentTarget.blur(); }} type="button"><Icon aria-hidden /><span>{item.label}</span></button>; })}
        </nav>
        <div className="dash2-sidebar-foot"><span className="dash2-user">{initials}</span><div><strong>{accountLabel}</strong><small>{accountDetail}</small></div></div>
      </aside>
      <section className="dash2-main">
        <button className="dash2-menu dash2-menu-floating" onClick={() => setMobileOpen(true)} type="button" aria-label="Open navigation"><Menu aria-hidden /></button>
        <div className="dash2-content" data-page={active}>
          {(active === "overview" || active === "generate") && (
            <GeneratePage
              accessToken={accessToken}
              credits={credits}
              onGenerated={refreshCredits}
            />
          )}
          {active === "library" && <LibraryPage screens={libraryScreens} onAddScreens={addScreens} />}
          {active === "collections" && <CollectionsPage collections={collections} onCreate={addCollection} />}
          {active === "settings" && <SettingsPage />}
        </div>
      </section>
      {pricingOpen ? <PricingModal onClose={() => setPricingOpen(false)} /> : null}
    </main>
  );
}
