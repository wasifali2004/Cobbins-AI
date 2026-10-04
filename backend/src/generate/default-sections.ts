// Minimal, dependency-free fallback sections used when retrieval finds no
// good match for a planned category (e.g. the library has no "footer" yet).
// Each is plain Tailwind + React so it renders standalone, and still goes
// through the same text/theme adaptation pass as retrieved components.

export const DEFAULT_SECTION_TEMPLATES: Record<string, string> = {
  hero: `export default function Hero() {
  return (
    <section className="w-full py-24 px-6 text-center">
      <h1 className="text-5xl font-bold tracking-tight">Your headline goes here</h1>
      <p className="mt-4 text-lg text-gray-600 max-w-xl mx-auto">A short supporting sentence about what you offer.</p>
      <button className="mt-8 px-6 py-3 rounded-md bg-black text-white font-medium">Get started</button>
    </section>
  );
}`,
  features: `export default function Features() {
  const items = [
    { title: "Feature one", description: "A short description of this feature." },
    { title: "Feature two", description: "A short description of this feature." },
    { title: "Feature three", description: "A short description of this feature." },
  ];
  return (
    <section className="w-full py-20 px-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {items.map((item) => (
          <div key={item.title} className="text-center">
            <h3 className="text-xl font-semibold">{item.title}</h3>
            <p className="mt-2 text-gray-600">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}`,
  testimonial: `export default function Testimonial() {
  return (
    <section className="w-full py-20 px-6 text-center">
      <blockquote className="max-w-2xl mx-auto text-xl italic text-gray-700">
        "This product changed the way we work."
      </blockquote>
      <p className="mt-4 font-medium">Customer Name, Company</p>
    </section>
  );
}`,
  pricing: `export default function Pricing() {
  const plans = [
    { name: "Basic", price: "$9/mo", features: ["Feature A", "Feature B"] },
    { name: "Pro", price: "$29/mo", features: ["Feature A", "Feature B", "Feature C"] },
  ];
  return (
    <section className="w-full py-20 px-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {plans.map((plan) => (
          <div key={plan.name} className="border rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold">{plan.name}</h3>
            <p className="text-3xl font-bold mt-2">{plan.price}</p>
            <ul className="mt-4 space-y-2 text-gray-600">
              {plan.features.map((f) => <li key={f}>{f}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}`,
  footer: `export default function Footer() {
  return (
    <footer className="w-full py-10 px-6 border-t text-center text-sm text-gray-500">
      <p>&copy; {new Date().getFullYear()} Your Company. All rights reserved.</p>
    </footer>
  );
}`,
  cta: `export default function Cta() {
  return (
    <section className="w-full py-20 px-6 text-center bg-black text-white">
      <h2 className="text-3xl font-bold">Ready to get started?</h2>
      <button className="mt-6 px-6 py-3 rounded-md bg-white text-black font-medium">Sign up now</button>
    </section>
  );
}`,
  navbar: `export default function Navbar() {
  return (
    <nav className="w-full flex items-center justify-between px-6 py-4 border-b">
      <span className="font-bold text-lg">Brand</span>
      <div className="flex gap-6 text-sm text-gray-600">
        <a href="#">Features</a>
        <a href="#">Pricing</a>
        <a href="#">Contact</a>
      </div>
    </nav>
  );
}`,
};
