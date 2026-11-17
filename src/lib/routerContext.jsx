"use client";

import React, { createContext, useContext, useCallback } from 'react';
import { usePathname, useRouter as useNextRouter } from 'next/navigation';

const RouterContext = createContext(null);

export function RouterProvider({ children }) {
  const currentPath = usePathname() || '/';
  const nextRouter = useNextRouter();

  const navigate = useCallback((path) => {
    if (path !== currentPath) {
      nextRouter.push(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPath, nextRouter]);

  // Route matching helpers
  const parseRoute = () => {
    const parts = currentPath.split('/').filter(Boolean); // e.g. ['dashboard', 'inventory', 'ast-01']
    const section = parts[1] || 'home'; // home, inventory, networks, vlans, switches, rooms, activity, settings
    const subId = parts[2] || null; // e.g. 'new' or 'ast-01'
    const isNew = subId === 'new';
    const isEdit = parts[3] === 'edit';
    const id = isNew ? null : subId;

    return {
      pathname: currentPath,
      section,
      id,
      isNew,
      isEdit
    };
  };

  const routeInfo = parseRoute();

  return (
    <RouterContext.Provider value={{ currentPath, navigate, routeInfo }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) {
    throw new Error('useRouter must be used within RouterProvider');
  }
  return ctx;
}

/**
 * Reusable Link component conforming to Next.js App Router conventions
 */
export function Link({ href, to, children, className = '', ...props }) {
  const { navigate, currentPath } = useRouter();
  const target = href || to;
  const isActive = currentPath === target;

  const handleClick = (e) => {
    if (props.onClick) {
      props.onClick(e);
    }
    if (!e.defaultPrevented && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      navigate(target);
    }
  };

  return (
    <a
      href={target}
      onClick={handleClick}
      className={typeof className === 'function' ? className({ isActive }) : className}
      {...props}
    >
      {children}
    </a>
  );
}
