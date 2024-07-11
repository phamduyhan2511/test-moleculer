"use strict";

/**
 * @typedef {import('moleculer').ServiceSchema} ServiceSchema Moleculer's Service Schema
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

/** @type {ServiceSchema} */
// const mongoose = require('mongoose');
const DbService = require("moleculer-db");
const MongooseAdapter = require("moleculer-db-adapter-mongoose");
const OrderModel = require("../models/mongo/order.model");
const { MoleculerError } = require("moleculer").Errors;
const { middlewares1 } = require("../middlewares/middlewares-1");
module.exports = {
	name: "order",
	mixins: [DbService],
	adapter: new MongooseAdapter("mongodb://localhost:27017/mydatabase"),
	model: OrderModel,
	// collection: "orders",
	/**
	 * Settings
	 */
	settings: {
		// mongodbURI: "mongodb://localhost:27017/mydatabase"
	},

	/**
	 * Dependencies
	 */
	dependencies: [],

	/**
	 * Actions
	 */
	actions: {
		/**
		 * Say a 'Hello' action.
		 *
		 * @returns
		 */

		/**
		 * Welcome, a username
		 *
		 * @param {String} name - User name
		 */
		getDetail: {
			rest: "GET /get-order/:orderId",
			hooks: {
				before: [middlewares1],
			},
			/** @param {Context} ctx  */
			async handler(ctx) {
				console.log(ctx, "=====ctx111111");
				const productInfo = await ctx.call("product.getDetail", ctx)
				console.log(productInfo, "=====productInfo99999999");
				const orderInfo = await OrderModel.findOne({
					orderId: ctx.params.orderId,
				});
				if (!orderInfo) throw new Error("Không tìm thấy order");
				return orderInfo;
			},
		},
		create: {
			rest: "POST /create-order",
			params: {
				orderId: { type: "string", required: true },
				customerName: { type: "string", required: true },
				customerEmail: { type: "string", required: true },
				productDetails: {
					type: "array",
					items: {
						type: "object",
						props: {
							productId: { type: "string", required: true },
							productName: { type: "string", required: true },
							productDescription: {
								type: "string",
								required: false,
							},
							quantity: { type: "number", required: true },
							price: { type: "number", required: true },
						},
					},
					required: true,
				},
				deliveryDate: { type: "string", required: true },
				status: {
					type: "enum",
					values: ["Pending", "Shipped", "Delivered", "Cancelled"],
					default: "Pending",
				},
				totalAmount: { type: "number", required: true },
			},
			/** @param {Context} ctx  */
			async handler(ctx) {
				try {
					const [orderCreated] = await ctx.emit("order.created", ctx);
					console.log(orderCreated,"=====orderCreated")
					return orderCreated;
				} catch (error) {
					throw new Error(error);
				}
			},
		}
	},

	/**
	 * Events
	 */
	events: {
		"order.created": {
			async handler(payload) {
				console.log("Một đơn hàng mới đã được tạo:", payload);
				return await this.createOrder(payload);
			},
		},
	},

	/**
	 * Methods
	 */
	methods: {
		async createOrder(payload) {
			try {
				console.log("Tạo đơn hàng mới:", payload);
				// Thêm logic tạo order ở đây
				const { orderId, productDetails } = payload.params;
				const productsExist = await payload.call(
					"product.verifyProducts",
					{
						productDetails,
					}
				);
				if (!productsExist)
					return new MoleculerError(
						"Có sản phẩm không tồn tại",
						400,
						"PRODUCT_NOT_EXISTS"
					);
				const productQuantityChecking = await payload.call(
					"product.verifyQuantityProducts",
					{ productDetails }
				);
				if (productQuantityChecking.length !== 0)
					return new MoleculerError(
						`${productQuantityChecking}`,
						400,
						"PRODUCT_QUANTITY_NOT_ENOUGH"
					);
				await payload.call("product.calcProducts", { productDetails });
				// const orderInfo = await payload.call("order.getDetail", { orderId: payload.params.orderId });
				const orderInfo = await OrderModel.findOne({
					orderId,
				});
				if (orderInfo) 
					return new MoleculerError(
						"orderId đã tồn tại",
						400,
						"ORDER_EXISTS"
					);
				return await OrderModel.create(payload.params);
			} catch (error) {
				throw new Error(error.message);
			}
		},
	},

	/**
	 * Service created lifecycle event handler
	 */
	created() {},

	/**
	 * Service started lifecycle event handler
	 */
	async started() {
		// Kết nối đến MongoDB
		// try {
		//     await mongoose.connect(this.settings.mongodbURI);
		//     this.logger.info("Connected to MongoDB");
		// } catch (err) {
		//     this.logger.error("Cannot connect to MongoDB", err);
		// }
	},

	/**
	 * Service stopped lifecycle event handler
	 */
	async stopped() {
		// Đóng kết nối MongoDB khi service dừng
		// await mongoose.disconnect();
		// this.logger.info("Disconnected from MongoDB");
	},
};
