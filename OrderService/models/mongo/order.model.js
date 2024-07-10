const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    productDetails: [{
      productId: { type: String, required: true },
      productName: { type: String, required: true },
      productDescription: { type: String, required: false },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true }
    }],
    orderDate: { type: Date, default: Date.now },
    deliveryDate: { type: Date, required: true },
    status: { type: String, required: true, enum: ['Pending', 'Shipped', 'Delivered', 'Cancelled'], default: 'Pending' },
    totalAmount: { type: Number, required: true }
  });

module.exports = mongoose.model('Order', OrderSchema);