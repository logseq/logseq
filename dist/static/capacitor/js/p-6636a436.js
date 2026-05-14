/*!
 * (C) Ionic http://ionicframework.com - MIT License
 */
import{d as o,w as s}from"./p-66a5d6a8.js";import{f as t,s as r}from"./p-25b10f81.js";import{c as a}from"./p-94551927.js";import"./p-17e21141.js";const n=()=>{const n=window;n.addEventListener("statusTap",(()=>{o((()=>{const o=document.elementFromPoint(n.innerWidth/2,n.innerHeight/2);if(!o)return;const p=t(o);p&&new Promise((o=>a(p,o))).then((()=>{s((async()=>{p.style.setProperty("--overflow","hidden"),await r(p,300),p.style.removeProperty("--overflow")}))}))}))}))};export{n as startStatusTap}