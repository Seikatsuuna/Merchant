const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const request = require('request');
// probably a better way of doing this, especially since I already have request
const resources = 
[
    "https://raw.githubusercontent.com/5etools-mirror-1/5etools-mirror-1.github.io/master/data/spells/spells-aag.json",
    "https://raw.githubusercontent.com/5etools-mirror-1/5etools-mirror-1.github.io/master/data/spells/spells-ai.json",
    "https://raw.githubusercontent.com/5etools-mirror-1/5etools-mirror-1.github.io/master/data/spells/spells-xge.json",
    "https://raw.githubusercontent.com/5etools-mirror-1/5etools-mirror-1.github.io/master/data/spells/spells-tce.json",
    "https://raw.githubusercontent.com/5etools-mirror-1/5etools-mirror-1.github.io/master/data/spells/spells-scc.json",
    "https://raw.githubusercontent.com/5etools-mirror-1/5etools-mirror-1.github.io/master/data/spells/spells-llk.json",
    "https://raw.githubusercontent.com/5etools-mirror-1/5etools-mirror-1.github.io/master/data/spells/spells-idrotf.json",
    "https://raw.githubusercontent.com/5etools-mirror-1/5etools-mirror-1.github.io/master/data/spells/spells-ggr.json",
    "https://raw.githubusercontent.com/5etools-mirror-1/5etools-mirror-1.github.io/master/data/spells/spells-ftd.json",
    "https://raw.githubusercontent.com/5etools-mirror-1/5etools-mirror-1.github.io/master/data/spells/spells-egw.json",
    "https://raw.githubusercontent.com/5etools-mirror-1/5etools-mirror-1.github.io/master/data/spells/spells-aitfr-avt.json",
    "https://raw.githubusercontent.com/5etools-mirror-1/5etools-mirror-1.github.io/master/data/spells/spells-phb.json"
];
let fetchSettings = {json: true};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('spell')
		.setDescription('For the love of god do not fucking use this')
        .addStringOption((option) =>
			option
			.setName('query')
			.setDescription('What spell are you looking for?')
			.setRequired(true),
		)
		.addBooleanOption((option) => 
			option
			.setName('show')
			.setDescription("Should I post this one publically?")
		),
	execute(interaction) {
        let hidden = true;
        if(interaction.options.getBoolean('show')) hidden = false;

        // this avoids some niche situations where the interaction would get two replies... fucky but it technically works is becoming my motto
        interaction.reply({content: "Searching...", ephemeral: hidden})

        // FORMATTING & EMBED
        function embedSpell(spell) {
            // find the spell's school, and decide embed color based on said school, default to black
            let color = "#000000"
            let school = "unknown"

            switch(spell.school) {
                case "V":
                    color = "#ff0000"
                    school = "Evocation"
                break;
                case "A":
                    color = "#c0c0c0"
                    school = "Abjuration"
                break;
                case "C":
                    color = "#0080ff"
                    school = "Conjuration"
                break;
                case "D":
                    color = "#f8f8f8"
                    school = "Divination"
                break;
                case "E":
                    color = "#ff80ff"
                    school = "Enchantment"
                break;
                case "I":
                    color = "#b468ff"
                    school = "Illusion"
                break;
                case "N":
                    color = "#050505"
                    school = "Necromancy"
                break;
                case "T":
                    color = "#00ff40"
                    school = "Transmutation"
                break;
            }
            
            const embed = new EmbedBuilder()
            .setTitle(spell.name)
            .setColor(color)
            return interaction.editReply({content: "", embeds: [embed]})
        }

        // SEARCH
        let posSpells = []
        let search = interaction.options.getString('query').toLowerCase()
        // this is worse, nevermind :(
        let resourceAmount = resources.length;
        let currentResource = 0;
        // this might be top tier shitcode, iterate through each JSON to search
        Promise.all(resources.map(async (resourceUrl) => {
                request(resourceUrl, fetchSettings, (error, res, body) => {
                    if (error) {
                        interaction.editReply({content: `Ran into some trouble, please yell at Seikatsu.\n\nFailed to import file: \`${resourceUrl}\``, ephemeral: true});
                        return console.log('[IMPORT ERROR] ' + error);
                    };
                    
                    if (res.statusCode == 200) {
                        let spells = body.spell
                        // search for spells matching the query
                        for(i in spells) {
                            // if a perfect match is found, stop searching
                            if(spells[i].name.toLowerCase() === search) {
                                return embedSpell(spells[i]);
                            }
                            // otherwise, add any partial matches to posSpells
                            if(spells[i].name.toLowerCase().includes(search)) {
                                posSpells.push(spells[i]);
                            }
                        }
                        currentResource++;
                        if(currentResource == resourceAmount) {
                            getResults();
                        }
                    };
                });
            }));
            // this is the worst thing I have ever written
            function getResults() {
                // if there is a single match, embed that spell
                if(posSpells.length === 1) {
                    return embedSpell(posSpells[0]);
                }

                // if there is more than one posSpell, return a list
                else if(posSpells.length > 1) {
                    let messageList = "";
                    for(i in posSpells) {
                        messageList = messageList + `\n- ${posSpells[i].name}`
                    }
                    return interaction.editReply({content: `**More than one result found:**${messageList}`})
                }

                // if there are no posSpells, return spell not found
                else if(posSpells.length === 0) {
                    return interaction.editReply({content: "Spell not found..."})
                }

                else {
                    return interaction.editReply({content: "Something went horribly wrong."})
                }
            }
	},
};