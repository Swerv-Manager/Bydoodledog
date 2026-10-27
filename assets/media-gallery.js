if (!customElements.get('media-gallery') || !customElements.get('media-gallery-lite')) {
  (function($) {
    var $ = jQuery = $;
    class MediaGallery extends HTMLElement {
      constructor() {
        super();
        this.productGallery = this.querySelector(`.product-single__gallery-${this.dataset.section}`);
        this.thumbnailsWrapper = this.querySelector('.thumbnails-wrapper');
        this.productThumbnails = this.thumbnailsWrapper ? this.thumbnailsWrapper.querySelector('.product-single__thumbnails') : {};
        const productVariants = document.getElementById(`VariantSelect-${this.dataset.section}`);
        let options;
        let currentVariant;
        let mediaId = null;

        if (productVariants) {
          options = productVariants.productData ? productVariants.productData.options : null;
          currentVariant = productVariants.currentVariant;
          if (currentVariant && currentVariant.featured_media) {
            mediaId = `${this.dataset.section}-${currentVariant.featured_media.id}`;
          }
        }

        this.initBreakpoints();
        this.initGallerySlider();
        this.initThumbnails();
        this.setActiveMedia(mediaId, options, currentVariant);
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

      autoFitIsSupported() {
        const { userAgent } = window.navigator;

        if (userAgent.includes('Firefox/')) {
          // const version = parseInt(userAgent.split('Firefox/')[1]);

          // if (version <= 76) {
          return false;
          // }
        }

        return true;
      }

      initGallerySlider() {
        const self = this;
        const $productGallery = $(`.product-single__gallery-${this.dataset.section}`);
        const galleryInitialized = $productGallery.hasClass('slick-initialized');
        const optionsGallery = {
          arrows: true
        };
        if(galleryInitialized) return;

        $productGallery.on('init', function(event, slick){
          if (self.blockSlide3DModel === true) {
            const is3DModelActive = $productGallery.find('.slick-current .product-media-modal__model');
            if (is3DModelActive.length) {
              slick.slickSetOption('swipe', false);
            }
          }
        });

        $productGallery.slick(optionsGallery);

        $productGallery.on('beforeChange', function(event, slick, currentSlide, nextSlide) {
          self.setActiveThumbnail(null, nextSlide);
        });

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

        // Accessibility concerns not yet fixed in Slick Slider
        $('.product-single__wrapper')
        .find('.slick-list')
        .removeAttr('aria-live');
        $('.product-single__wrapper')
        .find('.slick-disabled')
        .removeAttr('aria-disabled');
      }

      initThumbnails() {
        const thumbImages = this.querySelectorAll(`.product-single__thumbnail--${this.dataset.section}`);
        if (!thumbImages.length) return;

        thumbImages.forEach((thumbImage) => {
          const self = this;

          thumbImage.addEventListener('click', function (e) {
            e.preventDefault();
            const mediaId = this.dataset.thumbnailId;
            self.setActiveThumbnail(mediaId);
          });
        });
      }

      setActiveThumbnail(mediaId = null, nextSlide = null) {
        let $activeThumbnail;
        let slideIndex = 0;
        const $thumbnailWrappers = $('.product-single__thumbnails-item');
        const $thumbnailActiveWrappers = $('.product-single__thumbnails-item:not(.product-single__thumbnails--hide)');
        const $slickGallery = $(`.product-single__gallery-${this.dataset.section}`);
        const $thumbImages = $(`.product-single__thumbnail--${this.dataset.section}`);

        // If there is no element passed, find it by the current product image
        if (!mediaId) {
          let activeSlide = $slickGallery.slick('slickCurrentSlide');

          if (nextSlide != null) {
            activeSlide = nextSlide;
          }

          $activeThumbnail = $($thumbnailActiveWrappers[activeSlide]).find('.product-single__thumbnail');
          mediaId = $activeThumbnail.data('thumbnail-id');
        } else {
          $activeThumbnail = $thumbnailWrappers.find(
            `.product-single__thumbnail--${this.dataset.section}[data-thumbnail-id='${mediaId}']`
          );
        }

        $thumbImages
          .removeClass('active-thumb')
          .removeAttr('aria-current');

        $activeThumbnail.addClass('active-thumb');
        $activeThumbnail.attr('aria-current', true);

        $thumbnailActiveWrappers.each(function (index, element) {
          const thumbnailId = $(element).find('.product-single__thumbnail').data('thumbnail-id');
          if (thumbnailId === mediaId) {
            slideIndex = index;
          }
        });

        $slickGallery.slick('slickGoTo', slideIndex, true);
      }

      camelize(str) {
        return str.replace(/\W+(.)/g, function(match, chr) {
          return chr.toUpperCase();
        });
      }

      setActiveMedia(mediaId, productOptions, currentVariant) {
        const enableAllImages = this.dataset.enableAllImages;
        const $slickGallery = $(`.product-single__gallery-${this.dataset.section}`);
        const $thumbnailWrappers = $('.product-single__thumbnails-item');
        const self = this;
        let slideIndex = 0;
        let colorValue;
        let setThumbnail = false;

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

        if (colorValue && enableAllImages === "false") {
          const colorValueCamelize = this.camelize(colorValue.toLowerCase());

          $thumbnailWrappers.each((index, elem) => {
            const $wrapper = $(elem);
            const alt = $wrapper.find('img').data('alt');
            const altColor = alt.match(/\(([^)]+)\)/) ? alt.match(/\(([^)]+)\)/)[1] : '';
            const altColorCamelize = this.camelize(altColor.toLowerCase());

            while ( $thumbnailWrappers.length === 1 ) {
              $wrapper = $wrapper.parent();
            }

            if (altColor === '') {
              $wrapper.removeClass('product-single__thumbnails--hide');
              return;
            }

            if ( altColorCamelize === colorValueCamelize ) {
              $wrapper.removeClass('product-single__thumbnails--hide');
            } else {
              $wrapper.addClass('product-single__thumbnails--hide');
            }
          });

          $slickGallery.slick('slickUnfilter');
          $slickGallery.slick('slickFilter', function () {
            const altImage = $(this).attr('data-alt');
            const altImageColor = altImage.match(/\(([^)]+)\)/) ? altImage.match(/\(([^)]+)\)/)[1] : '';
            const altImageColorCamelize = self.camelize(altImageColor.toLowerCase());

            if (altImageColor === '') {
              return true;
            }

            return altImageColorCamelize === colorValueCamelize;
          });

          const $hideThumbnails = $('.product-single__thumbnails--hide');

          if ($hideThumbnails.length === 0 && mediaId) {
            const activeMedia = this.productGallery.querySelector(`[data-media-id="${ mediaId }"]`);
            slideIndex = parseInt(activeMedia.dataset.slickIndex);
          } else if (mediaId) {
            setThumbnail = true;
            self.setActiveThumbnail(mediaId);
          }

        } else {
          $thumbnailWrappers.each(function(index, elem) {
            const $wrapper = $(elem);
            while ( $thumbnailWrappers.length === 1 ) {
              $wrapper = $wrapper.parent();
            }
            $wrapper.removeClass('product-single__thumbnails--hide');
          });

          if (mediaId) {
            const activeMedia = this.productGallery.querySelector(`[data-media-id="${ mediaId }"]`);
            slideIndex = parseInt(activeMedia.dataset.slickIndex);
          }
        }

        if (!setThumbnail) {
          $slickGallery.slick('slickGoTo', slideIndex, true);
        }

        const activeMedia = this.productGallery.querySelector(`[data-slick-index="${ $slickGallery.slick('slickCurrentSlide') }"]`);
        this.playActiveMedia(activeMedia);
      }

      playActiveMedia(activeItem) {
        window.pauseAllMedia(this);
        if (activeItem) {
          const video = activeItem.querySelector('video');

          if (video && video.getAttribute('autoplay')) {
            video.play();
          }

          const deferredMedia = activeItem.querySelector('.deferred-media:not(product-model)');
          if (deferredMedia && deferredMedia.dataset.preventAutoplay) return;
          if (deferredMedia && deferredMedia.loadContent) deferredMedia.loadContent(false);
        }
      }
    }

    customElements.define('media-gallery', MediaGallery);

    class MediaGalleryLite extends MediaGallery {
      constructor() {
        super();
      }

      initGallerySlider() {
        const self = this;
        const sectionId = this.dataset.section;
        const $productGallery = $(`.product-single__gallery-${sectionId}`);
        const $galleryNav = $(`.product-single__thumbnails-${sectionId}`);
        const optionsGallery = {
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: false,
          fade: true,
          asNavFor: `.product-single__thumbnails-${sectionId}`
        };
        const optionsNav = {
          slidesToShow: 3,
          slidesToScroll: 1,
          asNavFor: `.product-single__gallery-${sectionId}`,
          centerMode: true,
          centerPadding: '0px',
          focusOnSelect: true,
          vertical: true,
          arrows: true,
          responsive: [
            {
              breakpoint: 1024,
              settings: {
                slidesToShow: 3,
                slidesToScroll: 1,
                arrows: true,
                vertical: false
              }
            }
          ]
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
        $galleryNav.slick(optionsNav);

        $productGallery.on('beforeChange', function(event, slick, currentSlide, nextSlide){
          self.setActiveThumbnail(null, nextSlide);
        });

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

        // Accessibility concerns not yet fixed in Slick Slider
        $('.product-single__wrapper')
        .find('.slick-list')
        .removeAttr('aria-live');
        $('.product-single__wrapper')
        .find('.slick-disabled')
        .removeAttr('aria-disabled');
      }
    }

    customElements.define('media-gallery-lite', MediaGalleryLite);
  })(theme.jQuery);
}
