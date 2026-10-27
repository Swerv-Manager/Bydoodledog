class CartNotification extends HTMLElement {
  constructor() {
    super();

    this.notification = document.getElementById('cart-notification');
    this.header = document.querySelector('sticky-header');
    this.onBodyClick = this.handleBodyClick.bind(this);

    this.notification.addEventListener('keyup', (evt) => evt.code === 'Escape' && this.close());
    this.querySelectorAll('button[type="button"]').forEach((closeButton) =>
      closeButton.addEventListener('click', this.close.bind(this))
    );
  }

  open() {
    this.notification.classList.add('animate', 'active');

    // this.notification.addEventListener('transitionend', () => {
    //   this.contenScrollTo(0);
    // }, { once: true });

    this.notification.addEventListener(
      'transitionend',
      () => {
        this.notification.focus();
        trapFocus(this.notification);
      },
      { once: true }
    );

    document.body.addEventListener('click', this.onBodyClick);
  }

  contenScrollTo(scrollTo) {
    if (window.scrollY > scrollTo) {
      setTimeout(() => {
        window.scrollTo(0, window.scrollY - 16);
        this.contenScrollTo(scrollTo);
      }, 5);
    } else {
      this.notification.focus();
      trapFocus(this.notification);
    }
  }

  close() {
    this.notification.classList.remove('active');

    document.body.removeEventListener('click', this.onBodyClick);

    removeTrapFocus(this.activeElement);
  }

  renderContents(parsedState, qtyValue = 1) {
    this.productId = parsedState.id;
    this.getSectionsToRender().forEach((section => {
      if (section.id === 'cart-icon-bubble') {
        const productCartIcon = document.getElementById('cart-icon-bubble--product');

        if (productCartIcon) {
          productCartIcon.innerHTML = this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
        }
      }

      document.getElementById(section.id).innerHTML =
        this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);

      if (section.id === 'cart-notification-product') {
        const priceElm = this.querySelector('.cart-notification-product__price');

        if (priceElm) {
          const calculatePrice = parsedState.final_price * qtyValue;
          var finalprice = Shopify.formatMoney(calculatePrice, priceElm.dataset.currencyFormat);
          priceElm.textContent = finalprice;
        }
      }
    }));

    if (this.header) this.header.reveal();
    this.open();
  }

  getSectionsToRender() {
    return [
      {
        id: 'cart-notification-product',
        selector: `#cart-notification-product-${this.productId}`,
      },
      {
        id: 'cart-icon-bubble'
      }
    ];
  }

  getSectionInnerHTML(html, selector = '.shopify-section') {
    const sourceElement = new DOMParser()
      .parseFromString(html, 'text/html')
      .querySelector(selector);
    const colorSwatch = sourceElement.querySelector('.color-swatch');

    if (colorSwatch) {
      hideUnavailableColors(colorSwatch);
    }

    return sourceElement.innerHTML;
  }

  handleBodyClick(evt) {
    const target = evt.target;
    if (target !== this.notification && !target.closest('cart-notification')) {
      const disclosure = target.closest('details-disclosure');
      this.activeElement = disclosure ? disclosure.querySelector('summary') : null;
      this.close();
    }
  }

  setActiveElement(element) {
    this.activeElement = element;
  }
}

customElements.define('cart-notification', CartNotification);
