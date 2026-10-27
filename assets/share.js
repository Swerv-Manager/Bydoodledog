if (!customElements.get('share-button')) {
  customElements.define('share-button', class ShareButton extends HTMLElement {
    constructor() {
      super();
      this.shareButton = this.querySelector('.share-button__button');
      this.elements = {
        shareButton: this.querySelector('.share-button__button')
      }

      this.shareButton.addEventListener('click', this.openSocial.bind(this));
    }

    openSocial() {
      this.shareButton.classList.toggle('share-button__button--open');
    }
  });
}
