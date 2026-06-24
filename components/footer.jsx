import Link from "next/link"
import Image from "next/image"
import { Facebook, Instagram, Youtube } from "lucide-react"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                <Image 
                  src="/logo-footer.png" 
                  alt="Happypets logo" 
                  fill 
                  className="object-contain" 
                  quality={100}
                  sizes="48px"
                />
              </div>
              <h3 className="text-xl font-bold">Happypets</h3>
            </div>
            <p className="text-sm opacity-80">Your trusted partner in pet healthcare, supplies, and wellness.</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:underline transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/appointments" className="hover:underline transition-colors">
                  Book Appointment
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:underline transition-colors">
                  Shop
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:underline transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>


          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex flex-col gap-2">
                <a href="tel:+9779860872125" className="hover:underline transition-colors">
                  +977 986-0872125
                </a>
                <a href="tel:+9779841853843" className="hover:underline transition-colors">
                  +977 984-1853843
                </a>
              </li>
              <li>
                <a href="mailto:happypetsnepal@gmail.com" className="hover:underline transition-colors">
                  happypetsnepal@gmail.com
                </a>
              </li>
              <li>Imadol, Lalitpur - Nepal</li>
              <li className="opacity-80">Opening Hours: 8 AM - 8 PM</li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-primary-foreground/20 pt-8 flex flex-col md:flex-row justify-between items-center text-sm">
          <p>&copy; {currentYear} Happypets. All rights reserved.</p>
          <p>Powered by <a href="https://www.techsapana.com" target="_blank" className="hover:underline transition-colors" style={{ color: '#53b3a6' }}>TechSapana</a></p>
          <div className="flex gap-6 mt-4 md:mt-0 items-center">
            <a href="/privacy.html" className="hover:underline transition-colors">Privacy Policy</a>
            <a href="/terms.html" className="hover:underline transition-colors">Terms of Service</a>
            <span className="hidden md:inline-block border-l border-primary-foreground/20 h-6 mx-2"></span>
            {/* Social Icons */}
            <div className="flex gap-2 ml-2">
              <a href="https://www.facebook.com/share/1FoLSFGqS8/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="p-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors"><Facebook className="w-4 h-4" /></a>
              <a href="https://tiktok.com/@happypetsanimalclinic" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="p-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg></a>
              <a href="https://www.instagram.com/happypetsnepal?igsh=eG5scnp3OTgxNWMz" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="p-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors"><Instagram className="w-4 h-4" /></a>
              <a href="https://www.youtube.com/@drshresthavet" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="p-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors"><Youtube className="w-4 h-4" /></a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
