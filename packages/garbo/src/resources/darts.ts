import { maxBy } from "libram";

export const DART_PERKS: string[] = [
  "Bullseyes do not impress you much",
  "You are less impressed by bullseyes",
  "25% better chance to hit bullseyes",
  "25% More Accurate bullseye targeting",
  "25% Better bullseye targeting",
  "Extra stats from stats targets",
  "Expand your dart capacity by 1",
  "Throw a second dart quickly",
  "Butt awareness",
  "Increase Dart Deleveling from deleveling targets",
  "Add Hot Damage",
  "Add Cold Damage",
  "Add Sleaze Damage",
  "Add Spooky Damage",
  "Add Stench Damage",
  "Deal 25-50% more damage",
  "Deal 25-50% extra damage",
  "Deal 25-50% greater damage",
];

export function highestPriorityOption(options: { [key: number]: string }) {
  return Number(
    maxBy(
      Object.entries(options),
      ([text]) =>
        DART_PERKS.includes(text) ? DART_PERKS.indexOf(text) : Infinity,
      true,
    )[0],
  );
}
