const KEY = "112491b4829c81ed5a51779b3ab4ba85";

export function GET() {
  return new Response(KEY, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}
