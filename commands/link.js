const { SlashCommandBuilder, EmbedBuilder, Colors } = require('discord.js');
const { addUserWallet } = require('../utilities/Storage');
const { getXUMM } = require('../utilities/Connections');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('link')
		.setDescription('Register your wallet so Whitelists can apply to your mints'),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		const xumm = getXUMM();

		try {
			// Create XUMM SignIn transaction
			const request = {
				"TransactionType": "SignIn",
				"Memos": [
					{
						"Memo": {
							"MemoData": Buffer.from(`Portfolio Bot wallet reference. Your Discord ID: ${interaction.user.id}`).toString('hex'),
						},
					},
				],
			};
			const subscription = await xumm.payload.createAndSubscribe(request, async event => {
				if (event.data.signed === true) {
					return event.data;
				}
				if (event.data.signed === false) {
					return false;
				}
			});

			const transactEmbed = new EmbedBuilder()
				.setTitle(`Link your wallet`)
				.setDescription(`Scan or visit the transaction link to continue.`)
				.setColor(Colors.Aqua)
				.setFields(
					{ name: `Transaction Link`, value: `[Click Here](${subscription.created.next.always})` },
				)
				.setImage(subscription.created.refs.qr_png);
			// Send Transaction Link and QR Code
			await interaction.editReply({ embeds: [transactEmbed], ephemeral: true });
			// Await for response
			const resolveData = await subscription.resolved;
			if (resolveData === false) {
				await interaction.editReply({ content: `The transaction signing was rejected or failed`, embeds: [], ephemeral: true });
				return;
			}
			// Get signer wallet address
			const result = await xumm.payload.get(resolveData.payload_uuidv4);
			const sender = result.response.account;
			// Confirm with user and add to Users Map
			await interaction.editReply({ content: `Linked with wallet **${sender}**`, embeds: [], ephemeral: true });
			await addUserWallet(interaction.user.id, sender);
			return;
		}
		catch (err) {
			console.log(err);
			await interaction.editReply({ content: `Ahhh... I seem to have hit an error`, embeds: [], ephemeral: true });
			return;
		}
	},
};