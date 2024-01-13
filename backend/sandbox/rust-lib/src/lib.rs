extern crate mlua;

use mlua::Lua;
use std::ffi::{c_char, CStr, CString};
use std::os::raw::c_void;

fn convert_to_str_ref(key: *const c_char) -> &'static str {
    unsafe {
        CStr::from_ptr(key)
            .to_str()
            .expect("Failed to convert key to string")
    }
}

#[no_mangle]
pub extern "C" fn lua_create_instance() -> *const c_void {
    let lua = Lua::new();
    let boxed_lua = Box::new(lua);
    Box::into_raw(boxed_lua) as *const c_void
}

#[no_mangle]
pub extern "C" fn lua_free_instance(lua: *const std::ffi::c_void) {
    if !lua.is_null() {
        let lua_box: Box<Lua> = unsafe { Box::from_raw(lua as *const Lua as *mut Lua) };
        std::mem::drop(lua_box);
    }
}

#[no_mangle]
pub extern "C" fn lua_set_global_f32(lua: *const std::ffi::c_void, key: *const c_char, value: f32) {
    let lua = unsafe { &*(lua as *const Lua) };
    let key_str = convert_to_str_ref(key);

    match lua.globals().set(key_str, value) {
        Ok(_) => {}
        Err(err) => {
            eprintln!("Error setting global: {}", err);
        }
    }
}

#[no_mangle]
pub extern "C" fn lua_set_global_str(
    lua: *const std::ffi::c_void,
    key: *const c_char,
    value: *const c_char,
) {
    let lua = unsafe { &*(lua as *const Lua) };
    let key_str = convert_to_str_ref(key);
    let value_str = convert_to_str_ref(value);

    match lua.globals().set(key_str, value_str) {
        Ok(_) => {}
        Err(err) => {
            eprintln!("Error setting global: {}", err);
        }
    }
}

#[no_mangle]
pub extern "C" fn lua_set_global_function(
    lua: *const std::ffi::c_void,
    name: *const c_char,
    callback: extern "C" fn(*const c_char),
) {
    let lua = unsafe { &*(lua as *const Lua) };
    let name_str = convert_to_str_ref(name);

    let f = lua.create_function(move |_, ()| {
        let my_string = "Hello, world!";
        let c_string = CString::new(my_string).expect("CString conversion failed");
        let c_str_ptr: *const c_char = c_string.as_ptr();

        callback(c_str_ptr);
        Ok(())
    });

    match f {
        Ok(f) => {
            lua.globals()
                .set(name_str, f)
                .expect("Failed to set global function");
        }
        Err(err) => {
            eprintln!("Error creating Lua function: {}", err);
        }
    }
}

#[no_mangle]
pub extern "C" fn lua_eval(lua: *const std::ffi::c_void, lua_code: *const c_char) {
    let lua = unsafe { &*(lua as *const Lua) };
    let lua_code_str = convert_to_str_ref(lua_code);

    match lua.load(lua_code_str).exec() {
        Ok(_) => {}
        Err(err) => {
            eprintln!("Error executing Lua code: {}", err);
        }
    }
}
