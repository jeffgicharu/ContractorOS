import { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id ?? props.name;

    return (
      <div>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`block w-full h-9 px-3 text-sm text-slate-900 bg-white
            border rounded-md
            transition-[border-color,box-shadow] duration-150 ease-out
            placeholder:text-slate-400
            hover:border-slate-400
            focus:border-brand-500 focus:shadow-ring focus:outline-none
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-error-500 focus:shadow-ring-error' : 'border-slate-300'}
            ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-[13px] text-error-600">{error}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export { Input, type InputProps };
