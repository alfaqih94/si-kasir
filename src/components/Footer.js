"use client";

export default function Footer() {
  return (
    <footer className="mt-auto w-full py-2 bg-white/80 backdrop-blur-md border-t border-slate-200">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-1 px-6 text-[11px] text-slate-500 font-medium">
        <p>
          © 2026 <span className="font-bold text-slate-700">Top-Top Tea</span>.
          All rights reserved.
        </p>
        <p className="flex items-center gap-1">
          Made with ❤️ by{" "}
          <span className="font-semibold text-slate-700">Alfaqih_94</span>
        </p>
      </div>
    </footer>
  );
}
