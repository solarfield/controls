define(
	[
		'module',
		'solarfield/ok-kit-js/src/Solarfield/Ok/ObjectUtils',
		'solarfield/ok-kit-js/src/Solarfield/Ok/EventTarget',
		'solarfield/ok-kit-js/src/Solarfield/Ok/DomUtils',
	],
	function (module, ObjectUtils, EventTarget, DomUtils) {
		"use strict";

		/**
		 * @class Control
		 */
		var Control = ObjectUtils.extend(Object, {
			/**
			 * @param {string} aSource
			 * @protected
			 */
			setInputSource: function (aSource) {
				var container = this.element;

				if (container.getAttribute('data-control-input-source') != aSource) {
					container.setAttribute('data-control-input-source', aSource);
				}
			},

			/**
			 * @param {string|null} aType
			 * @protected
			 */
			setPointerType: function (aType) {
				var container = this.element;

				if (aType === null) {
					container.removeAttribute('data-control-pointer-type');
				}

				else {
					if (container.getAttribute('data-control-pointer-type') != aType) {
						container.setAttribute('data-control-pointer-type', aType);
					}
				}
			},

			/**
			 * @returns {Solarfield.Ok.EventTarget}
			 * @protected
			 */
			getEventTarget: function () {
				if (!this._cfc_eventTarget) {
					/**
					 * @private
					 */
					this._cfc_eventTarget = new EventTarget();
				}

				return this._cfc_eventTarget;
			},

			syncToElement: function () {

			},

			/**
			 * @protected
			 */
			element_syncControlToElement: function () {
				console.groupCollapsed();
				console.warn("Control: Element.syncControlToElement() has been deprecated.");
				console.trace();
				console.groupEnd();
				this.syncToElement();
			},

			/**
			 * Adds an event listener to the Control instance (not the element).
			 * @param {string} aEventType
			 * @param {Function} aListener
			 * @public
			 */
			addEventListener: function (aEventType, aListener) {
				this.getEventTarget().addEventListener(aEventType, aListener);
			},

			/**
			 * Gets the element to which this Control is bound.
			 * @returns {HTMLElement}
			 * @public
			 */
			getElement: function () {
				console.groupCollapsed();
				console.warn("Control::getElement() has been deprecated.");
				console.trace();
				console.groupEnd();
				return this.element;
			},

			/**
			 * Called by create(), after construction.
			 * @param {object} aOptions @see ::constructor()
			 * @returns {Promise}
			 * @public
			 */
			hookup: function (aOptions) {
				this.syncToElement = this.syncToElement.bind(this);

				this.element.syncControlToElement = this.element_syncControlToElement.bind(this);

				return Promise.resolve();
			},

			/**
			 * @param aOptions
			 * @public
			 * @constructor
			 */
			constructor: function (aOptions) {
				this.element_syncControlToElement = this.element_syncControlToElement.bind(this);

				if (!aOptions.element) throw new Error(
					"The 'element' option is required."
				);

				Object.defineProperties(this, {
					/**
					 * @memberOf Control
					 * @public
					 */
					element: {
						value: aOptions.element,
					}
				});
			}
		});
		
		
		var supportsPassiveEventListeners;
		Object.defineProperty(Control, 'supportsPassiveEventListeners', {
			get: function () {
				if (supportsPassiveEventListeners === undefined) {
					// Test via a getter in the options object to see if the passive property is accessed
					try {
						var opts = Object.defineProperty({}, 'passive', {
							get: function () {
								supportsPassiveEventListeners = true;
							}
						});
						window.addEventListener("testPassive", null, opts);
						window.removeEventListener("testPassive", null, opts);
					} catch (e) {
					}
				}
				
				return supportsPassiveEventListeners;
			}
		});
		
		/**
		 * @param {Element} aPopupElement The popup/dialog element.
		 * @param {Element} aAnchorElement The element that initiated the display of the popup.
		 *   We will attempt to center the popup over this element.
		 * @protected
		 * @static
		 */
		Control.calculateAnchoredPopupFixedPosition = function (aPopupElement, aAnchorElement) {
			var viewportTop, viewportLeft, viewportRight, viewportBottom;
			var anchorTop, anchorLeft;
			var popupTop, popupLeft, popupHeight, popupWidth;
			var offset;
			
			viewportTop = 0;
			viewportLeft = 0;
			viewportRight = window.innerWidth;
			viewportBottom = window.innerHeight;
			
			anchorTop = DomUtils.offsetTop(aAnchorElement) - window.pageYOffset;
			anchorLeft = DomUtils.offsetLeft(aAnchorElement) - window.pageXOffset;
			
			popupHeight = aPopupElement.offsetHeight;
			popupWidth = aPopupElement.offsetWidth;
			
			// top
			{
				// center popup over anchor
				popupTop = anchorTop + (aAnchorElement.offsetHeight / 2) - (popupHeight / 2);
				
				// constrain popup bottom edge,  to viewport bottom edge
				offset = (popupTop + popupHeight) - viewportBottom;
				if (offset > 0) popupTop -= offset;
				
				// constrain popup top edge, to viewport top edge
				popupTop = Math.max(popupTop, viewportTop);
			}
			
			// left
			{
				// center popup over anchor
				popupLeft = anchorLeft + (aAnchorElement.offsetWidth / 2) - (popupWidth / 2);
				
				// constrain popup right edge,  to viewport right edge
				offset = (popupLeft + popupWidth) - viewportRight;
				if (offset > 0) popupLeft -= offset;
				
				// constrain popup left edge, to viewport left edge
				popupLeft = Math.max(viewportLeft, popupLeft);
			}
			
			return {
				top: popupTop,
				left: popupLeft,
			};
		};
		
		/**
		 * @param {object} aOptions @see ::constructor()
		 * @returns {Promise.<Solarfield.Controls.Control>}
		 * @public
		 * @static
		 */
		Control.create = function (aOptions) {
			return new Promise(function (resolve) {
				//create an instance of the control subclass
				resolve(new this(aOptions));
			}.bind(this))
			.then(function (control) {
				//call the control's hookup() method, and then resolve with the control instance
				return control.hookup(aOptions)
				.then(function () {
					return control;
				});
			});
		};

		return Control;
	}
);
