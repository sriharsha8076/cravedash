import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { createOrder } from '../api/api';

const INITIAL_FORM = { customer: '', restaurant: '', amount: '' };

const RESTAURANTS = [
  'Biryani House', 'Pizza Palace', 'Burger Barn', 'Dosa Corner',
  'Sushi Stop', 'Taco Town', 'Noodle Nest', 'Curry Cottage',
];

/**
 * Modal for creating a new order.
 * Props:
 *   onClose()        — called when modal should close
 *   onCreated(order) — called with the new order after successful creation
 */
export default function CreateOrderModal({ onClose, onCreated }) {
  const [form, setForm]         = useState(INITIAL_FORM);
  const [errors, setErrors]     = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading]   = useState(false);
  const firstInputRef           = useRef(null);

  useEffect(() => {
    firstInputRef.current?.focus();
    const onKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  function validate() {
    const errs = {};
    if (!form.customer.trim())   errs.customer   = 'Customer name is required.';
    if (!form.restaurant.trim()) errs.restaurant = 'Restaurant is required.';
    if (!form.amount || Number(form.amount) <= 0)
      errs.amount = 'Amount must be a positive number.';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError('');
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const order = await createOrder({
        customer:   form.customer.trim(),
        restaurant: form.restaurant.trim(),
        amount:     Number(form.amount),
      });
      onCreated(order);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to create order. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  return createPortal(
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-header">
          <h2 id="modal-title" style={{ fontSize: 17 }}>🛒 New Order</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        {apiError && <p className="msg-error" style={{ marginBottom: 16 }}>{apiError}</p>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="co-customer">Customer Name</label>
            <input
              id="co-customer"
              ref={firstInputRef}
              value={form.customer}
              onChange={set('customer')}
              placeholder="e.g. Priya Sharma"
              autoComplete="off"
            />
            {errors.customer && <span className="field-error">{errors.customer}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="co-restaurant">Restaurant</label>
            <input
              id="co-restaurant"
              list="restaurant-suggestions"
              value={form.restaurant}
              onChange={set('restaurant')}
              placeholder="e.g. Biryani House"
              autoComplete="off"
            />
            <datalist id="restaurant-suggestions">
              {RESTAURANTS.map((r) => <option key={r} value={r} />)}
            </datalist>
            {errors.restaurant && <span className="field-error">{errors.restaurant}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="co-amount">Amount (₹)</label>
            <input
              id="co-amount"
              type="number"
              min="1"
              step="1"
              value={form.amount}
              onChange={set('amount')}
              placeholder="e.g. 499"
            />
            {errors.amount && <span className="field-error">{errors.amount}</span>}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              id="create-order-cancel"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              id="create-order-submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? '⏳ Creating…' : '✓ Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
