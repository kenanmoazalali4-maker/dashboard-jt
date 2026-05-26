// =============================================
// Permission System
// =============================================

export enum Permission {
  VIEW_PLAYERS = 'view_players',
  MANAGE_PLAYERS = 'manage_players',
  KILL_PLAYER = 'kill_player',
  KICK_PLAYER = 'kick_player',
  BAN_PLAYER = 'ban_player',
  UNBAN_PLAYER = 'unban_player',
  VIEW_INVENTORY = 'view_inventory',
  MANAGE_VEHICLES = 'manage_vehicles',
  DELETE_VEHICLE = 'delete_vehicle',
  ADD_VEHICLE = 'add_vehicle',
  VIEW_BANS = 'view_bans',
  MANAGE_BANS = 'manage_bans',
  MANAGE_APPLICATIONS = 'manage_applications',
  MANAGE_STAFF = 'manage_staff',
  VIEW_SETTINGS = 'view_settings',
  MANAGE_SETTINGS = 'manage_settings',
  VIEW_AUDIT_LOG = 'view_audit_log',
  MANAGE_QUEUE = 'manage_queue',
  SUPER_ADMIN = 'super_admin',
}

// =============================================
// Data Types
// =============================================

export interface PlayerData {
  id: number;
  citizenid: string;
  license: string;
  name: string;
  charinfo?: CharInfo;
  money?: MoneyData;
  job?: JobData;
  gang?: GangData;
  position?: { x: number; y: number; z: number };
  metadata?: Record<string, unknown>;
  phone_number?: string;
  last_updated?: string;
}

export interface CharInfo {
  firstname: string;
  lastname: string;
  birthdate: string;
  gender: number;
  nationality: string;
  phone: string;
  account: string;
}

export interface MoneyData {
  cash: number;
  bank: number;
  crypto?: number;
}

export interface JobData {
  name: string;
  label: string;
  payment: number;
  onduty: boolean;
  grade: {
    name: string;
    level: number;
  };
}

export interface GangData {
  name: string;
  label: string;
  grade: {
    name: string;
    level: number;
  };
}

export interface VehicleData {
  id: number;
  citizenid: string;
  vehicle: string;
  hash: string;
  plate: string;
  fakeplate?: string;
  garage: string;
  fuel: number;
  engine: number;
  body: number;
  state: number;
  depotprice: number;
  ownerName?: string;
}

export interface BanData {
  id: number;
  name: string;
  license: string;
  discord: string;
  ip: string;
  reason: string;
  expire: string | null;
  bannedby: string;
  permanent: boolean;
}

export interface StaffData {
  id: number;
  discordId: string;
  username: string;
  avatar: string;
  permissions: string[];
  createdAt: string;
}

export interface ApplicationData {
  id: number;
  applicantName: string;
  applicantDiscord: string;
  applicantAge: number;
  answers: Record<string, string>;
  status: 'pending' | 'approved' | 'rejected';
  reviewerId?: number;
  reviewerNotes?: string;
  createdAt: string;
  reviewer?: StaffData;
}

export interface OnlinePlayer {
  id: number;
  name: string;
  citizenid: string;
  source: number;
  ping: number;
  identifiers: string[];
}

export interface ServerStatus {
  online: boolean;
  players: number;
  maxPlayers: number;
  hostname: string;
  uptime: number;
}

export interface AuditLogEntry {
  id: number;
  staffId: number;
  action: string;
  targetType: string;
  targetId: string;
  details: Record<string, unknown>;
  createdAt: string;
  staff: StaffData;
}

// =============================================
// Session Types
// =============================================

export interface StaffSession {
  id: number;
  discordId: string;
  username: string;
  avatar: string;
  permissions: string[];
}
