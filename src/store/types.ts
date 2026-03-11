export type RewardType = 'nitro' | 'steam';

export interface Reward {
  id: string;
  label: string;
  type: RewardType;
  payload: string;
  assignedUserId: string;
}

export type ClaimedMap = Record<string, string>; // rewardId -> userId
