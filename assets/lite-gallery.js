if (!customElements.get('lite-gallery')) {
  (function($) {
    var $ = jQuery = $;
    class LiteGallery extends HTMLElement {
      constructor() {
        super();

        this.sectionId = this.dataset.section;
        if (this.dataset.block) {
          this.sectionId = `${this.dataset.section}${this.dataset.block}`;
        }

        let galleryOptions = JSON.parse(this.querySelector('[type="application/json"]').textContent);
        this.productGallery = this.querySelector(`.product-single__gallery-${this.sectionId}`);
        const productVariants = document.getElementById(`VariantSelect-${this.sectionId}`);
        let options;
        let currentVariant;
        let mediaId = null;

        if (productVariants) {
          options = productVariants.productData ? productVariants.productData.options : null;

          currentVariant = productVariants.currentVariant;
          if (currentVariant && currentVariant.featured_media) {
            mediaId = `${this.sectionId}-${currentVariant.featured_media.id}`;
          }
        }

        const optionsSlider = {
          optionsGallery: {
            slidesToShow: 1,
            slidesToScroll: 1,
            arrows: false,
            fade: true
          },
          galleryNav: false,
          optionsNav: {
            slidesToShow: 3,
            slidesToScroll: 1,
            centerMode: true,
            centerPadding: '0px',
            focusOnSelect: true,
            arrows: false,
            draggable: false,
            swipe: false,
            vertical: false
          }
        }

        if (!galleryOptions) {
          galleryOptions = optionsSlider;
        }

        this.initBreakpoints();
        if (this.productGallery) {
          this.initGallerySlider(galleryOptions);
          this.setActiveMedia(mediaId, options, currentVariant);
        }
      }

      initBreakpoints() {
        enquire.register('screen and (min-width: 1280px)', {
          match: () => {
            this.bpSmall = false;
          },
          unmatch: () => {
            this.bpSmall = true;
          }
        });

        enquire.register("screen and (min-width: 1001px)", {
          match : () => {
            this.blockSlide3DModel = true;
          }
        });
      }

      camelize(str) {
        return str.replace(/\W+(.)/g, function(match, chr) {
          return chr.toUpperCase();
        });
      }

      setActiveMedia(mediaId, productOptions, currentVariant) {
        const $slickGallery = $(`.product-single__gallery-${this.sectionId}`);
        let slideIndex = 0;
        let colorValue;

        if (productOptions && currentVariant) {
          const productSwatchesArray = this.dataset.productSwatches.split(',');

          productOptions.forEach((option, i) => {
            const optionName = option.toLowerCase().trim();
            const productSwatch = productSwatchesArray.find((value) => value.trim() === optionName );

            if (productSwatch) {
              colorValue = currentVariant.options[i];
            }
          });
        }

        if (mediaId) {
          const activeMedia = this.productGallery.querySelector(`[data-media-id="${ mediaId }"]`);
          slideIndex = activeMedia.dataset.slickIndex;
        }

        $slickGallery.slick('slickGoTo', slideIndex, true);

        const activeMedia = this.productGallery.querySelector(`[data-slick-index="${ $slickGallery.slick('slickCurrentSlide') }"]`);
        this.playActiveMedia(activeMedia);
      }

      playActiveMedia(activeItem) {
        window.pauseAllMedia(this);
        if (activeItem) {
          const video = activeItem.querySelector('video');

          if (video) {
            video.play();
          }

          const deferredMedia = activeItem.querySelector('.deferred-media:not(product-model)');
          if (deferredMedia && deferredMedia.dataset.preventAutoplay) return;
          if (deferredMedia && deferredMedia.loadContent) deferredMedia.loadContent(false);
        }
      }

      initGallerySlider(options) {
        const self = this;
        const $productGallery = $(`.product-single__gallery-${this.sectionId}`);
        const optionsGallery = options.optionsGallery;
        let $galleryNav;
        let optionsNav;

        if (options.galleryNav) {
          optionsNav = options.optionsNav;
          $galleryNav = $(`.product-single__thumbnails-${this.sectionId}`);
          if ($galleryNav.length > 0) {
            optionsGallery.asNavFor = `.product-single__thumbnails-${this.sectionId}`;
            optionsNav.asNavFor = `.product-single__gallery-${this.sectionId}`;
          }
        }

        $productGallery.on('init', function(event, slick){
          if (self.blockSlide3DModel === true) {
            const is3DModelActive = $productGallery.find('.slick-current .product-media-modal__model');
            if (is3DModelActive.length) {
              slick.slickSetOption('swipe', false);
            }
          }
        });

        $productGallery.slick(optionsGallery);

        if ($galleryNav.length > 0) {
          $galleryNav.slick(optionsNav);
          const $thumnailsItem = $galleryNav.find('.product-single__thumbnails-item');

          if ($thumnailsItem.length < 4) {
            $galleryNav.addClass('nav-set-translation');
          }

          $thumnailsItem.each(function(index, elem) {
            elem.classList.remove('product-single__thumbnails--hide');
          });
        }

        $productGallery.on('afterChange', function(event, slick, currentSlide){
          const activeMedia = $productGallery.find('.slick-current');
          if (activeMedia.length) {
            self.playActiveMedia(activeMedia[0]);
          }

          if (self.blockSlide3DModel === true) {
            const is3DModel = $productGallery.find('.slick-current .product-media-modal__model');

            if (is3DModel.length) {
              slick.slickSetOption('swipe', false);
            } else if (slick.slickGetOption('swipe') ===  false) {
              slick.slickSetOption('swipe', true);
            }
          }
        });

        window.addEventListener('keydown', (event) => {
          if (event.code === 'ArrowLeft') {
            $productGallery.slick('slickPrev');
          } else if (event.code === 'ArrowRight') {
            $productGallery.slick('slickNext');
          }
        });

        const resizeObserver = new ResizeObserver((entries) => {
          if ($galleryNav.length > 0) {
            $galleryNav.slick('setPosition');
          }
        });

        resizeObserver.observe(this);

        // Accessibility concerns not yet fixed in Slick Slider
        $(`.product-single__wrapper-${this.sectionId}`)
          .find('.slick-list')
          .removeAttr('aria-live');
        $(`.product-single__wrapper-${this.sectionId}`)
          .find('.slick-disabled')
          .removeAttr('aria-disabled');
      }
    }

    customElements.define('lite-gallery', LiteGallery);
  })(theme.jQuery);
}
