// WebRTC Real-Time Multiplayer Voice Chat Manager for Jeoparty.io

const DEFAULT_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
];

export class VoiceChatManager {
  constructor() {
    this.sendWs = null;
    this.onStatusChange = null;
    this.onPermissionError = null;

    this.inVoice = false;
    this.isMuted = localStorage.getItem('jeoparty_voice_muted_pref') === '1';
    this.isDeafened = localStorage.getItem('jeoparty_voice_deafened_pref') === '1';
    this.isSpeaking = false;
    this.usePushToTalk = localStorage.getItem('jeoparty_voice_ptt') === '1';
    this.autoMuteOnJoin = localStorage.getItem('jeoparty_voice_automute') === '1';
    this.masterVoiceVolume = parseFloat(localStorage.getItem('jeoparty_voice_vol') ?? '1.0');

    this.localStream = null;
    this.audioCtx = null;
    this.analyser = null;
    this.speakingTimer = null;
    this.pttPressed = false;

    // peerId -> RTCPeerConnection
    this.peers = new Map();
    // peerId -> HTMLAudioElement
    this.remoteAudios = new Map();
    // peerId -> { id, name, avatar, muted, speaking }
    this.voiceMembers = new Map();
    // peerId -> number (0.0 to 1.0)
    this.peerVolumes = new Map();
    // peerId -> boolean
    this.peerMutes = new Map();

    this.iceServers = DEFAULT_ICE_SERVERS;

    this._bindPttKeys();
  }

  init({ sendWs, onStatusChange, onPermissionError }) {
    this.sendWs = sendWs;
    this.onStatusChange = onStatusChange || (() => {});
    this.onPermissionError = onPermissionError || (() => {});
  }

  _bindPttKeys() {
    if (typeof window === 'undefined') return;

    window.addEventListener('keydown', (e) => {
      if (!this.inVoice || !this.usePushToTalk) return;
      // Do not trigger PTT if typing in an input or textarea
      const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea') return;

      if (e.code === 'Space' || e.code === 'KeyV') {
        if (!this.pttPressed) {
          this.pttPressed = true;
          this._applyMicState();
          this._notifyStatus();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (!this.inVoice || !this.usePushToTalk) return;
      if (e.code === 'Space' || e.code === 'KeyV') {
        if (this.pttPressed) {
          this.pttPressed = false;
          this._applyMicState();
          this._notifyStatus();
        }
      }
    });
  }

  setPttPressed(pressed) {
    if (!this.inVoice || !this.usePushToTalk) return;
    this.pttPressed = Boolean(pressed);
    this._applyMicState();
    this._notifyStatus();
  }

  setPushToTalk(enabled) {
    this.usePushToTalk = Boolean(enabled);
    localStorage.setItem('jeoparty_voice_ptt', this.usePushToTalk ? '1' : '0');
    this.pttPressed = false;
    this._applyMicState();
    this._notifyStatus();
  }

  setAutoMuteOnJoin(enabled) {
    this.autoMuteOnJoin = Boolean(enabled);
    localStorage.setItem('jeoparty_voice_automute', this.autoMuteOnJoin ? '1' : '0');
  }

  setMasterVoiceVolume(vol) {
    this.masterVoiceVolume = Math.max(0, Math.min(1, parseFloat(vol) || 0));
    localStorage.setItem('jeoparty_voice_vol', String(this.masterVoiceVolume));
    for (const [peerId, audio] of this.remoteAudios.entries()) {
      const peerVol = this.peerVolumes.get(peerId) ?? 1.0;
      const peerMuted = this.peerMutes.get(peerId) || this.isDeafened;
      audio.volume = peerMuted ? 0 : this.masterVoiceVolume * peerVol;
    }
  }

  setPeerVolume(peerId, vol) {
    const v = Math.max(0, Math.min(1, parseFloat(vol) || 0));
    this.peerVolumes.set(peerId, v);
    const audio = this.remoteAudios.get(peerId);
    if (audio) {
      const peerMuted = this.peerMutes.get(peerId) || this.isDeafened;
      audio.volume = peerMuted ? 0 : this.masterVoiceVolume * v;
    }
    this._notifyStatus();
  }

  togglePeerMute(peerId) {
    const next = !this.peerMutes.get(peerId);
    this.peerMutes.set(peerId, next);
    const audio = this.remoteAudios.get(peerId);
    if (audio) {
      const peerVol = this.peerVolumes.get(peerId) ?? 1.0;
      audio.volume = (next || this.isDeafened) ? 0 : this.masterVoiceVolume * peerVol;
    }
    this._notifyStatus();
    return next;
  }

  async joinVoice() {
    if (this.inVoice) return;
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.onPermissionError('Your browser does not support microphone audio capture.');
      return;
    }

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
    } catch (err) {
      console.error('[Voice] Microphone permission error:', err);
      const isDenied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
      const msg = isDenied
        ? 'Microphone access was denied. Please allow microphone permissions in your browser address bar to talk with friends!'
        : `Could not access microphone: ${err.message || 'Device unavailable'}`;
      this.onPermissionError(msg);
      return;
    }

    this.inVoice = true;
    if (this.autoMuteOnJoin) {
      this.isMuted = true;
    }

    this._setupSpeakingDetector();
    this._applyMicState();

    if (this.sendWs) {
      this.sendWs({
        type: 'voice_join',
        muted: this._isMicCurrentlyActive() === false,
      });
    }

    this._notifyStatus();
  }

  leaveVoice(sendServer = true) {
    if (!this.inVoice && !this.localStream) return;

    // Stop microphone tracks immediately
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => {
        try { t.stop(); } catch (e) {}
      });
      this.localStream = null;
    }

    // Stop analyser
    if (this.speakingTimer) {
      clearInterval(this.speakingTimer);
      this.speakingTimer = null;
    }
    if (this.audioCtx) {
      try { this.audioCtx.close(); } catch (e) {}
      this.audioCtx = null;
      this.analyser = null;
    }

    // Close all WebRTC peer connections
    for (const [peerId, pc] of this.peers.entries()) {
      try { pc.close(); } catch (e) {}
    }
    this.peers.clear();

    // Clean up audio elements
    for (const [peerId, audio] of this.remoteAudios.entries()) {
      try {
        audio.pause();
        audio.srcObject = null;
        audio.remove();
      } catch (e) {}
    }
    this.remoteAudios.clear();
    this.voiceMembers.clear();

    this.inVoice = false;
    this.isSpeaking = false;
    this.pttPressed = false;

    if (sendServer && this.sendWs) {
      this.sendWs({ type: 'voice_leave' });
    }

    this._notifyStatus();
  }

  toggleMute() {
    this.setMuted(!this.isMuted);
  }

  setMuted(muted) {
    this.isMuted = Boolean(muted);
    localStorage.setItem('jeoparty_voice_muted_pref', this.isMuted ? '1' : '0');
    this._applyMicState();
    if (this.sendWs && this.inVoice) {
      this.sendWs({
        type: 'voice_status',
        muted: !this._isMicCurrentlyActive(),
        speaking: false,
      });
    }
    this._notifyStatus();
  }

  toggleDeafen() {
    this.setDeafened(!this.isDeafened);
  }

  setDeafened(deafened) {
    this.isDeafened = Boolean(deafened);
    localStorage.setItem('jeoparty_voice_deafened_pref', this.isDeafened ? '1' : '0');
    // If deafened, also mute microphone to prevent feedback/talking in deafen state
    if (this.isDeafened && !this.isMuted) {
      this.setMuted(true);
    }
    // Update all remote audio elements
    for (const [peerId, audio] of this.remoteAudios.entries()) {
      const peerVol = this.peerVolumes.get(peerId) ?? 1.0;
      const peerMuted = this.peerMutes.get(peerId) || this.isDeafened;
      audio.volume = peerMuted ? 0 : this.masterVoiceVolume * peerVol;
    }
    this._notifyStatus();
  }

  _isMicCurrentlyActive() {
    if (!this.inVoice || !this.localStream) return false;
    if (this.isDeafened) return false;
    if (this.usePushToTalk) {
      return this.pttPressed;
    }
    return !this.isMuted;
  }

  _applyMicState() {
    if (!this.localStream) return;
    const active = this._isMicCurrentlyActive();
    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = active;
    });
    if (!active && this.isSpeaking) {
      this.isSpeaking = false;
      if (this.sendWs && this.inVoice) {
        this.sendWs({ type: 'voice_status', speaking: false });
      }
    }
  }

  _setupSpeakingDetector() {
    if (!this.localStream) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.audioCtx = new AudioCtx();
      const src = this.audioCtx.createMediaStreamSource(this.localStream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      src.connect(this.analyser);

      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      let silentFrames = 0;

      this.speakingTimer = setInterval(() => {
        if (!this.inVoice || !this._isMicCurrentlyActive() || !this.analyser) {
          if (this.isSpeaking) {
            this.isSpeaking = false;
            if (this.sendWs) this.sendWs({ type: 'voice_status', speaking: false });
            this._notifyStatus();
          }
          return;
        }

        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;

        // Threshold for speaking
        const nowSpeaking = avg > 14;

        if (nowSpeaking) {
          silentFrames = 0;
          if (!this.isSpeaking) {
            this.isSpeaking = true;
            if (this.sendWs) this.sendWs({ type: 'voice_status', speaking: true, muted: false });
            this._notifyStatus();
          }
        } else {
          silentFrames++;
          if (silentFrames > 4 && this.isSpeaking) {
            this.isSpeaking = false;
            if (this.sendWs) this.sendWs({ type: 'voice_status', speaking: false, muted: false });
            this._notifyStatus();
          }
        }
      }, 100);
    } catch (err) {
      console.warn('[Voice] Speaking detector setup error:', err);
    }
  }

  _notifyStatus() {
    if (this.onStatusChange) {
      this.onStatusChange({
        inVoice: this.inVoice,
        isMuted: !this._isMicCurrentlyActive(),
        isDeafened: this.isDeafened,
        isSpeaking: this.isSpeaking,
        usePushToTalk: this.usePushToTalk,
        pttPressed: this.pttPressed,
        membersCount: this.voiceMembers.size + (this.inVoice ? 1 : 0),
        members: Array.from(this.voiceMembers.values()),
      });
    }
  }

  // =========================================================================
  // WebRTC Peer Connection & Signaling
  // =========================================================================

  _createPeerConnection(targetPeerId) {
    if (this.peers.has(targetPeerId)) {
      return this.peers.get(targetPeerId);
    }

    const pc = new RTCPeerConnection({ iceServers: this.iceServers });

    // Add local tracks to outgoing connection
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && this.sendWs) {
        this.sendWs({
          type: 'voice_signal',
          targetPeerId,
          signal: { type: 'candidate', candidate: event.candidate },
        });
      }
    };

    pc.ontrack = (event) => {
      console.log(`[Voice] Received remote audio track from peer: ${targetPeerId}`);
      let audio = this.remoteAudios.get(targetPeerId);
      if (!audio) {
        audio = document.createElement('audio');
        audio.autoplay = true;
        audio.setAttribute('playsinline', 'true');
        audio.style.display = 'none';
        document.body.appendChild(audio);
        this.remoteAudios.set(targetPeerId, audio);
      }
      audio.srcObject = event.streams[0] || new MediaStream([event.track]);
      const peerVol = this.peerVolumes.get(targetPeerId) ?? 1.0;
      const peerMuted = this.peerMutes.get(targetPeerId) || this.isDeafened;
      audio.volume = peerMuted ? 0 : this.masterVoiceVolume * peerVol;
      audio.play().catch(() => {});
    };

    pc.onconnectionstatechange = () => {
      console.log(`[Voice] Peer ${targetPeerId} connection state: ${pc.connectionState}`);
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this._removePeer(targetPeerId);
      }
    };

    this.peers.set(targetPeerId, pc);
    return pc;
  }

  _removePeer(peerId) {
    const pc = this.peers.get(peerId);
    if (pc) {
      try { pc.close(); } catch (e) {}
      this.peers.delete(peerId);
    }
    const audio = this.remoteAudios.get(peerId);
    if (audio) {
      try {
        audio.pause();
        audio.srcObject = null;
        audio.remove();
      } catch (e) {}
      this.remoteAudios.delete(peerId);
    }
    this.voiceMembers.delete(peerId);
    this._notifyStatus();
  }

  // Handle incoming WebSocket messages related to voice
  async handleVoiceMessage(msg) {
    if (!msg || typeof msg.type !== 'string') return;

    switch (msg.type) {
      case 'voice_session_joined': {
        // I joined the voice session
        if (Array.isArray(msg.iceServers) && msg.iceServers.length > 0) {
          this.iceServers = msg.iceServers;
        }
        this.voiceMembers.clear();
        if (Array.isArray(msg.peers)) {
          for (const peer of msg.peers) {
            this.voiceMembers.set(peer.id, peer);
            // I create an offer to existing peers (joiner initiates offer)
            this._initiateOfferToPeer(peer.id);
          }
        }
        this._notifyStatus();
        break;
      }

      case 'voice_peer_joined': {
        if (!this.inVoice) return;
        const peer = msg.peer;
        if (!peer || peer.id === this.myPlayerId) return;
        this.voiceMembers.set(peer.id, peer);
        this._notifyStatus();
        // The newly joined peer will initiate the offer to us
        break;
      }

      case 'voice_peer_left': {
        this._removePeer(msg.peerId);
        break;
      }

      case 'voice_peer_status': {
        const mem = this.voiceMembers.get(msg.peerId);
        if (mem) {
          if (typeof msg.muted === 'boolean') mem.muted = msg.muted;
          if (typeof msg.speaking === 'boolean') mem.speaking = msg.speaking;
        }
        this._notifyStatus();
        break;
      }

      case 'voice_session_ended': {
        console.log('[Voice] Voice session terminated by host/room end');
        this.leaveVoice(false);
        break;
      }

      case 'voice_signal': {
        if (!this.inVoice) return;
        const fromPeerId = msg.fromPeerId;
        const signal = msg.signal;
        if (!fromPeerId || !signal) return;

        await this._handleSignalFromPeer(fromPeerId, signal);
        break;
      }
    }
  }

  async _initiateOfferToPeer(targetPeerId) {
    try {
      const pc = this._createPeerConnection(targetPeerId);
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      });
      await pc.setLocalDescription(offer);

      if (this.sendWs) {
        this.sendWs({
          type: 'voice_signal',
          targetPeerId,
          signal: { type: 'offer', sdp: offer.sdp },
        });
      }
    } catch (err) {
      console.error(`[Voice] Error creating offer to peer ${targetPeerId}:`, err);
    }
  }

  async _handleSignalFromPeer(fromPeerId, signal) {
    try {
      const pc = this._createPeerConnection(fromPeerId);

      if (signal.type === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        if (this.sendWs) {
          this.sendWs({
            type: 'voice_signal',
            targetPeerId: fromPeerId,
            signal: { type: 'answer', sdp: answer.sdp },
          });
        }
      } else if (signal.type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
      } else if (signal.type === 'candidate' && signal.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
      }
    } catch (err) {
      console.warn(`[Voice] Error processing signal from ${fromPeerId}:`, err);
    }
  }
}

export const voiceChat = new VoiceChatManager();
