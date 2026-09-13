export default function CancelOrderModal({ order, onConfirm, onClose, loading }) {
  if (!order) return null;
  const isPaid = order.status === 'PAID';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="warn-icon">!</div>
        <h3>Cancel Order</h3>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>
          Are you sure you want to cancel order #{order.id}?
          {isPaid
            ? ' This will refund your payment and restock the items.'
            : ' This will release the reserved stock back to inventory.'}
        </p>
        <div className="modal-actions">
          <button className="btn secondary" onClick={onClose} disabled={loading}>Keep Order</button>
          <button className="btn danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Cancelling...' : isPaid ? 'Cancel & Refund' : 'Cancel Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
