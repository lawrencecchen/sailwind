let n,e=new TextDecoder("utf-8",{ignoreBOM:!0,fatal:!0});e.decode();let t=null;function r(){return null!==t&&t.buffer===n.memory.buffer||(t=new Uint8Array(n.memory.buffer)),t}function o(n,t){return e.decode(r().subarray(n,n+t))}const i=new Array(32).fill(void 0);i.push(void 0,null,!0,!1);let a=i.length;function _(n){a===i.length&&i.push(i.length+1);const e=a;return a=i[e],i[e]=n,e}function c(n){return i[n]}let s=0,f=new TextEncoder("utf-8");const l="function"==typeof f.encodeInto?function(n,e){return f.encodeInto(n,e)}:function(n,e){const t=f.encode(n);return e.set(t),{read:n.length,written:t.length}};function u(n,e,t){if(void 0===t){const t=f.encode(n),o=e(t.length);return r().subarray(o,o+t.length).set(t),s=t.length,o}let o=n.length,i=e(o);const a=r();let _=0;for(;_<o;_++){const e=n.charCodeAt(_);if(e>127)break;a[i+_]=e}if(_!==o){0!==_&&(n=n.slice(_)),i=t(i,o,o=_+3*n.length);const e=r().subarray(i+_,i+o);_+=l(n,e).written}return s=_,i}let w=null;function b(){return null!==w&&w.buffer===n.memory.buffer||(w=new Int32Array(n.memory.buffer)),w}function d(n){const e=c(n);return function(n){n<36||(i[n]=a,a=n)}(n),e}function g(e,t){try{const c=n.__wbindgen_add_to_stack_pointer(-16);var r=u(e,n.__wbindgen_malloc,n.__wbindgen_realloc),o=s;n.minifySync(c,r,o,_(t));var i=b()[c/4+0],a=b()[c/4+1];if(b()[c/4+2])throw d(a);return d(i)}finally{n.__wbindgen_add_to_stack_pointer(16)}}function y(e,t){try{const c=n.__wbindgen_add_to_stack_pointer(-16);var r=u(e,n.__wbindgen_malloc,n.__wbindgen_realloc),o=s;n.parseSync(c,r,o,_(t));var i=b()[c/4+0],a=b()[c/4+1];if(b()[c/4+2])throw d(a);return d(i)}finally{n.__wbindgen_add_to_stack_pointer(16)}}function m(e,t){try{const i=n.__wbindgen_add_to_stack_pointer(-16);n.printSync(i,_(e),_(t));var r=b()[i/4+0],o=b()[i/4+1];if(b()[i/4+2])throw d(o);return d(r)}finally{n.__wbindgen_add_to_stack_pointer(16)}}function p(e,t,r){try{const f=n.__wbindgen_add_to_stack_pointer(-16);var o=u(e,n.__wbindgen_malloc,n.__wbindgen_realloc),i=s;n.transformSync(f,o,i,_(t),_(r));var a=b()[f/4+0],c=b()[f/4+1];if(b()[f/4+2])throw d(c);return d(a)}finally{n.__wbindgen_add_to_stack_pointer(16)}}async function h(e){void 0===e&&(e=new URL("/assets/wasm_bg.0d0169f2.wasm",self.location));const t={wbg:{}};t.wbg.__wbindgen_json_parse=function(n,e){return _(JSON.parse(o(n,e)))},t.wbg.__wbindgen_json_serialize=function(e,t){const r=c(t);var o=u(JSON.stringify(void 0===r?null:r),n.__wbindgen_malloc,n.__wbindgen_realloc),i=s;b()[e/4+1]=i,b()[e/4+0]=o},t.wbg.__wbindgen_object_drop_ref=function(n){d(n)},t.wbg.__wbindgen_string_new=function(n,e){return _(o(n,e))},t.wbg.__wbg_new0_57a6a2c2aaed3fc5=function(){return _(new Date)},t.wbg.__wbg_getTime_f8ce0ff902444efb=function(n){return c(n).getTime()},t.wbg.__wbg_getTimezoneOffset_41211a984662508b=function(n){return c(n).getTimezoneOffset()},t.wbg.__wbg_new_693216e109162396=function(){return _(new Error)},t.wbg.__wbg_stack_0ddaca5d1abfb52f=function(e,t){var r=u(c(t).stack,n.__wbindgen_malloc,n.__wbindgen_realloc),o=s;b()[e/4+1]=o,b()[e/4+0]=r},t.wbg.__wbg_error_09919627ac0992f5=function(e,t){try{console.error(o(e,t))}finally{n.__wbindgen_free(e,t)}},t.wbg.__wbindgen_throw=function(n,e){throw new Error(o(n,e))},("string"==typeof e||"function"==typeof Request&&e instanceof Request||"function"==typeof URL&&e instanceof URL)&&(e=fetch(e));const{instance:r,module:i}=await async function(n,e){if("function"==typeof Response&&n instanceof Response){if("function"==typeof WebAssembly.instantiateStreaming)try{return await WebAssembly.instantiateStreaming(n,e)}catch(t){if("application/wasm"==n.headers.get("Content-Type"))throw t;console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n",t)}const r=await n.arrayBuffer();return await WebAssembly.instantiate(r,e)}{const t=await WebAssembly.instantiate(n,e);return t instanceof WebAssembly.Instance?{instance:t,module:n}:t}}(await e,t);return n=r.exports,h.__wbindgen_wasm_module=i,n}export{h as default,g as minifySync,y as parseSync,m as printSync,p as transformSync};
