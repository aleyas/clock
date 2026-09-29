import { Level } from "./types";

const raw: Array<[number,number,number]> = [
  [25,50,50],[50,100,100],[75,150,150],[100,200,200],[150,300,300],
  [200,400,400],[300,600,600],[400,800,800],[500,1000,1000],
  [600,1200,1200],[800,1600,1600],[1000,2000,2000]
];

let position = 1;
export const standardLevels: Level[] = raw.flatMap(([sb,bb,ante], i) => {
  const level: Level = { position:position++, kind:"level", minutes:10, sb, bb, ante };
  return i === 5
    ? [level, { position:position++, kind:"break", minutes:10, sb:null, bb:null, ante:0 }]
    : [level];
});

export const defaultPayouts = [
  { place:1, prize:"1,000 €", visible:true },
  { place:2, prize:"500 €", visible:true },
  { place:3, prize:"250 €", visible:true }
];

export const defaultSponsor = {
  name:"GGPoker",
  image_url:"https://ggpoker.com/favicon.ico",
  enabled:true,
  display_order:1,
  interval_seconds:10,
  duration_seconds:8
};