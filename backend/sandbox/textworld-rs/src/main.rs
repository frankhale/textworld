#![allow(unused)]

// I am a newbie with Rust and am playing around with the idea of rewriting Textworld in Rust
// 7 October 2024

use mlua::prelude::LuaResult;

mod textworld {
    pub mod lua_itegration {
        use mlua::prelude::*;

        pub fn init() -> LuaResult<Lua> {
            let lua = Lua::new_with(LuaStdLib::NONE, LuaOptions::default())?;
            let my_module = create_my_module(&lua)?;
            lua.globals().set("my_module", my_module)?;
            Ok(lua)
        }

        fn hello(_: &Lua, name: String) -> LuaResult<()> {
            println!("hello, {}!", name);
            Ok(())
        }

        fn create_my_module(lua: &Lua) -> LuaResult<LuaTable> {
            let exports = lua.create_table()?;
            exports.set("hello", lua.create_function(hello)?)?;
            Ok(exports)
        }

        pub fn run_script(lua: &Lua) -> LuaResult<()> {
            lua.load("my_module.hello('Frank')").exec()?;
            Ok(())
        }
    }

    pub mod core {
        pub struct Location {
            zone_name: String,
            room_name: String,
        }

        pub struct Player {
            score: f64,
            gold: f64,
            location: Location,
        }
    }
}

fn main() -> LuaResult<()> {
    let lua = textworld::lua_itegration::init();
    let result = textworld::lua_itegration::run_script(&lua?)?;
    Ok(result)
}
