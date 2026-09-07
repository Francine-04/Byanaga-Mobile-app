const RESET_MODE = 'resetPassword';
const MAX_NESTING = 3;

export function getPasswordResetAction({ mode, oobCode, url } = {}) {
  const directCode = normalizeActionCode(oobCode);

  if (directCode && (!mode || mode === RESET_MODE)) {
    return { mode: RESET_MODE, oobCode: directCode };
  }

  return parsePasswordResetLink(url);
}

export function parsePasswordResetLink(value, depth = 0) {
  const input = String(value || '').trim();
  if (!input || depth > MAX_NESTING) return null;

  if (!/[?=&]/.test(input)) {
    const directCode = normalizeActionCode(input);
    return directCode ? { mode: RESET_MODE, oobCode: directCode } : null;
  }

  const params = readQueryParams(input);
  const mode = params.mode;
  const oobCode = normalizeActionCode(params.oobCode);

  if (oobCode && (!mode || mode === RESET_MODE)) {
    return { mode: RESET_MODE, oobCode };
  }

  for (const key of ['link', 'deep_link_id']) {
    if (params[key]) {
      const nestedAction = parsePasswordResetLink(params[key], depth + 1);
      if (nestedAction) return nestedAction;
    }
  }

  return null;
}

function readQueryParams(value) {
  const input = String(value || '');
  const questionIndex = input.indexOf('?');
  const query = (questionIndex >= 0 ? input.slice(questionIndex + 1) : input).split('#')[0];

  return query.split('&').reduce((result, pair) => {
    const separator = pair.indexOf('=');
    if (separator < 0) return result;

    const key = safeDecode(pair.slice(0, separator));
    const valuePart = safeDecode(pair.slice(separator + 1));
    if (key) result[key] = valuePart;
    return result;
  }, {});
}

function normalizeActionCode(value) {
  const code = String(value || '').trim();
  if (code.length < 10 || code.length > 2048 || !/^[A-Za-z0-9_-]+$/.test(code)) return '';
  return code;
}

function safeDecode(value) {
  try {
    return decodeURIComponent(String(value || '').replace(/\+/g, ' '));
  } catch {
    return String(value || '');
  }
}
