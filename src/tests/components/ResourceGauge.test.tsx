import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ResourceGauge from '@/components/ui/ResourceGauge';

describe('ResourceGauge', () => {
  it('renders correct percentage text', () => {
    render(<ResourceGauge label="vCPU" used={4} max={8} />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('progress bar is green when pct < 60', () => {
    const { container } = render(<ResourceGauge label="vCPU" used={4} max={10} />);
    const bar = container.querySelector('.bg-green-500');
    expect(bar).toBeInTheDocument();
  });

  it('progress bar is yellow when 60 <= pct < 85', () => {
    // used=7, max=10 → 70%
    const { container } = render(<ResourceGauge label="RAM" used={7} max={10} />);
    const bar = container.querySelector('.bg-yellow-500');
    expect(bar).toBeInTheDocument();
  });

  it('progress bar is red when pct >= 85', () => {
    // used=9, max=10 → 90%
    const { container } = render(<ResourceGauge label="Disk" used={9} max={10} />);
    const bar = container.querySelector('.bg-red-500');
    expect(bar).toBeInTheDocument();
  });

  it('shows "Quota exceeded" badge when pct >= 100', () => {
    render(<ResourceGauge label="VMs" used={10} max={10} />);
    expect(screen.getByText('Quota exceeded')).toBeInTheDocument();
  });

  it('does not show quota exceeded badge when pct < 100', () => {
    render(<ResourceGauge label="VMs" used={5} max={10} />);
    expect(screen.queryByText('Quota exceeded')).not.toBeInTheDocument();
  });
});
