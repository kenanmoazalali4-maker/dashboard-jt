/**
 * FiveM HTTP API Client
 * Communicates with the FiveM resource via HTTP
 */

const FIVEM_URL = process.env.FIVEM_SERVER_URL || 'http://localhost:30120';
const RESOURCE_NAME = process.env.FIVEM_RESOURCE_NAME || 'admin-dashboard';
const API_KEY = process.env.FIVEM_API_KEY || '';

async function fivemRequest(path: string, options: RequestInit = {}) {
  const url = `${FIVEM_URL}/${RESOURCE_NAME}${path}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        ...options.headers,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`FiveM API error: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } catch (error: any) {
    console.error(`FiveM API request failed: ${path}`, error.message);
    return null;
  }
}

// =============================================
// Server Status
// =============================================

export async function getServerStatus() {
  // Use the standard FiveM info endpoint
  try {
    const [info, players] = await Promise.all([
      fetch(`${FIVEM_URL}/info.json`, { cache: 'no-store' }).then(r => r.json()).catch(() => null),
      fetch(`${FIVEM_URL}/players.json`, { cache: 'no-store' }).then(r => r.json()).catch(() => null),
    ]);

    return {
      online: true,
      hostname: info?.vars?.sv_projectName || info?.vars?.sv_hostname || 'Unknown',
      players: players?.length || 0,
      maxPlayers: info?.vars?.sv_maxClients ? parseInt(info.vars.sv_maxClients) : 32,
    };
  } catch {
    return {
      online: false,
      hostname: 'Unknown',
      players: 0,
      maxPlayers: 0,
    };
  }
}

// =============================================
// Online Players
// =============================================

export async function getOnlinePlayers() {
  return fivemRequest('/api/players/online');
}

// =============================================
// Player Actions
// =============================================

export async function killPlayer(serverId: number) {
  return fivemRequest(`/api/players/${serverId}/kill`, { method: 'POST' });
}

export async function kickPlayer(serverId: number, reason: string) {
  return fivemRequest(`/api/players/${serverId}/kick`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function getPlayerInventory(serverId: number) {
  return fivemRequest(`/api/players/${serverId}/inventory`);
}

export async function givePlayerItem(serverId: number, item: string, amount: number) {
  return fivemRequest(`/api/players/${serverId}/give-item`, {
    method: 'POST',
    body: JSON.stringify({ item, amount }),
  });
}

export async function setPlayerJob(serverId: number, job: string, grade: number) {
  return fivemRequest(`/api/players/${serverId}/set-job`, {
    method: 'POST',
    body: JSON.stringify({ job, grade }),
  });
}

// =============================================
// Vehicle Actions
// =============================================

export async function addVehicleToPlayer(citizenid: string, vehicle: string, plate: string) {
  return fivemRequest('/api/vehicles/add', {
    method: 'POST',
    body: JSON.stringify({ citizenid, vehicle, plate }),
  });
}

export async function spawnVehicle(serverId: number, vehicle: string) {
  return fivemRequest(`/api/vehicles/spawn`, {
    method: 'POST',
    body: JSON.stringify({ serverId, vehicle }),
  });
}

// =============================================
// Ban Actions
// =============================================

export async function banPlayerOnline(serverId: number, reason: string, duration: number, bannedBy: string) {
  return fivemRequest(`/api/players/${serverId}/ban`, {
    method: 'POST',
    body: JSON.stringify({ reason, duration, bannedBy }),
  });
}
