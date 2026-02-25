export class TokenResponseDto {
  accessToken: string; // JWT interne (15 min)
  refreshToken: string; // Refresh token (7 jours)
  expiresIn: number; // 900 (15 min en secondes)
  tokenType: string; // "Bearer"
}
