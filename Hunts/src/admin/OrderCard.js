import React from 'react';
import { adminApi } from './adminApi';
import { formatDateTime } from '../utils/dateUtils';
import './OrderCard.css';

const OrderCard = ({ order, onStatusUpdate, updateOrderStatusFn, onStatusChangeBanner }) => {
  
  const formatTotal = (value) => {
    if (value == null) return '—';
    const n = Number(value);
    return Number.isNaN(n) ? value : `$${n.toFixed(2)}`;
  };

  const getOrderTime = (order) => {
    const raw =
      order.created_at ??
      order.createdAt ??
      order.date ??
      order.order_date ??
      order.order_time ??
      order.ordered_at ??
      order.placed_at ??
      order.timestamp ??
      order.updated_at;
    return formatDateTime(raw);
  };

  const getStatus = (order) => {
    const raw = order.status ?? order.order_status ?? order.state ?? order.order_state;
    if (raw != null && String(raw).trim() !== '') {
      const statusUpper = String(raw).trim().toUpperCase();
      if (statusUpper === 'OUT_FOR_DELIVERY' || statusUpper === 'OUT FOR DELIVERY') {
        return 'OUT_FOR_DELIVERY';
      }
      return statusUpper;
    }
    return 'PENDING';
  };

  const status = getStatus(order);
 
  const customerName = 
    order.customer_name || 
    order.name || 
    order.user?.name || 
    order.customer?.name ||
    (order.order_data?.delivery?.name) ||
    '';
  const customerEmail = 
    order.customer_email || 
    order.email || 
    order.user?.email || 
    order.customer?.email ||
    (order.order_data?.delivery?.email) ||
    '';
  const customerPhone = 
    order.customer_phone || 
    order.phone || 
    order.user?.phone || 
    order.customer?.phone ||
    (order.order_data?.delivery?.phone) ||
    '';

  const handleStatusUpdate = async (newStatus) => {
    try {
      const statusLower = String(newStatus).toLowerCase();
      const updateFn = updateOrderStatusFn || ((id, status) => adminApi.updateOrderStatus(id, status));
      await updateFn(order.id, statusLower);
      
      const statusDisplay = statusLower.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      
      if (onStatusChangeBanner) {
        onStatusChangeBanner(`Order #${order.id} status updated to ${statusDisplay}`, 'success');
      }
      
      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.detail || err.message || 'Failed to update order status';
      const errorText = typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg);
      
      if (onStatusChangeBanner) {
        onStatusChangeBanner(errorText, 'error');
      }
      console.error('Failed to update order status:', err);
    }
  };

  const renderItems = () => {
    if (!order.items || order.items.length === 0) {
      return <div className="order-item">No items</div>;
    }

    return order.items.map((item, index) => {
      const itemName = item.name || item.product_name || item.title || 'Item';
      const quantity = item.quantity || 1;
      const customizations = item.customizations || item.custom_data || {};
      
      return (
        <div key={index} className="order-item">
          <div className="order-item-name">
            {itemName} {quantity > 1 ? `× ${quantity}` : ''}
          </div>
          {customizations.crust && (
            <div className="order-item-addon">Crust: {customizations.crust.name || customizations.crust}</div>
          )}
          {customizations.sauce && (
            <div className="order-item-addon">Sauce: {customizations.sauce.name || customizations.sauce}</div>
          )}
          {customizations.meats && Array.isArray(customizations.meats) && customizations.meats.length > 0 && (
            <div className="order-item-addon">Meats: {customizations.meats.map(m => m.name || m).join(', ')}</div>
          )}
          {customizations.veggies && Array.isArray(customizations.veggies) && customizations.veggies.length > 0 && (
            <div className="order-item-addon">Veggies: {customizations.veggies.map(v => v.name || v).join(', ')}</div>
          )}
          {customizations.extraToppings && Array.isArray(customizations.extraToppings) && customizations.extraToppings.length > 0 && (
            <div className="order-item-addon">Extra: {customizations.extraToppings.map(t => t.name || t).join(', ')}</div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="order-card-admin">
      <div className="order-card-header-admin">
        <div>
          <div className="order-id-admin">Order #{order.id}</div>
          <div className="order-customer-info">
            {customerName ? (
              <div className="customer-name">{customerName}</div>
            ) : (
              <div className="customer-name">Customer</div>
            )}
            {customerEmail && (
              <div className="customer-detail">
                <span className="customer-detail-label">Email:</span> {customerEmail}
              </div>
            )}
            {customerPhone && (
              <div className="customer-detail">
                <span className="customer-detail-label">Phone:</span> {customerPhone}
              </div>
            )}
            {!customerName && !customerEmail && !customerPhone && (
              <div className="customer-detail">No customer details available</div>
            )}
          </div>
        </div>
        <div className="order-status-badge-admin" data-status={status.toLowerCase()}>
          {status}
        </div>
      </div>

      <div className="order-card-body-admin">
        <div className="order-meta-admin">
          <div className="order-meta-item">
            <span className="order-meta-label-admin">Order Time:</span>
            <span className="order-meta-value-admin">{getOrderTime(order)}</span>
          </div>
          {(order.address || order.delivery_address || order.order_data?.delivery?.address) && (
            <div className="order-meta-item">
              <span className="order-meta-label-admin">Delivery Address:</span>
              <span className="order-meta-value-admin">
                {order.address || order.delivery_address || order.order_data?.delivery?.address}
                {order.city || order.order_data?.delivery?.city ? `, ${order.city || order.order_data?.delivery?.city}` : ''}
                {order.zipCode || order.zip_code || order.order_data?.delivery?.zipCode ? ` ${order.zipCode || order.zip_code || order.order_data?.delivery?.zipCode}` : ''}
              </span>
            </div>
          )}
        </div>

        <div className="order-items-section">
          <div className="order-items-title">Items:</div>
          <div className="order-items-list">
            {renderItems()}
          </div>
        </div>

        <div className="order-total-admin">
          <span>Total:</span>
          <span className="order-total-value-admin">{formatTotal(order.total)}</span>
        </div>

        <div className="order-actions-admin">
          {status === 'PENDING' && (
            <>
              <button
                className="order-action-btn accept-btn"
                onClick={() => handleStatusUpdate('accepted')}
              >
                Accept
              </button>
              <button
                className="order-action-btn reject-btn"
                onClick={() => handleStatusUpdate('rejected')}
              >
                Reject
              </button>
            </>
          )}
          {status === 'ACCEPTED' && (
            <button
              className="order-action-btn preparing-btn"
              onClick={() => handleStatusUpdate('preparing')}
            >
              Mark Preparing
            </button>
          )}
          {status === 'PREPARING' && (
            <button
              className="order-action-btn ready-btn"
              onClick={() => handleStatusUpdate('ready')}
            >
              Mark Ready
            </button>
          )}
          {status === 'READY' && (
            <button
              className="order-action-btn out-for-delivery-btn"
              onClick={() => handleStatusUpdate('out_for_delivery')}
            >
              Mark Out for Delivery
            </button>
          )}
          {status === 'OUT_FOR_DELIVERY' && (
            <button
              className="order-action-btn delivered-btn"
              onClick={() => handleStatusUpdate('delivered')}
            >
              Mark Delivered
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
