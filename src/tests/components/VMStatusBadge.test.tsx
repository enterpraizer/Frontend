import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import VMStatusBadge from '@/components/ui/VMStatusBadge';

describe('VMStatusBadge', () => {
  it('renders "Running" with green class for status=running', () => {
    const { container } = render(<VMStatusBadge status="running" />);
    expect(screen.getByText('Running')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('bg-green-100');
  });

  it('renders "Stopped" for status=stopped', () => {
    const { container } = render(<VMStatusBadge status="stopped" />);
    expect(screen.getByText('Stopped')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('bg-slate-100');
  });

  it('renders "Terminated" with red class for status=terminated', () => {
    const { container } = render(<VMStatusBadge status="terminated" />);
    expect(screen.getByText('Terminated')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('bg-red-100');
  });

  it('renders pulsing dot for status=pending', () => {
    render(<VMStatusBadge status="pending" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
    // dot span has animate-pulse class
    const dot = document.querySelector('.animate-pulse');
    expect(dot).toBeInTheDocument();
  });

  it('renders "Pending" badge with yellow class', () => {
    const { container } = render(<VMStatusBadge status="pending" />);
    expect(container.firstChild).toHaveClass('bg-yellow-100');
  });
});
