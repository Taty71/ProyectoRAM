import React from "react";

function InputSelect({ label, name, value, onChange, options, required = false, error }) {
  return (
    <label className="setup-label-select">
      {label}
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="setup-input setup-input-select"
        style={error ? { borderLeft: '3px solid #e74c3c' } : {}}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <small className="setup-error-text">{error}</small>}
    </label>
  );
}

export default InputSelect;
