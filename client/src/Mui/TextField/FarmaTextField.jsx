import React from "react";
import "./FarmaTextField.css";

const FarmaTextField = ({ 
  id, 
  label, 
  placeholder, 
  required = false, 
  multiline = false,
  rows = 4,
  ...props 
}) => {
  return (
    <div className={multiline ? "farma-input-largeContainer" : "farma-input-container"}>
      {
        label && (
          <label htmlFor={id} className="farma-label">
            {label}{required && " *"}
          </label>
        )
      }
      {
        multiline ? (
          <textarea
            id={id}
            className="farma-input farma-textarea"
            placeholder={placeholder}
            rows={rows}
            {...props}
          />
        ) : (
          <input
            type="text"
            id={id}
            className="farma-input"
            placeholder={placeholder}
            {...props}
          />
        )
      }
    </div>
  );
};

export default FarmaTextField;