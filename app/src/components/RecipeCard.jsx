import { useMemo } from "react";
import { HiOutlineExternalLink } from "react-icons/hi";
import { AiFillStar, AiOutlineStar } from "react-icons/ai";

export default function RecipeCard({
  recipe,
  pantryTerms = [],
  onToggleFav,
  isFav,
  onOpen,
}) {
  const haveSet = useMemo(
    () => new Set(pantryTerms.map((s) => s.toLowerCase())),
    [pantryTerms]
  );

  return (
    <article className="card">
      {/* Photo + overlay (click to open modal) */}
      <div className="thumb-wrap" onClick={onOpen} style={{ cursor: "pointer" }}>
        <img
          className="thumb-img"
          src={recipe.thumb}
          alt={recipe.title}
          loading="lazy"
        />

        {/* badges on photo */}
        <div className="badges">
          <span className="badge overlay">+{recipe.missingCount} to buy</span>
          {recipe.category && <span className="badge overlay">{recipe.category}</span>}
          {recipe.area && <span className="badge overlay">{recipe.area}</span>}
        </div>

        {/* soft gradient */}
        <div className="thumb-grad" />

        {/* quick actions (don’t trigger modal) */}
        <div className="quick" onClick={(e) => e.stopPropagation()}>
          <a
            className="icon-btn"
            href={recipe.sourceUrl}
            target="_blank"
            rel="noreferrer"
            title="Open recipe"
          >
            <HiOutlineExternalLink />
          </a>
          <button
            className="icon-btn"
            onClick={() => onToggleFav(recipe)}
            title={isFav ? "Remove from Saved" : "Save"}
          >
            {isFav ? <AiFillStar /> : <AiOutlineStar />}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="body">
        <div className="row-top">
          <h3 className="title">{recipe.title}</h3>
        </div>

        <div className="meta">
          <span>{recipe.category || "—"}</span>
          <span>•</span>
          <span>{recipe.area || "—"}</span>
        </div>

        <div className="ings">
          {recipe.ingredients.slice(0, 6).map((i, idx) => {
            const hasIt = [...haveSet].some((p) =>
              i.ingredient.toLowerCase().includes(p)
            );
            return (
              <span key={idx} className={`chip ${hasIt ? "ok" : "miss"}`}>
                {i.ingredient}
              </span>
            );
          })}
          {recipe.ingredients.length > 6 && (
            <span className="chip">+{recipe.ingredients.length - 6} more</span>
          )}
        </div>

        {/* Bottom actions (accessibility + mobile) */}
        <div className="actions">
          <a className="btn" href={recipe.sourceUrl} target="_blank" rel="noreferrer">
            Open Recipe
          </a>
          <button className="btn" onClick={() => onToggleFav(recipe)}>
            {isFav ? "★ Saved" : "☆ Save"}
          </button>
        </div>
      </div>
    </article>
  );
}
