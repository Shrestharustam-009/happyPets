"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useCart } from "@/lib/cart-context"

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { getCartItemCount } = useCart()
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsUserLoggedIn(!!localStorage.getItem("authToken"));
      try {
        const userRaw = localStorage.getItem("user");
        if (userRaw) {
          const user = JSON.parse(userRaw);
          setUserRole(user.role);
        } else {
          setUserRole("");
        }
      } catch(e) {
        setUserRole("");
      }
    }
  }, [])

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/blog", label: "Blog" },
    { href: "/shop", label: "Shop" },
    { href: "/about", label: "About" },
    { href: "/appointments", label: "Appointments" },
  ]

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-background border-b border-border">
      <div className="container-custom py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="relative w-10 h-10 rounded-lg overflow-hidden shadow-md">
              <Image 
                src="/logo.png" 
                alt="Happypets logo" 
                fill 
                className="object-contain" 
                priority 
                quality={100}
                sizes="40px"
              />
            </div>
            <span className="text-2xl font-bold text-sky-800 hidden sm:inline">Happypets</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-foreground hover:text-accent transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
            <Link href="/cart" className="relative flex items-center ml-2">
              <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61l1.38-7.39H6"/></svg>
              {getCartItemCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">{getCartItemCount()}</span>
              )}
            </Link>
          </nav>

          {/* Auth Links */}
          <div className="hidden md:flex items-center gap-4">
            {isUserLoggedIn ? (
              <div className="relative group">
                <button className="p-2 rounded-full hover:bg-accent transition-colors">
                  <svg className="w-7 h-7 text-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-2.5 3.5-5 8-5s8 2.5 8 5" />
                  </svg>
                </button>
                <div className="hidden group-hover:block absolute right-0 mt-2 w-40 bg-white border border-border rounded-lg shadow-lg text-sm z-10">
                  <a href="/dashboard" className="block px-4 py-2 hover:bg-accent/20">Dashboard</a>
                  <button onClick={() => { localStorage.removeItem('authToken'); localStorage.removeItem('user'); window.location.reload(); }} className="block w-full text-left px-4 py-2 hover:bg-accent/20">Logout</button>
                </div>
              </div>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 text-blue-700 hover:text-blue-600 transition-colors font-medium">Login</Link>
                <Link href="/register" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all font-medium shadow-md">Register</Link>
              </>
            )}
            {userRole === 'admin' && (
              <Link href="/admin/login" className="px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">Admin</Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 hover:bg-muted rounded-md transition-colors"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden mt-4 flex flex-col gap-3 pb-4 border-t border-border pt-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-foreground hover:bg-muted rounded-md transition-colors"
                onClick={closeMobileMenu}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/cart" className="relative flex items-center mt-2">
              <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61l1.38-7.39H6"/></svg>
              {getCartItemCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">{getCartItemCount()}</span>
              )}
            </Link>
            <div className="flex flex-col gap-2 px-4 pt-2 border-t border-border">
              {isUserLoggedIn ? (
                <div className="flex flex-col gap-2">
                  <a href="/dashboard" className="w-full px-4 py-2 text-center text-sky-700 hover:bg-muted rounded-md transition-colors">Dashboard</a>
                  <button onClick={() => { localStorage.removeItem('authToken'); localStorage.removeItem('user'); window.location.reload(); }} className="w-full px-4 py-2 text-center text-rose-600 hover:bg-muted rounded-md transition-colors">Logout</button>
                </div>
              ) : (
                <>
                  <Link href="/login" className="w-full px-4 py-2 text-center text-sky-700 hover:bg-muted rounded-md transition-colors">Login</Link>
                  <Link href="/register" className="w-full px-4 py-2 text-center bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all shadow-md">Register</Link>
                </>
              )}
            </div>
            {userRole === 'admin' && (
              <Link href="/admin/login" className="w-full px-4 py-2 text-center text-xs text-muted-foreground hover:text-foreground transition-colors">Admin</Link>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}
