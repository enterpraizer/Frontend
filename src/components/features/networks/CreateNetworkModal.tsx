import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { networkCreateSchema, type NetworkCreateFormValues } from '@/lib/schemas/network.schema';
import { useCreateNetwork } from '@/hooks/useNetworks';

interface CreateNetworkModalProps {
  open: boolean;
  onClose: () => void;
}

const CreateNetworkModal = ({ open, onClose }: CreateNetworkModalProps) => {
  const createNetwork = useCreateNetwork();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<NetworkCreateFormValues>({
    resolver: zodResolver(networkCreateSchema),
    defaultValues: { name: '', cidr: '', is_public: false },
  });

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const isPublic = watch('is_public');

  const onSubmit = async (values: NetworkCreateFormValues) => {
    await createNetwork.mutateAsync(values);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Network</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="net-name">Network Name</Label>
            <Input id="net-name" placeholder="my-network" {...register('name')} />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* CIDR */}
          <div className="space-y-1.5">
            <Label htmlFor="net-cidr">CIDR Block</Label>
            <Input id="net-cidr" placeholder="192.168.1.0/24" {...register('cidr')} />
            <p className="text-xs text-muted-foreground">
              Enter a valid IPv4 CIDR notation, e.g. <code>10.0.0.0/16</code>
            </p>
            {errors.cidr && (
              <p className="text-xs text-destructive">{errors.cidr.message}</p>
            )}
          </div>

          {/* Public toggle */}
          <div className="flex items-center justify-between rounded-md border p-4">
            <div>
              <p className="text-sm font-medium">Public Network</p>
              <p className="text-xs text-muted-foreground">
                Allow access from outside the tenant
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isPublic}
              onClick={() => setValue('is_public', !isPublic)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isPublic ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  isPublic ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createNetwork.isPending}>
              {createNetwork.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                'Create Network'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateNetworkModal;
