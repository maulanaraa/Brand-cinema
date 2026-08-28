import { RevokedToken } from '../models/RevokedToken';

export class TokenRevocationRepository {
  async revoke(jti: string, expiresAt: Date): Promise<void> {
    await RevokedToken.updateOne(
      { jti },
      { $setOnInsert: { jti, expiresAt } },
      { upsert: true }
    );
  }

  async isRevoked(jti: string): Promise<boolean> {
    const doc = await RevokedToken.exists({ jti });
    return doc !== null;
  }
}

export const tokenRevocationRepository = new TokenRevocationRepository();
