import {
  availableChoiceOptions,
  ChoiceAdventureScript,
  runChoice,
} from "kolmafia";
import { highestPriorityOption } from "./resources/darts";
import { get } from "libram";

export const main: ChoiceAdventureScript = (choiceNumber: number) => {
  const options = availableChoiceOptions();
  switch (choiceNumber) {
    case 1525:
      return void runChoice(highestPriorityOption(options));
    case 1360: {
      while (get("_pirateRealmGrub") < 10 && get("_pirateRealmGold") > 10) {
        runChoice(1);
      }
      while (get("_pirateRealmGrog") < 10 && get("_pirateRealmGold") > 10) {
        runChoice(2);
      }
      while (get("_pirateRealmGold") > 10) {
        runChoice(3);
      }
      runChoice(6);
      return;
    }
  }
};
