import { getDashboardSummary } from '@/app/lib/sql_lite';
import { jsonSuccess, jsonError } from '@/app/lib/api_response';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get('hours') || '24', 10);
    const validHours = isNaN(hours) || hours < 1 ? 24 : Math.min(168, hours);

    const summary = getDashboardSummary({ rangeHours: validHours });
    return jsonSuccess(summary);
  } catch (err) {
    console.error('[API Summary] Error:', err.message);
    return jsonError('INTERNAL_ERROR', 'An error occurred while compiling the dashboard summary.', 500);
  }
}
