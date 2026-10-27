if (!customElements.get('product-content')) {
  customElements.define('product-content', class ProductContent extends HTMLElement {
    constructor() {
      super();
      this.handleBuyTools();
      this.handleCollapsibleBlocks();
    }

    handleBuyTools() {
      const productPageSection = document.querySelector('.product-page-section');
      if (!productPageSection) return;

      const isWrapped = productPageSection.closest('.product-section-main-wrap');
      const productInformation = productPageSection.querySelector('product-information');
      const productInfoWraper = productPageSection.querySelector('.product__info-wrapper');
      const nextElement = productPageSection ? productPageSection.nextElementSibling : null;
      const productContentIsNextSibling = nextElement ? nextElement.classList.contains('product-content-section') : false;

      if (productInfoWraper && productContentIsNextSibling) {
        if (!isWrapped) {
          const templateProduct = this.closest('.template-product-wrapper');
          const walletButton = templateProduct ? templateProduct.querySelector('.wallet-button-fade-in') : null;
          if (walletButton) walletButton.innerHTML = '';
          $('.product-section').wrapAll('<div class="product-section-main-wrap" />');
        }

        productPageSection.classList.remove('product-static-buy-tools');

        if (productInformation) {
          productInformation.buyToolsCalculations();
          window.addEventListener('scroll', productInformation.onScrollToolsHandler, false);
        }
      } else if (productInfoWraper && !productContentIsNextSibling) {
        productPageSection.classList.add('product-static-buy-tools');
        window.removeEventListener('scroll', productInformation.onScrollToolsHandler, false);
        productInformation.staticBuyTools = true;
      }
    }

    handleCollapsibleBlocks() {
      const details = this.querySelectorAll('.product__collapsible-details');
      const RO = new ResizeObserver(entries => {
        return entries.forEach(entry => {
          const detail = entry.target;
          const detailWidth = +detail.dataset.width;
          const roundedEntrySize = Math.round(entry.contentRect.width);
          if (detailWidth !== roundedEntrySize) {
            detail.removeAttribute('style');
            this.setHeight(detail);
          }
        })
      });

      details.forEach(detail => {
        RO.observe(detail);
      });
    }

    setHeight (detail) {
      detail.open = true;
      const rectOpen = detail.getBoundingClientRect();
      detail.style.setProperty('--expanded', `${rectOpen.height}px`);

      detail.open = false;
      const rectClose = detail.getBoundingClientRect();
      detail.style.setProperty('--collapsed', `${rectClose.height}px`);
      detail.dataset.width = Math.round(rectClose.width);
    }
  });
}
