// Serves the Markdown version of a page when an agent asks for text/markdown.
// Browsers and other clients fall through to the normal HTML site.
export default async (request: Request) => {
  if (!(request.headers.get("accept") ?? "").includes("text/markdown")) return;

  const url = new URL(request.url);
  const slug = url.pathname.replace(/^\/+|\/+$/g, "") || "index";
  const headers = { "content-type": "text/markdown; charset=utf-8", vary: "Accept" };

  const page = await fetch(new URL(`/_md/${slug}.md`, url));
  if (page.ok) return new Response(await page.text(), { status: 200, headers });

  const missing = await fetch(new URL("/_md/404.md", url));
  return new Response(await missing.text(), { status: 404, headers });
};
