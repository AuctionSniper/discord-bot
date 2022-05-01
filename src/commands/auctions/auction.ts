import {
  ButtonInteraction,
  CommandInteraction,
  EmbedFieldData,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  MessageSelectMenu,
  MessageSelectOptionData,
} from 'discord.js';
import {
  ButtonComponent,
  Discord,
  Slash,
  SlashGroup,
  SlashOption,
} from 'discordx';
import millify from 'millify';
import stringSimilarity from 'string-similarity';

import { fetchAuctions } from '../../utils/hypixelApi';
import { fetchId } from '../../utils/playerDB';

@Discord()
@SlashGroup({ name: 'auction', description: 'Hypixel Skyblock auction' })
@SlashGroup('auction')
export class AuctionGroup {
  @Slash()
  async search(
    @SlashOption('player', {
      description: 'Player which you want to search on auction house.',
      required: true,
      type: 'STRING',
    })
    player: string,
    @SlashOption('filter', {
      description:
        'Filter you want to apply on player auctions, if not provided will display all auctions.',
      required: false,
      type: 'STRING',
    })
    filter: string,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();

    const { id, username } = await fetchId(player);

    let auctions = await fetchAuctions(id, process.env.API_KEY);

    if (filter !== undefined) {
      auctions = auctions.filter(auction => {
        const similarity = stringSimilarity.compareTwoStrings(
          filter.toLowerCase(),
          auction.name.toLowerCase(),
        );

        return similarity >= 0.6;
      });
    }

    const activeAuctions = auctions.filter(auction => {
      return auction.end > Date.now();
    });

    const auctionFields: EmbedFieldData[] = [];

    await Promise.all(
      activeAuctions.map(async auction => {
        const price = millify(auction.price, {
          precision: 3,
          lowercase: true,
        });

        const endTime = Math.round(auction.end / 1000);

        auctionFields.push({
          name: auction.name,
          value: `Price: **${price}**\nEnds: <t:${endTime}:R>\nRarity: **${auction.tier}**`,
          inline: false,
        });
      }),
    );

    const activePrice = activeAuctions.reduce((accumulator, auction) => {
      return accumulator + auction.price;
    }, 0);

    const embed = new MessageEmbed()
      .setColor('#555555')
      .setTitle(`${username}'s auctions`)
      .setThumbnail(`https://mc-heads.net/body/${id}/left`)
      .setDescription(
        `Value: **${millify(activePrice, {
          precision: 3,
          lowercase: true,
        })}**`,
      )
      .addFields(auctionFields)
      .addFields([
        {
          name: 'Player',
          value: username,
          inline: true,
        },
        {
          name: 'Results',
          value: `${activeAuctions.length}`,
          inline: true,
        },
      ])
      .setFooter({
        text: 'Made with 🖤 by Ian Libânio.',
        iconURL: 'https://github.com/ianlibanio.png',
      });

    const endedButton = new MessageButton()
      .setLabel('Ended Auctions')
      .setEmoji('📑')
      .setStyle('PRIMARY')
      .setCustomId(`ended-button_${id}`)
      .setDisabled(auctions.length === activeAuctions.length);

    const visualizeOptions: MessageSelectOptionData[] = [];
    activeAuctions.forEach(auction => {
      visualizeOptions.push({
        label: auction.name,
        value: auction.uuid,
      });
    });

    const visualizeSelectMenu = new MessageSelectMenu()
      .addOptions(visualizeOptions)
      .setCustomId('auction-visualize');

    const row = new MessageActionRow().addComponents(
      endedButton,
      visualizeSelectMenu,
    );

    await interaction.editReply({
      embeds: [embed],
      components: [row],
    });
  }

  @ButtonComponent(/((ended-button_)[^\s]*)\b/gm)
  async endedButton(interaction: ButtonInteraction) {
    const [, id] = interaction.customId.split('_');

    const auctions = await fetchAuctions(id, process.env.API_KEY);

    const endedAuctions = auctions.filter(auction => {
      return Date.now() > auction.end;
    });

    if (endedAuctions.length === 0) {
      const embed = new MessageEmbed()
        .setColor('#ff3333')
        .setTitle('Ended auctions')
        .setThumbnail(`https://mc-heads.net/body/${id}/left`)
        .setDescription('No ended auctions found.')
        .setFooter({
          text: 'Made with 🖤 by Ian Libânio.',
          iconURL: 'https://github.com/ianlibanio.png',
        });

      interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    }

    const auctionFields: EmbedFieldData[] = [];

    await Promise.all(
      endedAuctions.map(async auction => {
        const price = millify(auction.price, {
          precision: 3,
          lowercase: true,
        });

        const endTime = Math.round(auction.end / 1000);

        auctionFields.push({
          name: auction.name,
          value: `Price: **${price}**\nEnded: <t:${endTime}>\nRarity: **${auction.tier}**`,
          inline: false,
        });
      }),
    );

    const endedPrice = endedAuctions.reduce((accumulator, auction) => {
      return accumulator + auction.price;
    }, 0);

    const embed = new MessageEmbed()
      .setColor('#555555')
      .setTitle('Ended auctions')
      .setThumbnail(`https://mc-heads.net/body/${id}/left`)
      .setDescription(
        `Value to claim: **${millify(endedPrice, {
          precision: 3,
          lowercase: true,
        })}**`,
      )
      .addFields(auctionFields)
      .addFields([
        {
          name: 'Results',
          value: `${endedAuctions.length}`,
          inline: true,
        },
      ])
      .setFooter({
        text: 'Made with 🖤 by Ian Libânio.',
        iconURL: 'https://github.com/ianlibanio.png',
      });

    interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  }
}
