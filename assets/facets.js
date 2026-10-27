class FacetFiltersForm extends HTMLElement {
  constructor() {
    super();
    this.onActiveFilterClick = this.onActiveFilterClick.bind(this);

    this.debouncedOnSubmit = debounce((event) => {
      const target = event.target;

      if (target.classList.contains('facets__add-filter')) {
        this.onAddFilterHandler(event);
      } else {
        this.onSubmitHandler(event);
        if (target.type === 'radio') {
          const filterDetails = target.closest('.facets__filters__details');
          const selectedSort = filterDetails.querySelector('.facet-filters__selected-sort');
          if (selectedSort) selectedSort.innerHTML = target.dataset.sortName;
        }
      }
    }, 500);

    this.querySelector('form').addEventListener('input', this.debouncedOnSubmit.bind(this));

    const facetWrapper = this.querySelector('#FacetsWrapperDesktop');
    if (facetWrapper) facetWrapper.addEventListener('keyup', onKeyUpEscape);
  }

  static setListeners() {
    const onHistoryChange = (event) => {
      const eventState = event.state ? event.state : {};
      const params = eventState.searchParams || eventState.urlParams;
      const searchParams = params ? params : FacetFiltersForm.searchParamsInitial;

      if (searchParams === FacetFiltersForm.searchParamsPrev) return;
      FacetFiltersForm.renderPage(searchParams, null, false);
    }
    window.addEventListener('popstate', onHistoryChange);
  }

  static toggleActiveFacets(disable = true) {
    document.querySelectorAll('.js-facet-remove').forEach((element) => {
      element.classList.toggle('disabled', disable);
    });
  }

  static renderPage(searchParams, event, updateURLHash = true) {
    FacetFiltersForm.searchParamsPrev = searchParams;
    const sections = FacetFiltersForm.getSections();
    const mobileFacetsMain = document.querySelector('.mobile-facets__main');
    if (mobileFacetsMain) {
      mobileFacetsMain.classList.add('mobile-facets__main--loading');
    }

    sections.forEach((section) => {
      const url = `${window.location.pathname}?section_id=${section.section}&${searchParams}`;
      const filterDataUrl = element => element.url === url;

      FacetFiltersForm.filterData.some(filterDataUrl) ?
        FacetFiltersForm.renderSectionFromCache(filterDataUrl, event) :
        FacetFiltersForm.renderSectionFromFetch(url, event);
    });

    if (updateURLHash) FacetFiltersForm.updateURLHash(searchParams);
  }

  static renderSectionFromFetch(url, event) {
    const params = getAllUrlParams(url);
    const page = params.page ? parseInt(params.page) : null;

    if (page && page > 1) {
      const pagesArray = Array.apply(null, Array(page)).map(function (x, i) { return i; });
      const id = 'data-pagination';
      const newDiv = document.createElement("div");

      const promises = pagesArray.map((pageLoop) => {
        pageLoop = pageLoop + 1;
        const fetchUrl = url.replace(/page=[0-9]+/,'page='+ pageLoop);
        return fetch(fetchUrl)
          .then((response) => response.text());
      });

      Promise.all(promises)
        .then((texts) => {
          texts.forEach((responseText) => {
            const textHtmlElm = new DOMParser().parseFromString(responseText, 'text/html');
            const sectionInnerHTML = textHtmlElm.getElementById(id);

            if (sectionInnerHTML && !sectionInnerHTML.dataset.empty) {
              newDiv.insertAdjacentHTML('beforeend', sectionInnerHTML.innerHTML);
            }
          });

          const htmlElm = new DOMParser().parseFromString(texts[texts.length - 1], 'text/html');
          htmlElm.getElementById(id).innerHTML = newDiv.innerHTML;

          const html = htmlElm.querySelector('body').outerHTML;

          FacetFiltersForm.filterData = [...FacetFiltersForm.filterData, { html, url }];
          FacetFiltersForm.renderFilters(html, event);
          FacetFiltersForm.renderProductGridContainer(html);
          FacetFiltersForm.renderPagination(html);
        });
    } else {
      fetch(url)
      .then(response => response.text())
      .then((responseText) => {
        const html = responseText;
        FacetFiltersForm.filterData = [...FacetFiltersForm.filterData, { html, url }];
        FacetFiltersForm.renderFilters(html, event);
        FacetFiltersForm.renderProductGridContainer(html);
        FacetFiltersForm.renderPagination(html);
      });
    }
  }

  static renderSectionFromCache(filterDataUrl, event) {
    const html = FacetFiltersForm.filterData.find(filterDataUrl).html;
    FacetFiltersForm.renderFilters(html, event);
    FacetFiltersForm.renderProductGridContainer(html);
    FacetFiltersForm.renderPagination(html);
  }

  static renderProductGridContainer(html) {
    const htmlElm = new DOMParser().parseFromString(html, 'text/html');
    const nextUrlElm = document.querySelector('[data-next-url]');
    const sourceNextUrl = htmlElm.querySelector('[data-next-url]');
    const dataPagination = document.getElementById('data-pagination');
    const sourceDataPagination = htmlElm.getElementById('data-pagination');

    if (dataPagination && sourceDataPagination) {
      dataPagination.innerHTML = sourceDataPagination.innerHTML;
    } else {
      document.getElementById('ProductGridContainer').innerHTML = htmlElm.getElementById('ProductGridContainer').innerHTML;
    }

    if (nextUrlElm && sourceNextUrl) {
      nextUrlElm.value = sourceNextUrl.value;
    }

    // remove loading
    const mobileFacetsMain = document.querySelector('.mobile-facets__main');
    if (mobileFacetsMain) {
      mobileFacetsMain.classList.remove('mobile-facets__main--loading');
    }
    const mobileLabelLoading = document.querySelectorAll('.mobile-facets__label--loading');
    mobileLabelLoading.forEach((elm) => {
      const isChecked = elm.querySelector('.mobile-facets__checkbox').checked;
      elm.classList.remove('mobile-facets__label--loading');

      if (isChecked) {
        elm.classList.add('mobile-facets__label--checked');
      } else {
        elm.classList.remove('mobile-facets__label--checked');
      }
    });

    if (FacetFiltersForm.triggerAddFilter) {
      FacetFiltersForm.triggerAddFilter = false;
      if (FacetFiltersForm.showFilter) {
        FacetFiltersForm.handleFilter.classList.remove('hidden');
      } else {
        FacetFiltersForm.handleFilter.classList.add('hidden');
      }
    }
  }

  static renderPagination(html) {
    const htmlElm = new DOMParser().parseFromString(html, 'text/html');
    const componentPaginationLoader = document.getElementById('component-pagination-loader');
    const sourceComponentPaginationLoader = htmlElm.getElementById('component-pagination-loader');

    if (componentPaginationLoader && sourceComponentPaginationLoader) {
      const paginationLoader = componentPaginationLoader.querySelector('pagination-loader');
      const sourcePaginationLoader = sourceComponentPaginationLoader.querySelector('pagination-loader');

      if (paginationLoader && sourcePaginationLoader) {
        const nextUrlElm = paginationLoader.querySelector('input[data-next-url]');
        const totalPagesElm = paginationLoader.querySelector('input[data-total-pages]');
        const currentPageElm = paginationLoader.querySelector('input[data-current-page]');

        const sourceCurrentPage = sourcePaginationLoader.querySelector('[data-current-page]').value;
        const sourceTotalPages = parseInt(sourcePaginationLoader.querySelector('[data-total-pages]').value);

        if (sourceCurrentPage >= sourceTotalPages) {
          paginationLoader.querySelector('.js-load-more').classList.add('hide');
          return;
        }

        nextUrlElm.value = sourcePaginationLoader.querySelector('input[data-next-url]').value;
        totalPagesElm.value = sourcePaginationLoader.querySelector('input[data-total-pages]').value;
        currentPageElm.value = sourcePaginationLoader.querySelector('input[data-current-page]').value;
        paginationLoader.querySelector('.js-load-more').classList.remove('hide');
      } else {
        const sourcePaginationLoader = sourceComponentPaginationLoader.querySelector('pagination-loader');
        if(sourcePaginationLoader) sourcePaginationLoader.dataset.disableLoadPages = true;
        componentPaginationLoader.innerHTML = sourceComponentPaginationLoader.innerHTML;
      }
    } else if (componentPaginationLoader) {
      componentPaginationLoader.innerHTML = '';
    }
  }

  static renderFilters(html, event) {
    const parsedHTML = new DOMParser().parseFromString(html, 'text/html');

    const facetDetailsElements =
      parsedHTML.querySelectorAll('#FacetFiltersForm .js-filter, #FacetFiltersFormMobile .js-filter');
    const matchesIndex = (element) => {
      const jsFilter = event ? event.target.closest('.js-filter') : undefined;
      return jsFilter ? element.dataset.index === jsFilter.dataset.index : false;
    }
    const facetsToRender = Array.from(facetDetailsElements).filter(element => !matchesIndex(element));
    const countsToRender = Array.from(facetDetailsElements).find(matchesIndex);

    facetsToRender.forEach((element) => {
      document.querySelector(`.js-filter[data-index="${element.dataset.index}"]`).innerHTML = element.innerHTML;
    });

    const target = event ? event.target.closest('.js-filter') : null;

    FacetFiltersForm.renderActiveFacets(countsToRender, target, parsedHTML);
    FacetFiltersForm.renderAdditionalElements(parsedHTML);
    FacetFiltersForm.renderAddFilters(parsedHTML)

    if (countsToRender) {
      if (target) {
        FacetFiltersForm.renderCounts(countsToRender, target);
        FacetFiltersForm.renderMobileCounts(countsToRender, target);
      }
    }
  }

  static renderActiveFacets(source, target, html) {
    const targetElement = target ? target.querySelector('.active-facets') : null;
    const sourceElement = source ? source.querySelector('.active-facets') : null;
    const activeFacetsElement = html.querySelector('.active-facets-mobile');

    if (targetElement && sourceElement) {
      targetElement.innerHTML = sourceElement.innerHTML;
    }

    if (activeFacetsElement) {
      document.querySelector('.active-facets-mobile').innerHTML = activeFacetsElement.innerHTML;
    }

    FacetFiltersForm.toggleActiveFacets(false);
  }

  static renderAdditionalElements(html) {
    const mobileElementSelectors = ['.mobile-facets__open', '.mobile-facets__count', '.sorting'];
    const clearFilter = '.facet-filters__clear-filters';
    const clearFilterElms = html.querySelectorAll(clearFilter)

    clearFilterElms.forEach((elm) => {
      const dataIndex = elm.dataset.clearFilter;
      document.querySelector(`${clearFilter}[data-clear-filter="${dataIndex}"]`).innerHTML = elm.innerHTML;
    });

    mobileElementSelectors.forEach((selector) => {
      if (!html.querySelector(selector)) return;
      document.querySelector(selector).innerHTML = html.querySelector(selector).innerHTML;
    });

    document.getElementById('FacetFiltersFormMobile').closest('menu-drawer').bindEvents();
  }

  static renderCounts(source, target) {
    const targetElement = target.querySelector('.facets__selected');
    const sourceElement = source.querySelector('.facets__selected');

    if (sourceElement && targetElement) {
      target.querySelector('.facets__selected').outerHTML = source.querySelector('.facets__selected').outerHTML;
    }

    const targetElementAccessibility = target.querySelector('.facets__summary');
    const sourceElementAccessibility = source.querySelector('.facets__summary');

    if (targetElementAccessibility && sourceElementAccessibility) {
      targetElementAccessibility.outerHTML = sourceElementAccessibility.outerHTML;
    }

    const targetHeaderElement = target.querySelector('.facets__header');
    const sourceHeaderElement = source.querySelector('.facets__header');

    if (sourceHeaderElement && targetHeaderElement) {
      targetHeaderElement.outerHTML = sourceHeaderElement.outerHTML;
    }

    const targetWrapElement = target.querySelector('.facets-wrap');
    const sourceWrapElement = source.querySelector('.facets-wrap');

    if (sourceWrapElement && targetWrapElement) {
      targetWrapElement.outerHTML = sourceWrapElement.outerHTML;
    }
  }

  static renderMobileCounts(source, target) {
    const targetElementAccessibility = target.querySelector('.mobile-facets__summary');
    const sourceElementAccessibility = source.querySelector('.mobile-facets__summary');

    if (targetElementAccessibility && sourceElementAccessibility) {
      targetElementAccessibility.outerHTML = sourceElementAccessibility.outerHTML;
    }

    const targetFacetsList = target.querySelector('.mobile-facets__list');
    const sourceFacetsList = source.querySelector('.mobile-facets__list');

    if (sourceFacetsList && targetFacetsList) {
      targetFacetsList.outerHTML = sourceFacetsList.outerHTML;
    }
  }

  static renderAddFilters(parsedHTML) {
    const facetsAddMore = parsedHTML.querySelectorAll('.facets__add-filter');

    facetsAddMore.forEach((element) => {
      document.querySelector(`.facets__add-filter[data-index="${element.dataset.index}"]`).dataset.url = element.dataset.url;
    });
  }

  static updateURLHash(searchParams) {
    history.pushState({ searchParams }, '', `${window.location.pathname}${searchParams && '?'.concat(searchParams)}`);
  }

  static getSections() {
    return [
      {
        section: document.getElementById('data-pagination').dataset.id,
      }
    ]
  }

  createSearchParams(form) {
    const formData = new FormData(form);
    return new URLSearchParams(formData).toString();
  }

  onSubmitForm(searchParams, event) {
    FacetFiltersForm.renderPage(searchParams, event);
  }

  onSubmitHandler(event) {
    event.preventDefault();
    const sortFilterForms = document.querySelectorAll('facet-filters-form form');

    if (event.srcElement.className == 'mobile-facets__checkbox') {
      const searchParams = this.createSearchParams(event.target.closest('form'));
      const target = event.target;
      const mobileFacetItem = target.closest('.mobile-facets__label');

      if (mobileFacetItem) {
        mobileFacetItem.classList.add('mobile-facets__label--loading');
      }

      this.onSubmitForm(searchParams, event)
    } else {
      const forms = [];
      const isMobile = event.target.closest('form').id === 'FacetFiltersFormMobile';

      sortFilterForms.forEach((form) => {
        if (!isMobile) {
          if (form.id === 'FacetSortForm' || form.id === 'FacetFiltersForm' ) {
            forms.push(this.createSearchParams(form));
          }
        } else if (form.id === 'FacetFiltersFormMobile') {
          forms.push(this.createSearchParams(form));
        }
      });

      const target = event.target;
      const facetsWrap = target.closest('.facets-wrap');
      if (facetsWrap) {
        const facetsSelected = facetsWrap.querySelector('.facets__selected');
        if (facetsSelected) facetsSelected.classList.add('facets__selected--loading');
      }

      this.onSubmitForm(forms.join('&'), event)
    }
  }

  onAddFilterHandler(event) {
    event.preventDefault();
    const target = event.target;
    const form = target.closest('facet-filters-form') || document.querySelector('facet-filters-form');

    if (form) {
      FacetFiltersForm.triggerAddFilter = true;
      FacetFiltersForm.handleFilter = form.querySelector(`#Wrap-Filter-${target.value}-${target.dataset.index}`);
      FacetFiltersForm.showFilter = target.checked;

      form.onActiveFilterClick(event);
    }
  }

  onActiveFilterClick(event) {
    event.preventDefault();
    FacetFiltersForm.toggleActiveFacets();

    const hrefElm = event.currentTarget ? event.currentTarget.href : event.target.dataset.url;
    const url = hrefElm.indexOf('?') == -1 ? '' : hrefElm.slice(hrefElm.indexOf('?') + 1);
    FacetFiltersForm.renderPage(url);
  }
}

FacetFiltersForm.filterData = [];
FacetFiltersForm.searchParamsInitial = window.location.search.slice(1);
FacetFiltersForm.searchParamsPrev = window.location.search.slice(1);
customElements.define('facet-filters-form', FacetFiltersForm);
FacetFiltersForm.setListeners();

class PriceRange extends HTMLElement {
  constructor() {
    super();
    this.querySelectorAll('input')
      .forEach(element => element.addEventListener('change', this.onRangeChange.bind(this)));
    this.setMinAndMaxValues();
  }

  onRangeChange(event) {
    this.adjustToValidValues(event.currentTarget);
    this.setMinAndMaxValues();
  }

  setMinAndMaxValues() {
    const inputs = this.querySelectorAll('input');
    const minInput = inputs[0];
    const maxInput = inputs[1];
    if (maxInput.value) minInput.setAttribute('max', maxInput.value);
    if (minInput.value) maxInput.setAttribute('min', minInput.value);
    if (minInput.value === '') maxInput.setAttribute('min', 0);
    if (maxInput.value === '') minInput.setAttribute('max', maxInput.getAttribute('max'));
  }

  adjustToValidValues(input) {
    const value = Number(input.value);
    const min = Number(input.getAttribute('min'));
    const max = Number(input.getAttribute('max'));

    if (value < min) input.value = min;
    if (value > max) input.value = max;
  }
}

customElements.define('price-range', PriceRange);

class FacetRemove extends HTMLElement {
  constructor() {
    super();
    const facetLink = this.querySelector('a');
    facetLink.setAttribute('role', 'button');
    facetLink.addEventListener('click', this.closeFilter.bind(this));
    facetLink.addEventListener('keyup', (event) => {
      event.preventDefault();
      if (event.code.toUpperCase() === 'SPACE') this.closeFilter(event);
    });
  }

  closeFilter(event) {
    event.preventDefault();
    const form = this.closest('facet-filters-form') || document.querySelector('facet-filters-form');
    form.onActiveFilterClick(event);
  }
}

customElements.define('facet-remove', FacetRemove);
