import { CommandInteraction, MessageEmbed } from 'discord.js';
import { Discord, Slash, SlashOption } from 'discordx';

import { fetchId } from '../../utils/playerDB';

@Discord()
export class RenderCommand {
  @Slash('render')
  async execute(
    @SlashOption('player', {
      description: 'Player you want to render.',
      required: true,
      type: 'STRING',
    })
    player: string,
    interaction: CommandInteraction,
  ) {
    const {
      data: {
        player: { username, id },
      },
    } = await fetchId(player);

    const embed = new MessageEmbed()
      .setColor('#555555')
      .setTitle(`${username}'s body render`)
      .setImage(`https://mc-heads.net/body/${id}`)
      .setDescription('Here it is your render.')
      .setFooter({
        text: 'Made with 🖤 by Ian Libânio.',
        iconURL: 'https://github.com/ianlibanio.png',
      });

    interaction.reply({
      embeds: [embed],
    });
  }
}
