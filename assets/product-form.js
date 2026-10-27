if (!customElements.get('product-form')) {
  customElements.define('product-form', class ProductForm extends HTMLElement {
    constructor() {
      super();
      this.timeout;
      this.form = this.querySelector('form');
      this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
      this.cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
      this.quantityInput = this.querySelector('.quantity__input');
      this.quickModal = this.closest('.quick-add');
      this.hideErrors = this.dataset.hideErrors === 'true';

      if (this.quantityInput) {
        this.quantityInput.addEventListener('error', this.validateQuantity.bind(this));
      }

      this.addToCartButtons = this.querySelectorAll('[data-add-to-cart]');
      if (document.querySelector('cart-drawer')) {
        this.addToCartButtons.forEach((submitButton) => {
          submitButton.setAttribute('aria-haspopup', 'dialog');
        });
      }

      this.onWindowResize = this.debounce(() => this.handleWindowResize.bind(this));
      this.productInfoWrapper =  this.closest('.product__info-wrapper');

      this.addToCartSection = document.querySelector('.product-single__meta');

      if (this.addToCartSection) {
        this.addToCartContent = this.addToCartSection.querySelector('.product__meta-grid');
        this.productSelectors = this.addToCartContent.querySelector('.product__meta-grid-item--selectors');
        this.lowStockNotification = this.addToCartContent.querySelector('[data-left-quantity]');
      }

      this.controlsGroupSubmitTrigger = this.querySelector('#data-controls-group-submit-trigger');
      this.controlsGroupSubmit = this.querySelector('[data-controls-group-submit]');
      this.goToCartButtons = this.querySelectorAll('[data-go-to-cart]');

      this.dynamicCheckoutWrap = this.querySelector('.product-form__dynamic-buttons');
      if (this.dynamicCheckoutWrap) {
        this.dynamicCheckoutWrap.addEventListener('click', (evt) => {
          evt.preventDefault();
          if (this.dynamicCheckoutWrap.classList.contains('product-form__dynamic-buttons--disable')) {
            if (!this.validateCustomProperties()) {
              this.handleErrorMessage(`${window.variantStrings.customPropertyError}`);
              this.handleButtonLoadingState(false);
            } else {
              this.dynamicCheckoutWrap.classList.remove('product-form__dynamic-buttons--disable');
            }
          } else {
            this.dynamicCheckoutWrap.classList.add('product-form__dynamic-buttons--loading');
            const unbrandedButtonClass = '.shopify-payment-button__button--unbranded';
            let shopifyButton = evt.target;
            if (!shopifyButton.classList.contains(unbrandedButtonClass)) shopifyButton = shopifyButton.closest(unbrandedButtonClass);

            if (shopifyButton) {
              shopifyButton.innerHTML = `<span class="product-form-loader" data-loader>
                <div class="loader-bounce">
                  <div class="bounce1"></div>
                  <div class="bounce2"></div>
                  <div class="bounce3"></div>
                </div>
              </span>`
              shopifyButton.dataset.loading = true;
            }
          }
        });
      }

      if (!this.quickModal) {
        this.onScrollHandler = this.onScroll.bind(this);
      }

      window.addEventListener('resize', this.onWindowResize);
      this.initBreakpoints();
    }

    initBreakpoints() {
      const self = this;

      enquire.register('screen and (max-width: 1000px)', {
        match: () => {
          window.addEventListener('scroll', self.onScrollHandler, false);
          self.bpSmall = true;
        },
        unmatch: () => {
          window.removeEventListener('scroll', self.onScrollHandler, false);
          self.bpSmall = false;
        }
      });
    }

    onScroll() {
      if (!this.controlsGroupSubmitTrigger) return;
      const elemTop = this.controlsGroupSubmitTrigger.getBoundingClientRect().top;
      const controlsIsFixed = this.controlsGroupSubmit.classList.contains('fix-controls-group--submit');

      if (controlsIsFixed && elemTop > -56) {
        requestAnimationFrame(this.resetAddToCartButton.bind(this));
      } else if (!controlsIsFixed && elemTop < -56 ) {
        requestAnimationFrame(this.stickyAddToCartButton.bind(this));
      }
    }

    resetAddToCartButton() {
      this.controlsGroupSubmit.classList.remove('fix-controls-group--submit');
    }

    stickyAddToCartButton() {
      this.controlsGroupSubmit.classList.add('fix-controls-group--submit');
    }

    handleWindowResize() {
      const addToCartHeight = this.addToCartSection.offsetHeight;
      this.addToCartSection.offsetHeight.style.minHeight = `${addToCartHeight}px`;
    }

    debounce(func, timeout = 300) {
      let timer;
      return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
      };
    }

    validateQuantity(evt) {
      evt.preventDefault();
      const quantityLimit = this.quantityInput.getAttribute('max');
      const lowStockIsInactive = !this.lowStockNotification || this.lowStockNotification.textContent === '';

      if (lowStockIsInactive) {
        this.handleErrorMessage(window.variantStrings.lowStockError.replace(
          '[quantity]',
          quantityLimit
        ));
      }
    }

    getValidationError() {
      let error = '';
      let fieldsetsRadios = Array.from(this.productSelectors.querySelectorAll('fieldset')) || [];
      let fieldsets = Array.from(this.productSelectors.querySelectorAll('select')) || [];

      if (fieldsets.length) {
        fieldsets = fieldsets.map((fieldset) => {
          const selectedIndex = fieldset.selectedIndex;
          const nameRegex = fieldset.dataset.name.match(/\[(.*?)\]/) || [];

          if (selectedIndex) {
            return {
              name: nameRegex[1],
              value: fieldset.value
            };
          } else {
            return {
              name: nameRegex[1]
            }
          }
        });
      }

      if (fieldsetsRadios.length) {
        fieldsetsRadios = fieldsetsRadios.map((fieldset) => {
          const inputChecked = Array.from(fieldset.querySelectorAll('input')).find((radio) => radio.checked);
          const name = fieldset.querySelector('input').dataset.name;

          if (inputChecked) {
            return {
              name: inputChecked.dataset.name,
              value: inputChecked.value
            };
          } else {
            return {
              name: name
            }
          }
        });
      }

      const options = fieldsetsRadios.concat(fieldsets);
      options.forEach((option) => {
        if (!option.value && option.name) {
          error = `${window.variantStrings.variantValidError} ${option.name.toLocaleLowerCase()}`;
        }
      });

      return error;
    }

    validateCustomProperties() {
      let checker = arr => arr.every(v => v === true);
      const productMetagrid = this.form.closest('.product__meta-grid');
      const customInputs = productMetagrid ? Array.from(productMetagrid.querySelectorAll(`.product_custom-options [aria-required]`)) : [];

      if (customInputs.length === 0) {
        return true;
      }

      const validationArray = customInputs.map((customInput) => {
        if (customInput.required) {
          return validateFormInput(customInput);
        }
      });

      return checker(validationArray);
    }

    onSubmitHandler(evt) {
      evt.preventDefault();

      this.handleErrorMessage();
      this.handleButtonLoadingState(true);

      if (!this.validateCustomProperties()) {
        this.handleErrorMessage(`${window.variantStrings.customPropertyError}`, true);
        this.handleButtonLoadingState(false);
        return false;
      }

      const config = fetchConfig('javascript');
      config.headers['X-Requested-With'] = 'XMLHttpRequest';
      delete config.headers['Content-Type'];

      const formData = new FormData(this.form);
      if (this.cart) {
        formData.append('sections', this.cart.getSectionsToRender().map((section) => section.id));
        formData.append('sections_url', window.location.pathname);
        this.cart.setActiveElement(document.activeElement);
      }
      config.body = formData;

      fetch(`${routes.cart_add_url}`, config)
        .then((response) => response.json())
        .then((response) => {
          if (response.status) {
            publish(PUB_SUB_EVENTS.cartError, {
              source: 'product-form',
              productVariantId: formData.get('id'),
              errors: response.description,
              message: response.message,
            });
            let errorMsg = response.description;

            if (!this.hideErrors) {
              const r = /All \d+/;
              const matchItemsLeft = errorMsg.match(r);
              const r2 = /You can't add more /i;
              const matchCantAdd = errorMsg.match(r2);
              const r3 = /is already sold out/i;
              const matchSoldOut = errorMsg.match(r3);

              if (matchItemsLeft && matchItemsLeft.length) {
                const itemsLeft = matchItemsLeft[0].replace('All ', '');
                errorMsg = `We only have ${itemsLeft} and they’re already in your cart!`;
                if (itemsLeft === '1') {
                  errorMsg = `We only have ${itemsLeft} and it's already in your cart!`;
                }
              } else if (matchSoldOut && matchSoldOut.length) {
                errorMsg = `This product is already sold out.`;
              }

              if (matchCantAdd && matchCantAdd.length) {
                errorMsg = `You can't add more of this item to your cart.`;
              }
            }

            this.handleButtonLoadingState(false);
            this.handleErrorMessage(errorMsg);
            return;
          } else if (!this.cart) {
            window.location = window.routes.cart_url;
            return;
          }

          let qtyValue = 1;
          if (this.quantityInput) qtyValue = this.quantityInput.value
          publish(PUB_SUB_EVENTS.cartUpdate, { source: 'product-form', productVariantId: formData.get('id') });

          if (this.bpSmall) {
            if (this.cart && this.cart.classList.contains('drawer')) {
              const quickAddModal = this.closest('quick-add-modal');
              if (quickAddModal) {
                document.body.addEventListener(
                  'modalClosed',
                  () => {
                    setTimeout(() => {
                      this.cart.renderContents(response, qtyValue);
                    });
                  },
                  { once: true }
                );
                quickAddModal.hide(true);
              } else {
                this.cart.renderContents(response, qtyValue);
              }
            } else {
              this.renderBubbleCart(response);
              this.showGoToCartButton();
            }
          } else if (this.cart) {
            const quickAddModal = this.closest('quick-add-modal');
            if (quickAddModal) {
              document.body.addEventListener(
                'modalClosed',
                () => {
                  setTimeout(() => {
                    this.cart.renderContents(response, qtyValue);
                  });
                },
                { once: true }
              );
              quickAddModal.hide(true);
            } else {
              this.cart.renderContents(response, qtyValue);
            }
          }
        })
        .catch((e) => {
          this.handleErrorMessage(`${window.cartStrings.error}`);
          console.error(e);
        })
        .finally(() => {
          if (!this.bpSmall || (this.cart && this.cart.classList.contains('drawer'))) {
            this.handleButtonLoadingState(false);
          }
        });
    }

    renderBubbleCart(response) {
      const cartIconBubble = document.getElementById('cart-icon-bubble');
      if (cartIconBubble) {
        const html = response.sections['cart-icon-bubble'];
        const sourceCartIcon = new DOMParser()
          .parseFromString(html, 'text/html')
          .querySelector('.shopify-section');
          cartIconBubble.innerHTML = sourceCartIcon.innerHTML;
      }
    }

    showGoToCartButton() {
      if (this.quickModal) this.quickModal.classList.add('quick-add--visible');
      this.goToCartButtons.forEach((goToCartButton) => {
        goToCartButton.classList.add('product-form__open-cart--fadein');
      });

      setTimeout(() => {
        this.handleButtonLoadingState(false);
      }, 500);

      setTimeout(() => {
        if (this.quickModal) this.quickModal.classList.remove('quick-add--visible');
        this.goToCartButtons.forEach((goToCartButton) => {
          goToCartButton.classList.remove('product-form__open-cart--fadein');
        });
      }, 5000);
    }

    handleButtonLoadingState(isLoading) {
      if (isLoading) {
        this.addToCartButtons.forEach((addToCart) => {
          addToCart.disabled = true;
          addToCart.setAttribute('aria-disabled', true);
          addToCart.classList.add('product-form__cart-submit--loading', 'btn--loading');
        });
        if (this.quickModal) this.quickModal.classList.add('quick-add--visible');
      } else {
        let activeButton = false;
        this.addToCartButtons.forEach((addToCart) => {
          addToCart.disabled = false;
          addToCart.removeAttribute('aria-disabled');
          addToCart.classList.remove('product-form__cart-submit--loading', 'btn--loading');
          if (addToCart.classList.contains('btn--load-error')) activeButton = true;
        });
        this.goToCartButtons.forEach((goToCartButton) => {
          if (goToCartButton.classList.contains('product-form__open-cart--fadein')) activeButton = true;
        });
        if (this.quickModal && !activeButton) this.quickModal.classList.remove('quick-add--visible');
      }
    }

    handleErrorMessage(errorMessage = false, linkToError) {
      if (this.hideErrors) return;
      this.errorMessageWrapper = this.errorMessageWrapper || this.querySelector('.product-form__error-message-wrapper');
      this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.product-form__error-message');
      this.errorButtonFixed = this.errorButtonFixed || this.querySelector('.product-form__error-message-wrapper.mobile--error');
      this.errorMessageFixed = this.errorButtonFixed ? this.errorButtonFixed.querySelector('.product-form__error-message') : null;

      if (errorMessage) {
        this.errorMessageWrapper.classList.remove('hidden');
        if (this.errorButtonFixed) {
          this.errorButtonFixed.classList.remove('mobile--error--hidden');
        }

        if (this.errorMessageWrapper.classList.contains('product-form__error-message--button-in')) {
          const btn = this.errorMessageWrapper.closest('.btn');
          const productCard = this.errorMessageWrapper.closest('product-card');
          btn.classList.add('btn--load-error');

          if (this.quickModal) this.quickModal.classList.add('quick-add--visible');

          if (productCard) {
            const hideButton = productCard.querySelector('.quick-add--mockup .quick-add__submit');
            const errorMessageWrapperElm = hideButton.querySelector('.product-form__error-message-wrapper');
            const errorMessageElm = errorMessageWrapperElm.querySelector('.product-form__error-message');
            hideButton.classList.add('btn--load-error');
            errorMessageWrapperElm.classList.remove('hidden');
            errorMessageElm.textContent = errorMessage;

            setTimeout(() => {
              errorMessageWrapperElm.classList.add('hidden');
              hideButton.classList.remove('btn--load-error');
            });
          }

          setTimeout(() => {
            if (this.quickModal) this.quickModal.classList.remove('quick-add--visible');
            this.errorMessageWrapper.classList.add('hidden');
            btn.classList.remove('btn--load-error');
          }, 5000);
        }

        this.errorMessage.textContent = errorMessage;

        if (this.errorMessageFixed) {
          this.errorMessageFixed.textContent = errorMessage;
        }

        if (linkToError) {
          this.errorMessage.textContent = '';
          const iconStyle = this.errorMessage.dataset.iconStyle;
          const linkToError = document.createElement('a');
          linkToError.setAttribute('class','product-form__error-message__link');
          linkToError.setAttribute('href','#top');
          linkToError.textContent = ` ${errorMessage}`;
          const icon = document.createElement('i');
          icon.setAttribute('class', `icon ${iconStyle} fa-wrench`);
          // linkToError.prepend(icon);
          this.errorMessage.appendChild(linkToError);
          linkToError.addEventListener('click', (evt) => {
            evt.preventDefault();
            window.scrollTo({top: 0, behavior: 'smooth'});
          }, false);
        }
      } else {
        this.errorMessageWrapper.classList.add('hidden');
        if (this.errorButtonFixed) {
          this.errorButtonFixed.classList.add('mobile--error--hidden');
        }
      }
    }
  });
}
