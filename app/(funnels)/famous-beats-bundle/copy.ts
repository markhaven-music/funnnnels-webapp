// The order page's words, exactly as on ClickFunnels' /order-famous-beats-bundle.
// Inline marks (../top-hits-midi-bundle/Rich.tsx): **bold**, __underlined__, {c} = € or $.

// The left column (hidden on phones, as on ClickFunnels).
export const orderBullets = [
  "Grammy-Level Drum Patterns",
  "Finish Beats 27X Faster",
  "Tap Into Dopamine To Hook Listeners",
  "Get Noticed By High Status Artists",
  "Drum Patterns Used In Top Hits",
  "Easily Make 750 Beats A Year",
  "Huge Library To Explore",
  "Never Feel Beat Block Again",
  "Works With Mac & PC and Any DAW",
  "Limited Time Sale",
  "Money Back Guarantee (No Risk)",
  "Limited To 1,250 Licenses",
];

// The reviews under the form, as ClickFunnels' page has them (icons as on TOP HITS').
export const reviews = [
  { quote: "The drum patterns are exactly what I needed. Perfect for modern trap and drill beats.", name: "Marcus Thompson", role: "Trap Producer", icon: "youtube" },
  { quote: "These MIDI files saved me hundreds of hours. The patterns are industry standard quality.", name: "Ardan Solis", role: "Verified Customer", icon: "instagram" },
  { quote: "Perfect for trap. The fragments add that extra sauce to make beats stand out.", name: "Niko Varela", role: "Verified Customer", icon: "instagram" },
  { quote: "This is what real trap production tools look like. Every pattern is a hit waiting to happen.", name: "Soraya Kenji", role: "Verified Customer", icon: "instagram" },
  { quote: "The MIDI patterns are crazy. I've been using these on every session since I got the pack.", name: "Marek Tulan", role: "Hip-hop and Trap Beatmaker", icon: "instagram" },
  { quote: "Finally found patterns that match the energy of modern trap. This pack is legendary.", name: "Aisha Moretti", role: "Beatmaker", icon: "instagram" },
  { quote: "The creativity these MIDIs sparked is insane. Perfect foundation for any trap beat.", name: "Dara Kwon", role: "Trap Producer, 100M+ streams", icon: "instagram" },
  { quote: "These patterns hit harder than anything I've found. Essential tools for modern producers.", name: "Ravi Lomax", role: "Trap Producer, 100M+ streams", icon: "instagram" },
] as const;

// Each add-on's ClickFunnels description, after the red "ONE-TIME OFFER:".
export const bumpCopy: Record<string, string[]> = {
  "emotional-keys": [
    "This mini-bundle includes **'Emotional Keys Vol.1, Vol.2 and Vol.3**",
    "Includes: Musical Ideas, Chord Progressions and Melodies written by professional pianist and composer Orazio Saracino. Each MIDI Pack is {c}29 (total {c}87) but you can get them all right now at 95% off for __just {c}7!!__",
  ],
  "drum-kit": [
    "The **'MIDI Drum Kit' Bundle** includes **1050 MIDI Drum Patterns** modeled after billboard producers like Southside, Lex Luger, Zaytoven, DJ Mustard, Pharrell. It includes Complete Original Beats + Patterns + Fragments. Usually {c}299 but you can get it right now at 90% off for __just {c}25!!__",
    "Limited to the first 150 orders.",
  ],
  hustle: [
    "The **'HUSTLE' Bundle** includes **31 Professional MIDI Packs** with Musical Ideas, Chord Progressions and Melodies. Jazz, Trap, Hiphop, Lofi, Pop and more. Each MIDI Pack is {c}29 (total {c}899) but you can get them all right now at 90% off for __just {c}25!!__",
    "Limited to the first 150 orders.",
  ],
};
