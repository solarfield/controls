define(
	[
		'module',
		'solarfield/ok-kit-js/src/Solarfield/Ok/ObjectUtils',
		'solarfield/ok-kit-js/src/Solarfield/Ok/EventTarget'
	],
	function (module, ObjectUtils, EventTarget) {
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
				var container = this.getElement();

				if (container.getAttribute('data-control-input-source') != aSource) {
					container.setAttribute('data-control-input-source', aSource);
				}
			},

			/**
			 * @param {string|null} aType
			 * @protected
			 */
			setPointerType: function (aType) {
				var container = this.getElement();

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

			/**
			 * @protected
			 */
			element_syncControlToElement: function () {

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
				return this._cfc_element;
			},

			/**
			 * Called by create(), after construction.
			 * @param {object} aOptions @see ::constructor()
			 * @returns {Promise}
			 * @public
			 */
			hookup: function (aOptions) {
				this.getElement().syncControlToElement = this.element_syncControlToElement.bind(this);

				return Promise.resolve();
			},

			/**
			 * @param aOptions
			 * @public
			 * @constructor
			 */
			constructor: function (aOptions) {
				if (!aOptions.element) throw new Error(
					"The 'element' option is required."
				);

				/**
				 * @private
				 */
				this._cfc_element = aOptions.element;
			}
		});

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
