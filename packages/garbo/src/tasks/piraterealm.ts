import { Outfit, step } from "grimoire-kolmafia";
import {
  $effect,
  $item,
  $location,
  $monster,
  $stat,
  get,
  getModifier,
  have,
  maxBy,
  realmAvailable,
  uneffect,
} from "libram";
import {
  abort,
  Effect,
  effectModifier,
  isShruggable,
  Item,
  mallPrice,
  myBuffedstat,
  myEffects,
  numericModifier,
  retrieveItem,
  runChoice,
  Stat,
  toEffect,
  use,
  visitUrl,
} from "kolmafia";
import { GarboTask } from "./engine";

import { GarboStrategy, Macro } from "../combat";
import { freeFightOutfit, meatTargetOutfit } from "../outfit";
import { globalOptions } from "../config";

const eyepatch = $item`PirateRealm eyepatch`;

function getBestDebuffItem(stat: Stat): Item {
  const debuffs = Item.all()
    .map((item) => ({ item, effect: effectModifier(item, "Effect") }))
    .filter(
      ({ effect }) =>
        effect !== $effect.none &&
        !have(effect) &&
        getModifier(stat.toString(), effect) < 0,
    );

  return maxBy(
    debuffs,
    ({ item, effect }) =>
      mallPrice(item) / getModifier(stat.toString(), effect),
  ).item;
}

// Just checking for the gummi effects for now, maybe can check other stuff later?
function keepStatsLow(): void {
  const effects: Effect[] = Object.keys(myEffects()).map((effectName) =>
    toEffect(effectName),
  );

  // Use a traditional for loop for stats
  for (const stat of Stat.all()) {
    const statName = stat.toString();

    while (myBuffedstat(stat) > 100) {
      for (const isShruggablePass of [true, false]) {
        for (let j = 0; j < effects.length; j++) {
          const ef = effects[j];
          if (
            isShruggable(ef) === isShruggablePass && // Process shruggable effects in first pass, non-shruggable in second
            (getModifier(statName, ef) ||
              getModifier(`${statName} Percent`, ef)) &&
            !(
              getModifier("Meat Drop", ef) > 0 ||
              getModifier("Familiar Weight", ef) > 0 ||
              getModifier("Smithsness", ef) > 0 ||
              getModifier("Item Drop", ef) > 0
            )
          ) {
            uneffect(ef); // Remove the effect
          }
          if (myBuffedstat(stat) <= 100) break;
        }
        if (myBuffedstat(stat) <= 100) break;
      }
      if (myBuffedstat(stat) <= 100) break;

      const debuffItem = () => getBestDebuffItem(stat);
      retrieveItem(debuffItem());
      use(debuffItem());
    }
  }

  if (
    myBuffedstat($stat`Moxie`) >= 100 ||
    myBuffedstat($stat`Mysticality`) >= 100 ||
    myBuffedstat($stat`Muscle`) >= 100
  ) {
    abort(
      "Buffed stats are too high for PirateRealm! Check for equipment or buffs that we can add to prevent in the script",
    );
  }
}

export function prSetupTasks(): GarboTask[] {
  return [
    getEyepatch(),
    chooseCrew(),
    sailToCrabIsland(),
    runToGiantGiantCrab(),
    ...prFinishTasks(), // We can remove this once Embezzlers are en-grimoired
  ];
}

export function prFinishTasks(): GarboTask[] {
  return [runGiantGiantCrab(), selectTrashIsland()];
}

export function getEyepatch(): GarboTask {
  return {
    name: "Start Pirate Realm",
    completed: () => have(eyepatch),
    ready: () =>
      realmAvailable("pirate") &&
      globalOptions.target === $monster`cockroach` &&
      get("pirateRealmUnlockedAnemometer"),
    do: (): void => {
      visitUrl("place.php?whichplace=realm_pirate&action=pr_port");
    },
    combat: new GarboStrategy(() => Macro.basicCombat()),
    spendsTurn: false,
  };
}

export function chooseCrew(): GarboTask {
  return {
    name: "Choose Crew",
    prepare: () => keepStatsLow(),
    completed: () => step("_questPirateRealm") >= 1,
    ready: () => have(eyepatch),
    do: (): void => {
      visitUrl("place.php?whichplace=realm_pirate&action=pr_port");
      runChoice(1); // Head to Groggy's
      runChoice(1); // Select the first crew-member. Better options exist probably.
      runChoice(4); // Grab the Anemometer
      if (get("pirateRealmStormsEscaped") >= 10) {
        runChoice(4); // Swift Clipper, if it's unlocked
      } else {
        runChoice(3); // Otherwise, Speedy Caravel
      }
      runChoice(1); // Head to the sea
    },
    outfit: (): Outfit => {
      return freeFightOutfit({ acc3: eyepatch });
    },
    combat: new GarboStrategy(() => Macro.basicCombat()),
    spendsTurn: false,
  };
}

export function sailToCrabIsland(): GarboTask {
  return {
    name: "Sail to Crab Island",
    prepare: () => keepStatsLow(),
    completed: () => step("_questPirateRealm") >= 4,
    ready: () => step("_questPirateRealm") >= 1,
    do: $location`Sailing the PirateRealm Seas`,
    choices: {
      1365: 1,
      1352: 1,
      1364: get("_pirateRealmShip") === "Speedy Caravel" ? 1 : 2,
      1361: 1,
      1357: 3,
      1360: 6, // I hate this but don't know how to do it better!
      1356: 3,
      1362: 2,
      1363: 1,
      1359: 1,
      1358: 1,
      1355: 1,
      1367: 2, // If we knew we had glue we could choose glue, but we can't know that
    },
    outfit: (): Outfit => {
      return freeFightOutfit({ acc3: eyepatch });
    },
    combat: new GarboStrategy(() => Macro.basicCombat()),
    spendsTurn: true,
    limit: { tries: 8 },
  };
}

export function runToGiantGiantCrab(): GarboTask {
  return {
    name: "Pre-Giant Giant Crab",
    prepare: (): void => {
      keepStatsLow();
      if (mallPrice($item`windicle`) < 3 * get("valueOfAdventure")) {
        retrieveItem($item`windicle`);
      }
    },
    completed: () => step("_questPirateRealm") >= 5,
    ready: () => step("_questPirateRealm") === 4,
    do: $location`PirateRealm Island`,
    outfit: (): Outfit => {
      return freeFightOutfit({ acc3: eyepatch });
    },
    combat: new GarboStrategy(() =>
      Macro.externalIf(
        mallPrice($item`windicle`) < 3 * get("valueOfAdventure") &&
          !get("_pirateRealmWindicleUsed") &&
          get("_pirateRealmIslandMonstersDefeated") <= 1,
        Macro.tryItem($item`windicle`),
      ).basicCombat(),
    ),
    spendsTurn: true,
    limit: { tries: 5 },
  };
}

export function runGiantGiantCrab(): GarboTask {
  return {
    name: "Giant Giant Crab",
    prepare: () => keepStatsLow(),
    completed: () => step("_questPirateRealm") >= 6,
    ready: () => step("_questPirateRealm") === 5,
    do: $location`PirateRealm Island`,
    choices: { 1385: 1, 1368: 1 },
    outfit: (): Outfit => {
      return meatTargetOutfit({ acc3: eyepatch });
    },
    combat: new GarboStrategy(() => Macro.meatKill()),
    spendsTurn: true,
  };
}

export function selectTrashIsland(): GarboTask {
  return {
    name: "Select Trash Island",
    prepare: () => keepStatsLow(),
    completed: () =>
      get("_lastPirateRealmIsland") === $location`Trash Island` ||
      step("_questPirateRealm") > 6,
    ready: () => step("_questPirateRealm") === 6,
    do: $location`Sailing the PirateRealm Seas`,
    choices: { 1353: 5 }, // Select Trash Island
    outfit: (): Outfit => {
      return meatTargetOutfit({ acc3: eyepatch });
    },
    combat: new GarboStrategy(() => Macro.basicCombat()),
    spendsTurn: false,
  };
}
