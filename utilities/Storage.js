const mongoConnect = require("./mongo-connect");
const userSchema = require("../schemas/userSchema");
const collectionSchema = require("../schemas/collectionSchema");
const { getXRPClient } = require("./Connections");
const axios = require("axios");
const xrpl = require("xrpl");
const wait = (t) => new Promise((s) => setTimeout(s, t, t));

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
        Collections.set(c._id, { taxon: c.taxon, issuer: c.issuer, floor: c.floor });
    }
};

const getUserWallet = (userId) => {
    return Users.get(userId);
};

const hasCollection = (issuer, taxon) => {
    return Collections.get(`${issuer}:${taxon}`) === undefined ? null : true;
};

const addCollection = async (issuer, taxon) => {
    const collection = { issuer: issuer, taxon: taxon, floor: 0 };
    try {
        const response = await axios.get(`https://api.xrpldata.com/api/v1/xls20-nfts/stats/issuer/${issuer}/taxon/${taxon}`);
        if (response.data?.data?.collection_info?.floor) {
            for (const c of response.data.collection_info.floor) {
                if (c.currency === "XRP") collection.floor = parseInt(xrpl.dropsToXrp(c.amount));
            }
        }
    } catch (err) {
        // Error
    }
    Collections.set(`${issuer}:${taxon}`, collection);
    return;
};

const setCollection = async (c) => {
    const id = `${c.issuer}:${c.taxon}`;
    Collections.set(id, c);
    await mongoConnect();
    await collectionSchema.findOneAndUpdate({ _id: id }, { floor: c.floor }, { upsert: true });
    return;
}

const addUserWallet = async (userId, wallet) => {
    await mongoConnect();
    Users.set(userId, wallet);
    await userSchema.findOneAndUpdate({ _id: userId }, { wallet: wallet }, { upsert: true });
    const client = await getXRPClient();
    const response = await client.request({
        command: "account_nfts",
        account: wallet,
        ledger_index: "validated",
    });
    client.disconnect();
    const nftsall = response.result.account_nfts;
    nftsall.forEach(async (n) => {
        if (!hasCollection(n.Issuer, n.NFTokenTaxon)) {
            await addCollection(n.Issuer, n.NFTokenTaxon);
            await wait(10000);
        };
    });
    return;
};

const getUsers = () => {
    return Users;
};

const getCollection = (id) => {
    return Collections.get(id);
}

module.exports = { reloadUsers, reloadCollections, getUserWallet, addUserWallet, setCollection, getUsers, getCollection };
