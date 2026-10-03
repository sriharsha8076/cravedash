/**
 * StatusTimeline — vertical progress tracker for an order's lifecycle.
 * Steps follow the strict linear chain: PLACED → ACCEPTED → PREPARING → OUT_FOR_DELIVERY → DELIVERED
 */

const STEPS = ['PLACED', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'];

const STEP_LABELS = {
  PLACED:           '🛒  Placed',
  ACCEPTED:         '✅  Accepted',
  PREPARING:        '👨‍🍳  Preparing',
  OUT_FOR_DELIVERY: '🛵  Out for Delivery',
  DELIVERED:        '🎉  Delivered',
};

export default function StatusTimeline({ currentStatus }) {
  const currentIndex = STEPS.indexOf(currentStatus);

  return (
    <div className="status-timeline">
      {STEPS.map((step, i) => {
        const isDone    = i < currentIndex;
        const isCurrent = i === currentIndex;
        const cls       = isDone ? 'done' : isCurrent ? 'current' : 'upcoming';

        return (
          <div className="timeline-item" key={step}>
            <div className={`timeline-dot ${cls}`} />
            <span className={`timeline-label ${cls}`}>
              {STEP_LABELS[step]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
