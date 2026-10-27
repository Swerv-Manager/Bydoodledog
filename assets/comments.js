class ArticleComments {
  constructor() {
    this.commentsForm = document.querySelector('#comment_form');
    this.goToComments = document.querySelector('.article-go-to-comments');

    if (this.commentsForm) {
      this.submitButton = this.commentsForm.querySelector('button[type="submit"]');

      if (this.submitButton) {
        this.submitButton.removeAttribute('disabled');
      }

      clearInputErrors(this.commentsForm);

      this.commentsForm.addEventListener('submit', this._handleCommentsSubmit.bind(this));
    }

    if (this.goToComments) {
      this.goToComments.addEventListener('click', this._goToComments.bind(this))
    }
  }

  _handleCommentsSubmit = (evt) => {
    const formIsValid = validateForm(this.commentsForm);

    if (formIsValid) {
      if (this.submitButton) {
        this.submitButton.classList.add('btn--loading');
      }
    } else {
      evt.preventDefault();
    }
  }

  _goToComments = (evt) => {
    evt.preventDefault();
    const target = evt.currentTarget;
    const contentId = target.getAttribute('href');
    const scrollTo = document.querySelector(contentId).offsetTop;

    this._contenScrollTo(scrollTo);
  }

  _contenScrollTo = function (scrollTo) {
    if (window.scrollY < scrollTo) {
      setTimeout(() => {
        window.scrollTo(0, window.scrollY + 30);
        this._contenScrollTo(scrollTo);
      }, 5);
    }
  }
}

class ArticleBanner {
  constructor() {
    const articleBanner = document.querySelector('.article-banner');

    const RO = new ResizeObserver(entries => {
      return entries.forEach(entry => {
        const banner = entry.target;
        const bannerHeight = banner.offsetHeight;
        const media = banner.querySelector('.article-banner__media');
        const textContentHeight = banner.querySelector('.media__text-content').offsetHeight;
        const textHeight = banner.querySelector('.article-template__title').offsetHeight;

        if (textContentHeight < textHeight && media) {
          media.style.height = `${textHeight + 40}px`;
        } else if (bannerHeight < textContentHeight && media) {
          media.style.height = "";
        }
      })
    });

    RO.observe(articleBanner);
  }
}
