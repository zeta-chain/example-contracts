import './Dropdown.css';

import { type ReactNode, useEffect, useRef, useState } from 'react';

export interface DropdownOption<T = unknown> {
  id: string | number;
  label: string;
  value: T;
  icon?: ReactNode;
  disabled?: boolean;
  colorHex?: string;
}

interface DropdownProps<T = unknown> {
  options: DropdownOption<T>[];
  selectedOption?: DropdownOption<T>;
  onSelect?: (option: DropdownOption<T>) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  dropdownClassName?: string;
  optionClassName?: string;
  renderTrigger?: (
    selectedOption: DropdownOption<T> | undefined,
    placeholder: string,
    isOpen: boolean
  ) => ReactNode;
  renderOption?: (option: DropdownOption<T>, isSelected: boolean) => ReactNode;
}

export const Dropdown = <T,>({
  options,
  selectedOption,
  onSelect,
  placeholder = 'Select an option',
  disabled = false,
  className = '',
  triggerClassName = '',
  dropdownClassName = '',
  optionClassName = '',
  renderTrigger,
  renderOption,
}: DropdownProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Focus management
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && optionRefs.current[focusedIndex]) {
      optionRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex, isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (focusedIndex >= 0) {
          handleSelect(options[focusedIndex]);
        }
        break;
    }
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (option: DropdownOption<T>) => {
    if (!option.disabled) {
      onSelect?.(option);
      setIsOpen(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const defaultTriggerContent = (
    <>
      <div className="dropdown-trigger-content">
        {selectedOption?.colorHex ? (
          <div
            className="dropdown-trigger-icon"
            style={{ backgroundColor: selectedOption.colorHex }}
          />
        ) : (
          <div className="dropdown-trigger-icon dropdown-trigger-icon-placeholder" />
        )}
        <span className="dropdown-trigger-text">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className={`dropdown-arrow ${isOpen ? 'rotated' : ''}`}>
          <svg
            className="dropdown-arrow-icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 30 30"
            fill="none"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M6.25063 9.92407L15.0006 18.6741L23.7506 9.92407L25.0765 11.2499L15.6635 20.6628C15.2974 21.0289 14.7038 21.0289 14.3377 20.6628L4.9248 11.2499L6.25063 9.92407Z"
              fill="#696E75"
            />
          </svg>
        </div>
      </div>
    </>
  );

  const defaultOptionContent = (
    option: DropdownOption<T>,
    isSelected: boolean
  ) => (
    <>
      {option.colorHex && (
        <div
          className="dropdown-option-icon"
          style={{ backgroundColor: option.colorHex }}
        />
      )}
      <span className="dropdown-option-text">{option.label}</span>
      {isSelected && (
        <div className="dropdown-checkmark">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 40 40"
            fill="none"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M33.4333 11.6667L15.8828 29.2172C15.3946 29.7054 14.6032 29.7054 14.115 29.2172L6.56445 21.6667L8.33222 19.8989L14.9989 26.5656L31.6656 9.89893L33.4333 11.6667Z"
              fill="currentColor"
            />
          </svg>
        </div>
      )}
    </>
  );

  return (
    <div className={`dropdown ${className}`} ref={dropdownRef}>
      {/* Always keep trigger in DOM to maintain layout space */}
      <button
        className={`dropdown-trigger ${triggerClassName} ${
          disabled ? 'disabled' : ''
        } ${isOpen ? 'hidden' : ''}`}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        type="button"
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {renderTrigger
          ? renderTrigger(selectedOption, placeholder, isOpen)
          : defaultTriggerContent}
      </button>

      {/* Show menu when open (overlays trigger) */}
      {isOpen && (
        <div
          className={`dropdown-menu ${dropdownClassName}`}
          role="listbox"
          aria-label={placeholder}
        >
          {options.map((option, index) => {
            const isSelected = selectedOption?.id === option.id;
            const isFirst = index === 0;
            return (
              <div key={option.id}>
                {!isFirst && <div className="dropdown-option-divider" />}
                <button
                  ref={(el) => {
                    optionRefs.current[index] = el;
                  }}
                  className={`dropdown-option ${isSelected ? 'selected' : ''} ${
                    option.disabled ? 'disabled' : ''
                  } ${optionClassName}`}
                  onClick={() => handleSelect(option)}
                  type="button"
                  disabled={option.disabled}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setFocusedIndex(index)}
                >
                  {renderOption
                    ? renderOption(option, isSelected)
                    : defaultOptionContent(option, isSelected)}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
