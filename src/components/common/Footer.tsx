import Link from 'next/link';

export const Footer = ({ isAdmin = false }: { isAdmin?: boolean }) => {
  return (
    <footer className="border-t-2 border-border py-4 sm:py-6 mt-6 sm:mt-8">
      <div className="container flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4 text-text-muted text-xs sm:text-sm">
        <div>
          © 2026 Gayathri Homely Delights · {isAdmin ? 'Admin' : 'Made with '}
          {!isAdmin && <i className="fas fa-heart text-[#b45f3a]"></i>}
          {!isAdmin && ' handmade with love'}
        </div>
        {!isAdmin && (
          <div className="flex gap-4 text-lg sm:text-xl">
            <i className="fab fa-instagram hover:text-primary transition-colors cursor-pointer"></i>
            <i className="fab fa-facebook hover:text-primary transition-colors cursor-pointer"></i>
            <i className="fab fa-pinterest hover:text-primary transition-colors cursor-pointer"></i>
          </div>
        )}
        {isAdmin && (
          <Link href="/" className="hover:text-primary transition-colors">
            <i className="fas fa-store mr-1"></i> Store
          </Link>
        )}
      </div>
    </footer>
  );
};