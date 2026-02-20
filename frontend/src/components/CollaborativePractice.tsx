/**
 * Collaborative Practice System
 * Phase 4: Social Features and Community
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ResponsiveContainer,
  ResponsiveCard,
  ResponsiveText,
  ResponsiveButton,
  ResponsiveGrid,
} from './ui/ResponsiveLayout';
import { useResponsiveBreakpoints } from '../../hooks/useResponsiveBreakpoints';
import { useUserProfile } from './UserProfileManager';

export interface PracticeRoom {
  id: string;
  name: string;
  description: string;
  type: 'duet' | 'group' | 'harmony' | 'round_robin';
  hostId: string;
  hostName: string;
  hostAvatar: string;
  maxParticipants: number;
  currentParticipants: number;
  isPublic: boolean;
  isActive: boolean;
  tags: string[];
  exercise?: {
    title: string;
    key: string;
    tempo: number;
    difficulty: string;
  };
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'all_levels';
  duration: number; // in minutes
  createdAt: string;
}

export interface Participant {
  id: string;
  userId: string;
  displayName: string;
  avatar: string;
  voiceType: string;
  part: 'melody' | 'harmony' | 'bass' | 'alto' | 'tenor' | 'soprano' | 'observer';
  isHost: boolean;
  isReady: boolean;
  isMuted: boolean;
  isRecording: boolean;
  joinTime: string;
}

export interface PracticeSession {
  id: string;
  roomId: string;
  participants: Participant[];
  currentPart: string;
  startTime: string;
  status: 'waiting' | 'active' | 'paused' | 'completed';
  recordingEnabled: boolean;
  chatMessages: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  type: 'chat' | 'system' | 'action';
}

const mockPracticeRooms: PracticeRoom[] = [
  {
    id: 'room1',
    name: 'Beginner Duet Practice',
    description: 'Perfect for those new to harmonizing! We\'ll practice simple two-part harmonies.',
    type: 'duet',
    hostId: 'host1',
    hostName: 'Harmony Helper',
    hostAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=harmony_helper',
    maxParticipants: 2,
    currentParticipants: 1,
    isPublic: true,
    isActive: true,
    tags: ['beginner', 'harmony', 'duet'],
    exercise: {
      title: 'Simple Harmony Exercise',
      key: 'C Major',
      tempo: 80,
      difficulty: 'beginner',
    },
    skillLevel: 'beginner',
    duration: 30,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'room2',
    name: 'Jazz Harmony Workshop',
    description: 'Explore complex jazz harmonies and improvisation techniques.',
    type: 'group',
    hostId: 'host2',
    hostName: 'Jazz Master',
    hostAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jazz_master',
    maxParticipants: 6,
    currentParticipants: 4,
    isPublic: true,
    isActive: true,
    tags: ['jazz', 'advanced', 'harmony', 'improvisation'],
    exercise: {
      title: 'Jazz Chord Progressions',
      key: 'Bb Major',
      tempo: 120,
      difficulty: 'advanced',
    },
    skillLevel: 'advanced',
    duration: 45,
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: 'room3',
    name: 'Vocal Round Robin',
    description: 'Take turns leading and following in this fun group practice session!',
    type: 'round_robin',
    hostId: 'host3',
    hostName: 'Community Singer',
    hostAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=community_singer',
    maxParticipants: 8,
    currentParticipants: 3,
    isPublic: true,
    isActive: true,
    tags: ['community', 'fun', 'all_levels', 'round_robin'],
    skillLevel: 'all_levels',
    duration: 60,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
];

interface CollaborativePracticeProps {
  onRoomJoin?: (roomId: string) => void;
  onRoomCreate?: (roomData: Partial<PracticeRoom>) => void;
}

export default function CollaborativePractice({ onRoomJoin, onRoomCreate }: CollaborativePracticeProps) {
  const { profile } = useUserProfile();
  const { isMobile } = useResponsiveBreakpoints();
  const [activeView, setActiveView] = useState<'browse' | 'session' | 'create'>('browse');
  const [selectedRoom, setSelectedRoom] = useState<PracticeRoom | null>(null);
  const [currentSession, setCurrentSession] = useState<PracticeSession | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [newRoom, setNewRoom] = useState<Partial<PracticeRoom>>({
    name: '',
    description: '',
    type: 'duet',
    maxParticipants: 2,
    isPublic: true,
    skillLevel: 'all_levels',
    duration: 30,
    tags: [],
  });

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Generate mock participants
  const generateMockParticipants = (room: PracticeRoom): Participant[] => {
    const voiceTypes = ['soprano', 'alto', 'tenor', 'bass'];
    const parts: Participant['part'][] = ['melody', 'harmony', 'bass', 'alto', 'tenor', 'soprano', 'observer'];

    return Array.from({ length: room.currentParticipants }, (_, i) => ({
      id: `participant_${i}`,
      userId: `user_${i}`,
      displayName: i === 0 ? room.hostName : `Singer ${i}`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=user_${i}`,
      voiceType: voiceTypes[i % voiceTypes.length],
      part: parts[i % parts.length],
      isHost: i === 0,
      isReady: Math.random() > 0.3,
      isMuted: Math.random() > 0.7,
      isRecording: Math.random() > 0.6,
      joinTime: new Date(Date.now() - i * 5 * 60 * 1000).toISOString(),
    }));
  };

  const generateMockChatMessages = (): ChatMessage[] => {
    return [
      {
        id: 'msg1',
        senderId: 'system',
        senderName: 'System',
        content: 'Welcome to the practice room! Take your time to get ready.',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        type: 'system',
      },
      {
        id: 'msg2',
        senderId: 'host1',
        senderName: 'Harmony Helper',
        content: 'Hey everyone! Great to have you here. Let\'s start with some warmups.',
        timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
        type: 'chat',
      },
      {
        id: 'msg3',
        senderId: 'user2',
        senderName: 'MusicLover',
        content: 'Sounds good! I\'m excited to practice harmonies.',
        timestamp: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
        type: 'chat',
      },
    ];
  };

  const handleRoomJoin = (room: PracticeRoom) => {
    setSelectedRoom(room);
    setActiveView('session');

    const session: PracticeSession = {
      id: `session_${Date.now()}`,
      roomId: room.id,
      participants: generateMockParticipants(room),
      currentPart: 'melody',
      startTime: new Date().toISOString(),
      status: 'waiting',
      recordingEnabled: false,
      chatMessages: generateMockChatMessages(),
    };

    // Add current user to participants
    const currentUser: Participant = {
      id: 'current_user',
      userId: profile?.id || 'current',
      displayName: profile?.name || 'You',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.email || 'current'}`,
      voiceType: profile?.voiceProfile?.voiceType || 'unknown',
      part: 'observer',
      isHost: false,
      isReady: false,
      isMuted: false,
      isRecording: false,
      joinTime: new Date().toISOString(),
    };

    session.participants.push(currentUser);
    setCurrentSession(session);
    onRoomJoin?.(room.id);
  };

  const handleRoomCreate = () => {
    if (!newRoom.name || !newRoom.description) {
      alert('Please fill in all required fields');
      return;
    }

    const room: PracticeRoom = {
      id: `room_${Date.now()}`,
      hostId: profile?.id || 'current',
      hostName: profile?.name || 'You',
      hostAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.email || 'host'}`,
      currentParticipants: 1,
      isActive: true,
      tags: newRoom.tags || [],
      createdAt: new Date().toISOString(),
      ...newRoom,
    } as PracticeRoom;

    handleRoomJoin(room);
    onRoomCreate?.(newRoom);
    setIsCreating(false);
    setNewRoom({
      name: '',
      description: '',
      type: 'duet',
      maxParticipants: 2,
      isPublic: true,
      skillLevel: 'all_levels',
      duration: 30,
      tags: [],
    });
  };

  const handleSendMessage = () => {
    if (!chatInput.trim() || !currentSession) return;

    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      senderId: 'current_user',
      senderName: profile?.name || 'You',
      content: chatInput,
      timestamp: new Date().toISOString(),
      type: 'chat',
    };

    setCurrentSession(prev => prev ? {
      ...prev,
      chatMessages: [...prev.chatMessages, newMessage],
    } : null);

    setChatInput('');
  };

  const handleToggleReady = () => {
    if (!currentSession) return;

    setCurrentSession(prev => prev ? {
      ...prev,
      participants: prev.participants.map(p =>
        p.userId === 'current_user' ? { ...p, isReady: !p.isReady } : p
      ),
    } : null);
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    if (!currentSession) return;

    setCurrentSession(prev => prev ? {
      ...prev,
      participants: prev.participants.map(p =>
        p.userId === 'current_user' ? { ...p, isMuted: !p.isMuted } : p
      ),
    } : null);
  };

  const handleStartPractice = () => {
    if (!currentSession) return;

    setCurrentSession(prev => prev ? {
      ...prev,
      status: prev.status === 'waiting' ? 'active' : 'waiting',
    } : null);
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [currentSession?.chatMessages]);

  const getVoiceTypeEmoji = (voiceType: string) => {
    switch (voiceType) {
      case 'soprano': return '🎵';
      case 'alto': return '🎤';
      case 'tenor': return '🎙️';
      case 'bass': return '🔊';
      default: return '🎤';
    }
  };

  const getPartColor = (part: Participant['part']) => {
    switch (part) {
      case 'melody': return 'bg-blue-100 text-blue-800';
      case 'harmony': return 'bg-green-100 text-green-800';
      case 'bass': return 'bg-purple-100 text-purple-800';
      case 'alto': return 'bg-yellow-100 text-yellow-800';
      case 'tenor': return 'bg-red-100 text-red-800';
      case 'soprano': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ago`;
  };

  const renderBrowseRooms = () => (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <ResponsiveText size="2xl" weight="semibold">
            🎵 Practice Rooms
          </ResponsiveText>
          <ResponsiveText size="md" color="text-gray-600" className="mt-1">
            Join collaborative practice sessions with singers worldwide
          </ResponsiveText>
        </div>
        <ResponsiveButton
          onClick={() => setActiveView('create')}
          variant="primary"
          size={{ mobile: 'lg', tablet: 'lg', desktop: 'lg' }}
        >
          ✨ Create Room
        </ResponsiveButton>
      </div>

      {/* Room Grid */}
      <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 3 }} gap={6}>
        {mockPracticeRooms.map(room => (
          <ResponsiveCard key={room.id} className="hover:shadow-lg transition-shadow">
            <div className="space-y-4">
              {/* Room Header */}
              <div className="flex items-start justify-between">
                <div>
                  <ResponsiveText size="lg" weight="semibold">
                    {room.name}
                  </ResponsiveText>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      room.type === 'duet' ? 'bg-blue-100 text-blue-800' :
                      room.type === 'group' ? 'bg-purple-100 text-purple-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {room.type.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      room.skillLevel === 'beginner' ? 'bg-green-100 text-green-800' :
                      room.skillLevel === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                      room.skillLevel === 'advanced' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {room.skillLevel.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                {room.isActive && (
                  <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    🔴 Live
                  </div>
                )}
              </div>

              {/* Room Description */}
              <ResponsiveText size="md" color="text-gray-600">
                {room.description}
              </ResponsiveText>

              {/* Exercise Info */}
              {room.exercise && (
                <div className="bg-indigo-50 p-3 rounded-lg">
                  <ResponsiveText size="sm" weight="medium" className="mb-1">
                    📋 Current Exercise
                  </ResponsiveText>
                  <div className="text-sm text-indigo-800">
                    {room.exercise.title} • {room.exercise.key} • {room.exercise.tempo} BPM
                  </div>
                </div>
              )}

              {/* Host Info */}
              <div className="flex items-center gap-3">
                <img
                  src={room.hostAvatar}
                  alt={room.hostName}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <div className="font-medium">{room.hostName}</div>
                  <div className="text-sm text-gray-600">Room Host</div>
                </div>
              </div>

              {/* Participants */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {room.currentParticipants}/{room.maxParticipants} participants
                  </span>
                  <span className="text-sm text-gray-600">• {room.duration}min</span>
                </div>
                <span className="text-sm text-gray-500">
                  Created {formatTimeAgo(room.createdAt)}
                </span>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {room.tags.map(tag => (
                  <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Join Button */}
              <ResponsiveButton
                onClick={() => handleRoomJoin(room)}
                variant="primary"
                size={{ mobile: 'lg', tablet: 'lg', desktop: 'lg' }}
                fullWidth
                disabled={room.currentParticipants >= room.maxParticipants}
              >
                {room.currentParticipants >= room.maxParticipants ? 'Room Full' : '🎤 Join Room'}
              </ResponsiveButton>
            </div>
          </ResponsiveCard>
        ))}
      </ResponsiveGrid>
    </div>
  );

  const renderCreateRoom = () => (
    <div className="space-y-6">
      <ResponsiveText size="2xl" weight="semibold" className="text-center">
        ✨ Create Practice Room
      </ResponsiveText>

      <ResponsiveCard className="max-w-2xl mx-auto">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room Name *
            </label>
            <input
              type="text"
              value={newRoom.name}
              onChange={(e) => setNewRoom(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="My Awesome Practice Room"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={newRoom.description}
              onChange={(e) => setNewRoom(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
              placeholder="Describe what you'll be practicing in this room..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room Type
              </label>
              <select
                value={newRoom.type}
                onChange={(e) => setNewRoom(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="duet">Duet (2 people)</option>
                <option value="group">Group Practice (4-6 people)</option>
                <option value="harmony">Harmony Workshop (3-4 people)</option>
                <option value="round_robin">Round Robin (up to 8 people)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skill Level
              </label>
              <select
                value={newRoom.skillLevel}
                onChange={(e) => setNewRoom(prev => ({ ...prev, skillLevel: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="all_levels">All Levels Welcome</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes)
              </label>
              <select
                value={newRoom.duration}
                onChange={(e) => setNewRoom(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Participants
              </label>
              <select
                value={newRoom.maxParticipants}
                onChange={(e) => setNewRoom(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={2}>2 people</option>
                <option value={3}>3 people</option>
                <option value={4}>4 people</option>
                <option value={6}>6 people</option>
                <option value={8}>8 people</option>
              </select>
            </div>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={newRoom.isPublic}
                onChange={(e) => setNewRoom(prev => ({ ...prev, isPublic: e.target.checked }))}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">
                Make this room public (anyone can join)
              </span>
            </label>
          </div>

          <div className="flex gap-4">
            <ResponsiveButton
              onClick={() => setActiveView('browse')}
              variant="outline"
              size={{ mobile: 'lg', tablet: 'lg', desktop: 'lg' }}
              fullWidth
            >
              Cancel
            </ResponsiveButton>
            <ResponsiveButton
              onClick={handleRoomCreate}
              variant="primary"
              size={{ mobile: 'lg', tablet: 'lg', desktop: 'lg' }}
              fullWidth
            >
              🚀 Create Room
            </ResponsiveButton>
          </div>
        </div>
      </ResponsiveCard>
    </div>
  );

  const renderPracticeSession = () => {
    if (!currentSession || !selectedRoom) return null;

    const currentUser = currentSession.participants.find(p => p.userId === 'current_user');

    return (
      <div className="space-y-6">
        {/* Session Header */}
        <ResponsiveCard>
          <div className="flex items-center justify-between">
            <div>
              <ResponsiveText size="2xl" weight="semibold">
                {selectedRoom.name}
              </ResponsiveText>
              <ResponsiveText size="md" color="text-gray-600">
                Host: {selectedRoom.hostName} • {selectedRoom.currentParticipants}/{selectedRoom.maxParticipants} participants
              </ResponsiveText>
            </div>
            <div className="flex gap-2">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                currentSession.status === 'active' ? 'bg-green-100 text-green-800' :
                currentSession.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {currentSession.status === 'active' ? '🎤 Active' :
                 currentSession.status === 'paused' ? '⏸️ Paused' : '⏳ Waiting'}
              </div>
              <ResponsiveButton
                variant="outline"
                size={{ mobile: 'md', tablet: 'md', desktop: 'md' }}
                onClick={() => setActiveView('browse')}
              >
                Leave Room
              </ResponsiveButton>
            </div>
          </div>
        </ResponsiveCard>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Participants */}
          <div className="lg:col-span-2 space-y-6">
            {/* Practice Area */}
            <ResponsiveCard>
              <div className="text-center space-y-6">
                {selectedRoom.exercise && (
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <ResponsiveText size="lg" weight="semibold" className="mb-2">
                      📋 {selectedRoom.exercise.title}
                    </ResponsiveText>
                    <ResponsiveText size="md" color="text-indigo-700">
                      {selectedRoom.exercise.key} • {selectedRoom.exercise.tempo} BPM • {selectedRoom.exercise.difficulty}
                    </ResponsiveText>
                  </div>
                )}

                {/* Practice Controls */}
                <div className="flex justify-center gap-4">
                  <ResponsiveButton
                    onClick={handleToggleReady}
                    variant={currentUser?.isReady ? "primary" : "outline"}
                    size={{ mobile: 'lg', tablet: 'lg', desktop: 'lg' }}
                  >
                    {currentUser?.isReady ? '✅ Ready' : '⭕ Not Ready'}
                  </ResponsiveButton>
                  <ResponsiveButton
                    onClick={handleStartPractice}
                    variant="primary"
                    size={{ mobile: 'lg', tablet: 'lg', desktop: 'lg' }}
                    disabled={!currentUser?.isReady}
                  >
                    {currentSession.status === 'waiting' ? '🎤 Start Practice' : '⏸️ Pause'}
                  </ResponsiveButton>
                  <ResponsiveButton
                    onClick={handleToggleMute}
                    variant={isMuted ? "secondary" : "outline"}
                    size={{ mobile: 'lg', tablet: 'lg', desktop: 'lg' }}
                  >
                    {isMuted ? '🔇 Unmute' : '🎤 Mute'}
                  </ResponsiveButton>
                </div>

                {/* Recording Status */}
                {currentSession.status === 'active' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <ResponsiveText size="md" color="text-red-800" weight="medium">
                        Session Recording Active
                      </ResponsiveText>
                    </div>
                  </div>
                )}

                {/* Visual Practice Area */}
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8">
                  <ResponsiveText size="lg" color="text-gray-600">
                    {currentSession.status === 'waiting' ? 'Waiting for all participants to be ready...' :
                     currentSession.status === 'active' ? 'Practice in progress...' :
                     'Session paused'}
                  </ResponsiveText>
                  {currentSession.status === 'active' && (
                    <div className="mt-4 text-6xl animate-pulse">
                      🎵
                    </div>
                  )}
                </div>
              </div>
            </ResponsiveCard>

            {/* Participants List */}
            <ResponsiveCard>
              <ResponsiveText size="lg" weight="semibold" className="mb-4">
                👥 Participants
              </ResponsiveText>
              <div className="space-y-3">
                {currentSession.participants.map(participant => (
                  <div
                    key={participant.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      participant.userId === 'current_user' ? 'bg-indigo-50 border border-indigo-200' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={participant.avatar}
                          alt={participant.displayName}
                          className="w-10 h-10 rounded-full"
                        />
                        {participant.isHost && (
                          <div className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                            👑
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">
                          {participant.displayName}
                          {participant.userId === 'current_user' && ' (You)'}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>{getVoiceTypeEmoji(participant.voiceType)} {participant.voiceType}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${getPartColor(participant.part)}`}>
                            {participant.part}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {participant.isReady && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Ready</span>
                      )}
                      {participant.isMuted && (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">🔇</span>
                      )}
                      {participant.isRecording && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">⏺️</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ResponsiveCard>
          </div>

          {/* Chat */}
          <div className="space-y-4">
            <ResponsiveCard className="h-[600px] flex flex-col">
              <ResponsiveText size="lg" weight="semibold" className="mb-4">
                💬 Chat
              </ResponsiveText>

              {/* Chat Messages */}
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto space-y-3 mb-4 p-4 bg-gray-50 rounded-lg"
              >
                {currentSession.chatMessages.map(message => (
                  <div
                    key={message.id}
                    className={`${message.type === 'system' ? 'text-center' : message.senderId === 'current_user' ? 'text-right' : 'text-left'}`}
                  >
                    <div
                      className={`inline-block max-w-xs p-3 rounded-lg ${
                        message.type === 'system' ? 'bg-gray-200 text-gray-700 text-sm' :
                        message.senderId === 'current_user' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200'
                      }`}
                    >
                      {message.type !== 'system' && (
                        <div className="font-medium text-xs mb-1 opacity-75">
                          {message.senderId !== 'current_user' && message.senderName}
                        </div>
                      )}
                      <div className="text-sm">{message.content}</div>
                      <div className={`text-xs mt-1 opacity-75 ${
                        message.type === 'system' || message.senderId === 'current_user' ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        {formatTimeAgo(message.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <ResponsiveButton
                  onClick={handleSendMessage}
                  variant="primary"
                  size={{ mobile: 'md', tablet: 'md', desktop: 'md' }}
                  disabled={!chatInput.trim()}
                >
                  Send
                </ResponsiveButton>
              </div>
            </ResponsiveCard>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {activeView === 'browse' && renderBrowseRooms()}
      {activeView === 'create' && renderCreateRoom()}
      {activeView === 'session' && renderPracticeSession()}
    </div>
  );
}