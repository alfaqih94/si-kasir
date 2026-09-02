"use client";

import Link from "next/link";
import { Coffee, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          {/* Logo & Info Singkat */}
          <div className="flex items-center gap-2 text-slate-800">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
              <Coffee className="h-4 w-4" />
            </div>
            <span className="font-bold tracking-tight text-slate-900">
              TopTea POS
            </span>
            <span className="text-xs text-slate-400">v1.0</span>
          </div>

          {/* Copyright & Credit */}
          <div className="flex flex-col items-center gap-1 text-center text-xs text-slate-500 sm:items-end sm:text-right">
            <p className="flex items-center gap-1">
              Dibuat dengan{" "}
              <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" /> untuk
              sistem manajemen TopTea.
            </p>
            <p>© {new Date().getFullYear()} TopTea. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
