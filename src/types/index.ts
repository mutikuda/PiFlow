/**
 * ゲーム状態の種類
 */
export type GameState = 'idle' | 'playing' | 'finished';

/**
 * ゲームモードの種類
 */
export type GameMode = 'free' | 'timeattack' | 'review';

/**
 * 入力状態（UI用）
 */
export type InputState = 'idle' | 'correct' | 'error';

/**
 * 個人記録
 */
export interface PersonalBest {
  maxDigits: number;
  maxDigitsDate: number;
  totalSessions: number;
  totalDigitsTyped: number;
  mistakesByIndex?: Record<number, number>; // 桁位置ごとのミス回数
  history?: SessionHistory[]; // セッション履歴
}

/**
 * セッション履歴
 */
export interface SessionHistory {
  date: string;
  score: number;
  time: number;
  mistakes?: number;
}

/**
 * 練習セッション
 */
export interface PracticeSession {
  id: string;
  timestamp: number;
  mode: GameMode;
  digitsReached: number;
  duration: number;
  errorPosition: number | null;
  errorInput: string | null;
  correctDigit: string | null;
}

/**
 * 桁位置ごとのエラー情報
 */
export interface PositionError {
  count: number;
  attempts: number;
  lastError: number;
  errorRate: number;
}

/**
 * エラー統計
 */
export interface ErrorStatistics {
  positionErrors: Record<number, PositionError>;
  digitConfusion: Record<string, Record<string, number>>;
}

/**
 * ユーザー設定
 */
export interface UserSettings {
  soundEnabled: boolean;
  darkMode: boolean;
  showHints: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
}

/**
 * 検証結果
 */
export interface ValidationResult {
  isCorrect: boolean;
  position: number;
  inputDigit: string;
  correctDigit: string;
}
