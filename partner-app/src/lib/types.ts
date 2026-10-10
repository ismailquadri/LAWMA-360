// Mirrors the vocabulary of customer-app/src/store.tsx so the Live Link
// protocol and demo data stay consistent across both apps.

export type BinState = 'Requested' | 'Allocated' | 'Out for delivery' | 'Delivered' | 'Active';
export type Bin = { id: string; size: number; state: BinState };

export type PickupStatus =
  | 'Requested'
  | 'Accepted'
  | 'Scheduled'
  | 'Collected'
  | 'Completed'
  | 'Declined'
  | 'Cancelled';

export type Pickup = {
  id: string;
  status: PickupStatus;
  amount: number;
  created: string;
  window: string;
  partner: string;
  evidence?: string;
  customerId: string;
  crew?: string;
};

export type EntryKind = 'credit' | 'reserved' | 'paid' | 'released';
export type Entry = { id: string; title: string; amount: number; time: string; kind: EntryKind };

export type IssueStatus = 'Open' | 'In review' | 'Resolved';
export type Issue = { id: string; type: string; detail: string; status: IssueStatus; time: string; reply?: string };

export type SupportMessage = { id: string; role: 'assistant' | 'customer'; text: string; time?: string };

export type BinRequestKind = 'new' | 'additional';
export type BinRequest = {
  id: string;
  customerId: string;
  kind: BinRequestKind;
  size: number;
  status: 'Pending' | 'Approved' | 'Declined';
  time: string;
};

export type Customer = {
  id: string;
  name: string;
  address: string;
  area: 'Ajah' | 'Ikeja' | 'Lekki';
  phone: string;
  status: 'Active' | 'Attention needed';
  bins: Bin[];
  balance: number;
  reserved: number;
  pickups: Pickup[];
  entries: Entry[];
  issues: Issue[];
  notices: string[];
  supportMessages: SupportMessage[];
};

export type Crew = { id: string; name: string; plate: string; members: string[] };

export type RouteStop = {
  id: string;
  crewId: string;
  customerId: string;
  pickupId: string;
  address: string;
  window: string;
  done: boolean;
};

export type Settlement = { ref: string; date: string; amount: number; partnerShare: number; authorityShare: number };

export type ActivityEvent = { id: string; time: string; text: string; customerId?: string };

export type PartnerProfile = {
  name: string;
  areas: string;
  contact: string;
  notifyRequests: boolean;
  notifyMessages: boolean;
  notifyRemittance: boolean;
};

export type PartnerModel = {
  customers: Customer[];
  crews: Crew[];
  routeStops: RouteStop[];
  binRequests: BinRequest[];
  settlements: Settlement[];
  activity: ActivityEvent[];
  lawmaThread: SupportMessage[];
  earningsUncaptured: number; // accumulated due to LAWMA, pending remittance
  profile: PartnerProfile;
};
