import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

// UTC 플러그인 활성화 - 서버/클라이언트 일관성 보장
dayjs.extend(utc);

/**
 * Tailwind 클래스 병합 유틸리티
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 날짜 포맷팅 (예: 2024. 05. 20.) - 로컬 타임존 적용
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '';
  return dayjs(dateString).local().format('YYYY. MM. DD. HH:mm');
}

/**
 * 시간(초) → mm:ss 포맷
 * @example formatDuration(185) => "3:05"
 */
export function formatDuration(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}
