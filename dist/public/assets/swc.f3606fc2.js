import{b as e,o as t,g as r,l as n,r as s,m as o,t as a}from"./entry-client.92739575.js";import{D as i}from"./Codemirror.c4193918.js";const l={},c=a('<div><textarea rows="20" cols="40"></textarea><button>compile</button></div>'),d=()=>{const[o,a]=e(!1),[d,u]=e(i);let m;return t((async()=>{var e,t;m=await(e=()=>import("./wasm.e9edd641.js"),t=[],t&&0!==t.length?Promise.all(t.map((e=>{if((e=`/${e}`)in l)return;l[e]=!0;const t=e.endsWith(".css"),r=t?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${e}"]${r}`))return;const n=document.createElement("link");return n.rel=t?"stylesheet":"modulepreload",t||(n.as="script",n.crossOrigin=""),n.href=e,document.head.appendChild(n),t?new Promise(((t,r)=>{n.addEventListener("load",t),n.addEventListener("error",(()=>r(new Error(`Unable to preload CSS for ${e}`))))})):void 0}))).then((()=>e())):e());const r=m.default;await r(),a(!0),console.log("Initialized swc!")})),(()=>{const e=r(c),t=e.firstChild,a=t.nextSibling;return t.$$input=e=>u(e.currentTarget.value),a.$$click=()=>function(e){if(!o())return;const t=m.transformSync(e,{jsc:{parser:{syntax:"typescript",tsx:!0}}});console.log(t)}(d()),n((()=>t.value=d())),s(),e})()};o(["input","click"]);export{d as default};
