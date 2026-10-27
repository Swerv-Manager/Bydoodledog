if (!customElements.get('product-information')) {
  customElements.define('product-information', class ProductInformation extends HTMLElement {
    constructor() {
      super();
      this.staticBuyTools = true;
      this.buyToolsTrigger = this.querySelector('#product__buy-tools-trigger');
      this.productInfoContainer = this.querySelector('.product__info-container');
      this.onScrollToolsHandler = this.onScrollBuyTools.bind(this);

      this.initBreakpoints();
    }

    initBreakpoints() {
      const self = this;

      enquire.register('screen and (max-width: 1000px)', {
        match: () => {
          self.bpSmall = true;
          this.productInfoContainer.classList.remove('product__info-container--modal--out');
          this.productInfoContainer.classList.remove('product__info-container--modal', 'background-modal');
        },
        unmatch: () => {
          self.bpSmall = false;
          this.productInfoContainer.classList.remove('product__info-container--modal--out');
          this.productInfoContainer.classList.remove('product__info-container--modal', 'background-modal');
        }
      });
    }

    buyToolsCalculations() {
      this.staticBuyTools = false;
      this.productPageSection = this.parentElement;
      this.productInfoWrapper = this.productPageSection.querySelector('.product__info-wrapper');
      this.productInfoContainerHeight = this.productInfoContainer.offsetHeight;
      this.negativeHeight = this.productInfoContainerHeight * -1;
      this.productContentSection = document.querySelector('.product-content-section');

      const productContentMinHeight = this.productInfoContainerHeight - this.productPageSection.offsetHeight + 54;
      this.productContentSection.style.minHeight = `${productContentMinHeight}px`;

      this.resizeProductInfoObserver = new ResizeObserver((entries) => {
        if (this.bpSmall) return;
        if (!this.productInfoContainer.classList.contains('product__info-container--modal')) {
          const productInfoContainerHeight = this.productInfoContainer.offsetHeight;
          if (productInfoContainerHeight != this.productInfoContainerHeight) {
            this.productInfoContainerHeight = productInfoContainerHeight;
            const productContentMinHeight = productInfoContainerHeight - this.productPageSection.offsetHeight + 54;
            this.productContentSection.style.minHeight = `${productContentMinHeight}px`;

            this.negativeHeight = productInfoContainerHeight * -1;
          }
        }
      });

      this.resizeProductInfoObserver.observe(this.productInfoContainer);
    }

    onScrollBuyTools() {
      if (this.bpSmall || !this.buyToolsTrigger ) return;

      const triggerTop = this.buyToolsTrigger.getBoundingClientRect().top;
      const buyToolsModalActive = this.productInfoContainer.classList.contains('product__info-container--modal', 'background-modal');
      const bytToolsModalOut = this.productInfoContainer.classList.contains('product__info-container--modal--out');

      if (triggerTop < this.negativeHeight && !buyToolsModalActive) {
        requestAnimationFrame(() => {
          this.productInfoContainer.classList.add('product__info-container--modal', 'background-modal');
        });
      } else if (triggerTop > this.negativeHeight && buyToolsModalActive && !bytToolsModalOut) {
        requestAnimationFrame(() => {
          this.productInfoContainer.classList.add('product__info-container--modal--out');

          this.productInfoContainer.addEventListener('animationend', () => {
            this.productInfoContainer.classList.remove('product__info-container--modal--out');
            this.productInfoContainer.classList.remove('product__info-container--modal', 'background-modal');
          }, { once: true });
        });
      }
    }
  });
}
