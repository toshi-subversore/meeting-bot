import { timingSafeEqual } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import config from '../config';

// Segurança (mútuo, 07/07): antes disso, o bearerToken do corpo do POST
// /:provider/join só era checado como não-vazio (ver joinGoogleMeet etc.) —
// nunca comparado a um segredo. Qualquer request com JSON válido fazia o
// bot entrar em qualquer reunião, sem checar quem mandou. Middleware único
// aplicado antes dos 3 routers (google/microsoft/zoom) em src/app/index.ts.
export function verifyJoinAuth(req: Request, res: Response, next: NextFunction): void {
  const expected = config.joinAuthToken;
  if (!expected) {
    // JOIN_AUTH_TOKEN não configurado — mantém o comportamento antigo
    // (sem validação) até o operador setar um segredo real dos dois lados.
    next();
    return;
  }

  const provided = req.body?.bearerToken;
  if (typeof provided !== 'string' || !safeCompare(provided, expected)) {
    res.status(401).json({ success: false, error: 'Invalid bearerToken' });
    return;
  }
  next();
}

// timingSafeEqual exige buffers do mesmo tamanho — comparar o tamanho antes
// vaza só o COMPRIMENTO do token (não o conteúdo), aceitável pra um bearer
// token (a parte sensível é o valor, não quantos caracteres tem).
function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
