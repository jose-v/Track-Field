import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// A simple test component that doesn't use hooks
function SimpleComponent({ text = 'Hello, World!' }: { text?: string }) {
  return (
    <div>
      <h1>{text}</h1>
    </div>
  );
}

describe('SimpleComponent', () => {
  it('renders correctly', () => {
    render(<SimpleComponent />);
    
    // Check for text content
    expect(screen.getByText('Hello, World!')).toBeInTheDocument();
  });
  
  it('renders with custom text', () => {
    render(<SimpleComponent text="Custom Text" />);
    
    // Check for custom text
    expect(screen.getByText('Custom Text')).toBeInTheDocument();
  });
}); 