// @ts-check

// textpopup and hebrew keyboard widgets
// Version: 2.2.3
// dependencies: jQuery UI
// Copyright (c) 2015 Daniel Wachsstock
// MIT license:
// Permission is hereby granted, free of charge, to any person
// obtaining a copy of this software and associated documentation
// files (the "Software"), to deal in the Software without
// restriction, including without limitation the rights to use,
// copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following
// conditions:

// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
// OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
// HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
// WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
// OTHER DEALINGS IN THE SOFTWARE.

(function ($) {
	$.widget('bililite.textpopup', {
		_init: function () {
			var self = this;

			if (this.options.box) this.options.hideOnOutsideClick = false;

			this._hideOnOutsideClick(this.options.hideOnOutsideClick);

			// trigger element setup
			var trigger = this.options.trigger;
			if (trigger == 'self') trigger = this.element;

			if (this._triggerElement)
				$(trigger).off('.textpopup');

			if (trigger) {
				this._triggerElement = $(trigger);
				this._triggerElement
					.filter(":focusable")
					.on('focus.textpopup', self.show.bind(self));

				this._triggerElement
					.filter(":not(:focusable)")
					.on('click.textpopup', self.show.bind(self));
			}
		},

		// CSS‑transition‑friendly positioning
		position: function () {
			if (this.options.box) return;

			const box = this._box()[0];
			const anchor = this.element.closest('.card')[0];

			const rect = anchor.getBoundingClientRect();
			const x = rect.left + window.scrollX;
			const y = rect.bottom + window.scrollY;

			// CSS transitions animate left/top smoothly
			box.style.left = x + 'px';
			box.style.top = y + 'px';
		},

		show: function () {
			const $box = this._box().attr('tabindex', 0);

			if ($box.hasClass('visible')) return;

			// Must be visible for CSS transitions to work
			$box.css('display', 'block');

			this.position();

			// Trigger CSS fade/slide
			requestAnimationFrame(() => {
				$box.addClass('visible');
			});

			this._trigger('shown');
		},

		hide: function () {
			const $box = this._box().removeAttr('tabindex');

			if (!$box.hasClass('visible')) return;

			// Start fade-out
			$box.removeClass('visible');

			// After transition, hide it
			$box.one('transitionend', () => {
				if (!$box.hasClass('visible')) {
					$box.css('display', 'none');
				}
			});

			this._trigger('hidden');
		},

		_box: function () {
			return this.theBox || this._createBox();
		},

		widget: function () {
			return this._box();
		},

		_createBox: function () {
			var self = this;
			let box;

			if (this.options.box) {
				box = $(this.options.box);
			} else {
				const boxElem = document.createElement("div");
				boxElem.style.position = "absolute";
				boxElem.style.display = "none";
				document.body.appendChild(boxElem);
				box = $(boxElem);
			}

			box
				.addClass(this.options['class'])
				.on("keydown", function (e) {
					if (e.key === "Escape") {
						self.element.trigger("focus");
						if (self.options.hideOnOutsideClick) self.hide();
					}
				});

			this.theBox = box;
			box.data('textpopup', this);

			this._fill(box);
			this._trigger('create', 0, box);

			return box;
		},

		_fill: function (box) {
			// virtual method
		},

		_hideOnOutsideClick: function (flag) {
			var self = this;
			this._hider = this._hider || function (e) {
				if (!self._isClickInside(e)) self.hide();
			};

			if (flag) {
				document.body.addEventListener("click", this._hider);
			} else {
				document.body.removeEventListener("click", this._hider);
			}
		},

		destroy: function () {
			if (!this.options.box) this._box().remove();
			if (this._triggerElement) this._triggerElement.off('.textpopup');
			$('body').off('.textpopup');
			this.theBox = undefined;
		},

		_setOption: function (key, value) {
			this._super(key, value);
			if (key == 'class') this._box().attr('class', value);
		},

		_isClickInside: function(e){
			const box = this._box()[0];
			const trigger = this._triggerElement ? this._triggerElement[0] : null;
			const input = this.element[0];
		
			return (
				box.contains(e.target) ||
				(trigger && trigger.contains(e.target)) ||
				input.contains(e.target)
			);
		},

		options: {
			box: undefined,
			show: function () { this.style.display = 'block'; },
			hide: function () { this.style.display = 'none'; },
			hideOnOutsideClick: true,
			trigger: 'self',
			'class': 'ui-textpopup-box'
		}
	});
})(jQuery);
