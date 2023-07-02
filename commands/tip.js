const { SlashCommandBuilder, EmbedBuilder, Colors } = require('discord.js');
const { getXUMM } = require('../utilities/Connections')
const xrpl = require('xrpl')


module.exports = {
    data: new SlashCommandBuilder()
        .setName('tip')
        .setDescription('Tip the Developer')
        .addStringOption(option => option.setName('amount').setDescription('Amount of XRP to tip').setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true })
        var amount = parseFloat(interaction.options.getString('amount'))

        try {
            const xumm = getXUMM()
            // Build XUMM Payload and subscribe to it
            const request = {
                "TransactionType": "Payment",
                "Destination": "rm2AEVUcxeYh6ZJUTkWUqVRPurWdn4E9W",
                "Amount": xrpl.xrpToDrops(amount),
                "Memos": [
                    {
                        "Memo": {
                            "MemoData": Buffer.from(`Tipping the Dev from Portfolio Bott`).toString('hex')
                        }
                    }
                ]
            }

            const subscription = await xumm.payload.createAndSubscribe(request, async event => {
                if (event.data.signed === true) {
                    return event.data
                }
                if (event.data.signed === false) {
                    return false
                }
            })
            
            const transactEmbed = new EmbedBuilder()
                .setTitle(`Tip the Developer`)
                .setDescription(`Sign your transaction to tip`)
                .setColor(Colors.Gold)
                .setFields(
                    { name: `Transaction Link`, value: `[Click Here](${subscription.created.next.always})` }
                )
                .setImage(subscription.created.refs.qr_png);

            await interaction.editReply({ embeds: [transactEmbed], ephemeral: true })

            const resolveData = await subscription.resolved
            if (resolveData === false) {
                await interaction.editReply({ content: `The transaction signing was rejected or failed`, embeds: [], ephemeral: true })
                return
            }
            const result = await xumm.payload.get(resolveData.payload_uuidv4)

            if (result.response.dispatched_nodetype === 'MAINNET' && result.meta.resolved === true) {
                await interaction.editReply({ content: `Succesfully tipped, I hugely appreciate it!`, embeds: [], ephemeral: true })
                return
            }
            else {
                await interaction.editReply({ content: `There seems to have been an issue verifying the transaction`, embeds: [], ephemeral: true })
                return
            }

        } catch (err) {
            console.log(err)
            await interaction.editReply({ content: `There seems to have been an issue verifying or creating the transaction.`, embeds: [], ephemeral: true })
            return
        }

    },
};