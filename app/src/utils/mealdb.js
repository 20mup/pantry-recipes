import axios from "axios";

const API = "https://www.themealdb.com/api/json/v1/1";

/**
 * Filter meals by a single ingredient (returns light meal objects with idMeal, strMeal, strMealThumb)
 */
export async function filterByIngredient(ingredient) {
  const { data } = await axios.get(`${API}/filter.php`, { params: { i: ingredient }});
  return data.meals || [];
}

/**
 * Get full meal details by ID (includes strIngredient1..20 and strMeasure1..20)
 */
export async function lookupMeal(id) {
  const { data } = await axios.get(`${API}/lookup.php`, { params: { i: id }});
  return data.meals?.[0] || null;
}

/**
 * Helper: from a detailed meal object, return a normalized ingredient list
 */
export function extractIngredients(meal) {
  const out = [];
  for (let i = 1; i <= 20; i++) {
    const ing = (meal[`strIngredient${i}`] || "").trim();
    const mea = (meal[`strMeasure${i}`] || "").trim();
    if (ing) out.push({ ingredient: ing, measure: mea });
  }
  return out;
}

/**
 * Search by multiple ingredients:
 * - Intersects meal IDs that contain ALL provided ingredients.
 * - If intersection is empty, falls back to a union but ranks by # of matched ingredients.
 * - Returns full details for top results.
 */
export async function searchMealsByIngredients(pantryList, maxMeals = 18) {
  const terms = pantryList
    .map(s => s.toLowerCase().trim())
    .filter(Boolean);

  if (terms.length === 0) return [];

  // fetch sets for each term
  const sets = [];
  for (const t of terms) {
    const arr = await filterByIngredient(t);
    sets.push(new Map(arr.map(m => [m.idMeal, m])));
  }

  // intersect IDs (meals that contain ALL terms)
  const [first, ...rest] = sets;
  let inter = new Map(first);
  for (const m of rest) {
    for (const id of Array.from(inter.keys())) {
      if (!m.has(id)) inter.delete(id);
    }
  }

  let candidates;
  if (inter.size > 0) {
    candidates = Array.from(inter.values());
  } else {
    // fallback: union, scored by matches
    const score = new Map(); // id -> { meal, hits }
    for (const m of sets) {
      for (const [id, meal] of m.entries()) {
        const prev = score.get(id) || { meal, hits: 0 };
        prev.hits += 1;
        score.set(id, prev);
      }
    }
    candidates = Array.from(score.values())
      .sort((a, b) => b.hits - a.hits)
      .map(x => x.meal);
  }

  // pull full details, compute missing count vs pantry
  const detailed = [];
  for (const c of candidates.slice(0, maxMeals)) {
    const full = await lookupMeal(c.idMeal);
    if (!full) continue;

    const ingredients = extractIngredients(full);
    const pantrySet = new Set(terms.map(t => t.toLowerCase()));
    const missing = ingredients.filter(({ ingredient }) => {
      const norm = ingredient.toLowerCase();
      // simple containment (you can add stemming later)
      return !Array.from(pantrySet).some(p => norm.includes(p));
    });

    detailed.push({
      id: full.idMeal,
      title: full.strMeal,
      thumb: full.strMealThumb,
      area: full.strArea,
      category: full.strCategory,
      sourceUrl: full.strSource || `https://www.themealdb.com/meal.php?c=${full.idMeal}`,
      instructions: full.strInstructions,
      ingredients,
      missingCount: missing.length,
      missing, // list of missing items
    });
  }

  // sort by fewest to buy
  detailed.sort((a, b) => a.missingCount - b.missingCount);
  return detailed;
}
