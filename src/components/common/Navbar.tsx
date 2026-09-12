'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';

interface NavbarProps {
  isAdmin?: boolean;
}

// Define type for nav links
interface NavLink {
  href: string;
  label: string;
  icon?: string;
}

export const Navbar = ({ isAdmin = false }: NavbarProps) => {
  const pathname = usePathname();
  const { getTotalItems } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks: NavLink[] = isAdmin
    ? [
        { href: '/admin', label: 'Dashboard', icon: 'fa-chart-pie' },
        { href: '/admin/rush', label: 'Rush', icon: 'fa-bolt' },
        { href: '/admin/products', label: 'Products', icon: 'fa-utensils' },
        { href: '/admin/categories', label: 'Categories', icon: 'fa-tags' },
        { href: '/admin/delivery', label: 'Delivery', icon: 'fa-truck' },
        { href: '/admin/orders', label: 'Orders', icon: 'fa-box' },
      ]
    : [
        { href: '/', label: 'Home' },
        { href: '/#offers', label: 'Offers' },
      ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href.includes('#')) return false;
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b-2 border-border">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        <div className="flex items-center justify-between py-3 sm:py-4">
          <Link href={isAdmin ? '/admin' : '/'} className="flex items-center gap-2 flex-shrink-0">
            <i className="fas fa-home text-primary-light text-lg sm:text-xl"></i>
            <span className="text-lg sm:text-xl md:text-2xl font-bold text-primary whitespace-nowrap">
              Gayathri
              <span className="font-light text-[#4f3b2c] text-sm sm:text-base md:text-lg">Homely</span>
              <span className="font-light text-[#4f3b2c] text-sm sm:text-base md:text-lg">Delights</span>
            </span>
          </Link>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-2xl p-1 hover:bg-border-light rounded-lg transition-colors"
          >
            <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>

          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm lg:text-base transition-all duration-300 ${
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

          {isAdmin ? (
            <Link
              href="/"
              className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-white text-primary text-sm transition-all duration-300 hover:bg-primary hover:text-white hover:border-primary"
            >
              <i className="fas fa-store"></i>
              Store
            </Link>
          ) : (
            <div
              className="relative cursor-pointer text-xl sm:text-2xl hover:text-primary transition-colors duration-300 flex-shrink-0 cart-trigger"
            >
              <i className="fas fa-shopping-bag"></i>
              {getTotalItems() > 0 && (
                <span className="absolute -top-2 -right-3 bg-primary text-white text-[10px] sm:text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {getTotalItems()}
                </span>
              )}
            </div>
          )}
        </div>

        {isMobileMenuOpen && (
          <nav className="md:hidden pb-3 flex flex-col gap-1 border-t border-border pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-4 py-2.5 rounded-lg text-base transition-all duration-300 ${
                  isActive(link.href)
                    ? 'bg-primary text-white'
                    : 'hover:bg-border-light hover:text-primary'
                }`}
              >
                {link.icon && <i className={`fas ${link.icon} mr-2`}></i>}
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-4 py-2.5 rounded-lg text-base transition-all duration-300 hover:bg-border-light hover:text-primary"
              >
                <i className="fas fa-store mr-2"></i>
                Store
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};