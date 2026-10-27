class CartDrawer extends HTMLElement {
  constructor() {
    super();

    this.addEventListener('keyup', (evt) => evt.code === 'Escape' && this.close());
    this.querySelector('#CartDrawer-Overlay').addEventListener('click', this.close.bind(this));
    this.setHeaderCartIconAccessibility();
  }

  setHeaderCartIconAccessibility() {
    const cartLink = document.querySelector('#cart-icon-bubble');
    if (!cartLink) return;
    cartLink.setAttribute('role', 'button');
    cartLink.setAttribute('aria-haspopup', 'dialog');
    cartLink.addEventListener('click', (event) => {
      event.preventDefault();
      this.open(cartLink)
    });
    cartLink.addEventListener('keydown', (event) => {
      if (event.code.toUpperCase() === 'SPACE') {
        event.preventDefault();
        this.open(cartLink);
      }
    });
  }

  open(triggeredBy) {
    if (triggeredBy) this.setActiveElement(triggeredBy);
    const cartDrawerNote = this.querySelector('[id^="Details-"] summary');
    if (cartDrawerNote && !cartDrawerNote.hasAttribute('role')) this.setSummaryAccessibility(cartDrawerNote);
    // here the animation doesn't seem to always get triggered. A timeout seem to help
    setTimeout(() => {this.classList.add('animate', 'active')});

    this.addEventListener('transitionend', () => {
      const containerToTrapFocusOn = this.classList.contains('is-empty') ? this.querySelector('.drawer__inner-empty') : document.getElementById('CartDrawer');
      const focusElement = this.querySelector('.drawer__inner') || this.querySelector('.drawer__close');
      trapFocus(containerToTrapFocusOn, focusElement);
    }, { once: true });

    document.body.classList.add('overflow-hidden');
  }

  close() {
    this.classList.remove('active');
    removeTrapFocus(this.activeElement);
    document.body.classList.remove('overflow-hidden');
  }

  setSummaryAccessibility(cartDrawerNote) {
    cartDrawerNote.setAttribute('role', 'button');
    cartDrawerNote.setAttribute('aria-expanded', 'false');

    if(cartDrawerNote.nextElementSibling.getAttribute('id')) {
      cartDrawerNote.setAttribute('aria-controls', cartDrawerNote.nextElementSibling.id);
    }

    cartDrawerNote.addEventListener('click', (event) => {
      event.currentTarget.setAttribute('aria-expanded', !event.currentTarget.closest('details').hasAttribute('open'));
    });

    cartDrawerNote.parentElement.addEventListener('keyup', onKeyUpEscape);
  }

  renderContents(parsedState) {
    this.classList.remove('is-empty');
    this.querySelector('.drawer__inner').classList.contains('is-empty') && this.querySelector('.drawer__inner').classList.remove('is-empty');
    this.productId = parsedState.id;
    this.getSectionsToRender().forEach((section => {
      const sectionElement = section.selector ? document.querySelector(section.selector) : document.getElementById(section.id);
      sectionElement.innerHTML =
          this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
    }));

    setTimeout(() => {
      this.querySelector('#CartDrawer-Overlay').addEventListener('click', this.close.bind(this));
      this.open();
    });
  }

  getSectionInnerHTML(html, selector = '.shopify-section') {
    return new DOMParser()
      .parseFromString(html, 'text/html')
      .querySelector(selector).innerHTML;
  }

  getSectionsToRender() {
    return [
      {
        id: 'cart-drawer',
        selector: '#CartDrawer',
        childSectionSelectors: [
          '.drawer__heading',
          '.cart__free-shipping',
          '.drawer__contents',
          '.cart-drawer__footer-info'
        ]
      },
      {
        id: 'cart-icon-bubble'
      }
    ];
  }

  getSectionDOM(html, selector = '.shopify-section') {
    return new DOMParser()
      .parseFromString(html, 'text/html')
      .querySelector(selector);
  }

  setActiveElement(element) {
    this.activeElement = element;
  }
}

customElements.define('cart-drawer', CartDrawer);

class CartDrawerItems extends CartItems {
  constructor() {
    super();
    this.cartDrawerUpsells = this.querySelector('.cart-drawer-recommendations');
  }

  getSectionsToRender() {
    return [
      {
        id: 'CartDrawer',
        section: 'cart-drawer',
        selector: '.js-contents',
        childSectionSelectors: [
          '.drawer__heading',
          '.cart__free-shipping',
          '.drawer__contents',
          '.cart-drawer__footer-info'
        ]
      },
      {
        id: 'cart-icon-bubble',
        section: 'cart-icon-bubble',
        selector: '.shopify-section'
      }
    ];
  }

  closeUpsells(cartDrawerInner) {
    this.cartDrawerUpsells.style.transform = 'translate(100%)';
    this.cartDrawerUpsells.addEventListener('transitionend', () => {
      if (cartDrawerInner) cartDrawerInner.classList.remove('drawer__inner--no-border');
      this.cartDrawerUpsells.classList.add('close');
    }, { once: true });
  }

  updateUpsells(cartRecommendationsHtml, cartDrawerInner) {
    if (cartRecommendationsHtml === "") {
      this.cartDrawerUpsells.classList.remove('cart-drawer-recommendations--loading');
      this.closeUpsells(cartDrawerInner);
    } else {
      const cartDrawerRecommendationsList = this.cartDrawerUpsells.querySelector('.cart-drawer-recommendations__list');
      if (cartDrawerRecommendationsList) {
        cartDrawerRecommendationsList.classList.add('disable-list');
        if (cartDrawerInner) cartDrawerInner.classList.add('drawer__inner--no-border');
        this.cartDrawerUpsells.classList.remove('close');
      }

      setTimeout(() => {
        this.cartDrawerUpsells.innerHTML = cartRecommendationsHtml;
      }, 200);
    }
  }
}

customElements.define('cart-drawer-items', CartDrawerItems);

class CartRecommendations extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    fetch(this.dataset.url)
      .then(response => response.text())
      .then(text => {
        if (this.classList.contains('product-recommendations--loaded')) {
          return;
        }
        const html = document.createElement('div');
        html.innerHTML = text;
        const recommendations = html.querySelector('cart-recommendations');
        const cartDrawerUpsells = this.closest('.cart-drawer-recommendations');

        if (recommendations && recommendations.innerHTML.trim().length) {
          cartDrawerUpsells.classList.remove('cart-drawer-recommendations--loading');
          this.innerHTML = recommendations.innerHTML;
          const cartDrawerRecommendationsList = this.querySelector('.cart-drawer-recommendations__list');

          if (cartDrawerRecommendationsList) {
            setTimeout(() => {
              this.querySelector('.cart-drawer-recommendations__list').classList.remove('disable-list');
            });
          }
        }

        const cartDrawerInner = cartDrawerUpsells.closest('.drawer__inner');
        if (!this.querySelector('.cart-drawer-recommendations__list')) {
          cartDrawerUpsells.classList.add('close');
          setTimeout(() => {
            if (cartDrawerInner) cartDrawerInner.classList.remove('drawer__inner--no-border');
          }, 200);
        } else {
          if (cartDrawerInner) cartDrawerInner.classList.add('drawer__inner--no-border');
          cartDrawerUpsells.classList.remove('close');
        }

        this.classList.add('product-recommendations--loaded');

        if (this.classList.contains('complementary-products') ) {
          this.querySelectorAll('script').forEach(oldScriptTag => {
            const newScriptTag = document.createElement('script');
            Array.from(oldScriptTag.attributes).forEach(attribute => {
              newScriptTag.setAttribute(attribute.name, attribute.value)
            });
            newScriptTag.appendChild(document.createTextNode(oldScriptTag.innerHTML));
            oldScriptTag.parentNode.replaceChild(newScriptTag, oldScriptTag);
          });
        }
      })
      .catch(e => {
        console.error(e);
      });
  }
}

customElements.define('cart-recommendations', CartRecommendations);
