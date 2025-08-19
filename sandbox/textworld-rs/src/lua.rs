pub use mlua::prelude::*;

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

pub fn run_script(lua: &Lua, name: String) -> LuaResult<()> {
    let script = format!("my_module.hello('{}')", name);
    lua.load(script).exec()?;
    Ok(())
}
