import Link from "next/link"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="border-t-[3px] border-black/10 mt-32 bg-white relative">
      <div className="px-[4%] md:px-[10%] py-16">
        <div className="max-w-7xl mx-auto">
          {/* Links */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-8 mb-8">
            <Link
              href="/pricing"
              className="text-gray-600 hover:text-black transition-colors duration-300 text-sm md:text-base font-medium"
            >
              Pricing
            </Link>
            <Link
              href="/about"
              className="text-gray-600 hover:text-black transition-colors duration-300 text-sm md:text-base font-medium"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-gray-600 hover:text-black transition-colors duration-300 text-sm md:text-base font-medium"
            >
              Contact
            </Link>
            <Link
              href="/privacy"
              className="text-gray-600 hover:text-black transition-colors duration-300 text-sm md:text-base font-medium"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-gray-600 hover:text-black transition-colors duration-300 text-sm md:text-base font-medium"
            >
              Terms
            </Link>
          </div>

          {/* Logo and Copyright */}
          <div className="flex flex-col items-center gap-4 pt-8 border-t border-gray-200">
            <Link href="/" className="inline-block group">
              <Image
                src="/Original Logo Symbol.png"
                alt="Quadrants Logo"
                width={60}
                height={60}
                className="w-[60px] h-[60px] object-contain transition-transform duration-500 group-hover:scale-110"
              />
            </Link>
            <p className="text-sm md:text-base font-bold text-black">
              © 2025 Quadrants. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
