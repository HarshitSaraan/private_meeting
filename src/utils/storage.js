// Utility helpers for local storage and meeting management

const STORAGE_KEYS = {
  SCHEDULED_MEETINGS: 'meet_scheduled_v1',
  USER_PROFILE: 'meet_user_profile_v1'
};

export function getScheduledMeetings() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SCHEDULED_MEETINGS);
    return data ? JSON.parse(data) : getInitialMockMeetings();
  } catch (e) {
    console.error('Failed to read scheduled meetings:', e);
    return getInitialMockMeetings();
  }
}

export function saveScheduledMeeting(meeting) {
  const current = getScheduledMeetings();
  const updated = [meeting, ...current];
  localStorage.setItem(STORAGE_KEYS.SCHEDULED_MEETINGS, JSON.stringify(updated));
  return updated;
}

export function deleteScheduledMeeting(id) {
  const current = getScheduledMeetings();
  const updated = current.filter(m => m.id !== id);
  localStorage.setItem(STORAGE_KEYS.SCHEDULED_MEETINGS, JSON.stringify(updated));
  return updated;
}

export function getUserProfile() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (data) return JSON.parse(data);
  } catch (e) {}
  
  const defaultUser = {
    name: 'Team Admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
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

function getInitialMockMeetings() {
  const now = new Date();
  const todayAt3 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 0, 0);
  const tomorrowAt10 = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 10, 30, 0);

  return [
    {
      id: 'sched_1',
      title: 'Weekly Engineering Sync & Code Review',
      code: 'abc-defg-hij',
      date: todayAt3.toISOString().split('T')[0],
      time: '15:00',
      passcode: 'team2026',
      host: 'Alex Rivera',
      created: Date.now()
    },
    {
      id: 'sched_2',
      title: 'Q3 Product Strategy & Design Sprint',
      code: 'xyz-uvwx-yzq',
      date: tomorrowAt10.toISOString().split('T')[0],
      time: '10:30',
      passcode: 'design101',
      host: 'Sarah Chen',
      created: Date.now() - 3600000
    }
  ];
}
