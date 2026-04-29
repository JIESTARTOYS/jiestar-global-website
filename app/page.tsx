export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <main className="flex flex-col items-center gap-8 px-6 py-20 text-center">
        {/* Logo / Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white text-2xl font-bold shadow-md">
            J
          </div>
          <span className="text-2xl font-bold text-gray-900 tracking-tight">JIESTAR</span>
        </div>

        {/* Headline */}
        <div className="flex flex-col items-center gap-4 max-w-2xl">
          <h1 className="text-4xl font-bold text-blue-600 leading-tight">
            Welcome to JIESTAR Building Blocks
          </h1>
          <p className="mt-4 text-xl text-gray-600 leading-relaxed">
            Your destination for premium building blocks
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-4 sm:flex-row mt-4">
          <a
            href="#products"
            className="flex h-12 items-center justify-center gap-2 rounded-full bg-blue-600 px-8 text-white font-medium transition-colors hover:bg-blue-700"
          >
            Explore Products
          </a>
          <a
            href="#contact"
            className="flex h-12 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-8 text-gray-700 font-medium transition-colors hover:bg-gray-100"
          >
            Contact Us
          </a>
        </div>

        {/* Footer tagline */}
        <p className="mt-16 text-sm text-gray-400">
          © 2025 JIESTAR. Premium building blocks for creators worldwide.
        </p>
      </main>
    </div>
  );
}
