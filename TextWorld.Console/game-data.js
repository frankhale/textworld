let Items = [
    {
        Id: 1,
        Name: "leather coin purse",
        Description: "Extremely worn leather purse. The leather is soft and flexible and it's color has faded.",
        ItemType: "CoinPurse",
        AttributesJSON: "{ \"quantity\": 1, \"numberOfCoins\": 10 }"
    },
    {
        Id: 2,
        Name: "health potion",
        Description: "An oddly shaped bottle with a cool blue liquid inside. The liquid glows with an intense light.",
        ItemType: "Potion",
        AttributesJSON: "{ \"quantity\": 1, \"health\": 50 }"
    },
    {
        Id: 3,
        Name: "basic sword",
        Description: "A basic sword with no special qualities. It's very worn and it's color is that of dull metal. It otherwise feels solid in your hand",
        ItemType: "Sword",
        AttributesJSON: "{ \"attack\": 10, \"quantity\": 1, \"defense\": 2 }"
    }
]

let Player = {
    Description: "You are the epitome of a hero. You're tall, dapper, strong and ready to take on the world!",
    Currency: { Coins: 10 },
    Health: { Current: 100, Max: 100 },
    Inventory: [
        { Id: 3, Quantity: 1 },
        { Id: 2, Quantity: 3 },
    ],
    CurrentRoom: 1
}

let Rooms = [
    {
        Name: "Open Field",
        Description: "You are standing in an open field. All around you stands tall vibrant green grass. You can hear the sound of flowing water off in the distance which you suspect is a stream.",
        Exits: { North: "Stream" },
        Items: [
            { Id: 1, Quantity: 1 }
        ]
    },
    {
        Name: "Stream",
        Description: "A shallow rocky stream is swifty flowing from your west to east. The water looks approximately one foot deep from where you are standing.",
        Exits: { South: "Open Field", East: "Large Rock" },
    },
    {
        Name: "Large Rock",
        Description: "You are standing beside a large rock. The rock looks out of place with respect to the rest of your surroundings.",
        Exits: { West: "Stream" },
        Items: [
            { Id: 2, Quantity: 10 }
        ]
    },
    {
        Name: "Old Forest",
        Description: "Thick tall trees block your way but seem to have allowed the stream safe passage. It doesn't appear as though you can travel any further in this direction.",
        Exits: { West: "Large Rock" }
    }
]

let Game = {
    Player,
    Items,
    Rooms
}

let outputJSON = JSON.stringify(Game, null, 2);
await Deno.writeTextFile("game.json", outputJSON);