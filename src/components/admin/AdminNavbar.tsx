'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

// Define type for nav links
interface NavLink {
  href: string;
  label: string;
  icon?: string;
}

const navLinks: NavLink[] = [
  { href: '/admin', label: 'Dashboard', icon: 'fa-chart-pie' },
  { href: '/admin/rush', label: 'Rush', icon: 'fa-bolt' },
  { href: '/admin/orders', label: 'Orders', icon: 'fa-box' },
  { href: '/admin/offers', label: 'Offers', icon: 'fa-bullhorn' },
  { href: '/admin/products', label: 'Products', icon: 'fa-utensils' },
  { href: '/admin/categories', label: 'Categories', icon: 'fa-tags' },
  { href: '/admin/delivery', label: 'Delivery', icon: 'fa-truck' },
  { href: '/admin/stock', label: 'Stock', icon: 'fa-boxes' },
];

export const AdminNavbar = () => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b-2 border-border">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        <div className="flex items-center justify-between py-2 sm:py-3">
          <Link href="/admin" className="flex items-center gap-2 flex-shrink-0">
            <i className="fas fa-home text-primary-light text-lg sm:text-xl"></i>
            <span className="text-base sm:text-lg md:text-xl font-bold text-primary whitespace-nowrap">
              Gayathri
              <span className="font-light text-[#4f3b2c] text-xs sm:text-sm md:text-base">Homely</span>
              <span className="font-light text-[#4f3b2c] text-xs sm:text-sm md:text-base">Delights</span>
            </span>
          </Link>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden text-2xl p-1 hover:bg-border-light rounded-lg transition-colors"
          >
            <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>

          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-300 ${
                  isActive(link.href)
                    ? 'bg-primary text-white'
                    : 'hover:bg-border-light hover:text-primary'
                }`}
              >
                {link.icon && <i className={`fas ${link.icon} mr-1.5 text-xs`}></i>}
                {link.label}
              </Link>
            ))}
          </nav>

          <Link
            href="/"
            className="hidden lg:flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-white text-primary text-sm transition-all duration-300 hover:bg-primary hover:text-white hover:border-primary"
          >
            <i className="fas fa-store"></i>
            Store
          </Link>
        </div>

        {isMobileMenuOpen && (
          <nav className="lg:hidden pb-3 flex flex-col gap-1 border-t border-border pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-4 py-2.5 rounded-lg text-sm transition-all duration-300 ${
                  isActive(link.href)
                    ? 'bg-primary text-white'
                    : 'hover:bg-border-light hover:text-primary'
                }`}
              >
                {link.icon && <i className={`fas ${link.icon} mr-2`}></i>}
                {link.label}
              </Link>
            ))}
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-2.5 rounded-lg text-sm transition-all duration-300 hover:bg-border-light hover:text-primary"
            >
              <i className="fas fa-store mr-2"></i>
              Store
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
};