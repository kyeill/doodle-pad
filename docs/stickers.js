'use strict';
// Animal stickers: original round-face drawings, 100×100 viewBox each.
// app.js turns each into a die-cut sticker (white border + soft shadow).
// Order is Kyle's (2026-11-20): the first five are the top row in portrait and the
// left column in landscape; the last five are the bottom row / right column.
window.STICKERS = (() => {
  const INK = '#3d3a4f';
  const L = `stroke="${INK}" stroke-width="3" stroke-linejoin="round"`;
  const eye = (x, y, r = 4.5) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="#2b2b2b"/><circle cx="${x + r * 0.33}" cy="${y - r * 0.33}" r="${r * 0.35}" fill="#fff"/>`;
  const eyes = (x1, x2, y, r) => eye(x1, y, r) + eye(x2, y, r);
  const blush = (x1, x2, y) =>
    `<ellipse cx="${x1}" cy="${y}" rx="6" ry="3.5" fill="#ff8fab" opacity=".55"/><ellipse cx="${x2}" cy="${y}" rx="6" ry="3.5" fill="#ff8fab" opacity=".55"/>`;
  const smile = (x, y) =>
    `<path d="M${x - 6} ${y} q3 4 6 0 q3 4 6 0" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>`;
  const catMouth = (y) =>
    `<path d="M50 ${y} v3 M43 ${y + 4.5} q3.5 3 7 -1.5 q3.5 4.5 7 1.5" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;
  const whiskers = (y) =>
    `<path d="M31 ${y} h-13 M31 ${y + 5} l-12 4 M69 ${y} h13 M69 ${y + 5} l12 4" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`;
  const svg = body => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${body}</svg>`;

  // lion's mane: a ring of scallops
  let mane = '';
  for (let k = 0; k < 12; k++) {
    const a = k * Math.PI / 6;
    mane += `<circle cx="${(50 + 34 * Math.cos(a)).toFixed(1)}" cy="${(52 + 34 * Math.sin(a)).toFixed(1)}" r="13" fill="#d9822b" ${L}/>`;
  }

  return [
    // ---- top row / left column ----
    { name: 'Panda', svg: svg(`
      <circle cx="25" cy="27" r="12" fill="#2b2b2b" ${L}/><circle cx="75" cy="27" r="12" fill="#2b2b2b" ${L}/>
      <circle cx="50" cy="56" r="36" fill="#fff" ${L}/>
      <ellipse cx="36" cy="53" rx="9" ry="12" transform="rotate(35 36 53)" fill="#2b2b2b"/>
      <ellipse cx="64" cy="53" rx="9" ry="12" transform="rotate(-35 64 53)" fill="#2b2b2b"/>
      <circle cx="37" cy="51" r="4.5" fill="#fff"/><circle cx="38" cy="51.5" r="2.6" fill="#2b2b2b"/>
      <circle cx="63" cy="51" r="4.5" fill="#fff"/><circle cx="62" cy="51.5" r="2.6" fill="#2b2b2b"/>
      <ellipse cx="50" cy="64" rx="5.5" ry="4" fill="#2b2b2b"/>
      ${smile(50, 70)}${blush(28, 72, 66)}`) },

    { name: 'Sloth', svg: svg(`
      <path d="M36 27 Q40 13 47 21 Q51 10 56 21 Q62 13 66 27 Z" fill="#a58b6f" ${L}/>
      <circle cx="50" cy="55" r="36" fill="#a58b6f" ${L}/>
      <path d="M50 30 C70 30 80 44 78 58 C76 74 64 84 50 84 C36 84 24 74 22 58 C20 44 30 30 50 30 Z" fill="#efe3cf"/>
      <ellipse cx="35" cy="54" rx="11" ry="5.5" transform="rotate(-22 35 54)" fill="#5b4636"/>
      <ellipse cx="65" cy="54" rx="11" ry="5.5" transform="rotate(22 65 54)" fill="#5b4636"/>
      <circle cx="37" cy="52.5" r="3.4" fill="#fff"/><circle cx="37.6" cy="52.8" r="2.1" fill="#2b2b2b"/>
      <circle cx="63" cy="52.5" r="3.4" fill="#fff"/><circle cx="62.4" cy="52.8" r="2.1" fill="#2b2b2b"/>
      <ellipse cx="50" cy="64" rx="5.5" ry="4" fill="#3d3a4f"/>
      <path d="M41 71 q9 7 18 0" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>
      ${blush(29, 71, 68)}`) },

    { name: 'Tiger', svg: svg(`
      <circle cx="22" cy="28" r="11" fill="#f7932f" ${L}/><circle cx="78" cy="28" r="11" fill="#f7932f" ${L}/>
      <circle cx="22" cy="29" r="5" fill="#fff3e3"/><circle cx="78" cy="29" r="5" fill="#fff3e3"/>
      <circle cx="50" cy="56" r="34" fill="#f7932f" ${L}/>
      <path d="M50 23 v9 M41 25 l3 7 M59 25 l-3 7 M17 50 h9 M18 60 h8 M83 50 h-9 M82 60 h-8" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
      <ellipse cx="50" cy="70" rx="17" ry="12" fill="#fff3e3"/>
      ${eyes(38, 62, 50)}
      <path d="M45 62 h10 l-5 5.5 Z" fill="#e8546b" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
      ${catMouth(67.5)}${blush(29, 71, 63)}`) },

    { name: 'Lion', svg: svg(`
      ${mane}
      <circle cx="50" cy="52" r="36" fill="#d9822b"/>
      <circle cx="32" cy="31" r="8" fill="#f6c26b" ${L}/><circle cx="68" cy="31" r="8" fill="#f6c26b" ${L}/>
      <circle cx="50" cy="56" r="26" fill="#f6c26b" ${L}/>
      <ellipse cx="50" cy="66" rx="12" ry="9" fill="#fff1d6"/>
      ${eyes(41, 59, 52, 4)}
      <path d="M45.5 60 h9 l-4.5 5 Z" fill="#8b5a2b" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
      ${catMouth(65)}${blush(35, 65, 62)}`) },

    { name: 'Seal', svg: svg(`
      <ellipse cx="50" cy="54" rx="38" ry="34" fill="#a8c0d6" ${L}/>
      <circle cx="43" cy="66" r="9" fill="#e6eff7"/><circle cx="57" cy="66" r="9" fill="#e6eff7"/>
      <g fill="${INK}" opacity=".55"><circle cx="40" cy="65" r="1.2"/><circle cx="44" cy="69" r="1.2"/><circle cx="39" cy="70" r="1.2"/>
      <circle cx="60" cy="65" r="1.2"/><circle cx="56" cy="69" r="1.2"/><circle cx="61" cy="70" r="1.2"/></g>
      <ellipse cx="50" cy="59" rx="6" ry="4.5" fill="#2b2b2b"/>
      ${eyes(35, 65, 46, 6)}${whiskers(63)}${blush(23, 77, 57)}
      <path d="M47 77 q3 3 6 0" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>`) },

    // ---- bottom row / right column ----
    { name: 'Koala', svg: svg(`
      <circle cx="20" cy="36" r="17" fill="#9aa3ad" ${L}/><circle cx="80" cy="36" r="17" fill="#9aa3ad" ${L}/>
      <circle cx="20" cy="37" r="9" fill="#f1e9f0"/><circle cx="80" cy="37" r="9" fill="#f1e9f0"/>
      <circle cx="50" cy="58" r="32" fill="#b3bbc4" ${L}/>
      ${eyes(35, 65, 52)}
      <ellipse cx="50" cy="65" rx="9" ry="12" fill="${INK}"/>
      <ellipse cx="47" cy="60" rx="2" ry="3.5" fill="#fff" opacity=".45"/>
      ${blush(29, 71, 68)}`) },

    { name: 'Fox', svg: svg(`
      <path d="M16 46 L20 8 L44 30 Z" fill="#f28c38" ${L}/><path d="M84 46 L80 8 L56 30 Z" fill="#f28c38" ${L}/>
      <path d="M23 36 L25 17 L36 28 Z" fill="${INK}" opacity=".75"/><path d="M77 36 L75 17 L64 28 Z" fill="${INK}" opacity=".75"/>
      <path d="M12 44 Q14 26 34 26 L66 26 Q86 26 88 44 Q84 70 50 90 Q16 70 12 44 Z" fill="#f28c38" ${L}/>
      <path d="M13 50 Q32 54 50 72 Q68 54 87 50 Q82 72 50 90 Q18 72 13 50 Z" fill="#fff7ee" ${L}/>
      ${eyes(36, 64, 46)}
      <ellipse cx="50" cy="83" rx="5" ry="3.8" fill="#2b2b2b"/>
      ${blush(28, 72, 61)}`) },

    { name: 'Bunny', svg: svg(`
      <ellipse cx="37" cy="26" rx="9" ry="22" transform="rotate(-12 37 26)" fill="#f6f1ec" ${L}/>
      <ellipse cx="63" cy="26" rx="9" ry="22" transform="rotate(12 63 26)" fill="#f6f1ec" ${L}/>
      <ellipse cx="37" cy="28" rx="4.5" ry="14" transform="rotate(-12 37 28)" fill="#ffb3c7"/>
      <ellipse cx="63" cy="28" rx="4.5" ry="14" transform="rotate(12 63 28)" fill="#ffb3c7"/>
      <circle cx="50" cy="64" r="30" fill="#f6f1ec" ${L}/>
      ${eyes(40, 60, 60)}
      <ellipse cx="50" cy="68" rx="4" ry="3" fill="#ff7ea1"/>
      ${catMouth(71)}${blush(33, 67, 72)}`) },

    { name: 'Pig', svg: svg(`
      <path d="M22 34 L16 8 L42 24 Z" fill="#ff9bb8" ${L}/><path d="M78 34 L84 8 L58 24 Z" fill="#ff9bb8" ${L}/>
      <circle cx="50" cy="56" r="34" fill="#ffc2d4" ${L}/>
      <ellipse cx="50" cy="66" rx="14" ry="10" fill="#ff9bb8" ${L}/>
      <ellipse cx="45" cy="66" rx="2.5" ry="4" fill="${INK}" opacity=".8"/><ellipse cx="55" cy="66" rx="2.5" ry="4" fill="${INK}" opacity=".8"/>
      ${eyes(37, 63, 48)}${blush(25, 75, 62)}`) },

    { name: 'Otter', svg: svg(`
      <circle cx="20" cy="36" r="8" fill="#a0704a" ${L}/><circle cx="80" cy="36" r="8" fill="#a0704a" ${L}/>
      <ellipse cx="50" cy="56" rx="36" ry="32" fill="#a0704a" ${L}/>
      <ellipse cx="50" cy="69" rx="21" ry="15" fill="#f1dcc0"/>
      ${eyes(36, 64, 46)}
      <ellipse cx="50" cy="62" rx="6.5" ry="4.5" fill="#2b2b2b"/>
      ${smile(50, 70)}${whiskers(66)}`) },
  ];
})();
