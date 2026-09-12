interface StatsCardsProps {
  stats: {
    totalOrders: number;
    pendingOrders: number;
    totalRevenue: number;
    totalProducts: number;
    totalCategories: number;
    paidAmount: number;
    unpaidAmount: number;
    pendingAmount: number;
  };
}

export const StatsCards = ({ stats }: StatsCardsProps) => {
  const cards = [
    {
      icon: 'fa-shopping-bag',
      number: stats.totalOrders,
      label: 'Total Orders',
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      icon: 'fa-rupee-sign',
      number: `₹${stats.totalRevenue.toFixed(0)}`,
      label: 'Revenue',
      color: 'text-success',
      bg: 'bg-success/10',
    },
    {
      icon: 'fa-boxes',
      number: stats.totalProducts,
      label: 'Products',
      color: 'text-info',
      bg: 'bg-info/10',
    },
    {
      icon: 'fa-clock',
      number: stats.pendingOrders,
      label: 'Pending Orders',
      color: 'text-warning',
      bg: 'bg-warning/10',
    },
    {
      icon: 'fa-tags',
      number: stats.totalCategories,
      label: 'Categories',
      color: 'text-[#d4a017]',
      bg: 'bg-[#d4a017]/10',
    },
    {
      icon: 'fa-money-bill-wave',
      number: `₹${stats.paidAmount.toFixed(0)}`,
      label: 'Paid Amount',
      color: 'text-success',
      bg: 'bg-success/10',
    },
    {
      icon: 'fa-exclamation-circle',
      number: `₹${stats.unpaidAmount.toFixed(0)}`,
      label: 'Unpaid Amount',
      color: 'text-danger',
      bg: 'bg-danger/10',
    },
    {
      icon: 'fa-hourglass-half',
      number: `₹${stats.pendingAmount.toFixed(0)}`,
      label: 'Pending Amount',
      color: 'text-warning',
      bg: 'bg-warning/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`${card.bg} rounded-2xl p-4 sm:p-5 md:p-6 border border-border/50 shadow-sm hover:shadow-card-lg transition-all duration-300 hover:-translate-y-1`}
        >
          <div className={`text-xl sm:text-2xl md:text-3xl ${card.color} mb-1`}>
            <i className={`fas ${card.icon}`}></i>
          </div>
          <div className="text-lg sm:text-xl md:text-2xl font-bold text-text">
            {card.number}
          </div>
          <div className="text-[10px] sm:text-xs text-text-light font-medium mt-0.5">
            {card.label}
          </div>
        </div>
      ))}
    </div>
  );
};