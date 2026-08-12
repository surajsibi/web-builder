export function POST(request: Request) {
  void request;

  return Response.json(
    {
      accepted: false,
      error: "Form submissions are unavailable. Preview submissions are not saved.",
    },
    {
      headers: { "Cache-Control": "no-store" },
      status: 503,
    },
  );
}
