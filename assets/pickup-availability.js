if (!customElements.get('pickup-availability')) {
  customElements.define('pickup-availability', class PickupAvailability extends HTMLElement {
    constructor() {
      super();

      if(!this.hasAttribute('available')) return;

      this.errorHtml = this.querySelector('template').content.firstElementChild.cloneNode(true);
      this.variantId = this.dataset.variantId;

      this.fetchAvailability(this.variantId);
    }

    fecthPositionAndAvailability(variantId, sectionInnerHTML) {
      this.renderPreview(sectionInnerHTML);
      // if (!sectionInnerHTML.querySelector('pickup-availability-preview')) {
      //   this.innerHTML = "";
      //   this.removeAttribute('available');
      //   return;
      // }

      // this.closestStore = null;
      // this.variantId = variantId;
      // this.availableLocations = JSON.parse(
      //   sectionInnerHTML.querySelector('[type="application/json"]').innerHTML
      // ).store_availabilities;

      // if (!this.cancelGeolocation && (!this.customerLat || !this.customerLong)) {
      //   if(navigator.geolocation) {
      //     navigator.geolocation.getCurrentPosition((position) => {
      //       this.successCurrentLocation(position, sectionInnerHTML);
      //     }, () => {
      //       this.cancelGeolocation = true;
      //       this.errorCurrentLocation(sectionInnerHTML);
      //     });
      //   } else {
      //     this.renderPreview(sectionInnerHTML);
      //   }
      // } else {
      //   this.getCLosestLocation(sectionInnerHTML);
      // }
    }

    fetchAvailability(variantId) {
      const variantSectionUrl = `${this.dataset.baseUrl}variants/${variantId}/?section_id=pickup-availability`;

      fetch(variantSectionUrl)
        .then(response => response.text())
        .then(text => {
          const sectionInnerHTML = new DOMParser()
            .parseFromString(text, 'text/html')
            .querySelector('.shopify-section');

          this.fecthPositionAndAvailability(variantId, sectionInnerHTML);
        })
        .catch(e => {
          this.renderError();
        });
    }

    renderError() {
      this.innerHTML = '';
      if (this.errorHtml) {
        this.appendChild(this.errorHtml);
      }
    }

    successCurrentLocation(position, sectionInnerHTML) {
      this.customerLat  = position.coords.latitude;
      this.customerLong = position.coords.longitude;
      this.getCLosestLocation(sectionInnerHTML);
    }

    errorCurrentLocation(sectionInnerHTML) {
      this.renderPreview(sectionInnerHTML);
    }

    distance(lat1, lon1, lat2, lon2, unit) {
      const radlat1 = Math.PI * lat1/180;
      const radlat2 = Math.PI * lat2/180;
      const theta = lon1-lon2;
      const radtheta = Math.PI * theta/180;
      let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
      if (dist > 1) {
        dist = 1;
      }
      dist = Math.acos(dist);
      dist = dist * 180/Math.PI;
      dist = dist * 60 * 1.1515;
      if (unit=="K") { dist = dist * 1.609344 }
      if (unit=="N") { dist = dist * 0.8684 }
      return dist;
    }

    getCLosestLocation(sectionInnerHTML) {
      const poslat = this.customerLat;
      const poslng = this.customerLong;
      let closestDistance;
      let closestStore;

      this.availableLocations.forEach((store) => {
        const distance = this.distance(poslat, poslng, store.location.address.latitude, store.location.address.longitude, "K");

        if(closestDistance && distance < closestDistance){
          closestDistance = distance;
          closestStore = store;
        }

        if (!closestDistance) {
          closestDistance = distance;
          closestStore = store;
        }
      });

      this.closestStore = closestStore;
      this.renderPreview(sectionInnerHTML);
    }

    renderPreview(sectionInnerHTML) {
      const drawer = document.querySelector('pickup-availability-drawer');
      if (drawer) drawer.remove();
      if (!sectionInnerHTML.querySelector('pickup-availability-preview')) {
        this.innerHTML = "";
        this.removeAttribute('available');
        return;
      }

      if (this.closestStore) {
        const pickUpTime = this.closestStore.pick_up_time.replace('Usually ready in', 'Ready in about');
        // set the closest location
        sectionInnerHTML.querySelector('.pickup-availability-info .caption-large .pickup-store-name').textContent = this.closestStore.location.name;
        sectionInnerHTML.querySelector('.pickup-availability-info .caption').textContent = pickUpTime;
      }

      this.innerHTML = sectionInnerHTML.querySelector('pickup-availability-preview').outerHTML;
      this.setAttribute('available', '');

      const colorSwatch = sectionInnerHTML.querySelector('.color-swatch');
      if (colorSwatch) {
        hideUnavailableColors(colorSwatch);
      }

      document.body.appendChild(sectionInnerHTML.querySelector('pickup-availability-drawer'));

      this.querySelector('button').addEventListener('click', (evt) => {
        document.querySelector('pickup-availability-drawer').show(evt.target);
      });
    }
  });
}

if (!customElements.get('pickup-availability-drawer')) {
  customElements.define('pickup-availability-drawer', class PickupAvailabilityDrawer extends HTMLElement {
    constructor() {
      super();

      this.onBodyClick = this.handleBodyClick.bind(this);

      this.querySelector('button').addEventListener('click', () => {
        this.hide();
      });

      this.addEventListener('keyup', (e) => {
        if(e.code.toUpperCase() === 'ESCAPE') this.hide();
      });
    }

    handleBodyClick(evt) {
      const target = evt.target;
      if (target != this && !target.closest('pickup-availability-drawer') && target.id != 'ShowPickupAvailabilityDrawer') {
        this.hide();
      }
    }

    hide() {
      this.removeAttribute('open');
      document.body.classList.remove('pickup-availability-drawer');
      document.body.removeEventListener('click', this.onBodyClick);
      const scrollY = document.body.style.top;
      document.body.classList.remove('overflow-hidden');
      document.body.style.top = '';
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
      removeTrapFocus(this.focusElement);
    }

    show(focusElement) {
      this.focusElement = focusElement;
      this.setAttribute('open', '');
      document.body.classList.add('pickup-availability-drawer');
      document.body.addEventListener('click', this.onBodyClick);
      const scrollY = window.scrollY;
      document.body.classList.add('overflow-hidden');
      document.body.style.top = `-${scrollY}px`;
      trapFocus(this);
    }
  });
}
