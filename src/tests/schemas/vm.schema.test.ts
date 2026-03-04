import { describe, it, expect } from 'vitest';
import { vmCreateSchema } from '@/lib/schemas/vm.schema';

describe('vmCreateSchema', () => {
  const valid = { name: 'my-vm', vcpu: 2, ram_mb: 2048, disk_gb: 50 };

  it('accepts valid VM spec', () => {
    expect(vmCreateSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects vcpu=0 (below min 1)', () => {
    expect(vmCreateSchema.safeParse({ ...valid, vcpu: 0 }).success).toBe(false);
  });

  it('rejects vcpu=33 (above max 32)', () => {
    expect(vmCreateSchema.safeParse({ ...valid, vcpu: 33 }).success).toBe(false);
  });

  it('rejects ram_mb=256 (below min 512)', () => {
    expect(vmCreateSchema.safeParse({ ...valid, ram_mb: 256 }).success).toBe(false);
  });

  it('rejects disk_gb=5 (below min 10)', () => {
    expect(vmCreateSchema.safeParse({ ...valid, disk_gb: 5 }).success).toBe(false);
  });

  it('rejects name shorter than 3 chars', () => {
    expect(vmCreateSchema.safeParse({ ...valid, name: 'ab' }).success).toBe(false);
  });

  it('accepts boundary values: vcpu=1, ram_mb=512, disk_gb=10', () => {
    expect(
      vmCreateSchema.safeParse({ name: 'my-vm', vcpu: 1, ram_mb: 512, disk_gb: 10 }).success
    ).toBe(true);
  });

  it('accepts boundary values: vcpu=32, ram_mb=65536, disk_gb=500', () => {
    expect(
      vmCreateSchema.safeParse({ name: 'my-vm', vcpu: 32, ram_mb: 65536, disk_gb: 500 }).success
    ).toBe(true);
  });
});
