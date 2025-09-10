import { useMemo } from "react";

const DIET = ["Vegan", "Vegetarian", "Keto", "Gluten-Free"];
const CUISINE = ["Italian", "Mexican", "Asian", "Mediterranean"];
const TIME = ["< 20 min", "< 45 min", "Slow Cook"];

export default function FilterToolbar({ filters, setFilters, onClear }) {
  const isOn = (group, value) => filters[group].includes(value);

  function toggle(group, value) {
    setFilters(prev => {
      const set = new Set(prev[group]);
      set.has(value) ? set.delete(value) : set.add(value);
      return { ...prev, [group]: Array.from(set) };
    });
  }

  return (
    <div className="toolbar panel">
      {/* Dietary */}
      <div className="toolbar-row">
        <span className="toolbar-label">Dietary</span>
        {DIET.map(v => (
          <button
            key={v}
            className={`chip alt ${isOn("diet", v) ? "active" : ""}`}
            onClick={() => toggle("diet", v)}
          >{v}</button>
        ))}
      </div>

      {/* Cuisine */}
      <div className="toolbar-row">
        <span className="toolbar-label">Cuisine</span>
        {CUISINE.map(v => (
          <button
            key={v}
            className={`chip ${isOn("cuisine", v) ? "active" : ""}`}
            onClick={() => toggle("cuisine", v)}
          >{v}</button>
        ))}
      </div>

      {/* Time */}
      <div className="toolbar-row" style={{ justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className="toolbar-label">Time</span>
          {TIME.map(v => (
            <button
              key={v}
              className={`chip ${isOn("time", v) ? "active" : ""}`}
              onClick={() => toggle("time", v)}
            >{v}</button>
          ))}
        </div>
        <button className="clear-btn" onClick={onClear}>Clear all</button>
      </div>
    </div>
  );
}
