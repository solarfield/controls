define(
	[
		'solarfield/ok-kit-js/src/Solarfield/Ok/ObjectUtils',
		'solarfield/controls/src/Solarfield/Controls/Control',
		'solarfield/ok-kit-js/src/Solarfield/Ok/CssLoader',
		'solarfield/ok-kit-js/src/Solarfield/Ok/DomUtils',
		'solarfield/ok-kit-js/src/Solarfield/Ok/AnimUtils'
	],
	function (ObjectUtils, Control, CssLoader, DomUtils, AnimUtils) {
		"use strict";

		/**
		 * @class SelectControl
		 * @extends Control
		 */
		var SelectControl = ObjectUtils.extend(Control, {
			//TODO: sort out events, implement change
			//TODO: sort out animation handling, including extensibility
			//TODO: use WeakMap instead of modifying element
			//TODO: use getters/setters
			//TODO: finalize font-face name, etc.
			//TODO: finalize class names, prefixes, data-* attrs
			
			/**
			 * @param {Event} aEvt
			 * @private
			 */
			_scsc_handleSelectChange: function (aEvt) {
				this.getElement().syncControlToElement();
				aEvt.stopPropagation();

				this.getElement().dispatchEvent(new CustomEvent('change', {
					bubbles: true
				}));
			},

			_scsc_handleSelectInput: function (aEvt) {
				this.getElement().syncControlToElement();
				aEvt.stopPropagation();

				this.getElement().dispatchEvent(new CustomEvent('input', {
					bubbles: true
				}));
			},

			_scsc_handleSelectTouch: function () {
				this.setInputSource('pointer');
				this.setPointerType('touch');

				/**
				 * @type {boolean|undefined}
				 * @private
				 * @static
				 */
				SelectControl._scsc_touched = true;
			},

			_scsc_handleSelectClick: function (aEvt) {
				var obeyClick = aEvt.button == 0;

				this.setInputSource('pointer');

				if (SelectControl._scsc_touched) {
					this.setPointerType('touch');

					if (obeyClick) {
						this._scsc_syncFocusables();
					}
				}

				else {
					this.setPointerType('mouse');

					if (obeyClick) {
						this._scsc_syncFocusables();
						this._scsc_openPopup();
					}
				}
			},

			_scsc_handleSelectKeypress: function () {
				this.setInputSource('keyboard');
				this.setPointerType(null);

				this._scsc_syncFocusables();

				if (!SelectControl._scsc_touched) {
					this.getElement().querySelector('.selectControlWidget').focus();
				}
			},

			_scsc_handleWidgetClick: function (aEvt) {
				var obeyClick = aEvt.button == 0;

				if (obeyClick) {
					this._scsc_openPopup();
				}

				this.setInputSource('pointer');
			},

			_scsc_handleWidgetKeypress: function (aEvt) {
				var platform = navigator.platform+'';
				var keyCode = aEvt.key;
				var keyAlt = aEvt.getModifierState('Alt');

				if (
					(platform.indexOf('Windows') > -1 && keyCode == '\u0020')
					|| (platform.indexOf('Linux') > -1 && keyCode == 'ArrowDown' && keyAlt)
					|| (platform.indexOf('Mac') > -1 && (keyCode == 'ArrowDown' || keyCode == 'ArrowDown') && keyAlt)
				) {
					this._scsc_openPopup();
				}

				this.setInputSource('keyboard');
				this.setPointerType(null);
			},

			_scsc_handleItemClick: function (aEvt) {
				var obeyClick = aEvt.button == 0;
				var item = aEvt.currentTarget || aEvt.target;
				var changed;

				if (obeyClick) {
					var multiple = this.getElement().querySelector('.selectControlSelect').multiple;

					changed = this._scsc_setItemSelected(
						item,
						multiple ? !(item.getAttribute('data-control-selected') == true) : true
					);

					if (!multiple) {
						this._scsc_closePopup();
					}
				}

				this.setInputSource('pointer');

				if (obeyClick) {
					if (changed) {
						this.getElement().dispatchEvent(new CustomEvent('input', {
							bubbles: true
						}));
					}
				}
			},

			_scsc_handleItemKeypress: function (aEvt) {
				var item = aEvt.currentTarget || aEvt.target;

				if (aEvt.key == 'Enter') {
					var multiple = this.getElement().querySelector('.selectControlSelect').multiple;

					var changed = this._scsc_setItemSelected(
						item,
						multiple ? !(item.getAttribute('data-control-selected') == true) : true
					);

					if (!multiple) {
						this._scsc_closePopup();
					}

					if (changed) {
						this.getElement().dispatchEvent(new CustomEvent('input', {
							bubbles: true
						}));
					}
				}

				this.setInputSource('keyboard');
			},

			_scsc_setItemSelected: function (aItemEl, aChecked) {
				var selectEl = this.getElement().querySelector('.selectControlSelect');
				var changed, i;

				for (i = 0; i < selectEl.options.length; i++) {
					if (selectEl.options[i].value === aItemEl.getAttribute('data-control-value')) {
						changed = aChecked != selectEl.options[i].selected;
						selectEl.options[i].selected = aChecked;
					}
				}

				if (aChecked) {
					aItemEl.dataset.controlSelected = 1;
				}
				else {
					aItemEl.dataset.controlSelected = 0;
				}

				this._scsc_syncWidgetToSelect();

				return changed;
			},

			_scsc_syncWidgetToSelect: function () {
				var container = this.getElement();
				var el, t, i, selectEl, text, placeholderSelected;

				if (container && container.getAttribute('data-control-ready') == true) {
					selectEl = container.querySelector('.selectControlSelect');
					text = [];
					placeholderSelected = false;

					for (i = 0; i < selectEl.options.length; i++) {
						if (selectEl.options[i].selected) {
							text.push(selectEl.options[i].text);
						}
					}

					text = text.join(', ');

					//if the text is empty, use a non-breaking space, so that height remains consistent
					if (text == '') {
						if (selectEl.multiple && (t = container.getAttribute('data-placeholder'))) {
							text = t;
							placeholderSelected = true;
						}
						else {
							text = '\u00a0';
						}
					}

					if (!selectEl.multiple && selectEl.selectedIndex > -1 && selectEl.options[selectEl.selectedIndex].getAttribute('data-is-placeholder') == true) {
						placeholderSelected = true;
					}

					el = container.querySelector('.selectControlLabelText');
					el.textContent = text;
					el.title = text;

					container.dataset.controlPlaceholderSelected = placeholderSelected ? 1 : 0;

					if (selectEl.multiple) {
						container.classList.remove('selectControlSingle');
						container.classList.add('selectControlMultiple');
					}
					else {
						container.classList.remove('selectControlMultiple');
						container.classList.add('selectControlSingle');
					}
				}
			},

			_scsc_syncFocusables: function () {
				//set the tabindex of the widget and/or the select

				var container = this.getElement();
				var selectEl = container.querySelector('.selectControlSelect');
				var widgetEl = container.querySelector('.selectControlWidget');
				var computedStyle = getComputedStyle(selectEl);

				//if the select is hidden (not just invisible, but completely hidden, aka not aria-perceivable)
				if (computedStyle.display != 'block') {
					//disable focusing of the select
					selectEl.setAttribute('tabindex', '-1');

					//enable focusing of the widget
					widgetEl.setAttribute('tabindex', '0');
				}
			},

			_scsc_openPopup: function () {
				var container = this.getElement();
				var el, el2, elToFocus, i, itemEl;

				var popupEl = container.querySelector('.selectControlPopup');

				if (popupEl) {
					popupEl.textContent = '';
				}

				else {
					popupEl = document.createElement('span');
				}

				var selectEl = container.querySelector('.selectControlSelect');

				popupEl.classList.add('selectControlPopup');

				var listEl = document.createElement('ol');
				listEl.classList.add('selectControlList');
				popupEl.appendChild(listEl);

				for (i = 0; i < selectEl.options.length; i++) {
					itemEl = document.createElement('li');
					listEl.appendChild(itemEl);
					itemEl.classList.add('selectControlItem');
					itemEl.setAttribute('tabindex', '0');
					itemEl.dataset.controlValue = selectEl.options[i].value;
					itemEl.addEventListener('click', this._scsc_handleItemClick);
					itemEl.addEventListener('keydown', this._scsc_handleItemKeypress);
					if (selectEl.options[i].selected) {
						this._scsc_setItemSelected(itemEl, true);
						if (!elToFocus) elToFocus = itemEl;
					}
					else {
						this._scsc_setItemSelected(itemEl, false);
					}

					el = document.createElement('span');
					itemEl.appendChild(el);
					el.classList.add('selectControlItemButton');

					el2 = document.createElement('span');
					el.appendChild(el2);
					el2.classList.add('selectControlItemButtonCheckbox');

					el = document.createElement('span');
					itemEl.appendChild(el);
					el.classList.add('selectControlItemLabel');

					el2 = document.createElement('span');
					el.appendChild(el2);
					el2.classList.add('selectControlItemLabelText');
					el2.textContent = selectEl.options[i].text;
				}

				container.dataset.controlOpen = 1;
				container.appendChild(popupEl);
				this._scsc_syncPopupLayout();
				window.addEventListener('resize', this._scsc_handleWindowResize);
				window.addEventListener('scroll', this._scsc_handleWindowResize);
				document.addEventListener('mousedown', this._scsc_handleDocumentClick);
				document.addEventListener('keydown', this._scsc_handleDocumentKeypress);

				//focus the first checkbox
				(function () {
					var el = elToFocus || popupEl.querySelector('.selectControlItem');

					if (el) {
						setTimeout(function () {
							try {
								el.focus();
							}
							catch (e) {}
						}, 1);
					}
				})();

				return this.animateOpen();
			},

			_scsc_closePopup: function () {
				window.removeEventListener('resize', this._scsc_handleWindowResize);
				window.removeEventListener('scroll', this._scsc_handleWindowResize);
				document.removeEventListener('mousedown', this._scsc_handleDocumentClick);
				document.removeEventListener('keydown', this._scsc_handleDocumentKeypress);

				var container = this.getElement();
				var popup = this.getElement().querySelector('.selectControlPopup');
				var promise;

				container.dataset.controlOpen = 0;

				if (popup) {
					promise = this.animateClose();
				}
				else {
					promise = Promise.resolve();
				}

				return promise;
			},

			_scsc_syncPopupLayout: function () {
				var popup = this.getElement().querySelector('.selectControlPopup');
				var container = this.getElement();
				var i;

				if (popup && container) {
					var styles = [
						['minWidth', container.offsetWidth + 'px'],
						['left', Math.max(DomUtils.offsetLeft(container) - window.pageXOffset, 0) + 'px'],
						['top', Math.max(DomUtils.offsetTop(container) - window.pageYOffset + (container.offsetHeight / 2) - (popup.offsetHeight / 2), 0) + 'px']
					];

					for (i = 0; i < styles.length; i++) {
						if (popup.style[styles[i][0]] != styles[i][1]) {
							popup.style[styles[i][0]] = styles[i][1];
						}
					}
				}
			},

			_scsc_handleWindowResize: function () {
				this._scsc_closePopup();
			},

			_scsc_handleDocumentClick: function (aEvt) {
				var ancestorSelectControl = DomUtils.getAncestorByClassName(aEvt.target, 'selectControl');
				var popup = this.getElement().querySelector('.selectControlPopup');

				//if the click happened outside the current selectControl
				if (!ancestorSelectControl || (popup && popup.parentNode !== ancestorSelectControl)) {
					this._scsc_closePopup();
				}
			},

			_scsc_handleDocumentKeypress: function (aEvt) {
				if ((aEvt.keyCode || aEvt.which) == 27) {
					this._scsc_closePopup();
				}
			},

			/**
			 * @returns {Promise}
			 * @protected
			 */
			animateOpen: function () {
				var popup = this.getElement().querySelector('.selectControlPopup');

				var promise = AnimUtils.onAnimationEnd(popup, 'selectControlPopupOpen')
				.then(function () {
					AnimUtils.setAnimation(popup, null);
					popup.dataset.controlAnimation = '';
					
					//workaround for IE11 layout not updating
					if (self.navigator.userAgent.indexOf('Trident/7.0') > -1) {
						var x = document.body.style.fontSize;
						document.body.style.fontSize = '1px';
						document.body.style.fontSize = x;
					}
				});

				popup.dataset.controlAnimation = 'opening';

				AnimUtils.setAnimation(popup, {
					name: 'selectControlPopupOpen',
					duration: getComputedStyle(popup).animationDuration,
					fillMode: 'forwards'
				});

				return promise;
			},

			/**
			 * @returns {Promise}
			 * @protected
			 */
			animateClose: function () {
				var popup = this.getElement().querySelector('.selectControlPopup');

				var promise = AnimUtils.onAnimationEnd(popup, 'selectControlPopupClose')
				.then(function () {
					AnimUtils.setAnimation(popup, null);
					popup.dataset.controlAnimation = '';
					
					//workaround for IE11 layout not updating
					if (self.navigator.userAgent.indexOf('Trident/7.0') > -1) {
						var x = document.body.style.fontSize;
						document.body.style.fontSize = '1px';
						document.body.style.fontSize = x;
					}
				});

				popup.dataset.controlAnimation = 'closing';

				AnimUtils.setAnimation(popup, {
					name: 'selectControlPopupClose',
					duration: getComputedStyle(popup).animationDuration,
					fillMode: 'forwards'
				});

				return promise;
			},

			/**
			 * @returns {string}
			 * @protected
			 */
			element_getValue: function () {
				return this.getElement().querySelector('.selectControlSelect').value;
			},

			/**
			 * @returns {Array}
			 * @protected
			 */
			element_getValues: function () {
				var values = [];
				var options = this.getElement().querySelector('.selectControlSelect').options;
				var i, len;

				for (i = 0, len = options.length; i < len; i++) {
					if (options[i].selected) {
						values.push(options[i].value);
					}
				}

				return values;
			},

			/**
			 * @param {string|Array|null} aValue
			 * @protected
			 */
			element_setValue: function (aValue) {
				DomUtils.selectOptionsByValue(this.getElement().querySelector('.selectControlSelect'), aValue);
				this.getElement().syncControlToElement();
			},

			/**
			 * @protected
			 */
			element_syncControlToElement: function () {
				SelectControl.super.prototype.element_syncControlToElement.apply(this, arguments);

				this._scsc_syncWidgetToSelect();

				if (this.getElement().querySelector('.selectControlPopup')) {
					if (this.getElement().querySelector('.selectControlSelect').multiple) {
						this._scsc_closePopup();
						this._scsc_openPopup();
					}
				}
			},

			hookup: function (aOptions) {
				return SelectControl.super.prototype.hookup.apply(this, arguments)
				.then(function () {
					return CssLoader.import('solarfield/controls/src/Solarfield/Controls/style/select-control');
				}.bind(this))
				.then(function () {
					var container = this.getElement();
					var el, el2;

					container.classList.add('selectControl');
					container.dataset.controlOpen = 0;

					var selectEl = container.querySelector('select');
					var multiple = selectEl.multiple;
					selectEl.classList.add('selectControlSelect');
					selectEl.addEventListener('change', this._scsc_handleSelectChange);
					selectEl.addEventListener('input', this._scsc_handleSelectInput);
					selectEl.addEventListener('touchstart', this._scsc_handleSelectTouch);
					selectEl.addEventListener('mousedown', this._scsc_handleSelectClick);
					selectEl.addEventListener('keydown', this._scsc_handleSelectKeypress);
					selectEl.addEventListener('keyup', this._scsc_handleSelectKeypress);
					container.classList.add('selectControl' + (multiple ? 'Multi' : 'Single'));

					var widgetEl = document.createElement('span');
					widgetEl.className = 'selectControlWidget';
					widgetEl.addEventListener('mousedown', this._scsc_handleWidgetClick);
					widgetEl.addEventListener('keydown', this._scsc_handleWidgetKeypress);
					widgetEl.addEventListener('keyup', this._scsc_handleWidgetKeypress);

					el = document.createElement('span');
					widgetEl.appendChild(el);
					el.className = 'selectControlLabel';

					el2 = document.createElement('span');
					el.appendChild(el2);
					el2.className = 'selectControlLabelText';

					el = document.createElement('span');
					widgetEl.appendChild(el);
					el.className = 'selectControlButton';

					el2 = document.createElement('span');
					el.appendChild(el2);
					el2.className = 'selectControlButtonIcon';

					container.insertBefore(widgetEl, container.firstChild);
					container.dataset.controlReady = 1;

					this._scsc_syncFocusables();

					container.syncControlToElement();
				}.bind(this))
				.catch(function (e) {
					var el;

					var msg = "Could not create SelectControl.";

					if ((el = this.getElement().querySelector('select'))) {
						if (el.name) {
							msg += " Element name: '" + el.name + "'."
						}
					}

					return Promise.reject((function () {
						var error = new Error(msg);
						error.previous = e;
						return error;
					})());
				}.bind(this));
			},

			constructor: function (aOptions) {
				SelectControl.super.apply(this, arguments);

				this._scsc_handleSelectChange = this._scsc_handleSelectChange.bind(this);
				this._scsc_handleSelectInput = this._scsc_handleSelectInput.bind(this);
				this._scsc_handleSelectTouch = this._scsc_handleSelectTouch.bind(this);
				this._scsc_handleSelectClick = this._scsc_handleSelectClick.bind(this);
				this._scsc_handleSelectKeypress = this._scsc_handleSelectKeypress.bind(this);
				this._scsc_handleWidgetClick = this._scsc_handleWidgetClick.bind(this);
				this._scsc_handleWidgetKeypress = this._scsc_handleWidgetKeypress.bind(this);
				this._scsc_handleItemClick = this._scsc_handleItemClick.bind(this);
				this._scsc_handleItemKeypress = this._scsc_handleItemKeypress.bind(this);
				this._scsc_handleDocumentClick = this._scsc_handleDocumentClick.bind(this);
				this._scsc_handleDocumentKeypress = this._scsc_handleDocumentKeypress.bind(this);
				this._scsc_handleWindowResize = this._scsc_handleWindowResize.bind(this);
				this.element_syncControlToElement = this.element_syncControlToElement.bind(this);
				this.element_getValue = this.element_getValue.bind(this);
				this.element_getValues = this.element_getValues.bind(this);
				this.element_setValue = this.element_setValue.bind(this);

				Object.defineProperties(this.getElement(), {
					value: {
						get: this.element_getValue,
						set: this.element_setValue
					},

					values: {
						get: this.element_getValues
					}
				});
			}
		});

		return SelectControl;
	}
);
