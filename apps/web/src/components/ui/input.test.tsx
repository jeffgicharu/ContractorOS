import { describe, it, expect } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './input';

describe('Input', () => {
  it('renders a label associated with the input by id', () => {
    render(<Input label="Email" name="email" />);
    const input = screen.getByLabelText('Email');
    expect(input).toBeInTheDocument();
    expect(input.id).toBe('email');
  });

  it('renders the error message in a paragraph below the input', () => {
    render(<Input label="Email" name="email" error="Required" />);
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('does not render an error paragraph when error prop is absent', () => {
    render(<Input label="Email" name="email" />);
    expect(screen.queryByText('Required')).not.toBeInTheDocument();
  });

  it('forwards onChange events', async () => {
    function Controlled() {
      const [v, setV] = useState('');
      return <Input label="X" name="x" value={v} onChange={(e) => setV(e.target.value)} />;
    }
    render(<Controlled />);
    const input = screen.getByLabelText('X') as HTMLInputElement;
    await userEvent.type(input, 'abc');
    expect(input.value).toBe('abc');
  });
});
