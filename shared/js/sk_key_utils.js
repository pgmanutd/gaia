(function () {

  'use strict';

  // Keys which are mapped to accesskey
  const KEYS_MAPPING = {
    LSK: 'F1',
    CSK: 'Enter',
    RSK: 'F2'
  };

  // Storing the reference to keys
  // which will show options menu
  var elements = {
    LSK: null,
    CSK: null,
    RSK: null
  };

  // Container created for SoftKey
  var container = null;

  // Check if menu open
  var options_menu = {
    open: false,
    form: null,
    cancelKey: KEYS_MAPPING.LSK,
    cancelKeyText: 'Cancel',
    cancelKeyl10nId: 'cancel'
  };

  // Observer for observing the DOM changes
  var observer = null;

  //////////////////////////////

  // Initializing the module. Will be called once only.
  document.addEventListener(
          'DOMContentLoaded',
          init);

  //////////////////////////////

  /**
   * Used to initialize the library
   * @example
   * init();
   *
   * @param N/A
   * @return void 0
   */
  function init() {

    // Container will be created to handle
    // soft keys
    // A #IFDEF check is required for
    // NON-TOUCH UI
    createSoftKeyContainer();

    for (var k in elements) {
      if (elements.hasOwnProperty(k)) {

        // Selecting the button using accesskey
        // Intially only 1 view will be visible
        // with a particular accesskey
        elements[k] = document
                .querySelector('[accesskey="' + KEYS_MAPPING[k] + '"]');

        // Check if element found and visible
        if (elements[k] && elements[k].offsetHeight) {

          // Softkeys will be created for NON-Touch UI
          // A #IFDEF check is required for
          // NON-TOUCH UI
          createSoftKeyButton(elements[k], k);

          // Adding Event Listener for
          // displaying options menu
          // A #IFDEF check is required for
          // TOUCH UI
          var contextMenu = elements[k].getAttribute('contextmenu');
          if (contextMenu) {
            // Adding event listener for creating options menu
            elements[k].addEventListener('click', function () {
              handleOptionsMenu.call(elements[k], contextMenu);
            });
          }
        }
      }
    }

    // Adding Event Listener for keyup
    // A #IFDEF check is required for
    // NON-TOUCH UI
    window.addEventListener('keyup', handleSoftKey);

    // Start observing DOM change
    observeDOMChange(document);
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
    // Parent container
    container = document.createElement('div');
    container.dataset.subtype = 'softkey-container';
    container.tabIndex = -1;

    container.classList.add('sk-container');

    document.body.appendChild(container);
  }

  /**
   * Used to create soft key buttons
   * @example
   * createSoftKeyButton(element, 'LSK');
   *
   * @param {object, string}
   *        key: Key which will be pressed
   *        keyType: Key type ie. LSK, RSK, CSK. 
   *                 Required for adding styles
   * @return void 0
   */
  function createSoftKeyButton(key, keyType) {
    var button = document.createElement('div');
    button.textContent = key.textContent;
    button.classList.add('sk-buttons', keyType);
    container.appendChild(button);

    // Hide the buttons for Non-Touch UI
    // Hiding visible buttons
    key.classList.add('sk-hide-button');
  }

  /**
   * Used to handle button press
   * @example
   * handleSoftKey(event);
   *
   * @param {event}
   *        e: Event object
   * @return void 0
   */
  function handleSoftKey(e) {
    for (var k in elements) {
      if (elements.hasOwnProperty(k)) {
        if (e.key === elements[k].accessKey) {
          e.preventDefault();

          // If menu not open
          if (!options_menu.open) {
            // Raise event on element
            elements[k].click();
          }
          else {
            // Binded to LSK
            if (e.key ===
                    options_menu.cancelKey) {

              // Close the menu
              hideOptionsMenu();
            }
          }

          break;
        }
      }
    }
  }

  /**
   * Used to handle button press
   * @example
   * handleOptionsMenu('menu1');
   *
   * @param {string}
   *        contextMenu: Options menu id
   * @return void 0
   */
  function handleOptionsMenu(contextMenu) {
    var menuItems = null;
    var menu = document.getElementById(contextMenu);
    if (!menu || !menu.children) {
      throw Error('Menu not present');
    }

    menuItems = [].slice.call(menu.children);

    // Show options menu
    showOptionsMenu({
      items: menuItems,
      header: menu.getAttribute('header')
    });
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
    options_menu.form = null;
    options_menu.form = document.createElement('form');
    options_menu.form.dataset.type = options.type || 'action';
    options_menu.form.dataset.subtype = 'menu';
    options_menu.form.setAttribute('role', 'dialog');
    options_menu.form.classList.add('sk-key-menu');
    options_menu.form.tabIndex = -1;

    // We append title if needed
    if (options.header) {
      var header = document.createElement('header');

      if (typeof options.header === 'string') {
        header.textContent = options.header || '';
      }

      options_menu.form.appendChild(header);
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
        item.click();
      });

      menu.appendChild(button);
    });

    // Appending the action menu to the form
    options_menu.form.appendChild(menu);

    // Add cancel key
    var footer = document.createElement('footer');
    footer.textContent = options_menu.cancelKeyText;
    footer.classList.add('sk-cancel-key');
    // A #IFDEF check is required for
    // TOUCH UI
    footer.classList.add('sk-cancel-key-touch');

    // TODO: Need to change l10nid, wrong way
    footer.setAttribute('data-l10n-id',
            options_menu.cancelKeyl10nId);

    // Handle Close click, #IFDEF check required
    // for TOUCH UI
    footer.addEventListener('click', function () {
      hideOptionsMenu();
    });

    options_menu.form.appendChild(footer);

    // Show Menu
    if (!options_menu.form.parentNode) {
      document.body.appendChild(options_menu.form);

      // Flush style on form so that the show transition plays once we add
      // the visible class.
      options_menu.form.clientTop;
    }
    options_menu.form.classList.add('visible');

    options_menu.open = true;
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
    if (options_menu.form) {
      options_menu.form.remove('visible');
    }
    else {
      throw Error('Form not present');
    }

    options_menu.open = false;
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
    observer = new MutationObserver(function (mutations) {
      // Handling each change
      mutations.forEach(function (mutation) {
        for (var k in elements) {
          if (elements.hasOwnProperty(k)) {

            if (mutation.type === 'childList') {
              // Detect if TextContent Changes
              if (elements[k] === mutation.target) {
                container.querySelector('.' + k).textContent =
                        mutation.target.textContent;

                // No need to check if element is removed or added
                break;
              }

              // Detect if element with accesskey
              // attribute is removed
              if (mutation.removedNodes &&
                      mutation.removedNodes.length) {
                for (var i = 0; i < mutation.removedNodes.length; i++) {
                  // Detect if accesskey is there
                  if (elements[k] === mutation.removedNodes[i]) {
                    container.querySelector('.' + k).remove();
                    elements[k] = null;
                  }
                }
              }

              // TODO: Detect if element with accesskey
              // attribute is added
            }
            // Detect if accesskey changed
            // on current element
            else if (mutation.type === 'attributes' &&
                    mutation.attributeName === 'accesskey') {

              // Check if key matched
              if (mutation.target.accessKey === KEYS_MAPPING[k]) {
                // Or may be copy the accesskey attribute
                elements[k] = mutation.target;
              }
            }
          }
        }
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
    elements = {
      LSK: null,
      CSK: null,
      RSK: null
    };

    options_menu.form = null;

    if (container) {
      // Remove the container
      document.removeChild(container);

      // set to null to remove reference for garbage collector
      container = null;
    }

    window.removeEventListener('keyup', handleSoftKey);

    // Disconnect the observer
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

})();
