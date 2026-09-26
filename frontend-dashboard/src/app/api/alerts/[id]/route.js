import { getAlertById, updateAlertAcknowledgement } from '@/app/lib/sql_lite';
import { jsonSuccess, jsonError } from '@/app/lib/api_response';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;

    if (!id || typeof id !== 'string') {
      return jsonError('INVALID_ID', 'Alert ID is required.', 400);
    }

    const alert = getAlertById(id);
    if (!alert) {
      return jsonError('ALERT_NOT_FOUND', `Alert with ID "${id}" was not found.`, 404);
    }

    return jsonSuccess({ alert });
  } catch (err) {
    console.error('[API Alerts ID] GET Error:', err.message);
    return jsonError('INTERNAL_ERROR', 'An error occurred while fetching the alert.', 500);
  }
}

export async function PATCH(request, { params }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;

    if (!id || typeof id !== 'string') {
      return jsonError('INVALID_ID', 'Alert ID is required.', 400);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonError('INVALID_JSON', 'Request body must be valid JSON.', 400);
    }

    if (!body || typeof body !== 'object' || body.acknowledged === undefined) {
      return jsonError(
        'INVALID_REQUEST_BODY',
        'Request body must include the "acknowledged" field (boolean or 0/1).',
        400
      );
    }

    let ackValue;
    if (body.acknowledged === true || body.acknowledged === 1) {
      ackValue = 1;
    } else if (body.acknowledged === false || body.acknowledged === 0) {
      ackValue = 0;
    } else {
      return jsonError(
        'INVALID_ACKNOWLEDGED_VALUE',
        'Field "acknowledged" must be a boolean (true/false) or integer (1/0).',
        400
      );
    }

    const existingAlert = getAlertById(id);
    if (!existingAlert) {
      return jsonError('ALERT_NOT_FOUND', `Alert with ID "${id}" was not found.`, 404);
    }

    const updatedAlert = updateAlertAcknowledgement(id, ackValue);
    return jsonSuccess({ alert: updatedAlert });
  } catch (err) {
    console.error('[API Alerts ID] PATCH Error:', err.message);
    if (err.code) {
      return jsonError(err.code, err.message, 400);
    }
    return jsonError('INTERNAL_ERROR', 'An error occurred while updating the alert.', 500);
  }
}