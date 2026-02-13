import React from 'react';
import OrderCard from './OrderCard';
import './OrdersList.css';

const OrdersList = ({ orders, onStatusUpdate, filterStatus = null, updateOrderStatusFn = null }) => {
  const filteredOrders = filterStatus
    ? orders.filter(order => {
        const status = order.status ?? order.order_status ?? order.state ?? order.order_state;
        return String(status || '').toUpperCase() === filterStatus.toUpperCase();
      })
    : orders;

  if (filteredOrders.length === 0) {
    return (
      <div className="orders-list-empty">
        <p>No orders found</p>
      </div>
    );
  }

  return (
    <div className="orders-list-admin">
      {filteredOrders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          onStatusUpdate={onStatusUpdate}
          updateOrderStatusFn={updateOrderStatusFn}
        />
      ))}
    </div>
  );
};

export default OrdersList;
