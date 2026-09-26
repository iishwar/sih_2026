import { getEvents, VALID_SEVERITIES } from '@/app/lib/sql_lite';
import { jsonSuccess, jsonError } from '@/app/lib/api_response';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawPage = searchParams.get('page');
    const rawLimit = searchParams.get('limit');
    const severity = searchParams.get('severity') || undefined;

    let page = 1;
    if (rawPage !== null) {
      page = parseInt(rawPage, 10);
      if (isNaN(page) || page < 1) {
        return jsonError('INVALID_PAGE', 'The "page" parameter must be a positive integer.', 400);
      }
    }

    let limit = 20;
    if (rawLimit !== null) {
      limit = parseInt(rawLimit, 10);
      if (isNaN(limit) || limit < 1 || limit > 100) {
        return jsonError('INVALID_LIMIT', 'The "limit" parameter must be an integer between 1 and 100.', 400);
      }
    }

    if (severity && severity !== 'ALL') {
      const allowed = [...VALID_SEVERITIES, 'INFO', 'WARN', 'ERROR'];
      if (!allowed.includes(severity.toUpperCase())) {
        return jsonError('INVALID_SEVERITY', `Severity must be one of: ${allowed.join(', ')}.`, 400);
      }
    }

    const data = getEvents({ page, limit, severity });
    return jsonSuccess(data);
  } catch (err) {
    console.error('[API Events] Error:', err.message);
    return jsonError('INTERNAL_ERROR', 'An error occurred while fetching system events.', 500);
  }
}
