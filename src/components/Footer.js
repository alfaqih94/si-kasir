"use client";

import Link from "next/link";
import { Coffee, Heart } from "lucide-react";
import Image from "next/image";
import logoImg from "@/components/logo.jpeg";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          {/* Logo & Info Singkat */}
          <div className="flex items-center gap-2 text-slate-800">
            <div className="mx-auto flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-amber-100">
              <Image
                src={logoImg}
                alt="Top-Top Tea Logo"
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            </div>
            <span className="font-bold tracking-tight text-slate-900">
              Top-Top Tea Admin
            </span>
            <span className="text-xs text-slate-400"> versi 1.1</span>
          </div>

          {/* Copyright & Credit */}
          <div className="flex flex-col items-center gap-1 text-center text-xs text-slate-500 sm:items-end sm:text-right">
            <p className="flex items-center gap-1">
              Sistem Manajemen Top-Top Tea, ©2026.
            </p>
            <p>By. Alfaqih Tech</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
