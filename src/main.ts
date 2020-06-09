interface Item {
    name: string;
    value: number;
};

interface Stats {
    health: number;
    mana: number;
    defense: number;
    penetration: number;
    critial: number;
};

interface Player {
    name: string;
    level: number;
    xp: number;
    room: string;
    inventory: Item[];
    stats: Stats;
};

interface Room {
    name: string;
    description: string;
};