import React from "react";
import styled from "styled-components";
import { ButtonProps } from "@/types";

const StyledButton = styled.button<{ variant: string; size: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s;
  cursor: pointer;
  border: none;

  ${({ variant }) => {
    switch (variant) {
      case "primary":
        return `
          background: #007bff;
          color: white;
          &:hover { background: #0056b3; }
        `;
      case "secondary":
        return `
          background: #6c757d;
          color: white;
          &:hover { background: #545b62; }
        `;
      case "outline":
        return `
          background: transparent;
          color: #007bff;
          border: 1px solid #007bff;
          &:hover { background: #007bff; color: white; }
        `;
      case "ghost":
        return `
          background: transparent;
          color: #6c757d;
          &:hover { background: #f8f9fa; }
        `;
      case "danger":
        return `
          background: #dc3545;
          color: white;
          &:hover { background: #c82333; }
        `;
      default:
        return `
          background: #007bff;
          color: white;
          &:hover { background: #0056b3; }
        `;
    }
  }}

  ${({ size }) => {
    switch (size) {
      case "sm":
        return "padding: 8px 12px; font-size: 14px;";
      case "lg":
        return "padding: 12px 20px; font-size: 16px;";
      default:
        return "padding: 10px 16px; font-size: 15px;";
    }
  }}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  onClick,
  type = "button",
  children,
  className,
  testId,
}) => {
  return (
    <StyledButton
      variant={variant}
      size={size}
      disabled={disabled || loading}
      onClick={onClick}
      type={type}
      className={className}
      data-testid={testId}
    >
      {loading ? "Loading..." : children}
    </StyledButton>
  );
};
