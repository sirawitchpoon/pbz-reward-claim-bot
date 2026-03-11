import {
  Events,
  Interaction,
  ButtonInteraction,
  StringSelectMenuInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  MessageFlags,
  ButtonStyle,
} from 'discord.js';
import {
  getUnclaimedRewardsForUser,
  getClaimedRewardsForUser,
  getRewardById,
  claimReward,
  reloadFromDisk,
} from '../store/rewards';
import { logRewardClaimed } from '../store/activityLog';

const REWARD_CLAIM_BUTTON = 'reward_claim_button';
const REWARD_VIEW_CLAIMED_BUTTON = 'reward_view_claimed_button';
const REWARD_CLAIM_CONFIRM_PREFIX = 'reward_claim_confirm_';
const REWARD_SELECT_PREFIX = 'reward_select_';

export const name = Events.InteractionCreate;

export async function execute(interaction: Interaction): Promise<void> {
  if (interaction.isButton()) {
    if (interaction.customId === REWARD_CLAIM_BUTTON) {
      await handleClaimButton(interaction);
      return;
    }
    if (interaction.customId === REWARD_VIEW_CLAIMED_BUTTON) {
      await handleViewClaimedButton(interaction);
      return;
    }
    if (interaction.customId.startsWith(REWARD_CLAIM_CONFIRM_PREFIX)) {
      const rewardId = interaction.customId.slice(REWARD_CLAIM_CONFIRM_PREFIX.length);
      await handleConfirmClaim(interaction, rewardId);
      return;
    }
  }

  if (interaction.isStringSelectMenu() && interaction.customId.startsWith(REWARD_SELECT_PREFIX)) {
    const rewardId = interaction.values[0];
    if (rewardId) await handleSelectReward(interaction, rewardId);
    return;
  }
}

const DISCORD_CONTENT_LIMIT = 2000;

async function handleViewClaimedButton(interaction: ButtonInteraction): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const userId = interaction.user.id;
  reloadFromDisk();
  const list = getClaimedRewardsForUser(userId);

  if (list.length === 0) {
    await interaction.editReply({
      content: 'You have no previously claimed rewards. If you just claimed one and closed the message, it may take a moment — try again in a few seconds.',
    });
    return;
  }

  const parts = list.map((r) => {
    const type = String(r.type || '').toLowerCase();
    if (type === 'nitro') {
      return `🎁 **${r.label}**\nLink: ${r.payload}\n`;
    }
    return `🎁 **${r.label}**\nCode: \`${r.payload}\`\n(Use in Steam: Games > Redeem a Steam Wallet Code)\n`;
  });

  let content = '**Your previously claimed rewards** (only you can see this):\n\n' + parts.join('\n---\n\n');
  if (content.length > DISCORD_CONTENT_LIMIT) {
    const first = content.slice(0, DISCORD_CONTENT_LIMIT - 20) + '\n… (truncated)';
    await interaction.editReply({ content: first });
    let rest = content.slice(DISCORD_CONTENT_LIMIT - 20);
    while (rest.length > 0) {
      const chunk = rest.length > DISCORD_CONTENT_LIMIT ? rest.slice(0, DISCORD_CONTENT_LIMIT - 1) + '…' : rest;
      rest = rest.length > DISCORD_CONTENT_LIMIT ? rest.slice(DISCORD_CONTENT_LIMIT - 1) : '';
      await interaction.followUp({ content: chunk, flags: MessageFlags.Ephemeral }).catch(() => {});
    }
    return;
  }
  await interaction.editReply({ content });
}

async function handleClaimButton(interaction: ButtonInteraction): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const userId = interaction.user.id;
  const list = getUnclaimedRewardsForUser(userId);

  if (list.length === 0) {
    await interaction.editReply({
      content: 'You have no rewards to claim at this time.',
    });
    return;
  }

  function buildRewardEmbedAndButton(r: { id: string; label: string }) {
    const embed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle('🎁 Your reward')
      .setDescription(`**${r.label}**`)
      .setFooter({ text: 'Click below to claim' })
      .setTimestamp();
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(REWARD_CLAIM_CONFIRM_PREFIX + r.id)
        .setLabel('Claim this reward')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅')
    );
    return { embed, row };
  }

  if (list.length === 1) {
    const { embed, row } = buildRewardEmbedAndButton(list[0]);
    await interaction.editReply({ embeds: [embed], components: [row] });
    return;
  }

  const first = buildRewardEmbedAndButton(list[0]);
  await interaction.editReply({
    content: `You have **${list.length}** rewards. Claim each one below:`,
    embeds: [first.embed],
    components: [first.row],
  });
  for (let i = 1; i < list.length; i++) {
    const { embed, row } = buildRewardEmbedAndButton(list[i]);
    await interaction.followUp({
      embeds: [embed],
      components: [row],
      flags: MessageFlags.Ephemeral,
    }).catch(() => {});
  }
}

async function handleSelectReward(
  interaction: StringSelectMenuInteraction,
  rewardId: string
): Promise<void> {
  await interaction.deferUpdate();
  const userId = interaction.user.id;
  const reward = getRewardById(rewardId);
  if (!reward || reward.assignedUserId !== userId) {
    await interaction.followUp({
      content: 'Reward not found or you are not assigned.',
      flags: MessageFlags.Ephemeral,
    }).catch(() => {});
    return;
  }
  if (claimReward(rewardId, userId)) {
    logRewardClaimed(rewardId, reward.label, userId, interaction.user.username ?? interaction.user.tag);
    await sendRewardPayload(interaction, reward, true);
  } else {
    await interaction.followUp({
      content: 'This reward was already claimed.',
      flags: MessageFlags.Ephemeral,
    }).catch(() => {});
  }
}

async function handleConfirmClaim(
  interaction: ButtonInteraction,
  rewardId: string
): Promise<void> {
  await interaction.deferUpdate();
  const userId = interaction.user.id;
  const reward = getRewardById(rewardId);
  if (!reward || reward.assignedUserId !== userId) {
    await interaction.followUp({
      content: 'Reward not found or you are not assigned.',
      flags: MessageFlags.Ephemeral,
    }).catch(() => {});
    return;
  }
  if (!claimReward(rewardId, userId)) {
    await interaction.followUp({
      content: 'This reward was already claimed.',
      flags: MessageFlags.Ephemeral,
    }).catch(() => {});
    return;
  }
  logRewardClaimed(rewardId, reward.label, userId, interaction.user.username ?? interaction.user.tag);
  await sendRewardPayload(interaction, reward, false);
}

async function sendRewardPayload(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  reward: { label: string; type: string; payload: string },
  isSelect: boolean
): Promise<void> {
  const content =
    reward.type === 'nitro'
      ? `🎁 **${reward.label}**\n\nHere is your Discord Nitro link:\n${reward.payload}\n\nClick the link to redeem.`
      : `🎁 **${reward.label}**\n\nHere is your Steam Gift Card code:\n\`${reward.payload}\`\n\nUse in Steam: Games > Redeem a Steam Wallet Code.`;

  if (isSelect) {
    await (interaction as StringSelectMenuInteraction).editReply({
      content: '✅ Reward claimed. See below:\n\n' + content,
      components: [],
    }).catch(() => {});
    return;
  }
  await (interaction as ButtonInteraction).editReply({
    content: '✅ Your reward:\n\n' + content,
    embeds: [],
    components: [],
  }).catch(() => {});
}
