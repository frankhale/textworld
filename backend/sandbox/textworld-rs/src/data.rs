mod builders;

pub struct Item {
    name: String,
    descriptions: Vec<(String, String)>,
    usable: bool,
    consumable: bool,
    level: u8,
    value: u32,
}

pub struct Location {
    zone_name: String,
    room_name: String,
}

#[derive(Debug, PartialEq)]
pub enum ExitName {
    North,
    South,
    East,
    West,
}

pub struct Exit {
    name: String,
    location: Location,
    hidden: bool,
}

pub struct Room {
    name: String,
    descriptions: Vec<(String, String)>,
    actions: Option<Vec<String>>,
    exits: Option<Vec<Exit>>,
}

pub struct Zone {
    name: String,
    rooms: Option<Vec<Room>>,
}

pub struct Player {
    score: u64,
    gold: u64,
    location: Location,
    description: String,
}

pub struct World {
    players: Vec<Player>,
    zones: Vec<Zone>,
}
