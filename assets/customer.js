const selectors = {
  customerAddresses: '[data-customer-addresses]',
  addressCountrySelect: '[data-address-country-select]',
  deleteAddressButton: 'button.address-delete'
};

const attributes = {
  expanded: 'aria-expanded',
  confirmMessage: 'data-confirm-message'
};

function validateStringEmail (email) {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

function validateFormInput (inputElement) {
  const inputType = inputElement.getAttribute('type');
  let isValid = false;
  let errorTxt;

  switch (inputType) {
    case 'email':
      isValid = validateStringEmail(inputElement.value);
      errorTxt = inputElement.value === '' ? window.loginStrings.errorEmailRequired : window.loginStrings.errorEmailInvalid;
      break;
    case 'password':
      if (inputElement.id === 'CustomerPassword') {
        isValid = inputElement.value !== '';
        errorTxt = window.loginStrings.errorPasswordRequired;
      } else {
        isValid = inputElement.value !== '' && inputElement.value.length >= 5;
        errorTxt = inputElement.value === '' ? window.loginStrings.errorPasswordRequired : window.loginStrings.errorPasswordTooShort;
      }
      break;
    default:
      isValid = inputElement.value !== '';

      if ( inputElement.name === 'address[country]') {
        isValid = inputElement.value !== '---';
      }
  }

  if (!isValid) {
    const fieldWrapper = inputElement.parentElement;
    const hasErrorMessage = fieldWrapper.nextElementSibling ? fieldWrapper.nextElementSibling.classList.contains('input-error-message') : null;
    const iconError = fieldWrapper.querySelector('.field-wrapper__icon-error');

    if (iconError) {
      iconError.classList.remove('hide');
    }

    if (hasErrorMessage) {
      const errorMsgElm = fieldWrapper.nextElementSibling;
      const formRequirement = errorMsgElm.nextElementSibling ? errorMsgElm.nextElementSibling.classList.contains('requirement-form') : null;

      if (formRequirement) {
        errorMsgElm.nextElementSibling.classList.add('hide');
      }

      if (errorTxt) {
        errorMsgElm.querySelector('span:not(.visually-hidden)').textContent = errorTxt;
      }

      errorMsgElm.classList.remove('hide');
    }

    inputElement.classList.add('input--error');
    inputElement.setAttribute('aria_invalid', 'true');
    inputElement.setAttribute('aria_describedby', `${inputElement.id}-error`);
  }

  return isValid;
}

function validateForm (formElement) {
  const inputsElm =  Array.from(formElement.querySelectorAll('[aria-required]'));
  let checker = arr => arr.every(v => v === true);

  const validationArray = inputsElm.map((inputElem) => {
    const validateGroup = inputElem.dataset.group;

    if (validateGroup) {
      const inputGroup = Array.from(formElement.querySelectorAll(`[data-group='${validateGroup}']`));

      const checkValues = inputGroup.map((input) => {
        const subgroupRequired = input.dataset.groupRequired || null;

        if (subgroupRequired) {
          const inputSubgroup = Array.from(formElement.querySelectorAll(`[data-group-required='${subgroupRequired}']`));
          let invalidSubgroup = false;

          inputSubgroup.forEach((i) => {
            if (i.value === '') {
              invalidSubgroup = true;
            }
          });

          if (invalidSubgroup) {
            return true;
          }
        }

        return input.value === '';
      });

      const invalidGroup = checker(checkValues);

      if (!invalidGroup) {
        return true;
      }
    }

    return validateFormInput(inputElem);
  });

  return checker(validationArray);
}

function removeErrorStyle (inputElem) {
  const fieldWrapper = inputElem.parentElement;
  const hasErrorMessage = fieldWrapper.nextElementSibling ? fieldWrapper.nextElementSibling.classList.contains('input-error-message') : null;
  const iconError = fieldWrapper.querySelector('.field-wrapper__icon-error');

  if (iconError) {
    iconError.classList.add('hide');
  }

  if (hasErrorMessage) {
    const errorMsgElm = fieldWrapper.nextElementSibling;
    const formRequirement = errorMsgElm.nextElementSibling ? errorMsgElm.nextElementSibling.classList.contains('requirement-form') : null;

    if (formRequirement) {
      errorMsgElm.nextElementSibling.classList.remove('hide');
    }
    errorMsgElm.classList.add('hide');
  }

  inputElem.classList.remove('input--error');
  inputElem.classList.remove('input--not-error-msg');
  inputElem.removeAttribute('aria_invalid');
  inputElem.removeAttribute('aria_describedby');
}

function clearInputErrors (formElement) {
  const inputsElm = formElement.querySelectorAll('[aria-required]');
  const formMsgErrors = formElement.querySelectorAll('.form-message--error');

  inputsElm.forEach((inputElm) => {
    let eventName = 'keyup';

    if (inputElm.tagName === 'SELECT') {
      eventName = 'change';
    }

    inputElm.addEventListener(eventName, function (event) {
      const currentInput = inputElm;

      if (currentInput.classList.contains('input--error')) {
        const validateGroup = currentInput.dataset.group;

        if (validateGroup) {
          const inputGroup = Array.from(formElement.querySelectorAll(`[data-group='${validateGroup}']`));

          inputGroup.forEach((input) => {
            removeErrorStyle(input);
          });
        }

        removeErrorStyle(currentInput);
      }

      if (formMsgErrors.length) {
        formMsgErrors.forEach((formMsgError) => {
          formMsgError.classList.add('hide');
          formMsgError.classList.remove('form-message--success-field');
        });
      }
    });
  });
}

class CustomerAddresses {
  constructor() {
    this.elements = this._getElements();
    if (Object.keys(this.elements).length === 0) return;
    this._setupCountries();
    this._setupEventListeners();

    const editForms = this.elements.container.querySelector('.addresses__edit-forms');

    if (editForms) {
      const queryString = window.location.search;
      const urlParams = new URLSearchParams(queryString);
      const addressId = urlParams.get('address_id');

      this.addressForm = this.elements.container.querySelector(`#EditAddress_${addressId}`);

      if (this.addressForm) {
        this.addressForm.classList.remove('hide');
      }
    } else {
      this.addressForm = this.elements.container.querySelector('form');
    }

    if (this.addressForm) {
      this.submitButton = this.addressForm.querySelector('button[type="submit"]');

      if (this.submitButton) {
        this.submitButton.removeAttribute('disabled');
      }

      clearInputErrors(this.addressForm);

      this.addressForm.addEventListener('submit', this._handleAddressSubmit.bind(this));
    }
  }

  _getElements() {
    const container = document.querySelector(selectors.customerAddresses);
    return container ? {
      container,
      deleteButtons: container.querySelectorAll(selectors.deleteAddressButton),
      countrySelects: container.querySelectorAll(selectors.addressCountrySelect)
    } : {};
  }

  _setupCountries() {
    if (Shopify && Shopify.CountryProvinceSelector) {
      if (this.elements.container.querySelector('#AddressCountryNew')) {
        // eslint-disable-next-line no-new
        new Shopify.CountryProvinceSelector('AddressCountryNew', 'AddressProvinceNew', {
          hideElement: 'AddressProvinceContainerNew'
        });
      }

      this.elements.countrySelects.forEach((select) => {
        const formId = select.dataset.formId;
        // eslint-disable-next-line no-new
        new Shopify.CountryProvinceSelector(`AddressCountry_${formId}`, `AddressProvince_${formId}`, {
          hideElement: `AddressProvinceContainer_${formId}`
        });
      });
    }
  }

  _setupEventListeners() {
    this.elements.deleteButtons.forEach((element) => {
      element.addEventListener('click', this._handleDeleteButtonClick);
    });
  }

  _handleDeleteButtonClick({ currentTarget }) {
    // eslint-disable-next-line no-alert
    if (confirm(currentTarget.getAttribute(attributes.confirmMessage))) {
      Shopify.postLink(currentTarget.dataset.target, {
        parameters: { _method: 'delete' },
      });
    }
  }

  _handleAddressSubmit(evt) {
    const formIsValid = validateForm(this.addressForm);

    if (formIsValid) {
      if (this.submitButton) {
        this.submitButton.classList.add('btn--loading');
      }
    } else {
      evt.preventDefault();
    }
  }
}

class CustomerLogin {
  constructor() {
    // Login form
    this.loginContainer = document.getElementById('login');
    this.submitLoginButton = this.loginContainer.querySelector('button[type="submit"]');
    const formLoginInputs = this.loginContainer.querySelectorAll('.field-wrapper__input[aria-required="true"]');

    formLoginInputs.forEach((formInput) => {
      formInput.addEventListener('focusout', this._handleFocus.bind(this));
    });

    clearInputErrors(this.loginContainer);

    this.rmCheck = this.loginContainer.querySelector('#rememberCheckBox');
    this.emailInput = this.loginContainer.querySelector('#CustomerEmail');
    this.passwordInput = this.loginContainer.querySelector('#CustomerPassword');

    this.loginContainer.addEventListener('submit', this._handleLoginSubmit.bind(this));
    this._setRememberLogin();

    // Recover password form
    this.recoverContainer = document.getElementById('recover');
    this.submitRecoverButton = this.recoverContainer.querySelector('button[type="submit"]');
    const recoverEmailInput = this.recoverContainer.querySelector('.field-wrapper__input[aria-required="true"]');

    recoverEmailInput.addEventListener('focusout', this._handleFocus.bind(this));

    clearInputErrors(this.recoverContainer);
    this.recoverContainer.addEventListener('submit', this._handleRecoverSubmit.bind(this));
  }

  _handleFocus(evt) {
    const targetElm = evt.target;
    validateFormInput(targetElm);
  }

  _setRememberLogin() {
    if (localStorage.checkbox && localStorage.username && localStorage.pass) {
      this.rmCheck.setAttribute('checked', 'checked');
      this.emailInput.value = localStorage.username;
      this.passwordInput.value = localStorage.pass;
    } else {
      this.rmCheck.removeAttribute('checked');
      this.emailInput.value = '';
      this.passwordInput.value = '';
    }
  }

  _handleLoginSubmit(evt) {
    const activeErrors = this.loginContainer.querySelectorAll('input[aria_invalid="true"]');

    if (activeErrors.length) {
      evt.preventDefault();
    } else {
      const formIsValid = validateForm(this.loginContainer);

      if (formIsValid) {
        if (this.rmCheck.checked && this.emailInput.value !== '') {
          localStorage.username = this.emailInput.value;
          localStorage.pass = this.passwordInput.value;
          localStorage.checkbox = this.rmCheck.value;
        } else {
          localStorage.username = '';
          localStorage.pass = '';
          localStorage.checkbox = '';
        }

        if (this.submitLoginButton) {
          this.submitLoginButton.classList.add('btn--loading');
        }
      } else {
        evt.preventDefault();
      }
    }
  }

  _handleRecoverSubmit(evt) {
    const activeErrors = this.recoverContainer.querySelectorAll('input[aria_invalid="true"]');

    if (activeErrors.length) {
      evt.preventDefault();
    } else {
      const formIsValid = validateForm(this.recoverContainer);

      if (formIsValid) {
        if (this.submitRecoverButton) {
          this.submitRecoverButton.classList.add('btn--loading');
        }
      } else {
        evt.preventDefault();
      }
    }
  }
}

class CustomerRegister {
  constructor() {
    this.registerFrom = document.getElementById('RegisterForm');
    this.submitRegisterButton = this.registerFrom.querySelector('button[type="submit"]');

    const formRegisterInputs = this.registerFrom.querySelectorAll('.field-wrapper__input[aria-required="true"]');

    formRegisterInputs.forEach((formInput) => {
      formInput.addEventListener('focusout', this._handleFocus.bind(this));
    });

    clearInputErrors(this.registerFrom);
    this.registerFrom.addEventListener('submit', this._handleRegisterSubmit.bind(this));
  }

  _handleFocus(evt) {
    const targetElm = evt.target;
    validateFormInput(targetElm);
  }

  _handleRegisterSubmit(evt) {
    const activeErrors = this.registerFrom.querySelectorAll('input[aria_invalid="true"]');

    if (activeErrors.length) {
      evt.preventDefault();
    } else {
      const formIsValid = validateForm(this.registerFrom);

      if (formIsValid) {
        if (this.submitRegisterButton) {
          this.submitRegisterButton.classList.add('btn--loading');
        }
      } else {
        evt.preventDefault();
      }
    }
  }
}

class ComfirmPassword {
  constructor() {
    this.confirmPasswordForm = document.getElementById('ActivateForm') || document.getElementById('ResetForm');
    this.submitActivateButton = this.confirmPasswordForm.querySelector('button[type="submit"]');
    this.formRequirement = this.confirmPasswordForm.querySelector('.requirement-form');
    this.formErrorMessage = this.confirmPasswordForm.querySelector('.form-message--error');

    const formActiveInputs = this.confirmPasswordForm.querySelectorAll('.field-wrapper__input[aria-required="true"]');
    this.formActiveInputs = formActiveInputs;

    formActiveInputs.forEach((formInput) => {
      formInput.addEventListener('focusout', this._handleFocus.bind(this));
    });

    clearInputErrors(this.confirmPasswordForm);
    this.submitActivateButton.addEventListener('click', this._handleSubmit.bind(this));
  }

  _handleFocus(evt) {
    const targetElm = evt.target;
    validateFormInput(targetElm);
  }

  _handleSubmit(evt) {
    const activeErrors = this.confirmPasswordForm.querySelectorAll('input[aria_invalid="true"]');
    const target = evt.target;

    if (activeErrors.length) {
      evt.preventDefault();
    } else {
      const formIsValid = validateForm(this.confirmPasswordForm);

      if (formIsValid) {
        this.formActiveInputs[0]
        if (this.formActiveInputs[0].value !== this.formActiveInputs[1].value) {
          this.formRequirement.classList.add('hide');
          this.formErrorMessage.classList.remove('hide');
          this.formErrorMessage.innerHTML = window.loginStrings.errorPasswordMustMatch;

          this.formActiveInputs.forEach((passwordField) => {
            const fieldWrapper = passwordField.parentElement;

            passwordField.classList.add('input--error');
            fieldWrapper.querySelector('.field-wrapper__icon-error').classList.remove('hide');
          });

          evt.preventDefault();
        } else {
          if (this.submitActivateButton) {
            this.submitActivateButton.classList.add('btn--loading');
          }
        }
      } else {
        evt.preventDefault();
      }
    }
  }
}
