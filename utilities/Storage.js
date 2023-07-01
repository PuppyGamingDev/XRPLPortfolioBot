const mongoConnect = require('./mongo-connect');
const userSchema = require('../schemas/userSchema');
const collectionSchema = require('../schemas/collectionSchema')

const Users = new Map();
const Collections = new Map();

const reloadUsers = async () => {
	await mongoConnect();
	const users = await userSchema.find();
	if (users[0] === undefined) return;
	for (const user of users) {
		Users.set(user._id, user.wallet);
	}
	return;
};

const reloadCollections = async () => {
    await mongoConnect();
    const collections = await collectionSchema.find();
    if (collections[0] === undefined) return;
    for (const c of collections) {
        Collections.set(c._id, { taxon: c.taxon, issuer: c.issuer, floor: c.floor })
    }
};

const getUserWallet = (userId) => {
	return Users.get(userId);
};

const addUserWallet = async (userId, wallet) => {
	Users.set(userId, wallet);
	await mongoConnect();
	await userSchema.findOneAndUpdate({ _id: userId }, { wallet: wallet }, { upsert: true });
	return;
};

module.exports = { reloadUsers, reloadCollections, getUserWallet, addUserWallet };