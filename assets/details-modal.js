class DetailsModal extends HTMLElement {
  constructor() {
    super();
    this.detailsContainer = this.querySelector('details');
    this.summaryToggle = this.querySelector('summary');

    this.detailsContainer.addEventListener(
      'keyup',
      (event) => event.code.toUpperCase() === 'ESCAPE' && this.close()
    );
    this.summaryToggle.addEventListener(
      'click',
      this.onSummaryClick.bind(this)
    );
    this.querySelector('button[type="button"]').addEventListener(
      'click',
      this.close.bind(this)
    );

    this.summaryToggle.setAttribute('role', 'button');
    this.summaryToggle.setAttribute('aria-expanded', 'false');
  }

  isOpen() {
    return this.detailsContainer.hasAttribute('open');
  }

  onSummaryClick(event) {
    event.preventDefault();
    event.target.closest('details').hasAttribute('open')
      ? this.close()
      : this.open(event);
  }

  onBodyClick(event) {
    if (!this.contains(event.target) || event.target.classList.contains('modal-overlay')) this.close(false);
  }

  open(event) {
    this.onBodyClickEvent =
      this.onBodyClickEvent || this.onBodyClick.bind(this);
    event.target.closest('details').setAttribute('open', true);
    document.body.addEventListener('click', this.onBodyClickEvent);
    document.body.classList.add('overflow-hidden');

    const container = this.detailsContainer.querySelector('[tabindex="-1"]');

    if (container) {
      trapFocus(
        container,
        this.detailsContainer.querySelector('input:not([type="hidden"])')
      );
    } else {
      this.detailsContainer.querySelector('input:not([type="hidden"])').focus({preventScroll: true});
    }
  }

  close(focusToggle = true) {
    const searchInput = this.querySelector('input[type="search"]');
    const predictiveSearch = this.querySelector('predictive-search');

    removeTrapFocus(focusToggle ? this.summaryToggle : null);
    this.detailsContainer.removeAttribute('open');
    document.body.removeEventListener('click', this.onBodyClickEvent);

    document.body.classList.remove('overflow-hidden');

    if (searchInput) {
      searchInput.value = '';
      searchInput.setAttribute('aria-activedescendant', '');
      searchInput.setAttribute('aria-expanded', false);
    }

    if (predictiveSearch) {
      const selected = predictiveSearch.querySelector('[aria-selected="true"]');
      if (selected) selected.setAttribute('aria-selected', false);
      predictiveSearch.removeAttribute('results');
      predictiveSearch.removeAttribute('open');
    }
  }
}

customElements.define('details-modal', DetailsModal);
