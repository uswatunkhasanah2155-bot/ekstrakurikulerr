// src/components/InputField.jsx
import React from 'react';

export default function InputField({
  label,
  type,
  placeholder,
  value,
  onChange,
  icon,
  rightIcon,
  onRightIconClick,
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative flex items-center">
        {/* Icon Kiri */}
        {icon && (
          <span className="absolute left-3 flex items-center pointer-events-none">
            {icon}
          </span>
        )}
        
        {/* Input Text */}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`w-full py-2.5 border border-gray-200 rounded-xl bg-gray-50/50 text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none transition duration-200 ${
            icon ? 'pl-10' : 'pl-4'
          } ${rightIcon ? 'pr-10' : 'pr-4'}`}
        />

        {/* Icon Kanan (Contoh: Mata untuk Show/Hide Password) */}
        {rightIcon && (
          <button
            type="button"
            onClick={onRightIconClick}
            className="absolute right-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
          >
            {rightIcon}
          </button>
        )}
      </div>
    </div>
  );
}