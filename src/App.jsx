import Peer from 'peerjs';

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
  const [knockRequests, setKnockRequests] = useState([]); // [{ userId, userName, roomCode, peerId }]

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

  // PeerJS Cross-Device WebRTC Signaling Refs
  const peerRef = useRef(null);
  const peerConnsRef = useRef({}); // { [peerId]: DataConnection }
  const peerCallsRef = useRef({}); // { [peerId]: MediaCall }
  
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

  // Universal Signal Broadcaster (BroadcastChannel + PeerJS Data Connections)
  const broadcastSignal = (msg) => {
    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage(msg);
      } catch (e) {}
    }
    Object.values(peerConnsRef.current).forEach((conn) => {
      if (conn && conn.open) {
        try {
          conn.send(msg);
        } catch (e) {}
      }
    });
  };

  // Unified Signal Message Processor
  const handleSignalMessage = (data) => {
    if (!data || !data.type) return;

    const currentRoomCode = meetingInfoRef.current?.code;
    const myId = sessionUserIdRef.current;

    // 1. Host receives Admission Request from joining peer (local tab or remote intern device)
    if (data.type === 'KNOCK_REQUEST') {
      if (currentRoomCode === data.roomCode && isAdminRef.current) {
        setKnockRequests(prev => {
          if (prev.some(r => r.userId === data.userId)) return prev;
          return [...prev, { 
            userId: data.userId, 
            userName: data.userName, 
            roomCode: data.roomCode,
            peerId: data.peerId
          }];
        });
      }
    }

    // 2. Joining user receives Acceptance from Host
    if (data.type === 'KNOCK_ACCEPTED') {
      if (data.targetUserId === myId) {
        setKnockingState('none');
        enterMeetingRoom(data.config, data.existingParticipants || []);

        // Initiate PeerJS WebRTC Call to Host if Host Peer ID was provided
        if (data.hostPeerId && peerRef.current && localStreamRef.current) {
          try {
            const call = peerRef.current.call(data.hostPeerId, localStreamRef.current);
            if (call) {
              peerCallsRef.current[data.hostPeerId] = call;
              call.on('stream', (remoteStream) => {
                setParticipants(prev => prev.map(p => {
                  if (p.id === data.hostPeerId || p.isAdmin) {
                    return { ...p, stream: remoteStream };
                  }
                  return p;
                }));
              });
            }
          } catch (err) {
            console.warn('Call creation error:', err);
          }
        }
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
        if (peerCallsRef.current[data.userId]) {
          try { peerCallsRef.current[data.userId].close(); } catch (e) {}
          delete peerCallsRef.current[data.userId];
        }
        if (peerConnsRef.current[data.userId]) {
          try { peerConnsRef.current[data.userId].close(); } catch (e) {}
          delete peerConnsRef.current[data.userId];
        }
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

    // 7. Chat Message Broadcast
    if (data.type === 'CHAT_MESSAGE') {
      if (currentRoomCode === data.roomCode && data.senderId !== myId) {
        setChatMessages(prev => [
          ...prev,
          {
            id: data.msg.id,
            sender: data.msg.sender,
            text: data.msg.text,
            time: data.msg.time,
            isSelf: false
          }
        ]);
        setUnreadChatCount(prev => prev + 1);
      }
    }

    // 8. Admin Mute All Command
    if (data.type === 'ADMIN_MUTE_ALL') {
      if (currentRoomCode === data.roomCode && !isAdminRef.current) {
        setMicEnabled(false);
        if (localStreamRef.current) {
          localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = false; });
        }
      }
    }

    // 9. Sync Request
    if (data.type === 'REQUEST_SYNC') {
      if (currentRoomCode === data.roomCode && inMeetingRef.current) {
        const selfP = participantsRef.current.find(p => p.isSelf);
        if (selfP) {
          broadcastSignal({
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

  // Setup BroadcastChannel for Same-Device Local Tab Communication
  useEffect(() => {
    const channel = new BroadcastChannel('meet_private_channel');
    broadcastChannelRef.current = channel;

    channel.onmessage = (event) => {
      handleSignalMessage(event.data);
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
    if (meetingInfo) {
      broadcastSignal({
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
    const cleanCode = config.code.trim().toLowerCase();
    const myId = sessionUserIdRef.current;

    // Clean up any existing peer instance before starting new room
    if (peerRef.current) {
      try { peerRef.current.destroy(); } catch (e) {}
      peerRef.current = null;
    }

    if (config.isOwner || config.isAdmin) {
      // Host Flow: Register Host Peer ID on PeerJS Cloud (e.g. meet-host-xxx-yyyy-zzz)
      const hostPeerId = `meet-host-${cleanCode}`;
      try {
        const peer = new Peer(hostPeerId, {
          debug: 1,
          config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
        });
        peerRef.current = peer;

        peer.on('connection', (conn) => {
          peerConnsRef.current[conn.peer] = conn;
          conn.on('data', (data) => handleSignalMessage(data));
        });

        peer.on('call', (call) => {
          call.answer(localStreamRef.current);
          peerCallsRef.current[call.peer] = call;
          call.on('stream', (remoteStream) => {
            setParticipants(prev => prev.map(p => {
              if (p.id === call.peer || p.peerId === call.peer) {
                return { ...p, stream: remoteStream };
              }
              return p;
            }));
          });
        });
      } catch (err) {
        console.warn('PeerJS Host Init Warning:', err);
      }

      enterMeetingRoom(config);
    } else {
      // Participant Flow: Request Admission from Host
      setMeetingInfo(config);
      setKnockingState('waiting');

      const clientPeerId = `meet-peer-${cleanCode}-${myId}`;
      try {
        const peer = new Peer(clientPeerId, {
          debug: 1,
          config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
        });
        peerRef.current = peer;

        peer.on('open', () => {
          const hostPeerId = `meet-host-${cleanCode}`;
          const conn = peer.connect(hostPeerId);
          if (conn) {
            peerConnsRef.current[hostPeerId] = conn;
            conn.on('open', () => {
              conn.send({
                type: 'KNOCK_REQUEST',
                roomCode: cleanCode,
                userId: myId,
                userName: config.userName,
                peerId: clientPeerId
              });
            });
            conn.on('data', (data) => handleSignalMessage(data));
          }
        });

        peer.on('call', (call) => {
          call.answer(localStreamRef.current);
          peerCallsRef.current[call.peer] = call;
          call.on('stream', (remoteStream) => {
            setParticipants(prev => prev.map(p => {
              if (p.id === call.peer || p.peerId === call.peer) {
                return { ...p, stream: remoteStream };
              }
              return p;
            }));
          });
        });
      } catch (err) {
        console.warn('PeerJS Client Init Warning:', err);
      }

      // Also trigger BroadcastChannel KNOCK_REQUEST for local tab testing
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: 'KNOCK_REQUEST',
          roomCode: cleanCode,
          userId: myId,
          userName: config.userName,
          peerId: clientPeerId
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
      stream: localStreamRef.current
    };

    const sanitizedPeers = initialPeers
      .filter(p => p.id !== myId)
      .map(p => ({
        ...p,
        isSelf: false
      }));

    setParticipants([selfUser, ...sanitizedPeers]);
    setInMeeting(true);

    broadcastSignal({
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

    broadcastSignal({
      type: 'REQUEST_SYNC',
      roomCode: config.code
    });

    setChatMessages([
      {
        id: 'msg_welcome',
        sender: 'System',
        text: `Joined ${config.title || 'Meeting'}. Private & secure session across all devices.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSelf: false
      }
    ]);
  };

  // Host Action: Admit User
  const handleAdmitUser = (request) => {
    setKnockRequests(prev => prev.filter(r => r.userId !== request.userId));

    const newPeer = {
      id: request.userId,
      peerId: request.peerId,
      name: request.userName,
      isSelf: false,
      isAdmin: false,
      micEnabled: false,
      videoEnabled: false,
      handRaised: false,
      isSpeaking: false,
      color: '#34a853'
    };

    setParticipants(prev => {
      if (prev.some(p => p.id === newPeer.id)) return prev;
      return [...prev, newPeer];
    });

    const hostParticipantList = participantsRef.current.map(p => ({
      id: p.id,
      name: p.name,
      isAdmin: p.isAdmin,
      micEnabled: p.micEnabled,
      videoEnabled: p.videoEnabled,
      handRaised: p.handRaised,
      color: p.color || '#1a73e8'
    }));

    // Send Acceptance Broadcast to joining peer
    broadcastSignal({
      type: 'KNOCK_ACCEPTED',
      roomCode: request.roomCode,
      targetUserId: request.userId,
      hostPeerId: peerRef.current?.id,
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

    // Initiate WebRTC Call to Admitted Peer if peerId present
    if (request.peerId && peerRef.current) {
      try {
        const call = peerRef.current.call(request.peerId, localStreamRef.current);
        if (call) {
          peerCallsRef.current[request.peerId] = call;
          call.on('stream', (remoteStream) => {
            setParticipants(prev => prev.map(p => {
              if (p.id === request.userId || p.peerId === request.peerId) {
                return { ...p, stream: remoteStream };
              }
              return p;
            }));
          });
        }
      } catch (err) {
        console.warn('Host call placement error:', err);
      }
    }

    broadcastSignal({
      type: 'PEER_JOINED',
      roomCode: request.roomCode,
      peer: newPeer
    });
  };

  // Host Action: Decline User
  const handleDeclineUser = (request) => {
    setKnockRequests(prev => prev.filter(r => r.userId !== request.userId));
    broadcastSignal({
      type: 'KNOCK_DECLINED',
      roomCode: request.roomCode,
      targetUserId: request.userId
    });
  };

  // User Leaves Meeting
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

    if (meetingInfo) {
      broadcastSignal({
        type: 'PEER_LEFT',
        roomCode: meetingInfo.code,
        userId: sessionUserIdRef.current
      });
    }

    // Clean up PeerJS connections
    Object.values(peerCallsRef.current).forEach(call => {
      try { call.close(); } catch (e) {}
    });
    peerCallsRef.current = {};

    Object.values(peerConnsRef.current).forEach(conn => {
      try { conn.close(); } catch (e) {}
    });
    peerConnsRef.current = {};

    if (peerRef.current) {
      try { peerRef.current.destroy(); } catch (e) {}
      peerRef.current = null;
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

    if (meetingInfo) {
      broadcastSignal({
        type: 'CHAT_MESSAGE',
        roomCode: meetingInfo.code,
        senderId: sessionUserIdRef.current,
        msg: newMsg
      });
    }
  };

  const handleAdminMuteAll = () => {
    setParticipants(prev => prev.map(p => {
      if (!p.isSelf && !p.isAdmin) {
        return { ...p, micEnabled: false };
      }
      return p;
    }));

    if (meetingInfo) {
      broadcastSignal({
        type: 'ADMIN_MUTE_ALL',
        roomCode: meetingInfo.code
      });
    }
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
