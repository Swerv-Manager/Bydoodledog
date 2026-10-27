if (!customElements.get('quick-add-modal')) {
  customElements.define('quick-add-modal', class QuickAddModal extends ModalDialog {
    constructor() {
      super();
      this.modalContent = this.querySelector('[id^="QuickAddInfo-"]');
    }

    hide(preventFocus = false) {
      const cartNotification = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
      if (cartNotification) cartNotification.setActiveElement(this.openedBy);
      this.modalContent.innerHTML = '';

      if (preventFocus) this.openedBy = null;
      super.hide();
    }

    show(opener) {
      // if (!opener.hasAttribute("data-product-url")){
      //   super.show(opener);
      //   return;
      // };

      const modalOpener = opener.closest('.quick-add');
      if (modalOpener) modalOpener.classList.add('quick-add--visible');
      opener.classList.add('btn--loading');
      opener.setAttribute('aria-disabled', true);
      opener.setAttribute('disabled', true);

      fetch(opener.getAttribute('data-product-url'))
        .then((response) => response.text())
        .then((responseText) => {
          const responseHTML = new DOMParser().parseFromString(responseText, 'text/html');
          const quickBuyContent = responseHTML.getElementById("quick-buy-content").content;
          Array.from(quickBuyContent.querySelectorAll("noscript")).forEach((noScript) => noScript.remove());
          this.modalContent.replaceChildren(quickBuyContent);
          // opener.removeAttribute('data-product-url');

          const mediaGallery = this.querySelector('lite-gallery');
          const productVariants = this.querySelector('.variants-content');
          let options;
          let currentVariant;
          let mediaId = null;

          if (productVariants && mediaGallery) {
            options = productVariants.productData ? productVariants.productData.options : null;
            currentVariant = productVariants.currentVariant;
            if (currentVariant.featured_media) {
              mediaId = `${productVariants.dataset.section}${productVariants.dataset.block}-${currentVariant.featured_media.id}`;
            }
            mediaGallery.setActiveMedia(mediaId, options, currentVariant);
          }

          const imgsElm = this.modalContent.querySelectorAll('img');

          imgsElm.forEach((imgElm) => {
            imgElm.onload = () => {
              imgElm.classList.add('loaded');
            }
          });

          if (window.Shopify && Shopify.PaymentButton) {
            Shopify.PaymentButton.init();
          }

          if (window.ProductModel) window.ProductModel.loadShopifyXR();
          setTimeout(() => {
            super.show(opener);
          });
        })
        .finally(() => {
          if (modalOpener) modalOpener.classList.remove('quick-add--visible');
          opener.removeAttribute('aria-disabled');
          opener.removeAttribute('disabled');
          opener.classList.remove('btn--loading');
        });
    }
  });
}
