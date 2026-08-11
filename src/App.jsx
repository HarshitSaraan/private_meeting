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

export default function App() {
  // Navigation State
  const [inMeeting, setInMeeting] = useState(false);
  const [meetingInfo, setMeetingInfo] = useState(null);
  const [userProfile, setUserProfile] = useState(getUserProfile());
  const [scheduledMeetings, setScheduledMeetings] = useState(getScheduledMeetings());
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // In-Meeting Hardware Media State
  const [localStream, setLocalStream] = useState(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
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

  // In-Meeting Chat & Admin Rules
  const [chatMessages, setChatMessages] = useState([]);
  const [chatDisabled, setChatDisabled] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Recorder Hook
  const { isRecording, recordTime, startRecording, stopRecording } = useRecorder();

  // Reference for cleanup
  const localStreamRef = useRef(null);

  // Check URL hash for direct meeting code join e.g. /#abc-defg-hij
  useEffect(() => {
    const hash = window.location.hash.replace('#', '').trim();
    if (hash && hash.length >= 6) {
      // Auto fill join flow or ready state
    }
  }, []);

  // Synchronize mic/video tracks when toggled
  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = micEnabled; });
      localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = videoEnabled; });
    }

    // Update self participant entry
    setParticipants(prev => prev.map(p => {
      if (p.isSelf) {
        return { ...p, micEnabled, videoEnabled, handRaised, isAdmin };
      }
      return p;
    }));
  }, [micEnabled, videoEnabled, handRaised, isAdmin]);

  // Start a new meeting room
  const handleStartMeeting = async (config) => {
    setMeetingInfo(config);
    setIsAdmin(config.isAdmin);
    setMicEnabled(config.micInitial);
    setVideoEnabled(config.videoInitial);

    let userMediaStream = null;
    try {
      if (config.micInitial || config.videoInitial) {
        userMediaStream = await navigator.mediaDevices.getUserMedia({
          video: config.videoInitial ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
          audio: config.micInitial
        });
      }
    } catch (e) {
      console.warn('getUserMedia fallback:', e);
    }

    localStreamRef.current = userMediaStream;
    setLocalStream(userMediaStream);

    const selfUser = {
      id: 'self_' + Date.now(),
      name: config.userName,
      isSelf: true,
      isAdmin: config.isAdmin,
      micEnabled: config.micInitial,
      videoEnabled: config.videoInitial,
      handRaised: false,
      isSpeaking: false,
      color: '#1a73e8',
      stream: userMediaStream
    };

    // Initial mock team peers for realistic team experience
    const mockPeer1 = {
      id: 'peer_1',
      name: 'Sarah Chen (Lead Engineer)',
      isSelf: false,
      isAdmin: false,
      micEnabled: true,
      videoEnabled: true,
      handRaised: false,
      isSpeaking: false,
      color: '#34a853',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80'
    };

    const mockPeer2 = {
      id: 'peer_2',
      name: 'David Miller (Product Manager)',
      isSelf: false,
      isAdmin: false,
      micEnabled: false,
      videoEnabled: true,
      handRaised: false,
      isSpeaking: false,
      color: '#a142f4',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80'
    };

    setParticipants([selfUser, mockPeer1, mockPeer2]);
    setInMeeting(true);

    // Initial Welcome Chat Message
    setChatMessages([
      {
        id: 'msg_welcome',
        sender: 'System Bot',
        text: `Welcome to ${config.title}. Meeting room encrypted & private for your team.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSelf: false
      }
    ]);
  };

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
    setLocalStream(null);
    setInMeeting(false);
    setMeetingInfo(null);
    setIsWhiteboardOpen(false);
    setIsChatOpen(false);
    setIsPeopleOpen(false);
    setHandRaised(false);
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

  // In-Meeting Chat Messages
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

  // Admin Actions: Mute All Mics
  const handleAdminMuteAll = () => {
    setParticipants(prev => prev.map(p => {
      if (!p.isSelf && !p.isAdmin) {
        return { ...p, micEnabled: false };
      }
      return p;
    }));
    
    // Add system notification in chat
    setChatMessages(prev => [...prev, {
      id: 'msg_sys_' + Date.now(),
      sender: 'Admin Control',
      text: 'Host muted microphones of all participants.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSelf: false
    }]);
  };

  // Admin Actions: Toggle Chat Disable
  const handleAdminToggleChatDisable = () => {
    const nextState = !chatDisabled;
    setChatDisabled(nextState);
    setChatMessages(prev => [...prev, {
      id: 'msg_sys_' + Date.now(),
      sender: 'Admin Control',
      text: nextState ? 'In-meeting chat disabled by Admin.' : 'In-meeting chat re-enabled by Admin.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSelf: false
    }]);
  };

  // Admin Actions: Grant or Revoke Admin (Multiple Admin support!)
  const handleToggleAdminRole = (participantId) => {
    setParticipants(prev => prev.map(p => {
      if (p.id === participantId) {
        const nextAdmin = !p.isAdmin;
        return { ...p, isAdmin: nextAdmin };
      }
      return p;
    }));
  };

  // Admin Actions: Kick / Remove Participant
  const handleRemoveParticipant = (participantId) => {
    setParticipants(prev => prev.filter(p => p.id !== participantId));
  };

  // Admin / Testing Helper: Spawn extra simulated peer
  const handleAddSimulatedPeer = () => {
    const names = ['Alex Rivera', 'Elena Rostova', 'Marcus Vance', 'Priya Sharma', 'Jordan Lee'];
    const randomName = names[Math.floor(Math.random() * names.length)] + ` (${Math.floor(10 + Math.random() * 90)})`;
    const newPeer = {
      id: 'peer_' + Date.now(),
      name: randomName,
      isSelf: false,
      isAdmin: false,
      micEnabled: true,
      videoEnabled: true,
      handRaised: Math.random() > 0.5,
      isSpeaking: false,
      color: '#' + Math.floor(Math.random()*16777215).toString(16)
    };
    setParticipants(prev => [...prev, newPeer]);
  };

  // Admin Recording Toggle
  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording(screenShareStream || localStream);
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-[#121316] text-[#e8eaed] overflow-hidden select-none">
      
      {/* Navigation Header */}
      <Navbar
        inMeeting={inMeeting}
        meetingInfo={meetingInfo}
        userProfile={userProfile}
        onLeaveMeeting={handleLeaveMeeting}
      />

      {/* Recording Banner Alert */}
      <RecordingBanner
        isRecording={isRecording}
        recordTime={recordTime}
        onStopRecording={stopRecording}
      />

      {/* Main Viewport Container */}
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

      {/* In-Meeting Bottom Control Strip */}
      {inMeeting && (
        <ControlBar
          micEnabled={micEnabled}
          onToggleMic={() => setMicEnabled(!micEnabled)}
          videoEnabled={videoEnabled}
          onToggleVideo={() => setVideoEnabled(!videoEnabled)}
          isScreenSharing={!!screenShareStream}
          onToggleScreenShare={handleToggleScreenShare}
          handRaised={handRaised}
          onToggleHand={() => setHandRaised(!handRaised)}
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
        onAddSimulatedPeer={handleAddSimulatedPeer}
      />

      <ScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onMeetingScheduled={(updated) => setScheduledMeetings(updated)}
      />

    </div>
  );
}
