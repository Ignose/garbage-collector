import {
  availableAmount,
  Effect,
  mallPrice,
  mySpleenUse,
  retrieveItem,
  spleenLimit,
  sweetSynthesis,
  sweetSynthesisResult,
} from "kolmafia";
import { $item, $items, clamp } from "libram";
import { shuffle } from "./lib";

const allowList = $items`Fudgie Roll, peanut brittle shield, sugar shotgun, sugar shillelagh, sugar shank, sugar chapeau, sugar shorts, sugar shield, sugar shirt`;

// For safety, explicitly skip candies that are no longer obtainable or extremely rare
const blockList = new Set([
  $item`candied nuts`,
  $item`candy kneecapping stick`,
  $item`chocolate cigar`,
  $item`fancy but probably evil chocolate`,
  $item`fancy chocolate`,
  $item`fancy chocolate car`,
  $item`gummi ammonite`,
  $item`gummi belemnite`,
  $item`gummi trilobite`,
  $item`powdered candy sushi set`,
  $item`radio button candy`,
  $item`spiritual candy cane`,
  $item`Ultra Mega Sour Ball`,
  $item`vitachoconutriment capsule`,
]);

const buyable = $items
  .all()
  .filter((i) => i.tradeable && i.candyType === "complex" && !blockList.has(i))
  .sort((a, b) => mallPrice(a) - mallPrice(b))
  .slice(0, 50);

export default function synthesize(casts: number, effect: Effect): void {
  const shuffledWhitelist = shuffle(allowList);
  for (const itemA of shuffledWhitelist) {
    if (availableAmount(itemA) <= 1) continue;
    for (const itemB of buyable) {
      if (sweetSynthesisResult(itemA, itemB) !== effect) continue;
      const possibleCasts = availableAmount(itemA) - 1;
      const spleen = Math.max(spleenLimit() - mySpleenUse(), 0);
      const castsToDo = Math.min(possibleCasts, casts, spleen);
      if (castsToDo === 0) continue;
      retrieveItem(itemA, castsToDo);
      retrieveItem(itemB, castsToDo);
      if (sweetSynthesis(castsToDo, itemA, itemB)) casts -= castsToDo;
    }
    if (casts <= 0) return;
  }

  sweetSynthesis(clamp(casts, 0, spleenLimit() - mySpleenUse()), effect);
}
