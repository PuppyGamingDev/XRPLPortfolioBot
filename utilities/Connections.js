// Normal imports
require('dotenv/config');

// XUMM & XRPL
const { XummSdk } = require("xumm-sdk");
const xrpl = require('xrpl');
const xumm = new XummSdk(process.env.XUMMKEY, process.env.XUMMSECRET);

const getXUMM = () => {
	return xumm;
};

const getXRPClient = async () => {
	const XRPLclient = new xrpl.Client(process.env.NETWORK);
	await XRPLclient.connect();
	return XRPLclient;
};

module.exports = { getXUMM, getXRPClient };