let MOTD = "Welcome to a text adventure written using an entity component system based engine called TextWorld. Look around, have fun!";

let Items = [
    {
        Id: 1,
        Name: "leather coin purse",
        Description: "Extremely worn leather purse. The leather is soft and flexible and it's color has faded.",
        ItemType: "CoinPurse",
        Synonyms: ["purse", "coin purse", "leather purse", "coins"],
        IsContainer: false,
        Consumable: true,
        AttributesJSON: "{ \"NumberOfCoins\": 100 }"
    },
    {
        Id: 2,
        Name: "health potion",
        Description: "An oddly shaped bottle with a cool blue liquid inside. The liquid glows with an intense light.",
        ItemType: "HealthPotion",
        Synonyms: ["health", "health pot"],
        IsContainer: false,
        Consumable: true,
        AttributesJSON: "{ \"Health\": 50 }"
    },
    {
        Id: 3,
        Name: "lamp",
        Description: "A strickingly beautiful oil lamp",
        ItemType: "Lamp",
        Synonyms: ["lantern"],
        IsContainer: false,
        Consumable: true,
        AttributesJSON: "{}"
    }
]

let NPCs = [
    {
        Id: 1,
        Name: "NPC 1",
        Description: "A wretched old beggar",
        Synonyms: ["npc1"],
        Items: [],
        Dialogue: [
            { Id: 1, Line: "Would you have any coins to spare?" },
            { Id: 2, Line: "I'm really hungry" }            
        ]
    }
];

let Player = {
    Description: "You are the epitome of a hero. You're tall, dapper, strong and ready to take on the world!",
    Currency: { Coins: 10 },
    Health: { CurrentHealth: 50, MaxHealth: 100 },
    Inventory: [
        { Id: 2, Quantity: 3 }
    ],
    CurrentRoom: "Open Field"
}

let Rooms = [
    {
        Name: "Open Field",
        Description: "You are standing in an open field. All around you stands tall vibrant green grass. You can hear the sound of flowing water off in the distance which you suspect is a stream.",
        Exits: [
            {
                Direction: "North",
                RoomId: "Stream"
            }
        ],
        Items: [
            { Id: 1, Quantity: 1 },
            { Id: 3, Quantity: 1 }
        ]
    },
    {
        Name: "Stream",
        Description: "A shallow rocky stream is swifty flowing from your west to east. The water looks approximately one foot deep from where you are standing.",
        Exits: [
            {
                Direction: "South",
                RoomId: "Open Field"
            },
            {
                Direction: "East",
                RoomId: "Large Rock"
            }
        ],
    },
    {
        Name: "Large Rock",
        Description: "You are standing beside a large rock. The rock looks out of place with respect to the rest of your surroundings.",
        Exits: [
            {
                Direction: "West",
                RoomId: "Stream"
            },
            {
                Direction: "East",
                RoomId: "Old Forest"
            }
        ],
        Items: [
            { Id: 2, Quantity: 10 }
        ]
    },
    {
        Name: "Old Forest",
        Description: "Thick tall trees block your way but seem to have allowed the stream safe passage. It doesn't appear as though you can travel any further in this direction.",
        Exits: [
            {
                Direction: "West",
                RoomId: "Large Rock"
            }
        ]
    }
]

let Game = {
    MOTD,
    Player,
    Items,
    Rooms
}

// deno run --allow-write .\game-data.js
let outputJSON = JSON.stringify(Game, null, 2);
await Deno.writeTextFile("game.json", outputJSON);