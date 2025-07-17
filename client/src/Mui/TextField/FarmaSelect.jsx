
import "./FarmaTextField.css"; // Podemos usar el mismo CSS o crear uno específico

const FarmaSelect = ({ 
  id, 
  label, 
  required = false,
  options = [],
  placeholder,
  className = "",
  ...props 
}) => {
  return (
    <div className="farma-input-container">
      {label && (
        <label htmlFor={id} className="farma-label">
          {label}{required && " *"}
        </label>
      )}
      <select
        id={id}
        className={`farma-input farma-select ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FarmaSelect;