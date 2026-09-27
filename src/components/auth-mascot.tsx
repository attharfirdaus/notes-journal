"use client";

import { useState } from "react";
import { Mascot } from "./mascot";
import type { PetMood } from "@/lib/pet";

const MOODS: PetMood[] = ["happy", "ecstatic", "neutral", "happy"];

export function AuthMascot() {
  const [i, setI] = useState(0);
  return (
    <div className="-mb-3 relative z-10">
      <Mascot stage="scout" mood={MOODS[i % MOODS.length]} size={120} label="Pip says hi!" onPet={() => setI((v) => v + 1)} />
    </div>
  );
}
