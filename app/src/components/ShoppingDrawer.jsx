import confetti from "canvas-confetti";

export default function ShoppingDrawer({
  isOpen,
  onClose,
  items,
  onToggleCheck,
  onRemove,
  onClearAll,
}) {
  async function copyList() {
    const text = items.map(i => `${i.checked ? "☑" : "☐"} ${i.name}`).join("\n");
    try { await navigator.clipboard.writeText(text); alert("Copied to clipboard!"); }
    catch { alert("Could not copy, sorry 😅"); }
  }

  function clearWithConfetti() {
    if (items.length === 0) return;
    onClearAll();
    confetti({ particleCount: 120, spread: 70, origin: { x: 0.9, y: 0.2 } });
  }

  return (
    <>
      <div className={`drawer-backdrop ${isOpen ? "show" : ""}`} onClick={() => onClose(false)} />
      <aside className={`drawer ${isOpen ? "open" : ""}`} aria-hidden={!isOpen}>
        <header className="drawer-head">
          <h3 className="drawer-title">Shopping List</h3>
          <button className="btn" onClick={() => onClose(false)}>Close</button>
        </header>

        <div className="drawer-actions">
          <button className="btn" onClick={copyList}>Copy</button>
          <button className="btn" onClick={clearWithConfetti} disabled={items.length === 0}>
            Clear
          </button>
        </div>

        <ul className="drawer-list">
          {items.length === 0 && <p className="muted">Nothing here yet.</p>}
          {items.map((it) => (
            <li key={it.name} className={`drawer-item ${it.checked ? "done" : ""}`}>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={!!it.checked}
                  onChange={() => onToggleCheck(it.name)}
                />
                <span>{it.name}</span>
              </label>
              <button className="btn" onClick={() => onRemove(it.name)} title="Remove">✕</button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Floating cart button */}
      <button className="fab" onClick={() => onClose(!isOpen)}>
        🛒
        {items.length > 0 && <span className="fab-badge">{items.length}</span>}
      </button>
    </>
  );
}
