class TemplateSearchForm extends HTMLElement {
  constructor() {
    super();
    const searchInput = this.querySelector('#Search-In-Template') || this.querySelector('#Search-In-Modal') ;
    const closeButton = this.querySelector('.modal__close-button');

    if (searchInput && searchInput.value === '') {
      closeButton.classList.add('fadeout-transition');
    }

    if (searchInput) {
      searchInput.addEventListener('keyup', () => {
        if (searchInput.value === '') {
          closeButton.classList.add('fadeout-transition');
        } else {
          closeButton.classList.remove('fadeout-transition');
        }
      });
    }

    this.querySelector('.modal__close-button').addEventListener('click', () => {
      searchInput.value = '';
      closeButton.classList.add('fadeout-transition');
    });
  }
}

customElements.define('template-search-form', TemplateSearchForm);
