class VariantSelects extends HTMLElement {
  constructor() {
    super();
    backgroundCheck('[data-adaptive-text]');
    this.sectionId = this.dataset.section;
    if (this.dataset.block) {
      this.sectionId = `${this.dataset.section}${this.dataset.block}`;
    }
    this.productGallery = document.querySelector(`.product-single__gallery-${this.sectionId}`);

    this.initDropdownSize();
    this.initColorChips();
    this.initVariant();
    this.addEventListener('change', this.onVariantChange);
  }

  initDropdownSize() {
    const dropdownList = this.querySelectorAll(".product-form__input--dropdown");
    let arrayList = [];
    for (let i = 0; i < dropdownList.length; i++) {
      const eachList = dropdownList[i].offsetWidth;
      arrayList.push(eachList);
      const MaxWidth = Math.max.apply(null, arrayList);

      if (MaxWidth > 0) {
        dropdownList[i].style.width = MaxWidth +"px";
        dropdownList[i].querySelector('.select').style.width = MaxWidth +"px";
      }
    }
  }

  initVariant() {
    this.updateOptions();
    this.updateMasterId();
    this.updateVariantInput();
    this.updateSoldOutVariants();
    this.updateSoldOutSibling();
    this.updateAddButton();
    this.updatePickupAvailability();
    // this.updateLimitQuantity();

    // document.body.dispatchEvent(new CustomEvent('product:variant-init', {
    //   detail: {
    //     currentVariant: this.currentVariant,
    //     productData: this.productData
    //   }
    // }));
  }

  onVariantChange() {
    this.updateOptions();
    this.updateMasterId();
    this.updateSoldOutVariants();
    this.updateSoldOutSibling();
    this.updateAddButton();
    this.updatePickupAvailability();
    this.removeErrorMessage();

    if (!this.currentVariant) {
      this.setUnavailable();
    } else {
      this.updateMedia();
      this.updateURL();
      this.updateVariantInput();
      this.renderProductInfo();
      this.updateLimitQuantity();
    }
  }

  updateOptions() {
    let fieldOptions = Array.from(this.querySelectorAll('.product-meta-option'));

    fieldOptions = fieldOptions.map((fieldOption) => {
      const isFieldsetRadio = fieldOption.dataset.selectorButton;
      const isFieldsetCheckbox = fieldOption.dataset.selectorCheckbox;

      if (isFieldsetRadio) {
        const inputChecked = Array.from(fieldOption.querySelectorAll('input')).find((radio) => radio.checked);
        const selectedColorStatus = fieldOption.querySelector('.selected-status--color');

        if (inputChecked) {
          if (selectedColorStatus) {
            selectedColorStatus.textContent = inputChecked.value;
          }

          return {
            name: inputChecked.dataset.name,
            value: inputChecked.value
          };
        }

        return {
          name: fieldOption.querySelector('input').dataset.name,
          value: null
        };
      } else if (isFieldsetCheckbox) {
        const inputChecked = fieldOption.querySelector('input');
        const checkBoxValue = inputChecked.checked ? "Yes" : "No";

        return {
          name: inputChecked.dataset.name,
          value: checkBoxValue
        };
      } else {
        const selectedIndex = fieldOption.selectedIndex;
        const nameRegex = fieldOption.dataset.name.match(/\[(.*?)\]/);

        if (selectedIndex) {
          return {
            name: nameRegex[1],
            value: fieldOption.value
          };
        }

        return {
          name: nameRegex[1],
          value: null
        };
      }
    });

    this.options = fieldOptions;
  }

  updateMasterId() {
    this.getVariantData();
    const availableOptions = this.options.every((option) => option.value != null);
    if (!availableOptions) {
      this.currentVariant = null;
      return;
    }
    this.currentVariant = this.variantData.find((variant) => {
      return !variant.options.map((option, index) => {
        if (this.options[index].value) {
          return this.options[index].value === option;
        }
        return true;
      }).includes(false);
    });
  }

  initColorChips() {
    let fieldsetsColorRadios = Array.from(this.querySelectorAll('.product-meta-selector--color label')) || [];

    if (fieldsetsColorRadios.length) {
      fieldsetsColorRadios.forEach((field) => {
        const backgroundColor = field.querySelector('.selector-color-square').style.backgroundColor;
        const backgroundImage = field.querySelector('.selector-color-square').style.backgroundImage;

        if (!backgroundImage && !backgroundColor) {
          field.classList.add('single-option--no-color');
        }
      })
    }
  }

  updateMedia() {
    if (!this.currentVariant) return;
    if (!this.currentVariant.featured_media) return;

    const mediaGallery = document.getElementById(`MediaGallery-${this.sectionId}`);
    if (!mediaGallery) return;
    mediaGallery.setActiveMedia(`${this.sectionId}-${this.currentVariant.featured_media.id}`, this.productData.options, this.currentVariant);
  }

  updateURL() {
    if (!this.currentVariant || this.dataset.updateUrl === 'false') return;
    window.history.replaceState({ }, '', `${this.dataset.url}?variant=${this.currentVariant.id}`);
  }

  updateVariantInput() {
    if (!this.currentVariant) return;
    const productForms = document.querySelectorAll(`#product-form-${this.sectionId}, #product-form-installment`);
    productForms.forEach((productForm) => {
      const input = productForm.querySelector('input[name="id"]');
      input.value = this.currentVariant.id;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  updatePickupAvailability() {
    const pickUpAvailability = document.querySelector(`pickup-availability.pickup-availability--${this.sectionId}`);
    if (!pickUpAvailability) return;

    if (this.currentVariant && this.currentVariant.available) {
      if (pickUpAvailability.fetchAvailability) {
        pickUpAvailability.fetchAvailability(this.currentVariant.id);
      }
    } else {
      pickUpAvailability.removeAttribute('available');
      pickUpAvailability.innerHTML = '';
    }
  }

  removeErrorMessage() {
    const section = this.closest('section');
    if (!section) return;

    const productForm = section.querySelector('product-form');
    if (productForm) productForm.handleErrorMessage();
  }

  renderProductInfo() {
    let sectionId = this.dataset.section;
    let productUrl = this.dataset.url;

    if (this.dataset.originalSection) {
      const productElement = document.querySelector('section[id^="MainProduct-"]');
      const [path, searchParams] = productUrl.split('?');

      if (productElement) sectionId = productElement.dataset.section;
      productUrl = path;
    }

    fetch(`${productUrl}?variant=${this.currentVariant.id}&section_id=${sectionId}`)
      .then((response) => response.text())
      .then((responseText) => {
        const priceId = `price-${this.sectionId}`;
        const skuId = `sku-${this.sectionId}`;
        const html = new DOMParser().parseFromString(responseText, 'text/html');
        const destinationPrice = document.getElementById(priceId);
        const destinationSku = document.getElementById(skuId);
        let sourcePrice = html.getElementById(priceId);
        let sourceSku = html.getElementById(skuId);

        if (!sourcePrice) sourcePrice = html.getElementById(`price-${sectionId}`);
        if (!sourceSku) sourceSku = html.getElementById(`sku-${sectionId}`);

        if (sourcePrice && destinationPrice) destinationPrice.innerHTML = sourcePrice.innerHTML;
        if (sourceSku && destinationSku) destinationSku.innerHTML = sourceSku.innerHTML;

        const price = document.getElementById(`price-${this.sectionId}`);
        if (price) price.classList.remove('visibility-hidden');

        this.updateAddButton();
      });
  }

  updateLimitQuantity() {
    const quantityInput = document.getElementById(`QuantityInput-${this.sectionId}`);
    if (quantityInput) {
      quantityInput.updateLimitQuantity(this.currentVariant);
    }
  }

  getVariantsFromOptions(variantsArray, optionName) {
    const availableVariants = variantsArray.filter((variant) => {
      const variantWithOption = !variant.options.map((variantOption, optionIndex) => {
        const variantName = this.productData.options[optionIndex].toLowerCase();

        if (variantName === optionName) {
          return true;
        }

        const selectedOption =  this.options.find((opt) => {
          const isTheSameOption = variantName === opt.name.toLowerCase();
          return isTheSameOption && (!opt.value || opt.value === variantOption);
        });

        if (selectedOption) {
          return true;
        }

        return false;
      }).includes(false);

      return variantWithOption;
    });

    const soldOutVariants = availableVariants.filter((availableVariant) => {
      return !availableVariant.available;
    });

    return {
      availableVariants,
      soldOutVariants
    };
  }

  camelize(str) {
    const regex = /[A-Z\xC0-\xD6\xD8-\xDE]?[a-z\xDF-\xF6\xF8-\xFF]+|[A-Z\xC0-\xD6\xD8-\xDE]+(?![a-z\xDF-\xF6\xF8-\xFF])|\d+/g;
    const inputArray = str.match(regex);
    let result = "";

    if (inputArray) {
      for(let i = 0 , len = inputArray.length; i < len; i++) {
        let currentStr = inputArray[i];
        // convert first letter to upper case (the word is in lowercase)
        let tempStr = currentStr.substr(0, 1).toUpperCase() + currentStr.substr(1);
        result +=tempStr;
      }
    } else {
      result = str;
    }

    return result;
  }

  updateSoldOutVariants() {
    let variantsWithOptions = this.variantData;
    let unavailableVariants = [];
    const productOptions = this.productData.options;

    variantsWithOptions = variantsWithOptions.filter((variant) => {
      const variantWithOption = !variant.options.map((option, index) => {
        const selectedOptionName = productOptions[index].toLowerCase();
        const selectedOption =  this.options.find((opt) => {
          const isTheSameOption = selectedOptionName === opt.name;
          return isTheSameOption && (!opt.value || opt.value === option);
        });

        if (selectedOption) {
          return true;
        }

        return false;
      }).includes(false);

      return variantWithOption;
    });

    unavailableVariants = variantsWithOptions.filter((variant) => {
      return !variant.available;
    });

    optionsLoop:
      for (let index = 0; index < productOptions.length; index++) {
        const optionName = productOptions[index].toLowerCase();
        const camelizeOptionName = this.camelize(optionName);
        const fieldOption = this.querySelector(`.product-meta-option--${camelizeOptionName}`);

        if (fieldOption) {
          const isFieldsetRadio = fieldOption.dataset.selectorButton;

          if (isFieldsetRadio) {
            const inputOptions = Array.from(fieldOption.querySelectorAll('input'));

            fieldLoop:
              for (let i = 0; i < inputOptions.length; i++) {
                const inputOption = inputOptions[i];
                const value = inputOption.value;

                if (!value) {
                  continue;
                }

                const variantsFromInput = this.variantData.filter((v) => {
                  return v.options.find((opt) => opt === value);
                });
                const unavailableFromInput = variantsFromInput.filter((v) => {
                  return !v.available;
                });
                const unavailableOptions = unavailableVariants.filter((v) => {
                  return v.options.find((opt) => opt === value);
                });

                inputOption.dataset.disabled = false;

                if (variantsFromInput.length === unavailableFromInput.length) {
                  inputOption.dataset.disabled = true;
                } else if (unavailableOptions.length) {
                  const availableOptions = variantsWithOptions.filter((v) => {
                    return v.options.find((opt) => opt === value);
                  });

                  const hasSoldOutOptions = unavailableOptions.length === availableOptions.length;

                  if (hasSoldOutOptions) {
                    inputOption.dataset.disabled = true;
                  }
                } else if (unavailableFromInput.length) {
                  const variantsFromOptions = this.getVariantsFromOptions(variantsFromInput, optionName);

                  if (variantsFromOptions.soldOutVariants.length) {
                    const isSoldOut = variantsFromOptions.soldOutVariants.length === variantsFromOptions.availableVariants.length;

                    if (isSoldOut) {
                      inputOption.dataset.disabled = true;
                    }
                  }
                }
              }
          } else {
            const selectOptions = Array.from(fieldOption.querySelectorAll('option'));

            fieldLoop:
              for (let i = 0; i < selectOptions.length; i++) {
                const selectOption = selectOptions[i];
                const value = selectOption.value;

                if (!value) {
                  continue;
                }

                const variantsFromInput = this.variantData.filter((v) => {
                  return v.options.find((opt) => opt === value);
                });
                const unavailableFromInput = variantsFromInput.filter((v) => {
                  return !v.available;
                });
                const unavailableOptions = unavailableVariants.filter((v) => {
                  return v.options.find((opt) => opt === value);
                });

                selectOption.dataset.disabled = false;

                if (variantsFromInput.length === unavailableFromInput.length) {
                  selectOption.dataset.disabled = true;
                } else if (unavailableOptions.length) {
                  const availableOptions = variantsWithOptions.filter((v) => {
                    return v.options.find((opt) => opt === value);
                  });

                  const hasSoldOutOptions = unavailableOptions.length === availableOptions.length;
                  if (hasSoldOutOptions) {
                    selectOption.dataset.disabled = true;
                  }
                } else if (unavailableFromInput.length) {
                  const variantsFromOptions = this.getVariantsFromOptions(variantsFromInput, optionName);

                  if (variantsFromOptions.soldOutVariants.length) {
                    const isSoldOut = variantsFromOptions.soldOutVariants.length === variantsFromOptions.availableVariants.length;

                    if (isSoldOut) {
                      selectOption.dataset.disabled = true;
                    }
                  }
                }
              }
          }
        }
      }
  }

  updateSoldOutSibling() {
    const variant = this.currentVariant;
    const productSiblings = document.getElementById(`product-siblings-${this.sectionId}`);
    if (!productSiblings) return;

    const currentSibling = productSiblings.querySelector('.single-option-selector__option-wrap--checked');
    if (!currentSibling) return;
    const currentOptionSelector = currentSibling.querySelector('.single-option-selector__option');
    const currentSiblingOption = currentSibling.querySelector('.product__siblings__option');

    if (!variant ) {
      currentOptionSelector.classList.remove('sold-out');
      currentSiblingOption.classList.remove('sold-out');
      return;
    }

    if (variant.available ) {
      currentOptionSelector.classList.remove('sold-out');
      currentSiblingOption.classList.remove('sold-out');
    } else {
      currentOptionSelector.classList.add('sold-out');
      currentSiblingOption.classList.add('sold-out');
    }
  }

  updateAddButton() {
    const variant = this.currentVariant;
    const productForm = document.getElementById(`product-form-${this.sectionId}`);
    if (!productForm) return;

    const addButton = productForm.querySelector('[data-add-to-cart]');
    const addButtonText = productForm.querySelector('[data-add-to-cart-text]');
    if (!addButton) return;

    const variantClassSoldOut = 'product-form--variant-sold-out';
    const formParentElement = productForm.closest('.product-form__buy-buttons');
    const productMetaPrice = formParentElement ? formParentElement.querySelector('[data-product-meta-price]') : null;
    const leftQuantityElm = productMetaPrice ? productMetaPrice.querySelector('[data-left-quantity]') : null;

    if (productMetaPrice) productMetaPrice.classList.add('meta-price--hidden');
    if (!variant ) {
      addButton.setAttribute('aria-disabled', true);
      addButton.setAttribute('aria-label', window.variantStrings.unavailable);
      addButton.setAttribute('disabled', true);
      addButtonText.textContent = window.variantStrings.unavailable;
      productForm.classList.add(variantClassSoldOut);

      return;
    };

    if (variant.available ) {
      addButton.removeAttribute('aria-disabled');
      addButton.removeAttribute('disabled');
      addButton.setAttribute('aria-label', window.variantStrings.addToCart);
      addButtonText.textContent = window.variantStrings.addToCart;
      productForm.classList.remove(variantClassSoldOut);
      if (productMetaPrice) productMetaPrice.classList.remove('meta-price--hidden');

      if (leftQuantityElm) {
        const quantity = variant.inventory_quantity;
        const quantityThreshold = parseInt(leftQuantityElm.dataset.quantityThreshold);
        const isPreorder = variant.available && quantity <= 0 && variant.preorder_item;

        leftQuantityElm.parentElement.classList.remove('product-form__selected-status--red', 'product-form__selected-status--orange');

        if (isPreorder) {
          leftQuantityElm.textContent = window.variantStrings.preorder;
          leftQuantityElm.parentElement.classList.add('product-form__selected-status--orange');
        } else if (quantity > 0 && quantity <= quantityThreshold) {
          const quantityLeft = window.variantStrings.lowStock.replace(
            '[quantity]',
            quantity
          );
          leftQuantityElm.textContent = quantityLeft;
          leftQuantityElm.parentElement.classList.add('product-form__selected-status--red');
        } else {
          leftQuantityElm.textContent = window.variantStrings.inStock;
        }

        const deliveryElm = formParentElement ? formParentElement.querySelector('[data-delivery-message]') : null;
        if (deliveryElm) {
          const leveringstid = variant.leveringstid || '';
          const defaultMessage = deliveryElm.dataset.defaultMessage || '';
          deliveryElm.textContent = leveringstid || defaultMessage;
          deliveryElm.classList.toggle('product-form__stock-message--preorder', isPreorder);
        }
      }
    } else {
      // Variant is sold out
      addButton.setAttribute('disabled', true);
      addButtonText.textContent = window.variantStrings.soldOut;
      productForm.classList.add(variantClassSoldOut);
      if (leftQuantityElm) leftQuantityElm.innerHTML = '';
    }
  }

  setUnavailable() {
    const button = document.getElementById(`product-form-${this.sectionId}`);
    const addButton = button.querySelector('[name="add"]');
    const price = document.getElementById(`price-${this.sectionId}`);

    if (!addButton) return;
    addButton.textContent = window.variantStrings.unavailable;
    if (price) price.classList.add('visibility-hidden');
  }

  getVariantData() {
    this.productData = this.productData || JSON.parse(this.querySelector('[type="application/json"]').textContent);
    this.variantData = this.variantData || this.productData.variants;

    this.variantData.forEach((variant) => {
      variant.in_stock = variant.inventory_quantity > 0;
      variant.preorder_item = variant.inventory_quantity <= 0 && variant.available === true;
      variant.sold_out = variant.inventory_quantity <= 0 && variant.available === false;
    });

    return this.variantData;
  }
}

customElements.define('variant-selects', VariantSelects);

class VariantRadios extends VariantSelects {
  constructor() {
    super();
  }

  updateOptions() {
    let fieldsets = Array.from(this.querySelectorAll('fieldset'));

    fieldsets = fieldsets.map((fieldset) => {
      const isFieldsetCheckbox = fieldset.dataset.selectorCheckbox;
      const inputChecked = isFieldsetCheckbox ? fieldset.querySelector('input') : Array.from(fieldset.querySelectorAll('input')).find((radio) => radio.checked);
      const selectedColorStatus = fieldset.querySelector('.selected-status--color');

      if (inputChecked && !isFieldsetCheckbox) {
        if (selectedColorStatus) {
          selectedColorStatus.textContent = inputChecked.value;
        }

        return {
          name: inputChecked.dataset.name,
          value: inputChecked.value
        };
      } else if (isFieldsetCheckbox) {
        const checkBoxValue = inputChecked.checked ? "Yes" : "No";
        return {
          name: inputChecked.dataset.name,
          value: checkBoxValue
        };
      }

      return {
        name: fieldset.querySelector('input').dataset.name,
        value: null
      };
    });

    this.options = fieldsets;
  }
}

customElements.define('variant-radios', VariantRadios);

class ProductCheckboxGroup extends HTMLElement {
  constructor() {
    super();
    const productMetagrid = this.closest('.product__meta-grid');
    this.productForm = productMetagrid.querySelector('product-form');
    this.dynamicCheckoutWrap = productMetagrid.querySelector('.product-form__dynamic-buttons');
    const customOptionElm = this.parentElement;
    const errorMessage = customOptionElm.querySelector('.input-error-message');
    const inputElms = this.querySelectorAll('input[type=checkbox]');
    const mainInputELm = this.querySelector('input[type=hidden]');
    const minLimit = this.dataset.min ? parseInt(this.dataset.min) : null;
    const maxLimit = this.dataset.max ? parseInt(this.dataset.max) : null;

    inputElms.forEach((inputElm) => {
      inputElm.addEventListener('change', (evt) => {
        const checkedInputs = this.querySelectorAll('input[type=checkbox]:checked');
        let checkedString = '';

        if (minLimit && checkedInputs.length >= minLimit) {
          const inputError = this.querySelector('input.input--error');
          if (errorMessage) errorMessage.classList.add('hide');
          if (inputError) inputError.classList.remove('input--error');
          let activeErrors = productMetagrid.querySelectorAll('.input--error');

          if (activeErrors.length === 0) {
            this.productForm.handleErrorMessage();
          }

          const requiredInputs = Array.from(productMetagrid.querySelectorAll('input[aria-required]:not(.checkbox-group__input)'));
          let checker = arr => arr.every(v => v === true);
          const checkValues = requiredInputs.map((requiredInput) => {
            if (requiredInput.value == '' || (requiredInput.type == 'checkbox' && !requiredInput.checked)) {
              return false;
            }
            return true;
          });
          const areValidInputs = checker(checkValues);
          if (areValidInputs) {
            this.dynamicCheckoutWrap.classList.remove('product-form__dynamic-buttons--disable');
          } else {
            this.dynamicCheckoutWrap.classList.add('product-form__dynamic-buttons--disable');
          }
        } else if (minLimit && checkedInputs.length < minLimit) {
          this.dynamicCheckoutWrap.classList.add('product-form__dynamic-buttons--disable');
        }

        if (maxLimit) {
          const disableInput = checkedInputs.length >= maxLimit;
          const uncheckedInputs = this.querySelectorAll('input[type=checkbox]:not(:checked)');
          uncheckedInputs.forEach((uncheckedInput) => {
            uncheckedInput.disabled = disableInput;
          });
        }

        checkedInputs.forEach((checkedInput) => {
          if (checkedString.length > 0) {
            checkedString += ',';
          }

          checkedString += checkedInput.value;
        });

        mainInputELm.value = checkedString;
      });
    });

  }
}

customElements.define('product-checkbox-group', ProductCheckboxGroup);

class DateField extends HTMLElement {
  constructor() {
    super();
    if (!this.dataset.days) return;
    const daysFromCurrentDate = parseInt(this.dataset.days);
    const currentDay = new Date();
    const forwardDays = currentDay.getDate() + daysFromCurrentDate;
    currentDay.setDate(forwardDays);

    const inputDate = this.querySelector('input[type="date"]');
    const m = currentDay.getMonth() + 1;
    const monthValue = m.toLocaleString('en-US', {
      minimumIntegerDigits: 2,
      useGrouping: false
    });
    const dateValue = currentDay.getDate().toLocaleString('en-US', {
      minimumIntegerDigits: 2,
      useGrouping: false
    });
    const newDateAllowed = `${currentDay.getFullYear()}-${monthValue}-${dateValue}`;
    inputDate.value = newDateAllowed;
    inputDate.min = newDateAllowed;
  }

}

customElements.define('date-field', DateField);

class ProductCustomOption extends HTMLElement {
  constructor() {
    super();
    this.optionName = this.dataset.optionName;
    this.optionType = this.dataset.type;
    this.iconStyle = this.dataset.iconStyle;
    const requiredInput = this.querySelector('[aria-required]');
    if (requiredInput) this.validateError(requiredInput);
    if (this.optionType === 'swatches') this.setColorSwatch();
    if (this.optionType === 'color-picker') this.setColorPicker();
    if (this.optionType === 'image-upload') {
      this.setDragAndDrop();
    }

    if (this.optionType === 'single-line' || this.optionType === 'multi-line') {
      const fieldWrapper = this.querySelector('.field-wrapper__input');
      if (fieldWrapper.getAttribute('maxlength')) {
        this.maxLenghtRemaining(fieldWrapper);
      }
    }
  }

  setColorSwatch() {
    const optionInputs = [...this.querySelectorAll(`input[name="properties[${this.optionName}]"]`)];
    optionInputs.forEach((optionInput) => {
      optionInput.addEventListener('change', (evt) => {
        const currentInput = evt.currentTarget;
        const selectedColorStatus = this.querySelector('.selected-status--color');

        if (currentInput.checked) {
          if (selectedColorStatus) selectedColorStatus.textContent = currentInput.value;
        }
      })
    });
  }

  setColorPicker() {
    const colorInput = this.querySelector('input[type="color"]');

    colorInput.addEventListener('change', (evt) => {
      const currentInput = evt.currentTarget;
      const selectedColorStatus = this.querySelector('.selected-status--color');
      const customField = this.querySelector('.field-color__custom');
      if (selectedColorStatus) selectedColorStatus.textContent = currentInput.value;
      if (customField) customField.style.backgroundColor = currentInput.value;
    });
  }

  maxLenghtRemaining(fieldWrapper) {
    const maxlengthCountElm = this.querySelector('.requirement-form span');
    if (maxlengthCountElm) {
      const maxLength = fieldWrapper.maxLength;
      maxlengthCountElm.textContent = maxLength - fieldWrapper.value.length;
      fieldWrapper.addEventListener('keyup', () => {
        const characterCount = maxLength - fieldWrapper.value.length;
        maxlengthCountElm.textContent = characterCount;
      });
    }
  }

  validateError(requiredInput) {
    const productMetagrid = requiredInput.closest('.product__meta-grid');
    let eventName = 'keyup';

    if (requiredInput.tagName === 'SELECT' || requiredInput.type === 'checkbox' || requiredInput.type === 'file' ) {
      eventName = 'change';
    }

    this.productForm = productMetagrid.querySelector('product-form');
    this.dynamicCheckoutWrap = productMetagrid.querySelector('.product-form__dynamic-buttons');

    requiredInput.addEventListener(eventName, (event) => {
      let currentInput = requiredInput;

      if (currentInput.value == '' || (currentInput.type == 'checkbox' && !currentInput.checked)) {
        this.dynamicCheckoutWrap.classList.add('product-form__dynamic-buttons--disable');
      }

      if (currentInput.classList.contains('input--error')) {
        if (currentInput.classList.contains('checkbox-group__input')) return;
        if (currentInput.type == 'checkbox' && !currentInput.checked) return;
        removeErrorStyle(currentInput);

        let activeErrors = productMetagrid.querySelectorAll('.input--error');

        if (activeErrors.length === 0) {
          this.dynamicCheckoutWrap.classList.remove('product-form__dynamic-buttons--disable');
          this.productForm.handleErrorMessage();
        }
      }
    });
  }

  formatFileType(file) {
    const type = file.type;
    const splitType = type.split('/');
    const subtype = splitType[1];
    let formattedType = subtype;
    let handleSubtype = subtype.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '').replace(/^-/, '');
    const applicationType = {
      'pdf': subtype.toUpperCase(),
      'vnd-ms-excel': 'Excel',
      'vnd-openxmlformats-officedocument-spreadsheetml-sheet': 'Excel',
      'vnd-ms-powerpoint': 'PowerPoint',
      'vnd-openxmlformats-officedocument-presentationml-presentation': 'PowerPoint',
      'x-msvideo': 'AVI',
      'html': 'HTML',
      'msword': 'Word',
      'vnd-openxmlformats-officedocument-wordprocessingml-document': 'Word',
      'csv': 'CSV',
      'mpeg': 'MP3 Audio',
      'webm': 'WEBM Audio',
      'mp4-video': 'MP4 Video',
      'mpeg-video': 'MPEG Video',
      'webm-video': 'WEBM Video',
      'vnd-rar': 'RAR archive',
      'rtf': 'RTF',
      'plain': 'Text',
      'wav': 'WAV',
      'vnd-adobe-photoshop': 'Adobe Photoshop',
      'postscript': 'Adobe Illustrator'
    };

    if (type.startsWith('image/')) {
      if (applicationType[handleSubtype]) {
        formattedType = applicationType[handleSubtype];
      } else {
        formattedType = splitType[1].toUpperCase();
        formattedType = `${formattedType} Image`;
      }
    } else if (type.startsWith('video/')) {
      const handleVideoSubtype = `${handleSubtype}-video`
      if (applicationType[handleVideoSubtype]) formattedType = applicationType[handleVideoSubtype];
    } else {
      if (applicationType[handleSubtype]) formattedType = applicationType[handleSubtype];
    }

    return formattedType;
  }

  calculateSize(file) {
    let numberOfBytes = file.size;
    if (numberOfBytes === 0) return 0;

    const units = [
      "B",
      "KB",
      "MB",
      "GB",
      "TB",
      "PB",
      "EB",
      "ZB",
      "YB"
    ];

    const exponent = Math.min(
      Math.floor(Math.log(numberOfBytes) / Math.log(1024)),
      units.length - 1,
    );
    const approx = numberOfBytes / 1024 ** exponent;
    const output =
      exponent === 0
        ? `${numberOfBytes} bytes`
        : `${approx.toFixed(2)} ${units[exponent]}`;

    return output;
  }

  getIconName(file) {
    const fileName = file.name;
    const type = file.type;
    let iconName = 'fa-file';

    //excel
    if ( /\.(xls?x|csv)$/i.test(fileName) ) {
      iconName = 'fa-file-excel';
    }
    //word
    if ( /\.(doc?x)$/i.test(fileName) ) {
      iconName = 'fa-file-word';
    }
    //ppt
    if ( /\.(ppt?x)$/i.test(fileName) ) {
      iconName = 'fa-file-powerpoint';
    }
    //txt
    if ( /\.(txt)$/i.test(fileName) ) {
      iconName = 'fa-file-text';
    }
    //pdf
    if ( /\.(pdf)$/i.test(fileName) ) {
      iconName = 'fa-file-pdf';
    }
    //video
    if (type.startsWith('video/')) {
      iconName = 'fa-file-video';
    }
    //audio
    if (type.startsWith('audio/')) {
      iconName = 'fa-file-audio';
    }

    return iconName;
  }

  preview(dropZoneWrapElm, file) {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      const inputElm = dropZoneWrapElm.querySelector('.drop-zone__input');
      let thumbnailElement = dropZoneWrapElm.querySelector('.drop-zone__thumb');
      let preview = dropZoneWrapElm.querySelector('.dd-thumbnail');
      let fileInfo = dropZoneWrapElm.querySelector('.dd-file-info');

      if (!thumbnailElement) {
        thumbnailElement = document.createElement('div');
        thumbnailElement.classList.add('drop-zone__thumb');
        preview = document.createElement('div'); //div to show the image or icon
        fileInfo = document.createElement('div'); //to show the name and button to remove
        fileInfo.setAttribute('class','dd-file-info');
        preview.setAttribute('class','dd-thumbnail');

        const fileInfoText = document.createElement('div');
        fileInfoText.setAttribute('class','dd-file-info__text');
        const spanTitle = document.createElement('span');
        const spanFileType = document.createElement('span');
        spanTitle.setAttribute('class','dd-file-info__title');
        spanFileType.setAttribute('class','dd-file-info__type');

        const btnRemove = document.createElement('button');
        const btnIcon = document.createElement('i');
        btnRemove.setAttribute('class','btn--link');
        btnIcon.setAttribute('class',`icon ${this.iconStyle} fa-trash-can`);
        btnRemove.appendChild(btnIcon);
        btnRemove.addEventListener('click', (evt) => {
          evt.preventDefault();
          inputElm.value = '';
          dropZoneWrapElm.classList.remove('drop-zone-wrap--inactive');
          thumbnailElement.parentNode.removeChild(thumbnailElement);
        }, false);

        thumbnailElement.appendChild(preview);
        fileInfoText.appendChild(spanTitle);
        fileInfoText.appendChild(spanFileType);
        fileInfo.appendChild(fileInfoText);
        fileInfo.appendChild(btnRemove);
        thumbnailElement.appendChild(fileInfo);
        dropZoneWrapElm.classList.add('drop-zone-wrap--inactive');
        dropZoneWrapElm.appendChild(thumbnailElement);
      }

      const spanFileName = fileInfo.querySelector('.dd-file-info__title');
      const fileName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      spanFileName.textContent = fileName;
      const spanFileType = fileInfo.querySelector('.dd-file-info__type');
      spanFileType.textContent = `${this.formatFileType(file)} • ${this.calculateSize(file)}`;

      preview.innerHTML = '';
      preview.removeAttribute('style');

      if ( /\.(jpe?g|png|gif|webp)$/i.test(file.name) ) {
        preview.setAttribute('style',`background-image:url("${reader.result}"); width: 40px;`);
      } else {
        const icon = document.createElement('i');
        icon.setAttribute('class', `icon ${this.iconStyle} ${this.getIconName(file)}`);
        preview.appendChild(icon);
      }

      thumbnailElement.setAttribute('data-ts-file', file.name);
    }, false);

    reader.readAsDataURL(file);
  }

  setDragAndDrop() {
    const inputElement = this.querySelector('.drop-zone__input');
    const dropZoneWrapElm = inputElement.closest('.drop-zone-wrap');
    const dropZoneElement = inputElement.closest('.drop-zone');

    dropZoneElement.addEventListener('click', (e) => {
      inputElement.click();
    });

    inputElement.addEventListener('change', (e) => {
      if (inputElement.files.length) {
        const dropZone = inputElement.closest('.drop-zone-wrap');
        const errorMessage = dropZone.querySelector('.input-error-message');
        const file = inputElement.files[0];
        const filesize = ((file.size/1024)/1024).toFixed(4);

        dropZone.classList.remove('drop-zone-wrap--error');
        if (errorMessage) errorMessage.classList.add('hide');

        if (filesize > 5) {
          inputElement.value = '';
          dropZone.classList.add('drop-zone-wrap--error');
          if (errorMessage) {
            errorMessage.classList.remove('hide');
            errorMessage.querySelector('span:not(.visually-hidden)').textContent = window.variantStrings.fileSizeError;
          }
          return;
        }

        this.preview(dropZoneWrapElm, file);
      }
    });

    dropZoneElement.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZoneElement.classList.add('drop-zone--over');
    });

    ["dragleave", "dragend"].forEach((type) => {
      dropZoneElement.addEventListener(type, (e) => {
        dropZoneElement.classList.remove('drop-zone--over');
      });
    });

    dropZoneElement.addEventListener('drop', (e) => {
      e.preventDefault();

      if (e.dataTransfer.files.length) {
        inputElement.files = e.dataTransfer.files;
        this.preview(dropZoneWrapElm, e.dataTransfer.files[0]);
      }

      dropZoneElement.classList.remove('drop-zone--over');
    });
  }
}

customElements.define('product-custom-option', ProductCustomOption);
