const { SlashCommandBuilder, EmbedBuilder, Colors } = require("discord.js");
const { getUserWallet, getCollection, tokenValue } = require("../utilities/Storage");
const { getXRPClient } = require("../utilities/Connections");
const xrpl = require('xrpl');

module.exports = {
    cooldown: 30,
    data: new SlashCommandBuilder().setName("portfolio").setDescription("Get your approximate portfolio value from your linked wallet"),
    async execute(interaction) {
        await interaction.deferReply();
        const wallet = getUserWallet(interaction.user.id);
        if (!wallet || wallet === undefined) {
            await interaction.editReply({ content: `Sorry but you need to link your wallet first with the /link command` });
            return;
        }
        const client = await getXRPClient();
        try {
            var nftsall = []
            var marker = 1
            while (marker !== null) {
                var request = {
                    command: "account_nfts",
                    account: wallet,
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
            
            const accountresponse = await client.request({
                command: "account_info",
                account: wallet,
                ledger_index: "validated",
            });
            const linesresponse = await client.request({
                command: "account_lines",
                account: wallet,
            });
            client.disconnect();
            const collections = {}
            const lines = linesresponse.result.lines;
            var tokentotals = 0;
            if (lines.length > 0) {
                lines.forEach(l => {
                    const value = tokenValue(`${l.account}:${l.currency}`)
                    if (value !== undefined) {
                        tokentotals += parseFloat(l.balance) * parseFloat(value)
                    }
                });
            }
            nftsall.forEach(async (n) => {
                if (!collections[`${n.Issuer}:${n.NFTokenTaxon}`] || collections[`${n.Issuer}:${n.NFTokenTaxon}`] === undefined) {
                    collections[`${n.Issuer}:${n.NFTokenTaxon}`] = 1
                }
                else {
                    collections[`${n.Issuer}:${n.NFTokenTaxon}`]++
                }
            });
            const balance = parseInt(xrpl.dropsToXrp(parseInt(accountresponse.result.account_data.Balance)));

            const keys = Object.keys(collections);
            var totalvalue = 0;
            for (const k of keys) {
                const c = getCollection(k);
                if (!c || c === undefined) continue;
                const amount = collections[k];
                totalvalue += amount * c.floor;
            }
            const overall = totalvalue + balance + tokentotals;
            const portEmbed = new EmbedBuilder()
                .setTitle(interaction.user.username)
                .setDescription(`Here is the estimated figures for your wallet:\n\nYou wallet is worth: **${overall.toFixed(4)}** XRP\nWhile holding a total of: **${nftsall.length}** NFTs worth: **${totalvalue}** XRP\nCurrently: **${balance}** XRP\nAnd **${tokentotals.toFixed(4)}** XRP in **${lines.length}** TrustLines\n\n*(if you recently linked and introduced new collections, these may be awaiting data)*`);

            await interaction.editReply({ embeds: [portEmbed] });
            return;
        } catch (err) {
            console.log(err);
            await interaction.editReply({ content: `Uh Oh Spaghettio! I hit an error sorry :'(` });
            return;
        }
    },
};
