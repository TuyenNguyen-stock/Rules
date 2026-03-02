import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Board } from './components/Board';
import { OnlineMenu } from './components/OnlineMenu';
import { RockPaperScissors } from './components/RockPaperScissors';
import { AvatarSelector } from './components/AvatarSelector';
import { AvatarDisplay } from './components/AvatarDisplay';
import { ChatWindow } from './components/ChatWindow';
import { createEmptyBoard, checkWin, getBestMove } from './services/gameLogic';
import { GameMode, OnlineState, Player, Position, RPSMove, DataPacket, ChatMessage } from './types';

// Declare PeerJS globally (loaded via CDN)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Peer: any;

// LOGO CONSTANT (SVG Base64)
const LOGO_SRC = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj4KICA8Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9Ijk4IiBmaWxsPSIjMDIxMjE4IiAvPgogIDxwYXRoIGlkPSJjdXJ2ZVRvcCIgZD0iTSA0MCwxMDAgQSA2MCw2MCAwIDEgMSAxNjAsMTAwIiBmaWxsPSJ0cmFuc3BhcmVudCIgLz4KICA8cGF0aCBpZD0iY3VydmVCb3QiIGQ9Ik0gMzUsMTAwIEEgNjUsNjUgMCAwIDAgMTY1LDEwMCIgZmlsbD0idHJhbnNwYXJlbnQiIC8+CiAgPHBhdGggZD0iTSAyNSwxMDAgQSA3NSw3NSAwIDEgMSAxNzUsMTAwIiBmaWxsPSJub25lIiBzdHJva2U9IiNlMmMwODAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWRhc2hhcnJheT0iMCwyMDUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgdHJhbnNmb3JtPSJyb3RhdGUoLTE1NSAxMDAgMTAwKSIvPgogIDxwYXRoIGQ9Ik0gMjUsMTAwIEEgNzUsNzUgMCAxIDAgMTc1LDEwMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZTJjMDgwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1kYXNoYXJyYXk9IjAsMjA1IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHRyYW5zZm9ybT0icm90YXRlKDI1IDEwMCAxMDApIi8+CiAgPHRleHQgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSJib2xkIiBmb250LXNpemU9IjIyIiBmaWxsPSIjZTJjMDgwIiBsZXR0ZXItc3BhY2luZz0iNCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+CiAgICA8dGV4dFBhdGggaHJlZj0iI2N1cnZlVG9wIiBzdGFydE9mZnNldD0iNTAlIj5UVVlFTk5HPC90ZXh0UGF0aD4KICA8L3RleHQ+CiAgPHRleHQgZm9udC1mYW1pbHk9InNlcmlmIiBmb250LXdlaWdodD0iaXRhbGljIiBmb250LXNpemU9IjkwIiBmaWxsPSIjZTJjMDgwIiB4PSIxMDAiIHk9IjEzNSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+VDwvdGV4dD4KICA8dGV4dCBmb250LWZhbWlseT0ibW9ub3NwYWNlIiBmb250LXdlaWdodD0iYm9sZCIgZm9udC1zaXplPSIxNiIgZmlsbD0iI2UyYzA4MCIgbGV0dGVyLXNwYWNpbmc9IjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiPgogICAgPHRleHRQYXRoIGhyZWY9IiNjdXJ2ZUJvdCIgc3RhcnRPZmZzZXQ9IjUwJSI+SzE1VEgwMDM5PC90ZXh0UGF0aD4KICA8L3RleHQ+Cjwvc3ZnPg==";

type StartOption = 'YOU' | 'AI' | 'RANDOM';

function App() {
  // --- UI State ---
  const [localName, setLocalName] = useState(() => {
    try {
        return localStorage.getItem('caro_username') || 'Bạn';
    } catch { return 'Bạn'; }
  });
  const [localAvatar, setLocalAvatar] = useState(() => {
    try {
        return localStorage.getItem('caro_useravatar') || '😎';
    } catch { return '😎'; }
  });
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => { try { localStorage.setItem('caro_username', localName); } catch (e) { console.warn(e); } }, [localName]);
  useEffect(() => { try { localStorage.setItem('caro_useravatar', localAvatar); } catch (e) { console.warn(e); } }, [localAvatar]);

  // --- Game State ---
  const [mode, setMode] = useState<GameMode | null>(null);
  const [board, setBoard] = useState(createEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [myPlayerSide, setMyPlayerSide] = useState<Player>('X'); 
  const [winner, setWinner] = useState<Player | 'DRAW' | null>(null);
  const [winningLine, setWinningLine] = useState<Position[] | null>(null);
  const [history, setHistory] = useState<Position[]>([]);
  
  // FIX: Điểm số lưu theo "Tôi" (me) và "Đối thủ" (opponent)
  const [score, setScore] = useState({ me: 0, opponent: 0 });
  
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [pveStartOption, setPveStartOption] = useState<StartOption | null>(null);

  // --- Refs ---
  const boardRef = useRef(board);
  const winnerRef = useRef(winner);
  const myPlayerSideRef = useRef(myPlayerSide); 
  const scoreRef = useRef(score); 

  useEffect(() => { boardRef.current = board; }, [board]);
  useEffect(() => { winnerRef.current = winner; }, [winner]);
  useEffect(() => { myPlayerSideRef.current = myPlayerSide; }, [myPlayerSide]);
  useEffect(() => { scoreRef.current = score; }, [score]);


  // --- Online State ---
  const [onlineState, setOnlineState] = useState<OnlineState>({
    isHost: false,
    peerId: null,
    conn: null,
    status: 'DISCONNECTED',
    myName: 'Bạn',
    myAvatar: '😎',
    opponentName: 'Đối thủ',
    opponentAvatar: '👤'
  });
  const [onlineError, setOnlineError] = useState<string | null>(null);
  const peerRef = useRef<any>(null);
  const connRef = useRef<any>(null);
  const opponentAvatarLockedRef = useRef(false);

  // --- Chat State ---
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // --- RPS State ---
  const [rpsMyMove, setRpsMyMove] = useState<RPSMove>(null);
  const [rpsOpponentMove, setRpsOpponentMove] = useState<RPSMove>(null);
  const [rpsResult, setRpsResult] = useState<string | null>(null);

  // --- Reset Request State ---
  const [resetRequestFromOpponent, setResetRequestFromOpponent] = useState(false);
  const [waitingForResetResponse, setWaitingForResetResponse] = useState(false);

  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam && !mode) {
          setMode('PVP_ONLINE');
      }
  }, []);

  // --- SHORT ID GENERATOR ---
  const generateShortId = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; 
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const playSoundEffect = (type: 'WIN' | 'START' | 'MOVE') => {
      try {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContext) {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            const now = ctx.currentTime;
            
            if (type === 'WIN') {
                const notes = [523.25, 659.25, 783.99, 1046.50];
                notes.forEach((freq, i) => {
                    const osc2 = ctx.createOscillator();
                    const gain2 = ctx.createGain();
                    osc2.connect(gain2);
                    gain2.connect(ctx.destination);
                    osc2.type = 'square';
                    osc2.frequency.value = freq;
                    const start = now + i * 0.1;
                    gain2.gain.setValueAtTime(0.1, start);
                    gain2.gain.exponentialRampToValueAtTime(0.01, start + 0.4);
                    osc2.start(start);
                    osc2.stop(start + 0.4);
                });
            } else if (type === 'START') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
                osc.start(now);
                osc.stop(now + 0.5);
            } else if (type === 'MOVE') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, now);
                gain.gain.setValueAtTime(0.05, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
            }
          }
      } catch (e) {}
  };

  const startGamePVE = (startWho: StartOption) => {
    setMode('PVE');
    setPveStartOption(null);
    setBoard(createEmptyBoard());
    setWinner(null);
    setWinningLine(null);
    setHistory([]);
    setScore({ me: 0, opponent: 0 }); // Reset về 0-0
    setIsAiThinking(false);
    
    setOnlineState(prev => ({ 
        ...prev, 
        myName: localName, 
        myAvatar: localAvatar,
        opponentName: 'AI Bot',
        opponentAvatar: '🤖'
    }));

    let firstPlayer: Player = 'X';
    let userSide: Player = 'X';

    if (startWho === 'YOU') {
        firstPlayer = 'X'; userSide = 'X';
    } else if (startWho === 'AI') {
        firstPlayer = 'X'; userSide = 'O';
    } else {
        if (Math.random() > 0.5) { firstPlayer = 'X'; userSide = 'X'; }
        else { firstPlayer = 'X'; userSide = 'O'; }
    }

    setCurrentPlayer(firstPlayer);
    setMyPlayerSide(userSide);
    playSoundEffect('START');
  };

  const startGameLocal = (name: string, avatar: string) => {
     setOnlineState(prev => ({
         ...prev, 
         myName: name || 'Người 1', 
         myAvatar: avatar,
         opponentName: 'Người 2',
         opponentAvatar: '👤'
    }));
     setScore({ me: 0, opponent: 0 }); 
     setMode('PVP_LOCAL');
     resetGame();
     playSoundEffect('START');
  }

  const resetGame = useCallback(() => {
    setBoard(createEmptyBoard());
    setWinner(null);
    setWinningLine(null);
    setHistory([]);
    setCurrentPlayer('X'); 
    setIsAiThinking(false);
    setResetRequestFromOpponent(false);
    setWaitingForResetResponse(false);
    // KHÔNG reset điểm ở đây
  }, []);

  const startRPSPhase = useCallback(() => {
    setBoard(createEmptyBoard());
    setWinner(null);
    setWinningLine(null);
    setHistory([]);
    setResetRequestFromOpponent(false);
    setWaitingForResetResponse(false);
    
    setRpsMyMove(null);
    setRpsOpponentMove(null);
    setRpsResult(null);
    
    setOnlineState(prev => ({ ...prev, status: 'RPS_BATTLE' }));
  }, []);

  const processMove = useCallback((x: number, y: number, player: Player, isRemote: boolean, remoteScore?: {me: number, opponent: number}) => {
    const currentBoard = boardRef.current;
    if (currentBoard[y][x] !== null || winnerRef.current) return null;

    const newBoard = currentBoard.map(row => [...row]);
    newBoard[y][x] = player;
    
    setBoard(newBoard);
    
    const wLine = checkWin(newBoard, x, y, player);
    let calculatedScore = null;

    if (wLine) {
        setWinner(player);
        setWinningLine(wLine);
        
        if (isRemote && remoteScore) {
            // ĐỒNG BỘ TUYỆT ĐỐI TỪ ĐỐI THỦ
            const syncedScore = { me: remoteScore.opponent, opponent: remoteScore.me };
            setScore(syncedScore);
        } else {
            // TỰ TÍNH TOÁN
            const currentScore = scoreRef.current;
            const isMe = player === myPlayerSideRef.current;
            
            calculatedScore = {
                me: isMe ? currentScore.me + 1 : currentScore.me,
                opponent: !isMe ? currentScore.opponent + 1 : currentScore.opponent
            };
            
            setScore(calculatedScore);
        }
        
        playSoundEffect('WIN');
    } else if (newBoard.every(row => row.every(c => c !== null))) {
        setWinner('DRAW');
    } else {
        setCurrentPlayer(p => p === 'X' ? 'O' : 'X');
        playSoundEffect('MOVE');
    }
    
    setHistory(prev => [...prev, { x, y }]);
    return calculatedScore; // Trả về điểm để gửi đi nếu thắng
  }, []);

  // Ref để giữ hàm processMove mới nhất
  const processMoveRef = useRef(processMove);
  useEffect(() => { processMoveRef.current = processMove; }, [processMove]);

  const onCellClick = (x: number, y: number) => {
    if (winner || board[y][x] || isAiThinking || waitingForResetResponse || resetRequestFromOpponent) return;

    if (mode === 'PVP_ONLINE') {
      if (currentPlayer !== myPlayerSide) return;
      if (connRef.current && connRef.current.open) {
        // Xử lý nước đi cục bộ
        const winScore = processMove(x, y, myPlayerSide, false);
        
        // Gửi gói tin
        const payload: DataPacket = { type: 'MOVE', x, y, player: myPlayerSide };
        if (winScore) {
            payload.score = winScore; // {me, opponent} theo góc nhìn của MÌNH
        }
        connRef.current.send(payload);
      }
    } else if (mode === 'PVE') {
        if (currentPlayer !== myPlayerSide) return;
        processMove(x, y, currentPlayer, false);
    } else {
        processMove(x, y, currentPlayer, false);
    }
  };

  const undoMove = () => {
    if (history.length === 0 || winner || mode === 'PVP_ONLINE' || waitingForResetResponse) return;
    const steps = mode === 'PVE' ? 2 : 1;
    if (history.length < steps) { resetGame(); return; }

    const newHistory = history.slice(0, history.length - steps);
    setHistory(newHistory);
    
    setBoard(prev => {
        const nb = prev.map(r => [...r]);
        history.slice(history.length - steps).forEach(p => nb[p.y][p.x] = null);
        return nb;
    });
    
    if (mode === 'PVE') setCurrentPlayer(myPlayerSide); 
    else setCurrentPlayer(p => p === 'X' ? 'O' : 'X');
    
    setWinner(null);
    setWinningLine(null);
  };

  const requestOnlineReset = () => {
      if (mode !== 'PVP_ONLINE' || !connRef.current) {
          resetGame();
          return;
      }
      setWaitingForResetResponse(true);
      connRef.current.send({ type: 'RESET_REQUEST' });
  }

  const respondToReset = (accept: boolean) => {
      setResetRequestFromOpponent(false);
      if (accept) {
          startRPSPhase(); 
          connRef.current.send({ type: 'RESET_RESPONSE', accept: true });
      } else {
          connRef.current.send({ type: 'RESET_RESPONSE', accept: false });
      }
  }

  // --- LOGIC XIN THUA (SURRENDER) ---
  const handleSurrender = () => {
      if (winner) return;
      
      const currentScore = scoreRef.current;
      
      if (mode === 'PVP_ONLINE') {
          if (connRef.current) {
               // Mình thua -> Đối thủ +1
               const newScore = { me: currentScore.me, opponent: currentScore.opponent + 1 };
               setScore(newScore);
               
               // Gửi gói tin đầu hàng kèm điểm số
               connRef.current.send({ type: 'SURRENDER', score: newScore });
               
               // Set người thắng là đối thủ
               setWinner(myPlayerSide === 'X' ? 'O' : 'X');
               playSoundEffect('WIN');
          }
      } else if (mode === 'PVE') {
           setScore(prev => ({ ...prev, opponent: prev.opponent + 1 }));
           setWinner(myPlayerSide === 'X' ? 'O' : 'X');
           playSoundEffect('WIN');
      } else if (mode === 'PVP_LOCAL') {
           // Trong local, ai bấm xin thua thì người kia thắng
           // Giả sử nút này chỉ hiện khi không có winner. 
           // Local thì nút này hoạt động như "Kết thúc ván"
           const winnerSide = currentPlayer === 'X' ? 'O' : 'X';
           setScore(prev => ({ 
               me: winnerSide === 'X' ? prev.me + 1 : prev.me,
               opponent: winnerSide === 'O' ? prev.opponent + 1 : prev.opponent
           }));
           setWinner(winnerSide);
           playSoundEffect('WIN');
      }
  }
  
  // --- LOGIC YÊU CẦU VÁN MỚI (CHỈ KHI ĐÃ HẾT VÁN) ---
  const handleNewGameRequest = () => {
      if (mode === 'PVP_ONLINE') {
          if (connRef.current) {
              setWaitingForResetResponse(true);
              connRef.current.send({ type: 'RESET_REQUEST' });
          }
      } else {
          resetGame();
      }
  };

  useEffect(() => {
    if (mode === 'PVE' && currentPlayer !== myPlayerSide && !winner) {
      setIsAiThinking(true);
      const timer = setTimeout(() => {
        const aiSide = myPlayerSide === 'X' ? 'O' : 'X';
        const move = getBestMove(board, aiSide);
        processMove(move.x, move.y, aiSide, false);
        setIsAiThinking(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentPlayer, mode, winner, board, myPlayerSide, processMove]);

  // --- ONLINE LOGIC & RPS & CHAT ---
  const handleRPSSelect = (move: RPSMove) => {
      setRpsMyMove(move);
      if (connRef.current) {
          connRef.current.send({ type: 'RPS_MOVE', move });
      }
      checkRPSResult(move, rpsOpponentMove);
  }

  const checkRPSResult = (my: RPSMove, opp: RPSMove) => {
      if (!my || !opp) return;
      let iWin = false, draw = false;
      if (my === opp) draw = true;
      else if (
          (my === 'ROCK' && opp === 'SCISSORS') ||
          (my === 'PAPER' && opp === 'ROCK') ||
          (my === 'SCISSORS' && opp === 'PAPER')
      ) iWin = true;

      if (draw) {
          setRpsResult("Hòa! Đấu lại...");
          setTimeout(() => {
              setRpsMyMove(null);
              setRpsOpponentMove(null);
              setRpsResult(null);
          }, 2000);
      } else {
          setRpsResult(iWin ? "Bạn thắng! Bạn đi trước (X)" : `${onlineState.opponentName} thắng! Họ đi trước (X)`);
          setTimeout(() => {
              setOnlineState(prev => ({ ...prev, status: 'CONNECTED' }));
              setMyPlayerSide(iWin ? 'X' : 'O');
              setCurrentPlayer('X'); 
          }, 2500);
      }
  }

  const sendChatMessage = (text: string) => {
      if (!connRef.current) return;
      const msg: ChatMessage = {
          id: Date.now().toString(),
          sender: 'ME',
          text,
          timestamp: Date.now()
      };
      setMessages(prev => [...prev, msg]);
      connRef.current.send({ type: 'CHAT', text });
  }

  const initPeer = (currentName: string, currentAvatar: string, specificId: string | null = null) => {
    if (peerRef.current && !peerRef.current.destroyed) return peerRef.current;
    const peer = new Peer(specificId, { 
        debug: 1,
        config: { 
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' }, 
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun3.l.google.com:19302' },
                { urls: 'stun:stun4.l.google.com:19302' },
                { urls: 'stun:global.stun.twilio.com:3478' }
            ] 
        }
    });
    peerRef.current = peer;

    peer.on('open', (id: string) => {
      setOnlineState(prev => ({ ...prev, peerId: id }));
    });
    
    peer.on('connection', (conn: any) => handleConnection(conn, currentName, currentAvatar));
    
    peer.on('error', (err: any) => {
      if (err.type === 'unavailable-id') {
          if (specificId) {
             peer.destroy();
             peerRef.current = null;
             setTimeout(() => createRoom(currentName, currentAvatar), 200);
             return;
          }
      }
      setOnlineError("Lỗi: " + err.type + ". Vui lòng thử lại.");
      setOnlineState(prev => ({ ...prev, status: 'ERROR' }));
    });
    return peer;
  };

  const handleConnection = (conn: any, myName: string, myAvatar: string) => {
    connRef.current = conn;
    let helloInterval: any = null;
    let isHandshakeComplete = false;
    opponentAvatarLockedRef.current = false;

    const isLargeAvatar = myAvatar.startsWith('data:') && myAvatar.length > 5000;
    const handshakeAvatar = isLargeAvatar ? 'WAITING' : myAvatar;

    const sendHello = () => {
        try {
            if (conn.open) {
                conn.send({ type: 'HELLO', name: myName, avatar: handshakeAvatar, ack: false });
            }
        } catch (e) {}
    };
    
    if (conn.open) {
        sendHello();
        helloInterval = setInterval(sendHello, 500); 
    } else {
        conn.on('open', () => {
            sendHello();
            helloInterval = setInterval(sendHello, 500);
        });
    }

    conn.on('data', (data: DataPacket) => {
      if (data.type === 'HELLO') {
           const finalizeHandshake = () => {
               if (helloInterval) { clearInterval(helloInterval); helloInterval = null; }
               
               if (!isHandshakeComplete) {
                   isHandshakeComplete = true;
                   
                   setOnlineState(prev => {
                       let resolvedOpponentAvatar = data.avatar || '👤';
                       
                       if (opponentAvatarLockedRef.current) {
                           resolvedOpponentAvatar = prev.opponentAvatar;
                       } else if (data.avatar === 'WAITING') {
                           resolvedOpponentAvatar = '👤';
                       }

                       return { 
                           ...prev, 
                           status: 'RPS_BATTLE', 
                           conn, 
                           opponentName: data.name || 'Đối thủ',
                           opponentAvatar: resolvedOpponentAvatar
                       };
                   });

                   setScore({ me: 0, opponent: 0 }); // Reset score khi kết nối mới
                   setMessages([]); 
                   setOnlineError(null);
                   setRpsMyMove(null);
                   setRpsOpponentMove(null);
                   setRpsResult(null);
                   try { if (window.history.pushState) { const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname; window.history.pushState({path:newUrl},'',newUrl); } } catch (e) {}

                   if (isLargeAvatar) {
                       setTimeout(() => {
                           if (conn.open) {
                               conn.send({ type: 'AVATAR_DATA', avatar: myAvatar });
                           }
                       }, 1000); 
                   }
               }
           };

           if (data.ack) {
               finalizeHandshake();
               return; 
           }

           try { conn.send({ type: 'HELLO', name: myName, avatar: handshakeAvatar, ack: true }); } catch (e) {}
           finalizeHandshake();
      }
      else if (data.type === 'AVATAR_DATA') {
          opponentAvatarLockedRef.current = true;
          setOnlineState(prev => ({ ...prev, opponentAvatar: data.avatar }));
      }
      else if (data.type === 'RPS_MOVE') setRpsOpponentMove(data.move);
      else if (data.type === 'MOVE') {
          // data.score ở đây là {me, opponent} của ĐỐI THỦ
          processMoveRef.current(data.x, data.y, data.player, true, data.score);
      }
      else if (data.type === 'SURRENDER') {
          // Đối thủ đầu hàng
          // data.score là {me: điểm đối thủ, opponent: điểm mình} (từ góc nhìn đối thủ)
          if (data.score) {
              setScore({ me: data.score.opponent, opponent: data.score.me });
          } else {
              setScore(prev => ({ ...prev, me: prev.me + 1 }));
          }
          // Set winner là MÌNH
          setWinner(myPlayerSideRef.current);
          playSoundEffect('WIN');
      }
      else if (data.type === 'RESET_REQUEST') setResetRequestFromOpponent(true);
      else if (data.type === 'RESET_RESPONSE') {
          setWaitingForResetResponse(false);
          if (data.accept) startRPSPhase(); 
          else alert('Đối thủ đã từ chối làm mới ván cờ.');
      }
      else if (data.type === 'CHAT') {
          setMessages(prev => [...prev, {
              id: Date.now().toString() + Math.random(),
              sender: 'THEM',
              text: data.text,
              timestamp: Date.now()
          }]);
          setUnreadCount(prev => prev + 1);
      }
    });

    conn.on('close', () => {
      if (helloInterval) clearInterval(helloInterval);
      alert('Đối thủ đã thoát!');
      setOnlineState(prev => ({ ...prev, status: 'DISCONNECTED', conn: null }));
      setMode(null);
      setMessages([]);
    });
    
    setTimeout(() => { if (helloInterval) clearInterval(helloInterval); }, 15000);
  };
  
  useEffect(() => {
      if (isChatOpen) setUnreadCount(0);
  }, [isChatOpen, messages]);

  useEffect(() => {
      if (onlineState.status === 'RPS_BATTLE' && rpsMyMove && rpsOpponentMove && !rpsResult) {
          checkRPSResult(rpsMyMove, rpsOpponentMove);
      }
  }, [rpsMyMove, rpsOpponentMove, onlineState.status, rpsResult]);

  const createRoom = (name: string, avatar: string) => {
    setLocalName(name);
    setLocalAvatar(avatar);

    if (peerRef.current) peerRef.current.destroy();
    setOnlineError(null);
    setOnlineState(prev => ({ ...prev, isHost: true, status: 'CONNECTING', peerId: null, myName: name, myAvatar: avatar }));
    
    const shortId = generateShortId();
    initPeer(name, avatar, shortId);
  };

  const joinRoom = (hostId: string, name: string, avatar: string) => {
    setLocalName(name);
    setLocalAvatar(avatar);

    const cleanId = hostId.trim().toUpperCase();
    if (!cleanId) return;
    setOnlineError(null);
    setOnlineState(prev => ({ ...prev, isHost: false, status: 'CONNECTING', myName: name, myAvatar: avatar }));
    
    const peer = initPeer(name, avatar, null); 
    
    let attempt = 0;
    const tryConnect = () => {
        attempt++;
        if (!peer || peer.destroyed) return;

        if (!peer.open || !peer.id) { 
            if (attempt > 40) { 
                setOnlineError("Không thể kết nối tới máy chủ PeerJS. Vui lòng thử lại.");
                setOnlineState(prev => ({ ...prev, status: 'ERROR' }));
                return;
            }
            setTimeout(tryConnect, 200); 
            return; 
        }

        const conn = peer.connect(cleanId, { reliable: true, serialization: 'json' });
        const connTimeout = setTimeout(() => {
             if (connRef.current && !connRef.current.open) {
                 setOnlineError("Không tìm thấy phòng hoặc đối thủ không phản hồi.");
                 setOnlineState(prev => ({ ...prev, status: 'ERROR' }));
             }
        }, 8000);

        conn.on('open', () => clearTimeout(connTimeout));
        conn.on('error', () => clearTimeout(connTimeout));
        handleConnection(conn, name, avatar);
    };
    tryConnect();
  };
  
  const destroyPeer = () => {
      if (connRef.current) { connRef.current.close(); connRef.current = null; }
      if (peerRef.current) { peerRef.current.destroy(); peerRef.current = null; }
      setOnlineState(prev => ({...prev, isHost: false, peerId: null, status: 'DISCONNECTED'}));
  };

  const copyInviteLink = () => {
      if (!onlineState.peerId) return;
      const url = `${window.location.protocol}//${window.location.host}${window.location.pathname}?room=${onlineState.peerId}`;
      navigator.clipboard.writeText(url).then(() => {
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
      });
  };

  const getPlayerInfo = (side: Player) => {
      if (mode === 'PVE') return myPlayerSide === side ? { name: localName, avatar: localAvatar } : { name: 'AI Bot', avatar: '🤖' };
      if (mode === 'PVP_ONLINE') return myPlayerSide === side ? { name: onlineState.myName, avatar: onlineState.myAvatar } : { name: onlineState.opponentName, avatar: onlineState.opponentAvatar };
      return side === 'X' ? { name: onlineState.myName, avatar: onlineState.myAvatar } : { name: onlineState.opponentName, avatar: '👤' };
  }

  // --- RENDERING ---

  // 1. Main Menu
  if (!mode && !pveStartOption) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
              <img src={LOGO_SRC} alt="Logo" className="w-24 h-24 rounded-full shadow-lg border-2 border-slate-600" />
          </div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-2">TUYENNG Caro AI</h1>
          <p className="text-slate-400 mb-6">Thách thức trí tuệ đỉnh cao</p>
          <div className="mb-6 flex flex-col gap-2 items-center">
             <label className="text-xs text-slate-500 w-full text-left ml-1">Chọn Avatar & Tên:</label>
             <AvatarSelector selectedAvatar={localAvatar} onSelect={setLocalAvatar} />
             <input type="text" value={localName} onChange={(e) => setLocalName(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white font-bold" maxLength={10} />
          </div>
          <div className="space-y-4">
            <button onClick={() => { setOnlineState(s => ({...s, myName: localName, myAvatar: localAvatar})); setPveStartOption('YOU'); }} className="w-full py-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-blue-500 rounded-xl text-lg font-bold flex items-center justify-center gap-2 group"><span>🤖</span> Đấu với AI</button>
            <button onClick={() => startGameLocal(localName, localAvatar)} className="w-full py-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-green-500 rounded-xl text-lg font-bold flex items-center justify-center gap-2 group"><span>👥</span> 2 Người (Local)</button>
            <button onClick={() => { destroyPeer(); setMode('PVP_ONLINE'); }} className="w-full py-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-purple-500 rounded-xl text-lg font-bold flex items-center justify-center gap-2 group"><span>🌐</span> Chơi Online (P2P)</button>
          </div>
          <div className="mt-8 text-xs text-slate-600 font-mono">v4.5.1 - Fix Large GIF Connection</div>
        </div>
      </div>
    );
  }

  // 2. PvE Start Selection
  if (pveStartOption) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
          <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center">
             <h2 className="text-2xl font-bold mb-4">Ai đi trước?</h2>
             <div className="space-y-3">
                 <button onClick={() => startGamePVE('YOU')} className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold">Bạn đi trước (X)</button>
                 <button onClick={() => startGamePVE('AI')} className="w-full py-3 bg-red-600 hover:bg-red-500 rounded-lg font-bold">AI đi trước (O)</button>
                 <button onClick={() => startGamePVE('RANDOM')} className="w-full py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold">Ngẫu nhiên</button>
             </div>
             <button onClick={() => setPveStartOption(null)} className="mt-4 text-slate-400 hover:text-white underline">Quay lại</button>
          </div>
        </div>
      );
  }

  // 3. Online Lobby
  if (mode === 'PVP_ONLINE' && onlineState.status !== 'CONNECTED' && onlineState.status !== 'RPS_BATTLE') {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
             <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-md w-full flex flex-col items-center">
                 <h2 className="text-2xl font-bold mb-6">Kết nối Online</h2>
                 {onlineState.isHost && (
                     <div className="text-center w-full animate-fade-in">
                         <p className="text-slate-400 mb-2">Gửi Mã Phòng hoặc quét QR:</p>
                         {onlineState.peerId ? (
                            <div className="flex flex-col gap-4 items-center">
                                <div className="bg-white p-2 rounded-lg shadow-lg">
                                    <img 
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.protocol}//${window.location.host}${window.location.pathname}?room=${onlineState.peerId}`)}`} 
                                        alt="QR Code" 
                                        className="w-32 h-32"
                                    />
                                </div>
                                <div className="bg-slate-950 p-4 rounded border border-slate-700 font-mono text-3xl font-bold tracking-widest select-all text-yellow-400">{onlineState.peerId}</div>
                                <button onClick={copyInviteLink} className={`px-4 py-2 rounded font-bold transition-all w-full ${copySuccess ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>
                                    {copySuccess ? 'Đã copy link!' : '📋 Sao chép Link Mời'}
                                </button>
                            </div>
                         ) : <div className="loader mx-auto mb-4"></div>}
                         <div className="flex items-center justify-center gap-2 text-slate-500 my-6"><div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>Đang chờ đối thủ...</div>
                         <p className="text-xs text-slate-600 mb-4 px-4">
                            Mẹo: Game sử dụng công nghệ P2P. Nếu bạn dùng 4G/5G mà không kết nối được, hãy thử chuyển sang WiFi hoặc tắt VPN.
                         </p>
                         <div className="border-t border-slate-700 pt-4"><p className="text-xs text-slate-500 mb-2">Bạn của bạn đã tạo phòng rồi?</p><button onClick={() => destroyPeer()} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded border border-slate-600 font-bold transition-colors text-sm">Hủy Host & Nhập mã</button></div>
                                </div>
                            )}
                            {!onlineState.isHost && (
                                <div className="w-full">{onlineState.status === 'CONNECTING' ? (<div className="text-center"><div className="text-slate-400 mb-2">Đang kết nối tới máy chủ...</div></div>) : (<OnlineMenu onCreate={createRoom} onJoin={joinRoom} onBack={() => { destroyPeer(); setMode(null); }} isConnecting={false} error={onlineError} initialName={localName} initialAvatar={localAvatar} />)}</div>
                            )}
                            <button onClick={() => { destroyPeer(); setMode(null); }} className="mt-6 text-slate-500 hover:text-white underline">Huỷ bỏ</button>
                        </div>
                    </div>
                )
            }

            return (
                <div className="h-[100dvh] w-full bg-slate-950 flex flex-col md:flex-row overflow-hidden relative">
                    {onlineState.status === 'RPS_BATTLE' && <RockPaperScissors myMove={rpsMyMove} opponentMove={rpsOpponentMove} onSelect={handleRPSSelect} resultMessage={rpsResult} opponentName={onlineState.opponentName} />}
                    {resetRequestFromOpponent && <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"><div className="bg-slate-800 p-6 rounded-xl border border-slate-600 shadow-2xl max-w-sm w-full text-center animate-bounce-in"><h3 className="text-xl font-bold mb-4 text-white">Yêu cầu ván mới</h3><p className="text-slate-300 mb-6">{onlineState.opponentName} muốn chơi ván mới (Oẳn tù tì lại). Bạn có đồng ý?</p><div className="flex gap-3"><button onClick={() => respondToReset(true)} className="flex-1 py-2 bg-green-600 hover:bg-green-500 rounded font-bold">Đồng ý</button><button onClick={() => respondToReset(false)} className="flex-1 py-2 bg-slate-600 hover:bg-slate-500 rounded font-bold">Từ chối</button></div></div></div>}
                    {waitingForResetResponse && <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"><div className="text-white font-bold flex flex-col items-center"><div className="loader mb-4"></div>Đang chờ {onlineState.opponentName} xác nhận...</div></div>}
                    {mode === 'PVP_ONLINE' && (
                        <>
                            <button onClick={() => setIsChatOpen(!isChatOpen)} className={`fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95 ${unreadCount > 0 ? 'bg-red-500 animate-bounce' : 'bg-blue-600'}`}><span className="text-2xl">💬</span>{unreadCount > 0 && !isChatOpen && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900">{unreadCount > 9 ? '9+' : unreadCount}</span>}</button>
                            <ChatWindow messages={messages} onSendMessage={sendChatMessage} isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} opponentName={onlineState.opponentName} />
                        </>
                    )}
                    <div className="flex-none md:w-80 w-full bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 p-2 md:p-4 flex flex-row md:flex-col justify-between items-center md:items-stretch z-20 shadow-xl gap-2 md:gap-0">
                        <div className="hidden md:flex items-center gap-2 mb-6 cursor-pointer" onClick={() => { destroyPeer(); setMode(null); }}><img src={LOGO_SRC} alt="Logo" className="w-10 h-10 rounded-full border border-slate-500" /><span className="font-bold text-lg">TUYENNG Caro</span></div>
                        <div className="grid grid-cols-2 gap-2 md:gap-3 md:mb-6 flex-1 md:flex-none w-full">
                            {['X', 'O'].map((side) => {
                                const info = getPlayerInfo(side as Player);
                                const isActive = currentPlayer === side;
                                const isWinner = winner === side;
                                let borderClass = isActive ? (side === 'X' ? 'border-blue-500' : 'border-red-500') : 'border-slate-700';
                                let bgClass = isActive ? (side === 'X' ? 'bg-blue-500/10' : 'bg-red-500/10') : 'bg-slate-800';
                                if (isWinner) { borderClass = 'border-yellow-400'; bgClass = 'bg-yellow-400/20'; }
                                
                                let displayScore = 0;
                                if (mode === 'PVP_LOCAL') {
                                    displayScore = side === 'X' ? score.me : score.opponent;
                                } else {
                                    displayScore = side === myPlayerSide ? score.me : score.opponent;
                                }

                                return (
                                    <div key={side} className={`p-1.5 md:p-3 rounded-lg border flex flex-row md:flex-col items-center justify-between md:justify-center transition-all ${borderClass} ${bgClass}`}>
                                        <div className="flex items-center gap-2 md:flex-col md:gap-1"><span className={`${side==='X'?'text-blue-400':'text-red-400'} font-black text-lg md:text-xl w-6 md:w-auto text-center`}>{side}</span><div className="relative"><AvatarDisplay avatar={info.avatar} size="w-8 h-8 md:w-16 md:h-16" fontSize="text-lg md:text-4xl" />{isActive && !winner && <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800 animate-pulse md:hidden"></div>}</div><span className="text-xs md:text-sm text-slate-300 truncate max-w-[80px] md:max-w-full font-bold md:mb-1">{info.name}</span></div>
                                        <span className="text-xl md:text-2xl font-black md:mt-1 pr-2 md:pr-0">{displayScore}</span>
                                    </div>
                                )
                            })}
                        </div>
                        <div className="hidden md:flex mb-6 text-center h-12 items-center justify-center">{winner ? <div className="py-2 px-4 bg-yellow-500/20 text-yellow-300 rounded-lg border border-yellow-500/50 font-bold animate-pulse">{winner === 'DRAW' ? 'Hòa!' : `🏆 ${getPlayerInfo(winner as Player).name} Thắng!`}</div> : <div className="text-slate-300 flex items-center justify-center gap-2">{isAiThinking ? <>🤖 AI đang tính toán...</> : <>Lượt của: <span className={`font-bold ${currentPlayer === 'X' ? 'text-blue-400' : 'text-red-400'}`}>{currentPlayer === 'X' ? 'X' : 'O'}</span></>}</div>}</div>
                        <div className="hidden md:flex mt-auto space-y-3 flex-col">
                            <button onClick={undoMove} disabled={mode === 'PVP_ONLINE' || !!winner || history.length === 0} className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors">↩️ Đi lại</button>
                            
                            {/* NÚT THAY ĐỔI THEO TRẠNG THÁI: Nếu chưa có winner nhưng đã đánh, hiện Xin Thua */}
                            {!winner && history.length > 0 ? (
                                <button onClick={handleSurrender} className="w-full py-3 bg-red-600 hover:bg-red-500 rounded-lg font-semibold transition-colors shadow-lg shadow-red-500/20">🏳️ Xin thua</button>
                            ) : (
                                <button onClick={handleNewGameRequest} disabled={!winner && history.length > 0} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50">🔄 Ván mới</button>
                            )}
                            
                            <button onClick={() => { destroyPeer(); setMode(null); }} className="w-full py-3 bg-slate-800 text-red-400 hover:bg-slate-700 rounded-lg font-semibold transition-colors">Thoát</button>
                        </div>
                    </div>
                    <div className="flex-1 flex items-center justify-center p-0 md:p-4 bg-slate-950 relative overflow-hidden">
                        <Board board={board} lastMove={history[history.length - 1] || null} winningLine={winningLine} onCellClick={onCellClick} disabled={!!winner || isAiThinking || (mode === 'PVP_ONLINE' && ((myPlayerSide !== currentPlayer))) || onlineState.status === 'RPS_BATTLE'} />
                        {!winner && !isAiThinking && history.length === 0 && onlineState.status !== 'RPS_BATTLE' && <div className="absolute top-4 bg-slate-800/90 text-white px-4 py-1 text-sm rounded-full border border-slate-600 shadow-lg animate-bounce z-10 md:top-8 md:px-6 md:py-2 md:text-base">{currentPlayer === myPlayerSide ? "Bạn đi trước!" : `${onlineState.opponentName} đi trước!`}</div>}
                        {winner && <div className="absolute top-4 bg-yellow-500/90 text-white px-6 py-2 rounded-full border border-yellow-300 shadow-xl animate-pulse md:hidden z-10 font-bold">{winner === 'DRAW' ? 'Hòa!' : `🏆 ${getPlayerInfo(winner as Player).name} Thắng!`}</div>}
                    </div>
                    <div className="md:hidden w-full bg-slate-900 border-t border-slate-800 p-2 flex gap-2 shrink-0 safe-area-bottom pb-4">
                        <button onClick={() => { destroyPeer(); setMode(null); }} className="flex-1 py-3 bg-slate-800 text-red-400 rounded-lg font-bold border border-slate-700 active:scale-95 transition-transform">Thoát</button>
                        <button onClick={undoMove} disabled={mode === 'PVP_ONLINE' || !!winner || history.length === 0} className="flex-1 py-3 bg-slate-800 text-slate-200 rounded-lg font-bold border border-slate-700 disabled:opacity-50 active:scale-95 transition-transform">Đi lại</button>
                        
                        {!winner && history.length > 0 ? (
                            <button onClick={handleSurrender} className="flex-[2] py-3 bg-red-600 text-white rounded-lg font-bold shadow-lg active:scale-95 transition-transform">Xin thua</button>
                        ) : (
                            <button onClick={handleNewGameRequest} disabled={!winner && history.length > 0} className="flex-[2] py-3 bg-indigo-600 text-white rounded-lg font-bold shadow-lg active:scale-95 transition-transform disabled:opacity-50">Ván mới</button>
                        )}
                    </div>
                </div>
            );
        };
        
export default App;