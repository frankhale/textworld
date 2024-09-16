// // dkjson.lua - http://dkolf.de/src/dkjson-lua.fsl/home
// //
// // const lua_code = `
// // local obj, pos, err = json.decode('${JSON.stringify(baz)}', 1, nil)
// // print('hello from Lua')
// // print(obj.bar.x)
// // print(obj.bar.y)
// // print(obj.bar.label)
// // `;

// // const lib = Deno.dlopen("../c++-lib/out/build/x64-debug/hello.dll", {
// //   eval_lua: {
// //     parameters: ["buffer", "buffer", "buffer"],
// //     result: "void",
// //   }
// // });

// // const baz = {
// //   name: "Fred",
// //   bar: {
// //     x: 10,
// //     y: 20,
// //     label: "fruity loops",
// //   }
// // }

// // const lua_code = `print("hello from Lua")`;
// // const code_buffer = new TextEncoder().encode(lua_code + "\0");
// // const obj_buffer = new TextEncoder().encode(JSON.stringify(baz) + "\0");
// // const return_buffer = new Uint8Array(1024);
// // lib.symbols.eval_lua(obj_buffer, code_buffer, return_buffer);

// // const return_str = new TextDecoder().decode(return_buffer);
// // console.log(return_str);

// class Lua {
//   private lua_lib;
//   private function_ptrs: Deno.UnsafeCallback<
//     { parameters: ["buffer"]; result: "void" }
//   >[] = [];
//   private lua_instance_res: Deno.PointerValue<unknown>;
//   private lua_instance: Deno.UnsafePointerView;

//   constructor() {
//     // "../c++-lib/out/build/x64-debug/hello.dll"
//     // "../rust-lib/target/debug/rust_lib.dll"
//     this.lua_lib = Deno.dlopen("../rust-lib/target/debug/rust_lib.dll", {
//       lua_create_instance: {
//         parameters: [],
//         result: "pointer",
//       },
//       lua_free_instance: {
//         parameters: ["pointer"],
//         result: "void",
//       },
//       lua_eval: {
//         parameters: ["pointer", "buffer"],
//         result: "void",
//       },
//       lua_set_global_str: {
//         parameters: ["pointer", "buffer", "buffer"],
//         result: "void",
//       },
//       lua_set_global_f32: {
//         parameters: ["pointer", "buffer", "f32"],
//         result: "void",
//       },
//       lua_set_global_function: {
//         parameters: ["pointer", "buffer", "pointer"],
//         result: "void",
//       },
//     });

//     this.lua_instance_res = this.lua_lib.symbols.lua_create_instance();
//     this.lua_instance = new Deno.UnsafePointerView(
//       this.lua_instance_res as Deno.PointerObject<unknown>,
//     );
//   }

//   cstr(str: string) {
//     return new TextEncoder().encode(str + "\0");
//   }

//   from_cstr(ptr: Deno.PointerValue<unknown>) {
//     const ptr_view = new Deno.UnsafePointerView(
//       ptr as Deno.PointerObject<unknown>,
//     );
//     const str = ptr_view.getCString();
//     return str;
//   }

//   public set_global_str(name: string, value: string) {
//     this.lua_lib.symbols.lua_set_global_str(
//       this.lua_instance.pointer,
//       this.cstr(name),
//       this.cstr(value),
//     );
//   }

//   public set_global_f32(name: string, value: number) {
//     this.lua_lib.symbols.lua_set_global_f32(
//       this.lua_instance.pointer,
//       this.cstr(name),
//       value,
//     );
//   }

//   public set_global_function(
//     name: string,
//     fn: (msg: Deno.PointerValue<unknown>) => void,
//   ) {
//     const fn_ptr = new Deno.UnsafeCallback({
//       parameters: ["buffer"],
//       result: "void",
//     }, fn);

//     this.function_ptrs.push(fn_ptr);
//     this.lua_lib.symbols.lua_set_global_function(
//       this.lua_instance.pointer,
//       this.cstr(name),
//       fn_ptr.pointer,
//     );
//   }

//   public eval(code: string) {
//     this.lua_lib.symbols.lua_eval(this.lua_instance.pointer, this.cstr(code));
//   }

//   public close() {
//     for (const fn_ptr of this.function_ptrs) {
//       fn_ptr.close();
//     }

//     this.lua_lib.symbols.lua_free_instance(this.lua_instance.pointer);
//     this.lua_lib.close();
//   }
// }

// const lua = new Lua();
// lua.set_global_f32("life", 42);
// lua.set_global_str("foo", "bzzzzz!!!!");
// lua.set_global_function("baz", (msg: Deno.PointerValue<unknown>) => {
//   console.log(
//     `Called from Lua/Rust but this is executing in Deno: ${lua.from_cstr(msg)}`,
//   );
// });
// lua.eval("print(life)");
// lua.eval("print(foo)");
// lua.eval("baz()");
// lua.eval("print('This is Lua code #1')");
// lua.eval("print('This is Lua code #2')");
// lua.eval("print('This is Lua code #3')");
// lua.close();
