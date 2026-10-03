/**
 * StatusBadge — displays an order status as a styled pill.
 * Relies on .badge and .badge-<status> classes in index.css.
 */

const LABELS = {
  PLACED:           'Placed',
  ACCEPTED:         'Accepted',
  PREPARING:        'Preparing',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED:        'Delivered',
};

export default function StatusBadge({ status }) {
  const key = (status || '').toLowerCase();
  const label = LABELS[status] || status;
  return (
    <span className={`badge badge-${key}`}>
      {label}
    </span>
  );
}
