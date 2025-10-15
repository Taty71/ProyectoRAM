import React from "react";

function InputText({ label, name, value, onChange, type = "text", required = false, placeholder = "", error }) {
  return (
    <label>
      {label}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        style={error ? { borderLeft: '3px solid #e74c3c' } : {}}
      />
      {error && <small className="setup-error-text">{error}</small>}
    </label>
  );
}

export default InputText;
