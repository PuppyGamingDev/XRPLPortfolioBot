const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
	_id: {
		type: mongoose.SchemaTypes.String,
		required: true,
	},
	issuer: {
		type: mongoose.SchemaTypes.String,
	},
    taxon: {
        type: mongoose.SchemaTypes.Number,
    },
    floor: {
        type: mongoose.SchemaTypes.Number,
    },

});
const name = 'collection';
module.exports = mongoose.models[name] || mongoose.model(name, collectionSchema);