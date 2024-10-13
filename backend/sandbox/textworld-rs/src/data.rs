pub mod builders;

#[derive(Default)]
pub struct Item {
    name: String,
    descriptions: Vec<(String, String)>,
    usable: bool,
    consumable: bool,
    level: u8,
    value: u32,
}

#[derive(Default)]
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

#[derive(Default)]
pub struct Exit {
    name: String,
    location: Location,
    hidden: bool,
}

#[derive(Default)]
pub struct Room {
    name: String,
    descriptions: Vec<(String, String)>,
    actions: Option<Vec<String>>,
    exits: Option<Vec<Exit>>,
}

#[derive(Default)]
pub struct Zone {
    name: String,
    rooms: Option<Vec<Room>>,
}

#[derive(Default)]
pub struct Player {
    score: u64,
    gold: u64,
    location: Location,
    description: String,
}

#[derive(Default)]
pub struct World {
    players: Vec<Player>,
    zones: Vec<Zone>,
}
