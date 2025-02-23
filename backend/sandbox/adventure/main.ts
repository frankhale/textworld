import { RoomBuilder, ItemBuilder, PlayerBuilder } from './builders.ts';
import { Game } from './game.ts';
import { REPL } from './repl.ts';

const items = {
  key: new ItemBuilder('key', 'Rusty Key')
    .withDescription('An old rusty key')
    .build(),
  potion: new ItemBuilder('potion', 'Health Potion')
    .withDescription('Restores health')
    .withUseEffect((game, item) => {
      game.modifyPlayerHealth(h => h + 20);
      game.removeItemFromInventory(item);
    })
    .build(),
  herb: new ItemBuilder('herb', 'Medicinal Herb')
    .withDescription('A healing herb')
    .withQuantity(3)
    .build(),
  potionRecipe: new ItemBuilder('potionRecipe', 'Potion Recipe')
    .withDescription('A recipe for crafting health potions')
    .asRecipe({
      id: 'potion recipe',
      result: 'potion',
      ingredients: ['herb'],
      description: 'Creates a health potion from a herb'
    })
    .build(),
};

const rooms = {
  entrance: new RoomBuilder('entrance')
    .withDescription('A dark cave entrance')
    .withItem(items.key)
    .withItem(items.potionRecipe)
    .withExit('north', 'chamber')
    .build(),
  chamber: new RoomBuilder('chamber')
    .withDescription('A spacious chamber')
    .withItem(items.herb)
    .withExit('south', 'entrance')
    .build(),
};

const player = new PlayerBuilder('entrance')
  .withItem(items.herb, 2)
  .build();

const game = new Game({
  player,
  rooms,
  items,
});

const repl = new REPL(game);
repl.start();