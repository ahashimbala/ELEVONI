import React from "react";

const PricingTiersFields = ({ tiers, onChange }) => {
  const updateTier = (index, field, value) => {
    const next = tiers.map((tier, tierIndex) => {
      if (tierIndex !== index) return tier;
      const normalized = field === "maxQuantity"
        ? value === "" ? null : Number(value)
        : value === "" ? "" : Number(value);
      return { ...tier, [field]: normalized };
    });
    onChange(next);
  };

  const addTier = () => {
    const lastTier = tiers[tiers.length - 1];
    const nextMinimum = lastTier ? Number(lastTier.maxQuantity) + 1 : 1;
    onChange([...tiers, { minQuantity: nextMinimum, maxQuantity: null, unitPrice: "" }]);
  };

  return (
    <fieldset style={{ border: "1px solid #ddd", borderRadius: 10, padding: 14 }}>
      <legend>Wholesale pricing tiers (per kg)</legend>
      <p>Ranges must start at 1 kg, continue without gaps, and leave the final maximum blank.</p>
      {tiers.map((tier, index) => (
        <div key={index} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 8, marginBottom: 10, alignItems: "center" }}>
          <label>
            Minimum kg
            <input type="number" min="1" step="1" value={tier.minQuantity ?? ""} onChange={(event) => updateTier(index, "minQuantity", event.target.value)} required />
          </label>
          <label>
            Maximum kg
            <input type="number" min="1" step="1" placeholder="No limit" value={tier.maxQuantity ?? ""} onChange={(event) => updateTier(index, "maxQuantity", event.target.value)} />
          </label>
          <label>
            Price per kg (NGN)
            <input type="number" min="1" step="1" value={tier.unitPrice ?? ""} onChange={(event) => updateTier(index, "unitPrice", event.target.value)} required />
          </label>
          <button type="button" onClick={() => onChange(tiers.filter((_, tierIndex) => tierIndex !== index))}>Remove</button>
        </div>
      ))}
      <button type="button" onClick={addTier} disabled={tiers.length > 0 && tiers[tiers.length - 1].maxQuantity == null}>
        Add tier
      </button>
    </fieldset>
  );
};

export default PricingTiersFields;
