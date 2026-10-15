// Where visitors see a funnel. Code funnels live on their brand's domain
// (see FUNNEL_HOME in proxy.ts); builder funnels on /p/<id>.
const CODE_FUNNELS: Record<string, string> = {
  "jazz-midi-pack": "https://m.thegrind.studio/jazz-midi-pack",
};

export const isCodeFunnel = (id: string) => id in CODE_FUNNELS;
export const liveUrl = (id: string) => CODE_FUNNELS[id] ?? `/p/${id}`;
