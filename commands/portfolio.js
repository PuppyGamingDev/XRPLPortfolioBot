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

            const totaltext = `__**Total:**__ *${overall.toFixed(2)} XRP*`;
            const xrptext = `__**Balance:**__ *${balance} XRP*`;
            const nftstext = `__**NFTs Balance:**__ *${totalvalue.toFixed(2)} XRP* from *${nftsall.length} NFTs*`;
            const tokenstext = `__**Tokens Balance:**__ *${tokentotals.toFixed(2)} XRP* from *${lines.length} TrustLines*`;

            const portEmbed = new EmbedBuilder()
                .setTitle(interaction.user.username)
                .setDescription(`**Here are your estimated portfolio figures**\n\n${totaltext}\n\n${xrptext}\n\n${nftstext}\n\n${tokenstext}\n\n*(if you recently linked and introduced new collections, these may be awaiting data)*`);

            await interaction.editReply({ embeds: [portEmbed] });
            return;
        } catch (err) {
            console.log(err);
            await interaction.editReply({ content: `Uh Oh Spaghettio! I hit an error sorry :'(` });
            return;
        }
    },
};
