// src/components/forms/SelectInput.jsx

import React, { useId } from 'react';
import Select from 'react-select';

const SelectInput = ({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Pilih...',
  error,
  required = false,
  disabled = false,
  className = '',
}) => {
  // Find the selected option object based on the primitive value
  const selectedOption = options.find(opt => opt.value === value) || null;
  const instanceId = useId();

  // Custom react-select styles for smooth, modern appearance
  const customStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: '50px',
      borderRadius: '0.75rem',
      backgroundColor: disabled ? '#f9fafb' : '#ffffff',
      borderColor: error ? '#ef4444' : state.isFocused ? '#4abe9e' : '#e5e7eb',
      boxShadow: state.isFocused ? (error ? '0 0 0 4px #fee2e2' : '0 0 0 4px #e7f9ee') : 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.3s ease-in-out',
      '&:hover': {
        borderColor: error ? '#ef4444' : state.isFocused ? '#4abe9e' : '#98e0b6',
      }
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? '#2FA084'
        : state.isFocused
          ? '#e7f9ee'
          : '#ffffff',
      color: state.isSelected ? '#ffffff' : '#111827',
      cursor: 'pointer',
      padding: '12px 16px',
      transition: 'all 0.2s ease',
      ':active': {
        backgroundColor: state.isSelected ? '#1F6F5F' : '#c3f0d4',
      },
    }),
    menu: (base) => ({
      ...base,
      borderRadius: '0.75rem',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
      marginTop: '6px',
      border: '1px solid #e5e7eb',
      animation: 'fadeInMenu 0.2s ease-out',
    }),
    menuList: (base) => ({
      ...base,
      padding: '4px',
    }),
    placeholder: (base) => ({
      ...base,
      color: '#9ca3af',
    }),
    dropdownIndicator: (base, state) => ({
      ...base,
      color: state.isFocused ? '#4abe9e' : '#9ca3af',
      transition: 'all 0.3s ease',
      transform: state.selectProps.menuIsOpen ? 'rotate(180deg)' : null,
      '&:hover': {
        color: '#2FA084',
      }
    }),
    valueContainer: (base) => ({
      ...base,
      padding: '0 12px',
    })
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2 transition-colors">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <Select
          instanceId={instanceId}
          value={selectedOption}
          onChange={(selected) => {
            // Send back an object that looks like the standard event if needed, 
            // or just the target value structure that FormPenilaianPage expects:
            onChange({ target: { value: selected ? selected.value : '' } });
          }}
          options={options}
          placeholder={placeholder}
          isDisabled={disabled}
          styles={customStyles}
          isSearchable={false}
          classNamePrefix="react-select"
        />
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600 animate-fade-in">{error}</p>
      )}
    </div>
  );
};

export default SelectInput;