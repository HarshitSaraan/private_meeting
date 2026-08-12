// Utility helpers for local storage, active rooms, and meeting validation

const STORAGE_KEYS = {
  SCHEDULED_MEETINGS: 'meet_scheduled_v1',
  ACTIVE_ROOMS: 'meet_active_rooms_v1',
  USER_PROFILE: 'meet_user_profile_v1'
};

export function getScheduledMeetings() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SCHEDULED_MEETINGS);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function saveScheduledMeeting(meeting) {
  const current = getScheduledMeetings();
  const updated = [meeting, ...current];
  localStorage.setItem(STORAGE_KEYS.SCHEDULED_MEETINGS, JSON.stringify(updated));
  // Also register in active room lookup so code is valid
  registerActiveRoom(meeting.code, meeting.title, meeting.host, meeting.passcode);
  return updated;
}

export function deleteScheduledMeeting(id) {
  const current = getScheduledMeetings();
  const updated = current.filter(m => m.id !== id);
  localStorage.setItem(STORAGE_KEYS.SCHEDULED_MEETINGS, JSON.stringify(updated));
  return updated;
}

export function getActiveRooms() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_ROOMS);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
}

export function registerActiveRoom(code, title, hostName, passcode = '') {
  const rooms = getActiveRooms();
  const cleanCode = code.trim().toLowerCase();
  rooms[cleanCode] = {
    code: cleanCode,
    title: title || `Meeting (${cleanCode})`,
    hostName,
    passcode,
    created: Date.now()
  };
  localStorage.setItem(STORAGE_KEYS.ACTIVE_ROOMS, JSON.stringify(rooms));
  return rooms[cleanCode];
}

export function isValidMeetingCode(code) {
  if (!code) return false;
  const cleanCode = code.trim().toLowerCase();
  
  // Check active rooms in local storage
  const activeRooms = getActiveRooms();
  if (activeRooms[cleanCode]) return true;

  // Check scheduled meetings in local storage
  const scheduled = getScheduledMeetings();
  if (scheduled.some(s => s.code.toLowerCase() === cleanCode)) return true;

  // Allow any properly formatted room code (alphanumeric/hyphenated string, min length 4)
  const roomCodeRegex = /^[a-z0-9-]{4,20}$/;
  if (roomCodeRegex.test(cleanCode)) return true;

  return false;
}

export function getRoomInfo(code) {
  if (!code) return null;
  const cleanCode = code.trim().toLowerCase();
  const activeRooms = getActiveRooms();
  if (activeRooms[cleanCode]) return activeRooms[cleanCode];

  const scheduled = getScheduledMeetings();
  const foundSched = scheduled.find(s => s.code.toLowerCase() === cleanCode);
  if (foundSched) {
    return {
      code: foundSched.code,
      title: foundSched.title,
      hostName: foundSched.host,
      passcode: foundSched.passcode
    };
  }
  return null;
}

export function getUserProfile() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (data) {
      const parsed = JSON.parse(data);
      // Ensure name isn't default 'Team Admin'
      if (parsed.name === 'Team Admin') parsed.name = '';
      return parsed;
    }
  } catch (e) {}
  
  const defaultUser = {
    name: '',
    avatar: '',
    id: 'user_' + Math.random().toString(36).substr(2, 9)
  };
  localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(defaultUser));
  return defaultUser;
}

export function saveUserProfile(profile) {
  localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
}

export function generateMeetingCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const part1 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const part3 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${part1}-${part2}-${part3}`;
}
