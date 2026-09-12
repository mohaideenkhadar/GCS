'use client';

export const Hero = () => {
  return (
    <section className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10 py-6 md:py-10">
      <div className="flex-1 text-center md:text-left">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-text">
          <i className="fas fa-cookie-bite text-primary-light mr-2"></i>
          Sweet &amp; savoury <br className="hidden sm:block" />delights
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-text-muted mt-3 md:mt-4 max-w-lg mx-auto md:mx-0">
          Handcrafted treats baked fresh daily. From buttery shortbread to spicy cheese twists.
        </p>
        <a href="#products" className="btn btn-primary mt-4 md:mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-semibold hover:bg-primary-hover transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:scale-95">
          <i className="fas fa-store"></i> Shop Now
        </a>
      </div>
      <div className="flex-1 max-w-xs sm:max-w-sm md:max-w-md bg-border rounded-[60px_20px_60px_20px] p-4 sm:p-6 md:p-8 text-center shadow-card-lg">
        <i className="fas fa-birthday-cake text-5xl sm:text-6xl md:text-7xl text-primary bg-background p-3 sm:p-4 rounded-full inline-block"></i>
        <h3 className="text-lg sm:text-xl md:text-2xl font-normal text-[#3d2b1e] mt-2">Today&apos;s special</h3>
        <p className="text-sm sm:text-base font-light text-text-muted">Honey &amp; oat slice</p>
        <span className="font-semibold text-primary text-lg sm:text-xl md:text-2xl">₹4.50</span>
      </div>
    </section>
  );
};