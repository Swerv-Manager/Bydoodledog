(function($) {
  var $ = jQuery = $;

  function scrollTrigger(selector, options = {}) {
    let els = document.querySelectorAll(selector);
    els = Array.from(els);
    els.forEach(el => {
      addObserver(el, options);
    });
  }

  function addObserver(el, options) {
    if (!('IntersectionObserver' in window)) {
      entry.target.classList.add('scroll-animate-init');
      return;
    }

    let observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('scroll-animate-init');
          observer.unobserve(entry.target);
        }
      });
    }, options);

    observer.observe(el);
  }

  function handleBuyTools() {
    const productPageSection = document.querySelector('.product-page-section');
    if (!productPageSection) return;

    const isWrapped = productPageSection.closest('.product-section-main-wrap');
    const productInformation = productPageSection.querySelector('product-information');
    const productInfoWraper = productPageSection.querySelector('.product__info-wrapper');
    const nextElement = productPageSection ? productPageSection.nextElementSibling : null;
    const productContentIsNextSibling = nextElement ? nextElement.classList.contains('product-content-section') : false;

    if (productInfoWraper && productContentIsNextSibling) {
      if (!isWrapped) $('.product-section').wrapAll('<div class="product-section-main-wrap" />');
      productPageSection.classList.remove('product-static-buy-tools');
      if (productInformation) {
        productInformation.buyToolsCalculations();
        window.addEventListener('scroll', productInformation.onScrollToolsHandler, false);
      }
    } else if (productInfoWraper && !productContentIsNextSibling) {
      $('.product-section').unwrap();
      productPageSection.classList.add('product-static-buy-tools');

      const productInfoWraper = productPageSection.querySelector('.product__info-container');
      productInfoWraper.classList.remove('product__info-container--modal--out');
      productInfoWraper.classList.remove('product__info-container--modal', 'background-modal');
      window.removeEventListener('scroll', productInformation.onScrollToolsHandler, false);
      productInformation.staticBuyTools = true;
    }
  }

  document.addEventListener('shopify:section:unload', (event) => {
    const sectionUnloadIsProductContent = event.target.classList.contains('product-content-section');
    if (sectionUnloadIsProductContent) {
      const productPageSection = document.querySelector('.product-page-section');
      if (productPageSection) {
        productPageSection.classList.add('product-static-buy-tools');
        const productInfoWraper = productPageSection.querySelector('.product__info-container');
        productInfoWraper.classList.remove('product__info-container--modal--out');
        productInfoWraper.classList.remove('product__info-container--modal', 'background-modal');
        const productInformation = productPageSection.querySelector('product-information');
        productInformation.staticBuyTools = true;
        window.removeEventListener('scroll', productInformation.onScrollToolsHandler, false);
      }
      $('.product-section').unwrap();
    }
  });

  document.addEventListener('shopify:section:load', (event) => {
    let sectionHasAnimateElms = event.target.querySelectorAll('.scroll-animate');

    if (sectionHasAnimateElms) {
      sectionHasAnimateElms = Array.from(sectionHasAnimateElms);
      sectionHasAnimateElms.forEach(el => {
        addObserver(el, {
          rootMargin: '-200px',
        });
      });
    }

    const heroElmNeedAnimate = event.target.querySelector('section-animate');

    if (heroElmNeedAnimate) {
      heroElmNeedAnimate.dataset.animate = true;
    }

    const sectionUnloadIsProductContent = event.target.classList.contains('product-content-section') || event.target.classList.contains('product-page-section');
    if (sectionUnloadIsProductContent) {
      const productContent = event.target.querySelector('product-content') || document.querySelector('product-content');
      if (productContent) handleBuyTools();
    }

    let productPageSection = event.target.classList.contains('product-page-section');

    if (productPageSection) {
      const mediaGallery = event.target.querySelector('media-gallery');

      if (mediaGallery) {
        const productVariants = document.getElementById(`VariantSelect-${mediaGallery.dataset.section}`);
        let options;
        let currentVariant;
        let mediaId = null;

        if (productVariants) {
          options = productVariants.productData ? productVariants.productData.options : null;
          currentVariant = productVariants.currentVariant;
          if (currentVariant.featured_media) {
            mediaId = `${mediaGallery.dataset.section}-${currentVariant.featured_media.id}`;
          }
        }

        mediaGallery.initBreakpoints();
        mediaGallery.initGallerySlider();
        mediaGallery.initThumbnails();
        mediaGallery.setActiveMedia(mediaId, options, currentVariant);
      }
    }
  });

  document.addEventListener('shopify:section:reorder', (event) => {
    const sectionUnloadIsProductContent = event.target.classList.contains('product-content-section') || event.target.classList.contains('product-page-section');

  if (sectionUnloadIsProductContent) {
    const productContent = event.target.querySelector('product-content') || document.querySelector('product-content');
    if (productContent) handleBuyTools();
  } else {
    const $productSections = $('.product-section');

    if ($productSections.length > 0) {
      $productSections.unwrap();
      handleBuyTools();
    }
  }
  });
})(theme.jQuery);
