/**
 * Endpoint de test simple pour vérifier que les Serverless Functions fonctionnent
 */
export default async function handler(req, res) {
  try {
    // Test basique
    return res.status(200).json({
      message: 'API fonctionne !',
      method: req.method,
      query: req.query,
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      hasFetch: typeof fetch !== 'undefined',
    });
  } catch (error) {
    console.error('Erreur dans /api/test:', error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack,
    });
  }
}

