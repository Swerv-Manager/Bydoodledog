(function(){
  function init(){
    document.querySelectorAll('.sph-faqrow').forEach(function(row){
      if(row.__sph)return;row.__sph=1;
      row.setAttribute('role','button');row.setAttribute('tabindex','0');
      var ans=row.children[1];
      row.setAttribute('aria-expanded',ans&&!ans.hasAttribute('hidden')?'true':'false');
      function sync(){
        var open=ans&&!ans.hasAttribute('hidden');
        row.setAttribute('aria-expanded',open?'true':'false');
        var ic=row.children[0]&&row.children[0].lastElementChild;
        if(ic){var t=ic.querySelector('.sc-interp')||ic;t.textContent=open?'\u2212':'+';}
      }
      function toggle(e){
        if(e.target.closest&&e.target.closest('a'))return;
        if(!ans)return;
        if(ans.hasAttribute('hidden'))ans.removeAttribute('hidden');else ans.setAttribute('hidden','hidden');
        sync();
      }
      row.addEventListener('click',toggle);
      row.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle(e);}});
      sync();
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

(function(){
  function initCol(){
    document.querySelectorAll('.sph-ff').forEach(function(f){
      if(f.__sph)return;f.__sph=1;
      f.addEventListener('change',function(e){
        var t=e.target;
        if(t.matches&&(t.matches('[data-sph-sort]')||(t.type==='checkbox'&&window.matchMedia('(min-width:1024px)').matches))){f.submit();}
      });
      f.addEventListener('submit',function(){
        f.querySelectorAll('[data-sph-money]').forEach(function(i){
          if(i.value!==''){var h=document.createElement('input');h.type='hidden';h.name=i.name;h.value=String(Math.round(parseFloat(i.value)||0));i.name='';f.appendChild(h);}
        });
      });
    });
    document.querySelectorAll('details.sph-fd').forEach(function(d){
      d.addEventListener('toggle',function(){if(d.open)document.querySelectorAll('details.sph-fd').forEach(function(o){if(o!==d)o.open=false;});});
    });
    document.addEventListener('click',function(e){
      document.querySelectorAll('details.sph-fd[open],details.sph-fmob[open]').forEach(function(d){if(!d.contains(e.target))d.open=false;});
    });
    document.querySelectorAll('[data-sph-more]').forEach(function(a){
      if(a.__sph)return;a.__sph=1;
      a.addEventListener('click',function(e){
        e.preventDefault();
        var grid=a.closest('[data-sph-grid]'),last=a.closest('[data-sph-last]');
        if(!grid||!last)return;
        a.style.opacity='.5';
        fetch(a.href,{credentials:'same-origin'}).then(function(r){return r.text();}).then(function(h){
          var doc=new DOMParser().parseFromString(h,'text/html');
          var vis=window.matchMedia('(min-width:1024px)').matches?'.sph-d':'.sph-m';
          var g2=doc.querySelector('.sph-col '+vis+' [data-sph-grid]');
          if(!g2){window.location=a.href;return;}
          Array.prototype.slice.call(g2.children).forEach(function(c){
            if(c.hasAttribute('data-sph-last')){last.innerHTML=c.innerHTML;}
            else if(c.hasAttribute('data-sph-card')){grid.insertBefore(document.importNode(c,true),last);}
          });
          initCol();
        }).catch(function(){window.location=a.href;});
      });
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initCol);else initCol();
})();
