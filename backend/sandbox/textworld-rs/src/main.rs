// TODO: Will remove this later
#![allow(unused)]

// I am a newbie with Rust and am playing around with the idea of rewriting Textworld in Rust
// 9 October 2024

mod data;
mod lua;
mod websocket_server;

// fn main() {
//     println!("Hello, world!");
// }

// fn main() -> lua::LuaResult<()> {
//     let lua = lua::init();
//     let result = lua::run_script(&lua?, String::from("Jammy"))?;
//     Ok(result)
// }

fn main() {
    websocket_server::run()
}
