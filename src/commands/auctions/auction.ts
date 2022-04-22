import { CommandInteraction, EmbedFieldData, MessageEmbed } from 'discord.js';
import { Discord, Slash, SlashGroup, SlashOption } from 'discordx';
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

    const auctionFields: EmbedFieldData[] = [];

    await Promise.all(
      auctions.map(async auction => {
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

    const totalPrice = auctions.reduce((accumulator, auction) => {
      return accumulator + auction.price;
    }, 0);

    const embed = new MessageEmbed()
      .setColor('#555555')
      .setTitle(`${username}'s auctions`)
      .setThumbnail(`https://mc-heads.net/body/${id}/left`)
      .setDescription(
        `Value: **${millify(totalPrice, {
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
          value: `${auctions.length}`,
          inline: true,
        },
      ])
      .setFooter({
        text: 'Made with 🖤 by Ian Libânio.',
        iconURL: 'https://github.com/ianlibanio.png',
      });

    interaction.editReply({
      embeds: [embed],
    });
  }
}
