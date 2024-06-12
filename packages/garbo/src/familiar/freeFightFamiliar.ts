import {
  Familiar,
  familiarWeight,
  inebrietyLimit,
  itemDropModifier,
  itemDropsArray,
  Location,
  Monster,
  myInebriety,
} from "kolmafia";
import {
  $familiar,
  $item,
  $location,
  clamp,
  findLeprechaunMultiplier,
  get,
  have,
} from "libram";
import { canOpenRedPresent } from ".";
import { garboValue } from "../garboValue";
import getConstantValueFamiliars from "./constantValueFamiliars";
import getDropFamiliars from "./dropFamiliars";
import getExperienceFamiliars from "./experienceFamiliars";
import { GeneralFamiliar, timeToMeatify } from "./lib";
import { meatFamiliar } from "./meatFamiliar";
import { globalOptions } from "../config";

function isGoodMeatDropper(target: Monster): boolean {
  const meatDrop = (target.minMeat + target.maxMeat) / 2;

  const itemDrop = determineItemDrops(target);

  return itemDrop / 4 < meatDrop; // This is more or less arbitrary, but if the item list is worth four times the meat, one can assume we're choosing a monster for it's drops, not it's meat.
}

function determineItemDrops(target: Monster): number {
  const totalValue = itemDropsArray(target).reduce((acc, drop) => {
    const value =
      garboValue(drop.drop) *
      clamp(drop.rate * (1 + itemDropModifier() / 100), 0, 1);
    return acc + value;
  }, 0);

  const itemDrop = totalValue / itemDropsArray(target).length;

  return itemDrop;
}

type MenuOptions = Partial<{
  canChooseMacro: boolean;
  location: Location;
  extraFamiliars: GeneralFamiliar[];
  includeExperienceFamiliars: boolean;
  allowAttackFamiliars: boolean;
  mode: "barf" | "free";
}>;
const DEFAULT_MENU_OPTIONS = {
  canChooseMacro: true,
  location: $location`none`,
  extraFamiliars: [],
  includeExperienceFamiliars: true,
  allowAttackFamiliars: true,
  mode: "free",
} as const;
export function menu(options: MenuOptions = {}): GeneralFamiliar[] {
  const {
    includeExperienceFamiliars,
    canChooseMacro,
    location,
    extraFamiliars,
    allowAttackFamiliars,
    mode,
  } = {
    ...DEFAULT_MENU_OPTIONS,
    ...options,
  };
  const familiarMenu = [
    ...getConstantValueFamiliars(mode),
    ...getDropFamiliars(),
    ...(includeExperienceFamiliars ? getExperienceFamiliars(mode) : []),
    ...extraFamiliars,
  ];

  if (canChooseMacro && myInebriety() <= inebrietyLimit()) {
    if (timeToMeatify()) {
      familiarMenu.push({
        familiar: $familiar`Grey Goose`,
        expectedValue:
          (Math.max(familiarWeight($familiar`Grey Goose`) - 5), 0) ** 4,
        leprechaunMultiplier: 0,
        limit: "experience",
      });
    }
    if (
      !isGoodMeatDropper(globalOptions.target) &&
      globalOptions.target.attributes.includes("FREE")
    ) {
      familiarMenu.push({
        familiar: $familiar`Grey Goose`,
        expectedValue: determineItemDrops(globalOptions.target) * 2,
        leprechaunMultiplier: 0,
        limit: "special",
      });
    }

    if (canOpenRedPresent()) {
      familiarMenu.push({
        familiar: $familiar`Crimbo Shrub`,
        expectedValue: 2500,
        leprechaunMultiplier: 0,
        limit: "special",
      });
    }

    if (
      location.zone === "Dinseylandfill" &&
      have($familiar`Space Jellyfish`)
    ) {
      familiarMenu.push({
        familiar: $familiar`Space Jellyfish`,
        expectedValue:
          garboValue($item`stench jelly`) /
          (get("_spaceJellyfishDrops") < 5
            ? get("_spaceJellyfishDrops") + 1
            : 20),
        leprechaunMultiplier: 0,
        limit: "special",
      });
    }
  }

  const meatFam = meatFamiliar();

  if (!familiarMenu.some(({ familiar }) => familiar === meatFam)) {
    familiarMenu.push({
      familiar: meatFam,
      expectedValue: 0,
      leprechaunMultiplier: findLeprechaunMultiplier(meatFam),
      limit: "none",
    });
  }

  if (!allowAttackFamiliars) {
    return familiarMenu.filter(
      (fam) => !(fam.familiar.physicalDamage || fam.familiar.elementalDamage),
    );
  }

  return familiarMenu;
}

export function getAllJellyfishDrops(): {
  expectedValue: number;
  turnsAtValue: number;
}[] {
  if (!have($familiar`Space Jellyfish`)) {
    return [{ expectedValue: 0, turnsAtValue: 0 }];
  }

  const current = get("_spaceJellyfishDrops");
  const returnValue = [];

  for (
    let dropNumber = clamp(current + 1, 0, 6);
    dropNumber <= 6;
    dropNumber++
  ) {
    returnValue.push({
      expectedValue:
        garboValue($item`stench jelly`) / (dropNumber > 5 ? 20 : dropNumber),
      turnsAtValue: dropNumber > 5 ? Infinity : dropNumber,
    });
  }

  return returnValue;
}

export function freeFightFamiliarData(
  options: MenuOptions = {},
): GeneralFamiliar {
  const compareFamiliars = (a: GeneralFamiliar, b: GeneralFamiliar) => {
    if (a === null) return b;
    if (a.expectedValue === b.expectedValue) {
      return a.leprechaunMultiplier > b.leprechaunMultiplier ? a : b;
    }
    return a.expectedValue > b.expectedValue ? a : b;
  };

  return menu(options).reduce(compareFamiliars, {
    familiar: $familiar.none,
    expectedValue: 0,
    leprechaunMultiplier: 0,
    limit: "none",
  });
}

export function freeFightFamiliar(options: MenuOptions = {}): Familiar {
  return freeFightFamiliarData(options).familiar;
}
