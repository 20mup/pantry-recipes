import { useState } from "react";
import { motion } from "framer-motion";

export default function Hero({ ingredients, setIngredients, onSearch, onSuggestClick }) {
  const suggestions = ["eggs, rice, chicken", "tomato, pasta, basil", "beans, corn, avocado"];

  return (
    <section className="hero panel">
      <div className="blob" style={{ left: -140, top: -100 }} />
      <div className="blob b2" />

      <div className="hero-inner">
        <motion.h1
          className="hero-title"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: .4 }}
        >
          Pantry Recipes
        </motion.h1>
        <p className="hero-sub">Find the perfect recipe using what’s already in your kitchen.</p>

        <div className="search-block">
          <div className="search-row">
            <input
              className="input"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              placeholder="e.g., tomato, pasta, basil"
            />
            <button onClick={onSearch} className="btn primary">Find Recipes</button>
          </div>

          <div className="suggests">
            {suggestions.map((s, i) => (
              <button
                key={i}
                className="chip"
                onClick={() => onSuggestClick(s)}
                title={`Use "${s}"`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
