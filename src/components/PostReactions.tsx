"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ReactionType } from "@/lib/types";

const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: "like", emoji: "👍", label: "Me gusta" },
  { type: "dislike", emoji: "👎", label: "No me gusta" },
  { type: "fire", emoji: "🔥", label: "Fuego" },
  { type: "heart", emoji: "❤️", label: "Me encanta" },
];

/**
 * Barra de reacciones tipo Facebook: Me gusta / No me gusta / Fuego / Corazon.
 * Un usuario solo puede tener UNA reaccion activa por post (si toca otra,
 * se reemplaza la anterior). Los conteos son visibles para todos, pero solo
 * un usuario logueado puede reaccionar.
 */
export default function PostReactions({ postId }: { postId: string }) {
  const supabase = createClient();
  const [counts, setCounts] = useState<Record<ReactionType, number>>({
    like: 0,
    dislike: 0,
    fire: 0,
    heart: 0,
  });
  const [myReaction, setMyReaction] = useState<ReactionType | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReactions();
  }, [postId]);

  async function loadReactions() {
    const { data } = await supabase
      .from("post_reactions")
      .select("reaction_type, user_id")
      .eq("post_id", postId);

    if (!data) return;

    const newCounts: Record<ReactionType, number> = { like: 0, dislike: 0, fire: 0, heart: 0 };
    data.forEach((r) => {
      newCounts[r.reaction_type as ReactionType]++;
    });
    setCounts(newCounts);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const mine = data.find((r) => r.user_id === user.id);
      setMyReaction((mine?.reaction_type as ReactionType) || null);
    }
  }

  async function react(type: ReactionType) {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      window.location.href = "/login";
      return;
    }

    if (myReaction === type) {
      // Toca la misma reaccion de nuevo -> la quita
      await supabase
        .from("post_reactions")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);
    } else {
      // Crea o reemplaza la reaccion (unique en post_id+user_id)
      await supabase
        .from("post_reactions")
        .upsert(
          { post_id: postId, user_id: user.id, reaction_type: type },
          { onConflict: "post_id,user_id" }
        );
    }

    await loadReactions();
    setLoading(false);
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
      {REACTIONS.map((r) => (
        <button
          key={r.type}
          onClick={() => react(r.type)}
          disabled={loading}
          title={r.label}
          className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm transition ${
            myReaction === r.type
              ? "bg-brand/30 text-white"
              : "bg-white/5 text-white/60 hover:bg-white/10"
          }`}
        >
          <span>{r.emoji}</span>
          <span>{counts[r.type] > 0 ? counts[r.type] : ""}</span>
        </button>
      ))}
    </div>
  );
}
