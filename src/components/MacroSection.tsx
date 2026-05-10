"use client";

import { Flame, Dna, Wheat, Droplets } from "lucide-react";
import { MacroCard } from "./MacroCard";

export function MacroSection({ consumed, targets }: { consumed: any, targets: any }) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MacroCard label="Calories" current={Math.round(consumed.calories)} target={targets.calories} unit=" kcal" icon={Flame} color="bg-orange-500" bgLight="bg-orange-50" textColor="text-orange-500" />
      <MacroCard label="Protein" current={Math.round(consumed.protein)} target={targets.protein} unit="g" icon={Dna} color="bg-blue-500" bgLight="bg-blue-50" textColor="text-blue-500" />
      <MacroCard label="Carbs" current={Math.round(consumed.carbs)} target={targets.carbs} unit="g" icon={Wheat} color="bg-emerald-500" bgLight="bg-emerald-100" textColor="text-emerald-500" />
      <MacroCard label="Fats" current={Math.round(consumed.fats)} target={targets.fats} unit="g" icon={Droplets} color="bg-purple-500" bgLight="bg-purple-100" textColor="text-purple-500" />
    </section>
  );
}
