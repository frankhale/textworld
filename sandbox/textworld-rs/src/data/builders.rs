use crate::data::*;

pub struct RoomBuilder {
    name: Option<String>,
    descriptions: Option<Vec<(String, String)>>,
    actions: Option<Vec<String>>,
    exits: Option<Vec<Exit>>,
}

impl RoomBuilder {
    pub fn new() -> Self {
        Self {
            name: None,
            descriptions: None,
            actions: None,
            exits: None,
        }
    }

    pub fn name(mut self, name: &str) -> Self {
        self.name = Some(name.to_string());
        self
    }

    pub fn description(mut self, description: Vec<(String, String)>) -> Self {
        self.descriptions = Some(description);
        self
    }

    pub fn actions(mut self, actions: Vec<String>) -> Self {
        self.actions = Some(actions);
        self
    }

    pub fn exits(mut self, exit: Vec<Exit>) -> Self {
        self.exits = Some(exit);
        self
    }

    pub fn build(self) -> Result<Room, &'static str> {
        let name = self.name.ok_or("Room name is required")?;
        let descriptions = self.descriptions.ok_or("Room description is required")?;

        Ok(Room {
            name,
            descriptions,
            actions: self.actions,
            exits: self.exits,
        })
    }
}
