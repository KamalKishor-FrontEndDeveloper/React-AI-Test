import * as React from "react";

export function Popover({ children }: { children: React.ReactNode }) {
  return <div className="relative inline-block">{children}</div>;
}

export function PopoverTrigger({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

export function PopoverContent({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      role="menu"
      className={"absolute mt-2 rounded-lg border shadow-2xl p-2 z-50 " + className}
    >
      <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
        {children}
      </div>
    </div>
  );
}
