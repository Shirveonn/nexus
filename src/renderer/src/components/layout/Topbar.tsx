import { Bell, ChevronDown, Search } from "lucide-react";
import { useUi } from "@/store/uiStore";

export function Topbar() {
  const page = useUi(s => s.page);
  return (
    <header className="topbar">
      <div className="breadcrumb"><span>Workspace</span><span className="crumb-slash">/</span><strong>{page}</strong></div>
      <div className="top-actions">
        <div className="search" title="Search arrives in a later version"><Search size={15} /><span>Search NEXUS</span><kbd>Ctrl K</kbd></div>
        <button className="icon-button notification" aria-label="Notifications"><Bell size={18} /><i /></button>
        <button className="profile-pill"><div className="avatar small">N</div><span>Guest</span><ChevronDown size={14} /></button>
      </div>
    </header>
  );
}
