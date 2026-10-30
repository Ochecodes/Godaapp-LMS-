export async function POST(): Promise<Response> {
  return Response.json({ error: "Analytics tracking endpoint is not available." }, { status: 404 });
}