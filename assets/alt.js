/* ALT I ET · small behaviours (hero video handled inline in bm-hero section; carousels/countdown/announcement in bm.js) */
(function(){
  document.documentElement.classList.add('alt-js');
  function ready(f){if(document.readyState!=='loading')f();else document.addEventListener('DOMContentLoaded',f);}
  ready(function(){
    var form=document.querySelector('[data-ac-form]');
    if(form){
      var mq=window.matchMedia('(max-width: 1023px)');
      var pills=[].slice.call(form.querySelectorAll('[data-ac-pill]'));
      function sync(){pills.forEach(function(d){if(mq.matches)d.setAttribute('open','');else d.removeAttribute('open');});}
      sync();if(mq.addEventListener)mq.addEventListener('change',sync);
      var btn=form.querySelector('[data-ac-mbtn]');
      if(btn)btn.addEventListener('click',function(){var o=form.classList.toggle('is-open');btn.setAttribute('aria-expanded',o?'true':'false');});
      document.addEventListener('click',function(e){if(mq.matches)return;pills.forEach(function(d){if(d.hasAttribute('open')&&!d.contains(e.target))d.removeAttribute('open');});});
      var t;
      form.addEventListener('change',function(e){
        if(!e.target.closest('input,select'))return;
        clearTimeout(t);t=setTimeout(function(){
          // keep preview params when testing an unpublished theme
          ['preview_theme_id','bm_now'].forEach(function(k){
            var v=new URLSearchParams(location.search).get(k);
            if(v&&!form.querySelector('input[name="'+k+'"]')){var i=document.createElement('input');i.type='hidden';i.name=k;i.value=v;form.appendChild(i);}
          });
          form.submit();
        },e.target.matches('select')?0:350);
      });
    }
    var more=document.querySelector('[data-ac-more]');
    if(more){
      var grid=document.querySelector('[data-ac-grid]');
      more.addEventListener('click',function(ev){
        ev.preventDefault();
        if(window.matchMedia('(max-width: 1023px)').matches&&!grid.classList.contains('is-all')){grid.classList.add('is-all');if(more.getAttribute('href')==='#'||!more.getAttribute('href'))more.parentNode.removeChild(more);return;}
        if(more.getAttribute('href')==='#'){more.parentNode.removeChild(more);return;}
        var url=new URL(more.getAttribute('href'),location.href);
        ['preview_theme_id','bm_now'].forEach(function(k){var v=new URLSearchParams(location.search).get(k);if(v)url.searchParams.set(k,v);});
        more.classList.add('is-loading');
        fetch(url.toString(),{credentials:'same-origin'}).then(function(r){return r.text();}).then(function(h){
          var doc=new DOMParser().parseFromString(h,'text/html');
          var g2=doc.querySelector('[data-ac-grid]');
          if(g2)[].slice.call(g2.children).forEach(function(c){grid.appendChild(document.importNode(c,true));});
          var m2=doc.querySelector('[data-ac-more]');
          if(m2){more.setAttribute('href',m2.getAttribute('href'));more.classList.remove('is-loading');}
          else{more.parentNode.removeChild(more);}
        }).catch(function(){window.location.href=more.href;});
      });
    }
  });
})();
