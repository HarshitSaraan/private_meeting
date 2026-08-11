import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import HomeLobby from './components/HomeLobby';
import ScheduleModal from './components/ScheduleModal';
import VideoGrid from './components/VideoGrid';
import ControlBar from './components/ControlBar';
import WhiteboardModal from './components/WhiteboardModal';
import ChatDrawer from './components/ChatDrawer';
import PeopleDrawer from './components/PeopleDrawer';
import RecordingBanner from './components/RecordingBanner';
import { useRecorder } from './hooks/useRecorder';
import { getScheduledMeetings, deleteScheduledMeeting, getUserProfile, saveUserProfile } from './utils/storage';
import { UserCheck, Check, X, Clock, ArrowLeft } from 'lucide-react';

export default function App() {
  // Navigation & Room State
  const [inMeeting, setInMeeting] = useState(false);
  const [meetingInfo, setMeetingInfo] = useState(null);
  const [userProfile, setUserProfile] = useState(getUserProfile());
  const [scheduledMeetings, setScheduledMeetings] = useState(getScheduledMeetings());
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Unique Tab Session ID (ensures multi-tab testing across same browser has distinct peer IDs)
  const sessionUserIdRef = useRef(
    'usr_' + Math.random().toString(36).substring(2, 9)
  );

  // Knocking / Host Admission System State
  const [knockingState, setKnockingState] = useState('none'); // 'none' | 'waiting' | 'declined'
  const [knockRequests, setKnockRequests] = useState([]); // [{ userId, userName, roomCode }]

  // In-Meeting Media State
  const [localStream, setLocalStream] = useState(null);
  const [micEnabled, setMicEnabled] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [screenShareStream, setScreenShareStream] = useState(null);
  const [screenSharerName, setScreenSharerName] = useState('');

  // In-Meeting Participant & Role State
  const [participants, setParticipants] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [handRaised, setHandRaised] = useState(false);

  // Drawers & Modals
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPeopleOpen, setIsPeopleOpen] = useState(false);
  const [pinnedId, setPinnedId] = useState(null);

  // Chat & Admin Controls
  const [chatMessages, setChatMessages] = useState([]);
  const [chatDisabled, setChatDisabled] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Recorder Hook
  const { isRecording, recordTime, startRecording, stopRecording } = useRecorder();

  const localStreamRef = useRef(null);
  const broadcastChannelRef = useRef(null);
  
  // Mutable refs for channel handlers to access latest state without re-subscribing
  const meetingInfoRef = useRef(meetingInfo);
  meetingInfoRef.current = meetingInfo;
  const inMeetingRef = useRef(inMeeting);
  inMeetingRef.current = inMeeting;
  const isAdminRef = useRef(isAdmin);
  isAdminRef.current = isAdmin;
  const participantsRef = useRef(participants);
  participantsRef.current = participants;
  const userNameRef = useRef(userProfile?.name || 'User');
  userNameRef.current = userProfile?.name || 'User';

  // Setup BroadcastChannel for Real-Time Multi-Tab / Multi-Device Communication
  useEffect(() => {
    const channel = new BroadcastChannel('meet_private_channel');
    broadcastChannelRef.current = channel;

    channel.onmessage = (event) => {
      const data = event.data;
      if (!data || !data.type) return;

      const currentRoomCode = meetingInfoRef.current?.code;
      const myId = sessionUserIdRef.current;

      // 1. Host receives Admission Request from joining peer
      if (data.type === 'KNOCK_REQUEST') {
        if (currentRoomCode === data.roomCode && isAdminRef.current) {
          setKnockRequests(prev => {
            if (prev.some(r => r.userId === data.userId)) return prev;
            return [...prev, { userId: data.userId, userName: data.userName, roomCode: data.roomCode }];
          });
        }
      }

      // 2. Joining user receives Acceptance from Host
      if (data.type === 'KNOCK_ACCEPTED') {
        if (data.targetUserId === myId) {
          setKnockingState('none');
          // Enter room with all existing participants passed by host
          enterMeetingRoom(data.config, data.existingParticipants || []);
        }
      }

      // 3. Joining user receives Decline from Host
      if (data.type === 'KNOCK_DECLINED') {
        if (data.targetUserId === myId) {
          setKnockingState('declined');
        }
      }

      // 4. Peer Joined Announcement
      if (data.type === 'PEER_JOINED') {
        if (currentRoomCode === data.roomCode && data.peer.id !== myId) {
          setParticipants(prev => {
            if (prev.some(p => p.id === data.peer.id)) {
              return prev.map(p => p.id === data.peer.id ? { ...p, ...data.peer, isSelf: false } : p);
            }
            return [...prev, { ...data.peer, isSelf: false }];
          });
        }
      }

      // 5. Peer Left Announcement
      if (data.type === 'PEER_LEFT') {
        if (currentRoomCode === data.roomCode) {
          setParticipants(prev => prev.filter(p => p.id !== data.userId));
        }
      }

      // 6. Peer Status Update (Mic / Video / Hand Toggle)
      if (data.type === 'PEER_STATUS_UPDATE') {
        if (currentRoomCode === data.roomCode && data.userId !== myId) {
          setParticipants(prev => prev.map(p => {
            if (p.id === data.userId) {
              return { 
                ...p, 
                micEnabled: data.micEnabled, 
                videoEnabled: data.videoEnabled, 
                handRaised: data.handRaised 
              };
            }
            return p;
          }));
        }
      }

      // 7. Sync Request: Active peers announce themselves when requested
      if (data.type === 'REQUEST_SYNC') {
        if (currentRoomCode === data.roomCode && inMeetingRef.current) {
          const selfP = participantsRef.current.find(p => p.isSelf);
          if (selfP) {
            channel.postMessage({
              type: 'PEER_JOINED',
              roomCode: currentRoomCode,
              peer: {
                id: myId,
                name: selfP.name,
                isAdmin: selfP.isAdmin,
                micEnabled: selfP.micEnabled,
                videoEnabled: selfP.videoEnabled,
                handRaised: selfP.handRaised,
                color: selfP.color || '#1a73e8'
              }
            });
          }
        }
      }
    };

    return () => {
      channel.close();
    };
  }, []);

  // Request browser hardware permissions and capture live stream
  const requestMediaPermissions = async (requestVideo = true, requestAudio = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: requestVideo ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        audio: requestAudio
      });

      localStreamRef.current = stream;
      setLocalStream(stream);

      // Update local participant stream
      setParticipants(prev => prev.map(p => {
        if (p.isSelf) {
          return { ...p, stream, videoEnabled: requestVideo, micEnabled: requestAudio };
        }
        return p;
      }));

      return stream;
    } catch (err) {
      console.warn('Browser media permission rejected or fallback:', err);
      return null;
    }
  };

  // Toggle Mic
  const handleToggleMic = async () => {
    const nextMicState = !micEnabled;
    setMicEnabled(nextMicState);

    if (nextMicState && !localStreamRef.current) {
      await requestMediaPermissions(videoEnabled, true);
    } else if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = nextMicState; });
    }

    broadcastStatusChange(nextMicState, videoEnabled, handRaised);
  };

  // Toggle Camera
  const handleToggleVideo = async () => {
    const nextVideoState = !videoEnabled;
    setVideoEnabled(nextVideoState);

    if (nextVideoState && !localStreamRef.current) {
      await requestMediaPermissions(true, micEnabled);
    } else if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = nextVideoState; });
    }

    broadcastStatusChange(micEnabled, nextVideoState, handRaised);
  };

  // Toggle Hand Raised
  const handleToggleHand = () => {
    const nextHand = !handRaised;
    setHandRaised(nextHand);
    broadcastStatusChange(micEnabled, videoEnabled, nextHand);
  };

  const broadcastStatusChange = (mic, vid, hand) => {
    if (broadcastChannelRef.current && meetingInfo) {
      broadcastChannelRef.current.postMessage({
        type: 'PEER_STATUS_UPDATE',
        roomCode: meetingInfo.code,
        userId: sessionUserIdRef.current,
        micEnabled: mic,
        videoEnabled: vid,
        handRaised: hand
      });
    }
  };

  // Start / Join Flow Trigger
  const handleStartMeeting = async (config) => {
    if (config.isOwner || config.isAdmin) {
      enterMeetingRoom(config);
    } else {
      setMeetingInfo(config);
      setKnockingState('waiting');

      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: 'KNOCK_REQUEST',
          roomCode: config.code,
          userId: sessionUserIdRef.current,
          userName: config.userName
        });
      }
    }
  };

  const enterMeetingRoom = async (config, initialPeers = []) => {
    setMeetingInfo(config);
    setIsAdmin(config.isAdmin);

    const myId = sessionUserIdRef.current;
    const selfUser = {
      id: myId,
      name: config.userName,
      isSelf: true,
      isAdmin: config.isAdmin,
      micEnabled: false,
      videoEnabled: false,
      handRaised: false,
      isSpeaking: false,
      color: '#1a73e8',
      stream: null
    };

    // Format existing peers received from host
    const sanitizedPeers = initialPeers
      .filter(p => p.id !== myId)
      .map(p => ({
        ...p,
        isSelf: false
      }));

    setParticipants([selfUser, ...sanitizedPeers]);
    setInMeeting(true);

    // Broadcast PEER_JOINED to existing participants in room
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: 'PEER_JOINED',
        roomCode: config.code,
        peer: {
          id: selfUser.id,
          name: selfUser.name,
          isAdmin: selfUser.isAdmin,
          micEnabled: false,
          videoEnabled: false,
          handRaised: false,
          color: '#34a853'
        }
      });

      // Request all active peers in room to sync their presence
      broadcastChannelRef.current.postMessage({
        type: 'REQUEST_SYNC',
        roomCode: config.code
      });
    }

    setChatMessages([
      {
        id: 'msg_welcome',
        sender: 'System',
        text: `Joined ${config.title || 'Meeting'}. Private & secure session.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSelf: false
      }
    ]);
  };

  // Host Action: Admit User (Sends Host + all current participants to joining peer)
  const handleAdmitUser = (request) => {
    setKnockRequests(prev => prev.filter(r => r.userId !== request.userId));

    const newPeer = {
      id: request.userId,
      name: request.userName,
      isSelf: false,
      isAdmin: false,
      micEnabled: false,
      videoEnabled: false,
      handRaised: false,
      isSpeaking: false,
      color: '#34a853'
    };

    // Add admitted user to host's own participant state
    setParticipants(prev => {
      if (prev.some(p => p.id === newPeer.id)) return prev;
      return [...prev, newPeer];
    });

    // Prepare complete list of current participants to send to joining user
    const hostParticipantList = participantsRef.current.map(p => ({
      id: p.id,
      name: p.name,
      isAdmin: p.isAdmin,
      micEnabled: p.micEnabled,
      videoEnabled: p.videoEnabled,
      handRaised: p.handRaised,
      color: p.color || '#1a73e8'
    }));

    // Send Acceptance Broadcast directly to joining user
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: 'KNOCK_ACCEPTED',
        roomCode: request.roomCode,
        targetUserId: request.userId,
        config: {
          code: request.roomCode,
          title: `Meeting (${request.roomCode})`,
          isAdmin: false,
          isOwner: false,
          userName: request.userName,
          micInitial: false,
          videoInitial: false
        },
        existingParticipants: hostParticipantList
      });

      // Broadcast PEER_JOINED to any other participants in the room
      broadcastChannelRef.current.postMessage({
        type: 'PEER_JOINED',
        roomCode: request.roomCode,
        peer: newPeer
      });
    }
  };

  // Host Action: Decline User
  const handleDeclineUser = (request) => {
    setKnockRequests(prev => prev.filter(r => r.userId !== request.userId));

    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: 'KNOCK_DECLINED',
        roomCode: request.roomCode,
        targetUserId: request.userId
      });
    }
  };

  // User Leaves Meeting -> Broadcast PEER_LEFT so all participants immediately update list
  const handleLeaveMeeting = () => {
    if (isRecording) stopRecording();
    if (screenShareStream) {
      screenShareStream.getTracks().forEach(t => t.stop());
      setScreenShareStream(null);
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }

    if (broadcastChannelRef.current && meetingInfo) {
      broadcastChannelRef.current.postMessage({
        type: 'PEER_LEFT',
        roomCode: meetingInfo.code,
        userId: sessionUserIdRef.current
      });
    }

    setLocalStream(null);
    setInMeeting(false);
    setMeetingInfo(null);
    setKnockingState('none');
    setIsWhiteboardOpen(false);
    setIsChatOpen(false);
    setIsPeopleOpen(false);
    setHandRaised(false);
    setMicEnabled(false);
    setVideoEnabled(false);
    setParticipants([]);
  };

  // Screen Share Toggle
  const handleToggleScreenShare = async () => {
    if (screenShareStream) {
      screenShareStream.getTracks().forEach(t => t.stop());
      setScreenShareStream(null);
      setScreenSharerName('');
      return;
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      setScreenShareStream(displayStream);
      setScreenSharerName(userProfile?.name || 'You');

      displayStream.getVideoTracks()[0].onended = () => {
        setScreenShareStream(null);
        setScreenSharerName('');
      };
    } catch (e) {
      console.warn('Screen share cancelled:', e);
    }
  };

  // Chat Messages
  const handleSendMessage = (text) => {
    const newMsg = {
      id: 'msg_' + Date.now(),
      sender: userProfile?.name || 'You',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSelf: true
    };
    setChatMessages(prev => [...prev, newMsg]);
  };

  const handleAdminMuteAll = () => {
    setParticipants(prev => prev.map(p => {
      if (!p.isSelf && !p.isAdmin) {
        return { ...p, micEnabled: false };
      }
      return p;
    }));
  };

  const handleAdminToggleChatDisable = () => {
    setChatDisabled(prev => !prev);
  };

  const handleToggleAdminRole = (participantId) => {
    setParticipants(prev => prev.map(p => {
      if (p.id === participantId) {
        return { ...p, isAdmin: !p.isAdmin };
      }
      return p;
    }));
  };

  const handleRemoveParticipant = (participantId) => {
    setParticipants(prev => prev.filter(p => p.id !== participantId));
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording(screenShareStream || localStream);
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-[#121316] text-[#e8eaed] overflow-hidden select-none">
      
      {/* Top Navbar */}
      <Navbar inMeeting={inMeeting} />

      {/* Recording Banner Alert */}
      <RecordingBanner
        isRecording={isRecording}
        recordTime={recordTime}
        onStopRecording={stopRecording}
      />

      {/* Host Admission Request Banner (Floating for Admin) */}
      {isAdmin && knockRequests.length > 0 && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2">
          {knockRequests.map(req => (
            <div 
              key={req.userId}
              className="px-5 py-3 rounded-2xl bg-[#28292c] border border-blue-500/50 text-white shadow-2xl flex items-center gap-4 animate-bounce"
            >
              <div className="flex items-center gap-2 text-xs font-semibold">
                <UserCheck className="w-4 h-4 text-blue-400" />
                <span><strong className="text-blue-300">{req.userName}</strong> wants to join this meeting</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAdmitUser(req)}
                  className="px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 shadow"
                >
                  <Check className="w-3.5 h-3.5" /> Admit
                </button>
                <button
                  onClick={() => handleDeclineUser(req)}
                  className="px-3 py-1 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1 shadow"
                >
                  <X className="w-3.5 h-3.5" /> Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Waiting Room / Knocking Overlay Modal for Joining User */}
      {knockingState === 'waiting' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#202124] border border-white/10 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mx-auto text-blue-400 animate-pulse">
              <Clock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Asking host to let you in...</h3>
              <p className="text-xs text-slate-400">
                You'll join the meeting as soon as the host accepts your request.
              </p>
            </div>

            <button
              onClick={() => setKnockingState('none')}
              className="btn btn-secondary px-6 py-2 text-xs font-semibold"
            >
              Cancel Request
            </button>
          </div>
        </div>
      )}

      {/* Declined Overlay Modal */}
      {knockingState === 'declined' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#202124] border border-red-500/30 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
              <X className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Host declined your request</h3>
              <p className="text-xs text-slate-400">
                The meeting host has declined your request to join this session.
              </p>
            </div>

            <button
              onClick={() => setKnockingState('none')}
              className="btn btn-primary px-6 py-2 text-xs font-semibold flex items-center gap-1.5 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Homepage
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 relative w-full h-full overflow-hidden flex">
        {!inMeeting ? (
          <HomeLobby
            userProfile={userProfile}
            onSaveProfile={(prof) => { setUserProfile(prof); saveUserProfile(prof); }}
            onStartMeeting={handleStartMeeting}
            scheduledMeetings={scheduledMeetings}
            onDeleteScheduled={(id) => setScheduledMeetings(deleteScheduledMeeting(id))}
            onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
          />
        ) : (
          <VideoGrid
            participants={participants}
            screenShareStream={screenShareStream}
            screenSharerName={screenSharerName}
            onStopScreenShare={handleToggleScreenShare}
            pinnedId={pinnedId}
            onPin={(id) => setPinnedId(id === pinnedId ? null : id)}
          />
        )}
      </main>

      {/* In-Meeting Bottom Control Bar */}
      {inMeeting && (
        <ControlBar
          meetingCode={meetingInfo?.code}
          meetingTitle={meetingInfo?.title}
          micEnabled={micEnabled}
          onToggleMic={handleToggleMic}
          videoEnabled={videoEnabled}
          onToggleVideo={handleToggleVideo}
          isScreenSharing={!!screenShareStream}
          onToggleScreenShare={handleToggleScreenShare}
          handRaised={handRaised}
          onToggleHand={handleToggleHand}
          isWhiteboardOpen={isWhiteboardOpen}
          onToggleWhiteboard={() => setIsWhiteboardOpen(!isWhiteboardOpen)}
          isChatOpen={isChatOpen}
          onToggleChat={() => { setIsChatOpen(!isChatOpen); setUnreadChatCount(0); }}
          isPeopleOpen={isPeopleOpen}
          onTogglePeople={() => setIsPeopleOpen(!isPeopleOpen)}
          isAdmin={isAdmin}
          isRecording={isRecording}
          onToggleRecording={handleToggleRecording}
          onLeaveMeeting={handleLeaveMeeting}
          unreadCount={unreadChatCount}
        />
      )}

      {/* Drawers & Modals */}
      <WhiteboardModal
        isOpen={isWhiteboardOpen}
        onClose={() => setIsWhiteboardOpen(false)}
      />

      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={chatMessages}
        onSendMessage={handleSendMessage}
        chatDisabled={chatDisabled}
        isAdmin={isAdmin}
      />

      <PeopleDrawer
        isOpen={isPeopleOpen}
        onClose={() => setIsPeopleOpen(false)}
        participants={participants}
        currentUser={userProfile}
        isAdmin={isAdmin}
        onMuteAll={handleAdminMuteAll}
        onToggleChatDisable={handleAdminToggleChatDisable}
        chatDisabled={chatDisabled}
        onToggleAdminRole={handleToggleAdminRole}
        onRemoveParticipant={handleRemoveParticipant}
      />

      <ScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onMeetingScheduled={(updated) => setScheduledMeetings(updated)}
      />

    </div>
  );
}
