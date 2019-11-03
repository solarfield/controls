define(
	[
		'solarfield/ok-kit-js/src/Solarfield/Ok/ObjectUtils',
		'solarfield/controls/src/Solarfield/Controls/Control',
		'solarfield/ok-kit-js/src/Solarfield/Ok/CssLoader',
		'solarfield/ok-kit-js/src/Solarfield/Ok/DomUtils',
		'solarfield/ok-kit-js/src/Solarfield/Ok/AnimUtils',
		'solarfield/ok-kit-js/src/Solarfield/Ok/StructUtils'
	],
	function (ObjectUtils, Control, CssLoader, DomUtils, AnimUtils, StructUtils) {
		"use strict";

		/**
		 * @class SelectControl
		 * @extends Control
		 */
		var SelectControl = ObjectUtils.extend(Control, {
			//TODO: sort out events, implement change
			//TODO: sort out animation handling, including extensibility
			//TODO: finalize font-face name, etc.
			//TODO: finalize class names, prefixes, data-* attrs

			/**
			 * @param {Event} aEvt
			 * @private
			 */
			_scsc_handleSelectChange: function (aEvt) {
				this.syncToElement();
				aEvt.stopPropagation();

				this.element.dispatchEvent(new UIEvent('change'));
			},

			_scsc_handleSelectInput: function (aEvt) {
				this.syncToElement();
				aEvt.stopPropagation();

				this.element.dispatchEvent(new InputEvent('input'));
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
					this.element.querySelector('.selectControlWidget').focus();
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

			_scsc_handleItemLabelClick: function (aEvt) {
				var item = (aEvt.currentTarget || aEvt.target).parentNode;
				var obeyClick = aEvt.button == 0;
				this._scsc_syncItemClick(item, obeyClick, true);
			},

			_scsc_handleItemButtonClick: function (aEvt) {
				var item = (aEvt.currentTarget || aEvt.target).parentNode;
				var obeyClick = aEvt.button == 0;
				this._scsc_syncItemClick(item, obeyClick, false);
			},

			/**
			 * @param aItem
			 * @param {bool} aObeyClick
			 * @param {bool} aSingleMode Whether the click originates from a source that should use the
			 *   alternate "select a single item only" mode. Clicking the checkbox part of an item
			 *   (in a multiple select) uses "true" here, where as clicking the text label of an item
			 *   uses "false".
			 * @private
			 */
			_scsc_syncItemClick: function (aItem, aObeyClick, aSingleMode) {
				var changed, multiple, singleMode, selectedState, replace, close;

				if (aObeyClick) {
					multiple = this.element.querySelector('.selectControlSelect').multiple;


					// the resolved value for aSingleMode
					singleMode =
						aSingleMode

						// in stay-open mode, the popup always stays open, and clicking always toggles items
						&& SelectControl.getDefault('multipleSelectionMode') !== 'stay-open'

						// ignore aSingleMode if there are already multiple items selected
						// This is to prevent the full selection from being replaced, if a user mis-clicks
						// onto the text/label (instead of checkbox), during their interaction.
						&& this.values.length < 2;


					if (multiple) {
						selectedState = singleMode ? true : !(aItem.dataset.controlSelected == true);
					}
					else {
						selectedState = true;
					}

					changed = this._scsc_setItemSelected(
						aItem,
						selectedState,
						!multiple || singleMode
					);

					if (!multiple || singleMode) {
						this._scsc_closePopup();
					}
				}

				// TODO: should move this to callers, and get rid of aObeyClick
				this.setInputSource('pointer');

				if (aObeyClick) {
					if (changed) {
						//workaround for IE11 layout not updating
						if (self.navigator.userAgent.indexOf('Trident/7.0') > -1) {
							var x = document.body.style.fontSize;
							document.body.style.fontSize = '1px';
							document.body.style.fontSize = x;
						}

						this.element.dispatchEvent(new InputEvent('input'));
					}
				}
			},

			_scsc_handleItemKeypress: function (aEvt) {
				var item = aEvt.currentTarget || aEvt.target;

				if (aEvt.key == 'Enter') {
					var multiple = this.element.querySelector('.selectControlSelect').multiple;

					var changed = this._scsc_setItemSelected(
						item,
						multiple ? !(item.getAttribute('data-control-selected') == true) : true
					);

					if (!multiple) {
						this._scsc_closePopup();
					}

					if (changed) {
						this.element.dispatchEvent(new InputEvent('input'));
					}
				}

				this.setInputSource('keyboard');
			},

			/**
			 * @param {Element} aItemEl The .selectControlItem element.
			 * @param {bool} aSelected Whether to set the item selected or unselected.
			 * @param {bool} [aReplace=false] Whether to clear any previously selected options.
			 * @return {bool}
			 * @private
			 */
			_scsc_setItemSelected: function (aItemEl, aSelected, aReplace) {
				var selectEl = this.element.querySelector('.selectControlSelect');
				var replace = aReplace == undefined ? false : true == aReplace;
				var changed, i;

				if (replace) {
					selectEl.selectedIndex = -1;

					Array.from(
						this.element.querySelectorAll(
							'.selectControlPopup > .selectControlList > .selectControlItem[data-control-selected="1"]'
						),
						function (item) {
							item.dataset.controlSelected = 0;
						}
					);
				}

				for (i = 0; i < selectEl.options.length; i++) {
					if (selectEl.options[i].value === aItemEl.getAttribute('data-control-value')) {
						changed = aSelected != selectEl.options[i].selected;
						selectEl.options[i].selected = aSelected;
					}
				}

				if (aSelected) {
					aItemEl.dataset.controlSelected = 1;
				}
				else {
					aItemEl.dataset.controlSelected = 0;
				}

				this._scsc_syncWidgetToSelect();

				return changed;
			},

			_scsc_syncWidgetToSelect: function () {
				var container = this.element;
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

				var container = this.element;
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
				var container = this.element;
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
					el.addEventListener('click', this._scsc_handleItemButtonClick);

					el2 = document.createElement('span');
					el.appendChild(el2);
					el2.classList.add('selectControlItemButtonCheckbox');

					el = document.createElement('span');
					itemEl.appendChild(el);
					el.classList.add('selectControlItemLabel');
					el.addEventListener('click', this._scsc_handleItemLabelClick);

					el2 = document.createElement('span');
					el.appendChild(el2);
					el2.classList.add('selectControlItemLabelText');
					el2.textContent = selectEl.options[i].text;
				}

				container.dataset.controlOpen = 1;
				container.appendChild(popupEl);
				this._scsc_syncPopupLayout();
				window.addEventListener('resize', this._scsc_handleWindowResize);
				window.addEventListener('scroll', this._scsc_handleWindowScroll);
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

				return this._scsc_animateOpen();
			},

			_scsc_closePopup: function () {
				window.removeEventListener('resize', this._scsc_handleWindowResize);
				window.removeEventListener('scroll', this._scsc_handleWindowScroll);
				document.removeEventListener('mousedown', this._scsc_handleDocumentClick);
				document.removeEventListener('keydown', this._scsc_handleDocumentKeypress);

				var container = this.element;
				var popup = this.element.querySelector('.selectControlPopup');
				var promise;

				container.dataset.controlOpen = 0;

				if (popup) {
					promise = this._scsc_animateClose();
				}
				else {
					promise = Promise.resolve();
				}

				return promise;
			},

			_scsc_syncPopupLayout: function () {
				var popup = this.element.querySelector('.selectControlPopup');
				var container = this.element;
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
				if (SelectControl.getDefault('closeOnResize')) this._scsc_closePopup();
			},

			_scsc_handleWindowScroll: function () {
				if (SelectControl.getDefault('closeOnScroll')) this._scsc_closePopup();
			},

			_scsc_handleDocumentClick: function (aEvt) {
				var ancestorSelectControl = DomUtils.getAncestorByClassName(aEvt.target, 'selectControl');
				var popup = this.element.querySelector('.selectControlPopup');

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
			 */
			_scsc_animateOpen: function () {
				var popup = this.element.querySelector('.selectControlPopup');

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
			 */
			_scsc_animateClose: function () {
				var popup = this.element.querySelector('.selectControlPopup');

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

			element_getValue: function () {
				console.warn("SelectControl: Element.value has been deprecated.");
				return this.value;
			},

			element_getValues: function () {
				console.warn("SelectControl: Element.values has been deprecated.");
				return this.values;
			},

			element_setValues: function (aValues) {
				console.warn("SelectControl: Element.values has been deprecated.");
				this.values = aValues;
			},

			syncToElement: function () {
				SelectControl.super.prototype.syncToElement.apply(this, arguments);

				this._scsc_syncWidgetToSelect();

				if (this.element.dataset.controlOpen == true) {
					if (this.element.querySelector('.selectControlPopup')) {
						if (this.element.querySelector('.selectControlSelect').multiple) {
							this._scsc_closePopup();
							this._scsc_openPopup();
						}
					}
				}
			},

			hookup: function (aOptions) {
				return SelectControl.super.prototype.hookup.apply(this, arguments)
				.then(function () {
					return CssLoader.import('solarfield/controls/src/Solarfield/Controls/style/select-control');
				}.bind(this))
				.then(function () {
					var container = this.element;
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

					var widgetEl = container.querySelector('.selectControlWidget');
					if (!widgetEl) widgetEl = document.createElement('span');
					widgetEl.className = 'selectControlWidget';
					widgetEl.addEventListener('mousedown', this._scsc_handleWidgetClick);
					widgetEl.addEventListener('keydown', this._scsc_handleWidgetKeypress);
					widgetEl.addEventListener('keyup', this._scsc_handleWidgetKeypress);

					el = widgetEl.querySelector('.selectControlLabel');
					if (!el) el = document.createElement('span');
					widgetEl.appendChild(el);
					el.className = 'selectControlLabel';

					el2 = el.querySelector('.selectControlLabelText');
					if (!el2) el2 = document.createElement('span');
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

					this.syncToElement();
				}.bind(this))
				.catch(function (e) {
					var el;

					var msg = "Could not create SelectControl.";

					if ((el = this.element.querySelector('select'))) {
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

			get value() {
				return this.element.querySelector('.selectControlSelect').value;
			},

			set value(aValue) {
				DomUtils.selectOptionsByValue(this.element.querySelector('.selectControlSelect'), aValue);
				this.syncToElement();
			},

			get values() {
				var values = [];
				var options = this.element.querySelector('.selectControlSelect').options;
				var i, len;

				for (i = 0, len = options.length; i < len; i++) {
					if (options[i].selected) {
						values.push(options[i].value);
					}
				}

				return values;
			},

			set values(aValues) {
				DomUtils.selectOptionsByValue(this.element.querySelector('.selectControlSelect'), aValues);
				this.syncToElement();
			},

			/**
			 * @param {{}} [aOptions]
			 * @param {string} [aOptions.multipleSelectionMode=stay-open] - How selection behaves in multiple mode.
			 *  stay-open: The drop-down will stay open until the user clicks away, hits the Esc key, etc.
			 *  smart: If the item label is clicked, the drop-down will close. If the checkbox is clicked,
			 *    it will stay open.
			 */
			constructor: function (aOptions) {
				SelectControl.super.apply(this, arguments);

				this._scsc_handleSelectChange = this._scsc_handleSelectChange.bind(this);
				this._scsc_handleSelectInput = this._scsc_handleSelectInput.bind(this);
				this._scsc_handleSelectTouch = this._scsc_handleSelectTouch.bind(this);
				this._scsc_handleSelectClick = this._scsc_handleSelectClick.bind(this);
				this._scsc_handleSelectKeypress = this._scsc_handleSelectKeypress.bind(this);
				this._scsc_handleWidgetClick = this._scsc_handleWidgetClick.bind(this);
				this._scsc_handleWidgetKeypress = this._scsc_handleWidgetKeypress.bind(this);
				this._scsc_handleItemLabelClick = this._scsc_handleItemLabelClick.bind(this);
				this._scsc_handleItemButtonClick = this._scsc_handleItemButtonClick.bind(this);
				this._scsc_handleItemKeypress = this._scsc_handleItemKeypress.bind(this);
				this._scsc_handleDocumentClick = this._scsc_handleDocumentClick.bind(this);
				this._scsc_handleDocumentKeypress = this._scsc_handleDocumentKeypress.bind(this);
				this._scsc_handleWindowResize = this._scsc_handleWindowResize.bind(this);
				this._scsc_handleWindowScroll = this._scsc_handleWindowScroll.bind(this);
				this.element_getValue = this.element_getValue.bind(this);
				this.element_getValues = this.element_getValues.bind(this);
				this.element_setValues = this.element_setValues.bind(this);

				var options = StructUtils.assign({
					// TODO
				}, aOptions||{});

				Object.defineProperties(this.element, {
					value: {
						get: this.element_getValue,
						set: this.element_setValues,
					},

					values: {
						get: this.element_getValues,
						set: this.element_setValues,
					}
				});
			},
		});

		SelectControl._scsc_instances = new WeakMap();

		SelectControl._scsc_defaults = {
			// stay-open: The items popup will stay open until clicked away from
			//
			// smart: The following behaviours apply:
			//   - clicking an item's checkbox directly, will toggle that item, and keep the popup open
			//   - clicking an item's text/label will select that item, unselect all other items,
			//     and close the popup (similar to how a single-select works):
			//     - unless there are already multiple items selected, in which clicking the label will
			//       toggle it, and keep the popup open.
			multipleSelectionMode: 'smart',

			closeOnScroll: true,
			closeOnResize: true,
		};

		SelectControl.summon = function (aElement) {
			return this._scsc_instances.get(aElement);
		};

		SelectControl.summonBySelect = function (aSelectElement) {
			return this._scsc_instances.get(aSelectElement);
		};

		SelectControl.create = function (aOptions) {
			return SelectControl.super.create.call(this, aOptions)
				.then(function (control) {
					this._scsc_instances.set(control.element, control);
					this._scsc_instances.set(control.element.querySelector('.selectControlSelect'), control);
					return control
				}.bind(this));
		};

		SelectControl.getDefault = function (aName) {
			if (!aName in this._scsc_defaults) throw new Error(
				"Unknown SelectControl default: '" + aName + "'"
			);

			return this._scsc_defaults[aName];
		};

		SelectControl.setDefault = function (aName, aValue) {
			if (!aName in this._scsc_defaults) throw new Error(
				"Unknown SelectControl default: '" + aName + "'"
			);

			this._scsc_defaults[aName] = aValue;
		};

		return SelectControl;
	}
);
