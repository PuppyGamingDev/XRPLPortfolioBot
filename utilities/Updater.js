require("dotenv/config");
const axios = require("axios");
const { getUsers, setCollection, reloadTokens } = require("./Storage");
const schedule = require("node-schedule");
const { getXRPClient } = require("./Connections");
const xrpl = require("xrpl");
const wait = (t) => new Promise((s) => setTimeout(s, t, t));

const Collections = schedule.scheduleJob("*/20 * * * *", async function() {
    await RunCollections();
});

const tokens = schedule.scheduleJob("*/30 * * * *", async function() {
    await reloadTokens();
});

async function RunCollections() {
    const users = getUsers();
    const Collections = [];
    users.forEach(async (u) => {
        try {
            const client = await getXRPClient();
            var nftsall = []
            var marker = 1
            while (marker !== null) {
                var request = {
                    command: "account_nfts",
                    account: u,
                    ledger_index: "validated",
                    limit: 400,
                }
                if (marker !== 1) request.marker = marker;
                const response = await client.request(request);
                nftsall = nftsall.concat(response.result.account_nfts);
                if (response.result.marker !== undefined) {
                    marker = response.result.marker;
                } else {
                    marker = null;
                }
            }
            client.disconnect();
            // const nftsall = response.result.account_nfts;
            for (i = 0; i < nftsall.length; i++) {
                const n = nftsall[i];
                if (!Collections.includes(`${n.Issuer}:${n.NFTokenTaxon}`)) Collections.push(`${n.Issuer}:${n.NFTokenTaxon}`);
            }
        }
        catch (err) {
            console.log(err);
            await wait(12000);
        }
    });
    for (const c of Collections) {
        const s = c.split(':')
        const collection = { issuer: s[0], taxon: s[1], floor: 0 };
        try {
            const result = await axios.get(`https://api.xrpldata.com/api/v1/xls20-nfts/stats/issuer/${s[0]}/taxon/${s[1]}`);
            for (const r of result.data.data.collection_info.floor) {
                if (r.currency === "XRP") collection.floor = parseInt(xrpl.dropsToXrp(r.amount));
            }
            await setCollection(collection);
            await wait(10000);
        }
        catch (err) {
            console.log(err);
            await wait(12000);
        }
    }

    return;
}
