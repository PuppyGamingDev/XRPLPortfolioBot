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
            const client = await getXRPClient();
            const response = await client.request({
                command: "account_nfts",
                account: u,
                ledger_index: "validated",
            });
            client.disconnect();
            const nftsall = response.result.account_nfts;
            for (const n of nftsall) {
                if (!Collections.includes(`${n.Issuer}:${n.NFTokenTaxon}`)) {
                    const collection = { issuer: n.Issuer, taxon: n.NFTokenTaxon, floor: 0 };
                    const result = await axios.get(`https://api.xrpldata.com/api/v1/xls20-nfts/stats/issuer/${n.Issuer}/taxon/${n.NFTokenTaxon}`);
                    for (const c of result.data.data.collection_info.floor) {
                        if (c.currency === "XRP") collection.floor = parseInt(xrpl.dropsToXrp(c.amount));
                    }
                    Collections.push(`${n.Issuer}:${n.NFTokenTaxon}`);
                    await setCollection(collection);
                    await wait(6000);
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
