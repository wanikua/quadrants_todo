import Link from "next/link"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="mt-32 border-t border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 mb-12">
          {/* Left: Logo */}
          <div className="flex flex-col items-center md:items-start">
            <Link href="/" className="inline-block group">
              <Image
                src="/logo.png"
                alt="Quadrants Logo"
                width={48}
                height={48}
                className="w-12 h-12 object-contain rounded-lg transition-transform duration-500 group-hover:scale-110"
              />
            </Link>
          </div>

          {/* Center: Navigation Links */}
          <div className="flex flex-col items-center gap-3">
            <h3 className="text-sm font-bold text-black mb-2">Quick Links</h3>
            <Link href="/" className="text-sm text-gray-600 hover:text-black transition-colors">
              Home
            </Link>
            <Link href="/pricing" className="text-sm text-gray-600 hover:text-black transition-colors">
              Pricing
            </Link>
            <Link href="/about" className="text-sm text-gray-600 hover:text-black transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-sm text-gray-600 hover:text-black transition-colors">
              Contact
            </Link>
            <a
              href="https://quadrants.firstpromoter.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-600 hover:text-black transition-colors"
            >
              Become an Affiliate
            </a>
          </div>

          {/* Right: Legal Links */}
          <div className="flex flex-col items-center md:items-end gap-3">
            <h3 className="text-sm font-bold text-black mb-2">Legal</h3>
            <Link href="/privacy" className="text-sm text-gray-600 hover:text-black transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-gray-600 hover:text-black transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>

        {/* Bottom: Copyright */}
        <div className="pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm font-medium text-gray-600 text-center md:text-left">
              © 2026 Quadrants. All rights reserved.
            </p>
            <p className="text-sm font-medium text-gray-600">
              Made with ❤️ in Switzerland
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
