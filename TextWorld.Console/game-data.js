let items = [
    {
        id: 1,
        name: "leather coin purse",
        description: "Extremely worn leather purse. The leather is soft and flexible and it's color has faded.",
        type: "coin purse",
        quantity: 1,
        numberOfCoins: 10
    },
    {
        id: 2,
        name: "health potion",
        description: "An oddly shaped bottle with a cool blue liquid inside. The liquid glows with an intense light.",
        type: "potion",
        quantity: 1,
        health: 50,
    },
    {
        id: 3,
        name: "basic sword",
        description: "A basic sword with no special qualities. It's very worn and it's color is that of dull metal. It otherwise feels solid in your hand",
        type: "sword",
        attack: 10,
        quantity: 1,
        defense: 2,
    }
]

let player = {
    description: "You are the epitome of a hero. You're tall, dapper, strong and ready to take on the world!",
    currency: { coins: 10 },
    health: { current: 100, max: 100 },
    inventory: [
        { id: 3, quantity: 1 },
        { id: 2, quantity: 3 },
    ],
    currentRoom: 1
}

let rooms = [
    {
        name: "Open Field",
        description: "You are standing in an open field. All around you stands tall vibrant green grass. You can hear the sound of flowing water off in the distance which you suspect is a stream.",
        exits: { north: "Stream" },
        items: [
            { id: 1, quantity: 1 }
        ]
    },
    {
        name: "Stream",
        description: "A shallow rocky stream is swifty flowing from your west to east. The water looks approximately one foot deep from where you are standing.",
        exits: { south: "Open Field", east: "Large Rock" },
    },
    {
        name: "Large Rock",
        description: "You are standing beside a large rock. The rock looks out of place with respect to the rest of your surroundings.",
        exits: { west: "Stream" },
        items: [
            { id: 2, quantity: 10 }
        ]
    },
    {
        name: "Old Forest",
        description: "Thick tall trees block your way but seem to have allowed the stream safe passage. It doesn't appear as though you can travel any further in this direction.",
        exits: { west: "Large Rock" },
    }
]

let game = {
    player,
    items,
    rooms
}

console.log(JSON.stringify(game, null, 2));
