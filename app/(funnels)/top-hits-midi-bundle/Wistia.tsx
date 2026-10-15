import Script from "next/script";

// The ClickFunnels page's Wistia player, same embed code. The blurred
// swatch shows until the player script defines <wistia-player>.
export function Wistia({ id, className }: { id: string; className?: string }) {
  return (
    <div className={className}>
      <Script src="https://fast.wistia.com/player.js" strategy="afterInteractive" />
      <Script src={`https://fast.wistia.com/embed/${id}.js`} strategy="afterInteractive" type="module" />
      <style>{`wistia-player[media-id='${id}']:not(:defined){background:center / contain no-repeat url('https://fast.wistia.com/embed/medias/${id}/swatch');display:block;filter:blur(5px);padding-top:56.25%;}`}</style>
      <div dangerouslySetInnerHTML={{ __html: `<wistia-player media-id="${id}" aspect="1.7777777777777777"></wistia-player>` }} />
    </div>
  );
}
