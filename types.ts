export type Player = 'X' | 'O';
export type CellValue = Player | null;
export type GameMode = 'PVE' | 'PVP_LOCAL' | 'PVP_ONLINE';
export type RPSMove = 'ROCK' | 'PAPER' | 'SCISSORS' | null;

export interface Position {
  x: number;
  y: number;
}

export interface GameState {
  board: CellValue[][];
  currentPlayer: Player;
  winner: Player | 'DRAW' | null;
  winningLine: Position[] | null;
  history: Position[];
}

export interface OnlineState {
  isHost: boolean;
  peerId: string | null;
  conn: any | null; // PeerJS connection
  status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR' | 'RPS_BATTLE';
  opponentName: string;
  opponentAvatar: string;
  myName: string;
  myAvatar: string;
}

export interface DataPacket {
  type: 'HELLO' | 'RPS_MOVE' | 'MOVE' | 'RESET_REQUEST' | 'RESET_RESPONSE' | 'CHAT' | 'SURRENDER' | 'AVATAR_DATA';
  score?: { me: number, opponent: number }; // FIX: Điểm số gắn với người chơi
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface ChatMessage {
  id: string;
  sender: 'ME' | 'THEM';
  text: string;
  timestamp: number;
}