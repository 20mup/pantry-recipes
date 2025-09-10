import { useEffect, useMemo, useRef, useState } from "react";
import { searchMealsByIngredients } from "./utils/mealdb";
import RecipeCard from "./components/RecipeCard";
import Hero from "./components/Hero";
import FilterToolbar from "./components/FilterToolbar";
import RecipeModal from "./components/RecipeModal";
import ShoppingDrawer from "./components/ShoppingDrawer";
import "./index.css";

/** localStorage keys */
const LS_FAVS  = "pantry-recipes-favs-v1";
const LS_THEME = "pantry-recipes-theme";
const LS_LIST  = "pantry-recipes-shopping-v1";

/** Heuristics for filters (TheMealDB has limited metadata) */
const MEAT = ["beef","pork","chicken","lamb","fish","salmon","tuna","shrimp","prawn","anchovy","bacon","ham","prosciutto","sausage","turkey","duck","veal","mutton","chorizo","oyster","crab"];
const DAIRY = ["milk","cheese","butter","cream","yogurt","yoghurt","ghee","paneer","mascarpone","mozzarella","parmesan","cheddar","buttermilk","condensed milk","evaporated milk","sour cream","cream cheese"];
const EGG = ["egg","eggs","yolk","egg yolk","egg white","mayonnaise"];
const GLUTEN = ["flour","wheat","breadcrumbs","bread","pasta","noodle","noodles","wrap","tortilla","bun","semolina","farina","couscous","bulgur","cracker","biscuit","cake","beer"];
const KETO_HIGH_CARB = ["rice","sugar","honey","maple syrup","potato","potatoes","sweet potato","yam","corn","tortilla","bread","pasta","noodle","noodles"];

const CUISINE_GROUPS = {
  Italian: new Set(["Italian"]),
  Mexican: new Set(["Mexican"]),
  Asian: new Set(["Chinese","Japanese","Thai","Malaysian","Vietnamese","Filipino","Korean","Indian"]),
  Mediterranean: new Set(["Greek","Turkish","Moroccan","Egyptian","Tunisian","Spanish","Lebanese","Croatian","Algerian"]),
};

function hasAny(words, haystack) { return words.some((w) => haystack.includes(w)); }
function ingredientsToLowerSet(recipe) {
  const set = new Set();
  (recipe.ingredients || []).forEach(({ ingredient }) => ingredient && set.add(ingredient.toLowerCase()));
  return set;
}
function passesDietaryFilters(recipe, selectedDiet) {
  if (!selectedDiet?.length) return true;
  const ingSet = ingredientsToLowerSet(recipe);
  const contains = (list) => hasAny(list, Array.from(ingSet));
  if (selectedDiet.includes("Vegan") && (contains(MEAT) || contains(DAIRY) || contains(EGG) || ingSet.has("honey"))) return false;
  if (selectedDiet.includes("Vegetarian") && contains(MEAT)) return false;
  if (selectedDiet.includes("Keto") && contains(KETO_HIGH_CARB)) return false;
  if (selectedDiet.includes("Gluten-Free") && contains(GLUTEN)) return false;
  return true;
}
function passesCuisineFilters(recipe, selectedCuisine) {
  if (!selectedCuisine?.length) return true;
  const area = (recipe.area || "").trim();
  if (!area) return false;
  for (const c of selectedCuisine) {
    const group = CUISINE_GROUPS[c];
    if (group && group.has(area)) return true;
    if (!group && area === c) return true;
  }
  return false;
}
function passesTimeFilters(recipe, selectedTime) {
  if (!selectedTime?.length) return true;
  const cat = (recipe.category || "").toLowerCase();
  const title = (recipe.title || "").toLowerCase();
  const steps = (recipe.instructions || "").toLowerCase();
  const ingredientCount = (recipe.ingredients || []).length;
  const isQuick =
    ["salad","breakfast","snack","side"].some((k) => cat.includes(k)) ||
    ingredientCount <= 8 || steps.length <= 900 || /10-20\s?min|15\s?min|quick/i.test(steps);
  const isSlow =
    /(slow cook|slow-cooker|overnight|braise|hours|4 hours|3 hours|2 hours)/i.test(steps) ||
    ["stew","curry","chili","braise"].some((k) => title.includes(k));
  if (selectedTime.includes("< 20 min") && !isQuick) return false;
  if (selectedTime.includes("< 45 min") && isSlow) return false;
  if (selectedTime.includes("Slow Cook") && !isSlow) return false;
  return true;
}

/** Saved carousel helper */
function useCarousel() {
  const ref = useRef(null);
  const scrollBy = (dx) => ref.current?.scrollBy({ left: dx, behavior: "smooth" });
  return { ref, scrollBy };
}

function SkeletonCard() { return <div className="panel" style={{ height: 220 }} />; }

export default function App() {
  const [ingredients, setIngredients] = useState("eggs, rice, chicken");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Favs
  const [favs, setFavs] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_FAVS) || "[]"); } catch { return []; }
  });

  // Filters
  const [filters, setFilters] = useState({ diet: [], cuisine: [], time: [] });

  // Modal + shopping drawer/list
  const [activeRecipe, setActiveRecipe] = useState(null);
  const [shoppingList, setShoppingList] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_LIST) || "[]"); } catch { return []; }
  }); // [{name, checked}]
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Theme
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem(LS_THEME);
    return saved === "dark" || saved === "light" ? saved : "light";
  });

  // Apply theme attribute and persist
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(LS_THEME, theme);
  }, [theme]);

  const pantryTerms = useMemo(
    () => ingredients.split(",").map((s) => s.trim()).filter(Boolean),
    [ingredients]
  );

  // Persist favs + shopping list
  useEffect(() => { localStorage.setItem(LS_FAVS, JSON.stringify(favs)); }, [favs]);
  useEffect(() => { localStorage.setItem(LS_LIST, JSON.stringify(shoppingList)); }, [shoppingList]);

  async function onSearch() {
    setLoading(true);
    try {
      const data = await searchMealsByIngredients(pantryTerms);
      setResults(data);
    } catch (e) {
      console.error(e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function toggleFav(r) {
    setFavs((prev) => {
      const exists = prev.find((x) => x.id === r.id);
      if (exists) return prev.filter((x) => x.id !== r.id);
      return [...prev, { id: r.id, title: r.title, thumb: r.thumb, sourceUrl: r.sourceUrl }];
    });
  }

  function onSuggestClick(s) { setIngredients(s); }
  function clearFilters() { setFilters({ diet: [], cuisine: [], time: [] }); }

  function addMissingToList(items) {
    if (!items?.length) return;
    setShoppingList(prev => {
      const map = new Map(prev.map(i => [i.name.toLowerCase(), i]));
      items.forEach(i => {
        const name = (i.ingredient || "").trim();
        if (!name) return;
        const key = name.toLowerCase();
        if (!map.has(key)) map.set(key, { name, checked: false });
      });
      return Array.from(map.values());
    });
    setActiveRecipe(null);
    setDrawerOpen(true);
  }

  function toggleCheck(name) {
    setShoppingList(prev => prev.map(i => i.name === name ? { ...i, checked: !i.checked } : i));
  }
  function removeItem(name) {
    setShoppingList(prev => prev.filter(i => i.name !== name));
  }
  function clearAll() { setShoppingList([]); }

  const filteredResults = useMemo(
    () =>
      results.filter(
        (r) =>
          passesDietaryFilters(r, filters.diet) &&
          passesCuisineFilters(r, filters.cuisine) &&
          passesTimeFilters(r, filters.time)
      ),
    [results, filters]
  );

  const savedCarousel = useCarousel();

  return (
    <main className="page">
      {/* Theme toggle (top-right) */}
      <button
        className="theme-toggle"
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        aria-label="Toggle theme"
      >
        {theme === "light" ? "🌙" : "☀️"}
      </button>

      {/* Hero + search */}
      <Hero
        ingredients={ingredients}
        setIngredients={setIngredients}
        onSearch={onSearch}
        onSuggestClick={onSuggestClick}
      />

      {/* Filter toolbar */}
      <FilterToolbar filters={filters} setFilters={setFilters} onClear={clearFilters} />

      {/* Results */}
      <section className="results">
        <div className="section-head">
          <h2>Results</h2>
          {loading && <span className="muted">Loading…</span>}
          {!loading && filteredResults.length > 0 && (
            <span className="muted">{filteredResults.length} recipes · sorted by least to buy</span>
          )}
        </div>

        {loading && (
          <div className="grid" role="status" aria-label="Loading results">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {!loading && results.length === 0 && (
          <div className="panel" style={{ padding: 24, textAlign: "center" }}>
            <h3 style={{ marginTop: 0, fontFamily: "Fraunces, serif" }}>No recipes yet</h3>
            <p className="muted">
              Try <em>“eggs, rice, chicken”</em> or <em>“tomato, pasta, basil”</em>.
            </p>
          </div>
        )}

        {!loading && results.length > 0 && filteredResults.length === 0 && (
          <div className="panel" style={{ padding: 24, textAlign: "center" }}>
            <h3 style={{ marginTop: 0, fontFamily: "Fraunces, serif" }}>No matches</h3>
            <p className="muted">Your filters removed all results. Try clearing one or two.</p>
          </div>
        )}

        {!loading && filteredResults.length > 0 && (
          <div className="grid">
            {filteredResults.map((r) => (
              <RecipeCard
                key={r.id}
                recipe={r}
                pantryTerms={pantryTerms}
                onToggleFav={toggleFav}
                isFav={!!favs.find((x) => x.id === r.id)}
                onOpen={() => setActiveRecipe(r)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Saved carousel */}
      <section className="favorites" style={{ marginTop: 30 }}>
        <div className="section-head" style={{ justifyContent: "space-between" }}>
          <h2>Saved</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" onClick={() => savedCarousel.scrollBy(-360)} aria-label="Scroll saved left">◀</button>
            <button className="btn" onClick={() => savedCarousel.scrollBy(360)} aria-label="Scroll saved right">▶</button>
          </div>
        </div>
        {favs.length === 0 && <p className="muted">Nothing saved yet.</p>}

        <div
          ref={savedCarousel.ref}
          className="fav-row"
          role="list"
          aria-label="Saved recipes"
        >
          {favs.map((f) => (
            <div className="fav-card" key={f.id} role="listitem">
              <a className="fav-img" href={f.sourceUrl} target="_blank" rel="noreferrer" title="Open recipe">
                <img src={f.thumb} alt={f.title} />
              </a>
              <div className="fav-body">
                <span className="fav-title" title={f.title}>{f.title}</span>
                <div className="fav-actions">
                  <a className="btn" href={f.sourceUrl} target="_blank" rel="noreferrer">Open</a>
                  <button className="btn" onClick={() => toggleFav({ id: f.id })} title="Remove from saved">Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modal */}
      {activeRecipe && (
        <RecipeModal
          recipe={activeRecipe}
          pantryTerms={pantryTerms}
          onClose={() => setActiveRecipe(null)}
          onAddMissing={addMissingToList}
        />
      )}

      {/* Shopping drawer + floating cart */}
      <ShoppingDrawer
        isOpen={drawerOpen}
        onClose={(val) => setDrawerOpen(typeof val === "boolean" ? val : !drawerOpen)}
        items={shoppingList}
        onToggleCheck={toggleCheck}
        onRemove={removeItem}
        onClearAll={clearAll}
      />

      <footer className="footer">
        <small>Powered by TheMealDB</small>
      </footer>
    </main>
  );
}
