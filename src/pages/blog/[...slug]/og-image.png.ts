import { ImageResponse, html } from "og-img";

import type { APIRoute } from "astro";
import fs from "fs/promises";
import { getCollection } from "astro:content";

export async function getStaticPaths() {
  const posts = await getCollection("blog");
  return posts.map((post) => ({
    params: { slug: post.slug },
    props: post,
  }));
}

export const GET: APIRoute = async function get({ props }) {
  const pubDate = props.data.pubDate.toISOString().split("T")[0];

  return new ImageResponse(
    // Use Tailwind CSS or style attribute
    html`
      <div
        tw="flex flex-col items-start justify-between h-full w-full bg-black/90 text-white p-20"
        style="font-family: 'Atkinson Regular'"
      >
        <div tw="flex items-center justify-between w-full">
          <div tw="text-3xl">Kristofer Lund</div>
          <div tw="text-3xl">${pubDate}</div>
        </div>
        <div tw="grow text-black/90">.</div>
        <div
          tw="text-6xl leading-normal mb-5"
          style="font-family: 'Atkinson Bold'"
        >
          ${props.data.title}
        </div>
        <div tw="text-4xl leading-normal text-white/50">
          ${props.data.description}
        </div>
      </div>
    `,
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Atkinson Regular",
          data: await fs.readFile("./public/fonts/atkinson-regular.woff"),
          weight: 400,
          style: "normal",
        },
        {
          name: "Atkinson Bold",
          data: await fs.readFile("./public/fonts/atkinson-bold.woff"),
          weight: 700,
          style: "normal",
        },
      ],
    }
  );
};
