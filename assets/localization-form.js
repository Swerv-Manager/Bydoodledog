if (!customElements.get('localization-form')) {
  customElements.define(
    'localization-form',
    class LocalizationForm extends HTMLElement {
      constructor() {
        super();
        this.elements = {
          parentClass: this.parentElement.className,
          input: this.querySelector('input[name="locale_code"], input[name="country_code"]'),
          button: this.querySelector('button'),
          panel: this.querySelector('.localization-list'),
          inputSearch: this.querySelector('#localization-search-input'),
          closeButton: this.querySelector('.modal__close-button'),
        };
        this.elements.button.addEventListener('click', this.openSelector.bind(this));
        this.onBodyClick = this.handleBodyClick.bind(this);
        this.elements.closeButton.addEventListener('click', this.hidePanel.bind(this))
        this.addEventListener('keyup', this.onContainerKeyUp.bind(this));

        if (this.elements.inputSearch) {
          this.elements.inputSearch.addEventListener('keyup', this.filter.bind(this));
        }

        this.querySelectorAll('a').forEach(item => item.addEventListener('click', this.onItemClick.bind(this)));
      }

      filter(event) {
        const valThis = event.target.value;
        this.elements.panel.querySelectorAll('.disclosure__item').forEach((item) => {
          const text = item.querySelector('.localization-form__country-name').textContent;
          const textMatch = text.toLowerCase().indexOf(valThis.toLowerCase()) > -1;
          textMatch ? item.classList.remove('hide') : item.classList.add('hide');
        });

        const activeItems = this.elements.panel.querySelectorAll('.disclosure__item:not(.hide)');
        const noResultsMessage = this.elements.panel.querySelector('.disclosure__no-results');

        if (!activeItems.length) {
          noResultsMessage.classList.remove('hide');
        } else if (!noResultsMessage.classList.contains('hide')) {
          noResultsMessage.classList.add('hide');
        }
      }

      hidePanel() {
        this.classList.remove('localization-screen-visible');
        this.elements.button.setAttribute('aria-expanded', 'false');
        this.elements.button.classList.remove('disclosure__button--open');
        this.elements.panel.setAttribute('hidden', true);

        if (this.elements.parentClass === 'desktop-localization-wrapper') {
          document.body.classList.remove('overflow-hidden');
        } else {
          document.body.classList.remove('overflow-hidden-mobile');
        }
        document.body.removeEventListener('click', this.onBodyClick);
      }

      onContainerKeyUp(event) {
        if (event.code.toUpperCase() !== 'ESCAPE') return;

        this.hidePanel();
        this.elements.button.focus();
      }

      onItemClick(event) {
        event.preventDefault();
        const form = this.querySelector('form');
        this.elements.input.value = event.currentTarget.dataset.value;
        if (form) form.submit();
      }

      openSelector() {
        this.classList.toggle('localization-screen-visible');
        this.elements.button.focus();
        this.elements.panel.toggleAttribute('hidden');
        this.elements.button.setAttribute('aria-expanded', (this.elements.button.getAttribute('aria-expanded') === 'false').toString());
        this.elements.button.classList.toggle('disclosure__button--open');

        if (this.elements.parentClass === 'desktop-localization-wrapper') {
          document.body.classList.add('overflow-hidden');
        } else {
          document.body.classList.add('overflow-hidden-mobile');
        }
        document.body.addEventListener('click', this.onBodyClick);
      }

      handleBodyClick(evt) {
        const target = evt.target;
        const closestForm = target.closest('localization-form');

        if (target !== this && !target.closest('localization-form')) {
          this.hidePanel();
        } else if (closestForm !== this) {
          this.hidePanel();
        }
      }
    }
  );
}
