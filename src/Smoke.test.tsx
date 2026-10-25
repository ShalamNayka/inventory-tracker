import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

function Greeting() {
  return <h1>Inventory Tracker</h1>;
}

describe('Greeting', () => {
  it('displays the application title', () => {
    render(<Greeting />);

    expect(screen.getByRole('heading', { name: 'Inventory Tracker' })).toBeInTheDocument();
  });
});
