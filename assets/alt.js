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

/* ---- PDP: gallery, variants, add to cart ---- */
(function(){
  function addToCart(id,qty,btn,errEl){
    var cart=document.querySelector('cart-notification')||document.querySelector('cart-drawer');
    var body={id:Number(id),quantity:qty};
    if(cart&&cart.getSectionsToRender){body.sections=cart.getSectionsToRender().map(function(s){return s.id;}).join(',');body.sections_url=window.location.pathname;}
    if(btn)btn.classList.add('is-load');
    if(errEl){errEl.hidden=true;}
    return fetch((window.routes&&window.routes.cart_add_url)||'/cart/add.js',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json','X-Requested-With':'XMLHttpRequest'},body:JSON.stringify(body)})
      .then(function(r){return r.json();})
      .then(function(res){
        if(res.status){throw new Error(res.description||res.message||'cart');}
        if(!cart){window.location=(window.routes&&window.routes.cart_url)||'/cart';return;}
        try{if(typeof publish==='function'&&typeof PUB_SUB_EVENTS!=='undefined')publish(PUB_SUB_EVENTS.cartUpdate,{source:'alt-pdp',productVariantId:id});}catch(e){}
        if(cart.setActiveElement)cart.setActiveElement(document.activeElement);
        if(cart.renderContents)cart.renderContents(res,qty);
        else{document.dispatchEvent(new CustomEvent('cart:refresh'));}
      })
      .catch(function(e){
        var msg=(e&&e.message&&e.message!=='cart')?e.message:((window.cartStrings&&window.cartStrings.error)||'Kurven kunne ikke opdateres.');
        if(errEl){errEl.textContent=msg;errEl.hidden=false;}else{window.alert(msg);}
      })
      .then(function(){if(btn)btn.classList.remove('is-load');});
  }
  window.altAddToCart=addToCart;
  document.querySelectorAll('[data-ap]').forEach(function(root){
    var jEl=root.querySelector('[data-ap-json]');var vars=[];try{vars=JSON.parse(jEl.textContent);}catch(e){}
    var q=function(s){return root.querySelector(s);};
    var cur=vars[0]&&vars[0].id;var qty=1;
    var slides=[].slice.call(root.querySelectorAll('[data-ap-slide]'));var ths=[].slice.call(root.querySelectorAll('[data-ap-th]'));
    function show(i){slides.forEach(function(s,k){s.classList.toggle('is-on',k===i);var v=s.querySelector('video');if(v&&k!==i)v.pause();});ths.forEach(function(t,k){t.classList.toggle('is-on',k===i);});}
    ths.forEach(function(t){t.addEventListener('click',function(){show(Number(t.getAttribute('data-ap-th')));});});
    function sel(){return [].slice.call(root.querySelectorAll('[data-ap-opt]')).map(function(o){var c=o.querySelector('input:checked');return c?c.value:null;});}
    function apply(v){
      cur=v.id;
      var set=function(s,t){var e=q(s);if(e)e.textContent=t;};
      set('[data-ap-price]',v.price);set('[data-ap-price2]',v.price);
      var was=q('[data-ap-was]'),sv=q('[data-ap-save]');
      if(was){was.hidden=!v.was;was.textContent=v.was;}if(sv){sv.hidden=!v.save;sv.textContent=v.save?('Spar '+v.save):'';}
      set('[data-ap-stocktxt]',v.available?'På lager':'Udsolgt');
      var d=q('.ap-dot');if(d)d.classList.toggle('is-off',!v.available);
      var sp=q('[data-ap-sep]'),dl=q('[data-ap-del]');if(sp)sp.hidden=!v.available;if(dl)dl.hidden=!v.available;
      ['[data-ap-add]','[data-ap-add2]'].forEach(function(s){var b=q(s);if(b)b.disabled=!v.available;});
      set('[data-ap-addt]',v.available?'Tilføj til kurven':'Udsolgt');set('[data-ap-addt2]',v.available?'Tilføj til kurven':'Udsolgt');
      if(v.mid){var idx=slides.findIndex(function(s){return Number(s.getAttribute('data-ap-mid'))===v.mid;});if(idx>-1)show(idx);}
      try{var u=new URL(location.href);u.searchParams.set('variant',v.id);history.replaceState(null,'',u.toString());}catch(e){}
    }
    root.querySelectorAll('[data-ap-opt] input').forEach(function(inp){inp.addEventListener('change',function(){
      var o=inp.closest('[data-ap-opt]');var lab=o.querySelector('[data-ap-optv]');if(lab)lab.textContent=inp.value;
      var s=sel();var v=vars.filter(function(x){return x.options.every(function(val,i){return val===s[i];});})[0];if(v)apply(v);
    });});
    var qv=q('[data-ap-qv]');
    root.querySelectorAll('[data-ap-q]').forEach(function(b){b.addEventListener('click',function(){qty=Math.max(1,qty+Number(b.getAttribute('data-ap-q')));if(qv)qv.textContent=qty;});});
    var dw=q('[data-ap-descw]'),mb=q('[data-ap-more]');
    if(dw&&mb&&dw.scrollHeight>200){dw.classList.add('is-clamp');mb.hidden=false;mb.addEventListener('click',function(){var o=dw.classList.toggle('is-clamp');mb.textContent=o?'Læs mere':'Vis mindre';});}
    var err=q('[data-ap-err]');
    ['[data-ap-add]','[data-ap-add2]'].forEach(function(s){var b=q(s);if(b)b.addEventListener('click',function(){addToCart(cur,qty,b,err);});});
  });
  document.querySelectorAll('[data-ap-quick]').forEach(function(b){b.addEventListener('click',function(){addToCart(b.getAttribute('data-ap-quick'),1,b,null);});});
})();
