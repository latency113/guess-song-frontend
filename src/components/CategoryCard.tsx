"use client";

import { Play, Sparkles } from "lucide-react";
import { Category } from "@/lib/api";

interface CategoryCardProps {
  category: Category;
  onSelect: (categoryId: string) => void;
  isSelected?: boolean;
}

export default function CategoryCard({ category, onSelect, isSelected }: CategoryCardProps) {
  return (
    <div
      onClick={() => onSelect(category.id)}
      className={`group relative cursor-pointer p-6 rounded-3xl glass-panel glass-card-hover border transition-all duration-300 overflow-hidden ${
        isSelected
          ? "border-violet-500 bg-violet-950/20 shadow-[0_0_30px_rgba(139,92,246,0.3)] ring-2 ring-violet-500/50"
          : "border-white/10 hover:border-white/25"
      }`}
    >
      {/* Ambient background glow on hover */}
      <div
        className={`absolute -top-12 -right-12 w-36 h-36 rounded-full bg-gradient-to-tr ${category.color} opacity-15 blur-2xl group-hover:opacity-30 transition-opacity duration-300`}
      />

      <div className="relative z-10 flex flex-col justify-between h-full">
        <div>
          {/* Icon & Category Tag */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-3xl p-2 rounded-2xl bg-white/5 border border-white/10 shadow-inner group-hover:scale-110 transition-transform">
              {category.icon}
            </span>
            <div className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/5 text-zinc-300 border border-white/10">
              <Sparkles className="w-3 h-3 text-pink-400" />
              10 คำถาม
            </div>
          </div>

          {/* Title & Description */}
          <h3 className="text-lg font-bold text-white group-hover:text-pink-300 transition-colors">
            {category.title}
          </h3>
          <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
            {category.description}
          </p>
        </div>

        {/* Action Button */}
        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors">
            เริ่มทายอินโทร
          </span>
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              isSelected
                ? "bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-md shadow-violet-600/30"
                : "bg-white/5 text-zinc-400 group-hover:bg-gradient-to-r group-hover:from-violet-600 group-hover:to-pink-600 group-hover:text-white"
            }`}
          >
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </div>
        </div>
      </div>
    </div>
  );
}
