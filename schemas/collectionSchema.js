const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
	_id: {
		type: mongoose.SchemaTypes.String,
		required: true,
	},
	wallet: {
		type: mongoose.SchemaTypes.String,
	},

});
const name = 'collection';
module.exports = mongoose.models[name] || mongoose.model(name, collectionSchema);