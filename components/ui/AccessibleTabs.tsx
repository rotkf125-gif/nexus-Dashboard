'use client';

import { useRef, useEffect, ReactNode } from 'react';
import { useTabNavigation } from '@/lib/hooks/useKeyboardNavigation';

interface TabItem {
  id: string;
  label: string;
  icon?: string;
  color?: string;
}

interface AccessibleTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  orientation?: 'horizontal' | 'vertical';
  children: ReactNode;
  className?: string;
  tabListClassName?: string;
  tabClassName?: string;
  panelClassName?: string;
}

export function AccessibleTabs({
  tabs,
  activeTab,
  onTabChange,
  orientation = 'horizontal',
  children,
  className = '',
  tabListClassName = '',
  tabClassName = '',
  panelClassName = '',
}: AccessibleTabsProps) {
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const tabIds = tabs.map(t => t.id);

  const { handleKeyDown } = useTabNavigation(
    tabIds,
    activeTab,
    onTabChange,
    orientation
  );

  useEffect(() => {
    const activeButton = tabRefs.current.get(activeTab);
    if (activeButton) {
      activeButton.focus();
    }
  }, [activeTab]);

  const setTabRef = (id: string, el: HTMLButtonElement | null) => {
    if (el) {
      tabRefs.current.set(id, el);
    } else {
      tabRefs.current.delete(id);
    }
  };

  return (
    <div className={`accessible-tabs ${className}`}>
      {/* Tab List */}
      <div
        role="tablist"
        aria-orientation={orientation}
        aria-label="탭 네비게이션"
        className={`
          flex ${orientation === 'vertical' ? 'flex-col' : 'flex-row'}
          ${tabListClassName}
        `}
        onKeyDown={handleKeyDown}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const colorStyle = tab.color ? { color: isActive ? tab.color : undefined } : {};

          return (
            <button
              key={tab.id}
              ref={(el) => setTabRef(tab.id, el)}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
              className={`
                tab-button flex items-center justify-center gap-2 px-4 py-3
                transition-all duration-300 focus-visible-ring
                ${isActive
                  ? 'border-current bg-current/10'
                  : 'text-white/70 hover:text-white/90 hover:bg-white/5'
                }
                ${orientation === 'vertical'
                  ? `border-l-[3px] ${isActive ? '' : 'border-l-transparent'}`
                  : `border-b-[3px] ${isActive ? '' : 'border-b-transparent'}`
                }
                ${tabClassName}
              `}
              style={colorStyle}
            >
              {tab.icon && (
                <i className={`${tab.icon} text-xs`} aria-hidden="true" />
              )}
              <span className="text-sm font-medium tracking-wide">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={activeTab !== tab.id}
          tabIndex={0}
          className={`
            ${activeTab === tab.id ? 'tab-panel-enter' : ''}
            ${panelClassName}
          `}
        >
          {activeTab === tab.id && children}
        </div>
      ))}
    </div>
  );
}

export default AccessibleTabs;
