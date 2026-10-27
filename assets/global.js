document.addEventListener('DOMContentLoaded', function() {
  const isDesktop = 'ontouchstart' in document.documentElement
  || navigator.maxTouchPoints > 0
  || navigator.msMaxTouchPoints > 0;

  const parallax = document.querySelectorAll('.img-parallax');
  let speed = 2;

  parallax.forEach((imgElm) => {
    const img = imgElm;
    const imgParent = imgElm.closest('.parent-parallax');
    speed = img.dataset.speed ? img.dataset.speed : speed;

    function parallaxImg () {
      const imgY = imgParent.offsetTop;
      const winY = window.pageYOffset || document.documentElement.scrollTop;
      const winH = window.innerHeight;
      const parentH = imgParent.offsetHeight;

      const winBottom = winY + winH;
      let imgPercent;

      if (winBottom > imgY && winY < imgY + parentH) {
        // Number of pixels shown after block appear
        const imgBottom = ((winBottom - imgY) * speed);
        // Max number of pixels until block disappear
        const imgTop = winH + parentH;
        // Porcentage between start showing until disappearing
        imgPercent = ((imgBottom / imgTop) * 100) + (100 - (speed * 100));
      }

      img.style.top = `${imgPercent}%`;
      img.style.transform = `translateY(-${imgPercent}%)`;
    }

    parallaxImg();

    document.addEventListener('scroll', parallaxImg);
  });

  if (!isDesktop) {
    document.body.className += ' hasHover';
  }

  document.querySelectorAll('.scene-parallax').forEach((elem) => {
    const modifier = elem.getAttribute('data-modifier');

    basicScroll.create({
      elem: elem,
      from: 'top-bottom',
      to: 'bottom-top',
      direct: true,
      props: {
        '--translateY': {
          from: '0',
          to: `${ 10 * modifier }px`
        }
      }
    }).start();
  });

  //* ========= SCROLL ANIMATIONS ========== *//

  function scrollTrigger(selector, options = {}) {
    let els = document.querySelectorAll(selector);
    els = Array.from(els);
    els.forEach(el => {
      addObserver(el, options);
    });
  }

  function addObserver(el, options) {
    if (!('IntersectionObserver' in window)) {
      entry.target.classList.add('scroll-animate-init');
      return;
    }

    let observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('scroll-animate-init');
          observer.unobserve(entry.target);
        }
      });
    }, options);

    observer.observe(el);
  }

  scrollTrigger('.scroll-animate', {
    rootMargin: '0px 0px 0px 0px',
  });
});

let intervalFontLoader = null;
let intervalLastFontLoader = null;

function fontLoadListener() {
  let hasLoaded = false;

  try {
    hasLoaded = document.fonts.check('16px signo');
  } catch (error) {
    console.info(`document.fonts API error: ${error}`);
    fontLoadedSuccess();
    return;
  }

  if(hasLoaded) {
    fontLoadedSuccess();
  }
}

function fontLoadedSuccess() {
  if(intervalFontLoader) {
    clearInterval(intervalFontLoader);
  }

  if(intervalLastFontLoader) {
    clearInterval(intervalLastFontLoader);
  }

  document.getElementsByTagName("body")[0].classList.remove('skeleton-font--loading');
}

intervalFontLoader = setInterval(fontLoadListener, 500);
intervalLastFontLoader = setInterval(fontLoadedSuccess, 2000);

function getFocusableElements(container) {
  return Array.from(
    container.querySelectorAll(
      "summary, a[href], button:enabled, [tabindex]:not([tabindex^='-']), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe"
    )
  );
}

document.querySelectorAll('[id^="Details-"] summary').forEach((summary) => {
  summary.setAttribute('role', 'button');
  summary.setAttribute('aria-expanded', 'false');

  if(summary.nextElementSibling.getAttribute('id')) {
    summary.setAttribute('aria-controls', summary.nextElementSibling.id);
  }

  summary.addEventListener('click', (event) => {
    event.currentTarget.setAttribute('aria-expanded', !event.currentTarget.closest('details').hasAttribute('open'));
  });

  if (summary.closest('header-drawer')) return;
  summary.parentElement.addEventListener('keyup', onKeyUpEscape);
});

const trapFocusHandlers = {};

function trapFocus(container, elementToFocus = container) {
  var elements = getFocusableElements(container);
  var first = elements[0];
  var last = elements[elements.length - 1];

  removeTrapFocus();

  trapFocusHandlers.focusin = (event) => {
    if (
      event.target !== container &&
      event.target !== last &&
      event.target !== first
    )
      return;

    document.addEventListener('keydown', trapFocusHandlers.keydown);
  };

  trapFocusHandlers.focusout = function() {
    document.removeEventListener('keydown', trapFocusHandlers.keydown);
  };

  trapFocusHandlers.keydown = function(event) {
    if (event.code.toUpperCase() !== 'TAB') return; // If not TAB key
    // On the last focusable element and tab forward, focus the first element.
    if (event.target === last && !event.shiftKey) {
      event.preventDefault();
      first.focus();
    }

    //  On the first focusable element and tab backward, focus the last element.
    if (
      (event.target === container || event.target === first) &&
      event.shiftKey
    ) {
      event.preventDefault();
      last.focus();
    }
  };

  document.addEventListener('focusout', trapFocusHandlers.focusout);
  document.addEventListener('focusin', trapFocusHandlers.focusin);

  elementToFocus.focus();
}

// Here run the querySelector to figure out if the browser supports :focus-visible or not and run code based on it.
try {
  document.querySelector(":focus-visible");
} catch (e) {
  focusVisiblePolyfill();
}

function focusVisiblePolyfill() {
  const navKeys = ['ARROWUP', 'ARROWDOWN', 'ARROWLEFT', 'ARROWRIGHT', 'TAB', 'ENTER', 'SPACE', 'ESCAPE', 'HOME', 'END', 'PAGEUP', 'PAGEDOWN']
  let currentFocusedElement = null;
  let mouseClick = null;

  window.addEventListener('keydown', (event) => {
    if(navKeys.includes(event.code.toUpperCase())) {
      mouseClick = false;
    }
  });

  window.addEventListener('mousedown', (event) => {
    mouseClick = true;
  });

  window.addEventListener('focus', () => {
    if (currentFocusedElement) currentFocusedElement.classList.remove('focused');

    if (mouseClick) return;

    currentFocusedElement = document.activeElement;
    currentFocusedElement.classList.add('focused');

  }, true);
}

function pauseAllMedia(parentElm) {
  let pauseMediaOnElm = parentElm;
  if (!parentElm) {
    pauseMediaOnElm = document;
  }
  pauseMediaOnElm.querySelectorAll('.js-youtube').forEach((video) => {
    video.contentWindow.postMessage('{"event":"command","func":"' + 'pauseVideo' + '","args":""}', '*');
  });
  pauseMediaOnElm.querySelectorAll('.js-vimeo').forEach((video) => {
    video.contentWindow.postMessage('{"method":"pause"}', '*');
  });
  pauseMediaOnElm.querySelectorAll('video').forEach((video) => video.pause());

  pauseMediaOnElm.querySelectorAll('product-model').forEach((model) => {
    if (model.modelViewerUI) model.modelViewerUI.pause();
  });
}

function removeTrapFocus(elementToFocus = null) {
  document.removeEventListener('focusin', trapFocusHandlers.focusin);
  document.removeEventListener('focusout', trapFocusHandlers.focusout);
  document.removeEventListener('keydown', trapFocusHandlers.keydown);

  if (elementToFocus) elementToFocus.focus();
}

function onKeyUpEscape(event) {
  if (event.code.toUpperCase() !== 'ESCAPE') return;

  const openDetailsElement = event.target.closest('details[open]');
  if (!openDetailsElement) return;

  const summaryElement = openDetailsElement.querySelector('summary');
  openDetailsElement.removeAttribute('open');
  summaryElement.focus();
}

function getAllUrlParams(url) {
  // get query string from url (optional) or window
  var queryString = url ? url.split('?')[1] : window.location.search.slice(1);
  // we'll store the parameters here
  var obj = {};

  // if query string exists
  if (queryString) {
    // stuff after # is not part of query string, so get rid of it
    queryString = queryString.split('#')[0];

    // split our query string into its component parts
    var arr = queryString.split('&');

    for (var i = 0; i < arr.length; i++) {
      // separate the keys and the values
      var a = arr[i].split('=');
      // set parameter name and value (use 'true' if empty)
      var paramName = a[0];
      var paramValue = typeof (a[1]) === 'undefined' ? true : a[1];

      // (optional) keep case consistent
      paramName = paramName.toLowerCase();
      if (typeof paramValue === 'string') paramValue = paramValue.toLowerCase();

      // if the paramName ends with square brackets, e.g. colors[] or colors[2]
      if (paramName.match(/\[(\d+)?\]$/)) {
        // create key if it doesn't exist
        var key = paramName.replace(/\[(\d+)?\]/, '');
        if (!obj[key]) obj[key] = [];

        // if it's an indexed array e.g. colors[2]
        if (paramName.match(/\[\d+\]$/)) {
          // get the index value and add the entry at the appropriate position
          var index = /\[(\d+)\]/.exec(paramName)[1];
          obj[key][index] = paramValue;
        } else {
          // otherwise add the value to the end of the array
          obj[key].push(paramValue);
        }
      } else {
        // we're dealing with a string
        if (!obj[paramName]) {
          // if it doesn't exist, create property
          obj[paramName] = paramValue;
        } else if (obj[paramName] && typeof obj[paramName] === 'string'){
          // if property does exist and it's a string, convert it to an array
          obj[paramName] = [obj[paramName]];
          obj[paramName].push(paramValue);
        } else {
          // otherwise add the property
          obj[paramName].push(paramValue);
        }
      }
    }
  }

  return obj;
}

/*================ Background Check =============*/
function getLuminance (rbgColor) {
  const rgb = rbgColor.match(/\d+/g);
  const a = rgb.map(function (v) {
    v /= 255;
    return v <= 0.03928
        ? v / 12.92
        : Math.pow( (v + 0.055) / 1.055, 2.4 );
  });

  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

const hexToRgb = function (hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function backgroundCheck(target) {
  const elements = document.querySelectorAll(target);
  const darkColor = window.iconColors.dark;
  const lightColor = window.iconColors.light;
  const darkColorLuminance = getLuminance(darkColor);
  const lightColorLuminance = getLuminance(lightColor);

  if (!elements.length) {
    return;
  }

  elements.forEach((elem) => {
    let match;
    const parent = elem.parentElement;
    const colorElm = parent.querySelectorAll('[data-color-element]');
    const str = elem.style.backgroundImage;

    if (!elem.currentSrc && str) {
      const regex = /\(([^)]+)\)/;
      match = regex.exec(str)[1].replace(/"/g, '');
    } else {
      match = elem.src;
    }

    if (match) {
      RGBaster.colors(match, {
        success: function (colors) {
          const colorLuminance = getLuminance(colors.dominant);
          const ratioDark = darkColorLuminance > colorLuminance
          ? ((colorLuminance + 0.05) / (darkColorLuminance + 0.05))
          : ((darkColorLuminance + 0.05) / (colorLuminance + 0.05));

          const ratioLigth = lightColorLuminance > colorLuminance
          ? ((colorLuminance + 0.05) / (lightColorLuminance + 0.05))
          : ((lightColorLuminance + 0.05) / (colorLuminance + 0.05));

          const colorText = ratioLigth < ratioDark ? 'white' : 'black';

          if (elem.classList.contains('chip-color')) {
            const elmClass = colorText == 'black' ? 'chip-color--dark' : 'chip-color--light';
            elem.classList.add(elmClass);
          } else {
            elem.style.color = colorText;

            if (colorElm.length) {
              colorElm.forEach((e) => {
                e.style.color = colorText;
              });
            }
          }
        }
      });
    } else {
      const hexCode = elem.style.backgroundColor;

      if (hexCode) {
        const rgb = window.getComputedStyle(elem).backgroundColor;
        const colorLuminance = getLuminance(rgb);
        const ratioDark = darkColorLuminance > colorLuminance
          ? ((colorLuminance + 0.05) / (darkColorLuminance + 0.05))
          : ((darkColorLuminance + 0.05) / (colorLuminance + 0.05));
        const ratioLigth = lightColorLuminance > colorLuminance
          ? ((colorLuminance + 0.05) / (lightColorLuminance + 0.05))
          : ((lightColorLuminance + 0.05) / (colorLuminance + 0.05));

        const colorText = ratioLigth < ratioDark ? 'white' : 'black';

        if (elem.classList.contains('chip-color')) {
          const elmClass = colorText == 'black' ? 'chip-color--dark' : 'chip-color--light';
          elem.classList.add(elmClass);
        } else {
          elem.style.color = colorText;

          if (colorElm.length) {
            colorElm.forEach((e) => {
              e.style.color = colorText;
            });
          }
        }
      }
    }
  })
}

function hideUnavailableColors(colorSwatch) {
  if (colorSwatch.length) {
    colorSwatch.forEach((elm) => {
      const swatchColorName = elm.dataset.swatchColorValue.toLowerCase();
      let backgroundValue = elm.style.backgroundImage || elm.style.backgroundColor;

      if (swatchColorName && !elm.style.backgroundImage) {
        const style = new Option().style;
        style.color = swatchColorName;

        if (style.color != swatchColorName) {
          backgroundValue = null;
        }
      }

      if (!backgroundValue) {
        elm.classList.add('hide');
      }
    });
  } else {
    if (colorSwatch.style) {
      const swatchColorName = colorSwatch.dataset.swatchColorValue.toLowerCase();
      let backgroundValue = colorSwatch.style.backgroundImage || colorSwatch.style.backgroundColor;

      if (swatchColorName && !colorSwatch.style.backgroundImage) {
        const style = new Option().style;
        style.color = swatchColorName;

        if (style.color != swatchColorName) {
          backgroundValue = null;
        }
      }

      if (!backgroundValue) {
        colorSwatch.classList.add('hide');
      }
    }
  }
}

/*================ Form Validations =============*/
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
    case 'checkbox':
      const fieldWrapper = inputElement.parentElement;
      if (fieldWrapper.dataset.group) {
        const groupWrapper = fieldWrapper.parentElement;
        const minSelection = parseInt(groupWrapper.dataset.min) > 0 ? parseInt(groupWrapper.dataset.min) : 1;
        const checkedElms = groupWrapper.querySelectorAll('input[type=checkbox]:checked');
        const errorMessage = groupWrapper.parentElement.querySelector('.input-error-message');

        if (checkedElms.length < minSelection) {
          isValid = false;
          if (errorMessage) errorMessage.classList.remove('hide');
        } else {
          isValid = true;
          if (errorMessage) errorMessage.classList.add('hide');
        }
      } else {
        isValid = inputElement.checked;
      }

      break;
    case 'file':
      isValid = inputElement.value !== '';
      const dropZone = inputElement.closest('.drop-zone-wrap');
      const errorMessage = dropZone.querySelector('.input-error-message');

      if (dropZone && !isValid) {
        dropZone.classList.add('drop-zone-wrap--error');
        if (errorMessage) {
          errorMessage.querySelector('span:not(.visually-hidden)').textContent = window.variantStrings.fileRequiredError;
          errorMessage.classList.remove('hide');
        }
      }

      break;
    default:
      isValid = inputElement.value !== '';

      if ( inputElement.name === 'address[country]' || inputElement.name === 'country') {
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

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

const serializeForm = form => {
  const obj = {};
  const formData = new FormData(form);

  for (const key of formData.keys()) {
    const regex = /(?:^(properties\[))(.*?)(?:\]$)/;

    if (regex.test(key)) {
      obj.properties = obj.properties || {};
      obj.properties[regex.exec(key)[2]] = formData.get(key);
    } else {
      obj[key] = formData.get(key);
    }
  }

  return JSON.stringify(obj);
};

function fetchConfig(type = 'json') {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': `application/${type}` }
  };
}

/*
 * Shopify Common JS
 *
 */
if ((typeof window.Shopify) == 'undefined') {
  window.Shopify = {};
}

Shopify.bind = function(fn, scope) {
  return function() {
    return fn.apply(scope, arguments);
  }
};

Shopify.setSelectorByValue = function(selector, value) {
  for (var i = 0, count = selector.options.length; i < count; i++) {
    var option = selector.options[i];
    if (value == option.value || value == option.innerHTML) {
      selector.selectedIndex = i;
      return i;
    }
  }
};

Shopify.addListener = function(target, eventName, callback) {
  target.addEventListener ? target.addEventListener(eventName, callback, false) : target.attachEvent('on'+eventName, callback);
};

Shopify.postLink = function(path, options) {
  options = options || {};
  var method = options['method'] || 'post';
  var params = options['parameters'] || {};

  var form = document.createElement("form");
  form.setAttribute("method", method);
  form.setAttribute("action", path);

  for(var key in params) {
    var hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", key);
    hiddenField.setAttribute("value", params[key]);
    form.appendChild(hiddenField);
  }
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};

Shopify.CountryProvinceSelector = function(country_domid, province_domid, options) {
  this.countryEl         = document.getElementById(country_domid);
  this.provinceEl        = document.getElementById(province_domid);
  this.provinceContainer = document.getElementById(options['hideElement'] || province_domid);

  Shopify.addListener(this.countryEl, 'change', Shopify.bind(this.countryHandler,this));

  this.initCountry();
  this.initProvince();
};

Shopify.CountryProvinceSelector.prototype = {
  initCountry: function() {
    var value = this.countryEl.getAttribute('data-default');
    Shopify.setSelectorByValue(this.countryEl, value);
    this.countryHandler();
  },

  initProvince: function() {
    var value = this.provinceEl.getAttribute('data-default');
    if (value && this.provinceEl.options.length > 0) {
      Shopify.setSelectorByValue(this.provinceEl, value);
    }
  },

  countryHandler: function(e) {
    var opt       = this.countryEl.options[this.countryEl.selectedIndex];
    var raw       = opt.getAttribute('data-provinces');
    var provinces = JSON.parse(raw);

    this.clearOptions(this.provinceEl);
    if (provinces && provinces.length == 0) {
      this.provinceContainer.style.display = 'none';
    } else {
      for (var i = 0; i < provinces.length; i++) {
        var opt = document.createElement('option');
        opt.value = provinces[i][0];
        opt.innerHTML = provinces[i][1];
        this.provinceEl.appendChild(opt);
      }

      this.provinceContainer.style.display = "";
    }
  },

  clearOptions: function(selector) {
    while (selector.firstChild) {
      selector.removeChild(selector.firstChild);
    }
  },

  setOptions: function(selector, values) {
    for (var i = 0, count = values.length; i < values.length; i++) {
      var opt = document.createElement('option');
      opt.value = values[i];
      opt.innerHTML = values[i];
      selector.appendChild(opt);
    }
  }
};

Shopify.money_format = "${{amount}}";

Shopify.formatMoney = function(cents, format) {
  if (typeof cents === 'string') { cents = cents.replace('.', ''); }
  var value = '';
  var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
  var formatString = format || this.money_format;

  function defaultOption(opt, def) {
    return (typeof opt == 'undefined' ? def : opt);
  }

  function formatWithDelimiters(number, precision, thousands, decimal) {
    precision = defaultOption(precision, 2);
    thousands = defaultOption(thousands, ',');
    decimal   = defaultOption(decimal, '.');

    if (isNaN(number) || number === null) {
      return 0;
    }

    number = (number / 100.0).toFixed(precision);

    var parts = number.split('.');
    var dollarsAmount = parts[0].replace(
      /(\d)(?=(\d\d\d)+(?!\d))/g,
      '$1' + thousands
    );
    var centsAmount = parts[1] ? decimal + parts[1] : '';
    return dollarsAmount + centsAmount;
  }

  switch (formatString.match(placeholderRegex)[1]) {
    case 'amount':
      value = formatWithDelimiters(cents, 2);
      break;
    case 'amount_no_decimals':
      value = formatWithDelimiters(cents, 0);
      break;
    case 'amount_with_comma_separator':
      value = formatWithDelimiters(cents, 2, '.', ',');
      break;
    case 'amount_no_decimals_with_comma_separator':
      value = formatWithDelimiters(cents, 0, '.', ',');
      break;
    case 'amount_no_decimals_with_space_separator':
      value = formatWithDelimiters(cents, 0, ' ');
      break;
    case 'amount_with_apostrophe_separator':
      value = formatWithDelimiters(cents, 2, "'");
      break;
  }

  return formatString.replace(placeholderRegex, value);
};

class MenuDrawer extends HTMLElement {
  constructor() {
    super();

    this.mainDetailsToggle = this.querySelector('details');
    const summaryElements = this.querySelectorAll('summary');
    this.addAccessibilityAttributes(summaryElements);

    this.addEventListener('keyup', this.onKeyUp.bind(this));
    this.addEventListener('focusout', this.onFocusOut.bind(this));
    this.bindEvents();
  }

  bindEvents() {
    this.querySelectorAll('summary').forEach(summary => summary.addEventListener('click', this.onSummaryClick.bind(this)));
    this.querySelectorAll('button:not(.localization-selector)').forEach(button => button.addEventListener('click', this.onCloseButtonClick.bind(this)));
  }

  addAccessibilityAttributes(summaryElements) {
    summaryElements.forEach(element => {
      element.setAttribute('role', 'button');
      element.setAttribute('aria-expanded', false);
      element.setAttribute('aria-controls', element.nextElementSibling.id);
    });
  }

  onKeyUp(event) {
    if(event.code.toUpperCase() !== 'ESCAPE') return;

    const openDetailsElement = event.target.closest('details[open]');
    if(!openDetailsElement) return;

    openDetailsElement === this.mainDetailsToggle ? this.closeMenuDrawer(this.mainDetailsToggle.querySelector('summary')) : this.closeSubmenu(openDetailsElement);
  }

  onSummaryClick(event) {
    const summaryElement = event.currentTarget;
    const detailsElement = summaryElement.parentNode;
    const isOpen = detailsElement.hasAttribute('open');

    if (detailsElement === this.mainDetailsToggle) {
      if(isOpen) event.preventDefault();
      isOpen ? this.closeMenuDrawer(summaryElement) : this.openMenuDrawer(summaryElement);

      if (window.matchMedia('(max-width: 990px)')) {
        document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`);
      }
    } else {
      const trapFocusElm = detailsElement.querySelector('button') || detailsElement.querySelector('input:not([type="hidden"]):not([type="number"])');

      if (trapFocusElm) {
        trapFocus(summaryElement.nextElementSibling, trapFocusElm);
      }

      setTimeout(() => {
        detailsElement.classList.add('menu-opening');
      });
    }
  }

  openMenuDrawer(summaryElement) {
    setTimeout(() => {
      this.mainDetailsToggle.classList.add('menu-opening');
    });
    summaryElement.setAttribute('aria-expanded', true);

    trapFocus(this.mainDetailsToggle, summaryElement);
    document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
  }

  closeMenuDrawer(event, elementToFocus = false) {
    if (event !== undefined) {
      this.mainDetailsToggle.classList.remove('menu-opening');
      this.mainDetailsToggle.querySelectorAll('details').forEach(details =>  {
        details.removeAttribute('open');
        details.classList.remove('menu-opening');
      });
      this.mainDetailsToggle.querySelector('summary').setAttribute('aria-expanded', false);
      document.body.classList.remove(`overflow-hidden-${this.dataset.breakpoint}`);
      removeTrapFocus(elementToFocus);
      this.closeAnimation(this.mainDetailsToggle);
    }
  }

  onFocusOut(event) {
    setTimeout(() => {
      if (this.mainDetailsToggle.hasAttribute('open') && !this.mainDetailsToggle.contains(document.activeElement)) this.closeMenuDrawer();
    });
  }

  onCloseButtonClick(event) {
    const isMainClose = event.currentTarget.classList.contains('modal__close-main-button');
    const detailsElement = event.currentTarget.closest('details');

    if (isMainClose) {
      const summaryElement = detailsElement.querySelector('summary');
      this.closeMenuDrawer(event, summaryElement);
      return;
    }

    this.closeSubmenu(detailsElement);
  }

  closeSubmenu(detailsElement) {
    detailsElement.classList.remove('menu-opening');
    removeTrapFocus();
    this.closeAnimation(detailsElement);
  }

  closeAnimation(detailsElement) {
    let animationStart;

    const handleAnimation = (time) => {
      if (animationStart === undefined) {
        animationStart = time;
      }

      const elapsedTime = time - animationStart;

      if (elapsedTime < 400) {
        window.requestAnimationFrame(handleAnimation);
      } else {
        detailsElement.removeAttribute('open');
        if (detailsElement.closest('details[open]')) {
          trapFocus(detailsElement.closest('details[open]'), detailsElement.querySelector('summary'));
        }
      }
    }

    window.requestAnimationFrame(handleAnimation);
  }
}

customElements.define('menu-drawer', MenuDrawer);

class HeaderDrawer extends MenuDrawer {
  constructor() {
    super();
  }

  openMenuDrawer(summaryElement) {
    this.announcementBar = this.announcementBar || document.querySelector('announcement-bar');
    this.header = this.header || document.querySelector('.shopify-section-header');
    this.drawerHeader = this.drawerHeader || this.querySelector('.menu-drawer__header');

    this.announcementBar && document.documentElement.style.setProperty(
      '--header-offset-top',
      `${parseInt(this.announcementBar.offsetHeight)}px`
    );

    setTimeout(() => {
      this.mainDetailsToggle.classList.add('menu-opening');
      document.documentElement.style.setProperty(
        '--header-bottom-position',
        `${parseInt(this.drawerHeader.offsetHeight)}px`
      );
    });

    summaryElement.setAttribute('aria-expanded', true);
    window.addEventListener('resize', this.onResize);
    trapFocus(this.mainDetailsToggle, summaryElement);
    document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
  }

  closeMenuDrawer(event, elementToFocus) {
    if (!elementToFocus) return;
    super.closeMenuDrawer(event, elementToFocus);
    window.removeEventListener('resize', this.onResize);
  }

  onResize = () => {
    this.announcementBar &&
      document.documentElement.style.setProperty(
        '--header-offset-top',
        `${parseInt(this.announcementBar.offsetHeight)}px`
      );
    this.drawerHeader &&
      document.documentElement.style.setProperty(
        '--header-bottom-position',
        `${parseInt(this.drawerHeader.offsetHeight)}px`
      );
    document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`);
  };
}

customElements.define('header-drawer', HeaderDrawer);

class ModalDialog extends HTMLElement {
  constructor() {
    super();
    this.querySelector('[id^="ModalClose-"]').addEventListener(
      'click',
      this.hide.bind(this)
    );
    this.addEventListener('keyup', (event) => {
      if (event.code.toUpperCase() === 'ESCAPE') this.hide();
    });
    if (this.classList.contains('media-modal')) {
      this.addEventListener('pointerup', (event) => {
        if (event.pointerType === 'mouse' && !event.target.closest('deferred-media, product-model')) this.hide();
      });
    } else {
      this.addEventListener('click', (event) => {
        if (event.target.nodeName === 'MODAL-DIALOG') this.hide();
      });
    }
  }

  connectedCallback() {
    if (this.moved) return;
    this.moved = true;
    document.body.appendChild(this);
  }

  show(opener) {
    this.openedBy = opener;
    const popup = this.querySelector('.template-popup');
    const scrollY = window.scrollY;
    document.body.classList.add('overflow-hidden');
    document.body.style.top = `-${scrollY}px`;
    this.setAttribute('open', '');
    if (popup) popup.loadContent();
    trapFocus(this, this.querySelector('[role="dialog"]'));
  }

  hide() {
    const scrollY = document.body.style.top;
    document.body.classList.remove('overflow-hidden');
    document.body.dispatchEvent(new CustomEvent('modalClosed'));
    document.body.style.top = '';
    window.scrollTo(0, parseInt(scrollY || '0') * -1);
    this.removeAttribute('open');
    removeTrapFocus(this.openedBy);
    window.pauseAllMedia(this);
  }
}
customElements.define('modal-dialog', ModalDialog);

class ModalOpener extends HTMLElement {
  constructor() {
    super();

    const button = this.querySelector('button');

    if (!button) return;
    button.addEventListener('click', () => {
      const modal = document.querySelector(this.getAttribute('data-modal'));
      if (modal) modal.show(button);
    });
  }
}
customElements.define('modal-opener', ModalOpener);

class DeferredMedia extends HTMLElement {
  constructor() {
    super();
    const poster = this.querySelector('[id^="Deferred-Poster-"]');
    if (!poster) return;
    poster.addEventListener('click', this.loadContent.bind(this));
  }

  loadContent(focus = true) {
    window.pauseAllMedia(this);
    if (!this.getAttribute('loaded')) {
      const content = document.createElement('div');
      content.appendChild(this.querySelector('template').content.firstElementChild.cloneNode(true));

      this.setAttribute('loaded', true);
      const deferredElement = this.appendChild(content.querySelector('video, model-viewer, iframe'));
      if (focus) deferredElement.focus();
      if (deferredElement.nodeName == 'VIDEO' && deferredElement.getAttribute('autoplay')) {
        // force autoplay for safari
        deferredElement.play();
      }
    }
  }
}

customElements.define('deferred-media', DeferredMedia);

class SliderComponent extends HTMLElement {
  constructor() {
    super();
    this.$ = jQuery = theme.jQuery;
    this.thumbnailsWrapper = this.querySelector('.thumbnails-wrapper');
    this.productSingleWrapper = this.querySelector('.product-single__wrapper');
    this.sliderWrapper = this.querySelector('.product-single__media-group__wrap');
    this.slider = this.querySelector('ul');
    this.sliderItems = this.querySelectorAll('li');
    this.prevButton = this.querySelector('button[name="previous"]');
    this.nextButton = this.querySelector('button[name="next"]');
    this.imageZoomWrapper = this.querySelectorAll('[data-image-zoom-wrapper]');
    this.zoomEnabled = this.querySelector('[data-image-zoom-wrapper]') ? this.querySelector('[data-image-zoom-wrapper]').classList.contains('js-zoom-enabled') : null;
    this.initBreakpoints();
  }

  initBreakpoints() {
    enquire.register('screen and (min-width: 1120px)', {
      match: () => {
        if (this.zoomEnabled) {
          this.imageZoomWrapper.forEach((el) => {
            this.enableZoom(el);
          });
        }
        this.bpSmall = false;
      },
      unmatch: () => {
        // destroy image zooming if enabled
        if (this.zoomEnabled) {
          this.imageZoomWrapper.forEach((el) => {
            this.destroyZoom(el);
          });
        }
        this.bpSmall = true;
      }
    });
  }

  onButtonClick(event) {
    event.preventDefault();
    const slideScrollPosition = event.currentTarget.name === 'next' ? this.slider.scrollLeft + this.sliderLastItem.clientWidth : this.slider.scrollLeft - this.sliderLastItem.clientWidth;
    this.slider.scrollTo({
      left: slideScrollPosition
    });
  }

  enableZoom(el) {
    var zoomUrl = el.dataset.zoom;
    this.$(el).zoom({
      url: zoomUrl,
      callback: function(){
        this.classList.add('loaded');
      }
    });
  }

  destroyZoom(el) {
    this.$(el).trigger('zoom.destroy');
  }
}

customElements.define('slider-component', SliderComponent);

class QuantityInput extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector('input');
    this.changeEvent = new Event('change', { bubbles: true });
    this.errorEvent = new Event('error', { bubbles: true });
    this.variantPicker = this.closest('variant-radios') || this.closest('variant-selects');

    this.querySelectorAll('button').forEach(
      (button) => button.addEventListener('click', this.onButtonClick.bind(this))
    );
  }

  connectedCallback() {
    const currentVariant = this.variantPicker ? this.variantPicker.currentVariant : null;
    if (currentVariant) {
      this.updateLimitQuantity(currentVariant);
    }
  }

  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;
    const maxNumberValue = parseInt(this.input.getAttribute('max')) || null;
    const parentElem = event.target.parentElement;
    const plusButton = parentElem.querySelector('.qtyplus');
    const minusButton = parentElem.querySelector('.qtyminus');
    const inputNumberValue = parseInt(this.input.value);

    if (!maxNumberValue || inputNumberValue < maxNumberValue) {
      event.target.name === 'plus' ? this.input.stepUp() : this.input.stepDown();
    } else if (inputNumberValue === maxNumberValue && event.target.name === 'minus') {
      this.input.stepDown();
    }

    if (maxNumberValue && event.target.name === 'plus') {
      const newValue = parseInt(this.input.value);
      if (this.input.dataset.lowStock && newValue == maxNumberValue && newValue <= 5) {
        this.input.dispatchEvent(this.errorEvent);
        plusButton.setAttribute('disabled', true);
      } else if (inputNumberValue >= maxNumberValue) {
        this.input.dispatchEvent(this.errorEvent);
        plusButton.setAttribute('disabled', true);
      }
    } else {
      plusButton.removeAttribute('disabled');
    }

    if (this.input.value === '1') {
      minusButton.setAttribute('disabled', true);
    } else {
      minusButton.removeAttribute('disabled');
    }

    if (previousValue !== this.input.value) this.input.dispatchEvent(this.changeEvent);
  }

  updateLimitQuantity( currentVariant) {
    const variant = currentVariant;
    const inventoryQuantity = variant.inventory_quantity > 0 ? variant.inventory_quantity : 0;
    const quantitySelector = this.querySelector('.quantity__input');
    const quantityValue = parseInt(quantitySelector.value);
    const plusButton = this.querySelector('.qtyplus');
    const minusButton = this.querySelector('.qtyminus');

    plusButton.removeAttribute('disabled');
    quantitySelector.removeAttribute('max');

    if (inventoryQuantity > 0 && quantityValue > inventoryQuantity) {
      quantitySelector.value = inventoryQuantity;
    }

    if (inventoryQuantity > 0) {
      quantitySelector.setAttribute('max', inventoryQuantity);

      if (quantitySelector.dataset.lowStock && quantityValue >= inventoryQuantity && inventoryQuantity <= 5 ) {
        plusButton.setAttribute('disabled', true);
      }
    }

    if ( quantitySelector.value > 1 ) {
      minusButton.removeAttribute('disabled');
    } else {
      minusButton.setAttribute('disabled', true);
    }
  }
}

customElements.define('quantity-input', QuantityInput);

class SectionAnimate extends HTMLElement {
  constructor() {
    super();

    const handleIntersection = (entries, observer) => {
      if (!entries[0].isIntersecting) return;
      observer.unobserve(this);
      this.dataset.animate = true;
    }

    new IntersectionObserver(handleIntersection.bind(this), {rootMargin: '30px 0px 30px 0px'}).observe(this);
  }
}

customElements.define('section-animate', SectionAnimate);

class QuotesSlider extends HTMLElement {
  constructor() {
    super();
    this.$ = jQuery = theme.jQuery;
    this.initQuotesSlider();
  }

  initQuotesSlider() {
    const autoPlay = this.dataset.autoPlay ? false : true;
    const sliderElm = this.querySelector('.quotes-slider-for');
    const $slider = this.$(sliderElm);
    const sliderCount = $slider.data('count');
    const sectionId = this.dataset.section;

    const optionsSliderFor = {
      slidesToShow: 1,
      slidesToScroll: 1,
      arrows: false,
      fade: true,
      pauseOnFocus: true,
      pauseOnHover: true,
      asNavFor: `#quotes-slider-nav-${sectionId}`,
      responsive: [
        {
          breakpoint: 961,
          settings: {
            autoplay: false,
            draggable: true
          }
        }
      ]
    };

    $slider.slick(optionsSliderFor);

    const sliderAutorElm = this.querySelector('.quotes-slider-nav');
    const $sliderAutor = this.$(sliderAutorElm);
    const optionsSliderNav = {
      autoplaySpeed: 12000,
      autoplay: autoPlay,
      slidesToShow: 3,
      slidesToScroll: 1,
      centerPadding: '0',
      centerMode: true,
      arrows: false,
      focusOnSelect: true,
      asNavFor: `#quotes-slider-for-${sectionId}`,
      responsive: [
        {
          breakpoint: 961,
          settings: {
            autoplay: false,
            centerPadding: '26%',
            draggable: true,
            swipeToSlide: true,
            touchMove: true,
            slidesToShow: 1,
            slidesToScroll: 1
          }
        },
        {
          breakpoint: 480,
          settings: {
            centerPadding: '21%',
            slidesToShow: 1,
            slidesToScroll: 1
          }
        }
      ]
    }

    if (sliderCount < 4 ) {
      optionsSliderNav.autoplay = false;
    }

    $sliderAutor.slick(optionsSliderNav);
  }
}

customElements.define('quotes-slider', QuotesSlider);

class VideoColumn extends HTMLElement {
  constructor() {
    super();
    const videos = this.querySelectorAll("video");
    const playOnLoad = this.dataset.playOnLoad;

    if (!playOnLoad) {
      this.initBreakpoints();
    } else {
      this.playVideosOnload(videos);
    }
  }

  initBreakpoints() {
    let videos = this.querySelectorAll("video");

    enquire.register('screen and (min-width: 768px)', {
      match: () => {
        this.bpSmall = false;

        videos.forEach((elm) => {
          elm.addEventListener('mouseover', this.handleMouseOver);
          elm.addEventListener('mouseleave', this.handleMouseleave);
        });
      },
      unmatch: () => {
        this.bpSmall = true;
        videos.forEach((elm) => {
          elm.removeEventListener('mouseover', this.handleMouseOver);
          elm.removeEventListener('mouseleave', this.handleMouseleave);
        });
      }
    });

    enquire.register('screen and (max-width: 768px)', {
      match: () => {
        this.playVideosOnload(videos, true);
      }
    })
  }

  playVideosOnload (videos, disableOnDesktop) {
    videos.forEach((video) => {
      video.muted = true;
      let playPromise = video.play();

      if (playPromise !== undefined) {
        playPromise.then(() => {
          let observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
              if ( disableOnDesktop && this.bpSmall === false) {
                if (!video.paused) {
                  video.pause();
                }
                observer.disconnect();
                return;
              }

              if (!entry.isIntersecting && !video.paused) {
                video.pause();
              } else if (video.paused) {
                video.play();
              }
            });
          }, { threshold: 0.75 });

          observer.observe(video);
        });
      }
    });
  }

  handleMouseOver (event) {
    const videoElm = event.currentTarget;

    if (videoElm) {
      videoElm.play();
    }
  }

  handleMouseleave (event) {
    const videoElm = event.currentTarget;

    if (videoElm) {
      videoElm.pause();
    }
  }
}

customElements.define('video-column', VideoColumn);

class ContactForm extends HTMLElement {
  constructor() {
    super();
    this.contactForm = this.querySelector('#ContactForm');

    if (this.contactForm) {
      this.submitButton = this.contactForm.querySelector('button[type="submit"]');

      if (this.submitButton) {
        this.submitButton.removeAttribute('disabled');
      }

      clearInputErrors(this.contactForm);

      this.contactForm.addEventListener('submit', this._handleContactSubmit.bind(this));
    }
  }

  _handleContactSubmit(evt) {
    const formIsValid = validateForm(this.contactForm);

    if (formIsValid) {
      if (this.submitButton) {
        this.submitButton.classList.add('btn--loading');
      }
    } else {
      evt.preventDefault();
      evt.stopImmediatePropagation();
    }
  }
}

customElements.define('contact-form', ContactForm);

class ShopTheLook extends HTMLElement {
  constructor() {
    super();
    this.$ = jQuery = theme.jQuery;
    this.initBreakpoints();
    this.dotsContainer = this.querySelector('.shop-look__dots-container');
    this.dots = this.querySelectorAll('.shop-look__dots-item');
    this.shopLookContent = this.querySelector('.shop-look__content');
    this.modalWrap = this.querySelector('.shop-look__modal-drawer');
    this.modal = this.querySelector('.shop-look__modal');
    this.closeButton = this.modalWrap.querySelector('.btn-close-modal-text');
    this.lookGroups = this.modalWrap.querySelectorAll('.shop-look__item-wrap');
    this.isVisible = () => this.modalWrap.classList.contains('shop-look__modal-drawer--open');
    this.onDotsContainerClick = this.handleDotsContainerClick.bind(this);

    this.dots.forEach((dot) => {
      dot.addEventListener('click', this.handleDotClick.bind(this));
    });

    this.closeButton.addEventListener('click', this.closeModal.bind(this));
  }

  initBreakpoints() {
    const self = this;

    enquire
      .register('screen and (min-width: 768px) and (max-width: 1024px)', {
        match: () => {
          this.bpTablet = true;
        },
        unmatch: () => {
          this.bpTablet = false;
        }
      });
  }

  handleDotClick(e) {
    e.preventDefault();
    const currentTarget = e.currentTarget;
    const expanded = currentTarget.getAttribute('aria-expanded');
    const productGroupIndex = currentTarget.dataset.lookDot;

    if (expanded === 'true') {
      currentTarget.setAttribute('aria-expanded', 'false');
      this.closeModal();
    } else {
      this.dots.forEach((dot) => {
        dot.setAttribute('aria-expanded', 'false');
      });
      currentTarget.setAttribute('aria-expanded', 'true');
      this.activeElement = currentTarget;
      this.updateModalContent(productGroupIndex);
    }
  }

  updateModalContent(productGroupIndex) {
    let galleries;

    this.modal.style.height = '';
    this.modal.style.transition = 'none';
    const startHeight = window.getComputedStyle(this.modal).height;

    this.lookGroups.forEach((item) => {
      const itemIndex = item.dataset.lookGroup;

      if (item.classList.contains('shop-look__item-wrap--active') && itemIndex !== productGroupIndex) {
        item.classList.remove('shop-look__item-wrap--active');
        item.addEventListener('transitionend', () => {
          if (!item.classList.contains('shop-look__item-wrap--active')) {
            item.style.display = 'none';
          }
        }, { once: true });
      }

      if (itemIndex === productGroupIndex) {
        item.style.removeProperty('display');
        setTimeout(() => item.classList.add('shop-look__item-wrap--active'), 0);

        galleries = item.querySelectorAll('lite-gallery');
      } else {
        item.style.display = 'none';
      }
    });

    if (galleries.length) {
      galleries.forEach((gallery) => {
        const productGallery = gallery.querySelector('.product-single__gallery');
        const galleryNav = gallery.querySelector('.product-single__thumbnails');

        if (productGallery) this.$(productGallery).slick('refresh');
        if (galleryNav) this.$(galleryNav).slick('refresh');
      });
    }

    const height = window.getComputedStyle(this.modal).height;
    this.modal.style.height = startHeight;

    requestAnimationFrame(() => {
      this.modal.style.transition = '';

      requestAnimationFrame(() => {
        this.modal.style.height = height
      });
    });


    this.modalWrap.addEventListener('transitionend', () => {
      this.modal.style.height = '';
    }, { once: true });

    this.openModal(galleries);
  }

  openModal(galleries) {
    this.modalWrap.style.removeProperty('display');
    setTimeout(() => this.modalWrap.classList.add('shop-look__modal-drawer--open'), 0);
    this.dotsContainer.classList.add('shop-look__dots--active-modal');

    this.dotsContainer.addEventListener('click', this.onDotsContainerClick);

    const containerHeight = this.shopLookContent.offsetHeight;
    const modalHeight = this.modalWrap.offsetHeight + 20;

    if (this.bpTablet && containerHeight < modalHeight) {
      this.shopLookContent.style.height = `${modalHeight}px`;
    }

    if (galleries.length) {
      galleries.forEach((gallery) => {
        const productGallery = gallery.querySelector('.product-single__gallery');
        const galleryNav = gallery.querySelector('.product-single__thumbnails');

        if (productGallery) this.$(productGallery).slick('refresh');
        if (galleryNav) this.$(galleryNav).slick('refresh');
      });
    }

    this.modalWrap.addEventListener('transitionend', () => {
      this.modalWrap.focus();
      trapFocus(this.modalWrap);
    }, { once: true });
  }

  closeModal(e) {
    this.modalWrap.classList.remove('shop-look__modal-drawer--open');
    this.dotsContainer.classList.remove('shop-look__dots--active-modal');

    this.dots.forEach((dot) => {
      dot.setAttribute('aria-expanded', 'false');
    });

    this.dotsContainer.removeEventListener('click', this.onDotsContainerClick);
    if (this.bpTablet) {
      this.shopLookContent.style.height = null;
    }

    this.modalWrap.addEventListener('transitionend', () => {
      if (!this.isVisible()) {
        this.modalWrap.style.display = 'none';
      }
    }, { once: true });

    removeTrapFocus(this.activeElement);
  }

  handleDotsContainerClick() {
    this.closeModal();
  }
}

customElements.define('shop-the-look', ShopTheLook);

class ProductRecommendations extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const handleIntersection = (entries, observer) => {
      if (!entries[0].isIntersecting) return;
      observer.unobserve(this);

      fetch(this.dataset.url)
        .then(response => response.text())
        .then(text => {
          if (this.classList.contains('product-recommendations--loaded')) {
            return;
          }

          const recommendations = new DOMParser()
            .parseFromString(text, 'text/html')
            .querySelector('product-recommendations');

          if (recommendations && recommendations.innerHTML.trim().length) {
            this.innerHTML = recommendations.innerHTML;
            const imgsElm = this.querySelectorAll('img');

            imgsElm.forEach((imgElm) => {
              imgElm.onload = () => {
                imgElm.classList.add('loaded');
              }
            });
          } else {
            const productContentItem = this.closest('.product-single__content-details__item');
            if (productContentItem) {
              productContentItem.style.padding = '0';
            }
          }

          this.classList.add('product-recommendations--loaded');

          if (this.classList.contains('complementary-products') ) {
            this.querySelectorAll('script').forEach(oldScriptTag => {
              const newScriptTag = document.createElement('script');
              Array.from(oldScriptTag.attributes).forEach(attribute => {
                newScriptTag.setAttribute(attribute.name, attribute.value)
              });
              newScriptTag.appendChild(document.createTextNode(oldScriptTag.innerHTML));
              oldScriptTag.parentNode.replaceChild(newScriptTag, oldScriptTag);
            });
          }
        })
        .catch(e => {
          console.error(e);
        });
    }

    new IntersectionObserver(handleIntersection.bind(this), {rootMargin: '0px 0px 400px 0px'}).observe(this);
  }
}

customElements.define('product-recommendations', ProductRecommendations);

class ComplementaryProductsCard extends HTMLElement {
  constructor() {
    super();
    this.$ = jQuery = theme.jQuery;
    this.elements = {
      closeOptions: this.querySelector('.btn-close-modal-text'),
      imageWrap: this.querySelector('.complementary-products__image'),
      featuredImage: this.querySelector('.complementary-products__featured-image'),
      thumbnailsWrapper: this.querySelector('.thumbnails-wrapper'),
      productInfoWrapper: this.querySelector('.product__info-wrapper'),
      viewButton: this.querySelector('.complementary-item__view-button'),
      rating: this.querySelector('.product-card__information-rating'),
      buyButtons: this.querySelector('.complementary-products__buy-tools'),
      slickGalery: this.querySelector('lite-gallery')
    }

    this.initBreakpoints();
    if (this.elements.viewButton) {
      this.elements.viewButton.addEventListener('click', this.onOpenOptionsClick.bind(this));
      this.elements.closeOptions.addEventListener('click', this.onCloseOptionsClick.bind(this));
    }
  }

  initBreakpoints() {
    enquire.register('screen and (max-width: 768px)', {
      match: () => {
        this.bpSmall = true;
      },
      unmatch: () => {
        this.bpSmall = false;
      }
    });
  }


  onOpenOptionsClick() {
    this.fadeOutElement(this.elements.viewButton);
    this.fadeOutElement(this.elements.rating, true);

    setTimeout(() => {
      this.classList.add('complementary-products__card--active');
      this.elements.imageWrap.classList.add('complementry__option--active');
    }, 400);

    this.elements.imageWrap.addEventListener('transitionend', () => {
      const productGallery = this.elements.slickGalery.querySelector('.product-single__gallery');
      const galleryNav = this.elements.slickGalery.querySelector('.product-single__thumbnails');
      if (productGallery) this.$(productGallery).slick('refresh');

      this.fadeOutElement(this.elements.featuredImage, true);
      this.elements.productInfoWrapper.classList.add('complementry__option--active');
      this.fadeInElement(this.elements.buyButtons);
      this.fadeInElement(this.elements.rating);

      this.elements.buyButtons.addEventListener('transitionend', () => {
        if (this.elements.thumbnailsWrapper) this.fadeInElement(this.elements.thumbnailsWrapper);
        if (galleryNav) this.$(galleryNav).slick('refresh');
      }, { once: true });
    }, { once: true });
  }

  onCloseOptionsClick() {
    this.classList.remove('complementary-products__card--active');
    this.fadeInElement(this.elements.featuredImage, true);
    this.fadeOutElement(this.elements.buyButtons);
    this.fadeOutElement(this.elements.rating, true);

    this.elements.buyButtons.addEventListener('transitionend', () => {
      this.elements.productInfoWrapper.classList.remove('complementry__option--active');
      if (this.elements.thumbnailsWrapper) this.fadeOutElement(this.elements.thumbnailsWrapper);
      this.elements.imageWrap.classList.remove('complementry__option--active');

      this.elements.imageWrap.addEventListener('transitionend', () => {
        setTimeout(() => {
          this.fadeInElement(this.elements.viewButton);
          this.fadeInElement(this.elements.rating);
        }, 400);
      }, { once: true });
    }, { once: true });
  }

  fadeInElement(elm, display) {
    if (!display) {
      elm.style.removeProperty('display');
    }

    setTimeout(() => elm.classList.add('complementry__option--fade-in'), 0);
  }

  fadeOutElement(elm, display) {
    elm.classList.remove('complementry__option--fade-in');

    if (!display) {
      elm.addEventListener('transitionend', () => {
        elm.style.display = 'none';
      }, { once: true });
    }
  }
}

customElements.define('complementary-products-card', ComplementaryProductsCard);

class QualityChecklist extends HTMLElement {
  constructor() {
    super();
    const handleIntersection = (entries, observer) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          this.dataset.animation = true;
          observer.unobserve(this);
        }
      });
    };

    new IntersectionObserver(handleIntersection.bind(this), { rootMargin: '0px 0px -50px 0px' }).observe(this);
  }
}

customElements.define('quality-checklist', QualityChecklist);

class ColoredText extends HTMLElement {
  constructor() {
    super();
    const colors = this.dataset.colors.split(',');
    const contentSpan = this.querySelector('span');

    if (contentSpan) {
      return;
    }

    const arrayLetters = this.textContent.split('');
    let index = 0;
    this.textContent = '';

    arrayLetters.forEach((letter) => {
      const spanElm = document.createElement('span');
      spanElm.textContent = letter;
      spanElm.style.color = colors[index];

      if (index === 3) {
        index = 0
      } else if (letter !== ' ') {
        index = index + 1;
      }

      this.appendChild(spanElm);
    });
  }
}

customElements.define('colored-text', ColoredText);

class SplitSlider extends HTMLElement {
  constructor() {
    super();
    const content = this.closest('.before-after-content');

    this.addEventListener('input', (evt) => {
      const value = evt.target.value;
      content.style.setProperty('--clip-path-offset', `${value}%`);
    });
  }
}

customElements.define('split-slider', SplitSlider);

class CollapsibleContent extends HTMLElement {
  constructor() {
    super();
    this.details = this.querySelector('details');
    this.summary = this.querySelector('.collapsible');
    this.content = this.querySelector('.accordion__content');
    this.transition = null;
    this.isClosing = false;
    this.isExpanding = false;

    this.summary.addEventListener('click', (e) => this.onClick(e));
  }

  onClick(e) {
    e.preventDefault();
    if (this.isClosing || !this.details.open) {
      this.open();
    } else if (this.isExpanding || this.details.open) {
      this.shrink();
    }
  }

  shrink() {
    this.isClosing = true;
    this.transition = true;
    this.content.style.maxHeight = null;
    this.content.addEventListener('transitionend', () => {
      this.onTransitionFinish(false);
    }, { once: true });
  }

  open() {
    this.details.open = true;
    window.requestAnimationFrame(() => this.expand());
  }

  expand() {
    this.isExpanding = true;

    this.transition = true;
    this.content.style.maxHeight = this.content.scrollHeight + "px";
    this.content.addEventListener('transitionend', () => {
      this.onTransitionFinish(true);
    }, { once: true });
  }

  onTransitionFinish(open) {
    this.details.open = open;
    this.transition = null;
    this.isClosing = false;
    this.isExpanding = false;
  }
}

customElements.define('collapsible-content', CollapsibleContent);

class ImageWithText extends HTMLElement {
  constructor() {
    super();
    const videoFeatureAutoplay = this.querySelector('video.feature-row__video--autoplay');
    const videoOverlay = this.querySelector('.feature-row__video-overlay');
    const videoButtonPlay = videoOverlay ? videoOverlay.querySelector('.feature-row__play') : null;

    if (videoFeatureAutoplay) {
      videoFeatureAutoplay.muted = true;

      const playPromise = videoFeatureAutoplay.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {})
          .catch(() => {
            videoFeatureAutoplay.play();
          });
      }
    }

    if (videoButtonPlay) {
      const videoFeature = this.querySelector('video.feature-row__video');
      videoButtonPlay.addEventListener('click', (e) => {
        e.preventDefault();
        const playPromise = videoFeature.play();

        videoOverlay.classList.add('feature-row__video-overlay--hide');

        if (playPromise !== undefined) {
          playPromise
            .then(() => {})
            .catch(() => {
              videoFeature.play();
            });
        }
      });
    }

    const handleIntersection = (entries, observer) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          this.dataset.animation = true;
          observer.unobserve(this);
        }
      });
    };

    new IntersectionObserver(handleIntersection.bind(this), { rootMargin: '0px 0px -200px 0px' }).observe(this);
  }
}

customElements.define('image-with-text', ImageWithText);

class VideoContent extends HTMLElement {
  constructor() {
    super();
    this.videoElem = this.querySelector('video.media__video');
    const videoOverlay = this.querySelector('.media__video-overlay');

    if (videoOverlay) {
      const videoButtonPlay = videoOverlay.querySelector('.media__play');
      videoButtonPlay.addEventListener('click', (e) => {
        e.preventDefault();
        const playPromise = this.videoElem.play();

        videoOverlay.classList.add('media__video-overlay--hide');

        if (playPromise !== undefined) {
          playPromise
            .then(() => {})
            .catch(() => {
              this.videoElem.play();
            });
        }
      });
    }

    if (this.videoElem && this.videoElem.hasAttribute('autoplay')) {
      this.videoElem.addEventListener('play', () => {
        this.removeAttribute('data-interrupted');
      });

      this.videoElem.play().catch((error) => {
        if (error.name === 'NotAllowedError') {
          this.setAttribute('data-interrupted', true);
        }
      });
    }
  }
}

customElements.define('video-content', VideoContent);

class CountdownTimer extends HTMLElement {
  constructor() {
    super();
    this.timezone = this.timeStringToFloat(this.dataset.timezone);
    this.countDownDate = new Date(`${this.dataset.endDate} ${this.dataset.endTime}:00`).getTime();
    if (isNaN(this.countDownDate)) {
      return;
    }

    this.parentSection = this.closest('.countdown-section-wrapper');
    this.countdownContent = this.parentSection ? this.parentSection.querySelector('.countdown__content') : null;
    this.countdownContentStart = this.countdownContent ? this.countdownContent.querySelector('.countdown__content__start-text') : null;
    this.countdownContentEnd = this.countdownContent ? this.countdownContent.querySelector('.countdown__content__end-text') : null;
    this.hideTimerOnComplete = this.dataset.hideTimer;
    this.daysPlaceholder = this.querySelector('[data-days-placeholder]');
    this.hoursPlaceholder = this.querySelector('[data-hours-placeholder]');
    this.minutesPlaceholder = this.querySelector('[data-minutes-placeholder]');
    this.secondsPlaceholder = this.querySelector('[data-seconds-placeholder]');

    this.timerComplete = false;

    this.init();
  }

  init() {
    const now = this.convertTimezone(this.timezone).getTime();
    const timeDifference = this.countDownDate - now;
    if (timeDifference > 0) {
      this.classList.remove('countdown-timer--hidden');

      if (this.parentSection) {
        this.parentSection.style.display = 'block';
      }
    }

    setInterval(() => {
      if (!this.timerComplete) {
        this.calculateTimer();
      }
    }, 1000);
  }

  timeStringToFloat(time) {
    var hoursMinutes = time.split(/[.:]/);
    var hours = parseInt(hoursMinutes[0], 10);
    var minutes = hoursMinutes[1] ? parseInt(hoursMinutes[1], 10) : 0;
    return hours + minutes / 60;
  }

  convertTimezone (timezone) {
		const now = new Date();
		const local_time = now.getTime();
		const local_offset = now.getTimezoneOffset() * 60000;
		const utc = local_time + local_offset;
		return new Date(utc + (3600000 * timezone));
	};

  calculateTimer() {
    const now = this.convertTimezone(this.timezone).getTime();
    const timeDifference = this.countDownDate - now;

    if (timeDifference > 0) {
      const intervals = {
        days: Math.floor(timeDifference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((timeDifference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((timeDifference / 1000 / 60) % 60),
        seconds: Math.floor((timeDifference / 1000) % 60),
      };

      this.daysPlaceholder.innerHTML = intervals.days;
      this.hoursPlaceholder.innerHTML = intervals.hours;
      this.minutesPlaceholder.innerHTML = intervals.minutes;
      this.secondsPlaceholder.innerHTML = intervals.seconds;
    } else {
      if (this.hideTimerOnComplete === 'true') {
        this.classList.add('countdown-timer--hidden');

        if (this.parentSection) {
          this.parentSection.style.display = 'none';
        }
      }

      if (this.countdownContent && this.countdownContentEnd) {
        this.updateContent();
      }

      this.timerComplete = true;
    }
  }

  updateContent() {
    this.countdownContent.style.height = '';
    this.countdownContent.style.transition = 'none';
    const startHeight = window.getComputedStyle(this.countdownContent).height;

    this.countdownContentStart.remove('countdown__content__active');
    this.countdownContentStart.addEventListener('transitionend', () => {
      this.countdownContentStart.style.display = 'none';
    }, { once: true });

    this.countdownContentEnd.style.removeProperty('display');
    setTimeout(() => this.countdownContentEnd.classList.add('countdown__content__active'), 0);

    const height = window.getComputedStyle(this.countdownContent).height;
    this.countdownContent.style.height = startHeight;

    requestAnimationFrame(() => {
      this.countdownContent.style.transition = '';

      requestAnimationFrame(() => {
        this.countdownContent.style.height = height
      });
    });


    this.countdownContent.addEventListener('transitionend', () => {
      this.countdownContent.style.height = '';
    }, { once: true });
  }
}

customElements.define('countdown-timer', CountdownTimer);

class ProductGridContainer extends HTMLElement {
  constructor() {
    super();
    if (window.location.search && this.dataset.pagination == 'false') {
      this.loadPages();
    }
  }

  loadPages() {
    const params = getAllUrlParams(window.location.href);
    const page = params.page ? parseInt(params.page) : null;
    if (page && page > 1) {
      const currentUrl = `${window.location.pathname}${window.location.search}`;
      const pagesArray = Array.apply(null, Array(page - 1)).map(function (x, i) { return i; });
      const id = 'data-pagination';
      let productsElm = document.getElementById(id);
      let productsElmIsEmpty = productsElm.dataset.empty;
      const newDiv = document.createElement("div");

      if (productsElmIsEmpty) {
        productsElm.querySelector('.product-grid-container--empty').classList.add('loading');
      }

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
            if (sectionInnerHTML && !sectionInnerHTML.dataset.empty) {
              if (productsElmIsEmpty) {
                document.getElementById('ProductGridContainer').innerHTML = htmlElm.getElementById('ProductGridContainer').innerHTML;
                productsElm = document.getElementById(id);
              }
              newDiv.insertAdjacentHTML('beforeend', sectionInnerHTML.innerHTML);
            }
          });

          if (!productsElm.dataset.empty) {
            productsElm.innerHTML = newDiv.innerHTML;
          }
        });
    }
  }
}

customElements.define('product-grid-container', ProductGridContainer);

class ProductCard extends HTMLElement {
  constructor() {
    super();
    const productCardVideo = this.querySelector('.product-card__image[data-video]');

    if (productCardVideo) {
      this.deferredMedia = productCardVideo.querySelector('.deferred-media');
      this.addEventListener('mouseover', this.focusInHandling.bind(this));
      this.addEventListener('mouseleave', this.focusOutHandling.bind(this));
    }
  }

  focusOutHandling() {
    if (this.deferredMedia) {
      this.video = this.video || this.deferredMedia.querySelector('video');
    } else {
      this.video = this.video || this.querySelector('video');
    }

    this.video.pause();
  }

  focusInHandling() {
    if (this.deferredMedia) {
      if (!this.getAttribute('loaded')) {
        const content = document.createElement('div');
        content.appendChild(this.querySelector('template').content.firstElementChild.cloneNode(true));

        this.setAttribute('loaded', true);
        const deferredElement = this.deferredMedia.appendChild(content.querySelector('video'));
        deferredElement.play();
      } else {
        this.video = this.video || this.deferredMedia.querySelector('video');
        this.video.play();
      }
    } else {
      this.video = this.video || this.querySelector('video');
      this.video.play();
    }
  }
}

customElements.define('product-card', ProductCard);

class GridSwatch extends HTMLElement {
  connectedCallback() {
    this.swatchShape = this.getAttribute('data-swatch-shape');
    this.swatchType = this.getAttribute('data-swatch-type');
    this.productItem = this.closest('product-card');
    this.productImage = this.productItem.querySelector('[data-product-image]');
    this.template = document.querySelector('[data-swatch-template]').innerHTML;
    this.swatchesObject = this.getSwatchesObject();
    this.product = JSON.parse(this.productItem.querySelector('[id^="ProductJSON-"]').textContent);
    this.productCardOption = this.closest('.product-card-item__option');

    const swatchLabel = this.getAttribute('data-swatch-label').trim().toLowerCase();
    this.colorOption = this.product.options.find((option) => {
      return option.name.toLowerCase() === swatchLabel || null
    });

    if (this.colorOption) {
      this.swatches = this.colorOption.values;
      this.swatchMockup = this.productItem.querySelector(`[data-swatch-mockup][data-swatch-option='${this.colorOption.name}']`);
      this.init();
    }
  }

  constructor() {
    super();
  }

  init() {
    this.innerHTML = "";
    this.swatchMockup.innerHTML = "";

    this.swatches.forEach((swatch) => {
      let currentVariant = null;
      let availableVariant = false;
      let previewImgSrc = "";

      for (const variant of this.product.variants) {
        const currentOption = variant.options.includes(swatch);
        if (!currentVariant && currentOption) {
          currentVariant = variant;
        }

        if (currentOption && variant.featured_media) {
          previewImgSrc = variant.featured_media.preview_image.src;
          currentVariant = variant;
          break;
        }
      }

      for (const variant of this.product.variants) {
        if (variant.options.includes(swatch) && variant.available) {
          availableVariant = true;
          break;
        }
      }

      if (currentVariant) {
        const swatchItem = document.createElement("div");
        swatchItem.innerHTML = this.template;
        const swatchButton = swatchItem.querySelector('[data-swatch-button]');
        swatchButton.classList.add(`color-swatch-button--${this.swatchShape}`);
        swatchButton.dataset.swatchVariant = currentVariant.id;
        swatchButton.dataset.swatchVariantName = currentVariant.title;
        swatchButton.dataset.swatchImage = previewImgSrc;
        swatchButton.dataset.variant = currentVariant.id;

        const variantUrl = /variant=/.test(this.product.url) ?
          this.product.url.replace(/(variant=)[^&]+/, "$1" + currentVariant.id) : /\?/.test(this.product.url) ?
          this.product.url.concat("&variant=").concat(currentVariant.id) : this.product.url.concat("?variant=").concat(currentVariant.id);
        swatchButton.dataset.variantUrl = variantUrl;

        if (this.swatchType == 'variant-images') {
          swatchButton.style.backgroundImage = `url(${previewImgSrc})`;
        } else {
          const optionValue = this.swatchesObject[swatch];
          var r = /38x38.png/;
          const isImage = r.test(optionValue);

          if (isImage) {
            swatchButton.style.backgroundImage = `url(${optionValue})`;
          } else {
            swatchButton.style.backgroundColor = optionValue;
          }
        }

        this.innerHTML += swatchItem.innerHTML;
      }
    });

    this.swatchMockup.innerHTML = this.innerHTML;
    this.swatchMockup.closest('.product-card-item__option').classList.add('show');
    const productColorsHeight = this.productCardOption.getBoundingClientRect().height;
    const gridSwatchHeight = this.getBoundingClientRect().height;

    this.productCardOption.style.setProperty('--from-height', `${productColorsHeight}px`);
    this.productCardOption.style.setProperty('--to-height', `${gridSwatchHeight}px`);
    this.productCardOption.classList.add('show');
    this.productCardOption.closest('.product-card-item__option').classList.add('show');

    this.handleSwatchEvents();
  }

  handleSwatchEvents() {
    const swatchButtons = this.querySelectorAll('[data-swatch-button]');
    swatchButtons.forEach((swatchButton) => {
      swatchButton.addEventListener('mouseenter', this.handleSwatchMouseEnter.bind(this));
      swatchButton.addEventListener('click', this.handleSwatchMouseClick.bind(this));
    });
    this.productItem.addEventListener('mouseleave', this.handleSwatchMouseLeaveEvent.bind(this));
  }

  handleSwatchMouseEnter(e) {
    const variantName = e.target.getAttribute('data-swatch-variant-name');
    const productImages = this.productImage.querySelectorAll('[data-variant-title]');
    const currentImage = this.productImage.querySelector(`[data-variant-title="${variantName}"]`);

    productImages.forEach((productImage) => {
      productImage.classList.remove('is-visible');
    });

    if (currentImage) currentImage.classList.add('is-visible');
  }

  handleSwatchMouseLeaveEvent() {
    const productImages = this.productImage.querySelectorAll('[data-variant-title].is-visible');

    productImages.forEach((productImage) => {
      productImage.classList.remove('is-visible');
    });
  }

  handleSwatchMouseClick(e) {
    e.preventDefault();
    const variantUrl = e.target.getAttribute('data-variant-url');
    window.location.href = variantUrl;
  }

  getSwatchesObject() {
    if (!this.hasAttribute('data-swatch-values')) return {};
    const swatchValues = this.getAttribute('data-swatch-values').split(",")
    const swatchValuesObject = {};
    swatchValues.forEach((swatchValue) =>{
      const [name, value] = swatchValue.split(":");
      swatchValuesObject[name.trim()] = value.trim();
    });

    return swatchValuesObject;
  }
}

customElements.define('grid-swatch', GridSwatch);

class GridSwatchSibling extends HTMLElement {
  connectedCallback() {
    this.productItem = this.closest('product-card');
    this.productImage = this.productItem.querySelector('[data-product-image]');
    this.productCardOption = this.closest('.product-card-item__option');
    this.init();
  }

  constructor() {
    super();
  }

  init() {
    const productColorsHeight = this.productCardOption.getBoundingClientRect().height;
    const gridSwatchHeight = this.getBoundingClientRect().height;
    this.productCardOption.style.setProperty('--from-height', `${productColorsHeight}px`);
    this.productCardOption.style.setProperty('--to-height', `${gridSwatchHeight}px`);
    this.productCardOption.classList.add('show');
    this.productCardOption.closest('.product-card-item__option').classList.add('show');

    this.handleSwatchEvents();
  }

  handleSwatchEvents() {
    const swatchButtons = this.querySelectorAll('[data-swatch-button]');
    swatchButtons.forEach((swatchButton) => {
      swatchButton.addEventListener('mouseenter', this.handleSwatchMouseEnter.bind(this));
      swatchButton.addEventListener('click', this.handleSwatchMouseClick.bind(this));
    });
    this.productItem.addEventListener('mouseleave', this.handleSwatchMouseLeaveEvent.bind(this));
  }

  handleSwatchMouseClick(e) {
    e.preventDefault();
    const productUrl = e.target.getAttribute('data-product-url');
    window.location.href = productUrl;
  }

  handleSwatchMouseEnter(e) {
    const productName = e.target.getAttribute('data-swatch-product-name');
    const productImages = this.productImage.querySelectorAll('[data-variant-title]');
    const currentImage = this.productImage.querySelector(`[data-variant-title="${productName}"]`);

    productImages.forEach((productImage) => {
      productImage.classList.remove('is-visible');
    });

    if (currentImage) currentImage.classList.add('is-visible');
  }

  handleSwatchMouseLeaveEvent() {
    const productImages = this.productImage.querySelectorAll('[data-variant-title].is-visible');

    productImages.forEach((productImage) => {
      productImage.classList.remove('is-visible');
    });
  }
}

customElements.define('grid-swatch-sibling', GridSwatchSibling);
