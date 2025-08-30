import React from "react";
import styled from "styled-components";
import { InputProps } from "@/types";

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Label = styled.label`
  font-weight: 500;
  color: #374151;
  font-size: 14px;
`;

const StyledInput = styled.input<{ hasError: boolean }>`
  padding: 10px 12px;
  border: 1px solid ${({ hasError }) => (hasError ? "#dc3545" : "#d1d5db")};
  border-radius: 6px;
  font-size: 15px;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: ${({ hasError }) => (hasError ? "#dc3545" : "#007bff")};
  }

  &:disabled {
    background: #f9fafb;
    color: #6b7280;
    cursor: not-allowed;
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const ErrorText = styled.span`
  color: #dc3545;
  font-size: 12px;
`;

const HelperText = styled.span`
  color: #6b7280;
  font-size: 12px;
`;

export const Input: React.FC<InputProps> = ({
  type = "text",
  value,
  defaultValue,
  placeholder,
  disabled = false,
  required = false,
  onChange,
  onBlur,
  onFocus,
  error,
  label,
  helper,
  className,
  testId,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <InputContainer className={className}>
      {label && (
        <Label>
          {label}
          {required && " *"}
        </Label>
      )}
      <StyledInput
        type={type}
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        onChange={handleChange}
        onBlur={onBlur}
        onFocus={onFocus}
        hasError={!!error}
        data-testid={testId}
      />
      {error && <ErrorText>{error}</ErrorText>}
      {helper && !error && <HelperText>{helper}</HelperText>}
    </InputContainer>
  );
};
