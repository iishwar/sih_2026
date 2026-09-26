import { getAlerts, VALID_SEVERITIES } from '@/app/lib/sql_lite';
import { jsonSuccess, jsonError } from '@/app/lib/api_response';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const rawPage = searchParams.get('page');
    const rawLimit = searchParams.get('limit');
    const threatClass = searchParams.get('threat_class') || undefined;
    const severity = searchParams.get('severity') || undefined;
    const acknowledged = searchParams.get('acknowledged');
    const from = searchParams.get('from') || undefined;
    const to = searchParams.get('to') || undefined;
    const search = searchParams.get('search') || undefined;

    // Validate page
    let page = 1;
    if (rawPage !== null) {
      page = parseInt(rawPage, 10);
      if (isNaN(page) || page < 1) {
        return jsonError('INVALID_PAGE', 'The "page" parameter must be a positive integer.', 400);
      }
    }

    // Validate limit
    let limit = 20;
    if (rawLimit !== null) {
      limit = parseInt(rawLimit, 10);
      if (isNaN(limit) || limit < 1 || limit > 100) {
        return jsonError('INVALID_LIMIT', 'The "limit" parameter must be an integer between 1 and 100.', 400);
      }
    }

    // Validate severity
    if (severity && severity !== 'ALL') {
      if (!VALID_SEVERITIES.includes(severity.toUpperCase())) {
        return jsonError(
          'INVALID_SEVERITY',
          `The "severity" parameter must be one of: ${VALID_SEVERITIES.join(', ')}.`,
          400
        );
      }
    }

    // Validate timestamps
    if (from) {
      const fromTime = new Date(from).getTime();
      if (isNaN(fromTime)) {
        return jsonError('INVALID_DATE', 'The "from" parameter must be a valid ISO 8601 date string.', 400);
      }
    }

    if (to) {
      const toTime = new Date(to).getTime();
      if (isNaN(toTime)) {
        return jsonError('INVALID_DATE', 'The "to" parameter must be a valid ISO 8601 date string.', 400);
      }
    }

    // Validate acknowledged
    let validatedAck = undefined;
    if (acknowledged !== null && acknowledged !== undefined && acknowledged !== '' && acknowledged !== 'ALL') {
      if (acknowledged === 'true' || acknowledged === '1') {
        validatedAck = 1;
      } else if (acknowledged === 'false' || acknowledged === '0') {
        validatedAck = 0;
      } else {
        return jsonError('INVALID_ACKNOWLEDGED', 'The "acknowledged" parameter must be 0, 1, true, or false.', 400);
      }
    }

    const result = getAlerts({
      page,
      limit,
      threat_class: threatClass,
      severity,
      acknowledged: validatedAck,
      from,
      to,
      search,
    });

    return jsonSuccess(result);
  } catch (err) {
    console.error('[API Alerts] Error:', err.message);
    if (err.code) {
      return jsonError(err.code, err.message, 400);
    }
    return jsonError('INTERNAL_ERROR', 'An error occurred while fetching alerts.', 500);
  }
}