class CartRemoveButton extends HTMLElement {
  constructor() {
    super();

    this.addEventListener('click', (event) => {
      event.preventDefault();
      const cartItems = this.closest('cart-items') || this.closest('cart-drawer-items');
      if (cartItems.cartDrawerUpsells) cartItems.cartDrawerUpsells.classList.add('cart-drawer-recommendations--loading');
      if (this.dataset.clear) {
        cartItems.updateQuantity(this.dataset.index, 0 , '', true);
      } else {
        cartItems.updateQuantity(this.dataset.index, 0);
      }
    });
  }
}

customElements.define('cart-remove-button', CartRemoveButton);

class CartFreeShipping extends HTMLElement {
  static get observedAttributes() {
    return ["threshold", "total-price"];
  }

  constructor() {
    super();
    this.messageElement = this.querySelector('.free-shipping__message');
    this.progressBarElement = this.querySelector('.free-shipping-scale__fill');
  }

  connectedCallback() {
    this.threshold = Math.round(this.threshold * (Shopify.currency.rate || 1));
    this.updateShippingIndicator();
  }

  get threshold() {
    return parseFloat(this.getAttribute('threshold'));
  }

  set threshold(value) {
    this.setAttribute('threshold', value);
  }

  get totalPrice() {
    return parseFloat(this.getAttribute('total-price'));
  }

  set totalPrice(value) {
    this.setAttribute('total-price', value);
  }

  updateShippingIndicator() {
    const percentage = Math.round(this.totalPrice * 100.0 / this.threshold);
    this.progressBarElement.style.width = `${percentage}%`;
    this.updateMessage();
  }

  updateMessage() {
    if (this.totalPrice >= this.threshold) {
      this.messageElement.innerHTML = this.dataset.reachedMessage;
    } else {
      const replacement = `<span class="free-shipping__price">${Shopify.formatMoney(this.threshold - this.totalPrice, this.dataset.currencyFormat).replace(/\$/g, "$$$$")}</span>`;
      this.messageElement.innerHTML = this.dataset.unreachedMessage.replace(new RegExp("({{.*}})", "g"), replacement);
    }
  }
}

customElements.define('cart-free-shipping', CartFreeShipping);

class CartItems extends HTMLElement {
  constructor() {
    super();
    this.lineItemStatusElement = document.getElementById('shopping-cart-line-item-status') || document.getElementById('CartDrawer-LineItemStatus');
    this.colorSwatches = this.querySelectorAll('.cart__product-details .color-swatch');
    hideUnavailableColors(this.colorSwatches);

    this.currentItemCount = Array.from(this.querySelectorAll('[name="updates[]"]'))
      .reduce((total, quantityInput) => total + parseInt(quantityInput.value), 0);

    this.debouncedOnChange = debounce((event) => {
      this.onChange(event);
    }, 300);

    this.addEventListener('change', this.debouncedOnChange.bind(this));
  }

  onChange(event) {
    this.updateQuantity(event.target.dataset.index, event.target.value, document.activeElement.getAttribute('name'));
  }

  getSectionsToRender() {
    return [
      {
        id: 'main-cart',
        section: document.getElementById('main-cart').dataset.id,
        selector: '.js-contents',
        childSectionSelectors: ['.cart__footer', '.cart__items', '.cart__heading', '.cart__free-shipping']
      },
      {
        id: 'cart-icon-bubble',
        section: 'cart-icon-bubble',
        selector: '.shopify-section'
      },
      {
        id: 'cart-live-region-text',
        section: 'cart-live-region-text',
        selector: '.shopify-section'
      }
    ];
  }

  updateQuantity(line, quantity, name, clear) {
    this.enableLoading(line);
    let cartUrl = routes.cart_change_url;
    let body = JSON.stringify({
      line,
      quantity,
      sections: this.getSectionsToRender().map((section) => section.section),
      sections_url: window.location.pathname
    });

    if (clear) {
      cartUrl = routes.cart_update_url;
      const mainCartItems = document.getElementById('main-cart-items') || document.getElementById('CartDrawer-CartItems');
      const items = mainCartItems.querySelectorAll('.cart__row');
      const itemsKey = {};

      items.forEach((item) => {
        const key = item.dataset.key;
        itemsKey[key] = 0
      });

      body = JSON.stringify({
        updates: itemsKey,
        attributes: { 'gift-wrapping': '', 'gift-note': '' },
        sections: this.getSectionsToRender().map((section) => section.section),
        sections_url: window.location.pathname
      });
    }

    fetch(`${cartUrl}`, {...fetchConfig(), ...{ body }})
      .then((response) => {
        return response.text();
      })
      .then((state) => {
        const parsedState = JSON.parse(state);
        const quantityElement = document.getElementById(`Quantity-${line}`) || document.getElementById(`Drawer-quantity-${line}`);
        const items = document.querySelectorAll('.cart__row');
        const cartItems = document.querySelectorAll('.cart__item');

        if (parsedState.errors) {
          quantityElement.value = quantityElement.getAttribute('value');
          let message = window.cartStrings.quantityError.replace(
            '[quantity]',
            quantityElement.value
          );

          this.updateLiveRegions(line, message);
          items.forEach((lineItem) => lineItem.classList.remove('cart__row--loading'));
          this.disableLoading();
          return;
        }

        this.classList.toggle('is-empty', parsedState.item_count === 0);
        const cartDrawerWrapper = document.querySelector('cart-drawer');
        const cartDrawerInner = cartDrawerWrapper ? cartDrawerWrapper.querySelector('.drawer__inner') : null;
        const mainCart = document.getElementById('main-cart');
        const emptyContent = document.querySelector('.empty-page-content');

        if (mainCart) mainCart.classList.toggle('is-empty', parsedState.item_count === 0);
        if (cartDrawerWrapper) cartDrawerWrapper.classList.toggle('is-empty', parsedState.item_count === 0);
        if (emptyContent) emptyContent.classList.toggle('hide', parsedState.item_count > 0);

        if (parsedState.item_count === 0 && this.cartDrawerUpsells) {
          this.closeUpsells(cartDrawerInner);
        }

        this.getSectionsToRender().forEach((section => {
          if (section.childSectionSelectors) {
            section.childSectionSelectors.forEach((elem) => {
              if (elem === '.cart__free-shipping' ) {
                const shippingScaleElem = document.getElementById(section.id).querySelector(elem);
                if (!shippingScaleElem) return;
                const sourceElement = new DOMParser()
                  .parseFromString(parsedState.sections[section.section], 'text/html')
                  .querySelector(`${elem}`);
                if (!sourceElement) return;
                shippingScaleElem.totalPrice = sourceElement.getAttribute("total-price");
                shippingScaleElem.updateShippingIndicator();
                return;
              }

              if (parsedState.item_count > 0 && quantity === 0 && elem == '.drawer__contents') {
                const cartRecommendationsHtml = this.getSectionInnerHTML(parsedState.sections[section.section], `${elem} .cart-drawer-recommendations`);
                if (this.cartDrawerUpsells) {
                  this.updateUpsells(cartRecommendationsHtml, cartDrawerInner);
                }
              }
              const elementToReplace = document.getElementById(section.id).querySelector(elem).querySelector(section.selector) || document.getElementById(section.id);
              const mainCartInnerHtml = this.getSectionInnerHTML(parsedState.sections[section.section], `${elem} ${section.selector}`);
              if (mainCartInnerHtml) {
                elementToReplace.innerHTML = mainCartInnerHtml;
              }
            });
          } else {
            const sectionElement = document.getElementById(section.id);
            if (sectionElement) {
              const elementToReplace = sectionElement.querySelector(section.selector) || sectionElement;

              elementToReplace.innerHTML = this.getSectionInnerHTML(parsedState.sections[section.section], section.selector);
            }
          }
        }));

        const updatedValue = parsedState.items[line - 1] ? parsedState.items[line - 1].quantity : undefined;
        let message = '';
        if (cartItems.length === parsedState.items.length && updatedValue !== parseInt(quantityElement.value)) {
          if (typeof updatedValue === 'undefined') {
            message = window.cartStrings.error;
          } else {
            message = window.cartStrings.quantityError.replace('[quantity]', updatedValue);
          }
        }

        this.updateLiveRegions(line, message);

        const lineItem = document.getElementById(`CartItem-${line}`) || document.getElementById(`CartDrawer-Item-${line}`);
        if (lineItem && lineItem.querySelector(`[name="${name}"]`)) lineItem.querySelector(`[name="${name}"]`).focus();
        this.disableLoading();
      }).catch((error) => {
        const errorElem = document.getElementById('cart-errors') || document.getElementById('cart-drawer-errors');
        items.forEach((lineItem) => lineItem.classList.remove('cart__row--loading'));
        const cartContent = document.querySelector('.cart-page-section') || document.querySelector('.cart-drawer');
        cartContent.classList.add('cart-page-section--error');
        errorElem.classList.remove('hide-general-error');
        errorElem.querySelector('.cart__error-text').textContent = window.cartStrings.error;
        this.disableLoading();
      });
  }

  updateLiveRegions(line, message) {
    const lineItemError = document.getElementById(`Line-item-error-${line}`) || document.getElementById(`CartDrawer-LineItemError-${line}`);
    if (lineItemError) {
      lineItemError.querySelector('.cart__error-text').innerHTML = message;
      lineItemError.classList.remove('cart__error-wrapper--item--hide');
      setTimeout(() => {
        lineItemError.classList.add('cart__error-wrapper--item--hide');
      }, 5000);
    }

    this.lineItemStatusElement.setAttribute('aria-hidden', true);

    const cartStatus = document.getElementById('cart-live-region-text') || document.getElementById('CartDrawer-LiveRegionText');
    cartStatus.setAttribute('aria-hidden', false);

    setTimeout(() => {
      cartStatus.setAttribute('aria-hidden', true);
    }, 1000);
  }

  getSectionInnerHTML(html, selector) {
    const sourceElement = new DOMParser()
      .parseFromString(html, 'text/html')
      .querySelector(selector);
    if (!sourceElement) return '';
    const colorSwatches = sourceElement.querySelectorAll('.color-swatch');

    if (colorSwatches.length) {
      hideUnavailableColors(colorSwatches);
    }

    return sourceElement.innerHTML;
  }

  enableLoading(line) {
    const mainCartItems = document.getElementById('main-cart-items') || document.getElementById('CartDrawer-CartItems');
    mainCartItems.classList.add('cart__items--disabled');

    const cartContent = document.querySelector('.cart-page-section') || document.querySelector('.cart-drawer');
    cartContent.classList.add('cart--loading');

    this.querySelectorAll(`#CartItem-${line}`).forEach((lineItem) => lineItem.classList.add('cart__row--loading'));
    this.querySelectorAll(`#CartDrawer-Item-${line}`).forEach((lineItem) => lineItem.classList.add('cart__row--loading'));

    document.activeElement.blur();
    this.lineItemStatusElement.setAttribute('aria-hidden', false);
  }

  disableLoading() {
    const mainCartItems = document.getElementById('main-cart-items') || document.getElementById('CartDrawer-CartItems');
    mainCartItems.classList.remove('cart__items--disabled');

    const cartContent = document.querySelector('.cart-page-section') || document.querySelector('.cart-drawer');
    cartContent.classList.remove('cart--loading');
  }
}

customElements.define('cart-items', CartItems);

class ProductItem extends HTMLElement {
  constructor() {
    super();
    this.productForm = this.querySelector('form');
    if (this.productForm) {
      this.summitButton = this.productForm.querySelector('[type="submit"]');
      this.cart = document.querySelector('cart-drawer');
      this.productForm.addEventListener('submit', this.onSubmitHandler.bind(this));
    }
  }

  onSubmitHandler(evt) {
    evt.preventDefault();

    this.summitButton.disabled = true;
    this.summitButton.setAttribute('aria-disabled', true);
    this.summitButton.classList.add('btn--loading');

    const config = fetchConfig('javascript');
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    delete config.headers['Content-Type'];
    const formData = new FormData(this.productForm);

    if (this.cart) {
      formData.append('sections', this.cart.getSectionsToRender().map((section) => section.id));
      formData.append('sections_url', window.location.pathname);
      this.cart.setActiveElement(document.activeElement);
    }
    config.body = formData;

    fetch(`${routes.cart_add_url}`, config)
      .then((response) => response.json())
      .then((response) => {
        this.cart.renderContents(response);
      })
      .finally(() => {
        this.summitButton.disabled = false;
        this.summitButton.removeAttribute('aria-disabled');
        this.summitButton.classList.remove('btn--loading');
      });
  }
}

customElements.define('product-item', ProductItem);

class CartGiftWrapping extends HTMLElement {
  constructor() {
    super();

    const giftId = this.dataset.giftId;
    this.giftWrappingCheckbox = this.querySelector('[name="attributes[gift-wrapping]"]');
    const parentContent = this.closest('#main-cart') || this.closest('#CartDrawer');
    const cartItems = parentContent.querySelector('cart-items') || parentContent.querySelector('cart-drawer-items');

    this.giftWrappingCheckbox.addEventListener('change', debounce(() => {
      let body = JSON.stringify({
        updates: { [giftId]: 0 },
        attributes: { 'gift-wrapping': '', 'gift-note': '' },
        sections: cartItems.getSectionsToRender().map((section) => section.section)
      });

      if (this.giftWrappingCheckbox.checked) {
        body = JSON.stringify({
          updates: { [giftId]: 1 },
          attributes: { 'gift-wrapping': true },
          sections: cartItems.getSectionsToRender().map((section) => section.section)
        });
      }

      this.giftWrappingCheckbox.disabled = true;
      this.classList.add('loading-gift-wrap');

      fetch(`${routes.cart_update_url}`, {...fetchConfig(), ...{ body }})
        .then((response) => {
          return response.text();
        })
        .then((state) => {
          const parsedState = JSON.parse(state);

          if (parsedState.errors) {
            const errorElem = document.getElementById('cart-errors') || document.getElementById('cart-drawer-errors');
            errorElem.classList.remove('hide-general-error');
            errorElem.querySelector('.cart__error-text').textContent = window.cartStrings.error;
            this.giftWrappingCheckbox.disabled = false;
            this.classList.remove('loading-gift-wrap');
            return;
          }

          cartItems.getSectionsToRender().forEach((section => {
            if (section.childSectionSelectors) {
              section.childSectionSelectors.forEach((elem) => {
                if (elem == '.cart__free-shipping' ) {
                  const shippingScaleElem = document.getElementById(section.id).querySelector(elem);
                  if (!shippingScaleElem) return;
                  const sourceElement = new DOMParser()
                    .parseFromString(parsedState.sections[section.section], 'text/html')
                    .querySelector(`${elem}`);
                  if (!sourceElement) return;
                  shippingScaleElem.totalPrice = sourceElement.getAttribute("total-price");
                  shippingScaleElem.updateShippingIndicator();
                  return;
                }

                const elementToReplace = document.getElementById(section.id).querySelector(elem).querySelector(section.selector) || document.getElementById(section.id);

                if (elem === '.drawer__contents' || elem === '.cart__items') {
                  const sourceElement = new DOMParser()
                    .parseFromString(parsedState.sections[section.section], 'text/html')
                    .querySelector(`${elem}`);
                  const giftWrapProduct = elementToReplace.querySelector(`[data-gift-wrapping-id="${giftId}"]`);
                  const sourceGiftWrapProduct = sourceElement.querySelector(`[data-gift-wrapping-id="${giftId}"]`);

                  if (giftWrapProduct && !this.giftWrappingCheckbox.checked) {
                    const heightElm = giftWrapProduct.offsetHeight;
                    giftWrapProduct.style.setProperty('--max-height', `${heightElm}px`);
                    giftWrapProduct.classList.add('cart__row--gift');

                    setTimeout(() => {
                      giftWrapProduct.classList.add('cart__row--hide');
                    }, 0);

                    giftWrapProduct.addEventListener('transitionend', () => {
                      setTimeout(() => {
                        const mainCartInnerHtml = cartItems.getSectionInnerHTML(parsedState.sections[section.section], `${elem} ${section.selector}`);
                        elementToReplace.innerHTML = mainCartInnerHtml;
                      }, 400);
                    }, { once: true });
                  } else if (sourceGiftWrapProduct && this.giftWrappingCheckbox.checked) {
                    const cartItemsWrapper = elementToReplace.querySelector('.cart-content-items') || elementToReplace.querySelector('.drawer__cart-items-wrapper');
                    const cartItemsSourceWrapper = sourceElement.querySelector('.cart-content-items') || sourceElement.querySelector('.drawer__cart-items-wrapper');
                    sourceGiftWrapProduct.style.position = 'absolute';
                    sourceGiftWrapProduct.style.opacity = '0';

                    const colorSwatches = cartItemsSourceWrapper.querySelectorAll('.color-swatch');
                    if (colorSwatches.length) {
                      hideUnavailableColors(colorSwatches);
                    }

                    cartItemsWrapper.innerHTML = cartItemsSourceWrapper.innerHTML;
                    const giftWrapProductElm = cartItemsWrapper.querySelector(`[data-gift-wrapping-id="${giftId}"]`);

                    const heightElm = giftWrapProductElm.offsetHeight;
                    giftWrapProductElm.style.setProperty('--max-height', `${heightElm}px`);
                    giftWrapProductElm.classList.add('cart__row--gift', 'cart__row--hide');
                    giftWrapProductElm.style.position = null;
                    giftWrapProductElm.style.opacity = null;

                    setTimeout(() => {
                      giftWrapProductElm.classList.remove('cart__row--hide');
                    });
                  }
                  return;
                }

                const mainCartInnerHtml = cartItems.getSectionInnerHTML(parsedState.sections[section.section], `${elem} ${section.selector}`);
                elementToReplace.innerHTML = mainCartInnerHtml;
              });
            } else {
              const sectionElement = document.getElementById(section.id);
              if (sectionElement) {
                const elementToReplace = sectionElement.querySelector(section.selector) || sectionElement;

                elementToReplace.innerHTML = cartItems.getSectionInnerHTML(parsedState.sections[section.section], section.selector);
              }
            }
          }));

          this.giftWrappingCheckbox.disabled = false;
          this.classList.remove('loading-gift-wrap');
        }).catch((e) => {
          const errorElem = document.getElementById('cart-errors') || document.getElementById('cart-drawer-errors');
          errorElem.classList.remove('hide-general-error');
          errorElem.querySelector('.cart__error-text').textContent = window.cartStrings.error;
          this.giftWrappingCheckbox.disabled = false;
          this.classList.remove('loading-gift-wrap');
        });
    }, 300));
  }
};

customElements.define('cart-gift-wrapping', CartGiftWrapping);

if (!customElements.get('cart-footer-modal')) {
  customElements.define('cart-footer-modal', class CartFooterModal extends HTMLElement {
    constructor() {
      super();
      this.cartFooterModal = this.querySelector('.cart__footer-modal');
    }

    openFooterModal(content) {
      const contentElement = this.querySelector(`.cart__footer-modal__${content}`);
      const noteField = contentElement.querySelector('textarea');
      const giftNoteCount = contentElement.querySelector('.gift-note__count');
      this.value = null;

      if (noteField) {
        this.value = noteField.value;

        if (giftNoteCount) {
          const maxLength = noteField.maxLength;
          giftNoteCount.textContent = maxLength - noteField.value.length;
        }
      }

      if (contentElement) {
        contentElement.classList.remove('hidden');
      }

      this.cartFooterModal.classList.add('open');
    }

    closeFooterModal(content) {
      this.cartFooterModal.classList.remove('open');
      this.querySelectorAll('.cart__footer-modal__content').forEach((content) => {
        content.classList.add('hidden');
      });

      if (content) {
        const contentElement = this.querySelector(`.cart__footer-modal__${content}`);
        const noteField = contentElement.querySelector('textarea');
        if (this.value !== null) {
          noteField.value = this.value;
        }
      }
    }
  });
}

if (!customElements.get('cart-note')) {
  customElements.define('cart-note', class CartNote extends HTMLElement {
    constructor() {
      super();
      const saveButton = this.querySelector('button[type="submit"]');
      const noteField = this.querySelector('textarea[name="note"]');
      const cartFooterModal = this.closest('cart-footer-modal');
      if (!saveButton) return;

      saveButton.addEventListener('click', () => {
        saveButton.disabled = true;
        saveButton.classList.add('btn--loading');
        const body = JSON.stringify({ note: noteField.value });
        fetch(`${routes.cart_update_url}`, { ...fetchConfig(), ...{ body } })
          .then((response) => {
            return response.text();
          })
          .then((state) => {
            const parsedState = JSON.parse(state);

            if (parsedState.errors) {
              const errorElem = document.getElementById('cart-errors') || document.getElementById('cart-drawer-errors');
              errorElem.classList.remove('hide-general-error');
              errorElem.querySelector('.cart__error-text').textContent = window.cartStrings.error;
              // add error below the textarea?
              saveButton.disabled = false;
              saveButton.classList.remove('btn--loading');
              if (cartFooterModal) {
                cartFooterModal.closeFooterModal();
              }
              return;
            }

            saveButton.disabled = false;
            saveButton.classList.add('cart__note__btn--saved');
            saveButton.classList.remove('btn--loading');

            setTimeout(() => {
              if (cartFooterModal) {
                cartFooterModal.closeFooterModal();
              }
              saveButton.classList.remove('cart__note__btn--saved');
            }, 1700);
          }).catch((e) => {
            const errorElem = document.getElementById('cart-errors') || document.getElementById('cart-drawer-errors');
            errorElem.classList.remove('hide-general-error');
            errorElem.querySelector('.cart__error-text').textContent = window.cartStrings.error;
            saveButton.disabled = false;
            saveButton.classList.remove('btn--loading');
          });
      });
    }
  });
};

if (!customElements.get('cart-gift-note')) {
  customElements.define('cart-gift-note', class CartGiftNote extends HTMLElement {
    constructor() {
      super();

      const saveButton = this.querySelector('button[type="submit"]');
      const noteField = this.querySelector('textarea[name="attributes[gift-note]"]');
      const giftNoteCount = this.querySelector('.gift-note__count');
      const cartFooterModal = this.closest('cart-footer-modal');
      if (!saveButton) return;

      if (giftNoteCount) {
        const maxLength = noteField.maxLength;
        giftNoteCount.textContent = maxLength - noteField.value.length;
        noteField.addEventListener('keyup', () => {
          const characterCount = maxLength - noteField.value.length;
          giftNoteCount.textContent = characterCount;
        });
      }

      saveButton.addEventListener('click', () => {
        saveButton.disabled = true;
        saveButton.classList.add('btn--loading');
        const body = JSON.stringify({ attributes: { 'gift-note': noteField.value } });
        fetch(`${routes.cart_update_url}`, { ...fetchConfig(), ...{ body } })
          .then((response) => {
            return response.text();
          })
          .then((state) => {
            const parsedState = JSON.parse(state);
            saveButton.classList.remove('btn--loading');

            if (parsedState.errors) {
              const errorElem = document.getElementById('cart-errors') || document.getElementById('cart-drawer-errors');
              errorElem.classList.remove('hide-general-error');
              errorElem.querySelector('.cart__error-text').textContent = window.cartStrings.error;
              saveButton.disabled = false;
              saveButton.classList.remove('btn--loading');
              if (cartFooterModal) {
                cartFooterModal.closeFooterModal();
              }
              return;
            }

            saveButton.disabled = false;
            saveButton.classList.add('cart__note__btn--saved');
            saveButton.classList.remove('btn--loading');

            setTimeout(() => {
              if (cartFooterModal) {
                cartFooterModal.closeFooterModal();
              }
              saveButton.classList.remove('cart__note__btn--saved');
            }, 1700);
          }).catch((e) => {
            const errorElem = document.getElementById('cart-errors') || document.getElementById('cart-drawer-errors');
            errorElem.classList.remove('hide-general-error');
            errorElem.querySelector('.cart__error-text').textContent = window.cartStrings.error;
            saveButton.disabled = false;
            saveButton.classList.remove('btn--loading');
          });
      });
    }
  });
};

if (!customElements.get('cart-shipping-calculator')) {
  customElements.define('cart-shipping-calculator', class cartShippingCalculator extends HTMLElement {
    constructor() {
      super();
      this.calculateForm = this.querySelector('.modal__shipping-form');
      this.formContent = this.querySelector('.modal__shipping-form__content');
      this.fieldsContent = this.querySelector('.cart-calculate-shipping');
      this.country = this.querySelector('#CartDrawerCountry');
      this.providence = this.querySelector('#CartDrawerProvince');
      this.zip = this.querySelector('#CartDrawerZip');
      this.messageNoShipping = this.querySelector('.calculate-shipping__message');
      this.saveButton = this.querySelector('button[type="submit"]');
      this.shippingRatesElem = this.querySelector('.cart-shipping-rates');
      this.recalculateBtn = this.querySelector('.cart__recalculate-btn');
      this.setupCountries();

      this.calculateForm.addEventListener('submit', this.handleCalculation.bind(this));

      this.recalculateBtn.addEventListener('click', () => {
        this.recalculateBtn.classList.remove('active');
        this.shippingRatesElem.classList.remove('active');
        this.handleAnimation(this.shippingRatesElem, this.fieldsContent);
      });



      this.fieldsContent.querySelectorAll('select, input').forEach((field) => {
        let eventName = 'keyup';

        if (field.tagName === 'SELECT') {
          eventName = 'change';
        }

        field.addEventListener(eventName, () => {
          this.removeErrorStyle();
        });
      });
    }

    setupCountries() {
      const mainCountries = ['United States', 'United Kingdom', 'France', 'Italy', 'Germany', 'Canada'];
      const countries = Array.from(this.country.options);
      const optgroupMainElm = document.createElement('optgroup');
      const optgroupElm = document.createElement('optgroup');

      mainCountries.forEach((country) => {
        const foundCountry = countries.find((option) => {
          return option.value === country;
        });
        if (foundCountry) {
          optgroupMainElm.appendChild(foundCountry);
        }
      });

      this.country.querySelectorAll('option').forEach((optionElm) => {
        optgroupElm.appendChild(optionElm);
      });

      this.country.append(optgroupMainElm);
      this.country.append(optgroupElm);

      this.country.value = "---";

      if (Shopify && Shopify.CountryProvinceSelector) {
        if (this.querySelector('#CartDrawerCountry')) {
          new Shopify.CountryProvinceSelector('CartDrawerCountry', 'CartDrawerProvince', {
            hideElement: 'CartDrawerAddressProvinceContainer'
          });
        }
      }
    }

    removeErrorStyle() {
      const field_errors = this.fieldsContent.querySelectorAll('.input--error');

      field_errors.forEach((field_error) => {
        const fieldWrapper = field_error.parentElement;
        const hasErrorMessage = fieldWrapper.nextElementSibling ? fieldWrapper.nextElementSibling.classList.contains('input-error-message') : null;
        const iconError = fieldWrapper.querySelector('.field-wrapper__icon-error');

        if (iconError) {
          iconError.classList.add('hide');
        }

        if (hasErrorMessage) {
          const errorMsgElm = fieldWrapper.nextElementSibling;
          const errorMessageText = errorMsgElm.querySelector('.input-error-message__text');

          errorMessageText.textContent = '';
          errorMsgElm.classList.add('hide');
        }

        field_error.classList.remove('input--error');
        field_error.classList.remove('input--not-error-msg');
        field_error.removeAttribute('aria_invalid');
        field_error.removeAttribute('aria_describedby');
      });
    }

    handleAnimation (hideElem, showElem, removeLoading) {
      const isShippingRates = hideElem.classList.contains('cart-shipping-rates');
      let timer = 400;
      this.formContent.style.height = '';
      this.formContent.style.transition = 'none';
      const startHeight = window.getComputedStyle(this.formContent).height;
      const cartFooter = showElem.closest('.cart__footer');
      const startCartFootertHeight = window.getComputedStyle(this).height;

      if (isShippingRates) {
        timer = 200;
        if (cartFooter) {
          cartFooter.style.height = '';
        }
      } else if (!isShippingRates && cartFooter) {
        cartFooter.style.height = '';
        cartFooter.style.transition = 'none';
      }

      hideElem.classList.remove('active');
      setTimeout(() => {
        hideElem.style.display = 'none';

        if (isShippingRates) {
          hideElem.innerHTML = '';
        }

        showElem.style.removeProperty('display');
        setTimeout(() => showElem.classList.add('active'), 0);

        const height = window.getComputedStyle(this.formContent).height;
        const cartFooterHeight = window.getComputedStyle(this).height;
        this.formContent.style.height = startHeight;
        if (!isShippingRates && cartFooter) {
          cartFooter.style.height = startCartFootertHeight;
        }

        requestAnimationFrame(() => {
          this.formContent.style.transition = '';
          if (!isShippingRates && cartFooter) {
            cartFooter.style.transition = '';
          }

          requestAnimationFrame(() => {
            this.formContent.style.height = height
            if (!isShippingRates && cartFooter) {
              cartFooter.style.height = cartFooterHeight;
            }
          });
        });

        this.formContent.addEventListener('transitionend', () => {
          this.formContent.style.height = '';
        }, { once: true });

        if (removeLoading) {
          this.saveButton.disabled = false;
          this.saveButton.classList.remove('btn--loading');
        }
      }, timer);
    }

    handleCalculation(evt) {
      evt.preventDefault();
      const formIsValid = validateForm(this.calculateForm);

      if (!formIsValid) {
        return;
      }

      this.removeErrorStyle();
      this.saveButton.disabled = true;
      this.saveButton.classList.add('btn--loading');

      const shippingAddress = {
        country: this.country.value || '',
        province: this.providence.value || '',
        zip: this.zip.value || '',
      };
      const params = `shipping_address[country]=${shippingAddress.country}&shipping_address[province]=${shippingAddress.province}&shipping_address[zip]=${shippingAddress.zip}`;
      const url = encodeURI(`${params}`);

      fetch(`/cart/prepare_shipping_rates.json?${url}`, { method: 'POST' })
        .then((response) => response.text())
        .then((state) => {
          const parsedState = JSON.parse(state);
          if (typeof parsedState === 'object' && parsedState !== null ) {
            Object.entries(parsedState).forEach(([key, value]) => {
              const fieldElement = this.calculateForm.querySelector(`[name=${key}]`);
              if (fieldElement) {
                const fieldWrapper = fieldElement.parentElement;
                const hasErrorMessage = fieldWrapper.nextElementSibling ? fieldWrapper.nextElementSibling.classList.contains('input-error-message') : null;
                const iconError = fieldWrapper.querySelector('.field-wrapper__icon-error');

                if (iconError) {
                  iconError.classList.remove('hide');
                }

                if (hasErrorMessage) {
                  const errorMsgElm = fieldWrapper.nextElementSibling;
                  const errorMessageText = errorMsgElm.querySelector('.input-error-message__text');

                  errorMessageText.textContent = `${value}.`;
                  errorMsgElm.classList.remove('hide');
                }

                fieldElement.classList.add('input--error');
                fieldElement.setAttribute('aria_invalid', 'true');
                fieldElement.setAttribute('aria_describedby', `${fieldElement.id}-error`);
              }
            });

            this.saveButton.disabled = false;
            this.saveButton.classList.remove('btn--loading');

            if (parsedState.error) {
              this.messageNoShipping.querySelector('.calculate-shipping__message-text').textContent = parsedState.error;
              this.messageNoShipping.classList.remove('hide');
            }

            return;
          }

          const fetchShippingRates = () => {
            fetch(`/cart/async_shipping_rates.json?${url}`)
              .then((response) => response.text())
              .then((responseText) => {
                const parsedResponse = JSON.parse(responseText);

                if (parsedResponse === null) {
                  setTimeout(fetchShippingRates, 500);
                  return;
                }

                const shippingRates = parsedResponse.shipping_rates || [];

                if (shippingRates.length > 0) {
                  this.onCartShippingRatesUpdate(shippingRates);
                  this.handleAnimation(this.fieldsContent, this.shippingRatesElem, true);
                } else {
                  this.saveButton.disabled = false;
                  this.saveButton.classList.remove('btn--loading');
                  this.messageNoShipping.querySelector('.calculate-shipping__message-text').textContent = 'Sorry! We don’t ship here.';
                  this.messageNoShipping.classList.remove('hide');
                }
              });
          }

          fetchShippingRates();
        });
    }

    onCartShippingRatesUpdate = function (shippingRates) {
      const fragment = document.createDocumentFragment();
      const ulElem = fragment.appendChild(document.createElement('ul'));

      shippingRates.forEach((rate) => {
        const liElem = ulElem.appendChild(document.createElement('li'));
        const textElem = liElem.appendChild(document.createElement('h3'));
        textElem.classList.add('h2');
        let name = rate.name.replace('International','');;
        let price = rate.price;
        let estimateTime = '';
        const deliveryDays = rate.delivery_days;

        if (price === '0.00') {
          price = window.cartStrings.freePrice;
        } else {
          price = `${rate.currency} ${rate.price}`;
        }

        if (deliveryDays.length) {
          deliveryDays.forEach((t, i) => {
            estimateTime = i === 0 ? t : `${estimateTime}-${t}`;
          });

          estimateTime = `<span>${estimateTime} days</span>`
        }

        textElem.innerHTML = `<span>${name}</span> ${estimateTime} ${price}`;
        this.recalculateBtn.classList.add('active');
      });

      this.shippingRatesElem.appendChild(fragment);
    }
  });
};
