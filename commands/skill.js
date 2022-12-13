const { SlashCommandBuilder } = require('discord.js');
const request = require('request');
const resourceUrl = "https://raw.githubusercontent.com/5etools-mirror-1/5etools-mirror-1.github.io/master/data/skills.json";
let fetchSettings = {json: true};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('skill')
		.setDescription('Get a decription of a skill.')
        .addIntegerOption((option) =>
			option
			.setName('query')
			.setDescription('Which skill do you want a description of?')
			.addChoices(
				{name: 'Acrobatics', value: 0},
				{name: 'Animal Handling', value: 1},
				{name : 'Arcana', value: 2},
				{name : 'Athletics', value: 3},
				{name : 'Deception', value: 4},
				{name : 'History', value: 5},
				{name : 'Insight', value: 6},
				{name : 'Intimidation', value: 7},
				{name : 'Investigation', value: 8},
				{name : 'Medicine', value: 9},
				{name : 'Nature', value: 10},
				{name : 'Perception', value: 11},
				{name : 'Performance', value: 12},
				{name : 'Persuasion', value: 13},
				{name : 'Religion', value: 14},
				{name : 'Sleight of Hand', value: 15},
				{name : 'Stealth', value: 16},
				{name : 'Survival', value: 17},
			)
			.setRequired(true),
		)
		.addBooleanOption((option) => 
			option
			.setName('show')
			.setDescription("Should I post this one publically?")
		),
	async execute(interaction) {
		// fetch JSON from github mirror, pass to body
		request(resourceUrl, fetchSettings, (error, res, body) => {
			if (error) {
				interaction.reply({content: "Failed to import file, yell at Seikatsu.", ephemeral: true});
				return console.log('[IMPORT ERROR] ' + error);
			};
		
			if (!error && res.statusCode == 200) {
				// quirky formatting moment
				let skills = body.skill;
				let skill = skills[interaction.options.getInteger('query')]; 
				let hidden = true;
				if(interaction.options.getBoolean('show')) hidden = false;
				interaction.reply({content: `**${skill.name}**\n\n${skill.entries[0]}`, ephemeral: hidden});
			};
		});
	},
};