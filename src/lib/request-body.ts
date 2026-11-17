export class RequestBodyTooLargeError extends Error {
  constructor() {
    super("Request body is too large.");
  }
}

export async function readJsonBody(
  request: Request,
  maxBytes: number,
): Promise<unknown> {
  return JSON.parse(await readTextBody(request, maxBytes)) as unknown;
}

export async function readTextBody(
  request: Request,
  maxBytes: number,
): Promise<string> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Request body is missing.");

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        throw new RequestBodyTooLargeError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}
