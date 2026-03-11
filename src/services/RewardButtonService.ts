import {
  Client,
  TextChannel,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Message,
} from 'discord.js';
import { REWARD_CHANNEL_ID } from '../config';

const CUSTOM_ID_CLAIM = 'reward_claim_button';
const CUSTOM_ID_VIEW_CLAIMED = 'reward_view_claimed_button';

export class RewardButtonService {
  private client: Client | null = null;
  private buttonMessageId: string | null = null;

  public start(client: Client): void {
    this.client = client;
    if (client.isReady()) {
      this.ensureButton(client).catch((e) =>
        console.error('[RewardButtonService] Error:', e)
      );
    } else {
      client.once('ready', () => {
        this.ensureButton(client as Client<true>).catch((e) =>
          console.error('[RewardButtonService] Error:', e)
        );
      });
    }
    setInterval(() => {
      if (client.isReady()) {
        this.ensureButton(client).catch(() => {});
      }
    }, 3 * 60 * 1000);
  }

  private async ensureButton(client: Client<true>): Promise<void> {
    if (!REWARD_CHANNEL_ID || !/^\d{17,19}$/.test(REWARD_CHANNEL_ID)) {
      return;
    }
    try {
      const channel = await client.channels.fetch(REWARD_CHANNEL_ID);
      if (!channel?.isTextBased() || channel.isDMBased()) return;
      const textChannel = channel as TextChannel;

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('🎁 Claim Reward')
        .setDescription(
          'If you are a winner, click **Claim reward** to receive your reward.\n' +
          'Already claimed but closed the message? Use **View my claimed rewards** to see your link or code again.'
        )
        .setFooter({ text: 'Reward Claim Bot' })
        .setTimestamp();

      const claimBtn = new ButtonBuilder()
        .setCustomId(CUSTOM_ID_CLAIM)
        .setLabel('Claim reward')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🎁');
      const viewClaimedBtn = new ButtonBuilder()
        .setCustomId(CUSTOM_ID_VIEW_CLAIMED)
        .setLabel('View my claimed rewards')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📋');

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(claimBtn, viewClaimedBtn);

      let message: Message | null = null;
      if (this.buttonMessageId) {
        try {
          const existing = await textChannel.messages.fetch(this.buttonMessageId);
          if (existing?.author?.id === client.user.id) message = existing;
          else this.buttonMessageId = null;
        } catch {
          this.buttonMessageId = null;
        }
      }
      if (!message) {
        const messages = await textChannel.messages.fetch({ limit: 30 });
        for (const [, m] of messages) {
          if (m.author.id === client.user.id && m.components.length > 0) {
            const hasOurButton = m.components.some((row) =>
              'components' in row &&
              Array.isArray((row as { components: unknown[] }).components) &&
              (row as { components: { customId?: string }[] }).components.some(
                (c) => c.customId === CUSTOM_ID_CLAIM
              )
            );
            if (hasOurButton) {
              message = m;
              this.buttonMessageId = m.id;
              break;
            }
          }
        }
      }

      if (message) {
        await message.edit({ embeds: [embed], components: [row] });
      } else {
        const sent = await textChannel.send({
          embeds: [embed],
          components: [row],
        });
        this.buttonMessageId = sent.id;
        console.log('[RewardButtonService] Button message sent:', sent.id);
      }
    } catch (err) {
      console.error('[RewardButtonService] ensureButton error:', err);
    }
  }

  public stop(): void {
    this.buttonMessageId = null;
  }
}
