import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const EXPORT_PATH = '/__thero-editor/export-level';
const PROJECT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const LEVEL_DIRECTORY = path.resolve(PROJECT_DIRECTORY, 'assets/data/levels');
const EDITABLE_FIELDS = new Set(['path', 'waves', 'crystals', 'autoAnchors', 'mapSpeedMultiplier']);

// Read a small JSON request body without adding a production server dependency.
function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) reject(new Error('Export payload is too large.'));
    });
    request.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Export payload must be valid JSON.'));
      }
    });
    request.on('error', reject);
  });
}

async function findLevelFile(levelId) {
  const names = await fs.readdir(LEVEL_DIRECTORY);
  for (const name of names.filter((entry) => entry.endsWith('.json'))) {
    const filePath = path.join(LEVEL_DIRECTORY, name);
    const contents = await fs.readFile(filePath, 'utf8');
    const level = JSON.parse(contents);
    if (level?.id === levelId) return { filePath, name, level };
  }
  return null;
}

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(payload));
}

// This middleware is installed only by Vite's local development server and writes only to the
// existing level JSON file whose internal id matches the editor's active level.
function localLevelExportPlugin() {
  return {
    name: 'thero-local-level-export',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        if (request.url !== EXPORT_PATH || request.method !== 'POST') return next();
        try {
          const payload = await readJsonBody(request);
          if (typeof payload?.levelId !== 'string' || !payload.levelId || !payload.changes || typeof payload.changes !== 'object') {
            return sendJson(response, 400, { error: 'A level id and changes object are required.' });
          }
          const match = await findLevelFile(payload.levelId);
          if (!match) return sendJson(response, 404, { error: `No local level file has id ${payload.levelId}.` });

          for (const [key, value] of Object.entries(payload.changes)) {
            if (EDITABLE_FIELDS.has(key)) match.level[key] = value;
          }
          // Keep default speed implicit, matching the existing editor JSON output convention.
          if (match.level.mapSpeedMultiplier === 1) delete match.level.mapSpeedMultiplier;
          await fs.writeFile(match.filePath, `${JSON.stringify(match.level, null, 2)}\n`, 'utf8');
          return sendJson(response, 200, { ok: true, file: `assets/data/levels/${match.name}` });
        } catch (error) {
          server.config.logger.error(`Level export failed: ${error.message}`);
          return sendJson(response, 500, { error: error.message || 'Unable to export level changes.' });
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [localLevelExportPlugin()],
});
