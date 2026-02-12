/**
 * MODAL RETIRAR BITCOIN
 * ======================
 * Red, dirección y validación según la red seleccionada.
 */

'use client';

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button, Input, Select } from '@/components/neo-brutal';
import {
  WITHDRAW_NETWORKS,
  validateBitcoinAddress,
  type WithdrawNetworkId,
} from '@/domain/withdraw';
import { formatBTC } from '@/domain/utils';

const networkOptions = WITHDRAW_NETWORKS.map((n) => ({
  value: n.id,
  label: n.name,
}));

interface WithdrawBitcoinModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalBtc: number;
  onSubmit?: (networkId: WithdrawNetworkId, address: string) => void | Promise<void>;
}

export function WithdrawBitcoinModal({
  open,
  onOpenChange,
  totalBtc,
  onSubmit,
}: WithdrawBitcoinModalProps) {
  const [networkId, setNetworkId] = useState<WithdrawNetworkId>('bitcoin');
  const [address, setAddress] = useState('');
  const [addressTouched, setAddressTouched] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedNetwork = WITHDRAW_NETWORKS.find((n) => n.id === networkId);

  const validation = useCallback(() => {
    return validateBitcoinAddress(networkId, address);
  }, [networkId, address]);

  const { valid, error: addressError } = validation();
  const showAddressError = addressTouched && !valid && address.length > 0;

  const handleAddressBlur = () => setAddressTouched(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressTouched(true);
    if (!valid) return;
    setSubmitError('');
    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(networkId, address.trim());
      } else {
        // Placeholder: en producción aquí iría la llamada real
        await new Promise((r) => setTimeout(r, 500));
      }
      onOpenChange(false);
      setAddress('');
      setAddressTouched(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error al solicitar el retiro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setAddress('');
      setAddressTouched(false);
      setSubmitError('');
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg border-[3px] border-foreground" showCloseButton>
        <DialogHeader>
          <DialogTitle>Retirar Bitcoin</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Elige la red y pega la dirección de destino. Solo envía a direcciones de la red seleccionada.
          </p>
          {totalBtc > 0 && (
            <p className="text-sm font-medium">
              Disponible: {formatBTC(totalBtc)}
            </p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Red"
            value={networkId}
            onChange={(e) => setNetworkId(e.target.value as WithdrawNetworkId)}
            options={networkOptions}
          />
          {selectedNetwork && (
            <p className="text-xs text-muted-foreground">
              {selectedNetwork.description}
            </p>
          )}

          <Input
            label="Dirección de destino"
            type="text"
            placeholder={
              networkId === 'bitcoin'
                ? 'Ej: bc1q... o 1A1z... o 3J98...'
                : 'Pega la dirección'
            }
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onBlur={handleAddressBlur}
            error={showAddressError ? addressError : undefined}
            hint="Pega la dirección completa. Verificaremos que sea válida para la red elegida."
          />

          {submitError && (
            <p className="text-sm font-medium text-destructive bg-destructive/10 px-4 py-3 border-2 border-destructive">
              {submitError}
            </p>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={!valid || isSubmitting}
              isLoading={isSubmitting}
            >
              Solicitar retiro
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
