import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';

// L'APK est publié dans les releases du dépôt public carracheDev/monbudget.
const APK_URL =
  process.env.APK_URL ||
  'https://github.com/carracheDev/monbudget/releases/download/latest/MonBudget.apk';

/**
 * Page de téléchargement publique de l'APK MonBudget.
 *   GET /telecharger → page d'installation
 *   GET /app.apk     → redirige vers la release GitHub (CDN rapide)
 */
@Controller()
export class DownloadController {
  @Get('app.apk')
  apk(@Res() res: Response) {
    res.redirect(302, APK_URL);
  }

  @Get('telecharger')
  page(@Res() res: Response) {
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(PAGE_HTML);
  }
}

const PAGE_HTML = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Télécharger MonBudget</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
  body{background:#ECFDF5;color:#1F2937;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
  .card{background:#fff;max-width:440px;width:100%;border-radius:24px;overflow:hidden;box-shadow:0 10px 40px rgba(5,150,105,.15)}
  .hero{background:linear-gradient(135deg,#059669,#10B981);padding:38px 24px 30px;text-align:center;color:#fff}
  .badge{width:96px;height:96px;border-radius:24px;background:#fff;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 18px rgba(0,0,0,.18)}
  .badge span{font-size:46px}
  h1{font-size:24px;font-weight:800;margin-bottom:4px}
  .slogan{font-size:14px;opacity:.9}
  .body{padding:24px;text-align:center}
  .tag{display:inline-block;background:#D1FAE5;color:#065F46;font-size:12px;font-weight:700;padding:5px 12px;border-radius:99px;margin:0 auto 16px}
  .btn{display:block;background:#059669;color:#fff;text-decoration:none;text-align:center;
       padding:16px;border-radius:14px;font-size:17px;font-weight:800;box-shadow:0 6px 16px rgba(5,150,105,.35)}
  .btn:active{transform:translateY(1px)}
  .steps{margin-top:22px;text-align:left}
  .steps h2{font-size:14px;color:#6B7280;text-transform:uppercase;letter-spacing:.04em;margin-bottom:12px}
  .step{display:flex;gap:12px;align-items:flex-start;margin-bottom:12px}
  .num{flex:0 0 26px;width:26px;height:26px;border-radius:50%;background:#D1FAE5;color:#059669;
       font-weight:800;font-size:13px;display:flex;align-items:center;justify-content:center}
  .step p{font-size:14px;line-height:1.45;color:#374151}
  .note{margin-top:18px;background:#F0FDF4;border:1px solid #A7F3D0;border-radius:12px;padding:12px 14px;font-size:12.5px;color:#065F46;line-height:1.5;text-align:left}
  .foot{text-align:center;font-size:11px;color:#9CA3AF;padding:14px}
</style>
</head>
<body>
  <div class="card">
    <div class="hero">
      <div class="badge"><span>💰</span></div>
      <h1>MonBudget</h1>
      <div class="slogan">Gérez votre budget en toute simplicité</div>
    </div>
    <div class="body">
      <span class="tag">Version test (bêta)</span>
      <a class="btn" href="/app.apk">⬇️ Télécharger et installer</a>
      <div class="steps">
        <h2>Installation (2 min)</h2>
        <div class="step"><div class="num">1</div><p>Touchez <b>Télécharger et installer</b> ci-dessus.</p></div>
        <div class="step"><div class="num">2</div><p>Ouvrez le fichier téléchargé. Si Android bloque, autorisez <b>« Installer des applications inconnues »</b>.</p></div>
        <div class="step"><div class="num">3</div><p>Installez, puis ouvrez <b>MonBudget</b>.</p></div>
        <div class="step"><div class="num">4</div><p>Créez votre compte et commencez à suivre vos dépenses.</p></div>
      </div>
      <div class="note">🔒 Bêta en <b>mode test</b> — vos données sont privées. Merci de tester et de nous faire vos retours&nbsp;!</div>
    </div>
    <div class="foot">MonBudget · 2026</div>
  </div>
</body>
</html>`;
