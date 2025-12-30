import { useState, useCallback } from 'react';
import { GameState, ValidationResult } from '../types';
import { validateDigit, getDigitAt } from '../services/piDigits';

/**
 * ゲーム状態を管理するフック
 */
export function useGameState() {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [currentPosition, setCurrentPosition] = useState(0);
  const [inputHistory, setInputHistory] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<number>(0);

  /**
   * ゲームを開始
   */
  const startGame = useCallback(() => {
    setGameState('playing');
    setCurrentPosition(0);
    setInputHistory([]);
    setStartTime(Date.now());
  }, []);

  /**
   * 入力を検証
   */
  const validateInput = useCallback(
    (digit: string): ValidationResult => {
      const correctDigit = getDigitAt(currentPosition);
      const isCorrect = validateDigit(currentPosition, digit);

      if (isCorrect) {
        // 正解の場合
        setInputHistory((prev) => [...prev, digit]);
        setCurrentPosition((prev) => prev + 1);

        // プラクティスモードから正解した場合、playingモードに戻る
        if (gameState === 'practice') {
          setGameState('playing');
        }
      } else {
        // 不正解の場合
        if (gameState === 'playing') {
          // playingモードからの不正解はプラクティスモードに移行
          setGameState('practice');
        }
        // practiceモードからの不正解はそのまま継続（何もしない）
      }

      return {
        isCorrect,
        position: currentPosition,
        inputDigit: digit,
        correctDigit,
      };
    },
    [currentPosition, gameState]
  );

  /**
   * ゲームをリセット
   */
  const resetGame = useCallback(() => {
    setGameState('idle');
    setCurrentPosition(0);
    setInputHistory([]);
    setStartTime(0);
  }, []);

  /**
   * 経過時間を計算（秒）
   */
  const getElapsedTime = useCallback(() => {
    if (startTime === 0) return 0;
    return Math.floor((Date.now() - startTime) / 1000);
  }, [startTime]);

  /**
   * 指定した位置まで巻き戻す（プラクティスモード専用）
   */
  const rewindToPosition = useCallback((index: number) => {
    if (gameState !== 'practice' || index < 0) return;

    // indexは"3."を含めた位置なので、-2して桁数に変換
    const targetPosition = Math.max(0, index - 2);

    setInputHistory((prev) => prev.slice(0, targetPosition));
    setCurrentPosition(targetPosition);
  }, [gameState]);

  return {
    gameState,
    currentPosition,
    inputHistory,
    startGame,
    validateInput,
    resetGame,
    getElapsedTime,
    rewindToPosition,
  };
}
