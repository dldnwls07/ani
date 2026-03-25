// ============================================================
// Couple 도메인 엔티티
// ============================================================
import { BaseEntity, UUID } from '@/domain/shared/types'

export interface ThemePreference {
  primary: string   // e.g. "#FF6B6B"
  secondary: string // e.g. "#4ECDC4"
}

export interface Couple extends BaseEntity {
  inviteCode: string          // 6자리 초대 코드 (e.g. "A7X9Q2")
  partner1Id?: UUID
  partner2Id?: UUID
  connectionDate?: string     // 사귄 날 (ISO date string)
  themePreference: ThemePreference
  isActive: boolean
}

// 값 객체: 초대 코드 생성 규칙
export class InviteCode {
  private static readonly CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  private static readonly LENGTH = 6

  static generate(): string {
    return Array.from({ length: this.LENGTH }, () =>
      this.CHARSET[Math.floor(Math.random() * this.CHARSET.length)]
    ).join('')
  }

  static isValid(code: string): boolean {
    return /^[A-Z0-9]{6}$/.test(code)
  }
}
