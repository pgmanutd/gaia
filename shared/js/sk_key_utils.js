(function (global) {
  'use strict';

  var softKeyModule = (function () {

    // Keys which are mapped to accesskey
    const SK_KEYS_MAPPING = {
      LSK: 'a',
      CSK: 's',
      RSK: 'd'
    };

    // Storing the reference to softkeys
    var sk_keys = {
      LSK: null,
      CSK: null,
      RSK: null
    };

    // Container created for SoftKey
    var sk_container = null;

    // Check if menu open
    var sk_options_menu = {
      open: false,
      cancelKey: SK_KEYS_MAPPING.LSK,
      cancelKeyText: 'Cancel',
      cancelKeyl10nId: 'cancel'
    };

    // Observer for observing the DOM changes
    var observer = null;

    return {
      init: init
    };

    /**
     * Used to initialize the library
     * @example
     * softKeyModule.init();
     *
     * @param N/A
     * @return void 0
     */
    function init() {

      // Calling destroy to destroy previously initialized variables
      destroy();

      // Selecting the softkey DOM element
      var softKey = document.querySelector('[role="softkey"]');
      if (!softKey) {
        // If null, return
        return;
      }

      // Container will be created to handle options
      // menu and soft keys
      createSoftKeyContainer();

      for (var k in sk_keys) {
        if (sk_keys.hasOwnProperty(k)) {

          // Selecting the button using accesskey
          sk_keys[k] =
                  softKey.querySelector('[accesskey="' + SK_KEYS_MAPPING[k] + '"]');

          if (sk_keys[k]) {

            // Softkeys will be created for NON-Touch UI only
            // A #IFDEF check is required
            createSoftKeyButtons(sk_keys[k], k);

            // Adding Event Listener
            sk_keys[k].addEventListener('click',
                    handleSoftKey,
                    false);
          }
        }
      }

      // Start observing DOM change
      observeDOMChange(softKey);
    }

    /**
     * Used to create soft key container
     * @example
     * createSoftKeyContainer();
     *
     * @param N/A
     * @return void 0
     */
    function createSoftKeyContainer() {
      var sk_button_container = null;

      // Parent container
      sk_container = document.createElement('div');
      sk_container.dataset.subtype = 'menu-parent';
      sk_container.tabIndex = -1;
      sk_container.setAttribute('role', 'dialog');

      sk_button_container = document.createElement('div');
      sk_button_container.classList.add('sk-button-container');
      sk_container.appendChild(sk_button_container);

      document.body.appendChild(sk_container);
    }

    /**
     * Used to create soft key buttons
     * @example
     * createSoftKeyButtons(element, 'LSK');
     *
     * @param {object, string}
     *        key: Key which will be pressed
     *        keyType: Key type ie. LSK, RSK, CSK. 
     *                 Required for adding styles
     * @return void 0
     */
    function createSoftKeyButtons(key, keyType) {
      var button = document.createElement('div');
      button.textContent = key.textContent;
      button.classList.add('sk-buttons', keyType);
      sk_container
              .querySelector('.sk-button-container')
              .appendChild(button);

      // Hide the buttons for Non-Touch UI
      key.classList.add('sk-hide-button');
    }

    /**
     * Used to handle button press
     * @example
     * handleSoftKey();
     *
     * @param N/A
     * @return void 0
     */
    function handleSoftKey() {
      // Check if menu open
      if (!sk_options_menu.open) {
        // Get context menu
        var contextMenu = this.getAttribute('contextmenu');
        var menuItems = null;

        // Show options for context menu
        if (contextMenu) {
          var menu = document.getElementById(contextMenu);
          if (!menu || !menu.children) {
            throw Error('Menu not present');
          }

          menuItems = [].slice.call(menu.children);

          // Show options menu
          // TODO: Handle cancel event if menu is visible.
          showOptionsMenu({
            items: menuItems,
            header: menu.getAttribute('header')
          });
        }
        else {
          // TODO: Do we need to raise events from here or
          // individual developer will handle LSK,CSK,RSK press ?
        }
      }
      else {
        // Binded to LSK
        if (this.getAttribute('accesskey') ===
                sk_options_menu.cancelKey) {

          // Close the menu
          hideOptionsMenu();
        }
      }
    }

    /**
     * Used to create options menu
     * @example
     * showOptionsMenu({items:items,header:'header'});
     *
     * @param {object} options: Pass options
     * @return void 0
     */
    function showOptionsMenu(options) {
      if (!options || !options.items || !options.items.length) {
        return;
      }

      // Retrieve items to be rendered
      var items = options.items;
      // Create the structure
      var form = null;
      form = document.createElement('form');
      form.dataset.type = options.type || 'action';
      form.dataset.subtype = 'menu';
      form.setAttribute('role', 'dialog');
      form.tabIndex = -1;

      // We append title if needed
      if (options.header) {
        var header = document.createElement('header');

        if (typeof options.header === 'string') {
          header.textContent = options.header || '';
        }

        form.appendChild(header);
      }

      // We append a menu with the list of options
      var menu = document.createElement('menu');
      menu.dataset.items = items.length;

      // For each option, we append the item and listener
      items.forEach(function renderOption(item) {
        var button = document.createElement('button');
        button.type = 'button';
        if (item.label && item.label.length) {
          button.textContent = item.label || '';
        } else {
          return;
        }

        if (item.icon) {
          button.style.backgroundImage = 'url("' + item.icon + '")';
          button.classList.add('icon');
        }

        // Listener will be removed once we clean up the DOM
        button.addEventListener('click', function (event) {
          var clickEvt = new MouseEvent('click', {
            'view': window,
            'bubbles': true,
            'cancelable': true
          });
          item.dispatchEvent(clickEvt);
        });

        menu.appendChild(button);
      });

      // Appending the action menu to the form
      form.appendChild(menu);

      // Add cancel key
      var footer = document.createElement('footer');
      footer.textContent = sk_options_menu.cancelKeyText;
      footer.classList.add('sk-cancel-key');

      // TODO: Need to change l10nid, wrong way
      footer.setAttribute('data-l10n-id',
              sk_options_menu.cancelKeyl10nId);

      // Handle Close click, #IFDEF check required
      // for TOUCH UI
      footer.addEventListener('click', function () {
        hideOptionsMenu();
      });

      form.appendChild(footer);

      // Show Menu
      sk_container.insertBefore(form, sk_container.firstChild);
      form.classList.add('visible');

      sk_options_menu.open = true;
    }

    /**
     * Used for hiding options menu
     * @example
     * hideOptionsMenu();
     *
     * @param N/A
     * @return void 0
     */
    function hideOptionsMenu() {
      sk_container
              .querySelector('form')
              .remove('visible');

      sk_options_menu.open = false;
    }

    /**
     * Used to observe DOM changes
     * @example
     * observeDOMChange(element);
     *
     * @param {object} target: Target element on which observer will observe
     * @return void 0
     */
    function observeDOMChange(target) {
      var MutationObserver = window.MutationObserver ||
              window.WebKitMutationObserver ||
              window.MozMutationObserver;
      if (!MutationObserver) {
        throw Error('MutationObserver not supported');
      }

      observer = new MutationObserver(function (mutations) {
        // TODO: Do we need to initialize again or handle each change.
        //       Handling each change might be difficult
        // init();

        // Handling each change
        mutations.forEach(function (mutation) {
        });
      });

      observer.observe(target, {
        attributes: true,
        childList: true,
        characterData: true,
        subtree: true
      });
    }

    /**
     * Used for cleaning up
     * @example
     * destroy();
     *
     * @param N/A
     * @return void 0
     */
    function destroy() {
      sk_keys = {
        LSK: null,
        CSK: null,
        RSK: null
      };

      // Remove event listeners
      for (var k in sk_keys) {
        if (sk_keys.hasOwnProperty(k) && sk_keys[k]) {
          sk_keys[k]
                  .removeEventListener('click', handleSoftKey, false);
        }
      }

      if (sk_container) {
        // Remove the container
        document.removeChild(sk_container);

        // set to null to remove reference for garbage collector
        sk_container = null;
      }

      // Disconnect the observer
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    }

  })();

  // Initializing the module. Will be called once only.
  softKeyModule.init();

})(this);
