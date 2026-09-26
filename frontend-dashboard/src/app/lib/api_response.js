export function jsonError(code, message, status = 400) {
  return Response.json(
    {
      error: {
        code,
        message,
      },
    },
    { status }
  );
}

export function jsonSuccess(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
