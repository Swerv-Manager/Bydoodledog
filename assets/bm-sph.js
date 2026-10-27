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
