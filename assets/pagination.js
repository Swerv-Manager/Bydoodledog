class paginationLoader extends HTMLElement {
  constructor() {
    super();
    this.skeletonTopLoader = document.querySelector('[data-skeleton-pagination-top]');
    this.skeletonBottomLoader = document.querySelector('[data-skeleton-pagination-bottom]');
    this.loadMoreButton = this.querySelector('.js-load-more');
    this.loadMoreButton.addEventListener('click', this.onLoadMoreClick.bind(this));
    this.totalPages = parseInt(this.querySelector('[data-total-pages]').value);
    this.inputNextUrl = this.querySelector('[data-next-url]');

    if (window.location.search && this.dataset.disableLoadPages != "true") {
      this.loadPages();
    }
  }

  loadContent(nextUrl) {
    this.loadMoreButton.setAttribute('disabled', true);
    this.loadMoreButton.classList.add('btn--loading');
    this.handleLoadingState(true, true);

    fetch(nextUrl)
      .then((response) => response.text())
      .then((responseText) => {
        const id = 'data-pagination';
        const htmlElm = new DOMParser().parseFromString(responseText, 'text/html');
        const sectionInnerHTML = htmlElm.getElementById(id);
        const productsElm = document.getElementById(id);
        const totalPages = htmlElm.querySelector('[data-total-pages]').value;
        const currentPage = htmlElm.querySelector('[data-current-page]').value;
        const nextPageUrl = htmlElm.querySelector('[data-next-url]').value;

        this.loadMoreButton.removeAttribute('disabled');
        this.loadMoreButton.classList.remove('btn--loading');
        this.handleLoadingState(false, true);
        this.querySelector('[data-total-pages]').value = totalPages;
        this.querySelector('[data-current-page]').value = currentPage;
        this.querySelector('[data-next-url]').value = nextPageUrl;
        if (!nextPageUrl) this.loadMoreButton.classList.add('hide');

        const inputPage = document.querySelectorAll('input[name="page"]');

        inputPage.forEach((elm) => {
          elm.value = currentPage;
        });

        let focusElem;

        sectionInnerHTML.querySelectorAll('.data-pagination__item').forEach((elm, index) => {
          if (index === 0) {
            focusElem = elm.querySelector('.grid-view-item__link');
          }
          productsElm.appendChild(elm);

          const elmImg = elm.querySelectorAll('img');

          elmImg.forEach((img) => {
            const srcImg = img.src;
            img.src= srcImg + 't=' + new Date().getTime();
          });
        });

        if (currentPage >= this.totalPages) {
          this.loadMoreButton.classList.add('hide');
        }

        if (focusElem) {
          focusElem.focus();
        }
      })
      .catch((error) => {
        this.loadMoreButton.removeAttribute('disabled');
        this.loadMoreButton.classList.remove('btn--loading')
      });
  }

  static setListeners() {
    const onHistoryChange = (event) => {
      const urlParams = event.state ? event.state.urlParams : paginationLoader.urlParamsInitial;

      if (urlParams === paginationLoader.urlParamsPrev) return;
      paginationLoader.renderPage(urlParams, null, false);
    }
    window.addEventListener('popstate', onHistoryChange);
  }

  renderPage(urlParams, event, updateURLHash = true) {
    if (typeof FacetFiltersForm !== 'undefined') {
      FacetFiltersForm.searchParamsPrev = urlParams;
    }

    const url = `${window.location.pathname}?${urlParams}`;
    this.loadContent(url);

    if (updateURLHash) paginationLoader.updateURLHash(urlParams);
  }

  static updateURLHash(urlParams) {
    history.pushState({ urlParams }, '', `${urlParams && '?'.concat(urlParams)}`);
  }

  loadPages() {
    const params = getAllUrlParams(window.location.href);
    const page = params.page ? parseInt(params.page) : null;

    if (page && page > 1) {
      const currentUrl = `${window.location.pathname}${window.location.search}`;
      const pagesArray = Array.apply(null, Array(page - 1)).map(function (x, i) { return i; });
      const id = 'data-pagination';
      const productsElm = document.getElementById(id);
      const newDiv = document.createElement("div");
      this.handleLoadingState(true);

      const promises = pagesArray.map((pageLoop) => {
        pageLoop = pageLoop + 1;
        const fetchUrl = currentUrl.replace(/page=[0-9]+/,'page='+ pageLoop);
        return fetch(fetchUrl)
          .then((response) => response.text());
      });

      Promise.all(promises)
        .then((texts) => {
          texts.forEach((responseText) => {
            const htmlElm = new DOMParser().parseFromString(responseText, 'text/html');
            const sectionInnerHTML = htmlElm.getElementById(id);
            sectionInnerHTML.querySelectorAll('.data-pagination__item').forEach((elm) => {
              newDiv.appendChild(elm);
            });
          });
          productsElm.insertAdjacentHTML('afterbegin', newDiv.innerHTML);
          this.handleLoadingState(false);

          if (this.totalPages && page >= this.totalPages) {
            this.loadMoreButton.classList.add('hide');
          }
        });
    }
  }

  handleLoadingState (isLoading, loadingNextpage) {
    if (isLoading) {
      if (loadingNextpage) {
        if (this.skeletonBottomLoader) {
          this.skeletonBottomLoader.classList.remove('hide');
        }
      } else {
        if (this.skeletonTopLoader) {
          this.skeletonTopLoader.classList.remove('hide');
        }
      }
    } else {
      if (this.skeletonTopLoader) {
        this.skeletonTopLoader.classList.add('hide');
      }

      if (this.skeletonBottomLoader) {
        this.skeletonBottomLoader.classList.add('hide');
      }
    }
  }

  onLoadMoreClick(event) {
    event.preventDefault();
    const nextUrlParams = this.inputNextUrl.value.split('?')[1];
    this.loadMoreButton.setAttribute('disabled', true);
    this.loadMoreButton.classList.add('btn--loading');
    this.renderPage(nextUrlParams);
  }

}

paginationLoader.paginationData = [];
paginationLoader.urlParamsInitial = window.location.search.slice(1);
paginationLoader.urlParamsPrev = window.location.search.slice(1);
customElements.define('pagination-loader', paginationLoader);
