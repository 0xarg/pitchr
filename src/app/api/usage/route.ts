import { getUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Spend summary for the profile page, computed from recorded generations.
export async function GET() {
  const supabase = await createClient();
  const user = await getUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("generations")
    .select("type, model, cost_usd, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  let total = 0;
  let last30 = 0;
  let proposals = 0;
  let proposalCost = 0;
  const byModel = new Map<string, { cost: number; count: number }>();

  for (const g of data) {
    const cost = Number(g.cost_usd) || 0;
    total += cost;
    if (new Date(g.created_at).getTime() >= monthAgo) last30 += cost;
    if (g.type === "proposal") {
      proposals++;
      proposalCost += cost;
    }
    const m = byModel.get(g.model) ?? { cost: 0, count: 0 };
    m.cost += cost;
    m.count++;
    byModel.set(g.model, m);
  }

  return NextResponse.json({
    total,
    last30,
    count: data.length,
    avgPerProposal: proposals ? proposalCost / proposals : 0,
    byModel: [...byModel.entries()]
      .map(([model, v]) => ({ model, ...v }))
      .sort((a, b) => b.cost - a.cost),
  });
}
