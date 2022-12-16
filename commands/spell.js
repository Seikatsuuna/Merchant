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

// kanged; I wish languages had this by default lmao
function toTitleCase(str) {
    return str.replace(
      /\w\S*/g,
      function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      }
    );
  }

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
	async execute(interaction) {
        let hidden = true;
        if(interaction.options.getBoolean('show')) hidden = false;

        // this avoids some niche situations where the interaction would get two replies... fucky but it technically works is becoming my motto
        await interaction.reply({content: "Searching...", ephemeral: hidden})

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
            
            // check classes/class variants if they exist to be passed into embed
            let classes = spell.classes.fromClassList;
            if(spell.classes.fromClassListVariant) {
                for(i in spell.classes.fromClassListVariant) {
                    // this ensures that classes aren't repeated while checking for variants
                    if(!classes.map(a => a.name).includes(spell.classes.fromClassListVariant[i].name)) {
                        classes.push(i)
                    }
                }
            }

            // checks if cantrip to replace level text, since "level 0" looks kinda shit
            let levelText = "Level " + spell.level;
            if(spell.level == 0) {
                levelText = "Cantrip"
            }

            //check for range/determine how to display it
            let rangeText = toTitleCase(spell.range.distance.type);
            if(spell.range.distance.amount) {
                rangeText = `${spell.range.distance.amount} ${spell.range.distance.type}`
            }

            // check if spell is an action/BA; make it look prettier if so
            let castTimeText = `${spell.time[0].number} ${spell.time[0].unit}`
            if(spell.time[0].unit === "action") {
                castTimeText = "Action"
            } else if (spell.time[0].unit === "bonus") {
                castTimeText = "Bonus action"
            }

            // really scuffed way of deciding how to display components; there's probably a way more competent way to go about this so thanks in advance for fixing it future me
            let components = []
            if(spell.components.v) {
                components.push("V")
            }
            if(spell.components.s) {
                components.push("S")
            }
            // some niche spells have material components in an object??? just default to the text
            if(spell.components.m) {
                if(spell.components.m.text) {
                    components.push(`M (${spell.components.m.text})`)
                } else {
                    components.push(`M (${spell.components.m})`)
                }

            }
            let componentsText = components.join(", ")

            // figure out how to display the duration, make it look not shit if instantaneous
            let durationText = spell.duration[0].type
            if(durationText === "instant") {
                durationText = "Instantaneous"
            } else if (durationText === "timed") {
                durationText = `${spell.duration[0].duration.amount} ${spell.duration[0].duration.type}`
            }

            // generate and send embed
            const embed = new EmbedBuilder()
            .setTitle(spell.name)
            .setDescription(`*${levelText} ${school} (${classes.map(a => a.name).join(', ')})*`)
            .setColor(color)
            .addFields(
                {name: "Casting Time", value: castTimeText, inline: true},
                {name: "Range", value: rangeText, inline: true},
                {name: "Components", value: componentsText, inline: true},
                {name: "Duration", value: durationText},
            )
            .setFooter({ text: `${spell.source} - Page ${spell.page}`})

            // spell description embedding..... this is a minor nightmare and requires more than my 5 minutes of allotted productivity for a week so slapping a fat TODO on this for now
            let descriptionEntries = []
            spell.entries.forEach(entry => {
                if(entry.type) {
                    if(entry.type === "entries") {
                        descriptionEntries.push(`**${entry.name}**\n${entry.entries.join("\n")}`)
                    }
                    // TODO: tables; check for other weird entry types
                } else {
                    descriptionEntries.push(entry)
                }
            })

            let description = descriptionEntries.join("\n\n")
            let descriptionFields = []
            // handle descriptions over 1024 chars into multiple fields, could be polished a bit but it works??? may have to update if spells break 6k chars
            if(description.length > 1024) {
                // this is a roundabout way to make sure lines don't get cut off by field limits
                let stop = 1024
                if(description.substring(1019, 1024) !== "\n\n") {
                    stop = description.substring(0, 1024).lastIndexOf("\n\n")
                }
                let leftoverText = description.substring(stop, description.length);
                descriptionFields.push({name: "Description", value: description.substring(0, stop)})
                while(leftoverText.length > 0) {
                    if(leftoverText.length > 1024) {
                        let stop = 1024
                        if(leftoverText.substring(1019, 1024) !== "\n\n") {
                            stop = leftoverText.substring(0, 1024).lastIndexOf("\n\n")
                        }
                        descriptionFields.push({name: "\u200b", value: leftoverText.substring(0, stop)})
                        leftoverText = leftoverText.substring(stop, leftoverText.length)
                    } else {
                        descriptionFields.push({name: "\u200b", value: leftoverText})
                        leftoverText = ""
                    }
                }
            } else {
                descriptionFields.push({name: "Description", value: description})
            }
            embed.addFields(descriptionFields)

            // edit the initial reply with our new fancy embed
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