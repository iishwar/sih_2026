import { getMetrics } from '@/app/lib/sql_lite';
import { jsonSuccess, jsonError } from '@/app/lib/api_response';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '1h';
    const rawLimit = searchParams.get('limit');

    let limit = 60;
    if (rawLimit !== null) {
      limit = parseInt(rawLimit, 10);
      if (isNaN(limit) || limit < 1 || limit > 300) {
        return jsonError('INVALID_LIMIT', 'The "limit" parameter must be an integer between 1 and 300.', 400);
      }
    }

    const validRanges = ['15m', '1h', '6h', '24h', 'all'];
    if (!validRanges.includes(range.toLowerCase())) {
      return jsonError('INVALID_RANGE', `Range must be one of: ${validRanges.join(', ')}.`, 400);
    }

    const data = getMetrics({ range: range.toLowerCase(), limit });
    return jsonSuccess(data);
  } catch (err) {
    console.error('[API Metrics] Error:', err.message);
    return jsonError('INTERNAL_ERROR', 'An error occurred while fetching metrics.', 500);
  }
}