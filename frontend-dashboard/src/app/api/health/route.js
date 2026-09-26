import { getServiceHealth } from '@/app/lib/sql_lite';
import { jsonSuccess, jsonError } from '@/app/lib/api_response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const health = getServiceHealth();
    return jsonSuccess(health);
  } catch (err) {
    console.error('[API Health] Error:', err.message);
    return jsonError('SERVICE_UNAVAILABLE', 'Unable to determine service health status.', 503);
  }
}