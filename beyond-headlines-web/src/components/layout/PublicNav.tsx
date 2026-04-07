"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, X, Search, Globe, User, ChevronDown } from "lucide-react";

const CATEGORIES = [
  { name: "Politics", slug: "politics" },
  { name: "Economy", slug: "economy" },
  { name: "Technology", slug: "technology" },
  { name: "Culture", slug: "culture" },
  { name: "Energy", slug: "energy" },
];

export default function PublicNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="border-b border-slate-200 bg-white sticky top-0 z-50">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 border-b border-slate-100 py-2 hidden md:flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
        <div className="flex items-center space-x-6">
          <span className="flex items-center text-red-600">
            <Globe size={12} className="mr-1.5 animate-spin-slow" />
            World Digital Edition
          </span>
          <span>
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
        <div className="flex items-center space-x-6">
          <Link
            href="/login"
            className="hover:text-slate-900 transition flex items-center"
          >
            <User size={12} className="mr-1.5" />
            Editor Login
          </Link>
          <button className="hover:text-slate-900 transition">Subscribe</button>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between py-4 md:py-6">
        <div className="flex items-center">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-slate-500 hover:text-slate-900 transition mr-2"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <Link href="/" className="flex flex-col group">
            <span className="text-2xl md:text-3xl font-black uppercase tracking-[-0.02em] leading-tight text-slate-900 group-hover:text-red-700 transition">
              Beyond<span className="text-red-600">Headlines</span>
            </span>
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 -mt-1 hidden md:block">
              Intelligent Global Narrative
            </span>
          </Link>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-8">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="text-sm font-bold text-slate-600 hover:text-red-600 transition"
            >
              {cat.name}
            </Link>
          ))}
          <div className="h-4 w-px bg-slate-200 mx-2" />
          <button className="p-2 text-slate-400 hover:text-slate-900 transition">
            <Search size={20} />
          </button>
        </div>

        {/* Mobile Action */}
        <div className="md:hidden">
          <Link href="/login" className="p-2 text-slate-500">
            <User size={24} />
          </Link>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-200 shadow-xl p-6 space-y-6 animate-in slide-in-from-top-4 duration-300 z-50">
          <div className="grid grid-cols-2 gap-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="text-base font-bold text-slate-900 bg-slate-50 p-4 rounded-lg flex items-center justify-between"
                onClick={() => setIsMenuOpen(false)}
              >
                {cat.name}
                <ChevronDown size={16} className="-rotate-90 text-slate-300" />
              </Link>
            ))}
          </div>
          <button className="w-full py-4 bg-red-600 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-red-100">
            Try Subscription for $1
          </button>
        </div>
      )}
    </nav>
  );
}
