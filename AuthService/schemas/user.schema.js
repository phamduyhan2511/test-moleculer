const mongoose = require("mongoose");

const { Schema } = mongoose;

const userSchema = new Schema({
	email: { type: Schema.Types.String },
	password: { type: Schema.Types.String },
	fullname: { type: Schema.Types.String },
});

const User = mongoose.model("users", userSchema);
module.exports = User;
