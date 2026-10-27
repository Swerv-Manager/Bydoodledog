if (!customElements.get('recipient-form')) {
  customElements.define(
    'recipient-form',
    class RecipientForm extends HTMLElement {
      constructor() {
        super();
        this.checkboxInput = this.querySelector(`#Recipient-Checkbox-${this.dataset.sectionId}`);
        this.checkboxInput.disabled = false;
        this.hiddenControlField = this.querySelector(`#Recipient-Control-${this.dataset.sectionId}`);
        this.hiddenControlField.disabled = true;
        this.emailInput = this.querySelector(`#Recipient-email-${this.dataset.sectionId}`);
        this.nameInput = this.querySelector(`#Recipient-name-${this.dataset.sectionId}`);
        this.messageInput = this.querySelector(`#Recipient-message-${this.dataset.sectionId}`);
        this.currentProductVariantId = this.dataset.productVariantId;
        this.addEventListener('change', this.onChange.bind(this));
      }

      cartUpdateUnsubscriber = undefined;
      variantChangeUnsubscriber = undefined;
      cartErrorUnsubscriber = undefined;

      connectedCallback() {
        this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, (event) => {
          if (event.source === 'product-form' && event.productVariantId.toString() === this.currentProductVariantId) {
            this.resetRecipientForm();
          }
        });

        this.variantChangeUnsubscriber = subscribe(PUB_SUB_EVENTS.variantChange, (event) => {
          if (event.data.sectionId === this.dataset.sectionId) {
            this.currentProductVariantId = event.data.variant.id.toString();
          }
        });

        this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartError, (event) => {
          if (event.source === 'product-form' && event.productVariantId.toString() === this.currentProductVariantId) {
            this.displayErrorMessage(event.message, event.errors);
          }
        });
      }

      disconnectedCallback() {
        if (this.cartUpdateUnsubscriber) {
          this.cartUpdateUnsubscriber();
        }

        if (this.variantChangeUnsubscriber) {
          this.variantChangeUnsubscriber();
        }

        if (this.cartErrorUnsubscriber) {
          this.cartErrorUnsubscriber();
        }
      }

      onChange() {
        if (!this.checkboxInput.checked) {
          this.clearInputFields();
          this.clearErrorMessage();
        }
      }

      clearInputFields() {
        this.emailInput.value = '';
        this.nameInput.value = '';
        this.messageInput.value = '';
      }

      displayErrorMessage(title, body) {
        this.clearErrorMessage();
        if (typeof body === 'object') {
          return Object.entries(body).forEach(([key, value]) => {
            const errorMessageId = `RecipientForm-${key}-error-${this.dataset.sectionId}`;
            const fieldSelector = `#Recipient-${key}-${this.dataset.sectionId}`;
            const placeholderElement = this.querySelector(`${fieldSelector}`);
            const fieldWrapper = placeholderElement.parentElement;
            const iconError = fieldWrapper.querySelector('.field-wrapper__icon-error');
            const label = placeholderElement?.getAttribute('placeholder') || key;
            const message = `${label} ${value}`;
            const errorMessageElement = this.querySelector(`#${errorMessageId}`);
            const errorTextElement = errorMessageElement?.querySelector('.error-message');
            if (!errorTextElement) return;

            if (iconError) {
              iconError.classList.remove('hide');
            }
            placeholderElement.classList.add('input--error');
            errorTextElement.innerText = `${message}.`;
            errorMessageElement.classList.remove('hide');

            const inputElement = this[`${key}Input`];
            if (!inputElement) return;

            inputElement.setAttribute('aria-invalid', true);
            inputElement.setAttribute('aria-describedby', errorMessageId);
          });
        }
      }

      clearErrorMessage() {
        this.querySelectorAll('.recipient-fields .form__message').forEach((field) => {
          field.classList.add('hide');
          const textField = field.querySelector('.error-message');
          if (textField) textField.innerText = '';
        });

        [this.emailInput, this.messageInput, this.nameInput].forEach((inputElement) => {
          const fieldWrapper = inputElement.parentElement;
          const iconError = fieldWrapper.querySelector('.field-wrapper__icon-error');
          if (iconError) {
            iconError.classList.add('hide');
          }
          inputElement.classList.remove('input--error');
          inputElement.setAttribute('aria-invalid', false);
          inputElement.removeAttribute('aria-describedby');
        });
      }

      resetRecipientForm() {
        if (this.checkboxInput.checked) {
          this.checkboxInput.checked = false;
          this.clearInputFields();
          this.clearErrorMessage();
        }
      }
    }
  );
}
