import { getModels } from '@/app/lib/sql_lite';
import { jsonSuccess, jsonError } from '@/app/lib/api_response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const models = getModels();
    return jsonSuccess({ models });
  } catch (err) {
    console.error('[API Models] Error:', err.message);
    return jsonError('INTERNAL_ERROR', 'An error occurred while fetching model status.', 500);
  }
}