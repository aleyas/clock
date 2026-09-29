export type Level = {
  id?: string;
  position: number;
  kind: "level" | "break";
  minutes: number;
  sb?: number | null;
  bb?: number | null;
  ante?: number | null;
};

export type Payout = {
  id?: string;
  place: number;
  prize: string;
  visible?: boolean;
};

export type Sponsor = {
  id?: string;
  name: string;
  image_url?: string | null;
  enabled?: boolean;
  display_order?: number;
  interval_seconds?: number;
  duration_seconds?: number;
};

export type Tournament = {
  id: string;
  name: string;
  starting_stack: number;
  total_entries: number;
  entry_fee: number;
  tournament_levels?: Level[];
  payouts?: Payout[];
  sponsors?: Sponsor[];
};