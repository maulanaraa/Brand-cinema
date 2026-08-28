import { X } from 'lucide-react'

interface CancelBookingModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

const CancelBookingModal: React.FC<CancelBookingModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-900/50 dark:bg-dark-900/80 z-50 flex items-center justify-center">
      <div className="card p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-bold mb-4">Cancel Booking</h2>
        <p className="text-gray-600 dark:text-slate-300 mb-2">
          Are you sure you want to cancel this booking?
        </p>
        <p className="text-sm text-gray-400 dark:text-slate-500 mb-6">
          You can cancel up to 30 minutes before the show starts.
        </p>
        <div className="flex justify-end space-x-4">
          <button onClick={onClose} className="btn btn-secondary">
            Keep Booking
          </button>
          <button onClick={onConfirm} className="btn btn-danger">
            Yes, Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default CancelBookingModal
