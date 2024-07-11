"use strict";

/**
 * @typedef {import('moleculer').ServiceSchema} ServiceSchema Moleculer's Service Schema
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

/** @type {ServiceSchema} */
const Sequelize = require("sequelize");
const ProductModel = require("../models/sql/product.model");
const { Pool } = require("pg");
const pool = new Pool({
	user: "postgres",
	host: "localhost",
	database: "postgres",
	password: "123456",
	port: 5432,
});
let sequelize = null;
let Product = null;
module.exports = {
	name: "product",

	/**
	 * Settings
	 */
	settings: {
		// mongoURI: "mongodb://localhost:27017/mydatabase"
		postgresURI: "postgres://postgres:123456@localhost:5432/postgres",
	},

	/**
	 * Dependencies
	 */
	dependencies: [],

	/**
	 * Actions
	 */

	actions: {
		// Action để tạo sản phẩm mới
		create: {
			rest: {
				method: "POST",
				path: "/create-product",
			},
			// rest: "/create-product",
			params: {
				name: "string",
				price: "number",
				description: { type: "string", optional: true },
				quantity: "number",
			},
			async handler(ctx) {
				const { name, price, description, quantity } = ctx.params;
				const product = await Product.create({
					name,
					price,
					description,
					quantity,
				});
				return product;
			},
		},
		update: {
			rest: {
				method: "PUT",
				path: "/update-product",
			},
			// rest: "/create-product",
			params: {
				id: "number",
				name: { type: "string", optional: true },
				price: { type: "number", optional: true },
				description: { type: "string", optional: true },
				quantity: { type: "number", optional: true },
			},
			async handler(ctx) {
				let { id, name, price, description, quantity } = ctx.params;
				// Explicitly convert id to a number
				id = Number(id);
				try {
					const updateData = {};
					if (name !== undefined) updateData.name = name;
					if (price !== undefined) updateData.price = price;
					if (description !== undefined)
						updateData.description = description;
					if (quantity !== undefined) updateData.quantity = quantity;

					const updated = await Product.update(updateData, {
						where: { id },
					});

					if (updated[0] > 0) {
						return {
							success: true,
							message: "Product updated successfully",
							id,
							updatedFields: updateData,
						};
					} else {
						return {
							success: false,
							message: "Product not found or no changes made",
							id,
						};
					}
				} catch (err) {
					this.logger.error("Error updating product", err);
					return {
						success: false,
						message: "Error updating product",
						error: err,
					};
				}
			},
		},
		verifyProducts: {
			params: {
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
			},
			async handler(ctx) {
				const productDetails = ctx.params.productDetails;
				try {
					const res = await pool.query("SELECT * FROM products");
					const allProductsExist = productDetails.every((detail) =>
						res.rows.some(
							(row) => row.id.toString() === detail.productId
						)
					);
					if (!allProductsExist) {
						return false;
					} else {
						return true;
					}
				} catch (err) {
					console.error(err);
					return []; // Trả về mảng rỗng nếu có lỗi
				}
			},
		},
		verifyQuantityProducts: {
			params: {
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
			},
			async handler(ctx) {
				const productDetails = ctx.params.productDetails;
				try {
					const res = await pool.query("SELECT * FROM products");
					let reports = [];
					for (const product of productDetails) {
						const matchingResRow = res.rows.find(
							(row) => row.id === parseInt(product.productId)
						);
						if (matchingResRow && matchingResRow.quantity === 0) {
							reports.push(
								`Sản phẩm ${product.productId} đã hết hàng`
							);
						}
					}
					return reports;
				} catch (err) {
					console.error(err);
					return []; // Trả về mảng rỗng nếu có lỗi
				}
			},
		},
		calcProducts: {
			params: {
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
			},
			async handler(ctx) {
				const productDetails = ctx.params.productDetails;
				productDetails.forEach((product) => {
					const query = `
					  UPDATE products
					  SET quantity = quantity - $1
					  WHERE id = $2 AND quantity >= $1
					  RETURNING *;`;

					pool.query(query, [product.quantity, product.productId])
						.then((res) => {
							if (res.rows.length > 0) {
								console.log(
									`Updated product ${product.productId}:`,
									res.rows[0]
								);
							} else {
								console.log(
									`Product ${product.productId} could not be updated due to insufficient stock or it does not exist.`
								);
							}
						})
						.catch((err) =>
							console.error("Error executing query", err.stack)
						);
				});
			},
		},
		getDetail: {
			async handler(ctx) {
				try {
					const [productInfo] = await ctx.emit("product.getDetail", ctx);
					console.log(productInfo, "=====productInfo98989898");
					return productInfo;
				} catch (error) {
					throw new Error(error);
				}
			},
		},
	},

	/**
	 * Events
	 */
	events: {
		"product.getDetail": {
			async handler(payload) {
				console.log(payload, "=====payload0000000");
				const { productId } = payload.params.params;
				const product = await this.getProductDetails(productId);
				return product;
			},
		},
	},

	/**
	 * Methods
	 */
	methods: {
		async getProductDetails(id) {
			try {
				console.log(id, "=====id00000000");
				const product = await Product.findOne({
					where: { id },
					raw: true,
				});
				console.log(product, "======product");
				return product;
			} catch (err) {
				this.logger.error("Error getting product details", err);
				return null;
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
		sequelize = new Sequelize(this.settings.postgresURI, {
			dialect: "postgres",
			logging: false,
		});

		Product = ProductModel(sequelize); // Khởi tạo model Product

		try {
			await sequelize.authenticate();
			this.logger.info("Connected to PostgreSQL");

			// Sync all defined models to the DB.
			await sequelize.sync();
		} catch (err) {
			this.logger.error("Error connecting to PostgreSQL", err);
		}
	},

	/**
	 * Service stopped lifecycle event handler
	 */

	async stopped() {
		if (sequelize) {
			try {
				await sequelize.close();
				this.logger.info("Disconnected from PostgreSQL");
			} catch (err) {
				this.logger.error("Error disconnecting from PostgreSQL", err);
			}
		}
	},
};
