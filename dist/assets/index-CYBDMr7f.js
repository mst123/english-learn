(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=document.getElementById(`path-tip`);if(e){let t=`/English-learn/`.replace(/\/?$/,``),n=`2026-04`;e.innerHTML=`支持两种地址：<code>${t}/${n}/16</code> 和 <code>${t}/${n}-16</code>（都会打开同一个 html 文件）。`}async function t(){let e=document.getElementById(`list`),t=await(await fetch(`/English-learn/entries.json`)).json();if(!Array.isArray(t)||t.length===0){e.innerHTML=`<div class='item'>暂时还没有文章，请先创建形如 <code>2026-04/16.html</code> 的文件。</div>`;return}e.innerHTML=t.map(e=>`
        <article class="item">
          <div class="title">${e.title}</div>
          <div class="links">
            <!--<a href="${e.directPath}" target="_blank">${e.directPath}</a>-->
            <a href="${e.shortPath}" target="_blank">${e.shortPath}</a>
            <!--<a href="${e.filePath}" target="_blank">${e.filePath}</a>-->
          </div>
        </article>
      `).join(``)}t().catch(e=>{let t=document.getElementById(`list`);t.innerHTML=`<div class="item">加载目录失败：${e.message}</div>`});