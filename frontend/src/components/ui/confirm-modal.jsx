import { Button } from './button'
import { AlertTriangle } from 'lucide-react'

export function ConfirmModal({ title, message, confirmLabel = 'Confirm', onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-sm shadow-2xl">
        <div className="p-6 flex flex-col items-center text-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h2 className="text-base font-bold">{title}</h2>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" className="flex-1" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  )
}
