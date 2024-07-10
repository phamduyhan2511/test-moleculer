"use strict";

const { MoleculerError } = require("moleculer").Errors;
const { default: mongoose } = require("mongoose");

const MongooseAdapter = require("moleculer-db-adapter-mongoose");
const DbService = require("moleculer-db");
const User = require("../schemas/user.schema");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

/**
 * @typedef {import('moleculer').ServiceSchema} ServiceSchema Moleculer's Service Schema
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

const secretKey =
	"eyJhbGciOiJIUzI1NiJ9.eyJSb2xlIjoiQWRtaW4iLCJJc3N1ZXIiOiJJc3N1ZXIiLCJVc2VybmFtZSI6IkphdmFJblVzZSIsImV4cCI6MTY1NDk0MjkxOSwiaWF0IjoxNjU0OTQyOTE5fQ.2gyg5_imyt_IpWaivv5mShdyW8DeKcq0HeV-GAM46qQ";

/** @type {ServiceSchema} */
module.exports = {
	name: "users",
	mixins: [DbService],
	adapter: new MongooseAdapter(
		"mongodb+srv://nhatnvm:biso24@cluster0.3ognbog.mongodb.net/test_moreculer?retryWrites=true&w=majority"
	),
	model: User,

	actions: {
		register: {
			params: {
				email: "string",
				password: "string",
				fullname: "string",
			},

			/** @param {Context} ctx */
			async handler(ctx) {
				const doc = await User.findOne({
					email: ctx.params.email,
				}).lean();
				if (doc) throw new MoleculerError("Email is already existed!");

				const hashPassword = await bcrypt.hash(ctx.params.password, 10);
				const result = await User.create({
					fullname: ctx.params.fullname,
					email: ctx.params.email,
					password: hashPassword,
				});
				return result;
			},
		},

		login: {
			params: {
				email: "string",
				password: "string",
			},

			/** @param {Context} ctx */
			async handler(ctx) {
				const doc = await User.findOne({
					email: ctx.params.email,
				}).lean();
				if (!doc)
					throw new MoleculerError("Email or password is incorrect!");
				const passwordMatch = bcrypt.compare(
					ctx.params.password,
					doc.password
				);
				if (!passwordMatch)
					throw new MoleculerError("Email or password is incorrect!");

				const token = jwt.sign({ _id: doc._id }, secretKey, {
					expiresIn: "1d",
				});
				return { ...doc, token };
			},
		},

		validate: {
			params: { token: "string" },

			/** @param {Context} ctx */
			async handler(ctx) {
				const decoded = jwt.verify(ctx.params.token, secretKey, {});
				if (!decoded || !decoded._id)
					throw new MoleculerError("Unauthorized!");
				const doc = await User.findOne({
					_id: new mongoose.Types.ObjectId(decoded._id),
				}).lean();
				if (!doc) throw new MoleculerError("Unauthorized!");
				return doc;
			},
		},
	},
};
