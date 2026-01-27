'use client';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  color: string;
}

interface BottomNavigationProps {
  items: NavItem[];
  activeItem: string;
  onItemChange: (id: string) => void;
  className?: string;
}

export function BottomNavigation({
  items,
  activeItem,
  onItemChange,
  className = '',
}: BottomNavigationProps) {
  return (
    <nav
      className={`bottom-nav ${className}`}
      role="navigation"
      aria-label="하단 네비게이션"
    >
      {items.map((item) => {
        const isActive = activeItem === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onItemChange(item.id)}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            style={{
              color: isActive ? item.color : undefined,
            }}
            aria-current={isActive ? 'page' : undefined}
          >
            <i
              className={`${item.icon} text-base mb-1`}
              aria-hidden="true"
            />
            <span className="text-[10px] font-medium tracking-wide">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export const DEFAULT_NAV_ITEMS: NavItem[] = [
  { id: 'stellar', label: 'Stellar', icon: 'fas fa-star', color: '#22d3ee' },
  { id: 'income', label: 'Income', icon: 'fas fa-coins', color: '#ffd700' },
  { id: 'analytics', label: 'Analytics', icon: 'fas fa-shield-alt', color: '#a855f7' },
  { id: 'performance', label: 'Performance', icon: 'fas fa-chart-line', color: '#4ade80' },
  { id: 'simulation', label: 'Simulation', icon: 'fas fa-flask', color: '#f97316' },
];

export default BottomNavigation;
