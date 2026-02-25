"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

function HomeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6.5L8 2l6 4.5V13a1 1 0 01-1 1H3a1 1 0 01-1-1V6.5z" />
      <path d="M6 14V9h4v5" />
    </svg>
  );
}

function SchemaIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="5" height="5" rx="1" />
      <rect x="9" y="9" width="5" height="5" rx="1" />
      <path d="M7 4.5h2.5V9" />
    </svg>
  );
}

function SqlIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4,12 2,10 4,8" />
      <polyline points="12,12 14,10 12,8" />
      <line x1="6" y1="14" x2="10" y2="6" />
    </svg>
  );
}

function CollectionIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4l6-2 6 2v8l-6 2-6-2V4z" />
      <path d="M2 4l6 2 6-2" />
      <line x1="8" y1="6" x2="8" y2="14" />
    </svg>
  );
}

function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: collapsed ? "rotate(180deg)" : "none", transition: "transform 0.25s" }}>
      <polyline points="10,3 5,8 10,13" />
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/collection/root", icon: <HomeIcon /> },
  { label: "Schema", href: "/schema", icon: <SchemaIcon /> },
  { label: "SQL Query", href: "/sql", icon: <SqlIcon /> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("hyperbase-sidebar-collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("hyperbase-sidebar-collapsed", String(next));
  };

  return (
    <aside className="sidebar flex flex-col bg-background" data-collapsed={collapsed}>
      {/* Logo + Collapse */}
      <div className={`border-b border-border ${collapsed ? "flex flex-col items-center gap-2 px-2 py-3" : "flex items-center justify-between px-3 py-4"}`}>
        <div className={`flex items-center gap-3 min-w-0 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-accent">
            <svg width="36" height="36" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9a12 12 0 0 1 20 0" opacity="0.3" />
              <path d="M9.5 12.5a8 8 0 0 1 13 0" opacity="0.6" />
              <path d="M12.5 15.5a4.5 4.5 0 0 1 7 0" opacity="0.9" />
              <circle cx="16" cy="18" r="2" fill="currentColor" strokeWidth="0" />
              <path d="M16 20L13 30h6L16 20z" />
              <line x1="14" y1="26.5" x2="18" y2="26.5" strokeWidth="1.5" />
            </svg>
          </div>
          {!collapsed && (
            <span className="font-mono text-sm font-semibold tracking-wide uppercase whitespace-nowrap">
              Hyperbase
            </span>
          )}
        </div>
        {mounted && (
          <button
            onClick={toggleCollapse}
            className="w-7 h-7 rounded-md flex items-center justify-center text-foreground-light hover:text-foreground hover:bg-grid transition-colors shrink-0"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <CollapseIcon collapsed={collapsed} />
          </button>
        )}
      </div>

      {/* New button */}
      <div className={`px-3 pt-3 pb-2 relative ${collapsed ? "flex justify-center" : ""}`}>
        <button
          onClick={() => setNewMenuOpen(!newMenuOpen)}
          className={`btn-primary text-sm h-9 ${collapsed ? "w-9 px-0" : "w-full"}`}
        >
          {collapsed ? "+" : "+ New"}
        </button>
        {newMenuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setNewMenuOpen(false)} />
            <div className={`absolute top-full mt-1 bg-background rounded-lg shadow-lg z-50 border border-border overflow-hidden ${collapsed ? "left-3 w-48" : "left-3 right-3"}`}>
              <Link
                href="/question/new"
                onClick={() => setNewMenuOpen(false)}
                className="block px-4 py-2.5 text-sm hover:bg-grid transition-colors"
              >
                New Question
              </Link>
              <Link
                href="/sql"
                onClick={() => setNewMenuOpen(false)}
                className="block px-4 py-2.5 text-sm hover:bg-grid transition-colors"
              >
                New SQL Query
              </Link>
              <Link
                href="/dashboard/new"
                onClick={() => setNewMenuOpen(false)}
                className="block px-4 py-2.5 text-sm hover:bg-grid transition-colors"
              >
                New Dashboard
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Navigation — pinned, never scrolls */}
      <nav className="px-2 pt-2 pb-1 space-y-0.5 shrink-0">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "nav-active font-medium"
                  : "text-foreground-medium hover:bg-grid hover:text-foreground"
              } ${collapsed ? "justify-center px-0" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <span className="w-5 flex items-center justify-center shrink-0 opacity-75">{item.icon}</span>
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className={`flex items-center gap-2 shrink-0 ${collapsed ? "px-3 py-2" : "px-4 py-2"}`}>
        <div className="flex-1 h-px bg-border" />
        {!collapsed && <span className="text-[10px] text-foreground-light/50 font-mono uppercase tracking-wider">Collections</span>}
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Collections — scrollable */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
        {!collapsed && (
          <Link
            href="/collection/root"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              pathname === "/collection/root"
                ? "nav-active font-medium"
                : "text-foreground-medium hover:bg-grid hover:text-foreground"
            }`}
          >
            <span className="w-5 flex items-center justify-center shrink-0 opacity-75"><CollectionIcon /></span>
            Our analytics
          </Link>
        )}
        {collapsed && (
          <Link
            href="/collection/root"
            className={`flex items-center justify-center py-2 rounded-lg text-sm transition-colors ${
              pathname === "/collection/root"
                ? "nav-active font-medium"
                : "text-foreground-medium hover:bg-grid hover:text-foreground"
            }`}
            title="Collections"
          >
            <span className="w-5 flex items-center justify-center opacity-75"><CollectionIcon /></span>
          </Link>
        )}
      </div>

      {/* Theme toggle */}
      <div className={`py-4 border-t border-border ${collapsed ? "px-2 flex justify-center" : "px-4"}`}>
        <ThemeToggle collapsed={collapsed} />
      </div>
    </aside>
  );
}

function ThemeToggle({ collapsed }: { collapsed: boolean }) {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const current = document.documentElement.getAttribute("data-theme");
    setIsDark(current !== "light");
  }, []);

  const toggle = () => {
    const next = isDark ? "light" : "dark";
    setIsDark(!isDark);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("hyperbase-theme", next);
  };

  if (!mounted) {
    return <div className="h-7" />;
  }

  return (
    <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
      {!collapsed && (
        <span className="text-xs text-foreground-light font-mono uppercase">
          {isDark ? "Dark" : "Light"}
        </span>
      )}
      <button
        onClick={toggle}
        className="theme-toggle"
        aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      >
        <div className="theme-toggle-thumb">
          {isDark ? (
            <svg className="theme-toggle-icon" viewBox="0 0 20 20" fill="currentColor">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          ) : (
            <svg className="theme-toggle-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </button>
    </div>
  );
}
