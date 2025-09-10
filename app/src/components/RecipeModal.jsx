import { useMemo, useEffect } from "react";

export default function RecipeModal({ recipe, pantryTerms = [], onClose, onAddMissing }) {
  // close on ESC
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const { have, missing, steps } = useMemo(() => {
    const haveSet = new Set(pantryTerms.map(s => s.toLowerCase()));
    const have = [];
    const missing = [];
    (recipe.ingredients || []).forEach(i => {
      const hasIt = [...haveSet].some(p => i.ingredient?.toLowerCase().includes(p));
      (hasIt ? have : missing).push(i);
    });
    // naive step split (TheMealDB gives a big string)
    const raw = (recipe.instructions || "").split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    const steps = raw.length ? raw : [recipe.instructions || "No instructions available."];
    return { have, missing, steps };
  }, [recipe, pantryTerms]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal panel" onClick={e => e.stopPropagation()}>
        <div className="modal-media">
          <img src={recipe.thumb} alt={recipe.title} />
        </div>

        <div className="modal-body">
          <div className="modal-head">
            <h2 className="modal-title">{recipe.title}</h2>
            <button className="btn" onClick={onClose}>Close</button>
          </div>

          <div className="modal-tags">
            {recipe.category && <span className="chip">{recipe.category}</span>}
            {recipe.area && <span className="chip">{recipe.area}</span>}
            <span className="chip">+{missing.length} to buy</span>
          </div>

          <div className="columns">
            <div className="col">
              <h3 className="col-title">You have</h3>
              {have.length === 0 && <p className="muted">None matched yet.</p>}
              <div className="chips">
                {have.map((i, k) => <span key={k} className="chip ok">{i.ingredient}</span>)}
              </div>
            </div>

            <div className="col">
              <h3 className="col-title">To buy</h3>
              {missing.length === 0 && <p className="muted">Nothing to buy 🎉</p>}
              <div className="chips">
                {missing.map((i, k) => <span key={k} className="chip miss">{i.ingredient}</span>)}
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <a className="btn" href={recipe.sourceUrl} target="_blank" rel="noreferrer">Open Recipe</a>
            <button
              className="btn primary"
              onClick={() => onAddMissing(missing)}
              disabled={missing.length === 0}
              title={missing.length === 0 ? "Nothing to add" : "Add all missing to shopping list"}
            >
              Add missing to shopping list
            </button>
          </div>

          <div className="steps">
            <h3 className="col-title" style={{marginTop: 18}}>Steps</h3>
            <ol className="steps-list">
              {steps.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
