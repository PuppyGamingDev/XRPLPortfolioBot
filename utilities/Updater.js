require("dotenv/config");
const axios = require("axios");
const { getUsers, setCollection } = require("./Storage");
const schedule = require("node-schedule");
const { getXRPClient } = require("./Connections");
const xrpl = require("xrpl");
const wait = (t) => new Promise((s) => setTimeout(s, t, t));

const job = schedule.scheduleJob("*/20 * * * *", async function () {
    await RunUpdate();
});

async function RunUpdate() {
    const users = getUsers();

    const Collections = [];
    users.forEach(async (u) => {
        try {
            var nftsall = []
            var marker = 1
            while (marker !== null) {
                var request = {
                    command: "account_nfts",
                    account: wallet,
                    ledger_index: "validated",
                    limit: 1000,
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
            for (const n of nftsall) {
                if (!Collections.includes(`${n.Issuer}:${n.NFTokenTaxon}`)) {
                    const collection = { issuer: n.Issuer, taxon: n.NFTokenTaxon, floor: 0 };
                    const result = await axios.get(`https://api.xrpldata.com/api/v1/xls20-nfts/stats/issuer/${n.Issuer}/taxon/${n.NFTokenTaxon}`);
                    for (const c of result.data.data.collection_info.floor) {
                        if (c.currency === "XRP") collection.floor = parseInt(xrpl.dropsToXrp(c.amount));
                    }
                    Collections.push(`${n.Issuer}:${n.NFTokenTaxon}`);
                    await setCollection(collection);
                    await wait(10000);
                }
            }
        }
        catch (err) {
            console.log(err);
           await wait(6000);
        }
    });

    return;
}
