import { Item, Monster, Skill } from "kolmafia";
import {
  $items,
  $monsters,
  $skill,
  $skills,
  getBanishedMonsters,
} from "libram";

const monsters = $monsters`Copperhead Club bartender, fan dancer, ninja dressed as a waiter, waiter dressed as a ninja`;
const banishSkillSources = $skills`Spring Kick, Batter Up!, Monkey Slap`;
const banishItemSources = $items`human musk`;

export function getMonstersToBanish(): Monster[] {
  const banishedMonsters = getBanishedMonsters();
  const alreadyBanished = Array.from(banishedMonsters.values());
  return monsters.filter((monster) => !alreadyBanished.includes(monster));
}

export function monkeySlapDone(): boolean {
  const banishedMonsters = getBanishedMonsters();
  for (const [banishSource, monster] of banishedMonsters.entries()) {
    if (banishSource === $skill`Monkey Slap` && monsters.includes(monster)) {
      return true;
    }
  }
  return false;
}

export function getNextBanishSource(): Skill | Item | null {
  const banishedMonsters = getBanishedMonsters();
  const alreadyBanished = Array.from(banishedMonsters.values());

  // Find the next monster that has not been banished
  const nextMonster = monsters.find(
    (monster) => !alreadyBanished.includes(monster),
  );

  if (!nextMonster) {
    // If all monsters are already banished, return null
    return null;
  }

  // Find an unused banish source
  const usedSources = Array.from(banishedMonsters.keys());
  const unusedSkill = banishSkillSources.find(
    (skill) => !usedSources.includes(skill),
  );
  if (unusedSkill) {
    return unusedSkill;
  }

  const unusedItem = banishItemSources.find(
    (item) => !usedSources.includes(item),
  );
  if (unusedItem) {
    return unusedItem;
  }

  // If no sources are available, return null
  return null;
}
