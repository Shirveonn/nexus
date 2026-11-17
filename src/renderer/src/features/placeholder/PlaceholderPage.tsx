import { ShieldCheck, Sparkles } from "lucide-react";
import { navItem, type Page } from "@/app/navigation";
import { useUi } from "@/store/uiStore";

export function PlaceholderPage({ page }: { page: Page }) {
  const navigate = useUi(s => s.navigate);
  const item = navItem(page);
  return (
    <div className="page-content placeholder-page">
      <div className="eyebrow"><Sparkles size={13} /> NEXUS MODULE</div>
      <h1>{page}<span>.</span></h1>
      <p className="page-intro">{item.summary ?? "This module is part of the NEXUS roadmap."}</p>
      <section className="panel module-placeholder">
        <div className="empty-icon"><ShieldCheck size={22} /></div>
        <h3>Under construction</h3>
        <p>{item.plannedVersion ? `Planned for version ${item.plannedVersion}.` : "We're building this section step by step."} The foundation is in place.</p>
        <button className="primary-button" onClick={() => navigate("Home")}>Back to dashboard</button>
      </section>
    </div>
  );
}
